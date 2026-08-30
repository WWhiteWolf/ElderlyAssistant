import { useRouter, type Href } from 'expo-router';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../constants/Themes';
import type { ReminderKind } from '../modules/reminder-items';

export const WHERE_CHOICES: { kind: ReminderKind; label: string }[] = [
    { kind: 'daily', label: 'Daily' },
    { kind: 'weekly', label: 'Weekly' },
    { kind: 'monthly', label: 'Monthly' },
    { kind: 'quarterly', label: 'Quarterly' },
    { kind: 'yearly', label: 'Yearly' },
    { kind: 'oneTime', label: 'One Time' },
    { kind: 'extended', label: 'Extended' },
];

export default function AddWherePopup({
    visible,
    currentKind,
    returnTo,
    onClose,
}: {
    visible: boolean;
    currentKind: ReminderKind;
    returnTo: string;
    onClose: () => void;
}) {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const choose = (kind: ReminderKind) => {
        onClose();
        router.push({ pathname: '/item-edit', params: { kind, returnTo } } as Href);
    };

    return (
        <Modal transparent animationType="fade" visible={visible}>
            <View style={styles.modalOverlay}>
                <View style={styles.pickerModal}>
                    <Text style={styles.modalTitle}>Where does it belong?</Text>
                    {WHERE_CHOICES.map((one) => (
                        <TouchableOpacity
                            key={one.kind}
                            style={[styles.choiceBtn, one.kind === currentKind && styles.choiceBtnOn]}
                            onPress={() => choose(one.kind)}
                        >
                            <Text style={[styles.choiceBtnText, one.kind === currentKind && styles.choiceBtnTextOn]}>
                                {one.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
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
            backgroundColor: t.chip,
            borderWidth: 1,
            borderColor: t.cardBorder,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 8,
        },
        choiceBtnOn: { backgroundColor: t.buttonPrimary, borderColor: t.buttonPrimary },
        choiceBtnText: { color: t.cardTitle, fontWeight: '600', fontSize: 16 },
        choiceBtnTextOn: { color: t.buttonPrimaryText },
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
