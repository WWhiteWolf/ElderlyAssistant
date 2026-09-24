import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useLandscapeHeaderSide, type LandscapeHeaderSide } from '../components/AppOrientation';
import { Cover } from '../components/Cover';
import { HeaderButton, PageFrame, rotateToFillStyle, uprightInLandscape, useLandscape } from '../components/PageFrame';
import { PAGE_LABELS } from '../constants/page-names';
import { Theme, useTheme } from '../constants/Themes';
import { FIRST_OPEN_PARAGRAPHS, USER_GUIDE_SEEN_KEY } from '../constants/user-guide';
import {
    applySavedHomeOrder,
    HOME_BADGES,
    HOME_BADGE_ORDER_KEY,
    moveHomeBadge,
    parseSavedHomeOrder,
    type HomeBadge,
} from '../modules/home-badges';

const HOME_COLUMNS = 2;
const GRID_INSET = 12;

function comfortablePicture(cellWidth: number, cellHeight: number, labelSize: number) {
    const labelBlock = labelSize * 1.25 + 8;
    const room = Math.max(0, Math.min(cellWidth - 12, cellHeight - 12 - labelBlock));
    const circle = Math.round(room * 0.72 * 0.95 * 0.95);
    if (circle < 1) return { circle: 48, icon: 24 };
    return { circle, icon: Math.round(circle * 0.5) };
}

