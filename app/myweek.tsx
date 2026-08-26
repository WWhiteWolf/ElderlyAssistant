import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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
import { runScheduler, runWeeklyReset } from '../scheduler/scheduler';
import { warnIfFull } from '../scheduler/warn';

// A weekly chore: a label, the day of the week it belongs to (0 = Sun … 6 = Sat),
// the time of day, and whether it's been marked Done this week.
interface Chore {
    id: string;
    label: string;
    day: number;
    hour: number;
    minute: number;
    completed: boolean;
    // Epoch ms of when the chore was last marked Done. Used by the weekly reset
    // to clear the ✓ once the chore's next scheduled occurrence has passed.
    doneAt?: number;
    // Epoch ms of a one-time Postpone target (this cycle only). When set, the
    // tile shows "moved to <day or time>" and the module puts a one-off
    // reminder on the phone for then. The chore's home day/time never changes;
    // this clears next cycle.
    //
    // A Delay tapped on the chore's banner writes this same field (#20-new). A
    // delay and a postpone are one thing at different distances, so a chore
    // carries one stamp and never two competing ones.
    postponedTo?: number;
}

interface HistoryEntry {
    id: string;
    date: string;
    sched: string;
    actual: string;
    what?: string;
    note?: string;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Starter chores so the page isn't empty on first open — Patrick can edit the
// day/time, rename, or swipe any of them away.
const INITIAL_CHORES: Chore[] = [
    { id: 'c1', label: 'Trash', day: 2, hour: 19, minute: 0, completed: false },
    { id: 'c2', label: 'Laundry', day: 6, hour: 9, minute: 0, completed: false },
    { id: 'c3', label: 'Groceries', day: 6, hour: 10, minute: 0, completed: false },
];

export default function MyWeekScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [chores, setChores] = useState<Chore[]>(INITIAL_CHORES);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [tempWhat, setTempWhat] = useState('');
    const [tempNote, setTempNote] = useState('');
    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');
    const [editNote, setEditNote] = useState('');
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    // True while the shared control's typed time box holds a real time;
    // Save is blocked with a warning while false (#61, Look Ahead's pattern).
    const [pendingTimeValid, setPendingTimeValid] = useState(true);
    const [pendingDay, setPendingDay] = useState<number>(0);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [postponeItemId, setPostponeItemId] = useState<string | null>(null);
    // #13-new: the row a tapped reminder was about. This is deliberately NOT
    // `selectedItemId` — that one is the reorder selection and brings the ▲▼
    // arrows on screen with it, which is not wanted on arrival from a banner.
    const [highlightId, setHighlightId] = useState<string | null>(null);

    // The housing hands the item's id over as `highlight` when a banner is
    // tapped. Depend on the string and not on the params object: its identity
    // changes on every redraw, which is what once put the Vault's Face ID gate
    // into a loop.
    const { highlight } = useLocalSearchParams<{ highlight?: string }>();
    useEffect(() => {
        if (typeof highlight === 'string' && highlight) setHighlightId(highlight);
    }, [highlight]);

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

