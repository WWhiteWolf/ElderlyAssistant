import AsyncStorage from '@react-native-async-storage/async-storage';
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
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';

type TaskStatus = 'Active' | 'On Hold' | 'Completed';
type Priority = 'Urgent' | 'Normal' | 'Someday';

interface ProjectTask {
    id: string;
    title: string;
    priority: Priority;
    status: TaskStatus;
    onHoldNote: string;
    dueDate: string;
    notes: string;
    hasReminder: boolean;
    reminderDate: string;
    reminderTime: string;
    completedDate?: string;
    todoLinkId?: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    startDate: string;
    onHold: boolean;
    onHoldNote: string;
    tasks: ProjectTask[];
    completedDate?: string;
}

interface LogEntry {
    id: string;
    projectName: string;
    taskTitle?: string;
    type: 'project' | 'task';
    completedDate: string;
    notes: string;
}

// Priority colors come from the active theme (#50) — the same keys and
// pattern as todo.tsx (#49). The text maps are for the selected form
// buttons — dark's gold/teal fills need dark text.
const priorityColors = (t: Theme): Record<Priority, string> => ({
    Urgent: t.priorityUrgent,
    Normal: t.priorityNormal,
    Someday: t.prioritySomeday,
});
const priorityTextColors = (t: Theme): Record<Priority, string> => ({
    Urgent: t.priorityUrgentText,
    Normal: t.priorityNormalText,
    Someday: t.prioritySomedayText,
});
// Status colors (#50): Active teal (brighter in dark), On Hold's orange
// in BOTH themes, Completed reuses Someday's grey.
const statusColors = (t: Theme): Record<TaskStatus, string> => ({
    Active: t.statusActive,
    'On Hold': t.statusOnHold,
    Completed: t.prioritySomeday,
});
const statusTextColors = (t: Theme): Record<TaskStatus, string> => ({
    Active: t.statusActiveText,
    'On Hold': t.statusOnHoldText,
    Completed: t.prioritySomedayText,
});
export default function PlannerScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const PRIORITY_COLORS = priorityColors(theme);
    const PRIORITY_TEXT_COLORS = priorityTextColors(theme);
    const STATUS_COLORS = statusColors(theme);
    const STATUS_TEXT_COLORS = statusTextColors(theme);
    const [projects, setProjects] = useState<Project[]>([]);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [showAddProject, setShowAddProject] = useState(false);
    const [showAddTask, setShowAddTask] = useState(false);
    const [showLog, setShowLog] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [editTask, setEditTask] = useState<ProjectTask | null>(null);

    const [newProjectName, setNewProjectName] = useState('');
    const [newProjectDesc, setNewProjectDesc] = useState('');
    const [newProjectStartDate, setNewProjectStartDate] = useState('');
    const [newProjectOnHold, setNewProjectOnHold] = useState(false);
    const [newProjectOnHoldNote, setNewProjectOnHoldNote] = useState('');

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Priority>('Normal');
    const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('Active');
    const [newTaskOnHoldNote, setNewTaskOnHoldNote] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskNotes, setNewTaskNotes] = useState('');
    const [newTaskHasReminder, setNewTaskHasReminder] = useState(false);
    const [newTaskReminderDate, setNewTaskReminderDate] = useState('');
    const [newTaskReminderTime, setNewTaskReminderTime] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const savedProjects = await AsyncStorage.getItem('planner_projects');
            const savedLog = await AsyncStorage.getItem('planner_log');
            if (savedProjects) setProjects(JSON.parse(savedProjects));
            if (savedLog) setLog(JSON.parse(savedLog));
        } catch (e) {
            console.error(e);
        }
    };

    const saveProjects = async (p: Project[]) => {
        setProjects(p);
        await AsyncStorage.setItem('planner_projects', JSON.stringify(p));
    };

    const saveLog = async (l: LogEntry[]) => {
        setLog(l);
        await AsyncStorage.setItem('planner_log', JSON.stringify(l));
    };

    const resetProjectForm = () => {
        setNewProjectName('');
        setNewProjectDesc('');
        setNewProjectStartDate('');
        setNewProjectOnHold(false);
        setNewProjectOnHoldNote('');
        setEditProject(null);
    };

    const resetTaskForm = () => {
        setNewTaskTitle('');
        setNewTaskPriority('Normal');
        setNewTaskStatus('Active');
        setNewTaskOnHoldNote('');
        setNewTaskDueDate('');
        setNewTaskNotes('');
        setNewTaskHasReminder(false);
        setNewTaskReminderDate('');
        setNewTaskReminderTime('');
        setEditTask(null);
    };

    const addProject = () => {
        if (!newProjectName.trim()) {
            Alert.alert('Missing Name', 'Please enter a project name.');
            return;
        }
        const project: Project = {
            id: Date.now().toString(),
            name: newProjectName.trim(),
            description: newProjectDesc.trim(),
            startDate: newProjectStartDate || new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' }),
            onHold: newProjectOnHold,
            onHoldNote: newProjectOnHoldNote,
            tasks: [],
        };
        saveProjects([...projects, project]);
        resetProjectForm();
        setShowAddProject(false);
    };

    const updateProject = () => {
        if (!editProject || !newProjectName.trim()) return;
        const updated = projects.map(p =>
            p.id === editProject.id
                ? {
                    ...p,
                    name: newProjectName.trim(),
                    description: newProjectDesc.trim(),
                    startDate: newProjectStartDate,
                    onHold: newProjectOnHold,
                    onHoldNote: newProjectOnHoldNote,
                }
                : p
        );
        saveProjects(updated);
        if (selectedProject?.id === editProject.id) {
            setSelectedProject(updated.find(p => p.id === editProject.id) || null);
        }
        resetProjectForm();
        setShowAddProject(false);
    };

    const deleteProject = (id: string) => {
        Alert.alert('Delete Project', 'Remove this project and all its tasks?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    saveProjects(projects.filter(p => p.id !== id));
                    if (selectedProject?.id === id) setSelectedProject(null);
                },
            },
        ]);
    };

    const completeProject = (project: Project) => {
        Alert.alert('Complete Project', `Mark "${project.name}" as done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Done', onPress: () => {
                    const completedDate = new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
                    const logEntry: LogEntry = {
                        id: Date.now().toString(),
                        projectName: project.name,
                        type: 'project',
                        completedDate,
                        notes: project.description,
                    };
                    saveLog([logEntry, ...log].slice(0, 100));
                    saveProjects(projects.filter(p => p.id !== project.id));
                    setSelectedProject(null);
                },
            },
        ]);
    };

    const openEditProject = (project: Project) => {
        setEditProject(project);
        setNewProjectName(project.name);
        setNewProjectDesc(project.description);
        setNewProjectStartDate(project.startDate);
        setNewProjectOnHold(project.onHold);
        setNewProjectOnHoldNote(project.onHoldNote);
        setShowAddProject(true);
    };

    const addTask = () => {
        if (!newTaskTitle.trim() || !selectedProject) return;
        const task: ProjectTask = {
            id: Date.now().toString(),
            title: newTaskTitle.trim(),
            priority: newTaskPriority,
            status: newTaskStatus,
            onHoldNote: newTaskOnHoldNote,
            dueDate: newTaskDueDate,
            notes: newTaskNotes,
            hasReminder: newTaskHasReminder,
            reminderDate: newTaskReminderDate,
            reminderTime: newTaskReminderTime,
        };
        const updatedProject = { ...selectedProject, tasks: [...selectedProject.tasks, task] };
        const updatedProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p);
        saveProjects(updatedProjects);
        setSelectedProject(updatedProject);
        resetTaskForm();
        setShowAddTask(false);
    };

    const updateTask = () => {
        if (!editTask || !selectedProject || !newTaskTitle.trim()) return;
        if (newTaskStatus === 'Completed') {
            completeTask({ ...editTask, title: newTaskTitle.trim(), notes: newTaskNotes });
            setShowAddTask(false);
            return;
        }
        const updatedTask: ProjectTask = {
            ...editTask,
            title: newTaskTitle.trim(),
            priority: newTaskPriority,
            status: newTaskStatus,
            onHoldNote: newTaskOnHoldNote,
            dueDate: newTaskDueDate,
            notes: newTaskNotes,
            hasReminder: newTaskHasReminder,
            reminderDate: newTaskReminderDate,
            reminderTime: newTaskReminderTime,
        };
        const updatedTasks = selectedProject.tasks.map(t => t.id === editTask.id ? updatedTask : t);
        const updatedProject = { ...selectedProject, tasks: updatedTasks };
        const updatedProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p);
        saveProjects(updatedProjects);
        setSelectedProject(updatedProject);
        resetTaskForm();
        setShowAddTask(false);
    };

    const deleteTask = (taskId: string) => {
        if (!selectedProject) return;
        Alert.alert('Delete Task', 'Remove this task?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updatedProject = { ...selectedProject, tasks: selectedProject.tasks.filter(t => t.id !== taskId) };
                    const updatedProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p);
                    saveProjects(updatedProjects);
                    setSelectedProject(updatedProject);
                },
            },
        ]);
    };

    const completeTask = (task: ProjectTask) => {
        if (!selectedProject) return;
        Alert.alert('Complete Task', `Mark "${task.title}" as done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Done', onPress: () => {
                    const completedDate = new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
                    const logEntry: LogEntry = {
                        id: Date.now().toString(),
                        projectName: selectedProject.name,
                        taskTitle: task.title,
                        type: 'task',
                        completedDate,
                        notes: task.notes,
                    };
                    saveLog([logEntry, ...log].slice(0, 100));
                    const updatedTasks = selectedProject.tasks.filter(t => t.id !== task.id);
                    const updatedProject = { ...selectedProject, tasks: updatedTasks };
                    const updatedProjects = projects.map(p => p.id === selectedProject.id ? updatedProject : p);
                    saveProjects(updatedProjects);
                    setSelectedProject(updatedProject);
                },
            },
        ]);
    };

    const openEditTask = (task: ProjectTask) => {
        setEditTask(task);
        setNewTaskTitle(task.title);
        setNewTaskPriority(task.priority);
        setNewTaskStatus(task.status);
        setNewTaskOnHoldNote(task.onHoldNote);
        setNewTaskDueDate(task.dueDate);
        setNewTaskNotes(task.notes);
        setNewTaskHasReminder(task.hasReminder);
        setNewTaskReminderDate(task.reminderDate);
        setNewTaskReminderTime(task.reminderTime);
        setShowAddTask(true);
    };

    const getProgress = (project: Project) => {
        if (project.tasks.length === 0) return 0;
        const completed = project.tasks.filter(t => t.status === 'Completed').length;
        return Math.round((completed / project.tasks.length) * 100);
    };
    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Project Planner</Text>
                    <View style={styles.settingsBtn} />
                </View>
            </SafeAreaView>

            <Bridge />

            {!selectedProject ? (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
                    {projects.length === 0 && (
                        <Text style={styles.emptyText}>No projects yet. Tap + to start one.</Text>
                    )}
                    {projects.map(project => (
                        <Swipeable
                            key={project.id}
                            renderRightActions={() => (
                                <TouchableOpacity
                                    style={styles.swipeDelete}
                                    onPress={() => deleteProject(project.id)}
                                >
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <TouchableOpacity
                                style={styles.projectCard}
                                onPress={() => setSelectedProject(project)}
                                onLongPress={() => openEditProject(project)}
                            >
                                {project.onHold && (
                                    <View style={styles.onHoldBadge}>
                                        <Text style={styles.onHoldBadgeText}>ON HOLD{project.onHoldNote ? ` — ${project.onHoldNote}` : ''}</Text>
                                    </View>
                                )}
                                <View style={styles.projectCardTop}>
                                    <Text style={styles.projectName}>{project.name}</Text>
                                    <Text style={styles.projectProgress}>{getProgress(project)}%</Text>
                                </View>
                                {project.description ? <Text style={styles.projectDesc}>{project.description}</Text> : null}
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${getProgress(project)}%` as any }]} />
                                </View>
                                <Text style={styles.projectMeta}>
                                    Started: {project.startDate} · {project.tasks.length} task{project.tasks.length !== 1 ? 's' : ''}
                                </Text>
                            </TouchableOpacity>
                        </Swipeable>
                    ))}
                </ScrollView>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
                    <TouchableOpacity style={styles.backToProjects} onPress={() => setSelectedProject(null)}>
                        <Text style={styles.backToProjectsText}>← All Projects</Text>
                    </TouchableOpacity>

                    <View style={styles.projectDetailHeader}>
                        {selectedProject.onHold && (
                            <View style={styles.onHoldBadge}>
                                <Text style={styles.onHoldBadgeText}>ON HOLD{selectedProject.onHoldNote ? ` — ${selectedProject.onHoldNote}` : ''}</Text>
                            </View>
                        )}
                        {selectedProject.description ? <Text style={styles.projectDesc}>{selectedProject.description}</Text> : null}
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${getProgress(selectedProject)}%` as any }]} />
                        </View>
                        <Text style={styles.projectMeta}>
                            {getProgress(selectedProject)}% complete · {selectedProject.tasks.filter(t => t.status === 'Completed').length}/{selectedProject.tasks.length} tasks
                        </Text>
                        <View style={styles.projectActions}>
                            <TouchableOpacity style={styles.projectActionBtn} onPress={() => openEditProject(selectedProject)}>
                                <Text style={styles.projectActionText}>Edit Project</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.projectActionBtn, styles.completeBtn]} onPress={() => completeProject(selectedProject)}>
                                <Text style={[styles.projectActionText, styles.completeBtnText]}>Complete Project</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {selectedProject.tasks.length === 0 && (
                        <Text style={styles.emptyText}>No tasks yet. Tap + to add one.</Text>
                    )}

                    {selectedProject.tasks.map(task => (
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
                                        <TouchableOpacity onPress={() => openEditTask(task)} style={styles.editBtn} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.taskBottomRow}>
                                        <Text style={[styles.priorityLabel, { color: PRIORITY_COLORS[task.priority] }]}>{task.priority}</Text>
                                        <Text style={[styles.priorityLabel, { color: STATUS_COLORS[task.status] }]}>{task.status}</Text>
                                        {task.dueDate ? <Text style={styles.dueDateText}>Due: {task.dueDate}</Text> : null}
                                        {task.hasReminder ? <Text style={styles.reminderIndicator}>🔔 {task.reminderDate}</Text> : null}
                                    </View>
                                    {task.status === 'On Hold' && task.onHoldNote ? (
                                        <Text style={styles.onHoldNote}>On Hold: {task.onHoldNote}</Text>
                                    ) : null}
                                    {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}
                                </View>
                            </View>
                        </Swipeable>
                    ))}
                </ScrollView>
            )}

            <View style={styles.fabRow}>
                <TouchableOpacity style={styles.fabSecondary} onPress={() => setShowLog(!showLog)}>
                    <Text style={styles.fabText}>📋 Log</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fab} onPress={() => {
                    if (selectedProject) {
                        resetTaskForm();
                        setShowAddTask(true);
                    } else {
                        resetProjectForm();
                        setShowAddProject(true);
                    }
                }}>
                    <Text style={styles.fabMainText}>{selectedProject ? '+ Task' : '+ Project'}</Text>
                </TouchableOpacity>
            </View>

            {showLog && (
                <View style={styles.logOverlay}>
                    <View style={styles.logHeader}>
                        <Text style={styles.logTitle}>Completed Log</Text>
                        <TouchableOpacity onPress={() => setShowLog(false)}>
                            <Text style={styles.logClose}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {log.length === 0 && <Text style={styles.emptyText}>Nothing completed yet.</Text>}
                        {log.map(l => (
                            <View key={l.id} style={styles.logItem}>
                                <Text style={styles.logItemText}>
                                    {l.completedDate} | {l.type === 'project' ? '📋 ' : '✅ '}{l.projectName}{l.taskTitle ? ` → ${l.taskTitle}` : ''}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}

            {showAddProject && (
                <Modal transparent animationType="slide" visible={showAddProject}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.modalTitle}>{editProject ? 'Edit Project' : 'New Project'}</Text>
                                        <Text style={{ fontSize: 13, color: theme.settingValue, fontStyle: 'italic' }}>Tap background, or Scroll ↓</Text>
                                    </View>
                                    <View style={styles.modalBtns}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetProjectForm(); setShowAddProject(false); }}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.confirmBtn} onPress={editProject ? updateProject : addProject}>
                                            <Text style={styles.confirmBtnText}>{editProject ? 'Update' : 'Add'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.inputLabel}>Project Name</Text>
                                    <TextInput style={styles.input} value={newProjectName} onChangeText={setNewProjectName} placeholder="What is this project?" placeholderTextColor={theme.mutedText} autoFocus={true} />

                                    <Text style={styles.inputLabel}>Description (optional)</Text>
                                    <TextInput style={styles.input} value={newProjectDesc} onChangeText={setNewProjectDesc} placeholder="Brief description..." placeholderTextColor={theme.mutedText} multiline />

                                    <Text style={styles.inputLabel}>Start Date (MM/DD/YY)</Text>
                                    <TextInput style={styles.input} value={newProjectStartDate} onChangeText={setNewProjectStartDate} placeholder="e.g. 04/10/26" placeholderTextColor={theme.mutedText} keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>On Hold?</Text>
                                    <View style={styles.priorityRow}>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, !newProjectOnHold && { backgroundColor: theme.buttonPrimary }]}
                                            onPress={() => setNewProjectOnHold(false)}
                                        >
                                            <Text style={[styles.priorityBtnText, !newProjectOnHold && { color: theme.buttonPrimaryText }]}>Active</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, newProjectOnHold && { backgroundColor: theme.statusOnHold }]}
                                            onPress={() => setNewProjectOnHold(true)}
                                        >
                                            <Text style={[styles.priorityBtnText, newProjectOnHold && { color: theme.statusOnHoldText }]}>On Hold</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {newProjectOnHold && (
                                        <>
                                            <Text style={styles.inputLabel}>Reason for Hold</Text>
                                            <TextInput style={styles.input} value={newProjectOnHoldNote} onChangeText={setNewProjectOnHoldNote} placeholder="Why is this on hold?" placeholderTextColor={theme.mutedText} />
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}

            {showAddTask && (
                <Modal transparent animationType="slide" visible={showAddTask}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={styles.modalTitle}>{editTask ? 'Edit Task' : 'New Task'}</Text>
                                        <Text style={{ fontSize: 13, color: theme.settingValue, fontStyle: 'italic' }}>Tap background, or Scroll ↓</Text>
                                    </View>
                                    <View style={styles.modalBtns}>
                                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetTaskForm(); setShowAddTask(false); }}>
                                            <Text style={styles.cancelBtnText}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.confirmBtn} onPress={editTask ? updateTask : addTask}>
                                            <Text style={styles.confirmBtnText}>{editTask ? 'Update' : 'Add'}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.inputLabel}>Task Title</Text>
                                    <TextInput style={styles.input} value={newTaskTitle} onChangeText={setNewTaskTitle} placeholder="What needs to be done?" placeholderTextColor={theme.mutedText} autoFocus={true} />

                                    <Text style={styles.inputLabel}>Priority</Text>
                                    <View style={styles.priorityRow}>
                                        {(['Urgent', 'Normal', 'Someday'] as Priority[]).map(p => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.priorityBtn, newTaskPriority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                                                onPress={() => setNewTaskPriority(p)}
                                            >
                                                <Text style={[styles.priorityBtnText, newTaskPriority === p && { color: PRIORITY_TEXT_COLORS[p] }]}>{p}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={styles.inputLabel}>Status</Text>
                                    <View style={styles.priorityRow}>
                                        {(['Active', 'On Hold', 'Completed'] as TaskStatus[]).map(s => (
                                            <TouchableOpacity
                                                key={s}
                                                style={[styles.priorityBtn, newTaskStatus === s && { backgroundColor: STATUS_COLORS[s] }]}
                                                onPress={() => setNewTaskStatus(s)}
                                            >
                                                <Text style={[styles.priorityBtnText, newTaskStatus === s && { color: STATUS_TEXT_COLORS[s] }]}>{s === 'Completed' ? 'Done' : s}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {newTaskStatus === 'On Hold' && (
                                        <>
                                            <Text style={styles.inputLabel}>Reason for Hold</Text>
                                            <TextInput style={styles.input} value={newTaskOnHoldNote} onChangeText={setNewTaskOnHoldNote} placeholder="Why is this on hold?" placeholderTextColor={theme.mutedText} />
                                        </>
                                    )}

                                    <Text style={styles.inputLabel}>Due Date (MM/DD/YY)</Text>
                                    <TextInput style={styles.input} value={newTaskDueDate} onChangeText={setNewTaskDueDate} placeholder="e.g. 04/15/26" placeholderTextColor={theme.mutedText} keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                                    <TextInput style={styles.input} value={newTaskNotes} onChangeText={setNewTaskNotes} placeholder="Any details..." placeholderTextColor={theme.mutedText} multiline />

                                    <Text style={styles.inputLabel}>Reminder?</Text>
                                    <View style={styles.priorityRow}>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, !newTaskHasReminder && { backgroundColor: theme.buttonPrimary }]}
                                            onPress={() => setNewTaskHasReminder(false)}
                                        >
                                            <Text style={[styles.priorityBtnText, !newTaskHasReminder && { color: theme.buttonPrimaryText }]}>No</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, newTaskHasReminder && { backgroundColor: theme.statusActive }]}
                                            onPress={() => setNewTaskHasReminder(true)}
                                        >
                                            <Text style={[styles.priorityBtnText, newTaskHasReminder && { color: theme.statusActiveText }]}>Yes</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {newTaskHasReminder && (
                                        <>
                                            <Text style={styles.inputLabel}>Reminder Date (MM/DD/YY)</Text>
                                            <TextInput style={styles.input} value={newTaskReminderDate} onChangeText={setNewTaskReminderDate} placeholder="e.g. 04/14/26" placeholderTextColor={theme.mutedText} keyboardType="numbers-and-punctuation" />
                                            <Text style={styles.inputLabel}>Reminder Time (HH:MM)</Text>
                                            <TextInput style={styles.input} value={newTaskReminderTime} onChangeText={setNewTaskReminderTime} placeholder="e.g. 09:00" placeholderTextColor={theme.mutedText} keyboardType="numbers-and-punctuation" />
                                        </>
                                    )}
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
        paddingBottom: 8,
    },
    settingsBtn: { width: 70, alignItems: 'flex-end' },
    title: {
        fontSize: 24,
        fontWeight: '500',
        color: t.titleText,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        flex: 1,
        textAlign: 'center',
    },
    scroll: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: t.mutedText, marginTop: 40, fontSize: 16 },
    projectCard: {
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    onHoldBadge: {
        backgroundColor: t.statusOnHold,
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    onHoldBadgeText: { color: t.statusOnHoldText, fontSize: 11, fontWeight: '600' },
    projectCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    projectName: { fontSize: 18, fontWeight: '600', color: t.cardTitle, flex: 1 },
    projectProgress: { fontSize: 16, fontWeight: '600', color: t.settingValue },
    projectDesc: { fontSize: 13, color: t.mutedText, marginBottom: 8, fontStyle: 'italic' },
    progressBar: {
        height: 6,
        backgroundColor: t.progressTrack,
        borderRadius: 3,
        marginVertical: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: 6,
        backgroundColor: t.bridge,
        borderRadius: 3,
    },
    projectMeta: { fontSize: 12, color: t.mutedText, marginTop: 4 },
    backToProjects: {
        paddingVertical: 10,
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    backToProjectsText: { color: t.cardTitle, fontSize: 16, fontWeight: '500' },
    projectDetailHeader: {
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    projectActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    projectActionBtn: {
        flex: 1,
        backgroundColor: t.buttonPrimary,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: t.buttonPrimary,
        alignItems: 'center',
    },
    projectActionText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 14 },
    completeBtn: {
        backgroundColor: t.stockedButton,
        borderColor: t.stockedButtonBorder,
    },
    completeBtnText: { color: t.stockedButtonText },
    taskCard: {
        flexDirection: 'row',
        backgroundColor: t.card,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
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
    taskTitle: { fontSize: 16, fontWeight: '600', color: t.bodyText, flex: 1, marginRight: 8 },
    onHoldNote: { fontSize: 12, color: t.statusOnHold, marginBottom: 4, fontStyle: 'italic' },
    taskBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    priorityLabel: { fontSize: 12, fontWeight: '600' },
    dueDateText: { fontSize: 12, color: t.mutedText },
    reminderIndicator: { fontSize: 12, color: t.settingValue },
    taskNotes: { fontSize: 12, color: t.mutedText, marginTop: 4, fontStyle: 'italic' },
    fabRow: {
        position: 'absolute',
        bottom: 20,
        right: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    fab: {
        backgroundColor: t.buttonPrimary,
        borderWidth: 1.5,
        borderColor: t.buttonPrimary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabMainText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 16 },
    fabSecondary: {
        backgroundColor: t.stockedButton,
        borderWidth: 1.5,
        borderColor: t.stockedButtonBorder,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 30,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabText: { color: t.stockedButtonText, fontWeight: '600', fontSize: 14 },
    logOverlay: {
        position: 'absolute',
        bottom: 70,
        left: 12,
        right: 12,
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 16,
        maxHeight: 300,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
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
    logTitle: { fontSize: 16, fontWeight: '600', color: t.cardTitle },
    logClose: { fontSize: 18, color: t.mutedText },
    logItem: {
        borderBottomWidth: 0.5,
        borderBottomColor: t.progressTrack,
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
    priorityRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    priorityBtn: {
        flex: 1,
        padding: 8,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: t.cardBorder,
        alignItems: 'center',
    },
    priorityBtnText: { fontSize: 13, fontWeight: '600', color: t.bodyText },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
    cancelBtn: {
        backgroundColor: t.buttonNeutral,
        borderWidth: 1.5,
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
        borderWidth: 1.5,
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
    editBtn: {
        backgroundColor: t.pageBackground,
        borderWidth: 0.5,
        borderColor: t.cardTitle,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    editBtnText: { color: t.cardTitle, fontSize: 16, fontWeight: '600' },
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
});
