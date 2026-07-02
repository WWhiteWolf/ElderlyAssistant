import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
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

type Priority = 'Urgent' | 'Normal' | 'Someday';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface Reminder {
    id: string;
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
    // kind 'offset' (or undefined, for legacy) fires `amount`/`unit` before the
    // appointment's own time. kind 'clock' fires at a fixed time of day (the
    // global morning/midday/evening setting) on the day `daysBefore` earlier.
    kind?: 'offset' | 'clock';
    daysBefore?: number;                          // clock only: 0 = morning of, 1 / 2 / 7 / 30
    timeOfDay?: 'morning' | 'midday' | 'evening'; // clock only: which global time to use
    notifId?: string;
}

interface Task {
    id: string;
    title: string;
    categoryId: string;
    priority: Priority;
    taskType: 'scheduled' | 'background';
    dueDate: string;
    dueTime: string;
    reminders: Reminder[];
    completed: boolean;
    createdDate: string;
    completedDate?: string;
    notes: string;
    status: 'Active' | 'On Hold' | 'Completed';
    onHoldNote: string;
}
interface LogEntry {
    id: string;
    taskTitle: string;
    completedDate: string;   // when Done was tapped
    scheduledFor?: string;   // task's original set date/time (optional: older entries lack it)
    notes: string;
}

// One-tap reminder presets. 'offset' presets fire `amount`/`unit` before the
// appointment time; 'clock' presets fire at the global morning/midday/evening
// time on the day `daysBefore` earlier (0 = morning of the appointment day).
type ReminderPreset = {
    label: string;
    kind: 'offset' | 'clock';
    amount?: number;
    unit?: 'minutes' | 'hours' | 'days';
    daysBefore?: number;
    timeOfDay?: 'morning' | 'midday' | 'evening';
};
const REMINDER_PRESETS: ReminderPreset[] = [
    { label: '1 hour', kind: 'offset', amount: 1, unit: 'hours' },
    { label: '2 hours', kind: 'offset', amount: 2, unit: 'hours' },
    { label: 'Morning of', kind: 'clock', daysBefore: 0, timeOfDay: 'morning' },
    { label: 'Day Before', kind: 'clock', daysBefore: 1, timeOfDay: 'midday' },
    { label: 'Night Before', kind: 'clock', daysBefore: 1, timeOfDay: 'evening' },
    { label: '2 Days Before', kind: 'clock', daysBefore: 2, timeOfDay: 'midday' },
    { label: 'Week', kind: 'clock', daysBefore: 7, timeOfDay: 'evening' },
    { label: 'Month', kind: 'clock', daysBefore: 30, timeOfDay: 'evening' },
];

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'c1', name: 'General', color: '#1a6e8a' },
    { id: 'c2', name: 'Health', color: '#2d9e8f' },
    { id: 'c3', name: 'House', color: '#85c5ab' },
    { id: 'c4', name: 'Yard', color: '#27ae60' },
    { id: 'c5', name: 'Pet', color: '#e67e22' },
    { id: 'c6', name: 'Bills', color: '#8e44ad' },
    { id: 'c7', name: 'Leisure', color: '#2980b9' },
    { id: 'c8', name: 'Hobbies', color: '#16a085' },
];
const PRIORITY_COLORS: Record<Priority, string> = {
    Urgent: '#e74c3c',
    Normal: '#1a6e8a',
    Someday: '#95a5a6',
};