    // Read the saved chores and log back into the screen. Called on mount, and
    // again whenever the screen regains focus or the app returns to the front —
    // so a Done tapped on a banner, which _layout.tsx writes straight to
    // storage, shows up here instead of being overwritten by this screen's
    // stale in-memory copy the next time anything is saved.
    // It deliberately does NOT rebuild the reminders; that is loadData's job.
    //
    // The weekly reset is asked for before the read, the way My Day and Pets
    // ask for the daily one. The arithmetic used to live on this page, which
    // meant a chore's checkmark could only be cleared by visiting this screen;
    // it now lives in the module and runs wherever the module runs. Asking for
    // it here as well costs nothing on a cycle that has not come round, and it
    // keeps this screen from ever drawing a stale checkmark while waiting for
    // the module's own run.
    const refreshFromStorage = async () => {
        try {
            await runWeeklyReset();
            const savedChores = await AsyncStorage.getItem('week_routine');
            const parsed: Chore[] = savedChores ? JSON.parse(savedChores) : INITIAL_CHORES;
            setChores(parsed);
            await AsyncStorage.setItem('week_routine', JSON.stringify(parsed));
            const savedHist = await AsyncStorage.getItem('week_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
        } catch (e) {
            console.error(e);
        }
    };

    // Mount-time load: read storage. The chores' reminders are not this
    // screen's job any more — the scheduler module owns them, and the housing
    // runs it on launch and on every return to the front (#8-new, plan step 3).
    const loadData = async () => {
        await refreshFromStorage();
    };

    const saveData = async (c: Chore[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('week_routine', JSON.stringify(c));
        await AsyncStorage.setItem('week_history', JSON.stringify(h));
        // The saved list has changed, so let the module work the whole answer
        // out again. It reads storage itself, matches by key, and touches only
        // what actually differs. If it could not hold everything the lists
        // asked for, the warning speaks here and nowhere else (plan step 6).
        warnIfFull(await runScheduler());
    };

    // The next future date whose weekday matches, at the chore's time.
    const nextDateForWeekday = (weekday: number, hour: number, minute: number): Date => {
        const now = new Date();
        const d = new Date(now);
        d.setHours(hour, minute, 0, 0);
        let diff = (weekday - now.getDay() + 7) % 7;
        if (diff === 0 && d.getTime() <= now.getTime()) diff = 7;
        d.setDate(d.getDate() + diff);
        return d;
    };

    // Postpone this cycle's reminder to `target`. Nothing is armed here: the
    // stamp IS the postpone, and the save asks the module to work the whole set
    // out again, which puts the reminder on the phone. A prior postpone needs no
    // cancelling either — one stamp per chore, so the module sees one wanted
    // reminder under one name and moves it. The chore's home day and time are
    // left untouched, and the tile reads the same stamp to show "moved to <day>".
    const schedulePostpone = async (chore: Chore, target: Date) => {
        const updated = chores.map(c =>
            c.id === chore.id ? { ...c, postponedTo: target.getTime() } : c
        );
        setChores(updated);
        saveData(updated, history);
        setPostponeItemId(null);
    };

    // "Tomorrow": push one day past the current target (the existing postpone if
    // it's still ahead, otherwise today), keeping the chore's time.
    const postponeTomorrow = () => {
        const chore = chores.find(c => c.id === postponeItemId);
        if (!chore) { setPostponeItemId(null); return; }
        const base = chore.postponedTo && chore.postponedTo > Date.now()
            ? new Date(chore.postponedTo)
            : new Date();
        base.setDate(base.getDate() + 1);
        base.setHours(chore.hour, chore.minute, 0, 0);
        schedulePostpone(chore, base);
    };

    const postponeToDay = (weekday: number) => {
        const chore = chores.find(c => c.id === postponeItemId);
        if (!chore) { setPostponeItemId(null); return; }
        const target = nextDateForWeekday(weekday, chore.hour, chore.minute);
        schedulePostpone(chore, target);
    };

    const format12Hour = (h: number, m: number) => {
        const period = h < 12 ? 'AM' : 'PM';
        let hr = h % 12;
        if (hr === 0) hr = 12;
        return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
    };

    // What the tile says a postponed chore was moved to.
    //
    // A postpone made on this page lands on another day and keeps the chore's
    // own time, so the day is what moved. A Delay tapped on a banner lands
    // later the same day and changes the time, so the time is what moved. The
    // line shows whichever part actually changed, because naming today's
    // weekday after a fifteen-minute delay is true and tells nothing.
    const movedToText = (stamp: number) => {
        const when = new Date(stamp);
        const today = new Date();
        const sameDay =
            when.getFullYear() === today.getFullYear() &&
            when.getMonth() === today.getMonth() &&
            when.getDate() === today.getDate();
        return sameDay
            ? format12Hour(when.getHours(), when.getMinutes())
            : DAY_NAMES[when.getDay()];
    };

    const openLogModal = (id: string) => {
        setPendingLogId(id);
        setTempWhat('');
        setTempNote('');
        setShowLogModal(true);
    };

    const confirmLog = () => {
        if (!pendingLogId) return;
        const item = chores.find(i => i.id === pendingLogId);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
        });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: now,
            what: tempWhat || '',
            note: tempNote || '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const updatedChores = chores.map(s =>
            s.id === pendingLogId ? { ...s, completed: true, doneAt: Date.now(), postponedTo: undefined } : s
        );
        // The postpone stamp is cleared above, so the save takes its reminder
        // off the phone; nothing has to be cancelled by hand.
        setChores(updatedChores);
        setHistory(updatedHist);
        saveData(updatedChores, updatedHist);
        setShowLogModal(false);
        setPendingLogId(null);
    };

    // Un-done / reset: clear the ✓ so a chore goes active again before its next
    // scheduled day (e.g. out of food, need clean pants). Only the checkmark is
    // cleared — the weekly reminder and the existing log entry are left alone, so
    // when the chore is actually done again it logs a fresh entry.
    const undoDone = (id: string) => {
        const item = chores.find(i => i.id === id);
        if (!item) return;
        Alert.alert('Reactivate Chore', `Mark "${item.label}" as not done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark not done',
                onPress: () => {
                    const updated = chores.map(s =>
                        s.id === id ? { ...s, completed: false, doneAt: undefined } : s
                    );
                    setChores(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    const addEntry = () => {
        setActiveId(null);
        setTempName('');
        setPendingDay(new Date().getDay());
        setPendingTime(new Date(new Date().setHours(12, 0, 0, 0)));
        setPendingTimeValid(true);
        setShowEditModal(true);
    };

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this chore from My Week?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    // A deleted chore wants nothing, its postpone included, so
                    // the save clears both off the phone.
                    const updated = chores.filter(s => s.id !== id);
                    setChores(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    const toggleSelect = (id: string) => {
        // #13-new: a row lit by a tapped reminder is put out by a tap, and that
        // tap does nothing else — no reorder selection, so no arrows appear as
        // the highlight goes (Patrick). The next tap on it selects for reorder
        // in the ordinary way.
        if (highlightId === id) {
            setHighlightId(null);
            return;
        }
        if (selectedItemId === id) {
            setSelectedItemId(null);
        } else {
            setSelectedItemId(id);
        }
    };

    const moveItem = (direction: 'up' | 'down') => {
        if (!selectedItemId) return;
        const index = chores.findIndex(i => i.id === selectedItemId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === chores.length - 1) return;
        const updated = [...chores];
        const swap = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swap]] = [updated[swap], updated[index]];
        setChores(updated);
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
        const hour = pendingTime ? pendingTime.getHours() : 12;
        const minute = pendingTime ? pendingTime.getMinutes() : 0;
        if (activeId) {
            const updated = chores.map(s => s.id === activeId ? { ...s, label: name, day: pendingDay, hour, minute } : s);
            setChores(updated);
            saveData(updated, history);
        } else {
            const newItem: Chore = {
                id: Date.now().toString(),
                label: name,
                day: pendingDay,
                hour,
                minute,
                completed: false,
            };
            const updated = [...chores, newItem];
            setChores(updated);
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
        saveData(chores, updated);
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
                        saveData(chores, []);
                    },
                },
            ]
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>My Week</Text>
                    <TouchableOpacity onPress={addEntry} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <Bridge />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} scrollEventThrottle={16} directionalLockEnabled={true}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Weekly Chores</Text>
                    <Text style={styles.hintText}>Tap to select for reorder · Edit to change day/time · Swipe to delete</Text>
                    {chores.map(item => (
                        <Swipeable
                            key={item.id}
                            renderRightActions={() => (
                                <TouchableOpacity
                                    style={styles.swipeDelete}
                                    onPress={() => deleteEntry(item.id)}
                                >
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={[styles.row, selectedItemId === item.id && styles.rowSelected, highlightId === item.id && styles.rowHighlighted]}>
                                <TouchableOpacity
                                    style={styles.labelArea}
                                    onPress={() => toggleSelect(item.id)}
                                >
                                    <Text style={styles.itemLabel}>{DAY_NAMES[item.day]} {format12Hour(item.hour, item.minute)}</Text>
                                    <Text style={styles.choreName}>{item.label}</Text>
                                    {item.postponedTo != null && (
                                        <Text style={styles.postponedLabel}>▶ moved to {movedToText(item.postponedTo)}</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
                                    onPress={() => {
                                        setActiveId(item.id);
                                        setTempName(item.label);
                                        setPendingDay(item.day);
                                        setPendingTime(new Date(new Date().setHours(item.hour, item.minute, 0, 0)));
                                        setPendingTimeValid(true);
                                        setShowEditModal(true);
                                    }}
                                >
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.postponeBtn}
                                    onPress={() => setPostponeItemId(item.id)}
                                >
                                    <Text style={styles.postponeBtnText}>Postpone</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.logBtn, item.completed && styles.loggedBtn]}
                                    onPress={() => item.completed ? undoDone(item.id) : openLogModal(item.id)}
                                >
                                    <Text style={[styles.logBtnText, item.completed && styles.loggedBtnText]}>{item.completed ? '✓' : 'Done'}</Text>
                                </TouchableOpacity>
                            </View>
                        </Swipeable>
                    ))}
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>My Log</Text>
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
                                    setEditNote(l.note || '');
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

            {showLogModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Mark Done</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder="Add a note about this chore..." placeholderTextColor={theme.mutedText} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmLog}>
                            <Text style={styles.confirmBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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
                                h.id === editEntry.id ? { ...h, what: editWhat, note: editNote } : h
                            );
                            setHistory(updated);
                            saveData(chores, updated);
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

            {postponeItemId && (
                <Modal transparent={true} animationType="fade" visible={!!postponeItemId}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>Postpone Chore</Text>
                            <Text style={styles.inputLabel}>
                                {chores.find(c => c.id === postponeItemId)?.label} — remind me instead on:
                            </Text>
                            <TouchableOpacity style={styles.postponeTomorrowBtn} onPress={postponeTomorrow}>
                                <Text style={styles.postponeTomorrowText}>Tomorrow (+1 day)</Text>
                            </TouchableOpacity>
                            <Text style={[styles.inputLabel, { marginTop: 6 }]}>…or pick a day:</Text>
                            <View style={styles.dayRow}>
                                {DAY_NAMES.map((d, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.dayChip}
                                        onPress={() => postponeToDay(i)}
                                    >
                                        <Text style={styles.dayChipText}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setPostponeItemId(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {showEditModal && (
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showEditModal}
                >
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>
                                {activeId ? 'Edit Chore' : 'New Chore'}
                            </Text>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempName}
                                onChangeText={setTempName}
                                placeholder="e.g. Trash, Laundry, Groceries"
                                placeholderTextColor={theme.mutedText}
                                autoFocus={!activeId}
                            />

                            <Text style={styles.inputLabel}>Day</Text>
                            <View style={styles.dayRow}>
                                {DAY_NAMES.map((d, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={[styles.dayChip, pendingDay === i && styles.dayChipActive]}
                                        onPress={() => setPendingDay(i)}
                                    >
                                        <Text style={[styles.dayChipText, pendingDay === i && styles.dayChipTextActive]}>{d}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Shared date/time control, time-only (#61) — spinners +
                                type-in box, auto-padding, red-border bad-value hint. */}
                            <DateTimeControl
                                mode="time"
                                value={pendingTime || new Date(new Date().setHours(12, 0, 0, 0))}
                                onChange={setPendingTime}
                                timeLabel="Time"
                                onValidityChange={setPendingTimeValid}
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
        paddingHorizontal: 20,
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
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        // #13-new: the space for the highlight's outline is held open on every
        // row, so a row does not shift when it lights up and back when it goes
        // out. Invisible until `rowHighlighted` gives it a colour.
        borderWidth: 2,
        borderColor: 'transparent',
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 15, color: t.pill, fontWeight: '500' },
    choreName: { fontSize: 17, color: t.bodyText, fontWeight: '600', marginTop: 2 },
    hintText: { fontSize: 11, color: t.mutedText, marginTop: 2, marginBottom: 8 },
    logBtn: {
        backgroundColor: t.buttonPrimary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    loggedBtn: { backgroundColor: t.buttonDone },
    logBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    loggedBtnText: { color: t.buttonDoneText },
    postponeBtn: {
        backgroundColor: t.delay,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    postponeBtnText: { color: t.delayText, fontSize: 13, fontWeight: '600' },
    postponedLabel: { fontSize: 13, color: t.delay, fontWeight: '600', marginTop: 2 },
    postponeTomorrowBtn: {
        backgroundColor: t.delay,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 8,
    },
    postponeTomorrowText: { color: t.delayText, fontWeight: '600', fontSize: 16 },
    historySection: { marginHorizontal: 12, marginBottom: 12 },
    historyScroll: {
        height: 385,
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
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        gap: 4,
    },
    dayChip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        backgroundColor: t.pageBackground,
        alignItems: 'center',
    },
    dayChipActive: {
        backgroundColor: t.buttonPrimary,
        borderColor: t.buttonPrimary,
    },
    dayChipText: { fontSize: 13, color: t.bodyText, fontWeight: '600' },
    dayChipTextActive: { color: t.buttonPrimaryText },
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
    swipeDeleteText: {
        color: t.buttonDeleteText,
        fontWeight: '600',
        fontSize: 15,
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
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        width: '100%',
    },
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
    // #13-new: the row a tapped reminder was about. An outline only, in the
    // theme's own `rowReminderBorder`, used by nothing but this. It
    // deliberately does NOT take the reorder selection's filled background
    // (Patrick): if it did, the two lit states would differ by a thin line
    // alone, which is the hardest difference to catch at a glance. This way
    // they are different things — reorder fills the row, a reminder outlines it.
    rowHighlighted: {
        borderRadius: 8,
        borderColor: t.rowReminderBorder,
    },
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
        bottom: 40,
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
