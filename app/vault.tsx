import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';

interface VaultItem {
    id: string;
    category: string;
    label: string;
    value: string;
    notes: string;
}

interface VaultCategory {
    id: string;
    name: string;
}

// All categories are USER-DEFINED now (Patrick, #67): no hard-coded list, no
// icons, no preset label chips. This list exists ONLY to seed the user's
// editable category list the FIRST time this code runs, so every existing
// item stays exactly where it was. The ids must never change — saved items
// point at them.
const DEFAULT_CATEGORIES: VaultCategory[] = [
    { id: 'identity', name: 'Identity' },
    { id: 'property', name: 'Property' },
    { id: 'financial', name: 'Financial' },
    { id: 'medical', name: 'Medical' },
    { id: 'digital', name: 'Digital' },
    { id: 'legal', name: 'Legal' },
    { id: 'other', name: 'Other' },
];

export default function VaultScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [ready, setReady] = useState(false);
    const didCheck = useRef(false);

    useEffect(() => {
        // Run the Face ID gate exactly ONCE when the Vault opens. (Previously this
        // depended on [params], whose object identity changes on every redraw, so
        // it re-fired Face ID in a loop — auth, redraw, re-prompt, forever — and
        // let the category list show through between prompts.)
        if (didCheck.current) return;
        didCheck.current = true;
        const checkSecurity = async () => {
            const vaultPinEnabled = await AsyncStorage.getItem('vault_pin_enabled');
            if (vaultPinEnabled === 'true' && !params?.verified) {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Unlock your Vault',
                    fallbackLabel: 'Use Passcode',
                });
                if (result.success) {
                    setReady(true);
                } else {
                    router.replace('/home');
                }
            } else {
                setReady(true);
            }
        };
        checkSecurity();
    }, []);

    const [items, setItems] = useState<VaultItem[]>([]);
    const [categories, setCategories] = useState<VaultCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showAddItem, setShowAddItem] = useState(false);
    const [editItem, setEditItem] = useState<VaultItem | null>(null);
    const [newLabel, setNewLabel] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newNotes, setNewNotes] = useState('');
    const [showValues, setShowValues] = useState<Record<string, boolean>>({});
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editCategory, setEditCategory] = useState<VaultCategory | null>(null);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            const saved = await AsyncStorage.getItem('vault_items');
            if (saved) setItems(JSON.parse(saved));
            const savedCats = await AsyncStorage.getItem('vault_categories');
            if (savedCats) {
                setCategories(JSON.parse(savedCats));
            } else {
                // First run after the #67 change: seed the editable list with
                // the original seven and save it, so nothing moves.
                setCategories(DEFAULT_CATEGORIES);
                await AsyncStorage.setItem('vault_categories', JSON.stringify(DEFAULT_CATEGORIES));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const saveItems = async (updated: VaultItem[]) => {
        setItems(updated);
        await AsyncStorage.setItem('vault_items', JSON.stringify(updated));
    };

    const saveCategories = async (updated: VaultCategory[]) => {
        setCategories(updated);
        await AsyncStorage.setItem('vault_categories', JSON.stringify(updated));
    };

    const addCategory = () => {
        const name = newCategoryName.trim();
        if (!name) {
            Alert.alert('Missing Info', 'Enter a category name.');
            return;
        }
        const category: VaultCategory = { id: Date.now().toString(), name };
        saveCategories([...categories, category]);
        setNewCategoryName('');
        setShowAddCategory(false);
    };

    const openEditCategory = (cat: VaultCategory) => {
        setEditCategory(cat);
        setNewCategoryName(cat.name);
        setShowAddCategory(true);
    };

    const renameCategory = () => {
        if (!editCategory) return;
        const name = newCategoryName.trim();
        if (!name) {
            Alert.alert('Missing Info', 'Enter a category name.');
            return;
        }
        // Only the display name changes — the id stays, so the items inside
        // keep pointing at this category.
        saveCategories(categories.map(c => (c.id === editCategory.id ? { ...c, name } : c)));
        setNewCategoryName('');
        setEditCategory(null);
        setShowAddCategory(false);
    };

    // Two-stage confirmation (Patrick, #67): a category delete takes its items
    // with it, so the warning comes twice before anything happens.
    const deleteCategory = (cat: VaultCategory) => {
        const count = items.filter(i => i.category === cat.id).length;
        const itemsNote = count === 0
            ? 'It has no items.'
            : count === 1
                ? 'The 1 item inside will be deleted with it.'
                : `The ${count} items inside will be deleted with it.`;
        Alert.alert('Delete Category', `Delete "${cat.name}"? ${itemsNote}`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    Alert.alert('Are You Sure?', `"${cat.name}" and everything in it will be permanently deleted. This cannot be undone.`, [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Yes, Delete', style: 'destructive', onPress: () => {
                                saveCategories(categories.filter(c => c.id !== cat.id));
                                saveItems(items.filter(i => i.category !== cat.id));
                            },
                        },
                    ]);
                },
            },
        ]);
    };

    const resetForm = () => {
        setNewLabel('');
        setNewValue('');
        setNewNotes('');
        setEditItem(null);
    };

    const addItem = () => {
        const label = newLabel.trim();
        if (!label || !newValue.trim()) {
            Alert.alert('Missing Info', 'Enter a Label and a Value.');
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
        const label = newLabel.trim();
        if (!label || !newValue.trim()) {
            Alert.alert('Missing Info', 'Enter a Label and a Value.');
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
        return categories.find(c => c.id === id);
    };

    if (!ready) return <View style={{ flex: 1, backgroundColor: theme.pageBackground }} />;

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* #62: no edges prop (default all edges), matching the seven taller-header
                pages — Patrick standardized on the taller header look. */}
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>
                        {selectedCategory ? getCategoryData(selectedCategory)?.name : 'Vault 🔒'}
                    </Text>
                    {selectedCategory ? (
                        <TouchableOpacity onPress={() => { resetForm(); setShowAddItem(true); }} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>+ Add</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => { setNewCategoryName(''); setShowAddCategory(true); }} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>+ Add</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>

            <Bridge />

            {!selectedCategory ? (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    <Text style={styles.securityNote}>🔒 Your data is stored securely on this device only.</Text>
                    {categories.map(cat => (
                        <Swipeable
                            key={cat.id}
                            renderRightActions={() => (
                                <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteCategory(cat)}>
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <TouchableOpacity
                                style={styles.categoryCard}
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <View style={styles.categoryInfo}>
                                    <Text style={styles.categoryName}>{cat.name}</Text>
                                    <Text style={styles.categoryCount}>
                                        {items.filter(i => i.category === cat.id).length} items
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => openEditCategory(cat)} style={[styles.editBtn, { marginRight: 12 }]} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <Text style={styles.categoryArrow}>›</Text>
                            </TouchableOpacity>
                        </Swipeable>
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
                                        <TouchableOpacity onPress={() => openEditItem(item)} style={styles.editBtn} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
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
                                <TextInput style={styles.input} value={newLabel} onChangeText={setNewLabel} placeholder="Enter label..." placeholderTextColor={theme.mutedText} autoFocus={true} />

                                <Text style={styles.inputLabel}>Value</Text>
                                <TextInput style={styles.input} value={newValue} onChangeText={setNewValue} placeholder="Enter value..." placeholderTextColor={theme.mutedText} secureTextEntry={false} />

                                <Text style={styles.inputLabel}>Notes (optional)</Text>
                                <TextInput style={styles.input} value={newNotes} onChangeText={setNewNotes} placeholder="e.g. where it's kept, expiry date..." placeholderTextColor={theme.mutedText} multiline />
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            )}

            {showAddCategory && (
                <Modal transparent animationType="slide" visible={showAddCategory}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalBox}>
                            <Text style={styles.modalTitle}>{editCategory ? 'Rename Category' : 'New Category'}</Text>

                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => { setNewCategoryName(''); setEditCategory(null); setShowAddCategory(false); }}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={editCategory ? renameCategory : addCategory}>
                                    <Text style={styles.confirmBtnText}>{editCategory ? 'Update' : 'Add'}</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput style={styles.input} value={newCategoryName} onChangeText={setNewCategoryName} placeholder="Enter category name..." placeholderTextColor={theme.mutedText} autoFocus={true} />
                        </View>
                    </View>
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
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        backBtn: { width: 70 },
        backText: { color: t.cardBorder, fontSize: 16 },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        settingsBtn: { width: 70, alignItems: 'flex-end' },
        settingsBtnText: { fontSize: 22 },
        scroll: { flex: 1, padding: 12 },
        securityNote: {
            fontSize: 13,
            color: t.mutedText,
            textAlign: 'center',
            marginBottom: 16,
            fontStyle: 'italic',
        },
        categoryCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        categoryInfo: { flex: 1 },
        categoryName: { fontSize: 18, fontWeight: '600', color: t.cardTitle },
        categoryCount: { fontSize: 13, color: t.mutedText, marginTop: 2 },
        categoryArrow: { fontSize: 28, color: t.mutedText },
        backToList: {
            alignSelf: 'flex-start',
            borderWidth: 1,
            borderColor: t.cardTitle,
            borderRadius: 20,
            paddingVertical: 6,
            paddingHorizontal: 14,
            marginBottom: 8,
        },
        backToListText: { color: t.cardTitle, fontSize: 16, fontWeight: '500' },
        emptyText: { textAlign: 'center', color: t.mutedText, marginTop: 40, fontSize: 16 },
        itemCard: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        itemHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        itemLabel: { fontSize: 16, fontWeight: '600', color: t.cardTitle, flex: 1 },
        itemActions: { flexDirection: 'row', gap: 8 },
        showBtn: {
            backgroundColor: t.bridge,
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 8,
        },
        showBtnText: { color: t.buttonPrimaryText, fontSize: 12, fontWeight: '600' },
        editBtn: {
            backgroundColor: t.pageBackground,
            borderWidth: 0.5,
            borderColor: t.cardTitle,
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 8,
        },
        editBtnText: { color: t.cardTitle, fontSize: 12, fontWeight: '600' },
        deleteBtn: {
            paddingVertical: 4,
            paddingHorizontal: 8,
        },
        deleteBtnText: { color: t.buttonDelete, fontSize: 16, fontWeight: '600' },
        itemValue: { fontSize: 15, color: t.bodyText, marginBottom: 4 },
        itemValueHidden: { fontSize: 15, color: t.mutedText, letterSpacing: 2, marginBottom: 4 },
        itemNotes: { fontSize: 12, color: t.mutedText, fontStyle: 'italic' },
        fab: {
            position: 'absolute',
            bottom: 20,
            right: 16,
            backgroundColor: t.buttonPrimary,
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 30,
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
        },
        fabText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 16 },
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
        modalTitle: { fontSize: 20, fontWeight: '600', color: t.cardTitle, marginBottom: 8 },
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
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
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
        swipeDeleteText: { color: t.buttonDeleteText, fontWeight: '600', fontSize: 15 },
        headerBtn: {
            width: 54,
            height: 54,
            borderRadius: 27,
            borderWidth: 1,
            borderColor: t.headerButton,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerBtnText: { color: t.headerButton, fontSize: 16, fontWeight: '600' },
    });