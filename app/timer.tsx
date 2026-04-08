import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

interface ActiveTimer {
    id: string;
    label: string;
    endsAt: number;
    followUpId?: string;
}

const PRESETS = [
    { label: '5 min', minutes: 5 },
    { label: '10 min', minutes: 10 },
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
];

const QUICK_LABELS = ['Coffee', 'Oven', 'Water', 'Custom'];

export default function TimerScreen() {
    const router = useRouter();
    const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
    const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
    const [customMinutes, setCustomMinutes] = useState('');
    const [selectedLabel, setSelectedLabel] = useState('Coffee');
    const [customLabel, setCustomLabel] = useState('');
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please enable notifications in settings.');
            }
        };
        requestPermissions();
    }, []);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const action = response.actionIdentifier;
            const timerId = response.notification.request.content.data?.timerId as string;
            if (action === 'snooze' && timerId) {
                snoozeTimer(timerId);
            } else if (action === Notifications.DEFAULT_ACTION_IDENTIFIER && timerId) {
                dismissTimer(timerId);
            }
        });
        return () => subscription.remove();
    }, [activeTimers]);

    const startTimer = async () => {
        const minutes = selectedMinutes ?? parseInt(customMinutes);
        if (!minutes || isNaN(minutes) || minutes <= 0) {
            Alert.alert('Invalid Time', 'Please select or enter a valid number of minutes.');
            return;
        }
        const label = selectedLabel === 'Custom' ? customLabel || 'Timer' : selectedLabel;
        const seconds = minutes * 60;
        const endsAt = Date.now() + seconds * 1000;
        const timerId = Date.now().toString();

        const notifId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏱ ${label} Timer Done!`,
                body: `Your ${label} timer has finished.`,
                sound: true,
                data: { timerId },
                categoryIdentifier: 'timer',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds,
            },
        });

        const followUpId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏱ ${label} — Still waiting!`,
                body: `Your ${label} timer finished 1 minute ago.`,
                sound: true,
                data: { timerId },
                categoryIdentifier: 'timer',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: seconds + 60,
            },
        });

        await Notifications.setNotificationCategoryAsync('timer', [
            { identifier: 'snooze', buttonTitle: 'Snooze 1 min' },
            { identifier: 'dismiss', buttonTitle: 'Dismiss' },
        ]);

        setActiveTimers(prev => [...prev, { id: timerId, label, endsAt, followUpId }]);
        setSelectedMinutes(null);
        setCustomMinutes('');
    };

    const snoozeTimer = async (timerId: string) => {
        const timer = activeTimers.find(t => t.id === timerId);
        if (!timer) return;
        await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏱ ${timer.label} — Snoozed!`,
                body: `Your ${timer.label} snooze is up.`,
                sound: true,
                data: { timerId },
                categoryIdentifier: 'timer',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 60,
            },
        });
    };

    const dismissTimer = (timerId: string) => {
        setActiveTimers(prev => prev.filter(t => t.id !== timerId));
    };

    const cancelTimer = async (timer: ActiveTimer) => {
        Alert.alert('Cancel Timer', `Cancel the ${timer.label} timer?`, [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes', style: 'destructive', onPress: async () => {
                    await Notifications.cancelScheduledNotificationAsync(timer.id);
                    if (timer.followUpId) {
                        await Notifications.cancelScheduledNotificationAsync(timer.followUpId);
                    }
                    dismissTimer(timer.id);
                },
            },
        ]);
    };

    const formatTimeLeft = (endsAt: number) => {
        const diff = Math.max(0, endsAt - now);
        const totalSeconds = Math.floor(diff / 1000);
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        if (diff === 0) return 'Done';
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.backBtn}>
                        <Text style={styles.backText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Shopping List</Text>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={styles.sectionLabel}>What are you timing?</Text>
                <View style={styles.labelRow}>
                    {QUICK_LABELS.map(l => (
                        <TouchableOpacity
                            key={l}
                            style={[styles.labelBtn, selectedLabel === l && styles.labelBtnActive]}
                            onPress={() => setSelectedLabel(l)}
                        >
                            <Text style={[styles.labelBtnText, selectedLabel === l && styles.labelBtnTextActive]}>
                                {l}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {selectedLabel === 'Custom' && (
                    <TextInput
                        style={styles.input}
                        value={customLabel}
                        onChangeText={setCustomLabel}
                        placeholder="Enter label..."
                        placeholderTextColor="#aaa"
                    />
                )}

                <Text style={styles.sectionLabel}>How long?</Text>
                <View style={styles.presetRow}>
                    {PRESETS.map(p => (
                        <TouchableOpacity
                            key={p.minutes}
                            style={[styles.presetBtn, selectedMinutes === p.minutes && styles.presetBtnActive]}
                            onPress={() => { setSelectedMinutes(p.minutes); setCustomMinutes(''); }}
                        >
                            <Text style={[styles.presetText, selectedMinutes === p.minutes && styles.presetTextActive]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.customRow}>
                    <TextInput
                        style={styles.customInput}
                        value={customMinutes}
                        onChangeText={t => { setCustomMinutes(t); setSelectedMinutes(null); }}
                        placeholder="Custom minutes..."
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                    />
                    <Text style={styles.minLabel}>min</Text>
                </View>

                <TouchableOpacity style={styles.startBtn} onPress={startTimer}>
                    <Text style={styles.startBtnText}>Start Timer</Text>
                </TouchableOpacity>

                {activeTimers.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Active Timers</Text>
                        {activeTimers.map(timer => (
                            <View key={timer.id} style={styles.timerCard}>
                                <View style={styles.timerInfo}>
                                    <Text style={styles.timerLabel}>{timer.label}</Text>
                                    <Text style={styles.timerCountdown}>{formatTimeLeft(timer.endsAt)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.cancelBtn}
                                    onPress={() => cancelTimer(timer)}
                                >
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
        paddingTop: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: { marginRight: 16 },
    backText: { color: Colors.lightBlue, fontSize: 16 },
    title: {
        fontSize: 26,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
    },
    bridge: { height: 8, backgroundColor: Colors.bridge },
    content: { padding: 16, gap: 12 },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.primary,
        marginTop: 8,
    },
    labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    labelBtn: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
    },
    labelBtnActive: { backgroundColor: Colors.primary },
    labelBtnText: { color: Colors.primary, fontWeight: '500', fontSize: 15 },
    labelBtnTextActive: { color: Colors.white },
    presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    presetBtn: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: Colors.bridge,
        backgroundColor: Colors.white,
    },
    presetBtnActive: { backgroundColor: Colors.bridge },
    presetText: { color: Colors.bridge, fontWeight: '500', fontSize: 15 },
    presetTextActive: { color: Colors.white },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customInput: {
        flex: 1,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.white,
    },
    minLabel: { fontSize: 16, color: Colors.primary, fontWeight: '500' },
    input: {
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: Colors.text,
        backgroundColor: Colors.white,
    },
    startBtn: {
        backgroundColor: Colors.primary,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    startBtnText: { color: Colors.white, fontSize: 18, fontWeight: '600' },
    timerCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    timerInfo: { gap: 4 },
    timerLabel: { fontSize: 18, fontWeight: '600', color: Colors.primary },
    timerCountdown: { fontSize: 28, fontWeight: '700', color: Colors.bridge },
    cancelBtn: {
        backgroundColor: '#e74c3c',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    cancelBtnText: { color: Colors.white, fontWeight: '600' },
});