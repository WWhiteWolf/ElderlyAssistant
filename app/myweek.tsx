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
import { Colors } from '../constants/Colors';

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
                    data: { source: 'myweek', itemId: item.id, label: item.label },
                    categoryIdentifier: 'myweekactions',
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
                categoryIdentifier: 'myweekactions',
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

    const addEntry = () => {
        setActiveId(null);
        setTempName('');
        setPendingDay(new Date().getDay());
        setPendingTime(new Date(new Date().setHours(12, 0, 0, 0)));
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
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
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
                                    onPress={() => openLogModal(item.id)}
                                >
                                    <Text style={styles.logBtnText}>{item.completed ? '✓' : 'Done'}</Text>
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
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder="Add a note about this chore..." />
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
                    <TextInput style={styles.input} value={editWhat} onChangeText={setEditWhat} placeholder="Add a note about this entry..." />
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

                            <Text style={styles.inputLabel}>Time</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 10 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        const h = next.getHours();
                                        const isPM = h >= 12;
                                        let h12 = h % 12; if (h12 === 0) h12 = 12;
                                        h12 = h12 === 12 ? 1 : h12 + 1;
                                        next.setHours(isPM ? (h12 % 12) + 12 : h12 % 12);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {(() => { const h = (pendingTime || new Date(new Date().setHours(12, 0, 0, 0))).getHours(); let h12 = h % 12; if (h12 === 0) h12 = 12; return String(h12).padStart(2, '0'); })()}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        const h = next.getHours();
                                        const isPM = h >= 12;
                                        let h12 = h % 12; if (h12 === 0) h12 = 12;
                                        h12 = h12 === 1 ? 12 : h12 - 1;
                                        next.setHours(isPM ? (h12 % 12) + 12 : h12 % 12);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▼</Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: Colors.primary, fontSize: 13 }}>Hour</Text>
                                </View>

                                <Text style={styles.timeDisplayText}>:</Text>

                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        next.setMinutes((next.getMinutes() + 1) % 60);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {String((pendingTime || new Date(new Date().setHours(12, 0, 0, 0))).getMinutes()).padStart(2, '0')}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        next.setMinutes((next.getMinutes() + 59) % 60);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▼</Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: Colors.primary, fontSize: 13 }}>Minute</Text>
                                </View>

                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        next.setHours((next.getHours() + 12) % 24);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.timeDisplayText, { fontSize: 28 }]}>
                                        {(pendingTime || new Date(new Date().setHours(12, 0, 0, 0))).getHours() < 12 ? 'AM' : 'PM'}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        next.setHours((next.getHours() + 12) % 24);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▼</Text>
                                    </TouchableOpacity>
                                    <Text style={{ color: Colors.primary, fontSize: 13 }}>AM/PM</Text>
                                </View>
                            </View>

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
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingTop: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        flex: 1,
        textAlign: 'center',
    },
    bridge: { height: 8, backgroundColor: Colors.bridge },
    scroll: { flex: 1 },
    section: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 15,
        margin: 12,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 15, color: Colors.bridge, fontWeight: '500' },
    choreName: { fontSize: 17, color: Colors.primary, fontWeight: '600', marginTop: 2 },
    hintText: { fontSize: 11, color: '#aaa', marginTop: 2, marginBottom: 8 },
    logBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    loggedBtn: { backgroundColor: Colors.bridge },
    logBtnText: { color: Colors.white, fontWeight: '600' },
    postponeBtn: {
        backgroundColor: '#FF9500',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    postponeBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
    postponedLabel: { fontSize: 13, color: '#FF9500', fontWeight: '600', marginTop: 2 },
    postponeTomorrowBtn: {
        backgroundColor: '#FF9500',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 8,
    },
    postponeTomorrowText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
    historySection: { marginHorizontal: 12, marginBottom: 12 },
    historyScroll: {
        height: 385,
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: 8,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    historyItem: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingVertical: 6,
    },
    historyText: { fontSize: 13, color: Colors.text, lineHeight: 18 },
    modal: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        zIndex: 999,
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginBottom: 10 },
    inputLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
    input: {
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: Colors.background,
        marginBottom: 10,
        color: Colors.text,
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
        borderColor: Colors.lightBlue,
        backgroundColor: Colors.background,
        alignItems: 'center',
    },
    dayChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    dayChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    dayChipTextActive: { color: Colors.white },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    cancelBtn: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: { color: '#333', fontWeight: '600' },
    confirmBtn: {
        backgroundColor: Colors.primary,
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    confirmBtnText: { color: Colors.white, fontWeight: '600' },
    swipeDelete: {
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 10,
        marginBottom: 12,
    },
    swipeDeleteText: {
        color: '#fff',
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
    timeAdjBtn: {
        backgroundColor: Colors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
    },
    timeAdjText: {
        color: Colors.white,
        fontSize: 22,
        fontWeight: '600',
    },
    timeDisplayText: {
        fontSize: 40,
        fontWeight: '600',
        color: Colors.primary,
        marginVertical: 4,
    },
    pickerModal: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        width: '100%',
    },
    headerBtn: {
        borderWidth: 1,
        borderColor: Colors.white,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
    rowSelected: {
        backgroundColor: '#d6eef8',
        borderRadius: 8,
    },
    editBtn: {
        backgroundColor: Colors.background,
        borderWidth: 0.5,
        borderColor: Colors.bridge,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    editBtnText: { color: Colors.bridge, fontSize: 13, fontWeight: '600' },
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
        borderColor: '#999',
    },
    clearAllBtnText: {
        color: '#666',
        fontSize: 13,
        fontWeight: '600',
    },
    arrowOverlay: {
        position: 'absolute',
        right: 16,
        bottom: 40,
        backgroundColor: Colors.primary,
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
        color: Colors.white,
        fontSize: 22,
        fontWeight: '600',
    },
});
