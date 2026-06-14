import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
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

interface ScheduleItem {
    id: string;
    label: string;
    hour: number;
    minute: number;
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

const INITIAL_MEALS: ScheduleItem[] = [
    { id: '1', label: 'Breakfast', hour: 8, minute: 0, completed: false },
    { id: '2', label: 'Lunch', hour: 12, minute: 0, completed: false },
    { id: '3', label: 'Snack', hour: 15, minute: 0, completed: false },
    { id: '4', label: 'Dinner', hour: 18, minute: 0, completed: false },
];
const INITIAL_MEDS: ScheduleItem[] = [
    { id: 'med1', label: 'Morning Medication', hour: 8, minute: 0, completed: false },
];

export default function MyDayScreen() {
    const router = useRouter();
    const [schedule, setSchedule] = useState<ScheduleItem[]>(INITIAL_MEALS);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [tempWhat, setTempWhat] = useState('');
    const [tempNote, setTempNote] = useState('');
    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [coffeeCount, setCoffeeCount] = useState(0);
    const [showCoffeeModal, setShowCoffeeModal] = useState(false);
    const [tempCoffeeNote, setTempCoffeeNote] = useState('');
    const [editWhat, setEditWhat] = useState('');
    const [editNote, setEditNote] = useState('');
    const [meds, setMeds] = useState<ScheduleItem[]>(INITIAL_MEDS);
    const [editingMeds, setEditingMeds] = useState(false);
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    const [waterCount, setWaterCount] = useState(0);
    const [showWaterModal, setShowWaterModal] = useState(false);
    const [tempWaterNote, setTempWaterNote] = useState('');
    const [mealsExpanded, setMealsExpanded] = useState(false);
    const [medsExpanded, setMedsExpanded] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedSection, setSelectedSection] = useState<'meals' | 'meds' | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

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

