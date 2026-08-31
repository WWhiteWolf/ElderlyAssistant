// Temporary sitting screen for the automated reminder test load.
// It comes out with the four testload files after the phone run.

import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';
import { countLine, runCeilingCheck, runFeatureCheck, type ReportRow } from '../scheduler/testload/checker';
import { cleanupTestLoad } from '../scheduler/testload/cleanup';
import { loadCeilingCases, loadFeatureCases, readLoadedAt } from '../scheduler/testload/loader';
import { buildFeatureScenario, type LiveCase } from '../scheduler/testload/scenario';

function clockLabel(ms: number): string {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
}

export default function TestLoadScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [busy, setBusy] = useState(false);
    const [loadAt, setLoadAt] = useState<number | null>(null);
    const [live, setLive] = useState<LiveCase[]>([]);
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [count, setCount] = useState('');

    const refreshMeta = useCallback(async () => {
        const at = await readLoadedAt();
        setLoadAt(at);
        if (at != null) {
            setLive(buildFeatureScenario(new Date(at), at).live);
        } else {
            setLive([]);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void refreshMeta();
        }, [refreshMeta]),
    );

    const onLoad = () => {
        Alert.alert(
            'Load the cases',
            'This replaces your live reminder list with the test items for the sitting, after saving a copy of your real list.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Load',
                    onPress: () => {
                        void (async () => {
                            setBusy(true);
                            try {
                                const at = await loadFeatureCases();
                                setLoadAt(at);
                                setLive(buildFeatureScenario(new Date(at), at).live);
                                setRows([]);
                                setCount('');
                            } finally {
                                setBusy(false);
                            }
                        })();
                    },
                },
            ],
        );
    };

    const onCheck = () => {
        void (async () => {
            setBusy(true);
            try {
                const next = await runFeatureCheck();
                setRows(next);
                setCount(countLine(next));
            } finally {
                setBusy(false);
            }
        })();
    };

    const onCleanup = () => {
        Alert.alert(
            'Clean up',
            'This restores your own reminders and settings, and takes the test names off the phone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clean up',
                    onPress: () => {
                        void (async () => {
                            setBusy(true);
                            try {
                                await cleanupTestLoad();
                                setLoadAt(null);
                                setLive([]);
                                setRows([]);
                                setCount('');
                            } finally {
                                setBusy(false);
                            }
                        })();
                    },
                },
            ],
        );
    };

    const onCeiling = () => {
        Alert.alert(
            'Ceiling test',
            'Run this only after cleanup of the feature load, or instead of that load, never at the same time. It loads fifty-six notices.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Ceiling test',
                    onPress: () => {
                        void (async () => {
                            setBusy(true);
                            try {
                                await loadCeilingCases();
                                const next = await runCeilingCheck();
                                setLoadAt(null);
                                setLive([]);
                                setRows(next);
                                setCount(countLine(next));
                            } finally {
                                setBusy(false);
                            }
                        })();
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Test load</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <Bridge />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>
                {count !== '' && (
                    <View style={styles.countBand}>
                        <Text style={styles.countBig}>{count}</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.action} onPress={onLoad} disabled={busy}>
                    <Text style={styles.actionText}>Load the cases</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={onCheck} disabled={busy}>
                    <Text style={styles.actionText}>Check the queue</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={onCleanup} disabled={busy}>
                    <Text style={styles.actionText}>Clean up</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.action} onPress={onCeiling} disabled={busy}>
                    <Text style={styles.actionText}>Ceiling test</Text>
                </TouchableOpacity>

                {loadAt != null && live.length > 0 && (
                    <View>
                        <Text style={styles.sectionHeader}>The live banners</Text>
                        <Text style={styles.intro}>
                            Two minutes apart, counted from when Load finished. Skip and OK do not bring the app forward.
                        </Text>
                        {live.map((one) => (
                            <View key={one.id} style={styles.liveRow}>
                                <Text style={styles.liveTitle}>{one.id} · {clockLabel(one.fireAt)} · {one.name}</Text>
                                <Text style={styles.liveSub}>Tap {one.tap}. {one.after}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {rows.length > 0 && (
                    <View>
                        <Text style={styles.sectionHeader}>Report</Text>
                        {rows.map((row) => (
                            <View key={row.id} style={styles.reportRow}>
                                <Text style={styles.rowId}>{row.id} · {row.name}</Text>
                                <Text style={[
                                    styles.verdict,
                                    row.verdict === 'Pass' && styles.verdictPass,
                                    row.verdict === 'Fail' && styles.verdictFail,
                                ]}>
                                    {row.verdict}
                                </Text>
                                {row.detail ? <Text style={styles.detail}>{row.detail}</Text> : null}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            paddingTop: 20,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        headerSpacer: { width: 54 },
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
        countBand: {
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 2,
        },
        countBig: {
            fontSize: 22,
            fontWeight: '700',
            color: t.cardTitle,
        },
        action: {
            backgroundColor: t.buttonPrimary,
            marginHorizontal: 16,
            marginTop: 12,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
        },
        actionText: {
            color: t.buttonPrimaryText,
            fontWeight: '600',
            fontSize: 16,
        },
        sectionHeader: {
            fontSize: 13,
            fontWeight: '600',
            color: t.pill,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        intro: {
            fontSize: 15,
            color: t.bodyText,
            paddingHorizontal: 16,
            paddingTop: 8,
            lineHeight: 21,
        },
        liveRow: {
            backgroundColor: t.card,
            marginHorizontal: 12,
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        liveTitle: { fontSize: 16, color: t.cardTitle, fontWeight: '500' },
        liveSub: { fontSize: 14, color: t.mutedText, marginTop: 4, lineHeight: 20 },
        reportRow: {
            backgroundColor: t.card,
            marginHorizontal: 12,
            marginTop: 8,
            padding: 12,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        rowId: { fontSize: 16, color: t.cardTitle, fontWeight: '500' },
        verdict: { fontSize: 15, color: t.bodyText, marginTop: 4, fontWeight: '700' },
        verdictPass: { color: t.buttonDone },
        verdictFail: { color: t.buttonDelete },
        detail: { fontSize: 14, color: t.mutedText, marginTop: 4, lineHeight: 20 },
    });
