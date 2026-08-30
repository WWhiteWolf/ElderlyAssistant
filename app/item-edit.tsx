import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeControl from '../components/DateTimeControl';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';
import * as AppGroup from '../modules/app-group';
import { runScheduler } from '../scheduler/scheduler';
import { warnIfFull } from '../scheduler/warn';

// One lead time on a One Time item, copied from To-Do's Reminder shape so
// dual-write can put it back on todo_tasks without translating.
export interface LeadReminder {
    id: string;
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
    kind?: 'offset' | 'clock';
    daysBefore?: number;
    timeOfDay?: 'morning' | 'midday' | 'evening';
}

// One row on the saved list `reminder_items`. This job only writes daily
// and oneTime; later pages add other kinds to the same list.
export interface ReminderItem {
    id: string;
    kind: 'daily' | 'oneTime';
    label: string;
    hour?: number;
    minute?: number;
    year?: number;
    month?: number;
    day?: number;
    reminders?: LeadReminder[];
    completed?: boolean;
    snoozedUntil?: number;
}

const STORAGE_KEY = 'reminder_items';

type ReminderPreset = {
    label: string;
    kind: 'offset' | 'clock';
    amount?: number;
    unit?: 'minutes' | 'hours' | 'days';
    daysBefore?: number;
    timeOfDay?: 'morning' | 'midday' | 'evening';
};

const REMINDER_PRESETS: ReminderPreset[] = [
    { label: '30 min.', kind: 'offset', amount: 30, unit: 'minutes' },
    { label: '1 hour', kind: 'offset', amount: 1, unit: 'hours' },
    { label: '2 hours', kind: 'offset', amount: 2, unit: 'hours' },
    // Time of: zero minutes before, so it fires at the item's own time.
    { label: 'Time of', kind: 'offset', amount: 0, unit: 'minutes' },
];

function hourMinuteOf(saved: { hour?: number | null; minute?: number | null }): { hour?: number; minute?: number } {
    if (typeof saved.hour === 'number' && typeof saved.minute === 'number') {
        return { hour: saved.hour, minute: saved.minute };
    }
    return {};
}

// Fold My Day and Pets into the one list the first time Daily opens and
// finds reminder_items missing or empty. The old keys stay; dual-write
// keeps them current after this.
async function migrateIntoReminderItems(): Promise<ReminderItem[]> {
    const routineRaw = await AsyncStorage.getItem('my_routine');
    const petsRaw = await AsyncStorage.getItem('pets_feeds');
    const routine: { id: string; label: string; hour?: number | null; minute?: number | null; completed?: boolean; snoozedUntil?: number }[] =
        routineRaw ? JSON.parse(routineRaw) : [];
    const pets: { id: string; label: string; hour?: number | null; minute?: number | null; completed?: boolean; snoozedUntil?: number }[] =
        petsRaw ? JSON.parse(petsRaw) : [];
    const items: ReminderItem[] = [...routine, ...pets].map((one) => ({
        id: one.id,
        kind: 'daily' as const,
        label: one.label,
        ...hourMinuteOf(one),
        ...(one.completed ? { completed: true } : {}),
        ...(typeof one.snoozedUntil === 'number' ? { snoozedUntil: one.snoozedUntil } : {}),
    }));
    await saveReminderItems(items);
    return items;
}

