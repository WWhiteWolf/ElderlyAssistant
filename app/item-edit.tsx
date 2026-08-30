import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
import ScreenOptionsSheet from '../components/ScreenOptionsSheet';
import { Theme, useTheme } from '../constants/Themes';
import {
    DAY_NAMES,
    hourMinuteOf,
    loadReminderItems,
    saveReminderItems,
    type LeadReminder,
    type ReminderItem,
    type ReminderKind,
} from '../modules/reminder-items';
import {
    optionCasesForKind,
    emptyOptionSettings,
    appliedOptionRows,
    optionsFromItem,
    applyConnectedOptions,
    keepOptionsForKind,
    type OptionSettings,
} from '../modules/option-cases';

type ReminderPreset = {
    label: string;
    kind: 'offset' | 'clock';
    amount?: number;
    unit?: 'minutes' | 'hours' | 'days';
    daysBefore?: number;
    timeOfDay?: 'morning' | 'midday' | 'evening';
};

const DAILY_ONE_TIME_PRESETS: ReminderPreset[] = [
    { label: '30 min.', kind: 'offset', amount: 30, unit: 'minutes' },
    { label: '1 hour', kind: 'offset', amount: 1, unit: 'hours' },
    { label: '2 hours', kind: 'offset', amount: 2, unit: 'hours' },
    { label: 'Time of', kind: 'offset', amount: 0, unit: 'minutes' },
];

const ONE_TIME_PRESETS: ReminderPreset[] = [
    { label: '30 min.', kind: 'offset', amount: 30, unit: 'minutes' },
    { label: '1 hour', kind: 'offset', amount: 1, unit: 'hours' },
    { label: '2 hours', kind: 'offset', amount: 2, unit: 'hours' },
    { label: 'Morning of', kind: 'clock', daysBefore: 0, timeOfDay: 'morning' },
    { label: 'Day Before', kind: 'clock', daysBefore: 1, timeOfDay: 'midday' },
    { label: 'Night Before', kind: 'clock', daysBefore: 1, timeOfDay: 'evening' },
    { label: '2 Days Before', kind: 'clock', daysBefore: 2, timeOfDay: 'midday' },
    { label: 'Week', kind: 'clock', daysBefore: 7, timeOfDay: 'evening' },
    { label: 'Month', kind: 'clock', daysBefore: 30, timeOfDay: 'evening' },
];

const KINDS: ReminderKind[] = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'oneTime', 'extended'];

function asParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

function kindFrom(kind?: string, returnTo?: string): ReminderKind {
    if (kind && KINDS.includes(kind as ReminderKind)) return kind as ReminderKind;
    if (returnTo === 'onetime') return 'oneTime';
    if (returnTo && KINDS.includes(returnTo as ReminderKind)) return returnTo as ReminderKind;
    return 'daily';
}

function pathFor(returnTo: string | undefined): Href {
    switch (returnTo) {
        case 'weekly': return '/weekly' as Href;
        case 'monthly': return '/monthly' as Href;
        case 'quarterly': return '/quarterly' as Href;
        case 'yearly': return '/yearly' as Href;
        case 'onetime': return '/onetime' as Href;
        case 'extended': return '/extended' as Href;
        default: return '/daily' as Href;
    }
}

