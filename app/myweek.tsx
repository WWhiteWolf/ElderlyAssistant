import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
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
import { Theme, useTheme } from '../constants/Themes';

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
    // tile shows "moved to <day>" and a one-off reminder is scheduled for then.
    // The chore's home day/time never changes; this clears next cycle.
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

    // The epoch-ms of a chore's most recent past occurrence (its weekday at its
    // time, on or before now). If today IS its day but the time hasn't arrived
    // yet, the last occurrence was a week ago.
    const lastOccurrence = (day: number, hour: number, minute: number): number => {
        const now = new Date();
        const d = new Date(now);
        d.setHours(hour, minute, 0, 0);
        let diff = (now.getDay() - day + 7) % 7;
        if (diff === 0 && d.getTime() > now.getTime()) diff = 7;
        d.setDate(d.getDate() - diff);
        return d.getTime();
    };

    // Weekly reset: a chore marked Done stays ✓ only until its next scheduled
    // occurrence comes around — then it's "fresh" again. We detect that by
    // comparing when it was marked Done (doneAt) to its most recent occurrence.
    const applyWeeklyReset = (list: Chore[]): Chore[] =>
        list.map(c => {
            let next = c;
            if (next.completed && next.doneAt != null && next.doneAt < lastOccurrence(next.day, next.hour, next.minute)) {
                next = { ...next, completed: false, doneAt: undefined };
            }
            // A postpone belongs to its cycle. Once the chore's normal day comes
            // around again (its latest occurrence is newer than the postpone
            // target), last cycle's postpone is stale — drop it.
            if (next.postponedTo != null && next.postponedTo < lastOccurrence(next.day, next.hour, next.minute)) {
                next = { ...next, postponedTo: undefined };
            }
            return next;
        });

    const loadData = async () => {
        try {
            const savedChores = await AsyncStorage.getItem('week_routine');
            const parsed: Chore[] = savedChores ? JSON.parse(savedChores) : INITIAL_CHORES;
            const reset = applyWeeklyReset(parsed);
            setChores(reset);
            await AsyncStorage.setItem('week_routine', JSON.stringify(reset));
            const savedHist = await AsyncStorage.getItem('week_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
            await scheduleAllNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const saveData = async (c: Chore[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('week_routine', JSON.stringify(c));
        await AsyncStorage.setItem('week_history', JSON.stringify(h));
        await scheduleAllNotifications();
    };

    // Each chore gets ONE native WEEKLY repeating reminder on its day/time. It
    // fires once that day, then automatically returns next week and survives
    // app restarts (no reschedule-on-load needed for the base reminder — we
    // reschedule only so add/edit/delete take effect). Expo weekday is
    // 1=Sun…7=Sat, so weekday = day + 1. Postpone (stage 3) adds the only other
    // reminders. We cancel just our own (source:'myweek') so My Day / Pets /
    // To-Do reminders are untouched, and read week_routine from storage so we
    // never schedule from a stale in-memory copy.
    const scheduleAllNotifications = async () => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.source === 'myweek') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
        const raw = await AsyncStorage.getItem('week_routine');
        const items: Chore[] = raw ? JSON.parse(raw) : [];
        for (const item of items) {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Weekly Chore',
                    body: `Time for ${item.label}!`,
                    // 'routineactions' = the shared routine popup (#39):
                    // OK / Skip / Delay 15-30-60 / Done. (The banner's old
                    // "+1 Day" is gone — postpone lives on the page itself.)
                    data: { source: 'myweek', itemId: item.id, label: item.label },
                    categoryIdentifier: 'routineactions',
                    sound: 'default',
                },
                trigger: {
                    type: SchedulableTriggerInputTypes.WEEKLY,
                    weekday: item.day + 1,
                    hour: item.hour,
                    minute: item.minute,
                } as Notifications.WeeklyTriggerInput,
            });
        }
    };

    // Cancel any pending one-off Postpone reminder for a chore (tagged
    // source:'myweekpostpone'). Used before re-postponing, on Done, and on delete.
    const cancelPostpone = async (choreId: string) => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.source === 'myweekpostpone' && notif.content.data?.itemId === choreId) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
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

    // Schedule a one-off Postpone reminder for `target` (same time of day as the
    // chore), replacing any prior postpone. The chore's home day/time is left
    // untouched; we only stamp postponedTo so the tile shows "moved to <day>".
    const schedulePostpone = async (chore: Chore, target: Date) => {
        await cancelPostpone(chore.id);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Weekly Chore',
                body: `Time for ${chore.label}!`,
                data: { source: 'myweekpostpone', itemId: chore.id, label: chore.label },
                categoryIdentifier: 'routineactions',
                sound: 'default',
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: target,
            } as Notifications.DateTriggerInput,
        });
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
        cancelPostpone(pendingLogId);
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
                    cancelPostpone(id);
                    const updated = chores.filter(s => s.id !== id);
                    setChores(updated);
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
            <SafeAreaView style={{ backgroundColor: theme.header }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>My Week</Text>
                    <TouchableOpacity onPress={addEntry} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add Chore</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

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
                            <View style={[styles.row, selectedItemId === item.id && styles.rowSelected]}>
                                <TouchableOpacity
                                    style={styles.labelArea}
                                    onPress={() => toggleSelect(item.id)}
                                >
                                    <Text style={styles.itemLabel}>{DAY_NAMES[item.day]} {format12Hour(item.hour, item.minute)}</Text>
                                    <Text style={styles.choreName}>{item.label}</Text>
                                    {item.postponedTo != null && (
                                        <Text style={styles.postponedLabel}>▶ moved to {DAY_NAMES[new Date(item.postponedTo).getDay()]}</Text>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editBtn}
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
    bridge: { height: 8, backgroundColor: t.bridge },
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
        borderWidth: 1,
        borderColor: t.headerButton,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
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
