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

interface FeedItem {
    id: string;
    label: string;
    hour: number;
    minute: number;
    completed: boolean;
}

interface HistoryEntry {
    id: string;
    date: string;
    actual: string;
    sched: string;
    what?: string;
    note?: string;
}

const INITIAL_FEEDS: FeedItem[] = [
    { id: 'f1', label: 'Morning Feed', hour: 7, minute: 0, completed: false },
    { id: 'f2', label: 'Evening Feed', hour: 17, minute: 0, completed: false },
];

export default function PetsScreen() {
    const router = useRouter();
    const [feeds, setFeeds] = useState<FeedItem[]>(INITIAL_FEEDS);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [tempWhat, setTempWhat] = useState('');
    const [showTreatModal, setShowTreatModal] = useState(false);
    const [tempTreatNote, setTempTreatNote] = useState('');
    const [treatCount, setTreatCount] = useState(0);
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');

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
            const savedDate = await AsyncStorage.getItem('pets_last_date');
            const today = new Date().toLocaleDateString();
            const savedHist = await AsyncStorage.getItem('pets_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
            const savedFeeds = await AsyncStorage.getItem('pets_feeds');
            const parsedFeeds: FeedItem[] = savedFeeds ? JSON.parse(savedFeeds) : INITIAL_FEEDS;
            if (savedDate !== today) {
                const resetFeeds = parsedFeeds.map(f => ({ ...f, completed: false }));
                setFeeds(resetFeeds);
                await AsyncStorage.setItem('pets_last_date', today);
                await saveData(resetFeeds, savedHist ? JSON.parse(savedHist) : []);
            } else {
                setFeeds(parsedFeeds);
            }
            await scheduleAllPetsNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const saveData = async (f: FeedItem[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('pets_feeds', JSON.stringify(f));
        await AsyncStorage.setItem('pets_history', JSON.stringify(h));
        await scheduleAllPetsNotifications();
    };

    const scheduleAllPetsNotifications = async () => {
        // Cancel only Pets Day's own notifications (tagged source: 'pets'),
        // leaving My Day, To-Do and Timer reminders untouched.
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content.data?.source === 'pets') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
        // Read the saved feeds list from storage (source of truth) so we never
        // schedule from a stale in-memory copy of state.
        const saved = await AsyncStorage.getItem('pets_feeds');
        const items: FeedItem[] = saved ? JSON.parse(saved) : INITIAL_FEEDS;
        for (const item of items) {
            if (!item.completed) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: 'Pets Routine',
                        body: `Time for ${item.label}!`,
                        // Carry the item id + label so a Snooze button tap can
                        // reschedule just this item; category adds the buttons.
                        data: { source: 'pets', itemId: item.id, label: item.label },
                        categoryIdentifier: 'petssnooze',
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

    const openLogModal = (id: string) => {
        setPendingLogId(id);
        setTempWhat('');
        setShowLogModal(true);
    };

    const confirmLog = () => {
        if (!pendingLogId) return;
        const item = feeds.find(f => f.id === pendingLogId);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: now,
            what: tempWhat || '',
            note: '',
        };
        const updatedFeeds = feeds.map(f =>
            f.id === pendingLogId ? { ...f, completed: true } : f
        );
        const updatedHist = [newEntry, ...history].slice(0, 50);
        setFeeds(updatedFeeds);
        setHistory(updatedHist);
        saveData(updatedFeeds, updatedHist);
        setShowLogModal(false);
        setPendingLogId(null);
    };

    const confirmTreat = () => {
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Treat',
            actual: now,
            what: tempTreatNote || '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        setTreatCount(treatCount + 1);
        setHistory(updatedHist);
        saveData(feeds, updatedHist);
        setShowTreatModal(false);
        setTempTreatNote('');
    };

    const addEntry = () => {
        setActiveId(null);
        setTempName('');
        setPendingTime(new Date(new Date().setHours(12, 0, 0, 0)));
        setShowEditModal(true);
    };

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = feeds.filter(f => f.id !== id);
                    setFeeds(updated);
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
        const index = feeds.findIndex(i => i.id === selectedItemId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === feeds.length - 1) return;
        const updated = [...feeds];
        const swap = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swap]] = [updated[swap], updated[index]];
        setFeeds(updated);
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
            const updated = feeds.map(f =>
                f.id === activeId ? { ...f, label: name, hour, minute } : f
            );
            setFeeds(updated);
            saveData(updated, history);
        } else {
            const newFeed: FeedItem = {
                id: Date.now().toString(),
                label: name,
                hour,
                minute,
                completed: false,
            };
            const updated = [...feeds, newFeed];
            setFeeds(updated);
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
        saveData(feeds, updated);
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
                        saveData(feeds, []);
                    },
                },
            ]
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Pets 🐾</Text>
                    <TouchableOpacity onPress={addEntry} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add Entry</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} scrollEventThrottle={16} directionalLockEnabled={true}>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Routine</Text>
                    <Text style={styles.hintText}>Tap to select for reorder · Edit to change · Swipe to delete</Text>
                    {feeds.map(item => (
                        <Swipeable
                            key={item.id}
                            renderRightActions={() => (
                                <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteEntry(item.id)}>
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={[styles.row, selectedItemId === item.id && styles.rowSelected]}>
                                <TouchableOpacity
                                    style={styles.labelArea}
                                    onPress={() => toggleSelect(item.id)}
                                >
                                    <Text style={styles.itemLabel}>{format12Hour(item.hour, item.minute)} {item.label}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.editBtn}
                                    onPress={() => {
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
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Pets Log</Text>
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
                    <Text style={styles.modalTitle}>Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder="Add a note about this entry..." />
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

            {showTreatModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Log Treat</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempTreatNote} onChangeText={setTempTreatNote} placeholder="e.g. biscuit, dental chew..." autoFocus={true} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTreatModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmTreat}>
                            <Text style={styles.confirmBtnText}>Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <View style={styles.counterBox}>
                <View style={styles.counterItem}>
                    <Text style={styles.counterTitle}>Treats</Text>
                    <View style={styles.counterControls}>
                        <TouchableOpacity style={styles.minusBtn} onPress={() => {
                            if (treatCount > 0) setTreatCount(treatCount - 1);
                        }}>
                            <Text style={styles.counterBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counterCount}>{treatCount}</Text>
                        <TouchableOpacity style={styles.plusBtn} onPress={() => { setTempTreatNote(''); setShowTreatModal(true); }}>
                            <Text style={styles.counterBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

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
                                h.id === editEntry.id ? { ...h, what: editWhat } : h
                            );
                            setHistory(updated);
                            saveData(feeds, updated);
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
                <Modal transparent={true} animationType="fade" visible={showEditModal}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>{activeId ? 'Edit Entry' : 'New Entry'}</Text>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempName}
                                onChangeText={setTempName}
                                placeholder="e.g. Morning Feed"
                                autoFocus={!activeId}
                            />

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
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
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
    hintText: { fontSize: 11, color: '#aaa', marginTop: 2, marginBottom: 8 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 17, color: Colors.primary, fontWeight: '500' },
    logBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    loggedBtn: { backgroundColor: Colors.bridge },
    logBtnText: { color: Colors.white, fontWeight: '600' },
    historySection: { marginHorizontal: 12, marginBottom: 12 },
    historyScroll: {
        height: 375,
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
    counterItem: { flex: 1, alignItems: 'center' },
    counterTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginBottom: 8 },
    counterControls: { flexDirection: 'row', alignItems: 'center' },
    counterCount: { fontSize: 22, fontWeight: 'bold', width: 40, textAlign: 'center', color: Colors.primary },
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerModal: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        width: '100%',
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
    swipeDeleteText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    timeAdjBtn: {
        backgroundColor: Colors.primary,
        width: 50, height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
    },
    timeAdjText: { color: Colors.white, fontSize: 22, fontWeight: '600' },
    timeDisplayText: { fontSize: 40, fontWeight: '600', color: Colors.primary, marginVertical: 4 },
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
