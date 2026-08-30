import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';

const CASES: { id: string; icon: string; name: string; body: string }[] = [
    {
        id: 'holidays',
        icon: '🎉',
        name: 'Holidays',
        body: 'Move a reminder to the day before or after a holiday. The engine already knows this calendar thinking; this page is where that case lives.',
    },
    {
        id: 'timezone',
        icon: '🌐',
        name: 'Time zone',
        body: 'A named zone for when the reminder should fire, rather than only the phone’s current zone.',
    },
    {
        id: 'float',
        icon: '🔘',
        name: 'The float button',
        body: 'A control on the item for floating the day around a holiday or a missing date, instead of typing a new date.',
    },
    {
        id: 'skip',
        icon: '⏭',
        name: 'Skip',
        body: 'Skip of a cycle is a different thing from a missing day. This is skipping one occurrence, not a date that does not exist.',
    },
    {
        id: 'shifted',
        icon: '👆',
        name: 'An extra tap on a shifted day',
        body: 'When a day does not exist in that month, the last day that exists is used. An extra tap then chooses that day or the next day, not skip.',
    },
    {
        id: 'shading',
        icon: '📅',
        name: 'Calendar shading',
        body: 'Shade the calendar so a shifted or holiday-moved day is visible on the page.',
    },
    {
        id: 'notes',
        icon: '📝',
        name: 'A notes row',
        body: 'A notes line on the item, for the odd cases that need a word or two besides the name and the day.',
    },
    {
        id: 'secondThursday',
        icon: '📆',
        name: 'A second Thursday',
        body: 'Every nth weekday in a period — for example the second Thursday of the month.',
    },
    {
        id: 'wednesdayAfter',
        icon: '📅',
        name: 'A Wednesday after the 6th',
        body: 'A weekday after a numbered day in the period — for example Wednesday after the 6th.',
    },
];

export default function OptionsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [openId, setOpenId] = useState<string | null>(null);
    const openCase = CASES.find((one) => one.id === openId) ?? null;

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    {openCase ? (
                        <TouchableOpacity onPress={() => setOpenId(null)} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                router.dismissAll();
                                router.replace('/home');
                            }}
                            style={styles.headerBtn}
                        >
                            <Text style={styles.headerBtnText}>Home</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.title}>{openCase ? openCase.name : 'Options'}</Text>
                    <View style={styles.headerBtn} />
                </View>
            </SafeAreaView>
            <Bridge />
            {openCase ? (
                <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
                    <View style={styles.settingCard}>
                        <View style={styles.caseBody}>
                            <Text style={styles.caseBodyText}>{openCase.body}</Text>
                        </View>
                    </View>
                </ScrollView>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.settingCard}>
                        {CASES.map((one, i) => (
                            <TouchableOpacity
                                key={one.id}
                                style={[styles.settingRow, i > 0 && styles.settingRowBorder]}
                                onPress={() => setOpenId(one.id)}
                            >
                                <View style={styles.iconCircle}>
                                    <Text style={styles.tileIcon}>{one.icon}</Text>
                                </View>
                                <Text style={styles.settingLabel}>{one.name}</Text>
                                <Text style={styles.settingArrow}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
        </View>
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
        settingCard: {
            backgroundColor: t.card,
            borderRadius: 12,
            marginHorizontal: 12,
            marginTop: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 12,
        },
        settingRowBorder: {
            borderTopWidth: 0.5,
            borderTopColor: t.cardBorder,
        },
        iconCircle: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: t.tileCircle,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
        },
        tileIcon: { fontSize: 16 },
        settingLabel: { flex: 1, fontSize: 16, color: t.cardTitle, fontWeight: '500' },
        settingArrow: { fontSize: 22, color: t.settingArrow },
        caseBody: { padding: 16 },
        caseBodyText: { fontSize: 16, color: t.bodyText, lineHeight: 22 },
    });
