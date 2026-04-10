import AsyncStorage from '@react-native-async-storage/async-storage';
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
    actual: string;
    sched: string;
    what?: string;
}

const INITIAL_FEEDS: ScheduleItem[] = [
    { id: 'f1', label: 'Morning Feed', hour: 7, minute: 0, completed: false },
    { id: 'f2', label: 'Evening Feed', hour: 17, minute: 0, completed: false },
];

export default function MollieScreen() {
    const router = useRouter();
    const [feeds, setFeeds] = useState<ScheduleItem[]>(INITIAL_FEEDS);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [treatCount, setTreatCount] = useState(0);
    const [feedsExpanded, setFeedsExpanded] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [showNameEdit, setShowNameEdit] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [tempWhat, setTempWhat] = useState('');
    const [showTreatModal, setShowTreatModal] = useState(false);
    const [tempTreatNote, setTempTreatNote] = useState('');
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');
    const [pendingTime, setPendingTime] = useState<Date | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const savedDate = await AsyncStorage.getItem('mollie_last_date');
            const today = new Date().toLocaleDateString();
            const savedFeeds = await AsyncStorage.getItem('mollie_feeds');
            const savedHist = await AsyncStorage.getItem('mollie_history');
            const savedTreats = await AsyncStorage.getItem('mollie_treats');
            if (savedHist) setHistory(JSON.parse(savedHist));
            if (savedTreats) setTreatCount(parseInt(savedTreats));
            const parsedFeeds = savedFeeds ? JSON.parse(savedFeeds) : null;
            if (savedDate !== today) {
                const resetFeeds = parsedFeeds
                    ? parsedFeeds.map((f: ScheduleItem) => ({ ...f, completed: false }))
                    : INITIAL_FEEDS;
                setFeeds(resetFeeds);
                await AsyncStorage.setItem('mollie_last_date', today);
                await AsyncStorage.setItem('mollie_feeds', JSON.stringify(resetFeeds));
                await AsyncStorage.setItem('mollie_treats', '0');
                setTreatCount(0);
            } else {
                if (parsedFeeds) setFeeds(parsedFeeds);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveFeeds = async (f: ScheduleItem[]) => {
        setFeeds(f);
        await AsyncStorage.setItem('mollie_feeds', JSON.stringify(f));
    };

    const saveHistory = async (h: HistoryEntry[]) => {
        setHistory(h);
        await AsyncStorage.setItem('mollie_history', JSON.stringify(h));
    };

    const format12Hour = (h: number, m: number) => {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
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
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const updatedFeeds = feeds.map(f =>
            f.id === pendingLogId ? { ...f, completed: true } : f
        );
        saveFeeds(updatedFeeds);
        saveHistory(updatedHist);
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
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        const newCount = treatCount + 1;
        setTreatCount(newCount);
        saveHistory(updatedHist);
        AsyncStorage.setItem('mollie_treats', newCount.toString());
        setShowTreatModal(false);
        setTempTreatNote('');
    };

    const addFeed = () => {
        const newItem: ScheduleItem = {
            id: Date.now().toString(),
            label: 'New Feed',
            hour: 12,
            minute: 0,
            completed: false,
        };
        saveFeeds([...feeds, newItem]);
    };

    const deleteFeed = (id: string) => {
        Alert.alert('Delete', 'Remove this feed from Mollie\'s schedule?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    saveFeeds(feeds.filter(f => f.id !== id));
                },
            },
        ]);
    };

    const onTimeChange = (event: any, date?: Date) => {
        if (date) setPendingTime(date);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.backBtn}>
                        <Text style={styles.backText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Shopping List</Text>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={styles.settingsBtn}>
                        <Text style={styles.settingsBtnText}>⚙️</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} scrollEventThrottle={16} directionalLockEnabled={true}>

                <View style={styles.section}>
                    <TouchableOpacity onPress={() => setFeedsExpanded(!feedsExpanded)} style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Feeding Schedule</Text>
                        <Text style={styles.expandIcon}>{feedsExpanded ? '▲' : '▼'}</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintText}>Hold name to edit · Tap time to change · Swipe to delete</Text>
                    {feedsExpanded && (
                        <>
                            {feeds.map(item => (
                                <Swipeable
                                    key={item.id}
                                    renderRightActions={() => (
                                        <TouchableOpacity
                                            style={styles.swipeDelete}
                                            onPress={() => deleteFeed(item.id)}
                                        >
                                            <Text style={styles.swipeDeleteText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                >
                                    <View style={styles.row}>
                                        <TouchableOpacity
                                            style={styles.labelArea}
                                            onLongPress={() => {
                                                setActiveId(item.id);
                                                setTempName(item.label);
                                                setShowNameEdit(true);
                                            }}
                                        >
                                            <Text style={styles.itemLabel}>{item.label}</Text>
                                            <TouchableOpacity onPress={() => {
                                                setActiveId(item.id);
                                                setShowPicker(true);
                                            }}>
                                                <Text style={styles.timeText}>{format12Hour(item.hour, item.minute)}</Text>
                                            </TouchableOpacity>
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
                            <TouchableOpacity style={styles.addBtn} onPress={addFeed}>
                                <Text style={styles.addBtnText}>+ Add Feed</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>



                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Dog's Log</Text>
                    <ScrollView style={styles.historyScroll} nestedScrollEnabled={true}>
                        {history.map(l => (
                            <TouchableOpacity key={l.id} style={styles.historyItem} onPress={() => {
                                setEditEntry(l);
                                setEditWhat(l.what || '');
                            }}>
                                <Text style={styles.historyText}>
                                    {l.date} | {l.actual} | {l.sched}{l.what ? ` | ${l.what}` : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

            </ScrollView>

            {showLogModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Log Feed</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder="e.g. ate everything, left some..." autoFocus={true} />
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

            {editEntry && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Edit Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes</Text>
                    <TextInput style={styles.input} value={editWhat} onChangeText={setEditWhat} placeholder="Any notes..." />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            const updated = history.map(h =>
                                h.id === editEntry.id ? { ...h, what: editWhat } : h
                            );
                            saveHistory(updated);
                            setEditEntry(null);
                        }}>
                            <Text style={styles.confirmBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showNameEdit && activeId && (
                <View style={styles.modal}>
                    <Text style={styles.inputLabel}>Feed Name:</Text>
                    <TextInput style={styles.input} value={tempName} onChangeText={setTempName} placeholder="Enter name..." autoFocus={true} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNameEdit(false); setActiveId(null); }}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            if (activeId) {
                                const updated = feeds.map(f => f.id === activeId ? { ...f, label: tempName } : f);
                                saveFeeds(updated);
                            }
                            setShowNameEdit(false);
                            setActiveId(null);
                        }}>
                            <Text style={styles.confirmBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showPicker && activeId && (
                <Modal
                    transparent={true}
                    animationType="fade"
                    visible={showPicker}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>Set Time</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 20 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(
                                            feeds.find(i => i.id === activeId)?.hour || 0,
                                            feeds.find(i => i.id === activeId)?.minute || 0
                                        ));
                                        const next = new Date(current);
                                        next.setHours((next.getHours() + 1) % 24);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {String((pendingTime || new Date(new Date().setHours(
                                            feeds.find(i => i.id === activeId)?.hour || 0, 0
                                        ))).getHours()).padStart(2, '0')}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(
                                            feeds.find(i => i.id === activeId)?.hour || 0,
                                            feeds.find(i => i.id === activeId)?.minute || 0
                                        ));
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
                                        const current = pendingTime || new Date(new Date().setHours(
                                            feeds.find(i => i.id === activeId)?.hour || 0,
                                            feeds.find(i => i.id === activeId)?.minute || 0
                                        ));
                                        const next = new Date(current);
                                        next.setMinutes((next.getMinutes() + 1) % 60);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {String((pendingTime || new Date(new Date().setHours(
                                            feeds.find(i => i.id === activeId)?.hour || 0,
                                            feeds.find(i => i.id === activeId)?.minute || 0
                                        ))).getMinutes()).padStart(2, '0')}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(
                                            feeds.find(i => i.id === activeId)?.hour || 0,
                                            feeds.find(i => i.id === activeId)?.minute || 0
                                        ));
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
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => {
                                    setPendingTime(null);
                                    setShowPicker(false);
                                    setActiveId(null);
                                }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                                    if (pendingTime && activeId) {
                                        const updated = feeds.map(f =>
                                            f.id === activeId
                                                ? { ...f, hour: pendingTime.getHours(), minute: pendingTime.getMinutes() }
                                                : f
                                        );
                                        saveFeeds(updated);
                                    }
                                    setPendingTime(null);
                                    setShowPicker(false);
                                    setActiveId(null);
                                }}>
                                    <Text style={styles.confirmBtnText}>OK</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        marginBottom: 4,
    },
    expandIcon: {
        fontSize: 22,
        color: Colors.primary,
        fontWeight: '600',
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
    hintText: { fontSize: 11, color: '#aaa', marginBottom: 8 },
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
    counterBox: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 15,
        marginHorizontal: 12,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
    counterCount: {
        fontSize: 22,
        fontWeight: 'bold',
        width: 40,
        textAlign: 'center',
        color: Colors.primary,
    },
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
    historySection: { marginHorizontal: 12, marginBottom: 12 },
    historyScroll: {
        height: 550,
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
    pickerModal: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        width: '100%',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
});