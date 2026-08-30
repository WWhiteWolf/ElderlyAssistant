import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import AddWherePopup from './AddWherePopup';
import Bridge from './Bridge';
import { Theme, useTheme } from '../constants/Themes';
import {
    advanceDatedItem,
    dragKindTo,
    formatItemWhen,
    loadReminderItems,
    saveReminderItems,
    snoozeLineOf,
    type ReminderItem,
    type ReminderKind,
} from '../modules/reminder-items';

type PageStyles = ReturnType<typeof makeStyles>;

function CadenceItemRow({
    item,
    highlighted,
    dragging,
    styles,
    onTap,
    onDragStart,
    onDragMove,
    onDragEnd,
    onSnooze,
    onDone,
    onDelete,
}: {
    item: ReminderItem;
    highlighted: boolean;
    dragging: boolean;
    styles: PageStyles;
    onTap: () => void;
    onDragStart: (id: string, y: number) => void;
    onDragMove: (y: number) => void;
    onDragEnd: () => void;
    onSnooze: () => void;
    onDone: () => void;
    onDelete: () => void;
}) {
    const onTapRef = useRef(onTap);
    onTapRef.current = onTap;
    const onDragStartRef = useRef(onDragStart);
    onDragStartRef.current = onDragStart;
    const onDragMoveRef = useRef(onDragMove);
    onDragMoveRef.current = onDragMove;
    const onDragEndRef = useRef(onDragEnd);
    onDragEndRef.current = onDragEnd;

    const tapJS = useCallback(() => { onTapRef.current(); }, []);
    const startJS = useCallback((id: string, y: number) => { onDragStartRef.current(id, y); }, []);
    const moveJS = useCallback((y: number) => { onDragMoveRef.current(y); }, []);
    const endJS = useCallback(() => { onDragEndRef.current(); }, []);

    const translateY = useSharedValue(0);
    const lifted = useSharedValue(0);

    const gesture = useMemo(() => {
        const drag = Gesture.Pan()
            .activateAfterLongPress(400)
            .onStart((e) => {
                lifted.value = 1;
                translateY.value = 0;
                runOnJS(startJS)(item.id, e.absoluteY);
            })
            .onUpdate((e) => {
                translateY.value = e.translationY;
                runOnJS(moveJS)(e.absoluteY);
            })
            .onFinalize(() => {
                translateY.value = 0;
                lifted.value = 0;
                runOnJS(endJS)();
            });
        const tap = Gesture.Tap().onEnd(() => {
            runOnJS(tapJS)();
        });
        return Gesture.Race(drag, tap);
    }, [item.id, startJS, moveJS, endJS, tapJS, translateY, lifted]);

    const liftedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        zIndex: lifted.value ? 20 : 0,
        elevation: lifted.value ? 8 : 0,
    }));

    const when = formatItemWhen(item);
    const snoozeLine = snoozeLineOf(item);

    return (
        <Animated.View style={liftedStyle}>
            <Swipeable
                renderRightActions={() => (
                    <TouchableOpacity style={styles.swipeDelete} onPress={onDelete}>
                        <Text style={styles.swipeDeleteText}>Delete</Text>
                    </TouchableOpacity>
                )}
            >
                <View style={[styles.row, dragging && styles.rowSelected, highlighted && styles.rowHighlighted]}>
                    <GestureDetector gesture={gesture}>
                        <View style={styles.labelArea}>
                            <Text style={styles.itemLabel}>{item.label}</Text>
                            {when !== '' && (
                                <Text style={styles.itemSub}>{when}</Text>
                            )}
                            {snoozeLine != null && (
                                <Text style={styles.snoozedNote}>{snoozeLine}</Text>
                            )}
                        </View>
                    </GestureDetector>
                    <TouchableOpacity style={styles.snoozeRowBtn} onPress={onSnooze}>
                        <Text style={styles.snoozeRowBtnText}>Snooze</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.doneBtn, item.completed && styles.doneBtnOn]}
                        onPress={onDone}
                    >
                        <Text style={[styles.doneBtnText, item.completed && styles.doneBtnTextOn]}>
                            {item.completed ? '✓' : 'Done'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Swipeable>
        </Animated.View>
    );
}

