import type { ReminderItem } from './reminder-types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type OptionCase = {
    id: string;
    icon: string;
    name: string;
    body: string;
};

export type HolidayMove = 'before' | 'after';
export type ShiftedChoice = 'then' | 'next';

// The values the Options case pages hold. Weekly's + OPT writes the
// cases that apply onto the item. Daily's every-day item and One Time
// for today get only time zone. Notes is a field on New and Edit, not
// an Options case.
export type OptionSettings = {
    holidayMove?: HolidayMove;
    floatsWithPhone: boolean;
    dueTimeZoneText?: string;
    shadeCalendar: boolean;
    shiftedChoice?: ShiftedChoice;
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
    afterWeekday?: number;
    afterDayCount: number;
};

export function phoneTimeZone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function emptyOptionSettings(): OptionSettings {
    return {
        floatsWithPhone: true,
        shadeCalendar: false,
        afterDayCount: 6,
    };
}

export const OPTION_CASES: OptionCase[] = [
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
        id: 'shifted',
        icon: '👆',
        name: 'An extra tap on a shifted day',
        body: 'When a day does not exist in that month, the last day that exists is used. An extra tap then chooses that day or the next day, not skip.',
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
        body: 'The first weekday after a numbered day in the period — for example the first Wednesday after the 6th.',
    },
];

const CONNECTED_IDS = ['holidays', 'timezone'];
const TIMEZONE_IDS = ['timezone'];
const MONTHLY_IDS = [
    ...CONNECTED_IDS,
    'shifted',
    'secondThursday',
    'wednesdayAfter',
];

function casesFor(ids: string[]): OptionCase[] {
    return ids.map((id) => OPTION_CASES.find((one) => one.id === id)).filter(
        (one): one is OptionCase => one != null,
    );
}

export function optionCasesForKind(kind: string): OptionCase[] {
    if (kind === 'daily' || kind === 'oneTime') return casesFor(TIMEZONE_IDS);
    if (kind === 'bucketlist') return [];
    if (kind === 'weekly' || kind === 'appointments') return casesFor(CONNECTED_IDS);
    if (kind === 'monthly' || kind === 'quarterly' || kind === 'yearly') return casesFor(MONTHLY_IDS);
    return [];
}

export type AppliedOption = {
    id: string;
    icon: string;
    name: string;
    value: string;
};

export function appliedOptionRows(settings: OptionSettings): AppliedOption[] {
    const rows: AppliedOption[] = [];
    const named = (id: string) => OPTION_CASES.find((one) => one.id === id);
    if (settings.holidayMove) {
        const one = named('holidays');
        if (one) {
            rows.push({
                id: one.id,
                icon: one.icon,
                name: one.name,
                value: settings.holidayMove === 'before' ? 'Day before' : 'Day after',
            });
        }
    }
    if (!settings.floatsWithPhone) {
        const one = named('timezone');
        if (one) rows.push({ id: one.id, icon: one.icon, name: one.name, value: 'Switch off' });
    }
    if (settings.shiftedChoice) {
        const one = named('shifted');
        if (one) {
            rows.push({
                id: one.id,
                icon: one.icon,
                name: one.name,
                value: settings.shiftedChoice === 'then' ? 'Then' : 'Next day',
            });
        }
    }
    if (settings.weekdayOrdinal != null && settings.ordinalWeekday != null) {
        const one = named('secondThursday');
        if (one) {
            const ordinal =
                settings.weekdayOrdinal === -1 ? 'Last'
                : settings.weekdayOrdinal === 1 ? '1st'
                : settings.weekdayOrdinal === 2 ? '2nd'
                : settings.weekdayOrdinal === 3 ? '3rd'
                : settings.weekdayOrdinal === 4 ? '4th'
                : String(settings.weekdayOrdinal);
            rows.push({
                id: one.id,
                icon: one.icon,
                name: one.name,
                value: `${ordinal} ${DAY_NAMES[settings.ordinalWeekday]}`,
            });
        }
    }
    if (settings.afterWeekday != null) {
        const one = named('wednesdayAfter');
        if (one) {
            rows.push({
                id: one.id,
                icon: one.icon,
                name: one.name,
                value: `${DAY_NAMES[settings.afterWeekday]} after ${settings.afterDayCount}`,
            });
        }
    }
    return rows;
}

export function optionsFromItem(item: ReminderItem): OptionSettings {
    return {
        ...emptyOptionSettings(),
        holidayMove: item.holidayMove,
        floatsWithPhone: item.floatsWithPhone !== false,
        dueTimeZoneText: item.dueTimeZoneText,
        shadeCalendar: !!item.shadeCalendar,
        shiftedChoice: item.shiftedChoice,
        weekdayOrdinal: item.weekdayOrdinal,
        ordinalWeekday: item.ordinalWeekday,
        afterWeekday: item.afterWeekday,
        afterDayCount: typeof item.afterDayCount === 'number' ? item.afterDayCount : 6,
    };
}

