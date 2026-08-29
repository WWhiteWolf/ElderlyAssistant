import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeControl, { formatDateMMDDYY } from '../components/DateTimeControl';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';
import * as AppGroup from '../modules/app-group';
import type { RepeatUnitCode } from '../scheduler/inputshape';
import { runScheduler } from '../scheduler/scheduler';
import { warnIfFull } from '../scheduler/warn';

// The one Input page (#29-new). Enter writes to My Day, Pets, My Week,
// Look Ahead, or To-Do from what was filled in, then opens that page.

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const UNIT_CHIPS: { label: string; value: RepeatUnitCode }[] = [
    { label: 'Day', value: 'day' },
    { label: 'Week', value: 'week' },
    { label: 'Month', value: 'month' },
    { label: 'Year', value: 'year' },
];

const unitWord = (unit: RepeatUnitCode, n: number) => {
    if (unit === 'day') return n === 1 ? 'day' : 'days';
    if (unit === 'week') return n === 1 ? 'week' : 'weeks';
    if (unit === 'month') return n === 1 ? 'month' : 'months';
    return n === 1 ? 'year' : 'years';
};

export default function InputScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [name, setName] = useState('');
    const [whenAt, setWhenAt] = useState(() => new Date());
    const [dateSet, setDateSet] = useState(false);
    const [timeSet, setTimeSet] = useState(false);

    const [repeatOpen, setRepeatOpen] = useState(false);
    const [repeatUnit, setRepeatUnit] = useState<RepeatUnitCode | null>(null);
    const [repeatInterval, setRepeatInterval] = useState(1);
    const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([]);
    const [untilAt, setUntilAt] = useState(() => new Date());
    const [untilSet, setUntilSet] = useState(false);
    // My Day and Pets are the same four lines. This try needs a word to
    // tell them apart. It is not the viewing-page design.
    const [dailyList, setDailyList] = useState<'myday' | 'pets'>('myday');

    const clearRepeat = () => {
        setRepeatUnit(null);
        setRepeatInterval(1);
        setRepeatWeekdays([]);
        setUntilSet(false);
    };

    const toggleWeekday = (day: number) => {
        setRepeatWeekdays((current) =>
            current.includes(day)
                ? current.filter((d) => d !== day)
                : [...current, day].sort((a, b) => a - b)
        );
    };

    const enterItem = async () => {
        const label = name.trim();
        if (!label) {
            Alert.alert('Missing Name', 'Please enter a name.');
            return;
        }
        const hour = whenAt.getHours();
        const minute = whenAt.getMinutes();

        if (repeatUnit === 'week') {
            if (!timeSet) {
                Alert.alert('Missing Time', 'Please set a time.');
                return;
            }
            if (repeatWeekdays.length === 0) {
                Alert.alert('Missing Day', 'Please pick a weekday.');
                return;
            }
            const raw = await AsyncStorage.getItem('week_routine');
            const chores: {
                id: string;
                label: string;
                day: number;
                hour: number;
                minute: number;
                completed: boolean;
            }[] = raw ? JSON.parse(raw) : [];
            const now = Date.now();
            const added = repeatWeekdays.map((day, i) => ({
                id: String(now + i),
                label,
                day,
                hour,
                minute,
                completed: false,
            }));
            await AsyncStorage.setItem('week_routine', JSON.stringify([...chores, ...added]));
            warnIfFull(await runScheduler());
            router.replace('/myweek');
            return;
        }

        if (repeatUnit === 'day') {
            if (!timeSet) {
                Alert.alert('Missing Time', 'Please set a time.');
                return;
            }
            const item = {
                id: Date.now().toString(),
                label,
                hour,
                minute,
                completed: false,
            };
            if (dailyList === 'pets') {
                const raw = await AsyncStorage.getItem('pets_feeds');
                const feeds: {
                    id: string;
                    label: string;
                    hour: number | null;
                    minute: number | null;
                    completed: boolean;
                }[] = raw ? JSON.parse(raw) : [];
                await AsyncStorage.setItem('pets_feeds', JSON.stringify([...feeds, item]));
                warnIfFull(await runScheduler());
                router.replace('/mollie');
                return;
            }
            const raw = await AsyncStorage.getItem('my_routine');
            const routine: {
                id: string;
                label: string;
                hour: number | null;
                minute: number | null;
                completed: boolean;
            }[] = raw ? JSON.parse(raw) : [];
            const updated = [...routine, item];
            await AsyncStorage.setItem('my_routine', JSON.stringify(updated));
            AppGroup.setMyDayItems(updated.map((i) => ({ id: i.id, label: i.label })));
            warnIfFull(await runScheduler());
            router.replace('/myday');
            return;
        }

        if (repeatUnit === 'month' || repeatUnit === 'year') {
            if (!dateSet) {
                Alert.alert('Missing Date', 'Please set a date.');
                return;
            }
            if (!timeSet) {
                Alert.alert('Missing Time', 'Please set a time.');
                return;
            }
            let interval: 'monthly' | '3month' | '6month' | 'yearly' = 'yearly';
            if (repeatUnit === 'month') {
                if (repeatInterval === 3) interval = '3month';
                else if (repeatInterval === 6) interval = '6month';
                else interval = 'monthly';
            }
            const raw = await AsyncStorage.getItem('lookahead_items');
            const items: {
                id: string;
                label: string;
                year: number;
                month: number;
                day: number;
                hour: number;
                minute: number;
                interval: 'monthly' | '3month' | '6month' | 'yearly';
            }[] = raw ? JSON.parse(raw) : [];
            const newItem = {
                id: Date.now().toString(),
                label,
                year: whenAt.getFullYear(),
                month: whenAt.getMonth(),
                day: whenAt.getDate(),
                hour,
                minute,
                interval,
            };
            await AsyncStorage.setItem('lookahead_items', JSON.stringify([...items, newItem]));
            warnIfFull(await runScheduler());
            router.replace('/lookahead');
            return;
        }

        // Repeat none: a To-Do task. Blank date stays blank. A time is
        // stored only when there is a date, the same as To-Do's own save.
        const due: {
            year?: number;
            month?: number;
            day?: number;
            hour?: number;
            minute?: number;
        } = {};
        if (dateSet) {
            due.year = whenAt.getFullYear();
            due.month = whenAt.getMonth();
            due.day = whenAt.getDate();
            if (timeSet) {
                due.hour = hour;
                due.minute = minute;
            }
        }
        const raw = await AsyncStorage.getItem('todo_tasks');
        const tasks: Record<string, unknown>[] = raw ? JSON.parse(raw) : [];
        const task = {
            id: Date.now().toString(),
            title: label,
            taskType: 'scheduled' as const,
            ...due,
            reminders: [],
            completed: false,
            createdDate: new Date().toLocaleDateString([], {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
            }),
            notes: '',
        };
        await AsyncStorage.setItem('todo_tasks', JSON.stringify([...tasks, task]));
        warnIfFull(await runScheduler());
        router.replace('/todo');
    };

    const repeatLabel = () => {
        if (!repeatUnit) return 'None';
        const n = repeatInterval;
        let text =
            n === 1
                ? `Every ${unitWord(repeatUnit, 1)}`
                : `Every ${n} ${unitWord(repeatUnit, n)}`;
        if (repeatUnit === 'week' && repeatWeekdays.length > 0) {
            const names = repeatWeekdays.map((d) => DAY_NAMES[d]).join(', ');
            text = `${text} on ${names}`;
        }
        if (untilSet) text = `${text}, until ${formatDateMMDDYY(untilAt)}`;
        return text;
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => {
                            router.dismissAll();
                            router.replace('/home');
                        }}
                        style={styles.headerBtn}
                    >
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Input</Text>
                    <TouchableOpacity onPress={enterItem} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Enter</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <Bridge />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="What is this for?"
                    placeholderTextColor={theme.mutedText}
                    autoFocus={true}
                />

                {/* Both halves start asleep. Empty is none, the same as To-Do. */}
                <DateTimeControl
                    value={whenAt}
                    onChange={(d, half) => {
                        setWhenAt(d);
                        if (half === 'date') setDateSet(true);
                        if (half === 'time') setTimeSet(true);
                    }}
                    optionalDate
                    dateSet={dateSet}
                    onClearDate={() => setDateSet(false)}
                    optionalTime
                    timeSet={timeSet}
                    onClearTime={() => setTimeSet(false)}
                />

                <Text style={styles.inputLabel}>Repeat</Text>
                <TouchableOpacity
                    style={styles.repeatRow}
                    onPress={() => setRepeatOpen(true)}
                >
                    <Text style={styles.repeatRowText}>{repeatLabel()}</Text>
                </TouchableOpacity>

                {repeatOpen && (
                    <View style={styles.repeatPanel}>
                        <Text style={styles.inputLabel}>How often</Text>
                        <View style={styles.chipRow}>
                            {UNIT_CHIPS.map((chip) => (
                                <TouchableOpacity
                                    key={chip.value}
                                    style={[
                                        styles.recurBtn,
                                        repeatUnit === chip.value && styles.recurBtnActive,
                                    ]}
                                    onPress={() => setRepeatUnit(chip.value)}
                                >
                                    <Text
                                        style={[
                                            styles.recurBtnText,
                                            repeatUnit === chip.value && styles.recurBtnTextActive,
                                        ]}
                                    >
                                        {chip.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={[styles.recurBtn, repeatUnit === null && styles.recurBtnActive]}
                                onPress={clearRepeat}
                            >
                                <Text
                                    style={[
                                        styles.recurBtnText,
                                        repeatUnit === null && styles.recurBtnTextActive,
                                    ]}
                                >
                                    None
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {repeatUnit === 'day' && (
                            <>
                                <Text style={styles.inputLabel}>For</Text>
                                <View style={styles.chipRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.recurBtn,
                                            dailyList === 'myday' && styles.recurBtnActive,
                                        ]}
                                        onPress={() => setDailyList('myday')}
                                    >
                                        <Text
                                            style={[
                                                styles.recurBtnText,
                                                dailyList === 'myday' && styles.recurBtnTextActive,
                                            ]}
                                        >
                                            My Day
                                        </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.recurBtn,
                                            dailyList === 'pets' && styles.recurBtnActive,
                                        ]}
                                        onPress={() => setDailyList('pets')}
                                    >
                                        <Text
                                            style={[
                                                styles.recurBtnText,
                                                dailyList === 'pets' && styles.recurBtnTextActive,
                                            ]}
                                        >
                                            Pets
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {repeatUnit !== null && (
                            <>
                                <Text style={styles.inputLabel}>Every how many</Text>
                                <View style={styles.intervalRow}>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() =>
                                            setRepeatInterval((n) => (n > 1 ? n - 1 : 1))
                                        }
                                    >
                                        <Text style={styles.stepBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.intervalNumber}>{repeatInterval}</Text>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => setRepeatInterval((n) => n + 1)}
                                    >
                                        <Text style={styles.stepBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {repeatUnit === 'week' && (
                            <>
                                <Text style={styles.inputLabel}>Which weekdays</Text>
                                <View style={styles.chipRow}>
                                    {DAY_NAMES.map((label, day) => {
                                        const on = repeatWeekdays.includes(day);
                                        return (
                                            <TouchableOpacity
                                                key={label}
                                                style={[styles.recurBtn, on && styles.recurBtnActive]}
                                                onPress={() => toggleWeekday(day)}
                                            >
                                                <Text
                                                    style={[
                                                        styles.recurBtnText,
                                                        on && styles.recurBtnTextActive,
                                                    ]}
                                                >
                                                    {label}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </>
                        )}

                        {repeatUnit !== null && (
                            <>
                                <Text style={styles.inputLabel}>Stops on</Text>
                                <DateTimeControl
                                    value={untilAt}
                                    onChange={(d) => {
                                        setUntilAt(d);
                                        setUntilSet(true);
                                    }}
                                    mode="date"
                                    optionalDate
                                    dateSet={untilSet}
                                    onClearDate={() => setUntilSet(false)}
                                />
                            </>
                        )}
                    </View>
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
        scroll: { flex: 1 },
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
        repeatRow: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 12,
            backgroundColor: t.card,
            marginBottom: 4,
        },
        repeatRowText: { fontSize: 16, color: t.bodyText },
        repeatPanel: { marginTop: 8 },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
        intervalRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
            gap: 16,
        },
        stepBtn: {
            width: 44,
            height: 44,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t.cardBorder,
            backgroundColor: t.chip,
            alignItems: 'center',
            justifyContent: 'center',
        },
        stepBtnText: { fontSize: 22, color: t.cardTitle, fontWeight: '600' },
        intervalNumber: { fontSize: 20, color: t.bodyText, fontWeight: '600', minWidth: 32, textAlign: 'center' },
    });