export async function loadReminderItems(): Promise<ReminderItem[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
        const parsed = JSON.parse(raw) as ReminderItem[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    return migrateIntoReminderItems();
}

// Write the one list, then the old keys the engine still reads, then run
// the scheduler. Pets are written empty so a migrated feed is not armed
// twice — once as daily here and once from pets_feeds.
export async function saveReminderItems(items: ReminderItem[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const daily = items.filter((one) => one.kind === 'daily');
    const myRoutine = daily.map((one) => ({
        id: one.id,
        label: one.label,
        hour: typeof one.hour === 'number' ? one.hour : null,
        minute: typeof one.minute === 'number' ? one.minute : null,
        completed: !!one.completed,
        ...(typeof one.snoozedUntil === 'number' ? { snoozedUntil: one.snoozedUntil } : {}),
    }));
    await AsyncStorage.setItem('my_routine', JSON.stringify(myRoutine));
    await AsyncStorage.setItem('pets_feeds', JSON.stringify([]));
    AppGroup.setMyDayItems(daily.map((one) => ({ id: one.id, label: one.label })));

    const oneTime = items.filter((one) => one.kind === 'oneTime');
    const oneTimeIds = new Set(oneTime.map((one) => one.id));
    const todoRaw = await AsyncStorage.getItem('todo_tasks');
    const existingTodo: Record<string, unknown>[] = todoRaw ? JSON.parse(todoRaw) : [];
    const kept = existingTodo.filter((task) => typeof task.id === 'string' && !oneTimeIds.has(task.id));
    const createdDate = new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
    const merged = [
        ...kept,
        ...oneTime.map((one) => ({
            id: one.id,
            title: one.label,
            taskType: 'scheduled',
            year: one.year,
            month: one.month,
            day: one.day,
            ...(typeof one.hour === 'number' && typeof one.minute === 'number'
                ? { hour: one.hour, minute: one.minute }
                : {}),
            reminders: one.reminders ?? [],
            completed: !!one.completed,
            createdDate,
            notes: '',
        })),
    ];
    await AsyncStorage.setItem('todo_tasks', JSON.stringify(merged));

    warnIfFull(await runScheduler());
}

export default function ItemEditScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const { id, kind } = useLocalSearchParams<{
        id?: string;
        kind?: string;
        returnTo?: string;
    }>();
    const editingId = typeof id === 'string' && id ? id : null;

    const [loaded, setLoaded] = useState(false);
    const [editKind, setEditKind] = useState<'daily' | 'oneTime'>(
        kind === 'oneTime' ? 'oneTime' : 'daily',
    );
    const goToDaily = () => {
        router.replace('/daily' as Href);
    };
    const afterSave = () => {
        router.dismissAll();
        if (editKind === 'oneTime') {
            router.replace('/todo' as Href);
        } else {
            router.replace('/daily' as Href);
        }
    };
    const [tempName, setTempName] = useState('');
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    const [pendingTimeValid, setPendingTimeValid] = useState(true);
    const [pendingDate, setPendingDate] = useState<Date>(() => new Date(new Date().setHours(12, 0, 0, 0)));
    const [dateSet, setDateSet] = useState(true);
    const [timeSet, setTimeSet] = useState(false);
    const [dateTimeValid, setDateTimeValid] = useState(true);
    const [reminders, setReminders] = useState<LeadReminder[]>([]);

    useEffect(() => {
        const setup = async () => {
            const list = await loadReminderItems();
            if (editingId) {
                const found = list.find((one) => one.id === editingId);
                if (found) {
                    setEditKind(found.kind);
                    setTempName(found.label);
                    if (typeof found.hour === 'number' && typeof found.minute === 'number') {
                        setPendingTime(new Date(new Date().setHours(found.hour, found.minute, 0, 0)));
                        setTimeSet(true);
                    }
                    if (found.kind === 'oneTime' && typeof found.year === 'number' && typeof found.month === 'number' && typeof found.day === 'number') {
                        setPendingDate(new Date(
                            found.year,
                            found.month,
                            found.day,
                            typeof found.hour === 'number' ? found.hour : 12,
                            typeof found.minute === 'number' ? found.minute : 0,
                            0,
                            0,
                        ));
                        setDateSet(true);
                    }
                    setReminders(found.reminders ?? []);
                }
            } else if (kind === 'oneTime') {
                const today = new Date();
                today.setHours(12, 0, 0, 0);
                setPendingDate(today);
                setDateSet(true);
                setTimeSet(false);
                setEditKind('oneTime');
            }
            setLoaded(true);
        };
        setup();
    }, [editingId, kind]);

    const isPresetSelected = (p: ReminderPreset): boolean => {
        if (p.kind === 'clock') {
            return reminders.some((r) => r.kind === 'clock' && r.daysBefore === p.daysBefore && r.timeOfDay === p.timeOfDay);
        }
        return reminders.some((r) => r.kind !== 'clock' && r.amount === p.amount && r.unit === p.unit);
    };

    const togglePreset = (p: ReminderPreset) => {
        if (isPresetSelected(p)) {
            setReminders(reminders.filter((r) => {
                if (p.kind === 'clock') return !(r.kind === 'clock' && r.daysBefore === p.daysBefore && r.timeOfDay === p.timeOfDay);
                return !(r.kind !== 'clock' && r.amount === p.amount && r.unit === p.unit);
            }));
            return;
        }
        if (p.kind === 'clock') {
            setReminders([...reminders, {
                id: Date.now().toString(),
                amount: 0,
                unit: 'days',
                kind: 'clock',
                daysBefore: p.daysBefore,
                timeOfDay: p.timeOfDay,
            }]);
            return;
        }
        setReminders([...reminders, {
            id: Date.now().toString(),
            amount: p.amount ?? 0,
            unit: p.unit ?? 'minutes',
            kind: 'offset',
        }]);
    };

    const finishSave = async () => {
        const name = tempName.trim();
        const list = await loadReminderItems();
        let next: ReminderItem;
        if (editKind === 'daily') {
            next = {
                id: editingId ?? Date.now().toString(),
                kind: 'daily',
                label: name,
                ...hourMinuteOf({
                    hour: pendingTime ? pendingTime.getHours() : null,
                    minute: pendingTime ? pendingTime.getMinutes() : null,
                }),
            };
        } else {
            const when = dateSet ? pendingDate : new Date();
            next = {
                id: editingId ?? Date.now().toString(),
                kind: 'oneTime',
                label: name,
                year: when.getFullYear(),
                month: when.getMonth(),
                day: when.getDate(),
                ...hourMinuteOf({
                    hour: timeSet ? pendingDate.getHours() : null,
                    minute: timeSet ? pendingDate.getMinutes() : null,
                }),
                reminders,
            };
        }
        const updated = editingId
            ? list.map((one) => (one.id === editingId ? next : one))
            : [...list, next];
        await saveReminderItems(updated);
        afterSave();
    };

    const save = () => {
        if (!tempName.trim()) {
            Alert.alert('Missing Name', 'Please enter a name.');
            return;
        }
        if (editKind === 'daily' && !pendingTimeValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        if (editKind === 'oneTime' && !dateTimeValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        if (editKind === 'oneTime' && reminders.length === 0) {
            Alert.alert('No Reminder Set', "Are you sure you don't want to set a Reminder?", [
                { text: 'Go Back', style: 'cancel' },
                { text: 'Save Anyway', onPress: () => { void finishSave(); } },
            ]);
            return;
        }
        void finishSave();
    };

    if (!loaded) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goToDaily} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{editingId ? 'Edit' : 'New'}</Text>
                    <View style={styles.headerBtn} />
                </View>
            </SafeAreaView>
            <Bridge />
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={goToDaily}>
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.confirmBtn} onPress={save}>
                        <Text style={styles.confirmBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={tempName}
                    onChangeText={setTempName}
                    placeholder={editKind === 'daily' ? 'e.g. Breakfast, Morning Medication' : 'What needs to be done?'}
                    placeholderTextColor={theme.mutedText}
                    autoFocus={!editingId}
                />

                {editKind === 'daily' ? (
                    <DateTimeControl
                        mode="time"
                        value={pendingTime || new Date(new Date().setHours(12, 0, 0, 0))}
                        onChange={setPendingTime}
                        timeLabel="Time"
                        onValidityChange={setPendingTimeValid}
                        optionalTime
                        timeSet={pendingTime !== null}
                        onClearTime={() => setPendingTime(null)}
                    />
                ) : (
                    <>
                        <DateTimeControl
                            value={pendingDate}
                            onChange={(d, half) => {
                                setPendingDate(d);
                                if (half === 'date') setDateSet(true);
                                if (half === 'time') setTimeSet(true);
                            }}
                            onValidityChange={setDateTimeValid}
                            optionalDate
                            dateSet={dateSet}
                            onClearDate={() => setDateSet(false)}
                            optionalTime
                            timeSet={timeSet}
                            onClearTime={() => setTimeSet(false)}
                        />
                        <Text style={styles.inputLabel}>Reminders before</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                            {REMINDER_PRESETS.map((p) => (
                                <TouchableOpacity
                                    key={p.label}
                                    style={[styles.recurBtn, isPresetSelected(p) && styles.recurBtnActive]}
                                    onPress={() => togglePreset(p)}
                                >
                                    <Text style={[styles.recurBtnText, isPresetSelected(p) && styles.recurBtnTextActive]}>{p.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
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
        form: { padding: 16, paddingBottom: 40 },
        inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4, marginTop: 8 },
        input: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            backgroundColor: t.pageBackground,
            color: t.bodyText,
            marginBottom: 4,
        },
        recurBtn: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: t.cardBorder,
            backgroundColor: t.chip,
        },
        recurBtnActive: { backgroundColor: t.buttonPrimary, borderColor: t.buttonPrimary },
        recurBtnText: { fontSize: 13, color: t.cardTitle },
        recurBtnTextActive: { color: t.buttonPrimaryText },
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 0, marginBottom: 8 },
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
            borderWidth: 1,
            borderColor: t.buttonPrimary,
            padding: 12,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    });
