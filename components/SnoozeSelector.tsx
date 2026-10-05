import { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Theme, useTheme } from '../constants/Themes';
import {
    DAILY_SNOOZE_MINUTE_DEFAULT,
    DAILY_SNOOZE_MINUTE_MAX,
    DAILY_SNOOZE_MINUTE_MIN,
    dailySnoozeLabel,
    dailySnoozeMinuteFromOffset,
    dailySnoozeOffsetForMinute,
    dailySnoozeStamp,
    stepDailySnoozeMinute,
} from '../modules/daily-snooze';
import { Cover } from './Cover';

export type SnoozeSelection = {
    label: string;
    stampAt: (now: number) => number;
};

const WHEEL_ROW_HEIGHT = 44;
const WHEEL_MINUTES = Array.from(
    { length: DAILY_SNOOZE_MINUTE_MAX - DAILY_SNOOZE_MINUTE_MIN + 1 },
    (_, index) => DAILY_SNOOZE_MINUTE_MIN + index,
);

export default function SnoozeSelector({
    visible,
    itemLabel,
    choices,
    withDailyMinuteWheel,
    onChoose,
    onCancel,
}: {
    visible: boolean;
    itemLabel: string;
    choices: SnoozeSelection[];
    withDailyMinuteWheel: boolean;
    onChoose: (choice: SnoozeSelection) => void;
    onCancel: () => void;
}) {
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [minutes, setMinutes] = useState(DAILY_SNOOZE_MINUTE_DEFAULT);
    const wheelRef = useRef<ScrollView | null>(null);

    useEffect(() => {
        if (visible) setMinutes(DAILY_SNOOZE_MINUTE_DEFAULT);
    }, [visible]);

    const stepMinute = (delta: -1 | 1) => {
        const next = stepDailySnoozeMinute(minutes, delta);
        setMinutes(next);
        wheelRef.current?.scrollTo({
            y: dailySnoozeOffsetForMinute(next, WHEEL_ROW_HEIGHT),
            animated: true,
        });
    };

    const chooseMinute = () => {
        const chosenMinutes = minutes;
        onChoose({
            label: dailySnoozeLabel(chosenMinutes),
            stampAt: (now) => dailySnoozeStamp(now, chosenMinutes),
        });
    };

    return (
        <Cover visible={visible}>
            <View style={styles.modalOverlay}>
                <View style={styles.pickerModal}>
                    <Text style={styles.modalTitle}>Snooze Reminder</Text>
                    <Text style={styles.inputLabel}>
                        {itemLabel} — remind me again in:
                    </Text>

                    {withDailyMinuteWheel ? (
                        <View style={styles.dailyRow}>
                            <View style={styles.choiceColumn}>
                                {choices.map((choice) => (
                                    <TouchableOpacity
                                        key={choice.label}
                                        style={styles.stackedChoice}
                                        onPress={() => onChoose(choice)}
                                    >
                                        <Text style={styles.stackedChoiceText}>{choice.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.wheelFrame}>
                                <ScrollView
                                    ref={wheelRef}
                                    style={styles.wheel}
                                    contentContainerStyle={styles.wheelContent}
                                    contentOffset={{
                                        x: 0,
                                        y: dailySnoozeOffsetForMinute(
                                            DAILY_SNOOZE_MINUTE_DEFAULT,
                                            WHEEL_ROW_HEIGHT,
                                        ),
                                    }}
                                    snapToInterval={WHEEL_ROW_HEIGHT}
                                    snapToAlignment="start"
                                    decelerationRate="fast"
                                    bounces={false}
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={false}
                                    scrollEventThrottle={16}
                                    onScroll={(event) => {
                                        const next = dailySnoozeMinuteFromOffset(
                                            event.nativeEvent.contentOffset.y,
                                            WHEEL_ROW_HEIGHT,
                                        );
                                        setMinutes((current) => current === next ? current : next);
                                    }}
                                >
                                    {WHEEL_MINUTES.map((minute) => (
                                        <View
                                            key={minute}
                                            style={[
                                                styles.wheelRow,
                                                minute === minutes && styles.wheelRowSelected,
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.wheelText,
                                                    minute === minutes && styles.wheelTextSelected,
                                                ]}
                                            >
                                                {minute}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.controls}>
                                <TouchableOpacity
                                    style={[
                                        styles.stepButton,
                                        minutes >= DAILY_SNOOZE_MINUTE_MAX && styles.stepButtonDisabled,
                                    ]}
                                    disabled={minutes >= DAILY_SNOOZE_MINUTE_MAX}
                                    onPress={() => stepMinute(1)}
                                >
                                    <Text style={styles.stepButtonText}>Up</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.snoozeButton} onPress={chooseMinute}>
                                    <Text style={styles.snoozeButtonText}>Snooze</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.stepButton,
                                        minutes <= DAILY_SNOOZE_MINUTE_MIN && styles.stepButtonDisabled,
                                    ]}
                                    disabled={minutes <= DAILY_SNOOZE_MINUTE_MIN}
                                    onPress={() => stepMinute(-1)}
                                >
                                    <Text style={styles.stepButtonText}>Down</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.choiceRow}>
                            {choices.map((choice) => (
                                <TouchableOpacity
                                    key={choice.label}
                                    style={styles.choice}
                                    onPress={() => onChoose(choice)}
                                >
                                    <Text style={styles.choiceText}>{choice.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Cover>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        modalOverlay: {
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.4)',
            flex: 1,
            justifyContent: 'center',
            padding: 20,
        },
        pickerModal: {
            backgroundColor: t.card,
            borderColor: t.cardBorder,
            borderRadius: 12,
            borderWidth: 0.5,
            padding: 16,
            width: '100%',
        },
        modalTitle: {
            color: t.cardTitle,
            fontSize: 18,
            fontWeight: '600',
            marginBottom: 10,
        },
        inputLabel: {
            color: t.mutedText,
            fontSize: 14,
            marginBottom: 4,
        },
        choiceRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: 12,
        },
        choice: {
            alignItems: 'center',
            backgroundColor: t.delay,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 4,
            paddingVertical: 14,
        },
        choiceText: {
            color: t.delayText,
            fontSize: 16,
            fontWeight: '600',
        },
        dailyRow: {
            alignItems: 'center',
            flexDirection: 'row',
            gap: 8,
            justifyContent: 'space-between',
            marginVertical: 12,
        },
        choiceColumn: {
            flex: 1,
            gap: 6,
        },
        stackedChoice: {
            alignItems: 'center',
            backgroundColor: t.delay,
            borderRadius: 8,
            height: 40,
            justifyContent: 'center',
            paddingHorizontal: 4,
        },
        stackedChoiceText: {
            color: t.delayText,
            fontSize: 14,
            fontWeight: '600',
            textAlign: 'center',
        },
        wheelFrame: {
            borderColor: t.cardBorder,
            borderRadius: 8,
            borderWidth: 1,
            height: WHEEL_ROW_HEIGHT * 3,
            overflow: 'hidden',
            width: 64,
        },
        wheel: {
            height: WHEEL_ROW_HEIGHT * 3,
        },
        wheelContent: {
            paddingVertical: WHEEL_ROW_HEIGHT,
        },
        wheelRow: {
            alignItems: 'center',
            height: WHEEL_ROW_HEIGHT,
            justifyContent: 'center',
        },
        wheelRowSelected: {
            backgroundColor: t.chip,
            borderBottomColor: t.cardBorder,
            borderBottomWidth: 0.5,
            borderTopColor: t.cardBorder,
            borderTopWidth: 0.5,
        },
        wheelText: {
            color: t.mutedText,
            fontSize: 18,
        },
        wheelTextSelected: {
            color: t.cardTitle,
            fontSize: 24,
            fontWeight: '700',
        },
        controls: {
            gap: 6,
            width: 78,
        },
        stepButton: {
            alignItems: 'center',
            backgroundColor: t.buttonNeutral,
            borderColor: t.buttonNeutralBorder,
            borderRadius: 8,
            borderWidth: 1,
            height: 40,
            justifyContent: 'center',
        },
        stepButtonDisabled: {
            opacity: 0.35,
        },
        stepButtonText: {
            color: t.buttonNeutralText,
            fontSize: 14,
            fontWeight: '600',
        },
        snoozeButton: {
            alignItems: 'center',
            backgroundColor: t.delay,
            borderRadius: 8,
            height: 40,
            justifyContent: 'center',
        },
        snoozeButtonText: {
            color: t.delayText,
            fontSize: 14,
            fontWeight: '600',
        },
        cancelButton: {
            alignItems: 'center',
            backgroundColor: t.buttonNeutral,
            borderColor: t.buttonNeutralBorder,
            borderRadius: 8,
            borderWidth: 1,
            padding: 12,
        },
        cancelButtonText: {
            color: t.buttonNeutralText,
            fontWeight: '600',
        },
    });
