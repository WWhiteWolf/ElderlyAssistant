import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cover } from '../components/Cover';
import { ReminderItemRow } from '../components/ReminderItemRow';
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { PAGE_LABELS } from '../constants/page-names';
import { HeaderButton, PageFrame } from '../components/PageFrame';
import { Theme, useTheme } from '../constants/Themes';
import {
    dragVisibleTo,
    FROM_PAGE,
    format12Hour,
    loadReminderItems,
    saveReminderItems,
    sortDailyVisible,
    type ReminderItem,
} from '../modules/reminder-items';

interface HistoryEntry {
    id: string;
    date: string;
    sched: string;
    actual: string;
    what?: string;
    note?: string;
}

export default function DailyScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [items, setItems] = useState<ReminderItem[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [snoozeItemId, setSnoozeItemId] = useState<string | null>(null);
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');
    const [editNote, setEditNote] = useState('');

    const itemsRef = useRef(items);
    itemsRef.current = items;
    const visible = sortDailyVisible(items);
    const visibleRef = useRef(visible);
    visibleRef.current = visible;
    const rowHeights = useRef<Record<string, number>>({});
    const dragMeta = useRef<{
        id: string;
        startY: number;
        startIndex: number;
        snapshot: ReminderItem[];
    } | null>(null);
    const dragToIndex = useRef(0);
    const draggingIdRef = useRef<string | null>(null);

    const { highlight } = useLocalSearchParams<{ highlight?: string }>();
    useEffect(() => {
        if (typeof highlight === 'string' && highlight) setHighlightId(highlight);
    }, [highlight]);

    const refreshFromStorage = useCallback(async () => {
        const list = await loadReminderItems();
        setItems(list);
        const savedHist = await AsyncStorage.getItem('my_history');
        if (savedHist) setHistory(JSON.parse(savedHist));
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refreshFromStorage();
            const sub = AppState.addEventListener('change', (state) => {
                if (state === 'active') void refreshFromStorage();
            });
            return () => sub.remove();
        }, [refreshFromStorage]),
    );

    const openEdit = (item: ReminderItem) => {
        router.push({
            pathname: '/item-edit',
            params: {
                id: item.id,
                kind: item.kind,
                returnTo: 'daily',
                ...(item.kind === 'oneTime' ? { formContext: 'oneTimeForToday' } : {}),
            },
        } as Href);
    };

    const openNew = (kind: 'daily' | 'oneTime') => {
        setShowAddPopup(false);
        router.push({
            pathname: '/item-edit',
            params: {
                kind,
                returnTo: 'daily',
                ...(kind === 'oneTime' ? { formContext: 'oneTimeForToday' } : {}),
            },
        } as Href);
    };

    const writeItems = (updated: ReminderItem[]) => {
        setItems(updated);
        void saveReminderItems(updated);
    };

    const writeHistory = (updated: HistoryEntry[]) => {
        setHistory(updated);
        void AsyncStorage.setItem('my_history', JSON.stringify(updated));
    };

    const markDone = (id: string) => {
        const item = items.find((one) => one.id === id);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
        });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: now,
            what: '',
            note: '',
        };
        writeHistory([newEntry, ...history].slice(0, 50));
        writeItems(items.map((one) => {
            if (one.id !== id) return one;
            const { snoozedUntil, ...rest } = one;
            return {
                ...rest,
                completed: true,
                ...(one.kind === 'weekly' ? { doneAt: Date.now() } : {}),
            };
        }));
    };

    const undoDone = (id: string) => {
        const item = items.find((one) => one.id === id);
        if (!item) return;
        Alert.alert('Un-check Item', `Mark "${item.label}" as not done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark not done',
                onPress: () => {
                    writeItems(items.map((one) =>
                        one.id === id ? { ...one, completed: false, doneAt: undefined } : one
                    ));
                },
            },
        ]);
    };

    const snoozeItem = (minutes: number) => {
        if (!snoozeItemId) return;
        const item = items.find((one) => one.id === snoozeItemId);
        if (!item) { setSnoozeItemId(null); return; }
        const target = Date.now() + minutes * 60 * 1000;
        writeItems(items.map((one) =>
            one.id === item.id ? { ...one, snoozedUntil: target } : one
        ));
        setSnoozeItemId(null);
        Alert.alert('Snoozed', `${item.label} reminder set for ${minutes} minutes from now.`);
    };

    const beginDrag = useCallback((id: string, y: number) => {
        const vis = visibleRef.current;
        const startIndex = vis.findIndex((one) => one.id === id);
        if (startIndex < 0) return;
        dragMeta.current = {
            id,
            startY: y,
            startIndex,
            snapshot: itemsRef.current,
        };
        dragToIndex.current = startIndex;
        draggingIdRef.current = id;
        setDraggingId(id);
    }, []);

    const moveDrag = useCallback((y: number) => {
        const meta = dragMeta.current;
        if (!meta) return;
        const vis = sortDailyVisible(meta.snapshot);
        if (vis.length === 0) return;
        const avg =
            vis.reduce((sum, one) => sum + (rowHeights.current[one.id] ?? 40), 0) / vis.length;
        dragToIndex.current = Math.max(
            0,
            Math.min(vis.length - 1, meta.startIndex + Math.round((y - meta.startY) / avg)),
        );
    }, []);

    const endDrag = useCallback(() => {
        const meta = dragMeta.current;
        if (!meta && !draggingIdRef.current) return;
        if (meta) {
            const next = dragVisibleTo(meta.snapshot, meta.id, dragToIndex.current);
            itemsRef.current = next;
            setItems(next);
            void saveReminderItems(next);
        }
        dragMeta.current = null;
        draggingIdRef.current = null;
        setDraggingId(null);
    }, []);

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this entry from your routine?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    const updated = items.filter((one) => one.id !== id);
                    writeItems(updated);
                },
            },
        ]);
    };

    const deleteHistoryEntry = (id: string) => {
        writeHistory(history.filter((one) => one.id !== id));
    };

    const clearAllHistory = () => {
        Alert.alert(
            'Clear All',
            'Delete all log entries? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => writeHistory([]),
                },
            ],
        );
    };

    const rowLabel = (item: ReminderItem) => {
        const time =
            typeof item.hour === 'number' && typeof item.minute === 'number'
                ? `${format12Hour(item.hour, item.minute)} `
                : '';
        const from =
            item.kind !== 'daily' && item.kind !== 'extended'
                ? ` ${FROM_PAGE[item.kind]}`
                : '';
        return `${time}${item.label}${from}`;
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        <HeaderButton
                            onPress={() => {
                                if (router.canDismiss()) router.dismissAll();
                                router.replace('/home');
                            }}
                        >
                            <Text style={styles.headerBtnText}>Home</Text>
                        </HeaderButton>
                        <Text style={styles.title}>{PAGE_LABELS.daily}</Text>
                        <HeaderButton onPress={() => setShowAddPopup(true)}>
                            <Text style={styles.headerBtnText}>+ Add</Text>
                        </HeaderButton>
                    </View>
                }
            >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                scrollEnabled={!draggingId}
                scrollEventThrottle={16}
                directionalLockEnabled
            >
                <View style={styles.section}>
                    <Text style={styles.hintText}>Hold and slide to reorder · Tap to edit · Swipe to delete</Text>
                    {visible.map((item) => (
                        <View
                            key={item.id}
                            onLayout={(e) => {
                                rowHeights.current[item.id] = e.nativeEvent.layout.height;
                            }}
                        >
                            <ReminderItemRow
                                item={item}
                                highlighted={highlightId === item.id}
                                dragging={draggingId === item.id}
                                label={rowLabel(item)}
                                onTap={() => {
                                    if (highlightId === item.id) {
                                        setHighlightId(null);
                                        return;
                                    }
                                    openEdit(item);
                                }}
                                onDragStart={beginDrag}
                                onDragMove={moveDrag}
                                onDragEnd={endDrag}
                                onSnooze={() => setSnoozeItemId(item.id)}
                                onDone={() => item.completed ? undoDone(item.id) : markDone(item.id)}
                                onDelete={() => deleteEntry(item.id)}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Log</Text>
                        {history.length > 0 && (
                            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllHistory}>
                                <Text style={styles.clearAllBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView style={styles.historyScroll} nestedScrollEnabled>
                        {history.map((l) => (
                            <Swipeable
                                key={l.id}
                                renderRightActions={() => (
                                    <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteHistoryEntry(l.id)}>
                                        <Text style={styles.swipeDeleteText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            >
                                <TouchableOpacity
                                    style={styles.historyItem}
                                    onPress={() => {
                                        setEditEntry(l);
                                        setEditWhat(l.what || '');
                                        setEditNote(l.note || '');
                                    }}
                                >
                                    <Text style={styles.historyText}>
                                        {l.date} | {l.actual} | {l.sched}{l.what ? ` | ${l.what}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>
            </PageFrame>

            {editEntry && (
                <View style={styles.logModal}>
                    <Text style={styles.modalTitle}>Edit Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={editWhat}
                        onChangeText={setEditWhat}
                        placeholder="Add a note about this entry..."
                        placeholderTextColor={theme.mutedText}
                    />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={() => {
                                writeHistory(history.map((one) =>
                                    one.id === editEntry.id ? { ...one, what: editWhat, note: editNote } : one
                                ));
                                setEditEntry(null);
                            }}
                        >
                            <Text style={styles.confirmBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showAddPopup && (
                <Cover visible={showAddPopup}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>New</Text>
                            <TouchableOpacity style={styles.choiceBtn} onPress={() => openNew('daily')}>
                                <Text style={styles.choiceBtnText}>Every day</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.choiceBtn} onPress={() => openNew('oneTime')}>
                                <Text style={styles.choiceBtnText}>One Time for today</Text>
                            </TouchableOpacity>
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddPopup(false)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Cover>
            )}
            {snoozeItemId && (
                <Cover visible={!!snoozeItemId}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>Snooze Reminder</Text>
                            <Text style={styles.inputLabel}>
                                {items.find((one) => one.id === snoozeItemId)?.label} — remind me again in:
                            </Text>
                            <View style={styles.snoozeOptionRow}>
                                <TouchableOpacity style={styles.snoozeOption} onPress={() => snoozeItem(15)}>
                                    <Text style={styles.snoozeOptionText}>15 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.snoozeOption} onPress={() => snoozeItem(30)}>
                                    <Text style={styles.snoozeOptionText}>30 min</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.snoozeOption} onPress={() => snoozeItem(60)}>
                                    <Text style={styles.snoozeOptionText}>60 min</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setSnoozeItemId(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Cover>
            )}
        </GestureHandlerRootView>
    );
}

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
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        scroll: { flex: 1 },
        section: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 10,
            margin: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        hintText: { fontSize: 11, color: t.mutedText, marginTop: 2, marginBottom: 8 },
        snoozeOptionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: 12,
        },
        snoozeOption: {
            flex: 1,
            backgroundColor: t.delay,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginHorizontal: 4,
        },
        snoozeOptionText: { color: t.delayText, fontWeight: '600', fontSize: 16 },
        inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4 },
        swipeDelete: {
            backgroundColor: t.buttonDelete,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: 10,
            marginBottom: 4,
        },
        swipeDeleteText: {
            color: t.buttonDeleteText,
            fontWeight: '600',
            fontSize: 15,
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        pickerModal: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            width: '100%',
        },
        modalTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10 },
        choiceBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 8,
        },
        choiceBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 16 },
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
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
            padding: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: t.cardTitle,
            marginBottom: 10,
        },
        historySection: { marginHorizontal: 12, marginBottom: 12 },
        historyScroll: {
            height: 385,
            backgroundColor: t.card,
            borderRadius: 8,
            padding: 8,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        historyHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        historyItem: {
            borderBottomWidth: 0.5,
            borderBottomColor: t.progressTrack,
            paddingVertical: 6,
        },
        historyText: { fontSize: 13, color: t.bodyText, lineHeight: 18 },
        clearAllBtn: {
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: t.mutedText,
        },
        clearAllBtnText: {
            color: t.mutedText,
            fontSize: 13,
            fontWeight: '600',
        },
        logModal: {
            position: 'absolute',
            top: 100,
            left: 20,
            right: 20,
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            zIndex: 999,
        },
        input: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            backgroundColor: t.pageBackground,
            marginBottom: 10,
            color: t.bodyText,
        },
    });