export function applyConnectedOptions(item: ReminderItem, settings: OptionSettings): ReminderItem {
    const out = { ...item };
    if (settings.holidayMove) out.holidayMove = settings.holidayMove;
    else delete out.holidayMove;
    if (!settings.floatsWithPhone) {
        out.floatsWithPhone = false;
        out.dueTimeZoneText = settings.dueTimeZoneText;
    } else {
        delete out.floatsWithPhone;
        delete out.dueTimeZoneText;
    }
    if (settings.shadeCalendar) out.shadeCalendar = true;
    else delete out.shadeCalendar;
    delete out.floatDay;
    if (settings.shiftedChoice) out.shiftedChoice = settings.shiftedChoice;
    else delete out.shiftedChoice;
    if (settings.weekdayOrdinal != null && settings.ordinalWeekday != null) {
        out.weekdayOrdinal = settings.weekdayOrdinal;
        out.ordinalWeekday = settings.ordinalWeekday;
    } else {
        delete out.weekdayOrdinal;
        delete out.ordinalWeekday;
    }
    if (settings.afterWeekday != null) {
        out.afterWeekday = settings.afterWeekday;
        out.afterDayCount = settings.afterDayCount;
    } else {
        delete out.afterWeekday;
        delete out.afterDayCount;
    }
    return out;
}

export type MonthlyPattern = 'date' | 'secondThursday' | 'wednesdayAfter';

export function secondThursdayComplete(s: {
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
}): boolean {
    return s.weekdayOrdinal != null && s.ordinalWeekday != null;
}

export function wednesdayAfterComplete(s: { afterWeekday?: number }): boolean {
    return s.afterWeekday != null;
}

export function monthlyPatternOf(item: {
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
    afterWeekday?: number;
}): MonthlyPattern {
    if (secondThursdayComplete(item)) return 'secondThursday';
    if (wednesdayAfterComplete(item)) return 'wednesdayAfter';
    return 'date';
}

/** The last of the three stays; the other two are cleared. */
export function withLastMonthlyPattern(
    settings: OptionSettings,
    last: MonthlyPattern,
): OptionSettings {
    if (last === 'secondThursday') {
        return { ...settings, afterWeekday: undefined, afterDayCount: 6 };
    }
    if (last === 'wednesdayAfter') {
        return { ...settings, weekdayOrdinal: undefined, ordinalWeekday: undefined };
    }
    return {
        ...settings,
        weekdayOrdinal: undefined,
        ordinalWeekday: undefined,
        afterWeekday: undefined,
        afterDayCount: 6,
    };
}

export function lastEnteredMonthlyPattern(
    prev: OptionSettings,
    next: OptionSettings,
    was: MonthlyPattern,
): MonthlyPattern {
    if (!secondThursdayComplete(next) && !wednesdayAfterComplete(next)) {
        return 'date';
    }
    const thursdayChanged =
        next.weekdayOrdinal !== prev.weekdayOrdinal
        || next.ordinalWeekday !== prev.ordinalWeekday;
    const wednesdayChanged =
        next.afterWeekday !== prev.afterWeekday
        || next.afterDayCount !== prev.afterDayCount;
    if (secondThursdayComplete(next) && thursdayChanged) {
        return 'secondThursday';
    }
    if (wednesdayAfterComplete(next) && wednesdayChanged) {
        return 'wednesdayAfter';
    }
    return was;
}

export function applyLastPatternToItem(item: ReminderItem, last: MonthlyPattern): ReminderItem {
    const out = { ...item };
    if (last === 'date') {
        delete out.weekdayOrdinal;
        delete out.ordinalWeekday;
        delete out.afterWeekday;
        delete out.afterDayCount;
        return out;
    }
    delete out.year;
    delete out.month;
    delete out.day;
    if (last === 'secondThursday') {
        delete out.afterWeekday;
        delete out.afterDayCount;
    } else {
        delete out.weekdayOrdinal;
        delete out.ordinalWeekday;
    }
    return out;
}

export function keepOptionsForKind(item: ReminderItem, kind: string): ReminderItem {
    const ids = new Set(optionCasesForKind(kind).map((c) => c.id));
    const out = { ...item };
    delete out.floatDay;
    if (!ids.has('holidays')) delete out.holidayMove;
    // The calendar page replaced the shading row, but the saved field stays.
    if (!ids.has('shifted')) delete out.shiftedChoice;
    if (!ids.has('secondThursday')) {
        delete out.weekdayOrdinal;
        delete out.ordinalWeekday;
    }
    if (!ids.has('wednesdayAfter')) {
        delete out.afterWeekday;
        delete out.afterDayCount;
    }
    return out;
}
