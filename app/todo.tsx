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
import DateTimeControl, { formatDateMMDDYY, formatTime24 } from '../components/DateTimeControl';
import { Theme, useTheme } from '../constants/Themes';

// Priority removed entirely (Patrick, #58 scope, built #60): no form
// buttons, no tile side bar or colored priority word. Old saved tasks may
// still carry a priority in storage — it's simply ignored on load (the
// #42 categories treatment). The priority* theme keys stay in Themes.ts —
// the Planner still uses them.

// Categories removed entirely (Patrick, #42): no picker, no custom-category
// popup, no filter bar. Old saved tasks may still carry a categoryId in
// storage — it's simply ignored on load.

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
    taskType: 'scheduled' | 'background';
    // #60: due date/time stored as separate numbers — Look Ahead's pattern,
    // now the app-wide standard. (Was dueDate/dueTime MM/DD/YY + HH:MM
    // strings; no compat code — old string tasks open via the today-noon
    // fallback until edited, per Patrick's rule.)
    year: number;
    month: number; // 0-11
    day: number;   // 1-31
    hour: number;
    minute: number;
    reminders: Reminder[];
    completed: boolean;
    createdDate: string;
    completedDate?: string;
    notes: string;
    // Status removed entirely (Patrick, #58 scope, built #60): no
    // Active/On Hold/Completed form buttons, no "Reason for Hold" box, no
    // Completed-from-Edit. On Hold is gone with them; the tile's ✓ (Done)
    // is the way to complete. Old saved tasks may still carry status /
    // onHoldNote in storage — simply ignored on load.
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
    // '30 min.' added #60 (Patrick's #58 ask) — sits before '1 hour'.
    { label: '30 min.', kind: 'offset', amount: 30, unit: 'minutes' },
    { label: '1 hour', kind: 'offset', amount: 1, unit: 'hours' },
    { label: '2 hours', kind: 'offset', amount: 2, unit: 'hours' },
    { label: 'Morning of', kind: 'clock', daysBefore: 0, timeOfDay: 'morning' },
    { label: 'Day Before', kind: 'clock', daysBefore: 1, timeOfDay: 'midday' },
    { label: 'Night Before', kind: 'clock', daysBefore: 1, timeOfDay: 'evening' },
    { label: '2 Days Before', kind: 'clock', daysBefore: 2, timeOfDay: 'midday' },
    { label: 'Week', kind: 'clock', daysBefore: 7, timeOfDay: 'evening' },
    { label: 'Month', kind: 'clock', daysBefore: 30, timeOfDay: 'evening' },
];

