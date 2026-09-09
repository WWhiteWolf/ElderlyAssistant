import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Cover } from './Cover';
import { HeaderButton, PageFrame } from './PageFrame';
import { PAGE_LABELS } from '../constants/page-names';
import { Theme, useTheme } from '../constants/Themes';
import { historyKeyFor, type ReminderKind } from '../modules/reminder-items';

interface HistoryEntry {
    id: string;
    date: string;
    sched: string;
    actual: string;
    what?: string;
    note?: string;
}

export default function ReminderLogPage({
    kind,
    returnTo,
}: {
    kind: ReminderKind;
    returnTo: string;
}) {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');
    const historyKey = historyKeyFor(kind);

    const refresh = useCallback(async () => {
        if (!historyKey) {
            setHistory([]);
            return;
        }
        const saved = await AsyncStorage.getItem(historyKey);
        setHistory(saved ? JSON.parse(saved) : []);
    }, [historyKey]);

    useFocusEffect(
        useCallback(() => {
            void refresh();
        }, [refresh]),
    );

    const writeHistory = (updated: HistoryEntry[]) => {
        setHistory(updated);
        if (historyKey) void AsyncStorage.setItem(historyKey, JSON.stringify(updated));
    };

    const goBack = () => {
        if (router.canGoBack()) {
            router.back();
            return;
        }
        router.replace(`/${returnTo}` as Href);
    };

    const clearAllHistory = () => {
        Alert.alert(
            'Clear All',
            'Delete all log entries? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: () => writeHistory([]),
                },
            ],
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        <HeaderButton onPress={goBack}>
                            <Text style={styles.headerBtnText}>Back</Text>
                        </HeaderButton>
                        <Text style={styles.title}>{PAGE_LABELS.log}</Text>
                        {history.length > 0 ? (
                            <HeaderButton onPress={clearAllHistory}>
                                <Text style={styles.headerBtnText} numberOfLines={1} adjustsFontSizeToFit>Clear All</Text>
                            </HeaderButton>
                        ) : (
                            <HeaderButton />
                        )}
                    </View>
                }
            >
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    {history.length === 0 ? (
                        <Text style={styles.empty}>No log entries yet.</Text>
                    ) : (
                        <View style={styles.card}>
                            {history.map((l) => (
                                <Swipeable
                                    key={l.id}
                                    renderRightActions={() => (
                                        <TouchableOpacity
                                            style={styles.swipeDelete}
                                            onPress={() => writeHistory(history.filter((one) => one.id !== l.id))}
                                        >
                                            <Text style={styles.swipeDeleteText}>Delete</Text>
                                        </TouchableOpacity>
                                    )}
                                >
                                    <TouchableOpacity
                                        style={styles.historyItem}
                                        onPress={() => {
                                            setEditEntry(l);
                                            setEditWhat(l.what || '');
                                        }}
                                    >
                                        <Text style={styles.historyText}>
                                            {l.date} | {l.actual} | {l.sched}{l.what ? ` | ${l.what}` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                </Swipeable>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </PageFrame>
            <Cover visible={editEntry != null}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.modalTitle}>Edit Log Entry</Text>
                        <Text style={styles.inputLabel}>Notes (optional)</Text>
                        <TextInput
                            style={styles.input}
                            value={editWhat}
                            onChangeText={setEditWhat}
                            placeholder="Add a note about this entry..."
                            placeholderTextColor={theme.mutedText}
                        />
                        <View style={styles.modalBtns}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.confirmBtn}
                                onPress={() => {
                                    if (!editEntry) return;
                                    writeHistory(history.map((one) =>
                                        one.id === editEntry.id ? { ...one, what: editWhat } : one
                                    ));
                                    setEditEntry(null);
                                }}
                            >
                                <Text style={styles.confirmBtnText}>Save</Text>
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
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        scroll: { flex: 1 },
        empty: {
            fontSize: 16,
            color: t.mutedText,
            textAlign: 'center',
            paddingHorizontal: 24,
            paddingTop: 28,
            lineHeight: 22,
        },
        card: {
            backgroundColor: t.card,
            borderRadius: 12,
            marginHorizontal: 12,
            marginTop: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            overflow: 'hidden',
        },
        historyItem: {
            borderBottomWidth: 0.5,
            borderBottomColor: t.progressTrack,
            paddingVertical: 12,
            paddingHorizontal: 12,
            backgroundColor: t.card,
        },
        historyText: { fontSize: 15, color: t.bodyText, lineHeight: 20 },
        swipeDelete: {
            backgroundColor: t.buttonDelete,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
        },
        swipeDeleteText: {
            color: t.buttonDeleteText,
            fontWeight: '600',
            fontSize: 15,
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
        inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4 },
        input: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            backgroundColor: t.pageBackground,
            marginBottom: 10,
            color: t.bodyText,
        },
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
        cancelBtn: {
            backgroundColor: t.buttonNeutral,
            borderWidth: 1,
            borderColor: t.buttonNeutralBorder,
            padding: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
            marginRight: 8,
        },
        cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
        confirmBtn: {
            backgroundColor: t.buttonPrimary,
            padding: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    });
