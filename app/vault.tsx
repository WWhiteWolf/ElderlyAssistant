import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

interface VaultItem {
    id: string;
    category: string;
    label: string;
    value: string;
    notes: string;
}

const VAULT_CATEGORIES = [
    { id: 'identity', name: 'Identity', icon: '🪪', items: ['Passport #', 'TSA #', 'Driver License #', 'Social Security #'] },
    { id: 'property', name: 'Property', icon: '🏠', items: ['Deed/Mortgage Info', 'Vehicle Registration', 'Home Insurance'] },
    { id: 'financial', name: 'Financial', icon: '💳', items: ['Credit Card #', 'Bank Account #', 'Investment Account #'] },
    { id: 'medical', name: 'Medical', icon: '🏥', items: ['Health Insurance', 'Medicare #', 'Primary Doctor', 'Specialist'] },
    { id: 'digital', name: 'Digital', icon: '🔐', items: ['Email Password', 'App Password', 'WiFi Password'] },
    { id: 'legal', name: 'Legal', icon: '📜', items: ['Will Location', 'Power of Attorney', 'Trust Documents'] },
    { id: 'other', name: 'Other', icon: '📁', items: [] },
];

export default function VaultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const checkSecurity = async () => {
            const vaultPinEnabled = await AsyncStorage.getItem('vault_pin_enabled');
            if (vaultPinEnabled === 'true' && !params?.verified) {
                router.replace('/vaultpin');
            } else {
                setReady(true);
            }
        };
        checkSecurity();
    }, [params]);

    const [items, setItems] = useState<VaultItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editItem, setEditItem] = useState<VaultItem | null>(null);
    const [newLabel, setNewLabel] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [customLabel, setCustomLabel] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('');

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const saved = await AsyncStorage.getItem('vault_items');
            if (saved) setItems(JSON.parse(saved));
        } catch (e) {
            console.error(e);
        }
    };

    const saveItems = async (updated: VaultItem[]) => {
        setItems(updated);
        await AsyncStorage.setItem('vault_items', JSON.stringify(updated));
    };

    const resetForm = () => {
        setNewLabel('');
        setNewValue('');
        setNewNotes('');
        setCustomLabel('');
        setSelectedPreset('');
        setEditItem(null);
    };

    const addItem = () => {
        const label = selectedPreset === 'custom' ? customLabel.trim() : selectedPreset || newLabel.trim();
        if (!label || !newValue.trim()) {
            Alert.alert('Missing Info', 'Please enter both a label and value.');
            return;
        }
        const item: VaultItem = {
            id: Date.now().toString(),
            category: selectedCategory || 'other',
            label,
            value: newValue.trim(),
            notes: newNotes.trim(),
        };
        saveItems([...items, item]);
        resetForm();
        setShowAddItem(false);
    };

    const updateItem = () => {
        if (!editItem) return;
        const label = selectedPreset === 'custom' ? customLabel.trim() : selectedPreset || newLabel.trim();
        if (!label || !newValue.trim()) {
            Alert.alert('Missing Info', 'Please enter both a label and value.');
            return;
        }
        const updated = items.map(i =>
            i.id === editItem.id
                ? { ...i, label, value: newValue.trim(), notes: newNotes.trim() }
                : i
        );
        saveItems(updated);
        resetForm();
        setShowAddItem(false);
    };

    const deleteItem = (id: string) => {
        Alert.alert('Delete', 'Remove this item from the Vault?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    saveItems(items.filter(i => i.id !== id));
                },
            },
        ]);
    };

    const openEditItem = (item: VaultItem) => {
        setEditItem(item);
        setNewLabel(item.label);
        setSelectedPreset(item.label);
        setNewValue(item.value);
        setNewNotes(item.notes);
        setShowAddItem(true);
    };

    const toggleShowValue = (id: string) => {
        setShowValues(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getCategoryItems = () => {
        return items.filter(i => i.category === selectedCategory);
    };

    const getCategoryData = (id: string) => {
        return VAULT_CATEGORIES.find(c => c.id === id);
    };

    if (!ready) return <View style={{ flex: 1, backgroundColor: Colors.background }} />;

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {selectedCategory ? getCategoryData(selectedCategory)?.name : 'Vault 🔒'}
                    </Text>
                    <View style={styles.settingsBtn} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            {!selectedCategory ? (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text style={styles.securityNote}>🔒 Your data is stored securely on this device only.</Text>
                    {VAULT_CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.categoryCard}
                            onPress={() => setSelectedCategory(cat.id)}
                        >
                            <Text style={styles.categoryIcon}>{cat.icon}</Text>
                            <View style={styles.categoryInfo}>
                                <Text style={styles.categoryName}>{cat.name}</Text>
                                <Text style={styles.categoryCount}>
                                    {items.filter(i => i.category === cat.id).length} items
                                </Text>
                            </View>
                            <Text style={styles.categoryArrow}>›</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
                    <TouchableOpacity style={styles.backToList} onPress={() => setSelectedCategory(null)}>
                        <Text style={styles.backToListText}>← All Categories</Text>
                    </TouchableOpacity>

                    {getCategoryItems().length === 0 && (
                        <Text style={styles.emptyText}>No items yet. Tap + to add one.</Text>
                    )}

                    {getCategoryItems().map(item => (
                        <Swipeable
                            key={item.id}
                            renderRightActions={() => (
                                <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteItem(item.id)}>
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={styles.itemCard}>
                                <View style={styles.itemHeader}>
                                    <Text style={styles.itemLabel}>{item.label}</Text>
                                    <View style={styles.itemActions}>
                                        <TouchableOpacity onPress={() => toggleShowValue(item.id)} style={styles.showBtn}>
                                            <Text style={styles.showBtnText}>{showValues[item.id] ? 'Hide' : 'Show'}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => openEditItem(item)} style={styles.editBtn}>
                                            <Text style={styles.editBtnText}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                {showValues[item.id] ? (
                                    <Text style={styles.itemValue}>{item.value}</Text>
                                ) : (
                                    <Text style={styles.itemValueHidden}>••••••••</Text>
                                )}
                                {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
                            </View>
                        </Swipeable>
                    ))}
                </ScrollView>
            )}

            {selectedCategory && (
                <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setShowAddItem(true); }}>
                    <Text style={styles.fabText}>+ Add</Text>
                </TouchableOpacity>
            )}

            {showAddItem && (
                <Modal transparent animationType="slide" visible={showAddItem}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <Text style={styles.modalTitle}>{editItem ? 'Edit Item' : 'New Item'}</Text>

                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => { resetForm(); setShowAddItem(false); }}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmBtn} onPress={editItem ? updateItem : addItem}>
                                        <Text style={styles.confirmBtnText}>{editItem ? 'Update' : 'Add'}</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Label</Text>
                                {getCategoryData(selectedCategory || 'other')?.items.length ? (
                                    <>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                                            {[...(getCategoryData(selectedCategory || 'other')?.items || []), 'Custom'].map(preset => (
                                                <TouchableOpacity
                                                    key={preset}
                                                    style={[styles.presetBtn, selectedPreset === preset && styles.presetBtnActive]}
                                                    onPress={() => setSelectedPreset(preset)}
                                                >
                                                    <Text style={[styles.presetBtnText, selectedPreset === preset && styles.presetBtnTextActive]}>{preset}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                        {selectedPreset === 'Custom' && (
                                            <TextInput style={styles.input} value={customLabel} onChangeText={setCustomLabel} placeholder="Enter custom label..." />
                                        )}
                                    </>
                                ) : (
                                    <TextInput style={styles.input} value={newLabel} onChangeText={setNewLabel} placeholder="Enter label..." autoFocus={true} />
                                )}

                                <Text style={styles.inputLabel}>Value</Text>
                                <TextInput style={styles.input} value={newValue} onChangeText={setNewValue} placeholder="Enter value..." secureTextEntry={false} />

                                <Text style={styles.inputLabel}>Notes (optional)</Text>
                                <TextInput style={styles.input} value={newNotes} onChangeText={setNewNotes} placeholder="e.g. where it's kept, expiry date..." multiline />
                            </ScrollView>
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
    scroll: { flex: 1, padding: 12 },
    securityNote: {
        fontSize: 13,
        color: Colors.bridge,
        textAlign: 'center',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    categoryIcon: { fontSize: 32, marginRight: 16 },
    categoryInfo: { flex: 1 },
    categoryName: { fontSize: 18, fontWeight: '600', color: Colors.primary },
    categoryCount: { fontSize: 13, color: '#aaa', marginTop: 2 },
    categoryArrow: { fontSize: 28, color: Colors.lightBlue },
    backToList: { paddingVertical: 10, paddingHorizontal: 4, marginBottom: 4 },
    backToListText: { color: Colors.primary, fontSize: 16, fontWeight: '500' },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
    itemCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemLabel: { fontSize: 16, fontWeight: '600', color: Colors.primary, flex: 1 },
    itemActions: { flexDirection: 'row', gap: 8 },
    showBtn: {
        backgroundColor: Colors.bridge,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    showBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
    editBtn: {
        backgroundColor: Colors.background,
        borderWidth: 0.5,
        borderColor: Colors.primary,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    editBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
    deleteBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    deleteBtnText: { color: '#e74c3c', fontSize: 16, fontWeight: '600' },
    itemValue: { fontSize: 15, color: Colors.text, marginBottom: 4 },
    itemValueHidden: { fontSize: 15, color: '#aaa', letterSpacing: 2, marginBottom: 4 },
    itemNotes: { fontSize: 12, color: '#aaa', fontStyle: 'italic' },
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
    modalTitle: { fontSize: 20, fontWeight: '600', color: Colors.primary, marginBottom: 8 },
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
    presetBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.lightBlue,
        marginRight: 8,
        backgroundColor: Colors.white,
    },
    presetBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    presetBtnText: { fontSize: 13, color: Colors.primary },
    presetBtnTextActive: { color: Colors.white },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
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
    swipeDeleteText: { color: '#fff', fontWeight: '600', fontSize: 15 },
    
    headerBtn: {
    borderWidth: 1,
    borderColor: Colors.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
},
headerBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});