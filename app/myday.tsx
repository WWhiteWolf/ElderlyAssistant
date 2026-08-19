import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
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
import * as AppGroup from '../modules/app-group';

interface ScheduleItem {
    id: string;
    label: string;
    // #3-new: null = no time set — the item shows no time and gets no reminder.
    hour: number | null;
    minute: number | null;
    completed: boolean;
}

interface HistoryEntry {
    id: string;
    date: string;
    sched: string;
    actual: string;
    what?: string;
    note?: string;
}

// Kept only as fallbacks for the one-time migration into the merged Routine list.
const INITIAL_MEALS: ScheduleItem[] = [
    { id: '1', label: 'Breakfast', hour: 8, minute: 0, completed: false },
    { id: '2', label: 'Lunch', hour: 12, minute: 0, completed: false },
    { id: '3', label: 'Snack', hour: 15, minute: 0, completed: false },
    { id: '4', label: 'Dinner', hour: 18, minute: 0, completed: false },
];
const INITIAL_MEDS: ScheduleItem[] = [
    { id: 'med1', label: 'Morning Medication', hour: 8, minute: 0, completed: false },
];
const INITIAL_ROUTINE: ScheduleItem[] = [...INITIAL_MEALS, ...INITIAL_MEDS];

export default function MyDayScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [routine, setRoutine] = useState<ScheduleItem[]>(INITIAL_ROUTINE);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [coffeeCount, setCoffeeCount] = useState(0);
    const [editWhat, setEditWhat] = useState('');
    const [editNote, setEditNote] = useState('');
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    // True while the shared control's typed time box holds a real time;
    // Save is blocked with a warning while false (#61, Look Ahead's pattern).
    const [pendingTimeValid, setPendingTimeValid] = useState(true);
    const [waterCount, setWaterCount] = useState(0);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
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

    // Build the merged Routine list, migrating old separate keys the first time.
    const getMigratedRoutine = async (): Promise<ScheduleItem[]> => {
        const savedRoutine = await AsyncStorage.getItem('my_routine');
        if (savedRoutine) return JSON.parse(savedRoutine);
        // First run after the merge: fold the old Meals + Meds lists into one.
        const savedSched = await AsyncStorage.getItem('my_schedule');
        const savedMeds = await AsyncStorage.getItem('my_meds');
        const oldMeals: ScheduleItem[] = savedSched ? JSON.parse(savedSched) : INITIAL_MEALS;
        const oldMeds: ScheduleItem[] = savedMeds ? JSON.parse(savedMeds) : INITIAL_MEDS;
        const merged = [...oldMeals, ...oldMeds];
        await AsyncStorage.setItem('my_routine', JSON.stringify(merged));
        return merged;
    };

    // Read the saved lists back into the screen. Called on mount, and again
    // whenever the screen regains focus or the app returns to the front — so a
    // Done tapped on a banner, which _layout.tsx writes straight to storage,
    // shows up here instead of being overwritten by this screen's stale
    // in-memory copy the next time anything is saved.
    // It deliberately does NOT rebuild the reminders; that is loadData's job.
    // The one exception is the day-change branch below, which resets yesterday's
    // checkmarks and does re-arm them, because a fresh day genuinely needs it.
    const refreshFromStorage = async () => {
        try {
            const savedDate = await AsyncStorage.getItem('my_last_date');
            const today = new Date().toLocaleDateString();
            const savedHist = await AsyncStorage.getItem('my_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
            const parsedRoutine = await getMigratedRoutine();
            const savedCoffee = await AsyncStorage.getItem('my_coffee');
            const savedWater = await AsyncStorage.getItem('my_water');
            if (savedDate !== today) {
                const resetRoutine = parsedRoutine.map((s: ScheduleItem) => ({ ...s, completed: false }));
                setRoutine(resetRoutine);
                setCoffeeCount(0);
                setWaterCount(0);
                await AsyncStorage.setItem('my_last_date', today);
                await AsyncStorage.setItem('my_coffee', '0');
                await AsyncStorage.setItem('my_water', '0');
                await saveData(resetRoutine, savedHist ? JSON.parse(savedHist) : []);
            } else {
                setRoutine(parsedRoutine);
                setCoffeeCount(savedCoffee ? parseInt(savedCoffee, 10) : 0);
                setWaterCount(savedWater ? parseInt(savedWater, 10) : 0);
                // Same-day load doesn't go through saveData, so publish here too
                // to keep Siri's live item list fresh.
                AppGroup.setMyDayItems(parsedRoutine.map(i => ({ id: i.id, label: i.label })));
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Mount-time load: read storage, then arm this screen's reminders.
    const loadData = async () => {
        await refreshFromStorage();
        try {
            await scheduleAllNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const saveData = async (r: ScheduleItem[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('my_routine', JSON.stringify(r));
        await AsyncStorage.setItem('my_history', JSON.stringify(h));
        // Publish the current items to the shared App Group box so Siri can offer
        // them by voice (live list). Only id + label are needed on the Siri side.
        AppGroup.setMyDayItems(r.map(i => ({ id: i.id, label: i.label })));
        await scheduleAllNotifications();
    };

    const scheduleAllNotifications = async () => {
        // Cancel only My Day's own notifications (tagged source: 'myday'),
        // leaving To-Do and Timer reminders untouched.
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.source === 'myday') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
        // Read the saved Routine list from storage (source of truth) so we never
        // schedule from a stale in-memory copy of state.
        const items = await getMigratedRoutine();
        for (const item of items) {
            // #3-new: an item with no time set gets no reminder.
            if (!item.completed && item.hour !== null && item.minute !== null) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Daily Routine',
                        body: `Time for ${item.label}!`,
                        // Carry the item id + label so a Snooze button tap can
                        // reschedule just this item; category adds the buttons.
                        // 'routineactions' = the shared routine popup (#39):
                        // OK / Skip / Delay 15-30-60 / Done.
                        data: { source: 'myday', itemId: item.id, label: item.label },
                        categoryIdentifier: 'routineactions',
                        sound: 'default',
                    },
                    trigger: {
                        type: SchedulableTriggerInputTypes.DAILY,
                        hour: item.hour,
                        minute: item.minute,
                    } as Notifications.DailyTriggerInput,
                });
            }
        }
    };

    const format12Hour = (h: number, m: number) => {
        const period = h < 12 ? 'AM' : 'PM';
        let hr = h % 12;
        if (hr === 0) hr = 12;
        return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
    };

    // #2-new: one-tap Log — no notes modal. A note is added afterward,
    // if wanted, through My Log's tap-to-edit modal.
    const logItem = (id: string) => {
        const item = routine.find(i => i.id === id);
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
            what: '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const updatedRoutine = routine.map(s =>
            s.id === id ? { ...s, completed: true } : s
        );
        setRoutine(updatedRoutine);
        setHistory(updatedHist);
        saveData(updatedRoutine, updatedHist);
    };

    // Un-check (Patrick, #42, mirrors My Week's undoDone): tapping the ✓ asks,
    // then clears only the checkmark. The existing log entry stays untouched —
    // logging it again later adds a fresh entry. saveData re-runs the reminder
    // scheduling, so the un-checked item's daily reminder is armed again.
    const undoDone = (id: string) => {
        const item = routine.find(i => i.id === id);
        if (!item) return;
        Alert.alert('Un-check Item', `Mark "${item.label}" as not done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark not done',
                onPress: () => {
                    const updated = routine.map(s =>
                        s.id === id ? { ...s, completed: false } : s
                    );
                    setRoutine(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    // On-page Snooze: schedule a one-off reminder for this item N minutes from
    // now, tagged 'mydaysnooze' so the daily reschedule-on-load won't wipe it.
    // Same mechanism the notification banner's Snooze buttons use.
    const snoozeItem = async (minutes: number) => {
        if (!snoozeItemId) return;
        const item = routine.find(i => i.id === snoozeItemId);
        if (!item) { setSnoozeItemId(null); return; }
        await Notifications.scheduleNotificationAsync({
            content: {
                title: 'Daily Routine',
                body: `Time for ${item.label}!`,
                data: { source: 'mydaysnooze', itemId: item.id, label: item.label },
                categoryIdentifier: 'routineactions',
                sound: 'default',
            },
            trigger: {
                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: minutes * 60,
            } as Notifications.TimeIntervalTriggerInput,
        });
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
        Alert.alert('Delete', 'Remove this entry from your routine?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = routine.filter(s => s.id !== id);
                    setRoutine(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    // #2-new: one-tap count — no notes modal (same pattern as logItem).
    const confirmCoffee = () => {
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Coffee',
            actual: now,
            what: '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const newCount = coffeeCount + 1;
        setCoffeeCount(newCount);
        AsyncStorage.setItem('my_coffee', String(newCount));
        setHistory(updatedHist);
        saveData(routine, updatedHist);
    };

    const decrementCoffee = () => {
        if (coffeeCount > 0) {
            const newCount = coffeeCount - 1;
            setCoffeeCount(newCount);
            AsyncStorage.setItem('my_coffee', String(newCount));
        }
    };

    // #2-new: one-tap count — no notes modal (same pattern as logItem).
    const confirmWater = () => {
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Water',
            actual: now,
            what: '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const newCount = waterCount + 1;
        setWaterCount(newCount);
        AsyncStorage.setItem('my_water', String(newCount));
        setHistory(updatedHist);
        saveData(routine, updatedHist);
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
        const index = routine.findIndex(i => i.id === selectedItemId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === routine.length - 1) return;
        const updated = [...routine];
        const swap = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swap]] = [updated[swap], updated[index]];
        setRoutine(updated);
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
            const updated = routine.map(s => s.id === activeId ? { ...s, label: name, hour, minute } : s);
            setRoutine(updated);
            saveData(updated, history);
        } else {
            const newItem: ScheduleItem = {
                id: Date.now().toString(),
                label: name,
                hour,
                minute,
                completed: false,
            };
            const updated = [...routine, newItem];
            setRoutine(updated);
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
        saveData(routine, updated);
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
                        saveData(routine, []);
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
                    <Text style={styles.title}>My Day</Text>
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
                    {routine.map(item => (
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
                                    <Text style={styles.itemLabel}>{item.hour !== null && item.minute !== null ? `${format12Hour(item.hour, item.minute)} ` : ''}{item.label}</Text>
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

            <View style={styles.counterBox}>
                <View style={styles.counterItem}>
                    <Text style={styles.counterTitle}>Coffee</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity style={styles.minusBtn} onPress={decrementCoffee}>
                            <Text style={styles.minusBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.coffeeCount}>{coffeeCount}</Text>
                        <TouchableOpacity style={styles.plusBtn} onPress={confirmCoffee}>
                            <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.counterDivider} />
                <View style={styles.counterItem}>
                    <Text style={styles.counterTitle}>Water</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity style={styles.minusBtn} onPress={() => {
                            if (waterCount > 0) {
                                const newCount = waterCount - 1;
                                setWaterCount(newCount);
                                AsyncStorage.setItem('my_water', String(newCount));
                            }
                        }}>
                            <Text style={styles.minusBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.coffeeCount}>{waterCount}</Text>
                        <TouchableOpacity style={styles.plusBtn} onPress={confirmWater}>
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
                                h.id === editEntry.id ? { ...h, what: editWhat, note: editNote } : h
                            );
                            setHistory(updated);
                            saveData(routine, updated);
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
                                {routine.find(i => i.id === snoozeItemId)?.label} — remind me again in:
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
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showEditModal}
                >
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>
                                {activeId ? 'Edit Entry' : 'New Entry'}
                            </Text>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempName}
                                onChangeText={setTempName}
                                placeholder="e.g. Breakfast, Morning Medication"
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
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 17, color: t.bodyText, fontWeight: '500' },
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
    coffeeCount: { fontSize: 22, fontWeight: 'bold', width: 40, textAlign: 'center', color: t.bodyText },
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
    counterItem: {
        flex: 1,
        alignItems: 'center',
    },
    counterTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: t.cardTitle,
        marginBottom: 8,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterDivider: {
        width: 1,
        height: '80%',
        backgroundColor: t.cardBorder,
        marginHorizontal: 10,
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
