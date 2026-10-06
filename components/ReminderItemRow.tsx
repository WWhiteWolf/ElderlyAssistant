// The one list row for Daily and for Weekly through Bucket List.
//
// Daily composes its name (time, visiting page) on the shared list page. The
// other pages still pass the when-line as the subtitle. Buttons, swipe, and
// hold-to-reorder live here so a later change cannot land on one list and miss
// the other.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Theme, useTheme } from '../constants/Themes';
import { hasReminderSet, snoozeLineOf, type ReminderItem } from '../modules/reminder-items';

export function ReminderItemRow({
    item,
    highlighted,
    dragging,
    label,
    subtitle,
    onTap,
    onDragStart,
    onDragMove,
    onDragEnd,
    onBindRebase,
    onSnooze,
    onDone,
    onDelete,
}: {
    item: ReminderItem;
    highlighted: boolean;
    dragging: boolean;
    label: string;
    subtitle?: string;
    onTap: () => void;
    onDragStart: (id: string, y: number) => void;
    onDragMove: (y: number) => void;
    onDragEnd: () => void;
    onBindRebase: (rebase: ((sy: number) => void) | null) => void;
    onSnooze: () => void;
    onDone: () => void;
    onDelete: () => void;
}) {
    const theme = useTheme();
    const styles = makeStyles(theme);
    const snoozeLine = snoozeLineOf(item);

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
    const startAbsY = useSharedValue(0);
    const fingerY = useSharedValue(0);

    const rebase = useCallback((sy: number) => {
        startAbsY.value += sy;
        translateY.value = fingerY.value - startAbsY.value;
    }, [startAbsY, fingerY, translateY]);
    const rebaseHolder = useRef(rebase);
    rebaseHolder.current = rebase;
    const onBindRebaseRef = useRef(onBindRebase);
    onBindRebaseRef.current = onBindRebase;
    const bindLatest = useCallback(() => {
        onBindRebaseRef.current(rebaseHolder.current);
    }, []);

    const gesture = useMemo(() => {
        const drag = Gesture.Pan()
            .activateAfterLongPress(400)
            .onStart((e) => {
                lifted.value = 1;
                translateY.value = 0;
                startAbsY.value = e.absoluteY;
                fingerY.value = e.absoluteY;
                runOnJS(bindLatest)();
                runOnJS(startJS)(item.id, e.absoluteY);
            })
            .onUpdate((e) => {
                fingerY.value = e.absoluteY;
                translateY.value = e.absoluteY - startAbsY.value;
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
    }, [item.id, startJS, moveJS, endJS, tapJS, bindLatest, translateY, lifted, startAbsY, fingerY]);

    useEffect(() => {
        if (!dragging) return;
        onBindRebaseRef.current(rebase);
        return () => onBindRebaseRef.current(null);
    }, [dragging, rebase]);

    const liftedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        zIndex: lifted.value ? 20 : 0,
        elevation: lifted.value ? 8 : 0,
    }));

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
                            <Text style={styles.itemLabel}>{label}</Text>
                            {subtitle != null && subtitle !== '' && (
                                <Text style={styles.itemSub}>{subtitle}</Text>
                            )}
                            {snoozeLine != null && (
                                <Text style={styles.snoozedNote}>{snoozeLine}</Text>
                            )}
                        </View>
                    </GestureDetector>
                    {hasReminderSet(item) ? (
                    <TouchableOpacity style={styles.snoozeRowBtn} onPress={onSnooze}>
                        <Text style={styles.snoozeRowBtnText}>Snooze</Text>
                    </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.doneBtn, item.completed && styles.doneBtnOn]}
                        onPress={onDone}
                    >
                        <Text style={[styles.doneBtnText, item.completed && styles.doneBtnTextOn]}>
                            {item.completed ? '✓' : 'Done?'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Swipeable>
        </Animated.View>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
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
    });
