import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
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

type NagStyle = 'gentle' | 'urgent';

interface ActiveTimer {
    id: string;
    label: string;
    endsAt: number;
    style: NagStyle | null;
    loud: boolean;
    notifIds: string[];
}

const PRESETS = [
    { label: '5 min', minutes: 5 },
    { label: '10 min', minutes: 10 },
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
];

const QUICK_LABELS = ['Coffee', 'Oven', 'Water', 'Custom'];

// How insistently a finished timer nags until it's acknowledged.
// gentle: a reminder every 60s, 3 times (~3 min) — e.g. coffee.
// urgent: a reminder every 30s, 10 times (~5 min) — e.g. boiling water.
const NAG_PROFILES: Record<NagStyle, { interval: number; count: number }> = {
    gentle: { interval: 60, count: 3 },
    urgent: { interval: 30, count: 10 },
};

export default function TimerScreen() {
    const router = useRouter();
    const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
    const [selectedMinutes, setSelectedMinutes] = useState<number | null>(null);
    const [customMinutes, setCustomMinutes] = useState('');
    const [selectedLabel, setSelectedLabel] = useState('Coffee');
    const [customLabel, setCustomLabel] = useState('');
    const [now, setNow] = useState(Date.now());
    const [selectedStyle, setSelectedStyle] = useState<NagStyle | null>(null);
    const [loudEnabled, setLoudEnabled] = useState(false);

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
        Notifications.setNotificationCategoryAsync('timer', [
            { identifier: 'snooze', buttonTitle: 'Snooze 1 min' },
            { identifier: 'done', buttonTitle: 'Done' },
        ]);
    }, []);

    useEffect(() => {
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const action = response.actionIdentifier;
            const timerId = response.notification.request.content.data?.timerId as string;
            if (action === 'snooze' && timerId) {
                snoozeTimer(timerId);
            } else if ((action === 'done' || action === 'dismiss') && timerId) {
                dismissTimer(timerId);
            }
        });
        return () => subscription.remove();
    }, [activeTimers]);

    // Schedule a finished timer's full alert set and return every scheduled id
    // so they can all be cancelled together when the timer is acknowledged.
    // `startIn` = seconds from now until the main "done" alert (the timer's
    // remaining time, or 60 for a snooze). After the main alert it adds a nag
    // every `interval`s, `count` times (gentle or urgent), and — if `loud` —
    // one final louder backup alert one interval after the last nag.
    const scheduleTimerAlerts = async (
        timerId: string,
        label: string,
        startIn: number,
        style: NagStyle | null,
        loud: boolean,
    ): Promise<string[]> => {
        const ids: string[] = [];
        const profile = style ? NAG_PROFILES[style] : null;
        const interval = profile?.interval ?? 0;
        const count = profile?.count ?? 0;

        const mainId = await Notifications.scheduleNotificationAsync({
            content: {
                title: `⏱ ${label} Timer Done!`,
                body: `Your ${label} timer has finished.`,
                sound: true,
                data: { timerId },
                categoryIdentifier: 'timer',
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: startIn,
            },
        });
        ids.push(mainId);

        for (let i = 1; i <= count; i++) {
            const nagId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `⏱ ${label} — Still waiting!`,
                    body: `Your ${label} timer is done. Tap to stop the reminders.`,
                    sound: true,
                    data: { timerId },
                    categoryIdentifier: 'timer',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: startIn + i * interval,
                },
            });
            ids.push(nagId);
        }

        if (loud && profile) {
            const loudId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: `🔊 ${label} — Please respond!`,
                    body: `Your ${label} timer has been waiting. Tap to stop.`,
                    sound: true,
                    data: { timerId },
                    categoryIdentifier: 'timer',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: startIn + (count + 1) * interval,
                },
            });
            ids.push(loudId);
        }

        return ids;
    };

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

        const notifIds = await scheduleTimerAlerts(timerId, label, seconds, selectedStyle, loudEnabled);

        setActiveTimers(prev => [...prev, { id: timerId, label, endsAt, style: selectedStyle, loud: loudEnabled, notifIds }]);
        setSelectedMinutes(null);
        setCustomMinutes('');
    };

    const snoozeTimer = async (timerId: string) => {
        const timer = activeTimers.find(t => t.id === timerId);
        if (!timer) return;
        // Stop the current reminders and start a fresh set 1 minute out, keeping
        // the same gentle/urgent style and loud setting.
        for (const id of timer.notifIds) {
            await Notifications.cancelScheduledNotificationAsync(id);
        }
        const notifIds = await scheduleTimerAlerts(timer.id, timer.label, 60, timer.style, timer.loud);
        setActiveTimers(prev =>
            prev.map(t => (t.id === timer.id ? { ...t, endsAt: Date.now() + 60 * 1000, notifIds } : t))
        );
    };

    // Acknowledge a timer: cancel every alert still pending for it (main, all
    // nags, and the loud backup) and remove its card.
    const dismissTimer = async (timerId: string) => {
        // Cancel every still-pending alert tagged with this timer by asking iOS
        // directly — NOT from the screen's in-memory list, which may be empty
        // if the screen reloaded or the app restarted since the timer started.
        // (That stale-memory case is why tapping Done sometimes left the nags
        // running.)
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            if (n.content.data?.timerId === timerId) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        }
        setActiveTimers(prev => prev.filter(t => t.id !== timerId));
    };

    const cancelTimer = async (timer: ActiveTimer) => {
        Alert.alert('Cancel Timer', `Cancel the ${timer.label} timer?`, [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes', style: 'destructive', onPress: async () => {
                    for (const id of timer.notifIds) {
                        await Notifications.cancelScheduledNotificationAsync(id);
                    }
                    setActiveTimers(prev => prev.filter(t => t.id !== timer.id));
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
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Timer Alerts</Text>
                    <View style={styles.settingsBtn} />
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

                <Text style={styles.sectionLabel}>How should it remind you?</Text>
                <View style={styles.presetRow}>
                    <TouchableOpacity
                        style={[styles.styleBtn, selectedStyle === 'gentle' && styles.styleBtnActive]}
                        onPress={() => setSelectedStyle(s => (s === 'gentle' ? null : 'gentle'))}
                    >
                        <Text style={[styles.styleBtnText, selectedStyle === 'gentle' && styles.styleBtnTextActive]}>Gentle</Text>
                        <Text style={[styles.styleBtnHint, selectedStyle === 'gentle' && styles.styleBtnTextActive]}>every minute · 3 min</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.styleBtn, selectedStyle === 'urgent' && styles.styleBtnActive]}
                        onPress={() => setSelectedStyle(s => (s === 'urgent' ? null : 'urgent'))}
                    >
                        <Text style={[styles.styleBtnText, selectedStyle === 'urgent' && styles.styleBtnTextActive]}>Urgent</Text>
                        <Text style={[styles.styleBtnHint, selectedStyle === 'urgent' && styles.styleBtnTextActive]}>every 30 sec · 5 min</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.switchLabel}>Loud alert if no response</Text>
                        <Text style={styles.switchHint}>One last insistent alert after the reminders</Text>
                    </View>
                    <Switch
                        value={loudEnabled}
                        onValueChange={setLoudEnabled}
                        trackColor={{ true: Colors.primary, false: '#ccc' }}
                    />
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
                                <View style={styles.timerBtnRow}>
                                    <TouchableOpacity
                                        style={styles.doneBtn}
                                        onPress={() => dismissTimer(timer.id)}
                                    >
                                        <Text style={styles.doneBtnText}>Done</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={() => cancelTimer(timer)}
                                    >
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
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
    backBtn: { width: 70 },
    settingsBtn: { width: 70, alignItems: 'flex-end' },
    settingsBtnText: { fontSize: 22 },
    backText: { color: Colors.lightBlue, fontSize: 16 },
    title: {
        fontSize: 26,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        flex: 1,
        textAlign: 'center',
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
    styleBtn: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.primary,
        backgroundColor: Colors.white,
        alignItems: 'center',
    },
    styleBtnActive: { backgroundColor: Colors.primary },
    styleBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 16 },
    styleBtnHint: { color: Colors.primary, fontSize: 12, marginTop: 2 },
    styleBtnTextActive: { color: Colors.white },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        gap: 10,
    },
    switchLabel: { fontSize: 16, fontWeight: '600', color: Colors.primary },
    switchHint: { fontSize: 12, color: '#888', marginTop: 2 },
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
    timerBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    doneBtn: {
        backgroundColor: '#27ae60',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    doneBtnText: { color: Colors.white, fontWeight: '600' },
    cancelBtn: {
        backgroundColor: '#e74c3c',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    cancelBtnText: { color: Colors.white, fontWeight: '600' },
    headerBtn: {
        borderWidth: 1,
        borderColor: Colors.white,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
});