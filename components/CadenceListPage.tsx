import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    AppState,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeaderButton, PageFrame } from './PageFrame';
import { Cover } from './Cover';
import { ReminderItemRow } from './ReminderItemRow';
import { PAGE_LABELS, pageLabelFor } from '../constants/page-names';
import { Theme, useTheme } from '../constants/Themes';
import { dayListLine } from '../modules/birth-year';
import {
    dragKindTo,
    dragVisibleTo,
    format12Hour,
    formatItemWhen,
    FROM_PAGE,
    applyReminderChange,
    historyKeyFor,
    loadReminderItems,
    markReminderDone,
    doneActionCodeOf,
    snoozeChoicesOf,
    sortDailyVisible,
    type ReminderItem,
    type ReminderKind,
} from '../modules/reminder-items';

function visibleFor(kind: ReminderKind, items: ReminderItem[]): ReminderItem[] {
    if (kind === 'daily') return sortDailyVisible(items);
    return items.filter((one) => one.kind === kind);
}

function dailyRowLabel(item: ReminderItem): string {
    const time =
        typeof item.hour === 'number' && typeof item.minute === 'number'
            ? `${format12Hour(item.hour, item.minute)} `
            : '';
    if (typeof item.birthYear === 'number') {
        return `${time}${dayListLine(item, new Date().getFullYear())}`;
    }
    const from =
        item.kind !== 'daily' && item.kind !== 'oneTime' && item.kind !== 'bucketlist'
            ? ` ${FROM_PAGE[item.kind]}`
            : '';
    return `${time}${item.label}${from}`;
}

export default function CadenceListPage({
    kind,
    returnTo,
}: {
    kind: ReminderKind;
    returnTo: string;
}) {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [items, setItems] = useState<ReminderItem[]>([]);
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [highlightId, setHighlightId] = useState<string | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [snoozeItemId, setSnoozeItemId] = useState<string | null>(null);
    const historyKey = historyKeyFor(kind);

    const itemsRef = useRef(items);
    itemsRef.current = items;
    const visible = visibleFor(kind, items);
    const snoozeTarget = snoozeItemId ? items.find((one) => one.id === snoozeItemId) : undefined;
    const snoozeChoices = snoozeTarget ? snoozeChoicesOf(snoozeTarget) : [];
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
        setItems(await loadReminderItems());
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

    const writeItems = (patch: (list: ReminderItem[]) => ReminderItem[]) => {
        void applyReminderChange(patch).then(setItems);
    };

    const markDone = (id: string) => {
        const now = new Date().toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: false,
        });
        void markReminderDone(id, historyKey, now).then(() => refreshFromStorage());
    };

    const undoDone = (id: string) => {
        const item = items.find((one) => one.id === id);
        if (!item) return;
        Alert.alert('Un-check Item', `Mark "${item.label}" as not done?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Mark not done',
                onPress: () => {
                    writeItems((list) => list.map((one) => {
                        if (one.id !== id) return one;
                        if (
                            doneActionCodeOf(one.kind) === 'advanceDate'
                            && typeof one.priorYear === 'number'
                            && typeof one.priorMonth === 'number'
                            && typeof one.priorDay === 'number'
                        ) {
                            const {
                                completed: _completed,
                                doneAt: _doneAt,
                                priorYear,
                                priorMonth,
                                priorDay,
                                ...rest
                            } = one;
                            void _completed;
                            void _doneAt;
                            return {
                                ...rest,
                                year: priorYear,
                                month: priorMonth,
                                day: priorDay,
                                completed: false,
                            };
                        }
                        return { ...one, completed: false, doneAt: undefined };
                    }));
                },
            },
        ]);
    };

    const snoozeItem = (stampAt: (now: number) => number, label: string) => {
        if (!snoozeItemId) return;
        const item = items.find((one) => one.id === snoozeItemId);
        if (!item) { setSnoozeItemId(null); return; }
        const target = stampAt(Date.now());
        writeItems((list) => list.map((one) =>
            one.id === item.id ? { ...one, snoozedUntil: target } : one
        ));
        setSnoozeItemId(null);
        Alert.alert('Snoozed', `${item.label} reminder set for ${label} from now.`);
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
        const vis = visibleFor(kind, meta.snapshot);
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
            void applyReminderChange((list) =>
                kind === 'daily'
                    ? dragVisibleTo(list, meta.id, dragToIndex.current)
                    : dragKindTo(list, kind, meta.id, dragToIndex.current)
            ).then((next) => {
                itemsRef.current = next;
                setItems(next);
            });
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
                onPress: () => writeItems((list) => list.filter((one) => one.id !== id)),
            },
        ]);
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
                        <Text style={styles.title}>{pageLabelFor(kind)}</Text>
                        <View style={styles.headerRight}>
                            <HeaderButton
                                onPress={() => {
                                    router.push({ pathname: '/log', params: { kind, returnTo } } as Href);
                                }}
                            >
                                <Text style={styles.headerBtnText}>{PAGE_LABELS.log}</Text>
                            </HeaderButton>
                            <HeaderButton
                                onPress={() => {
                                    if (kind === 'daily') {
                                        setShowAddPopup(true);
                                        return;
                                    }
                                    router.push({ pathname: '/item-edit', params: { kind, returnTo } } as Href);
                                }}
                            >
                                <Text style={styles.headerBtnText}>+ Add</Text>
                            </HeaderButton>
                        </View>
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
                                label={kind === 'daily' ? dailyRowLabel(item) : item.label}
                                subtitle={kind === 'daily' ? undefined : formatItemWhen(item)}
                                onTap={() => {
                                    if (highlightId === item.id) {
                                        setHighlightId(null);
                                        return;
                                    }
                                    router.push({ pathname: '/item-edit', params: { id: item.id, kind: item.kind, returnTo } } as Href);
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
            </ScrollView>
            </PageFrame>

            {showAddPopup && (
                <Cover visible={showAddPopup}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>New</Text>
                            <TouchableOpacity
                                style={styles.choiceBtn}
                                onPress={() => {
                                    setShowAddPopup(false);
                                    router.push({ pathname: '/item-edit', params: { kind: 'daily', returnTo } } as Href);
                                }}
                            >
                                <Text style={styles.choiceBtnText}>Every day</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.choiceBtn}
                                onPress={() => {
                                    setShowAddPopup(false);
                                    router.push({ pathname: '/item-edit', params: { kind: 'oneTime', returnTo } } as Href);
                                }}
                            >
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
                                {snoozeTarget?.label} — remind me again in:
                            </Text>
                            <View style={styles.snoozeOptionRow}>
                                {snoozeChoices.map((choice) => (
                                    <TouchableOpacity
                                        key={choice.label}
                                        style={styles.snoozeOption}
                                        onPress={() => snoozeItem(choice.stampAt, choice.label)}
                                    >
                                        <Text style={styles.snoozeOptionText}>{choice.label}</Text>
                                    </TouchableOpacity>
                                ))}
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
        headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    });
