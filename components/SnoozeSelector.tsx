import { useEffect, useState } from 'react';
import {
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
    dailySnoozeStamp,
    stepDailySnoozeMinute,
} from '../modules/daily-snooze';
import { Cover } from './Cover';

export type SnoozeSelection = {
    label: string;
    stampAt: (startsAt: number) => number;
};

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

    useEffect(() => {
        if (visible) setMinutes(DAILY_SNOOZE_MINUTE_DEFAULT);
    }, [visible]);

    const chooseMinute = () => {
        const chosenMinutes = minutes;
        onChoose({
            label: dailySnoozeLabel(chosenMinutes),
            stampAt: (startsAt) => dailySnoozeStamp(startsAt, chosenMinutes),
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
                            <View style={styles.choiceSlot}>
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
                            </View>

                            <View style={styles.stepper}>
                                <TouchableOpacity
                                    style={[
                                        styles.adjBtn,
                                        minutes >= DAILY_SNOOZE_MINUTE_MAX && styles.adjBtnDisabled,
                                    ]}
                                    disabled={minutes >= DAILY_SNOOZE_MINUTE_MAX}
                                    onPress={() => setMinutes(stepDailySnoozeMinute(minutes, 1))}
                                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                >
                                    <Text style={styles.adjText}>▲</Text>
                                </TouchableOpacity>
                                <Text style={styles.minuteDisplay}>{minutes}</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.adjBtn,
                                        minutes <= DAILY_SNOOZE_MINUTE_MIN && styles.adjBtnDisabled,
                                    ]}
                                    disabled={minutes <= DAILY_SNOOZE_MINUTE_MIN}
                                    onPress={() => setMinutes(stepDailySnoozeMinute(minutes, -1))}
                                    hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                                >
                                    <Text style={styles.adjText}>▼</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.snoozeButton} onPress={chooseMinute}>
                                <Text style={styles.snoozeButtonText}>Snooze</Text>
                            </TouchableOpacity>
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
        choiceSlot: {
            flex: 1,
        },
        choiceColumn: {
            gap: 6,
            width: '50%',
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
        stepper: {
            alignItems: 'center',
        },
        adjBtn: {
            alignItems: 'center',
            backgroundColor: t.buttonPrimary,
            borderRadius: 20,
            height: 40,
            justifyContent: 'center',
            marginVertical: 4,
            width: 40,
        },
        adjBtnDisabled: {
            opacity: 0.35,
        },
        adjText: {
            color: t.buttonPrimaryText,
            fontSize: 18,
            fontWeight: '600',
        },
        minuteDisplay: {
            color: t.bodyText,
            fontSize: 24,
            fontWeight: '600',
            marginVertical: 2,
        },
        snoozeButton: {
            alignItems: 'center',
            backgroundColor: t.delay,
            borderRadius: 8,
            height: 40,
            justifyContent: 'center',
            width: 78,
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
