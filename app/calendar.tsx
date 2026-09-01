import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Theme, useTheme } from '../constants/Themes';
import { HeaderButton, PageFrame } from '../components/PageFrame';
import {
    DAY_NAMES,
    loadReminderItems,
    MONTH_NAMES,
    shadedDaysForItem,
    type ReminderItem,
} from '../modules/reminder-items';

function asNum(value: string | string[] | undefined): number | undefined {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw == null || raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
}

function sortByTimeThenLabel(items: ReminderItem[]): ReminderItem[] {
    return items.slice().sort((a, b) => {
        const aHas = typeof a.hour === 'number' && typeof a.minute === 'number';
        const bHas = typeof b.hour === 'number' && typeof b.minute === 'number';
        if (aHas && bHas) {
            if (a.hour !== b.hour) return (a.hour as number) - (b.hour as number);
            if (a.minute !== b.minute) return (a.minute as number) - (b.minute as number);
            return a.label.localeCompare(b.label);
        }
        if (aHas !== bHas) return aHas ? -1 : 1;
        return a.label.localeCompare(b.label);
    });
}

function eventsForMonth(items: ReminderItem[], year: number, month: number): ReminderItem[][] {
    const lastDay = new Date(year, month + 1, 0).getDate();
    const byDay: ReminderItem[][] = Array.from({ length: lastDay + 1 }, () => []);
    for (const item of items) {
        if (item.kind === 'daily' || item.kind === 'extended') continue;
        for (const day of shadedDaysForItem(item, year, month)) {
            if (day >= 1 && day <= lastDay) byDay[day].push(item);
        }
    }
    return byDay.map((list) => sortByTimeThenLabel(list));
}

function monthCells(year: number, month: number): (number | null)[][] {
    const startPad = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array.from({ length: startPad }, () => null),
        ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
}

