import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
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

interface Item {
    id: string;
    name: string;
    status: 'need' | 'stocked';
}

export default function ShoppingScreen() {
    const router = useRouter();
    const [items, setItems] = useState<Item[]>([]);
    const [newItem, setNewItem] = useState('');
    const [view, setView] = useState<'inventory' | 'shopping'>('inventory');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        const saved = await AsyncStorage.getItem('shopping_items');
        if (saved) setItems(JSON.parse(saved));
    };

    const saveItems = async (updated: Item[]) => {
        setItems(updated);
        await AsyncStorage.setItem('shopping_items', JSON.stringify(updated));
    };

    const addItem = () => {
        if (!newItem.trim()) return;
        const item: Item = {
            id: Date.now().toString(),
            name: newItem.trim(),
            status: 'need',
        };
        saveItems([...items, item]);
        setNewItem('');
    };

    const toggleStatus = (id: string) => {
        const updated = items.map(i =>
            i.id === id
                ? { ...i, status: i.status === 'need' ? 'stocked' : 'need' }
                : i
        ) as Item[];
        saveItems(updated);
    };

    const deleteItem = (id: string) => {
        Alert.alert('Delete Item', 'Remove this item from your inventory?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => saveItems(items.filter(i => i.id !== id)),
            },
        ]);
    };

    const moveItem = (id: string, direction: 'up' | 'down') => {
        const index = items.findIndex(i => i.id === id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === items.length - 1) return;
        const updated = [...items];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
        saveItems(updated);
    };

    const displayItems = view === 'shopping'
        ? items.filter(i => i.status === 'need')
        : items;

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

            <View style={styles.tabRow}>
                <TouchableOpacity
                    style={[styles.tab, view === 'inventory' && styles.tabActive]}
                    onPress={() => setView('inventory')}
                >
                    <Text style={[styles.tabText, view === 'inventory' && styles.tabTextActive]}>
                        Full Inventory
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, view === 'shopping' && styles.tabActive]}
                    onPress={() => setView('shopping')}
                >
                    <Text style={[styles.tabText, view === 'shopping' && styles.tabTextActive]}>
                        Shopping
                    </Text>
                </TouchableOpacity>
            </View>

            {view === 'inventory' && (
                <View style={styles.addRow}>
                    <TextInput
                        style={styles.input}
                        value={newItem}
                        onChangeText={setNewItem}
                        placeholder="Add new item..."
                        placeholderTextColor="#aaa"
                        onSubmitEditing={addItem}
                        returnKeyType="done"
                    />
                    <TouchableOpacity style={styles.addBtn} onPress={addItem}>
                        <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                </View>
            )}

            <ScrollView style={styles.list}>
                {displayItems.length === 0 && (
                    <Text style={styles.emptyText}>
                        {view === 'shopping' ? 'Nothing on your shopping list.' : 'No items yet. Add some above.'}
                    </Text>
                )}
                {displayItems.map(item => (
                    <Swipeable
                        key={item.id}
                        renderRightActions={() => (
                            view === 'inventory' ? (
                                <TouchableOpacity
                                    style={styles.swipeDelete}
                                    onPress={() => deleteItem(item.id)}
                                >
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            ) : null
                        )}
                    >
                        <TouchableOpacity
                            onPress={() => setSelectedId(selectedId === item.id ? null : item.id)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.itemRow, selectedId === item.id && styles.itemSelected]}>
                                <Text style={styles.itemName}>
                                    {item.name}
                                </Text>
                                <TouchableOpacity
                                    style={[styles.statusBtn, item.status === 'stocked' && styles.statusStocked]}
                                    onPress={() => toggleStatus(item.id)}
                                >
                                    <Text style={styles.statusText}>
                                        {item.status === 'need' ? 'Need' : 'Stocked'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </Swipeable>
                ))}
            </ScrollView>
            {selectedId && view === 'inventory' && (
                <View style={styles.arrowOverlay}>
                    <TouchableOpacity
                        style={styles.arrowBtn}
                        onPress={() => moveItem(selectedId, 'up')}
                    >
                        <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.arrowBtn}
                        onPress={() => moveItem(selectedId, 'down')}
                    >
                        <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                </View>
            )}
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
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
    tabRow: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.lightBlue,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
    },
    tabActive: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.primary,
    },
    tabText: { fontSize: 16, color: '#aaa', fontWeight: '500' },
    tabTextActive: { color: Colors.primary },
    addRow: {
        flexDirection: 'row',
        padding: 12,
        gap: 8,
        backgroundColor: Colors.white,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.lightBlue,
    },
    input: {
        flex: 1,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.background,
    },
    addBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 18,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addBtnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
    list: { flex: 1, padding: 12 },
    emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 16 },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        gap: 12,
    },
    statusBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    swipeDelete: {
        backgroundColor: '#e74c3c',
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 10,
        marginBottom: 8,
    },
    swipeDeleteText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
    statusStocked: { backgroundColor: Colors.bridge },
    statusText: { color: Colors.white, fontWeight: '600', fontSize: 14 },
    itemName: { flex: 1, fontSize: 18, color: Colors.text },
    itemStocked: { color: '#aaa', textDecorationLine: 'line-through' },
    itemSelected: {
        backgroundColor: '#d6eef8',
        borderColor: Colors.primary,
        borderWidth: 1.5,
    },
    arrowOverlay: {
        position: 'absolute',
        right: 16,
        bottom: 120,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 8,
        gap: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
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