    const loadData = async () => {
        try {
            const savedDate = await AsyncStorage.getItem('my_last_date');
            const today = new Date().toLocaleDateString();
            const savedSched = await AsyncStorage.getItem('my_schedule');
            const savedHist = await AsyncStorage.getItem('my_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
            const parsedSched = savedSched ? JSON.parse(savedSched) : null;
            if (savedDate !== today) {
                const resetSched = parsedSched
                    ? parsedSched.map((s: ScheduleItem) => ({ ...s, completed: false }))
                    : INITIAL_MEALS;
                setSchedule(resetSched);
                await AsyncStorage.setItem('my_last_date', today);
                await saveData(resetSched, savedHist ? JSON.parse(savedHist) : []);
            } else {
                if (parsedSched) setSchedule(parsedSched);
            }
            await loadMeds();
            await scheduleAllNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const saveData = async (s: ScheduleItem[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('my_schedule', JSON.stringify(s));
        await AsyncStorage.setItem('my_history', JSON.stringify(h));
        await scheduleAllNotifications();
    };

    const scheduleAllNotifications = async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
        for (const item of schedule) {
            if (!item.completed) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Daily Routine',
                        body: `Time for ${item.label}!`,
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
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const openLogModal = (id: string) => {
        setEditingMeds(false);
        setPendingLogId(id);
        setTempWhat('');
        setTempNote('');
        setShowLogModal(true);
    };

    const confirmLog = () => {
        if (!pendingLogId) return;
        const item = editingMeds
            ? meds.find(i => i.id === pendingLogId)
            : schedule.find(i => i.id === pendingLogId);
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
        if (editingMeds) {
            const updatedMeds = meds.map(m =>
                m.id === pendingLogId ? { ...m, completed: true } : m
            );
            setMeds(updatedMeds);
            saveMeds(updatedMeds);
        } else {
            const updatedSched = schedule.map(s =>
                s.id === pendingLogId ? { ...s, completed: true } : s
            );
            setSchedule(updatedSched);
            saveData(updatedSched, updatedHist);
        }
        setHistory(updatedHist);
        setShowLogModal(false);
        setPendingLogId(null);
    };

    const snoozeReminder = () => {
        Alert.alert(
            'Snooze Reminders',
            'How long?',
            [
                {
                    text: '15 Minutes', onPress: async () => {
                        await Notifications.cancelAllScheduledNotificationsAsync();
                        await Notifications.scheduleNotificationAsync({
                            content: { title: 'Snooze Over', body: 'Your 15 minute snooze is up!' },
                            trigger: {
                                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                                seconds: 900,
                            } as Notifications.TimeIntervalTriggerInput,
                        });
                    },
                },
                {
                    text: '30 Minutes', onPress: async () => {
                        await Notifications.cancelAllScheduledNotificationsAsync();
                        await Notifications.scheduleNotificationAsync({
                            content: { title: 'Snooze Over', body: 'Your 30 minute snooze is up!' },
                            trigger: {
                                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                                seconds: 1800,
                            } as Notifications.TimeIntervalTriggerInput,
                        });
                    },
                },
                {
                    text: '60 Minutes', onPress: async () => {
                        await Notifications.cancelAllScheduledNotificationsAsync();
                        await Notifications.scheduleNotificationAsync({
                            content: { title: 'Snooze Over', body: 'Your 60 minute snooze is up!' },
                            trigger: {
                                type: SchedulableTriggerInputTypes.TIME_INTERVAL,
                                seconds: 3600,
                            } as Notifications.TimeIntervalTriggerInput,
                        });
                    },
                },
                { text: 'Cancel', style: 'cancel' },
            ]
        );
    };

    const addMeal = () => {
        setEditingMeds(false);
        setActiveId(null);
        setTempName('');
        setPendingTime(new Date(new Date().setHours(12, 0, 0, 0)));
        setShowEditModal(true);
    };

    const deleteMeal = (id: string) => {
        Alert.alert('Delete', 'Remove this meal from your schedule?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = schedule.filter(s => s.id !== id);
                    setSchedule(updated);
                    saveData(updated, history);
                },
            },
        ]);
    };

    const addMed = () => {
        setEditingMeds(true);
        setActiveId(null);
        setTempName('');
        setPendingTime(new Date(new Date().setHours(8, 0, 0, 0)));
        setShowEditModal(true);
    };

    const deleteMed = (id: string) => {
        Alert.alert('Delete', 'Remove this medication from your schedule?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = meds.filter(m => m.id !== id);
                    setMeds(updated);
                    saveMeds(updated);
                },
            },
        ]);
    };

    const saveMeds = async (m: ScheduleItem[]) => {
        await AsyncStorage.setItem('my_meds', JSON.stringify(m));
    };

    const loadMeds = async () => {
        const saved = await AsyncStorage.getItem('my_meds');
        if (saved) setMeds(JSON.parse(saved));
    };

    const openMedLogModal = (id: string) => {
        setEditingMeds(true);
        setPendingLogId(id);
        setTempWhat('');
        setTempNote('');
        setShowLogModal(true);
    };

    const confirmMedLog = () => {
        if (!pendingLogId) return;
        const item = meds.find(i => i.id === pendingLogId);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
        });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: format12Hour(item.hour, item.minute),
            actual: now,
            what: item.label,
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const updatedMeds = meds.map(m =>
            m.id === pendingLogId ? { ...m, completed: true } : m
        );
        setHistory(updatedHist);
        setMeds(updatedMeds);
        saveData(schedule, updatedHist);
        saveMeds(updatedMeds);
        setShowLogModal(false);
        setPendingLogId(null);
    };

    const confirmCoffee = () => {
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Coffee',
            actual: now,
            what: tempCoffeeNote || '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const newCount = coffeeCount + 1;
        setCoffeeCount(newCount);
        setHistory(updatedHist);
        saveData(schedule, updatedHist);
        setShowCoffeeModal(false);
        setTempCoffeeNote('');
    };

    const decrementCoffee = () => {
        if (coffeeCount > 0) setCoffeeCount(coffeeCount - 1);
    };

    const confirmWater = () => {
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Water',
            actual: now,
            what: tempWaterNote || '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        setWaterCount(waterCount + 1);
        setHistory(updatedHist);
        saveData(schedule, updatedHist);
        setShowWaterModal(false);
        setTempWaterNote('');
    };

    const toggleSelect = (id: string, section: 'meals' | 'meds') => {
        if (selectedItemId === id && selectedSection === section) {
            setSelectedItemId(null);
            setSelectedSection(null);
        } else {
            setSelectedItemId(id);
            setSelectedSection(section);
        }
    };

    const moveItem = (direction: 'up' | 'down') => {
        if (!selectedItemId || !selectedSection) return;
        const list = selectedSection === 'meals' ? schedule : meds;
        const index = list.findIndex(i => i.id === selectedItemId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === list.length - 1) return;
        const updated = [...list];
        const swap = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swap]] = [updated[swap], updated[index]];
        if (selectedSection === 'meals') {
            setSchedule(updated);
            saveData(updated, history);
        } else {
            setMeds(updated);
            saveMeds(updated);
        }
    };

    const saveEdit = () => {
        const name = tempName.trim();
        if (!name) {
            Alert.alert('Missing Name', 'Please enter a name.');
            return;
        }
        const hour = pendingTime ? pendingTime.getHours() : 12;
        const minute = pendingTime ? pendingTime.getMinutes() : 0;
        if (editingMeds) {
            if (activeId) {
                const updated = meds.map(m => m.id === activeId ? { ...m, label: name, hour, minute } : m);
                setMeds(updated);
                saveMeds(updated);
            } else {
                const newItem: ScheduleItem = {
                    id: Date.now().toString(),
                    label: name,
                    hour,
                    minute,
                    completed: false,
                };
                const updated = [...meds, newItem];
                setMeds(updated);
                saveMeds(updated);
            }
        } else {
            if (activeId) {
                const updated = schedule.map(s => s.id === activeId ? { ...s, label: name, hour, minute } : s);
                setSchedule(updated);
                saveData(updated, history);
            } else {
                const newItem: ScheduleItem = {
                    id: Date.now().toString(),
                    label: name,
                    hour,
                    minute,
                    completed: false,
                };
                const updated = [...schedule, newItem];
                setSchedule(updated);
                saveData(updated, history);
            }
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
        saveData(schedule, updated);
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
                        saveData(schedule, []);
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
                    <Text style={styles.title}>My Day</Text>
                    <View style={styles.settingsBtn} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} scrollEventThrottle={16} directionalLockEnabled={true}>

                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setMealsExpanded(!mealsExpanded)} style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Meal Schedule</Text>
                        <Text style={styles.expandIcon}>{mealsExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Tap to select for reorder · Edit to change · Swipe to delete</Text>
                    {mealsExpanded && (
                        <>
                            {schedule.map(item => (
                                <Swipeable
                                    key={item.id}
                                    renderRightActions={() => (
                                        <TouchableOpacity
                                            style={styles.swipeDelete}
                                            onPress={() => deleteMeal(item.id)}
                                        >
                                            <Text style={styles.swipeDeleteText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                >
                                    <View style={[styles.row, selectedItemId === item.id && selectedSection === 'meals' && styles.rowSelected]}>
                                        <TouchableOpacity
                                            style={styles.labelArea}
                                            onPress={() => toggleSelect(item.id, 'meals')}
                                        >
                                            <Text style={styles.itemLabel}>{format12Hour(item.hour, item.minute)} {item.label}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.editBtn}
                                            onPress={() => {
                                                setEditingMeds(false);
                                                setActiveId(item.id);
                                                setTempName(item.label);
                                                setPendingTime(new Date(new Date().setHours(item.hour, item.minute, 0, 0)));
                                                setShowEditModal(true);
                                            }}
                                        >
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.logBtn, item.completed && styles.loggedBtn]}
                                            onPress={() => openLogModal(item.id)}
                                        >
                                            <Text style={styles.logBtnText}>{item.completed ? '✓' : 'Log'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Swipeable>
                            ))}
                            <TouchableOpacity style={styles.addBtn} onPress={addMeal}>
                                <Text style={styles.addBtnText}>+ Add Meal</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setMedsExpanded(!medsExpanded)} style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Medications</Text>
                        <Text style={styles.expandIcon}>{medsExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Tap to select for reorder · Edit to change · Swipe to delete</Text>
                    {medsExpanded && (
                        <>
                            {meds.map(item => (
                                <Swipeable
                                    key={item.id}
                                    renderRightActions={() => (
                                        <TouchableOpacity
                                            style={styles.swipeDelete}
                                            onPress={() => deleteMed(item.id)}
                                        >
                                            <Text style={styles.swipeDeleteText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                >
                                    <View style={[styles.row, selectedItemId === item.id && selectedSection === 'meds' && styles.rowSelected]}>
                                        <TouchableOpacity
                                            style={styles.labelArea}
                                            onPress={() => toggleSelect(item.id, 'meds')}
                                        >
                                            <Text style={styles.itemLabel}>{format12Hour(item.hour, item.minute)} {item.label}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.editBtn}
                                            onPress={() => {
                                                setEditingMeds(true);
                                                setActiveId(item.id);
                                                setTempName(item.label);
                                                setPendingTime(new Date(new Date().setHours(item.hour, item.minute, 0, 0)));
                                                setShowEditModal(true);
                                            }}
                                        >
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.logBtn, item.completed && styles.loggedBtn]}
                                            onPress={() => openMedLogModal(item.id)}
                                        >
                                            <Text style={styles.logBtnText}>{item.completed ? '✓' : 'Log'}</Text>
                                        </TouchableOpacity>
                                    </View>
                                </Swipeable>
                            ))}
                            <TouchableOpacity style={styles.addBtn} onPress={addMed}>
                                <Text style={styles.addBtnText}>+ Add Medication</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <TouchableOpacity style={styles.snoozeBtn} onPress={snoozeReminder}>
                    <Text style={styles.snoozeBtnText}>Snooze Reminders</Text>
                </TouchableOpacity>

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
                    <Text style={styles.modalTitle}>{editingMeds ? 'Log Medication' : 'Log Meal'}</Text>
                    <Text style={styles.inputLabel}>{editingMeds ? 'Medication:' : 'What did you eat?'}</Text>
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder={editingMeds ? 'Any notes about this medication...' : 'What did you have for this meal?'} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmLog}>
                            <Text style={styles.confirmBtnText}>Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showCoffeeModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Log Coffee</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempCoffeeNote} onChangeText={setTempCoffeeNote} placeholder="e.g. black, with cream..." autoFocus={true} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCoffeeModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmCoffee}>
                            <Text style={styles.confirmBtnText}>Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showWaterModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Log Water</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempWaterNote} onChangeText={setTempWaterNote} placeholder="e.g. glass, bottle..." autoFocus={true} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowWaterModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmWater}>
                            <Text style={styles.confirmBtnText}>Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.counterBox}>
                <View style={styles.counterItem}>
                    <Text style={styles.counterTitle}>Coffee</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity style={styles.minusBtn} onPress={decrementCoffee}>
                            <Text style={styles.counterBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.coffeeCount}>{coffeeCount}</Text>
                        <TouchableOpacity style={styles.plusBtn} onPress={() => { setTempCoffeeNote(''); setShowCoffeeModal(true); }}>
                            <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.counterDivider} />
                <View style={styles.counterItem}>
                    <Text style={styles.counterTitle}>Water</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity style={styles.minusBtn} onPress={() => {
                            if (waterCount > 0) setWaterCount(waterCount - 1);
                        }}>
                            <Text style={styles.counterBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.coffeeCount}>{waterCount}</Text>
                        <TouchableOpacity style={styles.plusBtn} onPress={() => { setTempWaterNote(''); setShowWaterModal(true); }}>
                            <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {editEntry && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Edit Log Entry</Text>
                    <Text style={styles.inputLabel}>What did you eat?</Text>
                    <TextInput style={styles.input} value={editWhat} onChangeText={setEditWhat} placeholder="e.g. Oatmeal, toast..." />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            const updated = history.map(h =>
                                h.id === editEntry.id ? { ...h, what: editWhat, note: editNote } : h
                            );
                            setHistory(updated);
                            saveData(schedule, updated);
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

            {showEditModal && (
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showEditModal}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>
                                {activeId
                                    ? (editingMeds ? 'Edit Medication' : 'Edit Meal')
                                    : (editingMeds ? 'New Medication' : 'New Meal')}
                            </Text>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempName}
                                onChangeText={setTempName}
                                placeholder={editingMeds ? 'e.g. Morning Vitamins' : 'e.g. Breakfast'}
                                autoFocus={!activeId}
                            />

                            <Text style={styles.inputLabel}>Time</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 10 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        next.setHours((next.getHours() + 1) % 24);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {String((pendingTime || new Date(new Date().setHours(12, 0, 0, 0))).getHours()).padStart(2, '0')}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(12, 0, 0, 0));
                                        const next = new Date(current);
                                        next.setHours((next.getHours() + 23) % 24);
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
    backBtn: { width: 70 },
    settingsBtn: { width: 70, alignItems: 'flex-end' },
    settingsBtnText: { fontSize: 22 },
    backText: { color: Colors.lightBlue, fontSize: 16 },
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
    itemLabel: { fontSize: 17, color: Colors.primary, fontWeight: '500' },
    timeText: { fontSize: 15, color: Colors.bridge, marginTop: 2 },
    hintText: { fontSize: 11, color: '#aaa', marginTop: 2 },
    logBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    loggedBtn: { backgroundColor: Colors.bridge },
    logBtnText: { color: Colors.white, fontWeight: '600' },
    addBtn: {
        marginTop: 8,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: 'center',
    },
    addBtnText: { color: Colors.primary, fontWeight: '600' },
    coffeeBox: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    coffeeTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary },
    coffeeControls: { flexDirection: 'row', alignItems: 'center' },
    coffeeCount: { fontSize: 22, fontWeight: 'bold', width: 40, textAlign: 'center', color: Colors.primary },
    minusBtn: {
        backgroundColor: '#ffcc00',
        width: 40, height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusBtn: {
        backgroundColor: Colors.bridge,
        width: 40, height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBtnText: { fontSize: 24, color: Colors.white, fontWeight: 'bold' },
    snoozeBtn: {
        backgroundColor: '#FF9500',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 12,
        marginBottom: 12,
    },
    snoozeBtnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
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
    counterBox: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    counterItem: {
        flex: 1,
        alignItems: 'center',
    },
    counterTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 8,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterDivider: {
        width: 1,
        height: '80%',
        backgroundColor: Colors.lightBlue,
        marginHorizontal: 10,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 4,
    },
    expandIcon: {
        fontSize: 16,
        color: Colors.primary,
        fontWeight: '600',
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
        marginRight: 28,
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
        borderColor: '#e74c3c',
    },
    clearAllBtnText: {
        color: '#e74c3c',
        fontSize: 13,
        fontWeight: '600',
    },
    arrowOverlay: {
        position: 'absolute',
        right: 16,
        bottom: 140,
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