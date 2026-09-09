import type { ReminderItem } from './reminder-types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type OptionCase = {
    id: string;
    icon: string;
    name: string;
    body: string;
};

export type HolidayMove = 'before' | 'after';

// The values the Options case pages hold. Weekly's + OPT writes the
// cases that apply onto the item. Daily's every-day item and One Time
// for today get only time zone. Notes is a field on New and Edit, not
// an Options case. Then and Next Day are the missing-day banner, not
// an Options case.
export type OptionSettings = {
    holidayMove?: HolidayMove;
    floatsWithPhone: boolean;
    dueTimeZoneText?: string;
    shadeCalendar: boolean;
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
    if (kind === 'weekly' || kind === 'appointments' || kind === 'birthdays') return casesFor(CONNECTED_IDS);
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
    delete out.shiftedChoice;
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

export function secondThursdayComplete(s: {
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
}): boolean {
    return s.weekdayOrdinal != null && s.ordinalWeekday != null;
}

export function wednesdayAfterComplete(s: { afterWeekday?: number }): boolean {
    return s.afterWeekday != null;
}

/** True when one weekday bit of the exclusive group is complete. */
export function weekdayPatternComplete(s: {
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
    afterWeekday?: number;
}): boolean {
    return secondThursdayComplete(s) || wednesdayAfterComplete(s);
}

function namedBitComplete(settings: OptionSettings, name: string): boolean {
    if (name === 'secondThursday') return secondThursdayComplete(settings);
    if (name === 'wednesdayAfter') return wednesdayAfterComplete(settings);
    return false;
}

function namedBitChanged(prev: OptionSettings, next: OptionSettings, name: string): boolean {
    if (name === 'secondThursday') {
        return next.weekdayOrdinal !== prev.weekdayOrdinal
            || next.ordinalWeekday !== prev.ordinalWeekday;
    }
    if (name === 'wednesdayAfter') {
        return next.afterWeekday !== prev.afterWeekday
            || next.afterDayCount !== prev.afterDayCount;
    }
    return false;
}

function clearNamedBit(settings: OptionSettings, name: string): OptionSettings {
    if (name === 'secondThursday') {
        return { ...settings, weekdayOrdinal: undefined, ordinalWeekday: undefined };
    }
    if (name === 'wednesdayAfter') {
        return { ...settings, afterWeekday: undefined, afterDayCount: 6 };
    }
    return settings;
}

/** Turn the exclusive group off. Choosing a date is this, not a third bit. */
export function clearExclusiveGroupFields(settings: OptionSettings): OptionSettings {
    return {
        ...settings,
        weekdayOrdinal: undefined,
        ordinalWeekday: undefined,
        afterWeekday: undefined,
        afterDayCount: 6,
    };
}

/**
 * When one name on the table's list becomes complete, clear the others.
 * The list is exclusiveGroupBitsOf of the kind.
 */
export function withExclusiveGroup(
    prev: OptionSettings,
    next: OptionSettings,
    group: readonly string[] | undefined,
): OptionSettings {
    if (!group || group.length === 0) return next;
    let out = next;
    for (const name of group) {
        if (namedBitComplete(next, name) && namedBitChanged(prev, next, name)) {
            for (const other of group) {
                if (other !== name) out = clearNamedBit(out, other);
            }
            return out;
        }
    }
    return out;
}

/**
 * Write only the one complete exclusive bit. Both complete is neither.
 * Neither complete keeps the date and drops the weekday fields.
 */
export function applyExclusiveGroupToItem(
    item: ReminderItem,
    settings: OptionSettings,
): ReminderItem {
    const out = { ...item };
    const thursday = secondThursdayComplete(settings);
    const wednesday = wednesdayAfterComplete(settings);
    if (thursday && !wednesday) {
        delete out.afterWeekday;
        delete out.afterDayCount;
        delete out.year;
        delete out.month;
        delete out.day;
        return out;
    }
    if (wednesday && !thursday) {
        delete out.weekdayOrdinal;
        delete out.ordinalWeekday;
        delete out.year;
        delete out.month;
        delete out.day;
        return out;
    }
    delete out.weekdayOrdinal;
    delete out.ordinalWeekday;
    delete out.afterWeekday;
    delete out.afterDayCount;
    return out;
}

export function keepOptionsForKind(item: ReminderItem, kind: string): ReminderItem {
    const ids = new Set(optionCasesForKind(kind).map((c) => c.id));
    const out = { ...item };
    delete out.floatDay;
    delete out.shiftedChoice;
    if (!ids.has('holidays')) delete out.holidayMove;
    // The calendar page replaced the shading row, but the saved field stays.
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