export default function ItemEditScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const { id, kind, returnTo } = useLocalSearchParams<{
        id?: string | string[];
        kind?: string | string[];
        returnTo?: string | string[];
    }>();
    const editingId = asParam(id) || null;
    const page = asParam(returnTo) || 'daily';
    const startKind = kindFrom(asParam(kind), page);

    const [loaded, setLoaded] = useState(false);
    const [editKind, setEditKind] = useState<ReminderKind>(startKind);
    const [intervalMonths, setIntervalMonths] = useState(3);
    const [tempName, setTempName] = useState('');
    const [pendingDay, setPendingDay] = useState(() => new Date().getDay());
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    const [pendingTimeValid, setPendingTimeValid] = useState(true);
    const [pendingDate, setPendingDate] = useState<Date>(() => new Date(new Date().setHours(12, 0, 0, 0)));
    const [dateSet, setDateSet] = useState(true);
    const [timeSet, setTimeSet] = useState(false);
    const [dateTimeValid, setDateTimeValid] = useState(true);
    const [reminders, setReminders] = useState<LeadReminder[]>([]);
    const [existing, setExisting] = useState<ReminderItem | null>(null);
    const writtenIdRef = useRef<string | null>(editingId);
    if (editingId) writtenIdRef.current = editingId;
    const [showOptions, setShowOptions] = useState(false);
    const [optionsStartId, setOptionsStartId] = useState<string | null>(null);
    const [optionSettings, setOptionSettings] = useState<OptionSettings>(emptyOptionSettings);
    const [note, setNote] = useState('');
    const optionSettingsRef = useRef(optionSettings);
    optionSettingsRef.current = optionSettings;
    const noteRef = useRef(note);
    noteRef.current = note;
    const kindOptions = optionCasesForKind(editKind);
    const applied = appliedOptionRows(optionSettings).filter((one) =>
        kindOptions.some((c) => c.id === one.id),
    );

    const goBack = () => {
        if (router.canDismiss()) router.dismissAll();
        router.replace(pathFor(page));
    };

    const afterSave = () => {
        if (router.canDismiss()) router.dismissAll();
        if (!editingId && editKind === 'oneTime' && page === 'daily') {
            router.replace('/onetime' as Href);
        } else {
            router.replace(pathFor(page));
        }
    };

    useEffect(() => {
        let cancelled = false;
        const setup = async () => {
            const list = await loadReminderItems();
            if (cancelled) return;
            if (editingId) {
                const found = list.find((one) => one.id === editingId);
                if (found) {
                    setExisting(found);
                    setEditKind(found.kind);
                    setTempName(found.label);
                    if (typeof found.intervalMonths === 'number') setIntervalMonths(found.intervalMonths);
                    if (typeof found.day === 'number' && found.kind === 'weekly') setPendingDay(found.day);
                    if (typeof found.hour === 'number' && typeof found.minute === 'number') {
                        const t = new Date(new Date().setHours(found.hour, found.minute, 0, 0));
                        setPendingTime(t);
                        setTimeSet(true);
                        if (found.kind !== 'weekly' && found.kind !== 'daily' && found.kind !== 'extended') {
                            setPendingDate(new Date(
                                typeof found.year === 'number' ? found.year : t.getFullYear(),
                                typeof found.month === 'number' ? found.month : t.getMonth(),
                                typeof found.day === 'number' ? found.day : t.getDate(),
                                found.hour,
                                found.minute,
                                0,
                                0,
                            ));
                        }
                    } else if (
                        found.kind === 'monthly' || found.kind === 'quarterly' || found.kind === 'yearly' || found.kind === 'oneTime'
                    ) {
                        if (typeof found.year === 'number' && typeof found.month === 'number' && typeof found.day === 'number') {
                            setPendingDate(new Date(found.year, found.month, found.day, 12, 0, 0, 0));
                            setDateSet(true);
                        } else {
                            setDateSet(false);
                        }
                    }
                    if (found.kind === 'oneTime') {
                        setReminders(found.reminders ?? []);
                    }
                    if (found.kind === 'extended' || found.kind === 'daily' || found.kind === 'weekly') {
                        setTimeSet(typeof found.hour === 'number');
                    }
                    setOptionSettings(optionsFromItem(found));
                    setNote(found.notes ?? '');
                }
            } else {
                const nextKind = kindFrom(asParam(kind), page);
                setEditKind(nextKind);
                setOptionSettings(emptyOptionSettings());
                setNote('');
                if (nextKind === 'oneTime' && page === 'daily') {
                    const today = new Date();
                    today.setHours(12, 0, 0, 0);
                    setPendingDate(today);
                    setDateSet(true);
                    setTimeSet(false);
                } else if (nextKind === 'monthly' || nextKind === 'quarterly' || nextKind === 'yearly') {
                    const d = new Date();
                    d.setHours(12, 0, 0, 0);
                    setPendingDate(d);
                    setDateSet(true);
                    setTimeSet(true);
                } else if (nextKind === 'extended') {
                    setTimeSet(false);
                    setPendingTime(null);
                } else if (nextKind === 'weekly') {
                    setPendingTime(new Date(new Date().setHours(12, 0, 0, 0)));
                    setPendingDay(new Date().getDay());
                } else if (nextKind === 'daily') {
                    setPendingTime(null);
                }
            }
            setLoaded(true);
        };
        setup();
        return () => { cancelled = true; };
    }, [editingId, kind, page]);

    const presets = (page === 'daily' && editKind === 'oneTime') ? DAILY_ONE_TIME_PRESETS : ONE_TIME_PRESETS;

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

    const persist = async (leave: boolean) => {
        const name = tempName.trim();
        const list = await loadReminderItems();
        const id = editingId ?? writtenIdRef.current ?? Date.now().toString();
        writtenIdRef.current = id;
        const base: ReminderItem = existing ?? {
            id,
            kind: editKind,
            label: name,
        };
        let next: ReminderItem = { ...base, id, kind: editKind, label: name };

        if (editKind === 'daily') {
            next = {
                ...next,
                ...hourMinuteOf({
                    hour: pendingTime ? pendingTime.getHours() : null,
                    minute: pendingTime ? pendingTime.getMinutes() : null,
                }),
            };
            delete next.year;
            delete next.month;
            delete next.day;
            delete next.reminders;
            delete next.intervalMonths;
        } else if (editKind === 'weekly') {
            const t = pendingTime ?? new Date(new Date().setHours(12, 0, 0, 0));
            next = {
                ...next,
                day: pendingDay,
                hour: t.getHours(),
                minute: t.getMinutes(),
            };
            delete next.year;
            delete next.month;
            delete next.reminders;
            delete next.intervalMonths;
        } else if (editKind === 'monthly' || editKind === 'quarterly' || editKind === 'yearly') {
            next = {
                ...next,
                year: pendingDate.getFullYear(),
                month: pendingDate.getMonth(),
                day: pendingDate.getDate(),
                hour: pendingDate.getHours(),
                minute: pendingDate.getMinutes(),
                ...(editKind === 'quarterly' ? { intervalMonths } : {}),
            };
            delete next.reminders;
        } else if (editKind === 'oneTime') {
            const when = dateSet ? pendingDate : new Date();
            next = {
                ...next,
                ...(dateSet ? { year: when.getFullYear(), month: when.getMonth(), day: when.getDate() } : {}),
                ...hourMinuteOf({
                    hour: timeSet ? pendingDate.getHours() : null,
                    minute: timeSet ? pendingDate.getMinutes() : null,
                }),
                reminders,
            };
            if (!dateSet) {
                delete next.year;
                delete next.month;
                delete next.day;
            }
            delete next.intervalMonths;
        } else {
            next = {
                ...next,
                ...hourMinuteOf({
                    hour: timeSet && pendingTime ? pendingTime.getHours() : null,
                    minute: timeSet && pendingTime ? pendingTime.getMinutes() : null,
                }),
            };
            delete next.year;
            delete next.month;
            delete next.day;
            delete next.reminders;
            delete next.intervalMonths;
        }

        if (optionCasesForKind(editKind).length > 0) {
            next = keepOptionsForKind(
                applyConnectedOptions(next, optionSettingsRef.current),
                editKind,
            );
        } else if (editKind === 'daily') {
            next = applyConnectedOptions(next, emptyOptionSettings());
        }

        const trimmedNote = noteRef.current.trim();
        if (trimmedNote) next.notes = trimmedNote;
        else delete next.notes;

        const updated = list.some((one) => one.id === id)
            ? list.map((one) => (one.id === id ? next : one))
            : [...list, next];
        await saveReminderItems(updated);
        setExisting(next);
        if (leave) afterSave();
    };

    const save = () => {
        if (!tempName.trim()) {
            Alert.alert('Missing Name', 'Please enter a name.');
            return;
        }
        const timeKinds: ReminderKind[] = ['daily', 'weekly', 'extended'];
        if (timeKinds.includes(editKind) && !pendingTimeValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        const dateKinds: ReminderKind[] = ['monthly', 'quarterly', 'yearly', 'oneTime'];
        if (dateKinds.includes(editKind) && !dateTimeValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        if (editKind === 'oneTime' && reminders.length === 0) {
            Alert.alert('No Reminder Set', "Are you sure you don't want to set a Reminder?", [
                { text: 'Go Back', style: 'cancel' },
                { text: 'Save Anyway', onPress: () => { void persist(true); } },
            ]);
            return;
        }
        void persist(true);
    };

    if (!loaded) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']} />
            </View>
        );
    }

    const namePlaceholder =
        editKind === 'daily' ? 'e.g. Breakfast, Morning Medication'
        : editKind === 'weekly' ? 'e.g. Trash, Laundry'
        : 'What needs to be done?';

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={goBack} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>{editingId ? 'Edit' : 'New'}</Text>
                    {kindOptions.length > 0 || editKind === 'daily' ? (
                        <TouchableOpacity
                            onPress={() => {
                                setOptionsStartId(null);
                                setShowOptions(true);
                            }}
                            style={styles.headerBtn}
                        >
                            <Text style={styles.headerBtnText} numberOfLines={1} adjustsFontSizeToFit>+ OPT</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.headerBtn} />
                    )}
                </View>
            </SafeAreaView>
            <Bridge />
            <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                <View style={styles.modalBtns}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={goBack}>
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
                    placeholder={namePlaceholder}
                    placeholderTextColor={theme.mutedText}
                    autoFocus={!editingId}
                />

                {editKind === 'weekly' && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                        {DAY_NAMES.map((d, i) => (
                            <TouchableOpacity
                                key={d}
                                style={[styles.recurBtn, pendingDay === i && styles.recurBtnActive]}
                                onPress={() => setPendingDay(i)}
                            >
                                <Text style={[styles.recurBtnText, pendingDay === i && styles.recurBtnTextActive]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {(editKind === 'daily' || editKind === 'weekly') && (
                    <DateTimeControl
                        mode="time"
                        value={pendingTime || new Date(new Date().setHours(12, 0, 0, 0))}
                        onChange={setPendingTime}
                        timeLabel="Time"
                        onValidityChange={setPendingTimeValid}
                        optionalTime={editKind === 'daily'}
                        timeSet={editKind === 'weekly' ? true : pendingTime !== null}
                        onClearTime={() => setPendingTime(null)}
                    />
                )}

                {editKind === 'extended' && (
                    <DateTimeControl
                        mode="time"
                        value={pendingTime || new Date(new Date().setHours(12, 0, 0, 0))}
                        onChange={(d) => { setPendingTime(d); setTimeSet(true); }}
                        timeLabel="Time"
                        onValidityChange={setPendingTimeValid}
                        optionalTime
                        timeSet={timeSet}
                        onClearTime={() => { setPendingTime(null); setTimeSet(false); }}
                    />
                )}

                {(editKind === 'monthly' || editKind === 'quarterly' || editKind === 'yearly') && (
                    <DateTimeControl
                        value={pendingDate}
                        onChange={setPendingDate}
                        dateLabel="First Due Date"
                        onValidityChange={setDateTimeValid}
                    />
                )}

                {editKind === 'oneTime' && (
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
                            {presets.map((p) => (
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

                <Text style={styles.inputLabel}>Note:</Text>
                <TextInput
                    style={styles.input}
                    value={note}
                    onChangeText={setNote}
                    placeholder="A word or two besides the name"
                    placeholderTextColor={theme.mutedText}
                    multiline
                />

                {kindOptions.length > 0 && applied.length > 0 && (
                    <>
                        <Text style={styles.inputLabel}>Options</Text>
                        <View style={styles.optionCard}>
                            {applied.map((one, i) => (
                                <TouchableOpacity
                                    key={one.id}
                                    style={[styles.optionRow, i > 0 && styles.optionRowBorder]}
                                    onPress={() => {
                                        setOptionsStartId(one.id);
                                        setShowOptions(true);
                                    }}
                                >
                                    <Text style={styles.optionName}>{one.name}</Text>
                                    {one.value ? (
                                        <Text style={styles.optionValue} numberOfLines={1}>{one.value}</Text>
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </>
                )}
            </ScrollView>
            <ScreenOptionsSheet
                visible={showOptions}
                cases={kindOptions}
                settings={optionSettings}
                onChange={setOptionSettings}
                shadeWeekday={editKind === 'weekly' ? pendingDay : pendingDate.getDay()}
                startId={optionsStartId}
                warning={editKind === 'daily' ? 'None of these apply to Daily for now.' : undefined}
                onClose={() => setShowOptions(false)}
                onDone={() => {
                    setShowOptions(false);
                    if (tempName.trim()) void persist(false);
                }}
            />
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
        optionCard: {
            backgroundColor: t.card,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            marginBottom: 8,
        },
        optionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 12,
            gap: 8,
        },
        optionRowBorder: {
            borderTopWidth: 0.5,
            borderTopColor: t.cardBorder,
        },
        optionName: { fontSize: 15, color: t.cardTitle },
        optionValue: { flex: 1, fontSize: 15, color: t.mutedText, textAlign: 'right' },
    });
