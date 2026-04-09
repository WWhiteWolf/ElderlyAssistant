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
type RecurType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface Reminder {
    id: string;
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
    notifId?: string;
}

interface Task {
    id: string;
    title: string;
    categoryId: string;
    priority: Priority;
    recurring: RecurType;
    dueDate: string;
    dueTime: string;
    reminders: Reminder[];
    completed: boolean;
    createdDate: string;
    completedDate?: string;
    notes: string;
}

interface LogEntry {
    id: string;
    taskTitle: string;
    completedDate: string;
    notes: string;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'c1', name: 'General', color: '#1a6e8a' },
    { id: 'c2', name: 'Health', color: '#2d9e8f' },
    { id: 'c3', name: 'Home', color: '#85c5ab' },
    { id: 'c4', name: 'Dog Day', color: '#e67e22' },
    { id: 'c5', name: 'Bills', color: '#8e44ad' },
    { id: 'c6', name: 'Writings', color: '#c0392b' },
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
    const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'category'>('priority');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [showAddTask, setShowAddTask] = useState(false);
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [editTask, setEditTask] = useState<Task | null>(null);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('c1');
    const [newPriority, setNewPriority] = useState<Priority>('Normal');
    const [newRecurring, setNewRecurring] = useState<RecurType>('none');
    const [newDueDate, setNewDueDate] = useState('');
    const [newDueTime, setNewDueTime] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('#1a6e8a');
    const [newTaskType, setNewTaskType] = useState<'scheduled' | 'background'>('scheduled');
    const [newReminders, setNewReminders] = useState<Reminder[]>([]);
    const [reminderAmount, setReminderAmount] = useState('');
    const [reminderUnit, setReminderUnit] = useState<'minutes' | 'hours' | 'days'>('hours');
    const [showBackgroundTasks, setShowBackgroundTasks] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    interface Task {
        id: string;
        title: string;
        categoryId: string;
        priority: Priority;
        recurring: RecurType;
        taskType: 'scheduled' | 'background';
        dueDate: string;
        dueTime: string;
        reminders: Reminder[];
        completed: boolean;
        createdDate: string;
        completedDate?: string;
        notes: string;
    }

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

    const resetForm = () => {
        setNewTitle('');
        setNewCategory('c1');
        setNewPriority('Normal');
        setNewRecurring('none');
        setNewTaskType('scheduled');
        setNewDueDate('');
        setNewDueTime('');
        setNewNotes('');
        setNewReminders([]);
        setReminderAmount('');
        setReminderUnit('hours');
        setEditTask(null);
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
            recurring: newRecurring,
            taskType: newTaskType,
            dueDate: newDueDate,
            dueTime: newDueTime,
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

    const updateTask = () => {
        if (!editTask || !newTitle.trim()) return;
        const updated = tasks.map(t =>
            t.id === editTask.id
                ? {
                    ...t,
                    title: newTitle.trim(),
                    categoryId: newCategory,
                    priority: newPriority,
                    recurring: newRecurring,
                    taskType: newTaskType,
                    dueDate: newDueDate,
                    dueTime: newDueTime,
                    reminders: newReminders,
                    notes: newNotes,
                }
                : t
        );
        saveTasks(updated);
        cancelReminders(editTask.id);
        const updatedTask = updated.find(t => t.id === editTask.id);
        if (updatedTask) scheduleReminders(updatedTask);
        resetForm();
        setShowAddTask(false);
    };

    const deleteTask = (id: string) => {
        Alert.alert('Delete Task', 'Remove this task?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
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
                    const logEntry: LogEntry = {
                        id: Date.now().toString(),
                        taskTitle: task.title,
                        completedDate,
                        notes: task.notes,
                    };
                    const updatedLog = [logEntry, ...log].slice(0, 100);
                    saveLog(updatedLog);
                    if (task.recurring !== 'none') {
                        const updated = tasks.map(t =>
                            t.id === task.id ? { ...t, completed: false } : t
                        );
                        saveTasks(updated);
                        scheduleReminders({ ...task, completed: false });
                    } else {
                        saveTasks(tasks.filter(t => t.id !== task.id));
                    }
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
        setNewRecurring(task.recurring);
        setNewTaskType(task.taskType || 'scheduled');
        setNewDueDate(task.dueDate);
        setNewDueTime(task.dueTime);
        setNewNotes(task.notes);
        setNewReminders(task.reminders || []);
        setReminderAmount('');
        setReminderUnit('hours');
        setShowAddTask(true);
    };

    const getSortedTasks = () => {
        let filtered = filterCategory === 'all'
            ? tasks.filter(t => t.taskType !== 'background')
            : tasks.filter(t => t.categoryId === filterCategory && t.taskType !== 'background');

        filtered = filtered.filter(t => !t.completed);

        if (sortBy === 'priority') {
            const order: Record<Priority, number> = { Urgent: 0, Normal: 1, Someday: 2 };
            return [...filtered].sort((a, b) => order[a.priority] - order[b.priority]);
        } else if (sortBy === 'dueDate') {
            return [...filtered].sort((a, b) => {
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            });
        } else {
            return [...filtered].sort((a, b) => a.categoryId.localeCompare(b.categoryId));
        }
    };

    const getCategoryName = (id: string) => {
        return categories.find(c => c.id === id)?.name || 'General';
    };

    const getCategoryColor = (id: string) => {
        return categories.find(c => c.id === id)?.color || Colors.primary;
    };

    const scheduleReminders = async (task: Task) => {
        console.log('scheduleReminders called', task.taskType, task.dueDate, task.reminders.length);
        if (task.taskType === 'background' || !task.dueDate || task.reminders.length === 0) return;
        for (const reminder of task.reminders) {
            const [month, day, year] = task.dueDate.split('/');
            const fullYear = year.length === 2 ? `20${year}` : year;
            const dueDateTime = new Date(`${fullYear}-${month}-${day}T${task.dueTime || '09:00'}:00`);
            let msOffset = 0;
            if (reminder.unit === 'minutes') msOffset = reminder.amount * 60 * 1000;
            if (reminder.unit === 'hours') msOffset = reminder.amount * 60 * 60 * 1000;
            if (reminder.unit === 'days') msOffset = reminder.amount * 24 * 60 * 60 * 1000;
            const fireTime = new Date(dueDateTime.getTime() - msOffset);
            console.log('Fire time:', fireTime, 'Now:', new Date(), 'Future?', fireTime > new Date());
            if (fireTime > new Date()) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: `📋 Reminder: ${task.title}`,
                        body: task.dueDate ? `Due: ${task.dueDate}${task.dueTime ? ' at ' + task.dueTime : ''}` : '',
                        data: { taskId: task.id },
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
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 8,
                minute: 0,
            } as Notifications.DailyTriggerInput,
        });
    };

    const addReminder = () => {
        const amount = parseInt(reminderAmount);
        if (!amount || isNaN(amount) || amount <= 0) {
            Alert.alert('Invalid', 'Please enter a valid number.');
            return;
        }
        const reminder: Reminder = {
            id: Date.now().toString(),
            amount,
            unit: reminderUnit,
        };
        setNewReminders([...newReminders, reminder]);
        setReminderAmount('');
    };

    const removeReminder = (id: string) => {
        setNewReminders(newReminders.filter(r => r.id !== id));
    };


    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.backBtn}>
                        <Text style={styles.backText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>To-Do</Text>
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

                <View style={styles.sortRow}>
                    <Text style={styles.sortLabel}>Sort:</Text>
                    {(['priority', 'dueDate', 'category'] as const).map(s => (
                        <TouchableOpacity
                            key={s}
                            style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
                            onPress={() => setSortBy(s)}
                        >
                            <Text style={[styles.sortBtnText, sortBy === s && styles.sortBtnTextActive]}>
                                {s === 'priority' ? 'Priority' : s === 'dueDate' ? 'Due Date' : 'Category'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
                                onLongPress={() => completeTask(task)}
                            >
                                <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                                <View style={styles.taskContent}>
                                    <View style={styles.taskTopRow}>
                                        <Text style={styles.taskTitle}>{task.title}</Text>
                                        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(task.categoryId) }]}>
                                            <Text style={styles.categoryBadgeText}>{getCategoryName(task.categoryId)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.taskBottomRow}>
                                        <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[task.priority] }]}>{task.priority}</Text>
                                        <Text style={[styles.priorityLabel, { color: getCategoryColor(task.categoryId) }]}>{getCategoryName(task.categoryId)}</Text>
                                        {task.dueDate ? <Text style={styles.dueDateText}>Due: {task.dueDate}</Text> : null}
                                        {task.recurring !== 'none' ? <Text style={styles.recurringText}>🔁 {task.recurring}</Text> : null}
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
                        <TouchableOpacity
                            style={styles.taskCard}
                            onPress={() => openEditTask(task)}
                            onLongPress={() => completeTask(task)}
                        >
                            <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLORS[task.priority] }]} />
                            <View style={styles.taskContent}>
                                <View style={styles.taskTopRow}>
                                    <Text style={styles.taskTitle}>{task.title}</Text>
                                    <Text style={styles.pressToEdit}>Press to Edit</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={styles.taskBottomRow}>
                                        <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[task.priority] }]}>{task.priority}</Text>
                                        <Text style={[styles.priorityLabel, { color: getCategoryColor(task.categoryId) }]}>{getCategoryName(task.categoryId)}</Text>
                                        {task.dueDate ? <Text style={styles.dueDateText}>Due: {task.dueDate}</Text> : null}
                                        {task.recurring !== 'none' ? <Text style={styles.recurringText}>🔁 {task.recurring}</Text> : null}                                    </View>

                                </View>
                                {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}
                            </View>
                        </TouchableOpacity>
                    </Swipeable>
                ))}
            </ScrollView>

            <View style={styles.fabRow}>
                <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowLog(!showLog)}>
                    <Text style={styles.fabText}>📋 Log</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowAddCategory(true)}>
                    <Text style={styles.fabText}>+ Category</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setShowAddTask(true); }}>
                    <Text style={styles.fabMainText}>+ Task</Text>
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
                                <Text style={styles.logItemText}>{l.completedDate} | {l.taskTitle}{l.notes ? ` | ${l.notes}` : ''}</Text>
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
                                                style={[styles.catSelectBtn, newCategory === cat.id && { backgroundColor: cat.color }]}
                                                onPress={() => setNewCategory(cat.id)}
                                            >
                                                <Text style={[styles.catSelectText, newCategory === cat.id && { color: '#fff' }]}>{cat.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

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

                                    <Text style={styles.inputLabel}>Recurring</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                        {(['none', 'daily', 'weekly', 'monthly', 'yearly'] as RecurType[]).map(r => (
                                            <TouchableOpacity
                                                key={r}
                                                style={[styles.recurBtn, newRecurring === r && styles.recurBtnActive]}
                                                onPress={() => setNewRecurring(r)}
                                            >
                                                <Text style={[styles.recurBtnText, newRecurring === r && styles.recurBtnTextActive]}>
                                                    {r === 'none' ? 'One-time' : r.charAt(0).toUpperCase() + r.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <Text style={styles.inputLabel}>Due Date (MM/DD/YY)</Text>
                                    <TextInput style={styles.input} value={newDueDate} onChangeText={setNewDueDate} placeholder="e.g. 04/15/26" keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>Due Time (optional)</Text>
                                    <TextInput style={styles.input} value={newDueTime} onChangeText={setNewDueTime} placeholder="e.g. 09:00" keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                                    <TextInput style={styles.input} value={newNotes} onChangeText={setNewNotes} placeholder="Any details..." multiline />

                                    <Text style={styles.inputLabel}>Task Type</Text>
                                    <View style={styles.priorityRow}>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, newTaskType === 'scheduled' && { backgroundColor: Colors.primary }]}
                                            onPress={() => setNewTaskType('scheduled')}
                                        >
                                            <Text style={[styles.priorityBtnText, newTaskType === 'scheduled' && { color: '#fff' }]}>Scheduled</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, newTaskType === 'background' && { backgroundColor: Colors.bridge }]}
                                            onPress={() => setNewTaskType('background')}
                                        >
                                            <Text style={[styles.priorityBtnText, newTaskType === 'background' && { color: '#fff' }]}>Background</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {newTaskType === 'scheduled' && (
                                        <>
                                            <Text style={styles.inputLabel}>Reminders</Text>
                                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                                                <TextInput
                                                    style={[styles.input, { flex: 1 }]}
                                                    value={reminderAmount}
                                                    onChangeText={setReminderAmount}
                                                    placeholder="Amount"
                                                    keyboardType="numeric"
                                                />
                                                {(['minutes', 'hours', 'days'] as const).map(u => (
                                                    <TouchableOpacity
                                                        key={u}
                                                        style={[styles.recurBtn, reminderUnit === u && styles.recurBtnActive]}
                                                        onPress={() => setReminderUnit(u)}
                                                    >
                                                        <Text style={[styles.recurBtnText, reminderUnit === u && styles.recurBtnTextActive]}>{u}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                                <TouchableOpacity style={styles.confirmBtn} onPress={addReminder}>
                                                    <Text style={styles.confirmBtnText}>+</Text>
                                                </TouchableOpacity>
                                            </View>
                                            {newReminders.map(r => (
                                                <View key={r.id} style={styles.reminderRow}>
                                                    <Text style={styles.reminderText}>{r.amount} {r.unit} before</Text>
                                                    <TouchableOpacity onPress={() => removeReminder(r.id)}>
                                                        <Text style={styles.catDeleteBtn}>✕</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
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
                            {categories.filter(c => !['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].includes(c.id)).map(cat => (
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
    backBtn: { marginRight: 16 },
    backText: { color: Colors.lightBlue, fontSize: 16 },
    title: {
        fontSize: 26,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
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
    sortRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 8,
    },
    sortLabel: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
    sortBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.lightBlue,
        backgroundColor: Colors.white,
    },
    sortBtnActive: { backgroundColor: Colors.bridge, borderColor: Colors.bridge },
    sortBtnText: { fontSize: 12, color: Colors.primary },
    sortBtnTextActive: { color: Colors.white },
    scroll: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
    taskCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        overflow: 'hidden',
    },
    priorityBar: { width: 6 },
    taskContent: { flex: 1, padding: 12 },
    taskTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
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
    recurringText: { fontSize: 12, color: Colors.bridge },
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
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: Colors.background,
        borderRadius: 8,
        marginBottom: 4,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    reminderText: { fontSize: 14, color: Colors.primary },
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
});
