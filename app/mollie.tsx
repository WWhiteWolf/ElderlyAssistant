import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    AppState,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeControl from '../components/DateTimeControl';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';
import { runDailyReset, runScheduler } from '../scheduler/scheduler';
import { warnIfFull } from '../scheduler/warn';

interface FeedItem {
    id: string;
    label: string;
    // #3-new: null = no time set — the item shows no time and gets no reminder.
    hour: number | null;
    minute: number | null;
    completed: boolean;
    // #10-new: the moment a snoozed feed is to be reminded about again. The
    // scheduler reads this back and puts the reminder on the phone, so a
    // snooze is written down rather than fired and forgotten. The row shows
    // it as "Snoozed till: 4:15 PM". My Day's twin.
    snoozedUntil?: number;
}

interface HistoryEntry {
    id: string;
    date: string;
    actual: string;
    sched: string;
    what?: string;
    note?: string;
}

const INITIAL_FEEDS: FeedItem[] = [
    { id: 'f1', label: 'Morning Feed', hour: 7, minute: 0, completed: false },
    { id: 'f2', label: 'Evening Feed', hour: 17, minute: 0, completed: false },
];

export default function PetsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [feeds, setFeeds] = useState<FeedItem[]>(INITIAL_FEEDS);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [treatCount, setTreatCount] = useState(0);
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    // True while the shared control's typed time box holds a real time;
    // Save is blocked with a warning while false (#61, Look Ahead's pattern).
    const [pendingTimeValid, setPendingTimeValid] = useState(true);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');
    const [snoozeItemId, setSnoozeItemId] = useState<string | null>(null);

    useEffect(() => {
        const setup = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please enable notifications in settings.');
            }
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
            await loadData();
        };
        setup();
    }, []);

    // Re-read storage when the screen regains focus — arriving here from
    // elsewhere in the app — and when the app returns to the front, which is
    // the usual case after a banner Done, since this screen may never lose
    // focus at all while the banner is tapped.
    useFocusEffect(
        useCallback(() => {
            refreshFromStorage();
            const sub = AppState.addEventListener('change', (state) => {
                if (state === 'active') refreshFromStorage();
            });
            return () => sub.remove();
        }, [])
    );

    // Read the saved lists back into the screen. Called on mount, and again
    // whenever the screen regains focus or the app returns to the front — so a
    // Done tapped on a banner, which _layout.tsx writes straight to storage,
    // shows up here instead of being overwritten by this screen's stale
    // in-memory copy the next time anything is saved.
    // It deliberately does NOT rebuild the reminders; the module owns those.
    // Nor does it roll the day over any more — that moved into the module at
    // plan step 7, so the checkmarks clear whether or not this screen is
    // opened. It is asked to run first all the same, because it costs two reads
    // on a day already rolled over and it means this screen can never draw
    // yesterday's checkmarks while waiting for the module's own run.
    const refreshFromStorage = async () => {
        try {
            await runDailyReset();
            // One-time cleanup: remove the orphaned legacy key from the old
            // multi-pet storage (no longer read anywhere). No-op if absent.
            await AsyncStorage.removeItem('pets_data');
            const savedHist = await AsyncStorage.getItem('pets_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
            const savedFeeds = await AsyncStorage.getItem('pets_feeds');
            const parsedFeeds: FeedItem[] = savedFeeds ? JSON.parse(savedFeeds) : INITIAL_FEEDS;
            const savedTreats = await AsyncStorage.getItem('pets_treats');
            setFeeds(parsedFeeds);
            setTreatCount(savedTreats ? parseInt(savedTreats, 10) : 0);
        } catch (e) {
            console.error(e);
        }
    };

    // Mount-time load: read storage. The reminders are not this screen's job
    // any more — the scheduler module owns them, and the housing runs it on
    // launch and on every return to the front (#7-new, plan step 2).
    const loadData = async () => {
        await refreshFromStorage();
    };

    const saveData = async (f: FeedItem[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('pets_feeds', JSON.stringify(f));
        await AsyncStorage.setItem('pets_history', JSON.stringify(h));
        // The saved list has changed, so let the module work the whole answer
        // out again. It reads storage itself, matches by key, and touches only
        // what actually differs. If it could not hold everything the lists
        // asked for, the warning speaks here and nowhere else (plan step 6).
        warnIfFull(await runScheduler());
    };

    const format12Hour = (h: number, m: number) => {
        const period = h < 12 ? 'AM' : 'PM';
        let hr = h % 12;
        if (hr === 0) hr = 12;
        return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
    };

    // #2-new: one-tap Log — no notes modal (mirrors My Day). A note is
    // added afterward, if wanted, through the Pets Log's tap-to-edit modal.
    const logItem = (id: string) => {
        const item = feeds.find(f => f.id === id);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: now,
            what: '',
            note: '',
        };
        // Logging the feed drops any snooze on it — the thing is done, so
        // nothing should nag about it again today. The stamp coming off is all
        // it takes; the module reads the feed afresh and takes the reminder
        // back off the phone.
        const updatedFeeds = feeds.map(f => {
            if (f.id !== id) return f;
            const { snoozedUntil, ...rest } = f;
            return { ...rest, completed: true };
        });
        const updatedHist = [newEntry, ...history].slice(0, 50);
        setFeeds(updatedFeeds);
        setHistory(updatedHist);
        saveData(updatedFeeds, updatedHist);
    };

    // Un-check (Patrick, #42, mirrors My Week's undoDone): tapping the ✓ asks,
    // then clears only the checkmark. The existing log entry stays untouched —
    // logging it again later adds a fresh entry. saveData re-runs the reminder
    // scheduling, so the un-checked item's daily reminder is armed again.
    const undoDone = (id: string) => {
        const item = feeds.find(f => f.id === id);
        if (!item) return;
        Alert.alert('Un-check Item', `Mark "${item.label}" as not done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark not done',
                onPress: () => {
                    const updated = feeds.map(f =>
                        f.id === id ? { ...f, completed: false } : f
                    );
                    setFeeds(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    // #2-new: one-tap count — no notes modal (same pattern as logItem).
    const confirmTreat = () => {
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Treat',
            actual: now,
            what: '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const newCount = treatCount + 1;
        setTreatCount(newCount);
        AsyncStorage.setItem('pets_treats', String(newCount));
        setHistory(updatedHist);
        saveData(feeds, updatedHist);
    };

    // On-page Snooze: write the moment down on the feed, N minutes from now.
    //
    // Nothing is armed here. The stamp on the feed IS the snooze: the scheduler
    // reads it back and puts the reminder on the phone, so a snooze made on the
    // page and one made from a banner are the same act written the same way. A
    // prior snooze needs no cancelling — one stamp per feed means one wanted
    // reminder under one name, which the module moves rather than duplicates,
    // so tapping Snooze twice can no longer leave two reminders behind. The
    // feed's own daily repeat is left alone.
    const snoozeItem = (minutes: number) => {
        if (!snoozeItemId) return;
        const item = feeds.find(f => f.id === snoozeItemId);
        if (!item) { setSnoozeItemId(null); return; }
        const target = Date.now() + minutes * 60 * 1000;
        const updated = feeds.map(f =>
            f.id === item.id ? { ...f, snoozedUntil: target } : f
        );
        setFeeds(updated);
        saveData(updated, history);
        setSnoozeItemId(null);
        Alert.alert('Snoozed', `${item.label} reminder set for ${minutes} minutes from now.`);
    };

    const addEntry = () => {
        setActiveId(null);
        setTempName('');
        // #3-new: a new item starts with no time — the control opens asleep.
        setPendingTime(null);
        setPendingTimeValid(true);
        setShowEditModal(true);
    };

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = feeds.filter(f => f.id !== id);
                    setFeeds(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    const toggleSelect = (id: string) => {
        if (selectedItemId === id) {
            setSelectedItemId(null);
        } else {
            setSelectedItemId(id);
        }
    };

    const moveItem = (direction: 'up' | 'down') => {
        if (!selectedItemId) return;
        const index = feeds.findIndex(i => i.id === selectedItemId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === feeds.length - 1) return;
        const updated = [...feeds];
        const swap = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swap]] = [updated[swap], updated[index]];
        setFeeds(updated);
        saveData(updated, history);
    };

    const saveEdit = () => {
        const name = tempName.trim();
        if (!name) {
            Alert.alert('Missing Name', 'Please enter a name.');
            return;
        }
        if (!pendingTimeValid) {
            Alert.alert('Check Time', 'The typed time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        // #3-new: no pending time means the item is saved with no time.
        const hour = pendingTime ? pendingTime.getHours() : null;
        const minute = pendingTime ? pendingTime.getMinutes() : null;
        if (activeId) {
            const updated = feeds.map(f =>
                f.id === activeId ? { ...f, label: name, hour, minute } : f
            );
            setFeeds(updated);
            saveData(updated, history);
        } else {
            const newFeed: FeedItem = {
                id: Date.now().toString(),
                label: name,
                hour,
                minute,
                completed: false,
            };
            const updated = [...feeds, newFeed];
            setFeeds(updated);
            saveData(updated, history);
        }
        setShowEditModal(false);
        setActiveId(null);
        setTempName('');
        setPendingTime(null);
    };

    const closeEdit = () => {
        setShowEditModal(false);
        setActiveId(null);
        setTempName('');
        setPendingTime(null);
    };

    const deleteHistoryEntry = (id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        saveData(feeds, updated);
    };

    const clearAllHistory = () => {
        Alert.alert(
            'Clear All',
            'Delete all log entries? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All', style: 'destructive', onPress: () => {
                        setHistory([]);
                        saveData(feeds, []);
                    },
                },
            ]
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* #62: no edges prop (default all edges), matching the seven taller-header
                pages — Patrick standardized on the taller header look. */}
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Pets 🐾</Text>
                    <TouchableOpacity onPress={addEntry} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <Bridge />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} scrollEventThrottle={16} directionalLockEnabled={true}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Routine</Text>
                    <Text style={styles.hintText}>Tap to select for reorder · Edit to change · Swipe to delete</Text>
                    {feeds.map(item => (
                        <Swipeable
                            key={item.id}
                            renderRightActions={() => (
                                <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteEntry(item.id)}>
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={[styles.row, selectedItemId === item.id && styles.rowSelected]}>
                                <TouchableOpacity
                                    style={styles.labelArea}
                                    onPress={() => toggleSelect(item.id)}
                                >
                                    <Text style={styles.itemLabel}>{item.hour !== null && item.minute !== null ? `${format12Hour(item.hour, item.minute)} ` : ''}{item.label}</Text>
                                    {item.snoozedUntil != null && item.snoozedUntil > Date.now() && (
                                        <Text style={styles.snoozedNote}>
                                            Snoozed till: {format12Hour(new Date(item.snoozedUntil).getHours(), new Date(item.snoozedUntil).getMinutes())}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                                    onPress={() => {
                                        setActiveId(item.id);
                                        setTempName(item.label);
                                        setPendingTime(item.hour !== null && item.minute !== null
                                            ? new Date(new Date().setHours(item.hour, item.minute, 0, 0))
                                            : null);
                                        setPendingTimeValid(true);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.snoozeRowBtn}
                                    onPress={() => setSnoozeItemId(item.id)}
                                >
                                    <Text style={styles.snoozeRowBtnText}>Snooze</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.logBtn, item.completed && styles.loggedBtn]}
                                    onPress={() => item.completed ? undoDone(item.id) : logItem(item.id)}
                                >
                                    <Text style={[styles.logBtnText, item.completed && styles.loggedBtnText]}>{item.completed ? '✓' : 'Log'}</Text>
                                </TouchableOpacity>
                            </View>
                        </Swipeable>
                    ))}
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Pets Log</Text>
                        {history.length > 0 && (
                            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllHistory}>
                                <Text style={styles.clearAllBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView style={styles.historyScroll} nestedScrollEnabled={true}>
                        {history.map(l => (
                            <Swipeable
                                key={l.id}
                                renderRightActions={() => (
                                    <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteHistoryEntry(l.id)}>
                                        <Text style={styles.swipeDeleteText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            >
                                <TouchableOpacity style={styles.historyItem} onPress={() => {
                                    setEditEntry(l);
                                    setEditWhat(l.what || '');
                                }}>
                                    <Text style={styles.historyText}>
                                        {l.date} | {l.actual} | {l.sched}{l.what ? ` | ${l.what}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </ScrollView>
                </View>

            </ScrollView>

            <View style={styles.counterBox}>
                <View style={styles.counterItem}>
                    <Text style={styles.counterTitle}>Treats</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity style={styles.minusBtn} onPress={() => {
                            if (treatCount > 0) {
                                const newCount = treatCount - 1;
                                setTreatCount(newCount);
                                AsyncStorage.setItem('pets_treats', String(newCount));
                            }
                        }}>
                            <Text style={styles.minusBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterCount}>{treatCount}</Text>
                        <TouchableOpacity style={styles.plusBtn} onPress={confirmTreat}>
                            <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {editEntry && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Edit Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={editWhat} onChangeText={setEditWhat} placeholder="Add a note about this entry..." placeholderTextColor={theme.mutedText} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            const updated = history.map(h =>
                                h.id === editEntry.id ? { ...h, what: editWhat } : h
                            );
                            setHistory(updated);
                            saveData(feeds, updated);
                            setEditEntry(null);
                        }}>
                            <Text style={styles.confirmBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {selectedItemId && (
                <View style={styles.arrowOverlay}>
                    <TouchableOpacity style={styles.arrowBtn} onPress={() => moveItem('up')}>
                        <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.arrowBtn} onPress={() => moveItem('down')}>
                        <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                </View>
            )}

            {snoozeItemId && (
                <Modal transparent={true} animationType="fade" visible={!!snoozeItemId}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>Snooze Reminder</Text>
                            <Text style={styles.inputLabel}>
                                {feeds.find(f => f.id === snoozeItemId)?.label} — remind me again in:
                            </Text>
                            <View style={styles.snoozeOptionRow}>
                                <TouchableOpacity style={styles.snoozeOption} onPress={() => snoozeItem(15)}>
                                    <Text style={styles.snoozeOptionText}>15 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.snoozeOption} onPress={() => snoozeItem(30)}>
                                    <Text style={styles.snoozeOptionText}>30 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.snoozeOption} onPress={() => snoozeItem(60)}>
                                    <Text style={styles.snoozeOptionText}>60 min</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSnoozeItemId(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {showEditModal && (
                <Modal transparent={true} animationType="fade" visible={showEditModal}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>{activeId ? 'Edit Entry' : 'New Entry'}</Text>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempName}
                                onChangeText={setTempName}
                                placeholder="e.g. Morning Feed"
                                placeholderTextColor={theme.mutedText}
                                autoFocus={!activeId}
                            />

                            {/* Shared date/time control, time-only (#61) — spinners +
                                type-in box, auto-padding, red-border bad-value hint. */}
                            <DateTimeControl
                                mode="time"
                                value={pendingTime || new Date(new Date().setHours(12, 0, 0, 0))}
                                onChange={setPendingTime}
                                timeLabel="Time"
                                onValidityChange={setPendingTimeValid}
                                optionalTime
                                timeSet={pendingTime !== null}
                                onClearTime={() => setPendingTime(null)}
                            />

                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={saveEdit}>
                                    <Text style={styles.confirmBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}

        </GestureHandlerRootView>
    );
}

// makeStyles(theme) pattern from home.tsx (#45).
const makeStyles = (t: Theme) =>
    StyleSheet.create({
    container: { flex: 1, backgroundColor: t.pageBackground },
    header: {
        paddingTop: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: '500',
        color: t.titleText,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        flex: 1,
        textAlign: 'center',
    },
    scroll: { flex: 1 },
    section: {
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 15,
        margin: 12,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: t.cardTitle,
        marginBottom: 10,
    },
    hintText: { fontSize: 11, color: t.mutedText, marginTop: 2, marginBottom: 8 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 17, color: t.bodyText, fontWeight: '500' },
    // #10-new: the line under a snoozed feed's name, in the same colour the
    // Snooze button already uses so the two read as one idea.
    snoozedNote: { fontSize: 13, color: t.delayText, fontWeight: '600', marginTop: 2 },
    logBtn: {
        backgroundColor: t.buttonPrimary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    loggedBtn: { backgroundColor: t.buttonDone },
    logBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    loggedBtnText: { color: t.buttonDoneText },
    historySection: { marginHorizontal: 12, marginBottom: 12 },
    historyScroll: {
        height: 375,
        backgroundColor: t.card,
        borderRadius: 8,
        padding: 8,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    historyItem: {
        borderBottomWidth: 0.5,
        borderBottomColor: t.progressTrack,
        paddingVertical: 6,
    },
    historyText: { fontSize: 13, color: t.bodyText, lineHeight: 18 },
    counterBox: {
        flexDirection: 'row',
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    counterItem: { flex: 1, alignItems: 'center' },
    counterTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 8 },
    counterControls: { flexDirection: 'row', alignItems: 'center' },
    counterCount: { fontSize: 22, fontWeight: 'bold', width: 40, textAlign: 'center', color: t.bodyText },
    minusBtn: {
        backgroundColor: t.counterMinus,
        width: 40, height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusBtn: {
        backgroundColor: t.bridge,
        width: 40, height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBtnText: { fontSize: 24, color: t.buttonPrimaryText, fontWeight: 'bold' },
    minusBtnText: { fontSize: 24, color: t.counterMinusText, fontWeight: 'bold' },
    modal: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        zIndex: 999,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerModal: {
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 16,
        width: '100%',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10 },
    inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4 },
    input: {
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: t.pageBackground,
        marginBottom: 10,
        color: t.bodyText,
    },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    cancelBtn: {
        backgroundColor: t.buttonNeutral,
        borderWidth: 1,
        borderColor: t.buttonNeutralBorder,
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
    confirmBtn: {
        backgroundColor: t.buttonPrimary,
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    swipeDelete: {
        backgroundColor: t.buttonDelete,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 10,
        marginBottom: 12,
    },
    swipeDeleteText: { color: t.buttonDeleteText, fontWeight: '600', fontSize: 15 },
    headerBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        borderColor: t.headerButton,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
    rowSelected: {
        backgroundColor: t.rowSelected,
        borderRadius: 8,
    },
    editBtn: {
        backgroundColor: t.pageBackground,
        borderWidth: 0.5,
        borderColor: t.pill,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    editBtnText: { color: t.pill, fontSize: 13, fontWeight: '600' },
    snoozeRowBtn: {
        backgroundColor: t.delay,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    snoozeRowBtnText: { color: t.delayText, fontSize: 13, fontWeight: '600' },
    snoozeOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    snoozeOption: {
        flex: 1,
        backgroundColor: t.delay,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    snoozeOptionText: { color: t.delayText, fontWeight: '600', fontSize: 16 },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    clearAllBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: t.mutedText,
    },
    clearAllBtnText: {
        color: t.mutedText,
        fontSize: 13,
        fontWeight: '600',
    },
    arrowOverlay: {
        position: 'absolute',
        right: 16,
        bottom: 140,
        backgroundColor: t.buttonPrimary,
        borderRadius: 12,
        padding: 8,
        gap: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 1000,
    },
    arrowBtn: {
        padding: 10,
        alignItems: 'center',
    },
    arrowText: {
        color: t.buttonPrimaryText,
        fontSize: 22,
        fontWeight: '600',
    },
});
