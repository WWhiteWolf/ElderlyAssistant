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
import { Colors } from '../constants/Colors';

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

const PRIORITY_COLORS: Record<Priority, string> = {
    Urgent: '#e74c3c',
    Normal: '#1a6e8a',
    Someday: '#95a5a6',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    Active: '#2d9e8f',
    'On Hold': '#e67e22',
    Completed: '#95a5a6',
};
export default function PlannerScreen() {
    const router = useRouter();
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
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.backBtn}>
                        <Text style={styles.backText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Project Planner</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                        <Text style={styles.settingsBtnText}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

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
                            <TouchableOpacity style={[styles.projectActionBtn, { backgroundColor: Colors.bridge }]} onPress={() => completeProject(selectedProject)}>
                                <Text style={styles.projectActionText}>Complete Project</Text>
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
                                        <TouchableOpacity onPress={() => openEditTask(task)} style={styles.editBtn}>
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
                                        <Text style={{ fontSize: 13, color: Colors.bridge, fontStyle: 'italic' }}>Tap background, or Scroll ↓</Text>
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
                                    <TextInput style={styles.input} value={newProjectName} onChangeText={setNewProjectName} placeholder="What is this project?" autoFocus={true} />

                                    <Text style={styles.inputLabel}>Description (optional)</Text>
                                    <TextInput style={styles.input} value={newProjectDesc} onChangeText={setNewProjectDesc} placeholder="Brief description..." multiline />

                                    <Text style={styles.inputLabel}>Start Date (MM/DD/YY)</Text>
                                    <TextInput style={styles.input} value={newProjectStartDate} onChangeText={setNewProjectStartDate} placeholder="e.g. 04/10/26" keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>On Hold?</Text>
                                    <View style={styles.priorityRow}>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, !newProjectOnHold && { backgroundColor: Colors.primary }]}
                                            onPress={() => setNewProjectOnHold(false)}
                                        >
                                            <Text style={[styles.priorityBtnText, !newProjectOnHold && { color: '#fff' }]}>Active</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, newProjectOnHold && { backgroundColor: '#e67e22' }]}
                                            onPress={() => setNewProjectOnHold(true)}
                                        >
                                            <Text style={[styles.priorityBtnText, newProjectOnHold && { color: '#fff' }]}>On Hold</Text>
                                        </TouchableOpacity>
                                    </View>
                                    {newProjectOnHold && (
                                        <>
                                            <Text style={styles.inputLabel}>Reason for Hold</Text>
                                            <TextInput style={styles.input} value={newProjectOnHoldNote} onChangeText={setNewProjectOnHoldNote} placeholder="Why is this on hold?" />
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
                                        <Text style={{ fontSize: 13, color: Colors.bridge, fontStyle: 'italic' }}>Tap background, or Scroll ↓</Text>
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
                                    <TextInput style={styles.input} value={newTaskTitle} onChangeText={setNewTaskTitle} placeholder="What needs to be done?" autoFocus={true} />

                                    <Text style={styles.inputLabel}>Priority</Text>
                                    <View style={styles.priorityRow}>
                                        {(['Urgent', 'Normal', 'Someday'] as Priority[]).map(p => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.priorityBtn, newTaskPriority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                                                onPress={() => setNewTaskPriority(p)}
                                            >
                                                <Text style={[styles.priorityBtnText, newTaskPriority === p && { color: '#fff' }]}>{p}</Text>
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
                                                <Text style={[styles.priorityBtnText, newTaskStatus === s && { color: '#fff' }]}>{s === 'Completed' ? 'Done' : s}</Text>
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
                                    <TextInput style={styles.input} value={newTaskDueDate} onChangeText={setNewTaskDueDate} placeholder="e.g. 04/15/26" keyboardType="numbers-and-punctuation" />

                                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                                    <TextInput style={styles.input} value={newTaskNotes} onChangeText={setNewTaskNotes} placeholder="Any details..." multiline />

                                    <Text style={styles.inputLabel}>Reminder?</Text>
                                    <View style={styles.priorityRow}>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, !newTaskHasReminder && { backgroundColor: Colors.primary }]}
                                            onPress={() => setNewTaskHasReminder(false)}
                                        >
                                            <Text style={[styles.priorityBtnText, !newTaskHasReminder && { color: '#fff' }]}>No</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.priorityBtn, newTaskHasReminder && { backgroundColor: Colors.bridge }]}
                                            onPress={() => setNewTaskHasReminder(true)}
                                        >
                                            <Text style={[styles.priorityBtnText, newTaskHasReminder && { color: '#fff' }]}>Yes</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {newTaskHasReminder && (
                                        <>
                                            <Text style={styles.inputLabel}>Reminder Date (MM/DD/YY)</Text>
                                            <TextInput style={styles.input} value={newTaskReminderDate} onChangeText={setNewTaskReminderDate} placeholder="e.g. 04/14/26" keyboardType="numbers-and-punctuation" />
                                            <Text style={styles.inputLabel}>Reminder Time (HH:MM)</Text>
                                            <TextInput style={styles.input} value={newTaskReminderTime} onChangeText={setNewTaskReminderTime} placeholder="e.g. 09:00" keyboardType="numbers-and-punctuation" />
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
        fontSize: 22,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        flex: 1,
        textAlign: 'center',
    },
    bridge: { height: 8, backgroundColor: Colors.bridge },
    scroll: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
    projectCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    onHoldBadge: {
        backgroundColor: '#e67e22',
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    onHoldBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
    projectCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    projectName: { fontSize: 18, fontWeight: '600', color: Colors.primary, flex: 1 },
    projectProgress: { fontSize: 16, fontWeight: '600', color: Colors.bridge },
    projectDesc: { fontSize: 13, color: '#888', marginBottom: 8, fontStyle: 'italic' },
    progressBar: {
        height: 6,
        backgroundColor: '#e0e0e0',
        borderRadius: 3,
        marginVertical: 6,
        overflow: 'hidden',
    },
    progressFill: {
        height: 6,
        backgroundColor: Colors.bridge,
        borderRadius: 3,
    },
    projectMeta: { fontSize: 12, color: '#aaa', marginTop: 4 },
    backToProjects: {
        paddingVertical: 10,
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    backToProjectsText: { color: Colors.primary, fontSize: 16, fontWeight: '500' },
    projectDetailHeader: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    projectActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 10,
    },
    projectActionBtn: {
        flex: 1,
        backgroundColor: Colors.primary,
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    projectActionText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
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
    statusBadge: {
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 10,
    },
    statusBadgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
    onHoldNote: { fontSize: 12, color: '#e67e22', marginBottom: 4, fontStyle: 'italic' },
    taskBottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    priorityLabel: { fontSize: 12, fontWeight: '600' },
    dueDateText: { fontSize: 12, color: '#888' },
    reminderIndicator: { fontSize: 12, color: Colors.bridge },
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
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
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
    pressToEdit: { fontSize: 11, color: '#aaa', fontStyle: 'italic' },
    editBtn: {
        backgroundColor: Colors.background,
        borderWidth: 0.5,
        borderColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    editBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },
});
