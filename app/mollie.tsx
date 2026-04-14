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

interface FeedItem {
    id: string;
    label: string;
    hour: number;
    minute: number;
    completed: boolean;
}

interface LogEntry {
    id: string;
    date: string;
    actual: string;
    sched: string;
    what?: string;
}

interface Pet {
    id: string;
    name: string;
    type: string;
    feeds: FeedItem[];
    treatCount: number;
    history: LogEntry[];
    lastDate: string;
}

const PET_TYPES = ['Dog', 'Cat', 'Bird', 'Fish', 'Rabbit', 'Other'];

export default function PetsScreen() {
    const router = useRouter();
    const [pets, setPets] = useState<Pet[]>([]);
    const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
    const [showAddPet, setShowAddPet] = useState(false);
    const [newPetName, setNewPetName] = useState('');
    const [newPetType, setNewPetType] = useState('Dog');
    const [editPet, setEditPet] = useState<Pet | null>(null);
    const [showPicker, setShowPicker] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [showNameEdit, setShowNameEdit] = useState(false);
    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [tempWhat, setTempWhat] = useState('');
    const [showTreatModal, setShowTreatModal] = useState(false);
    const [tempTreatNote, setTempTreatNote] = useState('');
    const [feedsExpanded, setFeedsExpanded] = useState(false);
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    const [customPetType, setCustomPetType] = useState('');

    useEffect(() => {
        loadPets();
    }, []);

    const loadPets = async () => {
        try {
            const saved = await AsyncStorage.getItem('pets_data');
            if (saved) setPets(JSON.parse(saved));
        } catch (e) {
            console.error(e);
        }
    };

    const savePets = async (updated: Pet[]) => {
        setPets(updated);
        await AsyncStorage.setItem('pets_data', JSON.stringify(updated));
    };

    const addPet = () => {
        if (!newPetName.trim()) {
            Alert.alert('Missing Name', 'Please enter a pet name.');
            return;
        }
        const pet: Pet = {
            id: Date.now().toString(),
            name: newPetName.trim(),
            type: newPetType,
            feeds: [
                { id: 'f1', label: 'Morning Feed', hour: 7, minute: 0, completed: false },
                { id: 'f2', label: 'Evening Feed', hour: 17, minute: 0, completed: false },
            ],
            treatCount: 0,
            history: [],
            lastDate: '',
        };
        savePets([...pets, pet]);
        setNewPetName('');
        setNewPetType('Dog');
        setShowAddPet(false);
    };

    const deletePet = (id: string) => {
        Alert.alert('Delete Pet', 'Remove this pet and all their data?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    savePets(pets.filter(p => p.id !== id));
                    if (selectedPet?.id === id) setSelectedPet(null);
                },
            },
        ]);
    };

    const openPet = (pet: Pet) => {
        const today = new Date().toLocaleDateString();
        if (pet.lastDate !== today) {
            const reset = {
                ...pet,
                feeds: pet.feeds.map(f => ({ ...f, completed: false })),
                treatCount: 0,
                lastDate: today,
            };
            const updated = pets.map(p => p.id === pet.id ? reset : p);
            savePets(updated);
            setSelectedPet(reset);
        } else {
            setSelectedPet(pet);
        }
    };

    const updateSelectedPet = (updated: Pet) => {
        setSelectedPet(updated);
        savePets(pets.map(p => p.id === updated.id ? updated : p));
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
        if (!pendingLogId || !selectedPet) return;
        const item = selectedPet.feeds.find(f => f.id === pendingLogId);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: LogEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: now,
            what: tempWhat || '',
        };
        const updatedFeeds = selectedPet.feeds.map(f =>
            f.id === pendingLogId ? { ...f, completed: true } : f
        );
        const updated = {
            ...selectedPet,
            feeds: updatedFeeds,
            history: [newEntry, ...selectedPet.history].slice(0, 50),
        };
        updateSelectedPet(updated);
        setShowLogModal(false);
        setPendingLogId(null);
    };

    const confirmTreat = () => {
        if (!selectedPet) return;
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: LogEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: 'Treat',
            actual: now,
            what: tempTreatNote || '',
        };
        const updated = {
            ...selectedPet,
            treatCount: selectedPet.treatCount + 1,
            history: [newEntry, ...selectedPet.history].slice(0, 50),
        };
        updateSelectedPet(updated);
        setShowTreatModal(false);
        setTempTreatNote('');
    };

    const addFeed = () => {
        if (!selectedPet) return;
        const newFeed: FeedItem = {
            id: Date.now().toString(),
            label: 'New Feed',
            hour: 12,
            minute: 0,
            completed: false,
        };
        updateSelectedPet({ ...selectedPet, feeds: [...selectedPet.feeds, newFeed] });
    };

    const deleteFeed = (id: string) => {
        if (!selectedPet) return;
        Alert.alert('Delete', 'Remove this feed?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    updateSelectedPet({ ...selectedPet, feeds: selectedPet.feeds.filter(f => f.id !== id) });
                },
            },
        ]);
    };

    const onTimeChange = (event: any, date?: Date) => {
        if (date) setPendingTime(date);
    };

    const getPetIcon = (type: string) => {
        switch (type) {
            case 'Dog': return '🐕';
            case 'Cat': return '🐈';
            case 'Bird': return '🐦';
            case 'Fish': return '🐟';
            case 'Rabbit': return '🐇';
            default: return '🐾';
        }
    };
    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {selectedPet ? `${selectedPet.name} ${getPetIcon(selectedPet.type)}` : 'Pets 🐾'}
                    </Text>
                    <View style={styles.settingsBtn} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            {!selectedPet ? (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
                    {pets.length === 0 && (
                        <Text style={styles.emptyText}>No pets yet. Tap + to add one.</Text>
                    )}
                    {pets.map(pet => (
                        <Swipeable
                            key={pet.id}
                            renderRightActions={() => (
                                <TouchableOpacity style={styles.swipeDelete} onPress={() => deletePet(pet.id)}>
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <TouchableOpacity style={styles.petCard} onPress={() => openPet(pet)}>
                                <Text style={styles.petIcon}>{getPetIcon(pet.type)}</Text>
                                <View style={styles.petInfo}>
                                    <Text style={styles.petName}>{pet.name}</Text>
                                    <Text style={styles.petType}>{pet.type}</Text>
                                </View>
                                <Text style={styles.petArrow}>›</Text>
                            </TouchableOpacity>
                        </Swipeable>
                    ))}
                </ScrollView>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }} scrollEventThrottle={16} directionalLockEnabled={true}>
                    <TouchableOpacity style={styles.backToList} onPress={() => setSelectedPet(null)}>
                        <Text style={styles.backToListText}>← All Pets</Text>
                    </TouchableOpacity>

                    <View style={styles.section}>
                        <TouchableOpacity onPress={() => setFeedsExpanded(!feedsExpanded)} style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Feeding Schedule</Text>
                            <Text style={styles.expandIcon}>{feedsExpanded ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        <Text style={styles.hintText}>Hold name to edit · Tap time to change · Swipe to delete</Text>
                        {feedsExpanded && (
                            <>
                                {selectedPet.feeds.map(item => (
                                    <Swipeable
                                        key={item.id}
                                        renderRightActions={() => (
                                            <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteFeed(item.id)}>
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
                                                <TouchableOpacity onPress={() => { setActiveId(item.id); setShowPicker(true); }}>
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
                        <Text style={styles.sectionTitle}>{selectedPet.name}'s Log</Text>
                        <ScrollView style={styles.historyScroll} nestedScrollEnabled={true}>
                            {selectedPet.history.map(l => (
                                <View key={l.id} style={styles.historyItem}>
                                    <Text style={styles.historyText}>
                                        {l.date} | {l.actual} | {l.sched}{l.what ? ` | ${l.what}` : ''}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </ScrollView>
            )}

            {!selectedPet && (
                <TouchableOpacity style={styles.fab} onPress={() => setShowAddPet(true)}>
                    <Text style={styles.fabText}>+ Pet</Text>
                </TouchableOpacity>
            )}

            {selectedPet && (
                <View style={styles.counterBox}>
                    <View style={styles.counterItem}>
                        <Text style={styles.counterTitle}>Treats</Text>
                        <View style={styles.counterControls}>
                            <TouchableOpacity style={styles.minusBtn} onPress={() => {
                                if (selectedPet.treatCount > 0) {
                                    updateSelectedPet({ ...selectedPet, treatCount: selectedPet.treatCount - 1 });
                                }
                            }}>
                                <Text style={styles.counterBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterCount}>{selectedPet.treatCount}</Text>
                            <TouchableOpacity style={styles.plusBtn} onPress={() => { setTempTreatNote(''); setShowTreatModal(true); }}>
                                <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {showLogModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Log Feed</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder="e.g. ate everything..." autoFocus={true} />
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

            {showNameEdit && activeId && selectedPet && (
                <View style={styles.modal}>
                    <Text style={styles.inputLabel}>Feed Name:</Text>
                    <TextInput style={styles.input} value={tempName} onChangeText={setTempName} placeholder="Enter name..." autoFocus={true} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowNameEdit(false); setActiveId(null); }}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            const updatedFeeds = selectedPet.feeds.map(f => f.id === activeId ? { ...f, label: tempName } : f);
                            updateSelectedPet({ ...selectedPet, feeds: updatedFeeds });
                            setShowNameEdit(false);
                            setActiveId(null);
                        }}>
                            <Text style={styles.confirmBtnText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showPicker && activeId && selectedPet && (
                <Modal transparent={true} animationType="fade" visible={showPicker}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>Set Time</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 20 }}>
                                <View style={{ alignItems: 'center' }}>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(
                                            selectedPet.feeds.find(i => i.id === activeId)?.hour || 0,
                                            selectedPet.feeds.find(i => i.id === activeId)?.minute || 0
                                        ));
                                        const next = new Date(current);
                                        next.setHours((next.getHours() + 1) % 24);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {String((pendingTime || new Date(new Date().setHours(
                                            selectedPet.feeds.find(i => i.id === activeId)?.hour || 0, 0
                                        ))).getHours()).padStart(2, '0')}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(
                                            selectedPet.feeds.find(i => i.id === activeId)?.hour || 0,
                                            selectedPet.feeds.find(i => i.id === activeId)?.minute || 0
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
                                            selectedPet.feeds.find(i => i.id === activeId)?.hour || 0,
                                            selectedPet.feeds.find(i => i.id === activeId)?.minute || 0
                                        ));
                                        const next = new Date(current);
                                        next.setMinutes((next.getMinutes() + 1) % 60);
                                        setPendingTime(next);
                                    }}>
                                        <Text style={styles.timeAdjText}>▲</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.timeDisplayText}>
                                        {String((pendingTime || new Date(new Date().setHours(
                                            selectedPet.feeds.find(i => i.id === activeId)?.hour || 0,
                                            selectedPet.feeds.find(i => i.id === activeId)?.minute || 0
                                        ))).getMinutes()).padStart(2, '0')}
                                    </Text>
                                    <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                        const current = pendingTime || new Date(new Date().setHours(
                                            selectedPet.feeds.find(i => i.id === activeId)?.hour || 0,
                                            selectedPet.feeds.find(i => i.id === activeId)?.minute || 0
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
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setPendingTime(null); setShowPicker(false); setActiveId(null); }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                                    if (pendingTime && activeId && selectedPet) {
                                        const updatedFeeds = selectedPet.feeds.map(f =>
                                            f.id === activeId ? { ...f, hour: pendingTime.getHours(), minute: pendingTime.getMinutes() } : f
                                        );
                                        updateSelectedPet({ ...selectedPet, feeds: updatedFeeds });
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

            {showAddPet && (
                <Modal transparent animationType="slide" visible={showAddPet}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalBox}>
                                <Text style={styles.modalTitle}>Add Pet</Text>
                                <Text style={styles.inputLabel}>Pet Name</Text>
                                <TextInput style={styles.input} value={newPetName} onChangeText={setNewPetName} placeholder="e.g. Mollie, Luna..." autoFocus={true} />
                                <Text style={styles.inputLabel}>Type</Text>
                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                    {PET_TYPES.map(type => (
                                        <TouchableOpacity
                                            key={type}
                                            style={[styles.typeBtn, newPetType === type && styles.typeBtnActive]}
                                            onPress={() => setNewPetType(type)}
                                        >
                                            <Text style={[styles.typeBtnText, newPetType === type && styles.typeBtnTextActive]}>
                                                {getPetIcon(type)} {type}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={[styles.typeBtn, newPetType === 'Custom' && styles.typeBtnActive]}
                                        onPress={() => setNewPetType('Custom')}
                                    >
                                        <Text style={[styles.typeBtnText, newPetType === 'Custom' && styles.typeBtnTextActive]}>
                                            🐾 Custom ←Edit
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {newPetType === 'Custom' && (
                                    <>
                                        <Text style={styles.inputLabel}>Enter pet type</Text>
                                        <TextInput style={styles.input} value={customPetType} onChangeText={setCustomPetType} placeholder="e.g. Hamster, Turtle..." />
                                    </>
                                )}
                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNewPetName(''); setNewPetType('Dog'); setCustomPetType(''); setShowAddPet(false); }}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                                        if (!newPetName.trim()) {
                                            Alert.alert('Missing Name', 'Please enter a pet name.');
                                            return;
                                        }
                                        const finalType = newPetType === 'Custom' ? (customPetType.trim() || 'Other') : newPetType;
                                        const pet: Pet = {
                                            id: Date.now().toString(),
                                            name: newPetName.trim(),
                                            type: finalType,
                                            feeds: [
                                                { id: 'f1', label: 'Morning Feed', hour: 7, minute: 0, completed: false },
                                                { id: 'f2', label: 'Evening Feed', hour: 17, minute: 0, completed: false },
                                            ],
                                            treatCount: 0,
                                            history: [],
                                            lastDate: '',
                                        };
                                        savePets([...pets, pet]);
                                        setNewPetName('');
                                        setNewPetType('Dog');
                                        setCustomPetType('');
                                        setShowAddPet(false);
                                    }}>
                                        <Text style={styles.confirmBtnText}>Add</Text>
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
    backBtn: { width: 70 },
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
    settingsBtn: { width: 70, alignItems: 'flex-end' },
    settingsBtnText: { fontSize: 22 },
    bridge: { height: 8, backgroundColor: Colors.bridge },
    scroll: { flex: 1 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
    petCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 12,
        marginTop: 12,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    petIcon: { fontSize: 36, marginRight: 16 },
    petInfo: { flex: 1 },
    petName: { fontSize: 20, fontWeight: '600', color: Colors.primary },
    petType: { fontSize: 14, color: Colors.bridge, marginTop: 2 },
    petArrow: { fontSize: 28, color: Colors.lightBlue },
    backToList: { paddingVertical: 10, paddingHorizontal: 16, marginBottom: 4 },
    backToListText: { color: Colors.primary, fontSize: 16, fontWeight: '500' },
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
    expandIcon: { fontSize: 22, color: Colors.primary, fontWeight: '600' },
    hintText: { fontSize: 11, color: '#aaa', marginBottom: 8 },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 17, color: Colors.primary, fontWeight: '500' },
    timeText: { fontSize: 15, color: Colors.bridge, marginTop: 2 },
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        padding: 15,
        borderTopWidth: 0.5,
        borderTopColor: Colors.lightBlue,
        alignItems: 'center',
        justifyContent: 'center',
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
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 16,
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
    fabText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
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
    modalBox: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        width: '100%',
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
        marginBottom: 10,
    },
    swipeDeleteText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    typeBtn: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.lightBlue,
        backgroundColor: Colors.white,
    },
    typeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    typeBtnText: { color: Colors.primary, fontWeight: '500', fontSize: 14 },
    typeBtnTextActive: { color: Colors.white },
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
});