function HomeBadgeTile({
    badge,
    landscape,
    headerSide,
    editing,
    dragging,
    styles,
    onOpen,
    onHold,
    onDragStart,
    onDragMove,
    onDragEnd,
    onSlot,
    onBindRebase,
}: {
    badge: HomeBadge;
    landscape: boolean;
    headerSide: LandscapeHeaderSide | null;
    editing: boolean;
    dragging: boolean;
    styles: ReturnType<typeof makeStyles>;
    onOpen: () => void;
    onHold: () => void;
    onDragStart: (id: string, x: number, y: number) => void;
    onDragMove: (x: number, y: number) => void;
    onDragEnd: () => void;
    onSlot: (id: string, x: number, y: number, w: number, h: number) => void;
    onBindRebase: (rebase: ((sx: number, sy: number) => void) | null) => void;
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
    const startAbsX = useSharedValue(0);
    const startAbsY = useSharedValue(0);
    const fingerX = useSharedValue(0);
    const fingerY = useSharedValue(0);
    const turn = landscape ? (headerSide === 'right' ? 2 : 1) : 0;

    const placeAtFinger = (absX: number, absY: number) => {
        const dx = absX - startAbsX.value;
        const dy = absY - startAbsY.value;
        if (turn === 2) {
            translateX.value = dy;
            translateY.value = -dx;
        } else if (turn === 1) {
            translateX.value = -dy;
            translateY.value = dx;
        } else {
            translateX.value = dx;
            translateY.value = dy;
        }
    };

    const tileRef = useRef<View>(null);
    const rebase = useCallback((sx: number, sy: number) => {
        startAbsX.value += sx;
        startAbsY.value += sy;
        placeAtFinger(fingerX.value, fingerY.value);
    }, [startAbsX, startAbsY, fingerX, fingerY, turn]);
    const rebaseHolder = useRef(rebase);
    rebaseHolder.current = rebase;
    const onBindRebaseRef = useRef(onBindRebase);
    onBindRebaseRef.current = onBindRebase;
    const bindLatest = useCallback(() => {
        onBindRebaseRef.current(rebaseHolder.current);
    }, []);

    const gesture = useMemo(() => {
        if (editing) {
            return Gesture.Pan()
                .minDistance(4)
                .onStart((e) => {
                    lifted.value = 1;
                    translateX.value = 0;
                    translateY.value = 0;
                    startAbsX.value = e.absoluteX;
                    startAbsY.value = e.absoluteY;
                    fingerX.value = e.absoluteX;
                    fingerY.value = e.absoluteY;
                    runOnJS(bindLatest)();
                    runOnJS(startJS)(badge.id, e.absoluteX, e.absoluteY);
                })
                .onUpdate((e) => {
                    fingerX.value = e.absoluteX;
                    fingerY.value = e.absoluteY;
                    const dx = e.absoluteX - startAbsX.value;
                    const dy = e.absoluteY - startAbsY.value;
                    if (turn === 2) {
                        translateX.value = dy;
                        translateY.value = -dx;
                    } else if (turn === 1) {
                        translateX.value = -dy;
                        translateY.value = dx;
                    } else {
                        translateX.value = dx;
                        translateY.value = dy;
                    }
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
    }, [editing, badge.id, startJS, moveJS, endJS, holdJS, tapJS, bindLatest, translateX, translateY, lifted, startAbsX, startAbsY, fingerX, fingerY, turn]);

    useEffect(() => {
        if (!dragging) return;
        onBindRebaseRef.current(rebase);
        return () => onBindRebaseRef.current(null);
    }, [dragging, rebase]);

    const liftedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
        zIndex: lifted.value ? 20 : 0,
        elevation: lifted.value ? 8 : 0,
    }));

    return (
        <View
            ref={tileRef}
            collapsable={false}
            style={[styles.tile, dragging && styles.tileFront]}
            onLayout={() => {
                tileRef.current?.measureInWindow((x, y, w, h) => {
                    onSlot(badge.id, x, y, w, h);
                });
            }}
        >
            <Animated.View style={[styles.tileLift, liftedStyle, dragging && styles.tileDragging]}>
                <GestureDetector gesture={gesture}>
                    <View style={styles.tileHit}>
                        <View style={[styles.tileInner, uprightInLandscape(landscape, headerSide)]}>
                            <View style={styles.iconCircle}>
                                <Text style={styles.tileIcon}>{badge.icon}</Text>
                            </View>
                            <Text style={styles.tileLabel}>{badge.label}</Text>
                        </View>
                    </View>
                </GestureDetector>
            </Animated.View>
        </View>
    );
}

export default function HomeScreen() {
    const router = useRouter();
    const theme = useTheme();
    const landscape = useLandscape();
    const headerSide = useLandscapeHeaderSide();

    const [userName, setUserName] = useState('');
    const [badges, setBadges] = useState<HomeBadge[]>(HOME_BADGES);
    const [editing, setEditing] = useState(false);
    const [holdBadge, setHoldBadge] = useState<HomeBadge | null>(null);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);
    const [bodySize, setBodySize] = useState({ width: 0, height: 0 });

    const picture = useMemo(() => {
        const { width, height } = bodySize;
        if (width <= 0 || height <= 0) return { circle: 48, icon: 24 };
        const localW = landscape ? height : width;
        const localH = landscape ? width : height;
        const rows = Math.ceil(HOME_BADGES.length / HOME_COLUMNS);
        const cellW = (localW - GRID_INSET * 2) / HOME_COLUMNS;
        const cellH = (localH - GRID_INSET * 2) / rows;
        return comfortablePicture(cellW, cellH, theme.tileLabelSize);
    }, [bodySize, landscape, theme.tileLabelSize]);

    const styles = makeStyles(theme, picture);

    const badgesRef = useRef(badges);
    badgesRef.current = badges;
    const slots = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});
    const dragMeta = useRef<{ id: string } | null>(null);
    const dragToIndex = useRef(0);
    const dragCells = useRef<{ x: number; y: number; w: number; h: number }[] | null>(null);
    const rebaseDrag = useRef<((sx: number, sy: number) => void) | null>(null);

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
                const seen = await AsyncStorage.getItem(USER_GUIDE_SEEN_KEY);
                setShowWelcome(seen !== 'true');
            };
            load();
        }, [])
    );

    const openBadge = (id: string) => {
        router.push(`/${id}` as Href);
    };

    const beginDrag = useCallback((id: string, _x: number, _y: number) => {
        const list = badgesRef.current;
        dragMeta.current = { id };
        dragToIndex.current = list.findIndex((one) => one.id === id);
        dragCells.current = list.map((one) => slots.current[one.id]).filter(
            (slot): slot is { x: number; y: number; w: number; h: number } => slot != null,
        );
        if (dragCells.current.length !== list.length) dragCells.current = null;
        setDraggingId(id);
    }, []);

    const moveDrag = useCallback((absX: number, absY: number) => {
        const meta = dragMeta.current;
        const cells = dragCells.current;
        if (!meta || !cells) return;
        let best = 0;
        let bestD = Infinity;
        cells.forEach((slot, i) => {
            const cx = slot.x + slot.w / 2;
            const cy = slot.y + slot.h / 2;
            const d = (cx - absX) ** 2 + (cy - absY) ** 2;
            if (d < bestD) {
                bestD = d;
                best = i;
            }
        });
        dragToIndex.current = best;
        const from = badgesRef.current.findIndex((one) => one.id === meta.id);
        if (from < 0 || from === best) return;
        const sx = cells[best].x - cells[from].x;
        const sy = cells[best].y - cells[from].y;
        rebaseDrag.current?.(sx, sy);
        const next = moveHomeBadge(badgesRef.current, meta.id, best);
        badgesRef.current = next;
        setBadges(next);
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
        dragCells.current = null;
        setDraggingId(null);
    }, [saveOrder]);

    const leaveEdit = useCallback(() => {
        setEditing(false);
        void saveOrder(badgesRef.current);
    }, [saveOrder]);

    const dismissWelcome = useCallback(() => {
        setShowWelcome(false);
        void AsyncStorage.setItem(USER_GUIDE_SEEN_KEY, 'true');
    }, []);

    const ready = !landscape || bodySize.width > 0;
    const gridStyle = landscape
        ? rotateToFillStyle(bodySize.width, bodySize.height, headerSide)
        : styles.gridFill;

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
            <View
                style={styles.body}
                onLayout={(e) => {
                    const { width, height } = e.nativeEvent.layout;
                    setBodySize((prev) => (
                        prev.width === width && prev.height === height ? prev : { width, height }
                    ));
                }}
            >
                {ready ? (
                    <View style={gridStyle}>
                        <View style={styles.gridPad}>
                        <View style={styles.grid}>
                            {badges.map((badge) => (
                                <HomeBadgeTile
                                    key={badge.id}
                                    badge={badge}
                                    landscape={landscape}
                                    headerSide={headerSide}
                                    editing={editing}
                                    dragging={draggingId === badge.id}
                                    styles={styles}
                                    onOpen={() => openBadge(badge.id)}
                                    onHold={() => setHoldBadge(badge)}
                                    onDragStart={beginDrag}
                                    onDragMove={moveDrag}
                                    onDragEnd={endDrag}
                                    onSlot={(id, x, y, w, h) => {
                                        slots.current[id] = { x, y, w, h };
                                    }}
                                    onBindRebase={(rebase) => {
                                        rebaseDrag.current = rebase;
                                    }}
                                />
                            ))}
                        </View>
                        </View>
                    </View>
                ) : null}
            </View>
            </PageFrame>
            <Cover visible={showWelcome}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>{PAGE_LABELS.userGuide}</Text>
                        <View>
                            {FIRST_OPEN_PARAGRAPHS.map((one) => (
                                <Text key={one} style={styles.welcomeParagraph}>{one}</Text>
                            ))}
                        </View>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.gotItBtn} onPress={dismissWelcome}>
                                <Text style={styles.choiceBtnText}>Got it</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Cover>
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

const makeStyles = (t: Theme, picture: { circle: number; icon: number }) =>
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
        body: {
            flex: 1,
            overflow: 'hidden',
        },
        gridFill: {
            flex: 1,
        },
        gridPad: {
            flex: 1,
            padding: GRID_INSET,
        },
        grid: {
            flex: 1,
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        tile: {
            width: '50%',
            height: `${100 / Math.ceil(HOME_BADGES.length / HOME_COLUMNS)}%`,
        },
        tileLift: {
            flex: 1,
        },
        tileFront: {
            zIndex: 20,
        },
        tileHit: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        tileDragging: {
            opacity: 0.92,
        },
        tileInner: {
            alignItems: 'center',
        },
        iconCircle: {
            width: picture.circle,
            height: picture.circle,
            borderRadius: picture.circle / 2,
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
            fontSize: picture.icon,
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
        welcomeParagraph: {
            fontSize: 16,
            color: t.bodyText,
            lineHeight: 22,
            marginBottom: 12,
        },
        gotItBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            flex: 1,
        },
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
