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
import { HeaderButton, PageFrame } from '../components/PageFrame';
import { Theme, useTheme } from '../constants/Themes';

interface Item {
    id: string;
    name: string;
    status: 'need' | 'stocked';
}

export default function ShoppingScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
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
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        <HeaderButton onPress={() => { if (router.canDismiss()) router.dismissAll(); router.replace('/home'); }}>
                            <Text style={styles.headerBtnText}>Home</Text>
                        </HeaderButton>
                        <Text style={styles.title}>Shopping List</Text>
                        <View style={styles.settingsBtn} />
                    </View>
                }
            >

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
                    onPress={() => { setView('shopping'); setSelectedId(null); }}
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
                        placeholderTextColor={theme.mutedText}
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
                            onPress={() => { if (view === 'inventory') setSelectedId(selectedId === item.id ? null : item.id); }}
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
                                    <Text style={[styles.statusText, item.status === 'stocked' && styles.statusTextStocked]}>
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
            </PageFrame>
        </GestureHandlerRootView>
    );
}

// makeStyles(theme) pattern from home.tsx (#45).
const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            backgroundColor: t.header,
            paddingTop: 20,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        backBtn: { width: 70 },
        settingsBtn: { width: 70, alignItems: 'flex-end' },
        settingsBtnText: { fontSize: 22 },
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
        tabRow: {
            flexDirection: 'row',
            backgroundColor: t.card,
            borderBottomWidth: 0.5,
            borderBottomColor: t.cardBorder,
        },
        tab: {
            flex: 1,
            paddingVertical: 14,
            alignItems: 'center',
        },
        tabActive: {
            borderBottomWidth: 3,
            borderBottomColor: t.buttonPrimary,
        },
        tabText: { fontSize: 16, color: t.mutedText, fontWeight: '500' },
        tabTextActive: { color: t.cardTitle },
        addRow: {
            flexDirection: 'row',
            padding: 12,
            gap: 8,
            backgroundColor: t.card,
            borderBottomWidth: 0.5,
            borderBottomColor: t.cardBorder,
        },
        input: {
            flex: 1,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            color: t.bodyText,
            backgroundColor: t.pageBackground,
        },
        addBtn: {
            backgroundColor: t.buttonPrimary,
            paddingHorizontal: 18,
            borderRadius: 8,
            justifyContent: 'center',
        },
        addBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 16 },
        list: { flex: 1, padding: 12 },
        emptyText: { textAlign: 'center', color: t.mutedText, marginTop: 40, fontSize: 16 },
        itemRow: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: t.card,
            borderRadius: 10,
            paddingVertical: 4,
            paddingHorizontal: 12,
            marginBottom: 8,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            gap: 12,
        },
        statusBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            // Border matches the fill on "Need" (invisible) so the button
            // doesn't change size when "Stocked" swaps in its outline.
            borderWidth: 1,
            borderColor: t.buttonPrimary,
        },
        swipeDelete: {
            backgroundColor: t.buttonDelete,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: 10,
            marginBottom: 8,
        },
        swipeDeleteText: {
            color: t.buttonDeleteText,
            fontWeight: '600',
            fontSize: 15,
        },
        statusStocked: {
            backgroundColor: t.stockedButton,
            borderColor: t.stockedButtonBorder,
        },
        statusText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 14 },
        statusTextStocked: { color: t.stockedButtonText },
        itemName: { flex: 1, fontSize: 18, color: t.bodyText },
        itemStocked: { color: t.mutedText, textDecorationLine: 'line-through' },
        itemSelected: {
            backgroundColor: t.rowSelected,
            borderColor: t.rowSelectedBorder,
            borderWidth: 1.5,
        },
        arrowOverlay: {
            position: 'absolute',
            right: 16,
            bottom: 120,
            backgroundColor: t.buttonPrimary,
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
            color: t.buttonPrimaryText,
            fontSize: 22,
            fontWeight: '600',
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
    });