export default function TodoScreen() {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('c1');
    const [newPriority, setNewPriority] = useState<Priority>('Normal');
    const [newDueDate, setNewDueDate] = useState('');
    const [newDueTime, setNewDueTime] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#1a6e8a');
    const [newTaskType, setNewTaskType] = useState<'scheduled' | 'background'>('scheduled');
    const [newReminders, setNewReminders] = useState<Reminder[]>([]);
    const [showBackgroundTasks, setShowBackgroundTasks] = useState(false);
    const [newTaskStatus, setNewTaskStatus] = useState<'Active' | 'On Hold' | 'Completed'>('Active');
    const [newTaskOnHoldNote, setNewTaskOnHoldNote] = useState('');
    const [showWeekAhead, setShowWeekAhead] = useState(false);
    const [showToday, setShowToday] = useState(false);

    useEffect(() => {
        const setup = async () => {
            // To-Do owns its own notification setup so it never depends on another
            // page (My Day / Pets) having been opened first to grant permission or
            // register the handler.
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
            const savedTasks = await AsyncStorage.getItem('todo_tasks');
            const savedCats = await AsyncStorage.getItem('todo_categories');
            const savedLog = await AsyncStorage.getItem('todo_log');
            if (savedTasks) setTasks(JSON.parse(savedTasks));
            if (savedCats) setCategories(JSON.parse(savedCats));
            if (savedLog) setLog(JSON.parse(savedLog));
        } catch (e) {
            console.error(e);
        }
    };

    const saveTasks = async (t: Task[]) => {
        setTasks(t);
        await AsyncStorage.setItem('todo_tasks', JSON.stringify(t));
    };

    const saveCategories = async (c: Category[]) => {
        setCategories(c);
        await AsyncStorage.setItem('todo_categories', JSON.stringify(c));
    };

    const saveLog = async (l: LogEntry[]) => {
        setLog(l);
        await AsyncStorage.setItem('todo_log', JSON.stringify(l));
    };

    // Text shown under a task's title. A task with a date shows the date + time.
    const scheduleLabel = (task: Task) => {
        if (task.dueDate) {
            return `Due: ${task.dueDate}${task.dueTime ? ' at ' + task.dueTime : ''}`;
        }
        return '';
    };

    const resetForm = () => {
        setNewTitle('');
        setNewCategory('c1');
        setNewPriority('Normal');
        setNewTaskType('scheduled');
        setNewDueDate('');
        setNewDueTime('');
        setNewNotes('');
        setNewReminders([]);
        setEditTask(null);
        setNewTaskStatus('Active');
        setNewTaskOnHoldNote('');
    };

    const addTask = () => {
        if (!newTitle.trim()) {
            Alert.alert('Missing Title', 'Please enter a task title.');
            return;
        }
        const task: Task = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            categoryId: newCategory,
            priority: newPriority,
            taskType: newTaskType,
            dueDate: newDueDate,
            dueTime: newDueTime,
            reminders: newReminders,
            completed: false,
            createdDate: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' }),
            notes: newNotes,
            status: newTaskStatus,
            onHoldNote: newTaskOnHoldNote,
        };
        saveTasks([...tasks, task]);
        scheduleReminders(task);
        scheduleBackgroundReminder();
        resetForm();
        setShowAddTask(false);
    };

    const updateTask = async () => {
        if (!editTask || !newTitle.trim()) return;
        if (newTaskStatus === 'Completed') {
            completeTask(editTask);
            setShowAddTask(false);
            return;
        }
        const updatedTask: Task = {
            ...editTask,
            title: newTitle.trim(),
            categoryId: newCategory,
            priority: newPriority,
            taskType: newTaskType,
            dueDate: newDueDate,
            dueTime: newDueTime,
            reminders: newReminders,
            notes: newNotes,
            status: newTaskStatus,
            onHoldNote: newTaskOnHoldNote,
        };
        const updated = tasks.map(t => (t.id === editTask.id ? updatedTask : t));
        saveTasks(updated);
        // Editing used to schedule nothing, so changes to due time/reminders
        // never took effect. Cancel this task's old reminders first, then
        // reschedule from the new values (mirrors the Add path).
        await cancelReminders(editTask.id);
        await scheduleReminders(updatedTask);
        resetForm();
        setShowAddTask(false);
    };

    const deleteTask = (id: string) => {
        Alert.alert('Delete Task', 'Remove this task?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    cancelReminders(id);
                    saveTasks(tasks.filter(t => t.id !== id));
                },
            },
        ]);
    };

    const completeTask = (task: Task) => {
        Alert.alert('Complete Task', `Mark "${task.title}" as done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Done', onPress: () => {
                    cancelReminders(task.id);
                    const completedDate = new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
                    // Original set date/time, matching the banner Done in _layout.tsx (#27).
                    let scheduledFor = task.dueDate || '';
                    if (task.dueTime) scheduledFor += (scheduledFor ? ' at ' : '') + task.dueTime;
                    const logEntry: LogEntry = {
                        id: Date.now().toString(),
                        taskTitle: task.title,
                        completedDate,
                        scheduledFor,
                        notes: task.notes,
                    };
                    const updatedLog = [logEntry, ...log].slice(0, 100);
                    saveLog(updatedLog);
                    saveTasks(tasks.filter(t => t.id !== task.id));
                },
            },
        ]);
    };

    const addCategory = () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Missing Name', 'Please enter a category name.');
            return;
        }
        const cat: Category = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
            color: newCategoryColor,
        };
        saveCategories([...categories, cat]);
        setNewCategoryName('');
        setShowAddCategory(false);
    };

    const deleteCategory = (id: string) => {
        Alert.alert('Delete Category', 'Remove this category? Tasks in it will move to General.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    saveCategories(categories.filter(c => c.id !== id));
                    saveTasks(tasks.map(t => t.categoryId === id ? { ...t, categoryId: 'c1' } : t));
                },
            },
        ]);
    };

    const openEditTask = (task: Task) => {
        setEditTask(task);
        setNewTitle(task.title);
        setNewCategory(task.categoryId);
        setNewPriority(task.priority);
        setNewTaskType(task.taskType || 'scheduled');
        setNewDueDate(task.dueDate);
        setNewDueTime(task.dueTime);
        setNewNotes(task.notes);
        setNewReminders(task.reminders || []);
        setShowAddTask(true);
        setNewTaskStatus(task.status || 'Active');
        setNewTaskOnHoldNote(task.onHoldNote || '');
    };

    const getSortedTasks = () => {
        let filtered = filterCategory === 'all'
            ? tasks.filter(t => t.taskType !== 'background')
            : tasks.filter(t => t.categoryId === filterCategory && t.taskType !== 'background');

        filtered = filtered.filter(t => !t.completed);

        // Fixed sort: by due date + time, soonest on top. Tasks with no due
        // date fall to the bottom.
        const stamp = (t: Task) => {
            const [month, day, year] = t.dueDate.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            return new Date(`${fullYear}-${month}-${day}T${t.dueTime || '00:00'}:00`).getTime();
        };
        return [...filtered].sort((a, b) => {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return stamp(a) - stamp(b);
        });
    };

    const getCategoryName = (id: string) => {
        return categories.find(c => c.id === id)?.name || 'General';
    };

    const getCategoryColor = (id: string) => {
        return categories.find(c => c.id === id)?.color || Colors.primary;
    };

    const scheduleReminders = async (task: Task) => {
        console.log('scheduleReminders called', task.taskType, task.dueDate, task.reminders.length);
        if (task.taskType === 'background') return;

        if (!task.dueDate || task.reminders.length === 0) return;

        // Global morning/midday/evening times (set in Settings) drive 'clock' reminders.
        const morningTime = (await AsyncStorage.getItem('reminder_morning_time')) || '08:00';
        const middayTime = (await AsyncStorage.getItem('reminder_midday_time')) || '12:00';
        const eveningTime = (await AsyncStorage.getItem('reminder_evening_time')) || '17:00';

        for (const reminder of task.reminders) {
            const [month, day, year] = task.dueDate.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            const dueDateTime = new Date(`${fullYear}-${month}-${day}T${task.dueTime || '09:00'}:00`);

            let fireTime: Date;
            if (reminder.kind === 'clock') {
                // Fire at the chosen global time, `daysBefore` days before the date.
                const which = reminder.timeOfDay === 'evening' ? eveningTime
                    : reminder.timeOfDay === 'midday' ? middayTime
                    : morningTime;
                const [chStr, cmStr] = which.split(':');
                fireTime = new Date(`${fullYear}-${month}-${day}T00:00:00`);
                fireTime.setDate(fireTime.getDate() - (reminder.daysBefore ?? 0));
                fireTime.setHours(parseInt(chStr, 10) || 0, parseInt(cmStr, 10) || 0, 0, 0);
            } else {
                let msOffset = 0;
                if (reminder.unit === 'minutes') msOffset = reminder.amount * 60 * 1000;
                if (reminder.unit === 'hours') msOffset = reminder.amount * 60 * 60 * 1000;
                if (reminder.unit === 'days') msOffset = reminder.amount * 24 * 60 * 60 * 1000;
                fireTime = new Date(dueDateTime.getTime() - msOffset);
            }
            console.log('Fire time:', fireTime, 'Now:', new Date(), 'Future?', fireTime > new Date());
            if (fireTime > new Date()) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `📋 Reminder: ${task.title}`,
                        body: task.dueDate ? `Due: ${task.dueDate}${task.dueTime ? ' at ' + task.dueTime : ''}` : '',
                        // No categoryIdentifier (Patrick, #40): To-Do banners carry NO buttons.
                        // A To-Do is a one-time appointment — every set reminder should fire;
                        // swipe dismisses, tap opens the app, Done happens in-app afterward.
                        data: { taskId: task.id, itemId: task.id, label: task.title, source: 'todo' },
                        sound: 'default',
                    },
                    trigger: {
                        type: Notifications.SchedulableTriggerInputTypes.DATE,
                        date: fireTime,
                    },
                });
            }
        }
    };

    const cancelReminders = async (taskId: string) => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.taskId === taskId) {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    };

    const scheduleBackgroundReminder = async () => {
        const backgroundTasks = tasks.filter(t => t.taskType === 'background');
        if (backgroundTasks.length === 0) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(8, 0, 0, 0);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📋 Background Tasks',
                body: `You have ${backgroundTasks.length} background task${backgroundTasks.length > 1 ? 's' : ''} to review.`,
                data: { source: 'todo' },
                sound: 'default',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 8,
                minute: 0,
            } as Notifications.DailyTriggerInput,
        });
    };

    // Does the current selection already contain this preset?
    const isPresetSelected = (p: ReminderPreset): boolean => {
        if (p.kind === 'clock') {
            return newReminders.some(r => r.kind === 'clock' && r.daysBefore === p.daysBefore && r.timeOfDay === p.timeOfDay);
        }
        return newReminders.some(r => r.kind !== 'clock' && r.amount === p.amount && r.unit === p.unit);
    };

    // Tapping a preset button toggles it on/off.
    const togglePreset = (p: ReminderPreset) => {
        if (isPresetSelected(p)) {
            setNewReminders(newReminders.filter(r => {
                if (p.kind === 'clock') return !(r.kind === 'clock' && r.daysBefore === p.daysBefore && r.timeOfDay === p.timeOfDay);
                return !(r.kind !== 'clock' && r.amount === p.amount && r.unit === p.unit);
            }));
            return;
        }
        if (p.kind === 'clock') {
            setNewReminders([...newReminders, {
                id: Date.now().toString(),
                amount: 0,
                unit: 'days',
                kind: 'clock',
                daysBefore: p.daysBefore,
                timeOfDay: p.timeOfDay,
            }]);
            return;
        }
        setNewReminders([...newReminders, {
            id: Date.now().toString(),
            amount: p.amount ?? 0,
            unit: p.unit ?? 'minutes',
            kind: 'offset',
        }]);
    };


    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>To-Do</Text>
                    <TouchableOpacity onPress={() => { resetForm(); setShowAddTask(true); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>New Task</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <View style={styles.toolbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    <TouchableOpacity
                        style={[styles.filterBtn, filterCategory === 'all' && styles.filterBtnActive]}
                        onPress={() => setFilterCategory('all')}
                    >
                        <Text style={[styles.filterBtnText, filterCategory === 'all' && styles.filterBtnTextActive]}>All</Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.filterBtn, filterCategory === cat.id && styles.filterBtnActive, { borderColor: cat.color }]}
                            onPress={() => setFilterCategory(cat.id)}
                        >
                            <Text style={[styles.filterBtnText, filterCategory === cat.id && styles.filterBtnTextActive, { color: cat.color }]}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {tasks.filter(t => t.taskType === 'background').length > 0 && (
                <TouchableOpacity
                    style={styles.backgroundBanner}
                    onPress={() => setShowBackgroundTasks(!showBackgroundTasks)}
                >
                    <Text style={styles.backgroundBannerText}>
                        📋 {tasks.filter(t => t.taskType === 'background').length} background task{tasks.filter(t => t.taskType === 'background').length > 1 ? 's' : ''} — tap to {showBackgroundTasks ? 'hide' : 'review'}
                    </Text>
                </TouchableOpacity>
            )}

            {showBackgroundTasks && (
                <View style={styles.backgroundList}>
                    {tasks.filter(t => t.taskType === 'background' && !t.completed).map(task => (
                        <Swipeable
                            key={task.id}
                            renderRightActions={() => (
                                <TouchableOpacity
                                    style={styles.swipeDelete}
                                    onPress={() => deleteTask(task.id)}
                                >
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <TouchableOpacity
                                style={styles.taskCard}
                                onPress={() => openEditTask(task)}
                            >
                                <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                                <View style={styles.taskContent}>
                                    <View style={styles.taskTopRow}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <TouchableOpacity onPress={() => openEditTask(task)} style={styles.editBtn}>
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.taskBottomRow}>
                                        <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[task.priority] }]}>{task.priority}</Text>
                                        <Text style={[styles.priorityLabel, { color: getCategoryColor(task.categoryId) }]}>{getCategoryName(task.categoryId)}</Text>
                                        {scheduleLabel(task) ? <Text style={styles.dueDateText}>{scheduleLabel(task)}</Text> : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    ))}
                </View>
            )}

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
                {getSortedTasks().length === 0 && (
                    <Text style={styles.emptyText}>No tasks yet. Tap + to add one.</Text>
                )}
                {getSortedTasks().map(task => (
                    <Swipeable
                        key={task.id}
                        renderRightActions={() => (
                            <TouchableOpacity
                                style={styles.swipeDelete}
                                onPress={() => deleteTask(task.id)}
                            >
                                <Text style={styles.swipeDeleteText}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    >
                        <View style={styles.taskCard}>
                            <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                            <View style={styles.taskContent}>
                                <View style={styles.taskTopRow}>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <View style={styles.taskBtnRow}>
                                        <TouchableOpacity onPress={() => completeTask(task)} style={styles.doneBtn}>
                                            <Text style={styles.doneBtnText}>Done</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => openEditTask(task)} style={styles.editBtn}>
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={styles.taskBottomRow}>
                                        <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[task.priority] }]}>{task.priority}</Text>
                                        <Text style={[styles.priorityLabel, { color: getCategoryColor(task.categoryId) }]}>{getCategoryName(task.categoryId)}</Text>
                                        {scheduleLabel(task) ? <Text style={styles.dueDateText}>{scheduleLabel(task)}</Text> : null}
                                    </View>

                                </View>
                                {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}
                            </View>
                        </View>
                    </Swipeable>
                ))}
            </ScrollView>

            <View style={styles.fabRow}>
                <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowWeekAhead(!showWeekAhead)}>
                    <Text style={styles.fabText}>📅 Week</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowLog(!showLog)}>
                    <Text style={styles.fabText}>📋 Log</Text>
                </TouchableOpacity>
            </View>

            {showLog && (
                <View style={styles.logOverlay}>
                    <View style={styles.logHeader}>
                        <Text style={styles.logTitle}>Completed Tasks</Text>
                        <TouchableOpacity onPress={() => setShowLog(false)}>
                            <Text style={styles.logClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {log.length === 0 && <Text style={styles.emptyText}>No completed tasks yet.</Text>}
                        {log.map(l => (
                            <View key={l.id} style={styles.logItem}>
                                <Text style={styles.logItemText}>{l.scheduledFor ? `Set ${l.scheduledFor} | ` : ''}Done {l.completedDate} | {l.taskTitle}{l.notes ? ` | ${l.notes}` : ''}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {showAddTask && (
                <Modal transparent animationType="slide" visible={showAddTask}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <Text style={styles.modalTitle}>{editTask ? 'Edit Task' : 'New Task'}</Text>
                                        <Text style={{ fontSize: 13, color: Colors.bridge, fontStyle: 'italic' }}>Tap background, or Scroll ↓ to view everything</Text>
                                    </View>
                                    <View style={styles.modalBtns}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setShowAddTask(false); }}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.confirmBtn} onPress={editTask ? updateTask : addTask}>
                                            <Text style={styles.confirmBtnText}>{editTask ? 'Update' : 'Add'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.inputLabel}>Title</Text>
                                    <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="What needs to be done?" autoFocus={true} />

                                    <Text style={styles.inputLabel}>Category</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                        {categories.map(cat => (
                                            <TouchableOpacity
                                                key={cat.id}
                                                style={[styles.filterBtn, newCategory === cat.id && styles.filterBtnActive, { borderColor: cat.color }]}
                                                onPress={() => setNewCategory(cat.id)}
                                            >
                                                <Text style={[styles.filterBtnText, newCategory === cat.id && styles.filterBtnTextActive, { color: newCategory === cat.id ? '#fff' : cat.color }]}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity
                                        style={[styles.filterBtn, { borderColor: Colors.bridge, marginTop: 6 }]}
                                        onPress={() => { setShowAddTask(false); setShowAddCategory(true); }}
                                    >
                                        <Text style={[styles.filterBtnText, { color: Colors.bridge }]}>+ Custom Category</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.inputLabel}>Priority</Text>
                                    <View style={styles.priorityRow}>
                                        {(['Urgent', 'Normal', 'Someday'] as Priority[]).map(p => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.priorityBtn, newPriority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                                                onPress={() => setNewPriority(p)}
                                            >
                                                <Text style={[styles.priorityBtnText, newPriority === p && { color: '#fff' }]}>{p}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <Text style={styles.inputLabel}>Status</Text>
                                    <View style={styles.priorityRow}>
                                        {(['Active', 'On Hold', 'Completed'] as const).map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.priorityBtn, newTaskStatus === s && {
                                                    backgroundColor: s === 'Active' ? Colors.primary : s === 'On Hold' ? '#e67e22' : Colors.bridge
                                                }]}
                                                onPress={() => setNewTaskStatus(s)}
                                            >
                                                <Text style={[styles.priorityBtnText, newTaskStatus === s && { color: '#fff' }]}>
                                                    {s === 'Completed' ? 'Done' : s}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {newTaskStatus === 'On Hold' && (
                                        <>
                                            <Text style={styles.inputLabel}>Reason for Hold</Text>
                                            <TextInput style={styles.input} value={newTaskOnHoldNote} onChangeText={setNewTaskOnHoldNote} placeholder="Why is this on hold?" />
                                        </>
                                    )}

                                    <Text style={styles.inputLabel}>Due Date (MM/DD/YY)</Text>
                                    <TextInput style={styles.input} value={newDueDate} onChangeText={setNewDueDate} placeholder="e.g. 04/15/26" keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>Due Time (optional)</Text>
                                    <TextInput style={styles.input} value={newDueTime} onChangeText={setNewDueTime} placeholder="e.g. 09:00" keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                                    <TextInput style={styles.input} value={newNotes} onChangeText={setNewNotes} placeholder="Any details..." multiline />

                                    {newTaskType === 'scheduled' && (
                                        <>
                                            <Text style={styles.inputLabel}>Reminders before</Text>
                                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                                {REMINDER_PRESETS.map(p => (
                                                    <TouchableOpacity
                                                        key={p.label}
                                                        style={[styles.recurBtn, { marginRight: 0 }, isPresetSelected(p) && styles.recurBtnActive]}
                                                        onPress={() => togglePreset(p)}
                                                    >
                                                        <Text style={[styles.recurBtnText, isPresetSelected(p) && styles.recurBtnTextActive]}>{p.label}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </>
                                    )}


                                </ScrollView>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}

            {showAddCategory && (
                <Modal transparent animationType="fade" visible={showAddCategory}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>New Category</Text>
                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput style={styles.input} value={newCategoryName} onChangeText={setNewCategoryName} placeholder="Category name..." autoFocus={true} />
                            <Text style={styles.inputLabel}>Color</Text>
                            <View style={styles.colorRow}>
                                {['#1a6e8a', '#2d9e8f', '#85c5ab', '#e67e22', '#8e44ad', '#e74c3c', '#27ae60', '#2c3e50'].map(color => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[styles.colorSwatch, { backgroundColor: color }, newCategoryColor === color && styles.colorSwatchSelected]}
                                        onPress={() => setNewCategoryColor(color)}
                                    />
                                ))}
                            </View>
                            <Text style={styles.inputLabel}>Existing Categories</Text>
                            {categories.filter(c => !['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'].includes(c.id)).map(cat => (
                                <View key={cat.id} style={styles.catManageRow}>
                                    <View style={[styles.catDot, { backgroundColor: cat.color }]} />
                                    <Text style={styles.catManageName}>{cat.name}</Text>
                                    <TouchableOpacity onPress={() => deleteCategory(cat.id)}>
                                        <Text style={styles.catDeleteBtn}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNewCategoryName(''); setShowAddCategory(false); }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={addCategory}>
                                    <Text style={styles.confirmBtnText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            {showWeekAhead && (
                <View style={styles.weekOverlay}>
                    <View style={styles.weekHeader}>
                        <Text style={styles.weekTitle}>Week Ahead</Text>
                        <TouchableOpacity onPress={() => setShowWeekAhead(false)} style={styles.recurBtn}>
                            <Text style={styles.recurBtnText}>← Back</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                            const date = new Date();
                            date.setDate(date.getDate() + dayOffset);
                            const dateStr = date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
                            const dayName = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : date.toLocaleDateString([], { weekday: 'long' });

                            const dayTasks = tasks.filter(t => {
                                if (t.completed) return false;
                                if (t.taskType === 'background') return false;
                                return t.dueDate === dateStr;
                            });

                            return (
                                <View key={dayOffset} style={styles.weekDay}>
                                    <View style={styles.weekDayHeader}>
                                        <Text style={styles.weekDayName}>{dayName}</Text>
                                        <Text style={styles.weekDayDate}>{dateStr}</Text>
                                    </View>
                                    {dayTasks.length === 0 ? (
                                        <Text style={styles.weekEmpty}>Nothing due</Text>
                                    ) : (
                                        dayTasks.map(task => (
                                            <TouchableOpacity
                                                key={task.id}
                                                style={styles.weekTask}
                                                onPress={() => { setShowWeekAhead(false); openEditTask(task); }}
                                            >
                                                <View style={[styles.weekPriorityDot, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.weekTaskTitle}>{task.title}</Text>
                                                    <Text style={styles.weekTaskMeta}>{getCategoryName(task.categoryId)}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            );
                        })}
                    </ScrollView>
                </View>
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
    toolbar: {
        backgroundColor: Colors.white,
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.lightBlue,
    },
    filterRow: {
        paddingHorizontal: 12,
        marginBottom: 6,
    },
    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: Colors.lightBlue,
        marginRight: 8,
        backgroundColor: Colors.white,
    },
    filterBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterBtnText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
    filterBtnTextActive: { color: Colors.white },
    scroll: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
    taskCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        overflow: 'hidden',
    },
    priorityBar: { width: 6 },
    taskContent: { flex: 1, padding: 6 },
    taskTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    taskTitle: { fontSize: 16, fontWeight: '600', color: Colors.primary, flex: 1, marginRight: 8 },
    categoryBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    categoryBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
    taskBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    priorityLabel: { fontSize: 12, fontWeight: '600' },
    dueDateText: { fontSize: 12, color: '#888' },
    taskNotes: { fontSize: 12, color: '#999', marginTop: 4, fontStyle: 'italic' },
    fabRow: {
        position: 'absolute',
        bottom: 20,
        right: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    fab: {
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabMainText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
    fabSecondary: {
        backgroundColor: Colors.bridge,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
    logOverlay: {
        position: 'absolute',
        bottom: 70,
        left: 12,
        right: 12,
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        maxHeight: 300,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logTitle: { fontSize: 16, fontWeight: '600', color: Colors.primary },
    logClose: { fontSize: 18, color: '#888' },
    logItem: {
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        paddingVertical: 6,
    },
    logItemText: { fontSize: 13, color: Colors.text },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBox: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxHeight: '85%',
    },
    modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.primary },
    inputLabel: { fontSize: 14, color: '#666', marginBottom: 4, marginTop: 8 },
    input: {
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: Colors.background,
        color: Colors.text,
        marginBottom: 4,
    },
    priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    priorityBtn: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: Colors.lightBlue,
        alignItems: 'center',
    },
    priorityBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
    recurBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.lightBlue,
        marginRight: 8,
        backgroundColor: Colors.white,
    },
    recurBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    recurBtnText: { fontSize: 13, color: Colors.primary },
    recurBtnTextActive: { color: Colors.white },
    catSelectBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.lightBlue,
        marginRight: 8,
        backgroundColor: Colors.white,
    },
    catSelectText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' },
    colorSwatch: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    colorSwatchSelected: {
        borderWidth: 3,
        borderColor: Colors.primary,
    },
    catManageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
    },
    catDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 10,
    },
    catManageName: { flex: 1, fontSize: 14, color: Colors.text },
    catDeleteBtn: { fontSize: 16, color: '#e74c3c', paddingHorizontal: 8 },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    cancelBtn: {
        backgroundColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: { color: '#333', fontWeight: '600' },
    confirmBtn: {
        backgroundColor: Colors.primary,
        padding: 12,
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
        marginBottom: 10,
    },
    swipeDeleteText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    hintText: { fontSize: 11, color: '#aaa', marginBottom: 8 },
    backgroundBanner: {
        backgroundColor: Colors.bridge,
        padding: 10,
        marginHorizontal: 12,
        marginTop: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backgroundBannerText: { color: Colors.white, fontWeight: '600', fontSize: 14, textAlign: 'center' },
    backgroundList: {
        marginHorizontal: 12,
        marginBottom: 8,
    },
    pressToEdit: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
    taskBtnRow: { flexDirection: 'row', alignItems: 'center' },
    doneBtn: {
        backgroundColor: Colors.bridge,
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginRight: 6,
    },
    doneBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
    editBtn: {
        backgroundColor: Colors.background,
        borderWidth: 0.5,
        borderColor: Colors.primary,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    editBtnText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
    weekOverlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        bottom: 70,
        backgroundColor: Colors.white,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    weekHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.lightBlue,
    },
    weekTitle: { fontSize: 20, fontWeight: '600', color: Colors.primary, fontStyle: 'italic', fontFamily: 'Georgia' },
    weekDay: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.lightBlue,
    },
    weekDayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    weekDayName: { fontSize: 16, fontWeight: '600', color: Colors.primary },
    weekDayDate: { fontSize: 13, color: '#aaa' },
    weekEmpty: { fontSize: 13, color: '#aaa', fontStyle: 'italic', paddingLeft: 8 },
    weekTask: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: Colors.background,
        borderRadius: 8,
        marginBottom: 4,
        gap: 10,
    },
    weekPriorityDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    weekTaskTitle: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
    weekTaskMeta: { fontSize: 12, color: '#aaa', marginTop: 2 },

    headerBtn: {
        borderWidth: 1,
        borderColor: Colors.white,
        paddingVertical: 2,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    headerBtnText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});
