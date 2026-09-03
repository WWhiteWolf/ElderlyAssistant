import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Theme, useTheme } from '../constants/Themes';

type Stage = 'repeat' | 'every' | 'today' | 'kind';

/** The Where? helper — a transparent route so New can sit above it on the stack. */
export default function WhereScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [stage, setStage] = useState<Stage>('repeat');

    const close = () => router.back();

    const openForm = (kind: string, formContext?: string) => {
        const routeParams: Record<string, string> = {
            kind,
            viaHelper: '1',
        };
        if (formContext) routeParams.formContext = formContext;
        router.push({ pathname: '/item-edit', params: routeParams } as Href);
    };

    let title = '';
    let choices: { label: string; onPress: () => void }[] = [];

    if (stage === 'repeat') {
        title = 'Does this item repeat?';
        choices = [
            { label: 'Repeats', onPress: () => setStage('every') },
            { label: 'Does not repeat', onPress: () => setStage('today') },
        ];
    } else if (stage === 'every') {
        title = 'Does this item occur every:';
        choices = [
            { label: 'Every day', onPress: () => openForm('daily') },
            { label: 'Week', onPress: () => openForm('weekly') },
            { label: 'Month', onPress: () => openForm('monthly') },
            { label: 'Quarter', onPress: () => openForm('quarterly') },
            { label: 'Year', onPress: () => openForm('yearly') },
        ];
    } else if (stage === 'today') {
        title = 'Is that for today?';
        choices = [
            { label: 'Yes', onPress: () => openForm('oneTime', 'oneTimeForToday') },
            { label: 'No', onPress: () => setStage('kind') },
        ];
    } else {
        title =
            'Is this an occurrence that has a specific time and date, like an appointment? Or is it the rare item with no deadline or due date, like a Bucket List desire?';
        choices = [
            { label: 'Appointment', onPress: () => openForm('oneTime') },
            { label: 'Bucket List', onPress: () => openForm('extended') },
        ];
    }

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <ScrollView
                    style={stage === 'kind' ? styles.scroll : undefined}
                    contentContainerStyle={styles.scrollBody}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.title}>{title}</Text>
                    {choices.map((choice) => (
                        <TouchableOpacity
                            key={choice.label}
                            style={styles.choiceBtn}
                            onPress={choice.onPress}
                        >
                            <Text style={styles.choiceBtnText}>{choice.label}</Text>
                        </TouchableOpacity>
                    ))}
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={close}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        </View>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        card: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            width: '100%',
            maxHeight: '90%',
        },
        scroll: {
            flexGrow: 0,
        },
        scrollBody: {
            flexGrow: 1,
        },
        title: {
            fontSize: 18,
            fontWeight: '600',
            color: t.cardTitle,
            marginBottom: 10,
        },
        choiceBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 8,
        },
        choiceBtnText: {
            color: t.buttonPrimaryText,
            fontWeight: '600',
            fontSize: 16,
        },
        modalBtns: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 6,
        },
        cancelBtn: {
            backgroundColor: t.buttonNeutral,
            borderWidth: 1,
            borderColor: t.buttonNeutralBorder,
            padding: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        cancelBtnText: {
            color: t.buttonNeutralText,
            fontWeight: '600',
        },
    });