export default function CadenceListPage({
    title,
    kind,
    returnTo,
}: {
    title: string;
    kind: ReminderKind;
    returnTo: string;
}) {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [items, setItems] = useState<ReminderItem[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [snoozeItemId, setSnoozeItemId] = useState<string | null>(null);

    const itemsRef = useRef(items);
    itemsRef.current = items;
    const visible = items.filter((one) => one.kind === kind);
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

    useFocusEffect(
        useCallback(() => {
            void loadReminderItems().then(setItems);
        }, []),
    );

    const writeItems = (updated: ReminderItem[]) => {
        setItems(updated);
        void saveReminderItems(updated);
    };

    const markDone = (id: string) => {
        const item = items.find((one) => one.id === id);
        if (!item) return;
        if (kind === 'weekly') {
            writeItems(items.map((one) => {
                if (one.id !== id) return one;
                const { snoozedUntil, ...rest } = one;
                return { ...rest, completed: true, doneAt: Date.now() };
            }));
            return;
        }
        if (kind === 'monthly' || kind === 'quarterly' || kind === 'yearly') {
            writeItems(items.map((one) => (one.id === id ? advanceDatedItem(one) : one)));
            return;
        }
        writeItems(items.map((one) => {
            if (one.id !== id) return one;
            const { snoozedUntil, ...rest } = one;
            return { ...rest, completed: true };
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
        const vis = meta.snapshot.filter((one) => one.kind === kind);
        if (vis.length === 0) return;
        const avg =
            vis.reduce((sum, one) => sum + (rowHeights.current[one.id] ?? 40), 0) / vis.length;
        dragToIndex.current = Math.max(
            0,
            Math.min(vis.length - 1, meta.startIndex + Math.round((y - meta.startY) / avg)),
        );
    }, [kind]);

    const endDrag = useCallback(() => {
        const meta = dragMeta.current;
        if (!meta && !draggingIdRef.current) return;
        if (meta) {
            const next = dragKindTo(meta.snapshot, kind, meta.id, dragToIndex.current);
            itemsRef.current = next;
            setItems(next);
            void saveReminderItems(next);
        }
        dragMeta.current = null;
        draggingIdRef.current = null;
        setDraggingId(null);
    }, [kind]);

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => writeItems(items.filter((one) => one.id !== id)),
            },
        ]);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            router.dismissAll();
                            router.replace('/home');
                        }}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={() => setShowAdd(true)} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <Bridge />

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
                            <CadenceItemRow
                                item={item}
                                highlighted={highlightId === item.id}
                                dragging={draggingId === item.id}
                                styles={styles}
                                onTap={() => {
                                    if (highlightId === item.id) {
                                        setHighlightId(null);
                                        return;
                                    }
                                    router.push({ pathname: '/item-edit', params: { id: item.id, returnTo } } as Href);
                                }}
                                onDragStart={beginDrag}
                                onDragMove={moveDrag}
                                onDragEnd={endDrag}
                                onSnooze={() => setSnoozeItemId(item.id)}
                                onDone={() => {
                                    if ((kind === 'weekly' || kind === 'oneTime' || kind === 'extended') && item.completed) {
                                        undoDone(item.id);
                                        return;
                                    }
                                    markDone(item.id);
                                }}
                                onDelete={() => deleteEntry(item.id)}
                            />
                        </View>
                    ))}
                </View>
            </ScrollView>

            <AddWherePopup
                visible={showAdd}
                currentKind={kind}
                returnTo={returnTo}
                onClose={() => setShowAdd(false)}
            />
            {snoozeItemId && (
                <Modal transparent animationType="fade" visible={!!snoozeItemId}>
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
                </Modal>
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
        scroll: { flex: 1 },
        section: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 10,
            margin: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
            borderWidth: 2,
            borderColor: 'transparent',
            paddingVertical: 2,
        },
        rowHighlighted: {
            borderRadius: 8,
            borderColor: t.rowReminderBorder,
        },
        hintText: { fontSize: 11, color: t.mutedText, marginTop: 2, marginBottom: 8 },
        labelArea: { flex: 1, marginRight: 6 },
        itemLabel: { fontSize: 16, color: t.bodyText, fontWeight: '500' },
        itemSub: { fontSize: 13, color: t.mutedText, marginTop: 1 },
        rowSelected: {
            backgroundColor: t.rowSelected,
            borderRadius: 8,
        },
        snoozedNote: { fontSize: 12, color: t.delay, fontWeight: '600', marginTop: 1 },
        snoozeRowBtn: {
            backgroundColor: t.delay,
            paddingVertical: 5,
            paddingHorizontal: 8,
            borderRadius: 8,
            marginRight: 6,
        },
        snoozeRowBtnText: { color: t.delayText, fontSize: 13, fontWeight: '600' },
        doneBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 8,
        },
        doneBtnOn: { backgroundColor: t.buttonDone },
        doneBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 13 },
        doneBtnTextOn: { color: t.buttonDoneText },
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
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
        cancelBtn: {
            backgroundColor: t.buttonNeutral,
            borderWidth: 1,
            borderColor: t.buttonNeutralBorder,
            padding: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
    });
