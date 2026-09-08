import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useLandscapeHeaderSide } from '../components/AppOrientation';
import { Cover } from '../components/Cover';
import { HeaderButton, PageFrame, uprightInLandscape, useLandscape } from '../components/PageFrame';
import { Theme, useTheme } from '../constants/Themes';
import {
    applySavedHomeOrder,
    HOME_BADGES,
    HOME_BADGE_ORDER_KEY,
    moveHomeBadge,
    parseSavedHomeOrder,
    type HomeBadge,
} from '../modules/home-badges';

function HomeBadgeTile({
    badge,
    landscape,
    editing,
    dragging,
    styles,
    onOpen,
    onHold,
    onDragStart,
    onDragMove,
    onDragEnd,
    onLayout,
}: {
    badge: HomeBadge;
    landscape: boolean;
    editing: boolean;
    dragging: boolean;
    styles: ReturnType<typeof makeStyles>;
    onOpen: () => void;
    onHold: () => void;
    onDragStart: (id: string, x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
    onDragEnd: () => void;
    onLayout: (id: string, x: number, y: number, w: number, h: number) => void;
}) {
    const onOpenRef = useRef(onOpen);
    onOpenRef.current = onOpen;
    const onHoldRef = useRef(onHold);
    onHoldRef.current = onHold;
    const onDragStartRef = useRef(onDragStart);
    onDragStartRef.current = onDragStart;
    const onDragMoveRef = useRef(onDragMove);
    onDragMoveRef.current = onDragMove;
    const onDragEndRef = useRef(onDragEnd);
    onDragEndRef.current = onDragEnd;

    const tapJS = useCallback(() => { onOpenRef.current(); }, []);
    const holdJS = useCallback(() => { onHoldRef.current(); }, []);
    const startJS = useCallback((id: string, x: number, y: number) => { onDragStartRef.current(id, x, y); }, []);
    const moveJS = useCallback((x: number, y: number) => { onDragMoveRef.current(x, y); }, []);
    const endJS = useCallback(() => { onDragEndRef.current(); }, []);

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const lifted = useSharedValue(0);

    const gesture = useMemo(() => {
        if (editing) {
            return Gesture.Pan()
                .minDistance(4)
                .onStart((e) => {
                    lifted.value = 1;
                    translateX.value = 0;
                    translateY.value = 0;
                    runOnJS(startJS)(badge.id, e.absoluteX, e.absoluteY);
                })
                .onUpdate((e) => {
                    translateX.value = e.translationX;
                    translateY.value = e.translationY;
                    runOnJS(moveJS)(e.absoluteX, e.absoluteY);
                })
                .onFinalize(() => {
                    translateX.value = 0;
                    translateY.value = 0;
                    lifted.value = 0;
                    runOnJS(endJS)();
                });
        }
        const hold = Gesture.LongPress().minDuration(400).onStart(() => {
            runOnJS(holdJS)();
        });
        const tap = Gesture.Tap().onEnd(() => {
            runOnJS(tapJS)();
        });
        return Gesture.Exclusive(hold, tap);
    }, [editing, badge.id, startJS, moveJS, endJS, holdJS, tapJS, translateX, translateY, lifted]);

    const liftedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        zIndex: lifted.value ? 20 : 0,
        elevation: lifted.value ? 8 : 0,
    }));

    return (
        <Animated.View
            style={[styles.tile, landscape && styles.tileLandscape, liftedStyle, dragging && styles.tileDragging]}
            onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                onLayout(badge.id, x, y, width, height);
            }}
        >
            <GestureDetector gesture={gesture}>
                <View style={styles.tileInner}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.tileIcon}>{badge.icon}</Text>
                    </View>
                    <Text style={styles.tileLabel}>{badge.label}</Text>
                </View>
            </GestureDetector>
        </Animated.View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const landscape = useLandscape();
    const headerSide = useLandscapeHeaderSide();

    const [userName, setUserName] = useState('');
    const [badges, setBadges] = useState<HomeBadge[]>(HOME_BADGES);
    const [editing, setEditing] = useState(false);
    const [holdBadge, setHoldBadge] = useState<HomeBadge | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);

    const badgesRef = useRef(badges);
    badgesRef.current = badges;
    const gridRef = useRef<View>(null);
    const gridOrigin = useRef({ x: 0, y: 0 });
    const slots = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});
    const dragMeta = useRef<{ id: string } | null>(null);
    const dragToIndex = useRef(0);

    const saveOrder = useCallback(async (list: HomeBadge[]) => {
        await AsyncStorage.setItem(HOME_BADGE_ORDER_KEY, JSON.stringify(list.map((one) => one.id)));
    }, []);

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const name = await AsyncStorage.getItem('user_name');
                if (name) setUserName(name);
                const raw = await AsyncStorage.getItem(HOME_BADGE_ORDER_KEY);
                setBadges(applySavedHomeOrder(parseSavedHomeOrder(raw)));
            };
            load();
        }, [])
    );

    const openBadge = (id: string) => {
        router.push(`/${id}` as Href);
    };

    const beginDrag = useCallback((id: string, _x: number, _y: number) => {
        gridRef.current?.measureInWindow((gx, gy) => {
            gridOrigin.current = { x: gx, y: gy };
        });
        dragMeta.current = { id };
        dragToIndex.current = badgesRef.current.findIndex((one) => one.id === id);
        setDraggingId(id);
    }, []);

    const moveDrag = useCallback((absX: number, absY: number) => {
        const meta = dragMeta.current;
        if (!meta) return;
        const origin = gridOrigin.current;
        const x = absX - origin.x;
        const y = absY - origin.y;
        const list = badgesRef.current;
        let best = 0;
        let bestD = Infinity;
        list.forEach((one, i) => {
            const slot = slots.current[one.id];
            if (!slot) return;
            const cx = slot.x + slot.w / 2;
            const cy = slot.y + slot.h / 2;
            const d = (cx - x) ** 2 + (cy - y) ** 2;
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        });
        dragToIndex.current = best;
    }, []);

    const endDrag = useCallback(() => {
        const meta = dragMeta.current;
        if (meta) {
            const next = moveHomeBadge(badgesRef.current, meta.id, dragToIndex.current);
            badgesRef.current = next;
            setBadges(next);
            void saveOrder(next);
        }
        dragMeta.current = null;
        setDraggingId(null);
    }, [saveOrder]);

    const leaveEdit = useCallback(() => {
        setEditing(false);
        void saveOrder(badgesRef.current);
    }, [saveOrder]);

    return (
        <GestureHandlerRootView style={styles.container}>
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        {editing ? (
                            <View style={styles.titleRow}>
                                <HeaderButton onPress={leaveEdit}>
                                    <Text style={styles.headerBtnText}>Done</Text>
                                </HeaderButton>
                                <Text style={[styles.title, styles.titleInRow]}>A Place To Remember</Text>
                                <HeaderButton invisible />
                            </View>
                        ) : (
                            <Text style={styles.title}>A Place To Remember</Text>
                        )}
                        <View style={styles.subtitleRow}>
                            <View style={{ width: 70, alignItems: 'flex-start' }}>
                                <Image
                                    source={require('../assets/images/icon-face.png')}
                                    style={[styles.headerIcon, uprightInLandscape(landscape, headerSide)]}
                                />
                            </View>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.subtitle}>Good to see you{userName ? `, ${userName}` : ''}!</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 70, alignItems: 'flex-end' }} hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}>
                                <Ionicons name="settings" size={32} color={theme.settingsGear} />
                            </TouchableOpacity>
                        </View>
                    </View>
                }
            >
            <ScrollView
                contentContainerStyle={styles.gridScroll}
                scrollEnabled={draggingId == null}
            >
                <View
                    ref={gridRef}
                    style={styles.grid}
                    onLayout={() => {
                        gridRef.current?.measureInWindow((x, y) => {
                            gridOrigin.current = { x, y };
                        });
                    }}
                >
                    {badges.map((badge) => (
                        <HomeBadgeTile
                            key={badge.id}
                            badge={badge}
                            landscape={landscape}
                            editing={editing}
                            dragging={draggingId === badge.id}
                            styles={styles}
                            onOpen={() => openBadge(badge.id)}
                            onHold={() => setHoldBadge(badge)}
                            onDragStart={beginDrag}
                            onDragMove={moveDrag}
                            onDragEnd={endDrag}
                            onLayout={(id, x, y, w, h) => {
                                slots.current[id] = { x, y, w, h };
                            }}
                        />
                    ))}
                </View>
            </ScrollView>
            </PageFrame>
            <Cover visible={holdBadge != null}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>{holdBadge?.label}</Text>
                        <TouchableOpacity
                            style={styles.choiceBtn}
                            onPress={() => {
                                setHoldBadge(null);
                                setEditing(true);
                            }}
                        >
                            <Text style={styles.choiceBtnText}>Edit Home Screen</Text>
                        </TouchableOpacity>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setHoldBadge(null)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Cover>
        </GestureHandlerRootView>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: t.pageBackground,
        },
        header: {
            backgroundColor: t.header,
            paddingBottom: 12,
            paddingHorizontal: 16,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        titleInRow: {
            flex: 1,
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        subtitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerIcon: {
            width: 32,
            height: 32,
            tintColor: t.settingsGear,
        },
        title: {
            fontSize: t.titleSize,
            fontWeight: t.titleWeight,
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            textAlign: 'center',
        },
        subtitle: {
            fontSize: t.subtitleSize,
            paddingBottom: 12,
            color: t.subtitleText,
            fontWeight: t.subtitleWeight,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            marginTop: 4,
        },
        gridScroll: {
            flexGrow: 1,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            padding: 16,
            gap: 12,
            justifyContent: 'space-between',
        },
        tile: {
            width: '47%',
            alignItems: 'center',
            paddingVertical: 12,
        },
        tileLandscape: {
            width: '22%',
        },
        tileDragging: {
            opacity: 0.92,
        },
        tileInner: {
            alignItems: 'center',
        },
        iconCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: t.tileCircle,
            borderWidth: t.tileCircleBorderWidth,
            borderColor: t.tileCircleBorder,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            shadowColor: t.tileHalo,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: t.tileHaloOpacity,
            shadowRadius: t.tileHaloRadius,
        },
        tileIcon: {
            fontSize: 24,
            ...(t.iconShadow
                ? {
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                  }
                : null),
        },
        tileLabel: {
            fontSize: t.tileLabelSize,
            fontWeight: '600',
            fontFamily: t.tileLabelFont,
            color: t.tileLabel,
            textAlign: 'center',
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
        },
        cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
    });