export default function CalendarScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const params = useLocalSearchParams<{
        viewYear?: string | string[];
        viewMonth?: string | string[];
        dayYear?: string | string[];
        dayMonth?: string | string[];
        dayDate?: string | string[];
    }>();

    const paramViewYear = asNum(params.viewYear);
    const paramViewMonth = asNum(params.viewMonth);
    const paramDayYear = asNum(params.dayYear);
    const paramDayMonth = asNum(params.dayMonth);
    const paramDayDate = asNum(params.dayDate);

    const now = new Date();
    const [viewYear, setViewYear] = useState(paramViewYear ?? now.getFullYear());
    const [viewMonth, setViewMonth] = useState(paramViewMonth ?? now.getMonth());
    const [selectedDay, setSelectedDay] = useState<{ year: number; month: number; date: number } | null>(
        paramDayYear != null && paramDayMonth != null && paramDayDate != null
            ? { year: paramDayYear, month: paramDayMonth, date: paramDayDate }
            : null,
    );
    const [items, setItems] = useState<ReminderItem[]>([]);

    useEffect(() => {
        if (paramViewYear != null) setViewYear(paramViewYear);
        if (paramViewMonth != null) setViewMonth(paramViewMonth);
        if (paramDayYear != null && paramDayMonth != null && paramDayDate != null) {
            setSelectedDay({ year: paramDayYear, month: paramDayMonth, date: paramDayDate });
        }
    }, [paramViewYear, paramViewMonth, paramDayYear, paramDayMonth, paramDayDate]);

    useFocusEffect(
        useCallback(() => {
            void loadReminderItems().then(setItems);
        }, []),
    );

    const byDay = useMemo(() => eventsForMonth(items, viewYear, viewMonth), [items, viewYear, viewMonth]);
    const rows = useMemo(() => monthCells(viewYear, viewMonth), [viewYear, viewMonth]);
    const dayEvents = selectedDay
        ? eventsForMonth(items, selectedDay.year, selectedDay.month)[selectedDay.date] ?? []
        : [];

    const shiftMonth = (delta: number) => {
        const next = new Date(viewYear, viewMonth + delta, 1);
        setViewYear(next.getFullYear());
        setViewMonth(next.getMonth());
    };

    const goHome = () => {
        if (router.canDismiss()) router.dismissAll();
        router.replace('/home');
    };

    const closeDayList = () => {
        setSelectedDay(null);
        // The generated router list does not know this screen yet.
        router.replace({
            pathname: '/calendar',
            params: { viewYear: String(viewYear), viewMonth: String(viewMonth) },
        } as unknown as Href);
    };

    const openItem = (item: ReminderItem, day: { year: number; month: number; date: number }) => {
        router.push({
            pathname: '/item-edit',
            params: {
                id: item.id,
                kind: item.kind,
                returnTo: 'calendar',
                viewYear: String(viewYear),
                viewMonth: String(viewMonth),
                dayYear: String(day.year),
                dayMonth: String(day.month),
                dayDate: String(day.date),
            },
        } as Href);
    };

    const monthTitle = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    const dayTitle = selectedDay
        ? `${MONTH_NAMES[selectedDay.month]} ${selectedDay.date}, ${selectedDay.year}`
        : '';

    const header = (
        <View style={styles.header}>
            {selectedDay ? (
                <HeaderButton onPress={closeDayList}>
                    <Text style={styles.headerBtnText}>Back</Text>
                </HeaderButton>
            ) : (
                <HeaderButton onPress={goHome}>
                    <Text style={styles.headerBtnText}>Home</Text>
                </HeaderButton>
            )}
            {selectedDay ? (
                <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
                    {dayTitle}
                </Text>
            ) : (
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => shiftMonth(-1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.arrow}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
                        {monthTitle}
                    </Text>
                    <TouchableOpacity onPress={() => shiftMonth(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Text style={styles.arrow}>›</Text>
                    </TouchableOpacity>
                </View>
            )}
            <HeaderButton />
        </View>
    );

    // The month fills the screen under the header, so this page has no Bridge.
    const monthGrid = (
        <View style={styles.monthFill}>
            <View style={styles.dowRow}>
                {DAY_NAMES.map((name) => (
                    <Text key={name} style={styles.dow}>{name.slice(0, 1)}</Text>
                ))}
            </View>
            {rows.map((row, r) => (
                <View key={r} style={styles.weekRow}>
                    {row.map((day, c) => {
                        if (day == null) {
                            return <View key={c} style={styles.dayCell} />;
                        }
                        const names = byDay[day] ?? [];
                        return (
                            <TouchableOpacity
                                key={c}
                                style={styles.dayCell}
                                onPress={() => setSelectedDay({ year: viewYear, month: viewMonth, date: day })}
                            >
                                <Text style={styles.dayNum}>{day}</Text>
                                {/* Names are not tap targets; the whole day is. Vertical
                                    scroll only — a second scroll across the name fought
                                    the list in this small box. */}
                                <ScrollView
                                    style={styles.nameList}
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={false}
                                >
                                    {names.map((item) => (
                                        <Text
                                            key={item.id}
                                            style={styles.nameLine}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {item.label}
                                        </Text>
                                    ))}
                                </ScrollView>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );

    const dayList = (
        <ScrollView style={styles.dayList} contentContainerStyle={styles.dayListBody}>
            {dayEvents.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={styles.dayRow}
                    onPress={() => selectedDay && openItem(item, selectedDay)}
                >
                    <Text style={styles.dayRowLabel}>{item.label}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const body = selectedDay ? dayList : monthGrid;

    // The month fills the screen under the header, so this page has no Bridge.
    return (
        <View style={styles.container}>
            <PageFrame headerColor={theme.header} header={header} bridge={false}>
                {body}
            </PageFrame>
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
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        monthNav: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
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
        arrow: {
            fontSize: 28,
            color: t.headerButton,
            fontWeight: '600',
            paddingHorizontal: 4,
        },
        monthFill: { flex: 1, paddingHorizontal: 4, paddingBottom: 4 },
        dowRow: { flexDirection: 'row', paddingVertical: 4 },
        dow: {
            flex: 1,
            textAlign: 'center',
            fontSize: 12,
            color: t.mutedText,
        },
        weekRow: { flex: 1, flexDirection: 'row' },
        dayCell: {
            flex: 1,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            backgroundColor: t.card,
            padding: 2,
        },
        dayNum: { fontSize: 12, fontWeight: '600', color: t.cardTitle },
        nameList: { flex: 1 },
        nameLine: { fontSize: 10, color: t.bodyText, lineHeight: 13 },
        dayList: { flex: 1 },
        dayListBody: { padding: 12, paddingBottom: 40 },
        dayRow: {
            backgroundColor: t.card,
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            paddingVertical: 12,
            paddingHorizontal: 14,
            marginBottom: 8,
        },
        dayRowLabel: { fontSize: 16, color: t.bodyText, fontWeight: '500' },
    });