export default function TodoScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [showAddTask, setShowAddTask] = useState(false);
    // Log rebuild (#57): the log lives at the bottom of the page now — no
    // show/hide state. These two drive the tap-to-edit-note popup.
    const [editLogEntry, setEditLogEntry] = useState<LogEntry | null>(null);
    const [editLogNotes, setEditLogNotes] = useState('');
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [newTitle, setNewTitle] = useState('');
    // #58: the shared date/time control replaced the two typed boxes. The
    // form holds one Date (spinners + type-in stay in step through it) and
    // a validity flag — false while a type-in box holds an impossible value.
    // A new form opens at today, 12:00 noon (Patrick's call, like Look Ahead).
    const [newDueAt, setNewDueAt] = useState<Date>(() => new Date(new Date().setHours(12, 0, 0, 0)));
    const [newDueValid, setNewDueValid] = useState(true);
    const [newNotes, setNewNotes] = useState('');
    const [newTaskType, setNewTaskType] = useState<'scheduled' | 'background'>('scheduled');
    const [newReminders, setNewReminders] = useState<Reminder[]>([]);
    const [showBackgroundTasks, setShowBackgroundTasks] = useState(false);

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
            const savedLog = await AsyncStorage.getItem('todo_log');
            if (savedTasks) setTasks(JSON.parse(savedTasks));
            if (savedLog) setLog(JSON.parse(savedLog));
        } catch (e) {
            console.error(e);
        }
    };

    const saveTasks = async (t: Task[]) => {
        setTasks(t);
        await AsyncStorage.setItem('todo_tasks', JSON.stringify(t));
    };

    const saveLog = async (l: LogEntry[]) => {
        setLog(l);
        await AsyncStorage.setItem('todo_log', JSON.stringify(l));
    };

    // #60: the one bridge from stored numbers to a Date. Returns null when a
    // task has no numbers (an old string-stored task) — callers treat that as
    // "no due date" until the task is edited and re-saved.
    const taskDueDate = (task: Task): Date | null => {
        if (typeof task.year !== 'number' || typeof task.month !== 'number' || typeof task.day !== 'number') {
            return null;
        }
        return new Date(task.year, task.month, task.day, task.hour ?? 12, task.minute ?? 0, 0, 0);
    };

    // Text shown under a task's title (and in the reminder banner body).
    // Same wording/format as before: "Due: MM/DD/YY at HH:MM".
    const scheduleLabel = (task: Task) => {
        const due = taskDueDate(task);
        return due ? `Due: ${formatDateMMDDYY(due)} at ${formatTime24(due)}` : '';
    };

    const resetForm = () => {
        setNewTitle('');
        setNewTaskType('scheduled');
        setNewDueAt(new Date(new Date().setHours(12, 0, 0, 0)));
        setNewDueValid(true);
        setNewNotes('');
        setNewReminders([]);
        setEditTask(null);
    };

    const addTask = () => {
        if (!newTitle.trim()) {
            Alert.alert('Missing Title', 'Please enter a task title.');
            return;
        }
        // #58: an impossible typed date/time blocks the save (warning block,
        // Patrick's call). The box at fault carries a red border.
        if (!newDueValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        // #58 (the #55 fold-in): saving with no reminder ticked asks first —
        // a confirm, not a hard block. The final say stays with Patrick.
        if (newTaskType === 'scheduled' && newReminders.length === 0) {
            Alert.alert('No Reminder Set', "Are you sure you don't want to set a Reminder?", [
                { text: 'Go Back', style: 'cancel' },
                { text: 'Save Anyway', onPress: () => finishAdd() },
            ]);
            return;
        }
        finishAdd();
    };

    const finishAdd = () => {
        const task: Task = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            taskType: newTaskType,
            year: newDueAt.getFullYear(),
            month: newDueAt.getMonth(),
            day: newDueAt.getDate(),
            hour: newDueAt.getHours(),
            minute: newDueAt.getMinutes(),
            reminders: newReminders,
            completed: false,
            createdDate: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' }),
            notes: newNotes,
        };
        saveTasks([...tasks, task]);
        scheduleReminders(task);
        scheduleBackgroundReminder();
        resetForm();
        setShowAddTask(false);
    };

    const updateTask = async () => {
        if (!editTask || !newTitle.trim()) return;
        // #58: same warning block as the Add path.
        if (!newDueValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        // #58: same no-reminder confirm as the Add path.
        if (newTaskType === 'scheduled' && newReminders.length === 0) {
            Alert.alert('No Reminder Set', "Are you sure you don't want to set a Reminder?", [
                { text: 'Go Back', style: 'cancel' },
                { text: 'Save Anyway', onPress: () => finishUpdate(editTask) },
            ]);
            return;
        }
        await finishUpdate(editTask);
    };

    const finishUpdate = async (editing: Task) => {
        const updatedTask: Task = {
            ...editing,
            title: newTitle.trim(),
            taskType: newTaskType,
            year: newDueAt.getFullYear(),
            month: newDueAt.getMonth(),
            day: newDueAt.getDate(),
            hour: newDueAt.getHours(),
            minute: newDueAt.getMinutes(),
            reminders: newReminders,
            notes: newNotes,
        };
        const updated = tasks.map(t => (t.id === editing.id ? updatedTask : t));
        saveTasks(updated);
        // Editing used to schedule nothing, so changes to due time/reminders
        // never took effect. Cancel this task's old reminders first, then
        // reschedule from the new values (mirrors the Add path).
        await cancelReminders(editing.id);
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
                    // Original set date/time (#27). #60: built from the stored
                    // numbers; an old string task logs an empty scheduledFor
                    // (the log popup already tolerates a missing one).
                    const due = taskDueDate(task);
                    const scheduledFor = due ? `${formatDateMMDDYY(due)} at ${formatTime24(due)}` : '';
                    const logEntry: LogEntry = {
                        id: Date.now().toString(),
                        taskTitle: task.title,
                        completedDate,
                        scheduledFor,
                        notes: task.notes,
                    };
                    const updatedLog = [logEntry, ...log].slice(0, 50);
                    saveLog(updatedLog);
                    saveTasks(tasks.filter(t => t.id !== task.id));
                },
            },
        ]);
    };

    // Log section actions (#57) — same pattern as My Day's log.
    const deleteLogEntry = (id: string) => {
        saveLog(log.filter(l => l.id !== id));
    };

    const clearAllLog = () => {
        Alert.alert(
            'Clear All',
            'Delete all log entries? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear All', style: 'destructive', onPress: () => saveLog([]) },
            ]
        );
    };

    const saveLogEntryNotes = () => {
        if (!editLogEntry) return;
        const updated = log.map(l => l.id === editLogEntry.id ? { ...l, notes: editLogNotes } : l);
        saveLog(updated);
        setEditLogEntry(null);
    };

    const openEditTask = (task: Task) => {
        setEditTask(task);
        setNewTitle(task.title);
        setNewTaskType(task.taskType || 'scheduled');
        // #60: numbers → Date directly. An old string task (no numbers) opens
        // at today-noon — the same fallback the string parser used to provide.
        setNewDueAt(taskDueDate(task) ?? new Date(new Date().setHours(12, 0, 0, 0)));
        setNewDueValid(true);
        setNewNotes(task.notes);
        setNewReminders(task.reminders || []);
        setShowAddTask(true);
    };

    const getSortedTasks = () => {
        let filtered = tasks.filter(t => t.taskType !== 'background');

        filtered = filtered.filter(t => !t.completed);

        // Fixed sort: by due date + time, soonest on top. Tasks with no due
        // date (old string-stored ones) fall to the bottom.
        return [...filtered].sort((a, b) => {
            const dueA = taskDueDate(a);
            const dueB = taskDueDate(b);
            if (!dueA) return 1;
            if (!dueB) return -1;
            return dueA.getTime() - dueB.getTime();
        });
    };

    const scheduleReminders = async (task: Task) => {
        console.log('scheduleReminders called', task.taskType, taskDueDate(task), task.reminders.length);
        if (task.taskType === 'background') return;

        // #60: the due Date comes straight from the stored numbers. No numbers
        // (an old string task) = nothing to schedule — it gets its reminders
        // back when it's edited and re-saved.
        const dueDateTime = taskDueDate(task);
        if (!dueDateTime || task.reminders.length === 0) return;

        // Global morning/midday/evening times (set in Settings) drive 'clock' reminders.
        const morningTime = (await AsyncStorage.getItem('reminder_morning_time')) || '08:00';
        const middayTime = (await AsyncStorage.getItem('reminder_midday_time')) || '12:00';
        const eveningTime = (await AsyncStorage.getItem('reminder_evening_time')) || '17:00';

        for (const reminder of task.reminders) {
            let fireTime: Date;
            if (reminder.kind === 'clock') {
                // Fire at the chosen global time, `daysBefore` days before the date.
                const which = reminder.timeOfDay === 'evening' ? eveningTime
                    : reminder.timeOfDay === 'midday' ? middayTime
                    : morningTime;
                const [chStr, cmStr] = which.split(':');
                fireTime = new Date(task.year, task.month, task.day, 0, 0, 0, 0);
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
                        body: scheduleLabel(task),
                        // 'todook' (Patrick, #56; softens #40's buttonless call): press-and-hold
                        // shows a single OK that just closes the banner. Still no Done/Snooze —
                        // a To-Do is a one-time appointment; Done happens in-app afterward.
                        categoryIdentifier: 'todook',
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
            <SafeAreaView style={{ backgroundColor: theme.header }}>
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
                                <View style={styles.taskContent}>
                                    <View style={styles.taskTopRow}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <TouchableOpacity onPress={() => openEditTask(task)} style={styles.editBtn}>
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.taskBottomRow}>
                                        {scheduleLabel(task) ? <Text style={styles.dueDateText}>{scheduleLabel(task)}</Text> : null}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    ))}
                </View>
            )}

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
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
                                        {scheduleLabel(task) ? <Text style={styles.dueDateText}>{scheduleLabel(task)}</Text> : null}
                                    </View>

                                </View>
                                {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}
                            </View>
                        </View>
                    </Swipeable>
                ))}

                <View style={styles.logSection}>
                    <View style={styles.logHeader}>
                        <Text style={styles.logTitle}>Completed Tasks</Text>
                        {log.length > 0 && (
                            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllLog}>
                                <Text style={styles.clearAllBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView style={styles.logScroll} nestedScrollEnabled={true}>
                        {log.length === 0 && <Text style={[styles.emptyText, { marginTop: 10, marginBottom: 10 }]}>No completed tasks yet.</Text>}
                        {log.map(l => (
                            <Swipeable
                                key={l.id}
                                renderRightActions={() => (
                                    <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteLogEntry(l.id)}>
                                        <Text style={styles.swipeDeleteText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            >
                                <TouchableOpacity style={styles.logItem} onPress={() => {
                                    setEditLogEntry(l);
                                    setEditLogNotes(l.notes || '');
                                }}>
                                    <Text style={styles.logItemText}>{l.scheduledFor ? `Set ${l.scheduledFor} | ` : ''}Done {l.completedDate} | {l.taskTitle}{l.notes ? ` | ${l.notes}` : ''}</Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {editLogEntry && (
                <Modal transparent animationType="fade" visible={!!editLogEntry}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>Edit Log Entry</Text>
                            <Text style={styles.inputLabel}>Notes (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={editLogNotes}
                                onChangeText={setEditLogNotes}
                                placeholder="Add a note about this entry..."
                                placeholderTextColor={theme.mutedText}
                            />
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditLogEntry(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={saveLogEntryNotes}>
                                    <Text style={styles.confirmBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {showAddTask && (
                <Modal transparent animationType="slide" visible={showAddTask}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
                        <View style={styles.modalOverlay}>
                            {/* #60: taller popup (85% → 98%, Patrick) — the bottom edge sits
                                low enough to read "Notes (optional)". Log popup unchanged. */}
                            <View style={[styles.modalBox, { maxHeight: '98%' }]}>
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    {/* #60: gap under the title cut 32 → 8, and the italic
                                        scroll hint removed (Patrick: never noticed it) — the ↓ on
                                        the Notes label does that job now. Log popup untouched. */}
                                    <View style={{ marginBottom: 8 }}>
                                        <Text style={styles.modalTitle}>{editTask ? 'Edit Task' : 'New Task'}</Text>
                                    </View>
                                    <View style={[styles.modalBtns, { marginTop: 0 }]}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setShowAddTask(false); }}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.confirmBtn} onPress={editTask ? updateTask : addTask}>
                                            <Text style={styles.confirmBtnText}>{editTask ? 'Update' : 'Add'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.inputLabel}>Title</Text>
                                    <TextInput style={styles.input} value={newTitle} onChangeText={setNewTitle} placeholder="What needs to be done?" autoFocus={true} />

                                    <DateTimeControl value={newDueAt} onChange={setNewDueAt} onValidityChange={setNewDueValid} />

                                    {/* #60: Reminders moved up under the date/time (Patrick) —
                                        they lived at the bottom, out of sight, and got forgotten.
                                        Notes (optional) drops to last. */}
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

                                    {/* #60: the ↓ hints there's more below the fold (Patrick) —
                                        replaces the removed header scroll hint. */}
                                    <Text style={styles.inputLabel}>Notes (optional) ↓</Text>
                                    {/* #60: starts ~3 lines tall (Patrick) and still grows as you type. */}
                                    <TextInput style={[styles.input, { minHeight: 76, textAlignVertical: 'top' }]} value={newNotes} onChangeText={setNewNotes} placeholder="Any details..." multiline />
                                </ScrollView>
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
    scroll: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: t.mutedText, marginTop: 40, fontSize: 16 },
    taskCard: {
        flexDirection: 'row',
        backgroundColor: t.card,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        overflow: 'hidden',
    },
    taskContent: { flex: 1, padding: 6 },
    taskTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 2,
    },
    taskTitle: { fontSize: 16, fontWeight: '600', color: t.bodyText, flex: 1, marginRight: 8 },
    taskBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dueDateText: { fontSize: 12, color: t.mutedText },
    taskNotes: { fontSize: 12, color: t.mutedText, marginTop: 4, fontStyle: 'italic' },
    // Log section (#57) — bottom of the page, My Day's log pattern.
    logSection: { marginTop: 8, marginBottom: 12 },
    logScroll: {
        height: 385,
        backgroundColor: t.card,
        borderRadius: 8,
        padding: 8,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    logTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle },
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
    logItem: {
        borderBottomWidth: 0.5,
        borderBottomColor: t.cardBorder,
        paddingVertical: 6,
    },
    logItemText: { fontSize: 13, color: t.bodyText },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalBox: {
        backgroundColor: t.card,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxHeight: '85%',
    },
    modalTitle: { fontSize: 20, fontWeight: '600', color: t.cardTitle },
    inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4, marginTop: 8 },
    input: {
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: t.pageBackground,
        color: t.bodyText,
        marginBottom: 4,
    },
    recurBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: t.cardBorder,
        marginRight: 8,
        backgroundColor: t.chip,
    },
    recurBtnActive: { backgroundColor: t.buttonPrimary, borderColor: t.buttonPrimary },
    recurBtnText: { fontSize: 13, color: t.cardTitle },
    recurBtnTextActive: { color: t.buttonPrimaryText },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    cancelBtn: {
        backgroundColor: t.buttonNeutral,
        borderWidth: 1,
        borderColor: t.buttonNeutralBorder,
        padding: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
    confirmBtn: {
        backgroundColor: t.buttonPrimary,
        // Invisible border matching the fill so Cancel's outline doesn't
        // make the two buttons different heights.
        borderWidth: 1,
        borderColor: t.buttonPrimary,
        padding: 12,
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
        marginBottom: 10,
    },
    swipeDeleteText: {
        color: t.buttonDeleteText,
        fontWeight: '600',
        fontSize: 15,
    },
    // Quiet/settled recipe (#47): light = solid teal, dark = outlined gold.
    // Light's border matches the fill, so it's invisible there.
    backgroundBanner: {
        backgroundColor: t.stockedButton,
        borderWidth: 1,
        borderColor: t.stockedButtonBorder,
        padding: 10,
        marginHorizontal: 12,
        marginTop: 8,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backgroundBannerText: { color: t.stockedButtonText, fontWeight: '600', fontSize: 14, textAlign: 'center' },
    backgroundList: {
        marginHorizontal: 12,
        marginBottom: 8,
    },
    taskBtnRow: { flexDirection: 'row', alignItems: 'center' },
    // Green in BOTH themes (green means done, #48 rule) — deliberate light
    // change from the old bridge teal.
    doneBtn: {
        backgroundColor: t.buttonDone,
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginRight: 6,
    },
    doneBtnText: { color: t.buttonDoneText, fontSize: 13, fontWeight: '600' },
    editBtn: {
        backgroundColor: t.pageBackground,
        borderWidth: 0.5,
        borderColor: t.cardTitle,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    editBtnText: { color: t.cardTitle, fontSize: 13, fontWeight: '600' },
    headerBtn: {
        borderWidth: 1,
        borderColor: t.headerButton,
        paddingVertical: 2,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    headerBtnText: { color: t.headerButton, fontSize: 16, fontWeight: '600' },
});
