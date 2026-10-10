import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Theme, useTheme } from '../constants/Themes';
import { Cover } from './Cover';

export type SnoozeSelection = {
    label: string;
    stampAt: (startsAt: number) => number;
};

export default function SnoozeSelector({
    visible,
    itemLabel,
    choices,
    firstRowCount,
    onChoose,
    onCancel,
}: {
    visible: boolean;
    itemLabel: string;
    choices: SnoozeSelection[];
    firstRowCount?: number;
    onChoose: (choice: SnoozeSelection) => void;
    onCancel: () => void;
}) {
    const theme = useTheme();
    const styles = makeStyles(theme);
    const split = typeof firstRowCount === 'number'
        && firstRowCount > 0
        && firstRowCount < choices.length;

    const buttons = (these: SnoozeSelection[]) =>
        these.map((choice) => (
            <TouchableOpacity
                key={choice.label}
                style={styles.choice}
                onPress={() => onChoose(choice)}
            >
                <Text style={styles.choiceText}>{choice.label}</Text>
            </TouchableOpacity>
        ));

    return (
        <Cover visible={visible}>
            <View style={styles.modalOverlay}>
                <View style={styles.pickerModal}>
                    <Text style={styles.modalTitle}>Snooze Reminder</Text>
                    <Text style={styles.inputLabel}>
                        {itemLabel} — remind me again in:
                    </Text>

                    {split ? (
                        <View style={styles.choiceRows}>
                            <View style={styles.choiceLine}>
                                {buttons(choices.slice(0, firstRowCount))}
                            </View>
                            <View style={styles.choiceLine}>
                                {buttons(choices.slice(firstRowCount))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.choiceRow}>
                            {buttons(choices)}
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
        choiceRows: {
            gap: 8,
            marginVertical: 12,
        },
        choiceLine: {
            flexDirection: 'row',
            justifyContent: 'space-between',
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
