// The items to save for the sitting, and the expected notice, time, buttons,
// and result for each case. Expected answers are written here with ordinary
// date work, not by asking the engine under test.

import type { LeadReminder, ReminderItem } from '../../modules/reminder-types';
import { makeKey } from '../types';
import type { WantedTrigger } from '../types';

export const TEST_PREFIX = 'tl1-';

export const IDS = {
    dailyBase: 'tl1-daily-base',
    dailyNoTime: 'tl1-daily-notime',
    weeklyToday: 'tl1-weekly-today',
    monthlyToday: 'tl1-monthly-today',
    quarterlyToday: 'tl1-quarterly-today',
    yearlyToday: 'tl1-yearly-today',
    oneTimeToday: 'tl1-onetime-today',
    extended: 'tl1-extended',
    oneTime30: 'tl1-onetime-30min',
    oneTimeTimeOf: 'tl1-onetime-timeof',
    oneTimeMidnight: 'tl1-onetime-midnight',
    dailyZone: 'tl1-daily-zone',
    oneTimeZoneDate: 'tl1-onetime-zonedate',
    monthly31: 'tl1-monthly-31',
    holidayAfter: 'tl1-onetime-xmas',
    holidayBefore: 'tl1-weekly-july4',
    secondThursday: 'tl1-monthly-2ndthu',
    wedAfter6: 'tl1-monthly-wedafter6',
    monthly15: 'tl1-monthly-15th',
    dailySkip: 'tl1-daily-skip',
    liveDailyDone: 'tl1-live-daily-done',
    liveDailyDelay: 'tl1-live-daily-delay',
    liveDailySkip: 'tl1-live-daily-skip',
    liveWeeklyDone: 'tl1-live-weekly-done',
    liveOneTimeOk: 'tl1-live-onetime-ok',
} as const;

export const LABELS = {
    dailyBase: 'TEST Daily',
    dailyRenamed: 'TEST Daily renamed',
    dailyNoTime: 'TEST Daily no time',
    weeklyToday: 'TEST Weekly',
    monthlyToday: 'TEST Monthly',
    quarterlyToday: 'TEST Quarterly',
    yearlyToday: 'TEST Yearly',
    oneTimeToday: 'TEST One Time',
    extended: 'TEST Extended',
    oneTime30: 'TEST One Time 30 min',
    oneTimeTimeOf: 'TEST One Time Time of',
    oneTimeMidnight: 'TEST Lead midnight',
    dailyZone: 'TEST Named zone',
    oneTimeZoneDate: 'TEST Zone date',
    monthly31: 'TEST Monthly 31st',
    holidayAfter: 'TEST Holiday after',
    holidayBefore: 'TEST Holiday before',
    secondThursday: 'TEST Second Thursday',
    wedAfter6: 'TEST Wednesday after 6th',
    monthly15: 'TEST Monthly Done date',
    dailySkip: 'TEST Daily skip',
    liveDailyDone: 'TEST Live Daily Done',
    liveDailyDelay: 'TEST Live Daily Delay',
    liveDailySkip: 'TEST Live Daily Skip',
    liveWeeklyDone: 'TEST Live Weekly Done',
    liveOneTimeOk: 'TEST Live One Time OK',
} as const;

const LA = 'America/Los_Angeles';

export interface ExpectedNotice {
    source: string;
    itemId: string;
    part: string;
    title: string;
    body: string;
    label: string;
    categoryIdentifier: string;
    trigger: WantedTrigger;
}

export interface QueueCase {
    id: string;
    name: string;
    itemId: string;
    notices: ExpectedNotice[];
    savedDay?: number;
    lookHint?: string;
}

export interface LiveCase {
    id: string;
    name: string;
    itemId: string;
    fireAt: number;
    tap: string;
    after: string;
}

export interface FeatureScenario {
    items: ReminderItem[];
    queueCases: QueueCase[];
    live: LiveCase[];
    q14Shifted: boolean;
    q14FireAt: number | null;
    q1At: Date;
    q20At: Date;
    q1Hour: number;
    q1Minute: number;
}

export function dayPart(when: Date): string {
    const y = when.getFullYear();
    const m = String(when.getMonth() + 1).padStart(2, '0');
    const d = String(when.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
}

function lastDayOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function addCalendarDay(year: number, month: number, day: number, delta: number): {
    year: number;
    month: number;
    day: number;
} {
    const t = new Date(year, month, day + delta);
    return { year: t.getFullYear(), month: t.getMonth(), day: t.getDate() };
}

function roundUpMinute(ms: number): Date {
    const t = new Date(ms);
    if (t.getSeconds() > 0 || t.getMilliseconds() > 0) {
        t.setSeconds(0, 0);
        t.setMinutes(t.getMinutes() + 1);
    } else {
        t.setSeconds(0, 0);
    }
    return t;
}

function laterToday(now: Date, addMinutes: number): { hour: number; minute: number; at: Date } {
    const t = roundUpMinute(now.getTime() + addMinutes * 60 * 1000);
    if (
        t.getFullYear() !== now.getFullYear()
        || t.getMonth() !== now.getMonth()
        || t.getDate() !== now.getDate()
    ) {
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0, 0);
        if (end.getTime() > now.getTime()) {
            return { hour: end.getHours(), minute: end.getMinutes(), at: end };
        }
    }
    return { hour: t.getHours(), minute: t.getMinutes(), at: t };
}

function fromNow(loadAt: number, addMinutes: number): Date {
    return roundUpMinute(loadAt + addMinutes * 60 * 1000);
}

function zoneParts(timeZone: string, ms: number): {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
} {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date(ms));
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
    return {
        year: get('year'),
        month: get('month') - 1,
        day: get('day'),
        hour: get('hour'),
        minute: get('minute'),
    };
}

export function atInTimeZone(
    timeZone: string,
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
): number {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    });
    const seen = (ms: number) => {
        const parts = fmt.formatToParts(new Date(ms));
        const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? '0');
        return {
            year: get('year'),
            month: get('month') - 1,
            day: get('day'),
            hour: get('hour'),
            minute: get('minute'),
        };
    };
    let utc = Date.UTC(year, month, day, hour, minute, 0, 0);
    for (let i = 0; i < 4; i++) {
        const got = seen(utc);
        const gotStamp = Date.UTC(got.year, got.month, got.day, got.hour, got.minute, 0, 0);
        const want = Date.UTC(year, month, day, hour, minute, 0, 0);
        utc += want - gotStamp;
    }
    return utc;
}

function nextDailyInZone(
    timeZone: string,
    hour: number,
    minute: number,
    now: number,
): { at: number; year: number; month: number; day: number } {
    const nowZ = zoneParts(timeZone, now);
    let year = nowZ.year;
    let month = nowZ.month;
    let day = nowZ.day;
    let at = atInTimeZone(timeZone, year, month, day, hour, minute);
    if (at <= now) {
        const next = addCalendarDay(year, month, day, 1);
        year = next.year;
        month = next.month;
        day = next.day;
        at = atInTimeZone(timeZone, year, month, day, hour, minute);
    }
    return { at, year, month, day };
}

// Copied US federal holiday dates for the holiday cases. The named day is
// the holiday; a weekend observed-day is not used to move Christmas or
// the Fourth, because those two cases name 26 December and 3 July.
function nthWeekday(year: number, month: number, weekday: number, n: number): number {
    if (n === -1) {
        const last = lastDayOfMonth(year, month);
        for (let d = last; d >= 1; d--) {
            if (new Date(year, month, d).getDay() === weekday) return d;
        }
        return last;
    }
    let seen = 0;
    const last = lastDayOfMonth(year, month);
    for (let d = 1; d <= last; d++) {
        if (new Date(year, month, d).getDay() === weekday) {
            seen += 1;
            if (seen === n) return d;
        }
    }
    return last;
}

function isFederalHoliday(year: number, month: number, day: number): boolean {
    if (month === 0 && day === 1) return true;
    if (month === 0 && day === nthWeekday(year, 0, 1, 3)) return true;
    if (month === 1 && day === nthWeekday(year, 1, 1, 3)) return true;
    if (month === 4 && day === nthWeekday(year, 4, 1, -1)) return true;
    if (month === 5 && day === 19) return true;
    if (month === 6 && day === 4) return true;
    if (month === 8 && day === nthWeekday(year, 8, 1, 1)) return true;
    if (month === 9 && day === nthWeekday(year, 9, 1, 2)) return true;
    if (month === 10 && day === 11) return true;
    if (month === 10 && day === nthWeekday(year, 10, 4, 4)) return true;
    if (month === 11 && day === 25) return true;
    return false;
}

function applyHolidayMove(
    year: number,
    month: number,
    day: number,
    move: 'before' | 'after',
): { year: number; month: number; day: number } {
    if (!isFederalHoliday(year, month, day)) return { year, month, day };
    return addCalendarDay(year, month, day, move === 'after' ? 1 : -1);
}

function nextChristmas(now: Date): { year: number; month: number; day: number } {
    let year = now.getFullYear();
    const xmas = new Date(year, 11, 25, 23, 59, 0, 0);
    if (xmas.getTime() <= now.getTime()) year += 1;
    return { year, month: 11, day: 25 };
}

function nextFourthOfJuly(now: Date): { year: number; month: number; day: number } {
    let year = now.getFullYear();
    const fourth = new Date(year, 6, 4, 23, 59, 0, 0);
    if (fourth.getTime() <= now.getTime()) year += 1;
    return { year, month: 6, day: 4 };
}

function nextMonthly31(now: Date, hour: number, minute: number): {
    at: Date;
    shifted: boolean;
} {
    let year = now.getFullYear();
    let month = now.getMonth();
    for (let i = 0; i < 36; i++) {
        const last = lastDayOfMonth(year, month);
        const day = Math.min(31, last);
        const at = new Date(year, month, day, hour, minute, 0, 0);
        if (at.getTime() > now.getTime()) {
            return { at, shifted: day !== 31 };
        }
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }
    const at = new Date(now.getTime() + 60 * 1000);
    return { at, shifted: true };
}

function secondThursdayOf(year: number, month: number): number {
    for (let d = 8; d <= 14; d++) {
        if (new Date(year, month, d).getDay() === 4) return d;
    }
    return 8;
}

function nextSecondThursday(now: Date, hour: number, minute: number): Date {
    let year = now.getFullYear();
    let month = now.getMonth();
    for (let i = 0; i < 24; i++) {
        const day = secondThursdayOf(year, month);
        const at = new Date(year, month, day, hour, minute, 0, 0);
        if (at.getTime() > now.getTime()) return at;
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }
    return new Date(now.getTime() + 60 * 1000);
}

function firstWednesdayOnOrAfterSeventh(year: number, month: number): number | null {
    const last = lastDayOfMonth(year, month);
    for (let d = 7; d <= last; d++) {
        if (new Date(year, month, d).getDay() === 3) return d;
    }
    return null;
}

function nextWednesdayAfterSixth(now: Date, hour: number, minute: number): Date {
    let year = now.getFullYear();
    let month = now.getMonth();
    for (let i = 0; i < 24; i++) {
        const day = firstWednesdayOnOrAfterSeventh(year, month);
        if (day != null) {
            const at = new Date(year, month, day, hour, minute, 0, 0);
            if (at.getTime() > now.getTime()) return at;
        }
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }
    return new Date(now.getTime() + 60 * 1000);
}

function nextWeekday(now: Date, weekday: number, hour: number, minute: number): Date {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    for (let i = 0; i < 8; i++) {
        const cand = new Date(t.getFullYear(), t.getMonth(), t.getDate() + i, hour, minute, 0, 0);
        if (cand.getDay() === weekday && cand.getTime() > now.getTime()) return cand;
    }
    return new Date(t.getTime() + 7 * 24 * 60 * 60 * 1000);
}

function dailyNotice(itemId: string, label: string, at: Date): ExpectedNotice {
    return {
        source: 'myday',
        itemId,
        part: dayPart(at),
        title: 'Daily Routine',
        body: `Time for ${label}!`,
        label,
        categoryIdentifier: 'routineactions',
        trigger: { kind: 'date', at: at.getTime() },
    };
}

function weeklyNotice(itemId: string, label: string, at: Date): ExpectedNotice {
    return {
        source: 'myweek',
        itemId,
        part: dayPart(at),
        title: 'Weekly Chore',
        body: `Time for ${label}!`,
        label,
        categoryIdentifier: 'routineactions',
        trigger: { kind: 'date', at: at.getTime() },
    };
}

function lookAheadNotice(
    itemId: string,
    label: string,
    at: Date,
    shifted: boolean,
): ExpectedNotice {
    return {
        source: 'lookahead',
        itemId,
        part: dayPart(at),
        title: '🔭 Look Ahead',
        body: `Time for ${label}!`,
        label,
        categoryIdentifier: shifted ? 'shifteddayactions' : 'lookaheadactions',
        trigger: { kind: 'date', at: at.getTime() },
    };
}

// The live One Time sentence is "Due: MM/DD/YY at HH:MM", 24-hour, same
// as the translator writes. The checker must not import that file, so the
// two digit lines are written here. A lead uses the appointment's due clock,
// not the fire time of the lead.
function twoDigits(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function oneTimeDueSentence(when: Date, timeZone?: string): string {
    if (timeZone) {
        const z = zoneParts(timeZone, when.getTime());
        const date = `${twoDigits(z.month + 1)}/${twoDigits(z.day)}/${twoDigits(z.year % 100)}`;
        const time = `${twoDigits(z.hour)}:${twoDigits(z.minute)}`;
        return `Due: ${date} at ${time}`;
    }
    const date = `${twoDigits(when.getMonth() + 1)}/${twoDigits(when.getDate())}/${twoDigits(when.getFullYear() % 100)}`;
    const time = `${twoDigits(when.getHours())}:${twoDigits(when.getMinutes())}`;
    return `Due: ${date} at ${time}`;
}

function oneTimeNotice(
    itemId: string,
    label: string,
    part: string,
    fireAt: Date,
    dueAt: Date = fireAt,
    timeZone?: string,
): ExpectedNotice {
    return {
        source: 'todo',
        itemId,
        part,
        title: `📋 Reminder: ${label}`,
        body: oneTimeDueSentence(dueAt, timeZone),
        label,
        categoryIdentifier: 'todook',
        trigger: { kind: 'date', at: fireAt.getTime() },
    };
}

function leadOf(id: string, minutes: number): LeadReminder {
    return { id, amount: minutes, unit: 'minutes', kind: 'offset' };
}

function item(partial: ReminderItem): ReminderItem {
    return partial;
}

export function buildFeatureScenario(now: Date, loadAt: number): FeatureScenario {
    const q1 = laterToday(now, 20);
    const q3 = laterToday(now, 21);
    const q4 = laterToday(now, 22);
    const q5 = laterToday(now, 23);
    const q6 = laterToday(now, 24);
    const q7 = laterToday(now, 25);
    const q10 = laterToday(now, 28);
    const q14clock = laterToday(now, 26);
    const skip = laterToday(now, 32);
    const q9 = laterToday(now, 60);

    const today = {
        year: now.getFullYear(),
        month: now.getMonth(),
        day: now.getDate(),
        weekday: now.getDay(),
    };

    const q14 = nextMonthly31(now, q14clock.hour, q14clock.minute);
    const q17 = nextSecondThursday(now, q1.hour, q1.minute);
    const q18 = nextWednesdayAfterSixth(now, q1.hour, q1.minute);

    const xmas = nextChristmas(now);
    const xmasMoved = applyHolidayMove(xmas.year, xmas.month, xmas.day, 'after');
    const xmasAt = new Date(xmasMoved.year, xmasMoved.month, xmasMoved.day, 10, 0, 0, 0);

    const july = nextFourthOfJuly(now);
    const julyWeekday = new Date(july.year, july.month, july.day).getDay();
    const julyWeekly = nextWeekday(now, julyWeekday, q3.hour, q3.minute);
    const julyMoved = applyHolidayMove(
        julyWeekly.getFullYear(),
        julyWeekly.getMonth(),
        julyWeekly.getDate(),
        'before',
    );
    const julyAt = new Date(julyMoved.year, julyMoved.month, julyMoved.day, q3.hour, q3.minute, 0, 0);

    const q20 = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        15,
        q1.hour,
        q1.minute,
        0,
        0,
    );

    const zoneDaily = nextDailyInZone(LA, 15, 0, now.getTime());
    const zoneNow = zoneParts(LA, now.getTime());
    let zoneDateYear = zoneNow.year;
    let zoneDateMonth = zoneNow.month;
    let zoneDateDay = zoneNow.day;
    let zoneDateAt = atInTimeZone(LA, zoneDateYear, zoneDateMonth, zoneDateDay, 0, 30);
    if (zoneDateAt <= now.getTime()) {
        const next = addCalendarDay(zoneDateYear, zoneDateMonth, zoneDateDay, 1);
        zoneDateYear = next.year;
        zoneDateMonth = next.month;
        zoneDateDay = next.day;
        zoneDateAt = atInTimeZone(LA, zoneDateYear, zoneDateMonth, zoneDateDay, 0, 30);
    }

    const tomorrow = addCalendarDay(today.year, today.month, today.day, 1);
    const midnightAt = new Date(tomorrow.year, tomorrow.month, tomorrow.day, 0, 10, 0, 0);
    const leadMidnight = new Date(midnightAt.getTime() - 30 * 60 * 1000);

    const l1 = fromNow(loadAt, 2);
    const l2 = fromNow(loadAt, 4);
    const l3 = fromNow(loadAt, 6);
    const l4 = fromNow(loadAt, 8);
    const l5 = fromNow(loadAt, 10);

    const items: ReminderItem[] = [
        item({
            id: IDS.dailyBase,
            kind: 'daily',
            label: LABELS.dailyBase,
            hour: q1.hour,
            minute: q1.minute,
        }),
        item({
            id: IDS.dailyNoTime,
            kind: 'daily',
            label: LABELS.dailyNoTime,
        }),
        item({
            id: IDS.weeklyToday,
            kind: 'weekly',
            label: LABELS.weeklyToday,
            day: today.weekday,
            hour: q3.hour,
            minute: q3.minute,
        }),
        item({
            id: IDS.monthlyToday,
            kind: 'monthly',
            label: LABELS.monthlyToday,
            year: today.year,
            month: today.month,
            day: today.day,
            hour: q4.hour,
            minute: q4.minute,
        }),
        item({
            id: IDS.quarterlyToday,
            kind: 'quarterly',
            label: LABELS.quarterlyToday,
            year: today.year,
            month: today.month,
            day: today.day,
            hour: q5.hour,
            minute: q5.minute,
        }),
        item({
            id: IDS.yearlyToday,
            kind: 'yearly',
            label: LABELS.yearlyToday,
            year: today.year,
            month: today.month,
            day: today.day,
            hour: q6.hour,
            minute: q6.minute,
        }),
        item({
            id: IDS.oneTimeToday,
            kind: 'oneTime',
            label: LABELS.oneTimeToday,
            year: today.year,
            month: today.month,
            day: today.day,
            hour: q7.hour,
            minute: q7.minute,
            reminders: [leadOf('base', 0)],
        }),
        item({
            id: IDS.extended,
            kind: 'extended',
            label: LABELS.extended,
            notes: 'TEST extended note',
        }),
        item({
            id: IDS.oneTime30,
            kind: 'oneTime',
            label: LABELS.oneTime30,
            year: today.year,
            month: today.month,
            day: today.day,
            hour: q9.hour,
            minute: q9.minute,
            reminders: [leadOf('base', 0), leadOf('30min', 30)],
        }),
        item({
            id: IDS.oneTimeTimeOf,
            kind: 'oneTime',
            label: LABELS.oneTimeTimeOf,
            year: today.year,
            month: today.month,
            day: today.day,
            hour: q10.hour,
            minute: q10.minute,
            reminders: [leadOf('timeof', 0)],
        }),
        item({
            id: IDS.oneTimeMidnight,
            kind: 'oneTime',
            label: LABELS.oneTimeMidnight,
            year: tomorrow.year,
            month: tomorrow.month,
            day: tomorrow.day,
            hour: 0,
            minute: 10,
            reminders: [leadOf('base', 0), leadOf('30min', 30)],
        }),
        item({
            id: IDS.dailyZone,
            kind: 'daily',
            label: LABELS.dailyZone,
            hour: 15,
            minute: 0,
            floatsWithPhone: false,
            dueTimeZoneText: LA,
        }),
        item({
            id: IDS.oneTimeZoneDate,
            kind: 'oneTime',
            label: LABELS.oneTimeZoneDate,
            year: zoneDateYear,
            month: zoneDateMonth,
            day: zoneDateDay,
            hour: 0,
            minute: 30,
            floatsWithPhone: false,
            dueTimeZoneText: LA,
            reminders: [leadOf('base', 0)],
        }),
        item({
            id: IDS.monthly31,
            kind: 'monthly',
            label: LABELS.monthly31,
            year: today.year,
            month: today.month,
            day: 31,
            hour: q14clock.hour,
            minute: q14clock.minute,
        }),
        item({
            id: IDS.holidayAfter,
            kind: 'oneTime',
            label: LABELS.holidayAfter,
            year: xmas.year,
            month: xmas.month,
            day: xmas.day,
            hour: 10,
            minute: 0,
            holidayMove: 'after',
            reminders: [leadOf('base', 0)],
        }),
        item({
            id: IDS.holidayBefore,
            kind: 'weekly',
            label: LABELS.holidayBefore,
            day: julyWeekday,
            hour: q3.hour,
            minute: q3.minute,
            holidayMove: 'before',
        }),
        item({
            id: IDS.secondThursday,
            kind: 'monthly',
            label: LABELS.secondThursday,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
            hour: q1.hour,
            minute: q1.minute,
        }),
        item({
            id: IDS.wedAfter6,
            kind: 'monthly',
            label: LABELS.wedAfter6,
            afterWeekday: 3,
            afterDayCount: 6,
            hour: q1.hour,
            minute: q1.minute,
        }),
        item({
            id: IDS.monthly15,
            kind: 'monthly',
            label: LABELS.monthly15,
            year: q20.getFullYear(),
            month: q20.getMonth(),
            day: 15,
            hour: q1.hour,
            minute: q1.minute,
        }),
        item({
            id: IDS.dailySkip,
            kind: 'daily',
            label: LABELS.dailySkip,
            hour: skip.hour,
            minute: skip.minute,
        }),
        item({
            id: IDS.liveDailyDone,
            kind: 'daily',
            label: LABELS.liveDailyDone,
            hour: l1.getHours(),
            minute: l1.getMinutes(),
        }),
        item({
            id: IDS.liveDailyDelay,
            kind: 'daily',
            label: LABELS.liveDailyDelay,
            hour: l2.getHours(),
            minute: l2.getMinutes(),
        }),
        item({
            id: IDS.liveDailySkip,
            kind: 'daily',
            label: LABELS.liveDailySkip,
            hour: l3.getHours(),
            minute: l3.getMinutes(),
        }),
        item({
            id: IDS.liveWeeklyDone,
            kind: 'weekly',
            label: LABELS.liveWeeklyDone,
            day: today.weekday,
            hour: l4.getHours(),
            minute: l4.getMinutes(),
        }),
        item({
            id: IDS.liveOneTimeOk,
            kind: 'oneTime',
            label: LABELS.liveOneTimeOk,
            year: l5.getFullYear(),
            month: l5.getMonth(),
            day: l5.getDate(),
            hour: l5.getHours(),
            minute: l5.getMinutes(),
            reminders: [leadOf('base', 0)],
        }),
    ];

    const q9At = q9.at;
    const q9Lead = new Date(q9At.getTime() - 30 * 60 * 1000);

    const zoneDailyAt = new Date(zoneDaily.at);
    const zoneDateWhen = new Date(zoneDateAt);

    const queueCases: QueueCase[] = [
        {
            id: 'Q1',
            name: LABELS.dailyBase,
            itemId: IDS.dailyBase,
            notices: [dailyNotice(IDS.dailyBase, LABELS.dailyBase, q1.at)],
        },
        {
            id: 'Q2',
            name: LABELS.dailyNoTime,
            itemId: IDS.dailyNoTime,
            notices: [],
        },
        {
            id: 'Q3',
            name: LABELS.weeklyToday,
            itemId: IDS.weeklyToday,
            notices: [weeklyNotice(IDS.weeklyToday, LABELS.weeklyToday, q3.at)],
        },
        {
            id: 'Q4',
            name: LABELS.monthlyToday,
            itemId: IDS.monthlyToday,
            notices: [lookAheadNotice(IDS.monthlyToday, LABELS.monthlyToday, q4.at, false)],
        },
        {
            id: 'Q5',
            name: LABELS.quarterlyToday,
            itemId: IDS.quarterlyToday,
            notices: [lookAheadNotice(IDS.quarterlyToday, LABELS.quarterlyToday, q5.at, false)],
        },
        {
            id: 'Q6',
            name: LABELS.yearlyToday,
            itemId: IDS.yearlyToday,
            notices: [lookAheadNotice(IDS.yearlyToday, LABELS.yearlyToday, q6.at, false)],
        },
        {
            id: 'Q7',
            name: LABELS.oneTimeToday,
            itemId: IDS.oneTimeToday,
            notices: [oneTimeNotice(IDS.oneTimeToday, LABELS.oneTimeToday, 'base', q7.at)],
        },
        {
            id: 'Q8',
            name: LABELS.extended,
            itemId: IDS.extended,
            notices: [],
        },
        {
            id: 'Q9',
            name: LABELS.oneTime30,
            itemId: IDS.oneTime30,
            notices: [
                oneTimeNotice(IDS.oneTime30, LABELS.oneTime30, 'base', q9At),
                oneTimeNotice(IDS.oneTime30, LABELS.oneTime30, '30min', q9Lead, q9At),
            ],
        },
        {
            id: 'Q10',
            name: LABELS.oneTimeTimeOf,
            itemId: IDS.oneTimeTimeOf,
            notices: [oneTimeNotice(IDS.oneTimeTimeOf, LABELS.oneTimeTimeOf, 'timeof', q10.at)],
        },
        {
            id: 'Q11',
            name: LABELS.oneTimeMidnight,
            itemId: IDS.oneTimeMidnight,
            notices: [
                oneTimeNotice(IDS.oneTimeMidnight, LABELS.oneTimeMidnight, 'base', midnightAt),
                oneTimeNotice(IDS.oneTimeMidnight, LABELS.oneTimeMidnight, '30min', leadMidnight, midnightAt),
            ],
        },
        {
            id: 'Q12',
            name: LABELS.dailyZone,
            itemId: IDS.dailyZone,
            notices: [{
                ...dailyNotice(IDS.dailyZone, LABELS.dailyZone, zoneDailyAt),
                trigger: { kind: 'date', at: zoneDaily.at },
                part: `${zoneDaily.year}${String(zoneDaily.month + 1).padStart(2, '0')}${String(zoneDaily.day).padStart(2, '0')}`,
            }],
        },
        {
            id: 'Q13',
            name: LABELS.oneTimeZoneDate,
            itemId: IDS.oneTimeZoneDate,
            notices: [oneTimeNotice(
                IDS.oneTimeZoneDate,
                LABELS.oneTimeZoneDate,
                'base',
                zoneDateWhen,
                zoneDateWhen,
                LA,
            )],
        },
        {
            id: 'Q14',
            name: LABELS.monthly31,
            itemId: IDS.monthly31,
            notices: [lookAheadNotice(IDS.monthly31, LABELS.monthly31, q14.at, q14.shifted)],
            savedDay: 31,
        },
        {
            id: 'Q15',
            name: LABELS.holidayAfter,
            itemId: IDS.holidayAfter,
            notices: [oneTimeNotice(
                IDS.holidayAfter,
                LABELS.holidayAfter,
                'base',
                xmasAt,
                new Date(xmas.year, xmas.month, xmas.day, 10, 0, 0, 0),
            )],
        },
        {
            id: 'Q16',
            name: LABELS.holidayBefore,
            itemId: IDS.holidayBefore,
            notices: [weeklyNotice(IDS.holidayBefore, LABELS.holidayBefore, julyAt)],
        },
        {
            id: 'Q17',
            name: LABELS.secondThursday,
            itemId: IDS.secondThursday,
            notices: [lookAheadNotice(IDS.secondThursday, LABELS.secondThursday, q17, false)],
        },
        {
            id: 'Q18',
            name: LABELS.wedAfter6,
            itemId: IDS.wedAfter6,
            notices: [lookAheadNotice(IDS.wedAfter6, LABELS.wedAfter6, q18, false)],
        },
        {
            id: 'Q21',
            name: 'Calendar shading',
            itemId: IDS.monthly31,
            notices: [],
            lookHint: 'Open Monthly on the 31st item: the last day of the short month is shaded. Open the Christmas item’s month: the moved holiday day is shaded.',
        },
    ];

    const live: LiveCase[] = [
        {
            id: 'L1',
            name: LABELS.liveDailyDone,
            itemId: IDS.liveDailyDone,
            fireAt: l1.getTime(),
            tap: 'Done',
            after: 'Daily: that row is checked, Log has a line, and tomorrow still has a notice.',
        },
        {
            id: 'L2',
            name: LABELS.liveDailyDelay,
            itemId: IDS.liveDailyDelay,
            fireAt: l2.getTime(),
            tap: 'Delay 15 min',
            after: 'The row is not checked. A delay notice exists about fifteen minutes later.',
        },
        {
            id: 'L3',
            name: LABELS.liveDailySkip,
            itemId: IDS.liveDailySkip,
            fireAt: l3.getTime(),
            tap: 'Skip',
            after: 'Daily: not checked. No new Log line. The next cycle still has a notice.',
        },
        {
            id: 'L4',
            name: LABELS.liveWeeklyDone,
            itemId: IDS.liveWeeklyDone,
            fireAt: l4.getTime(),
            tap: 'Done',
            after: 'Weekly: that row is checked, and the week log has a line.',
        },
        {
            id: 'L5',
            name: LABELS.liveOneTimeOk,
            itemId: IDS.liveOneTimeOk,
            fireAt: l5.getTime(),
            tap: 'OK',
            after: 'Banner gone. The item is not marked done.',
        },
    ];

    return {
        items,
        queueCases,
        live,
        q14Shifted: q14.shifted,
        q14FireAt: q14.at.getTime(),
        q1At: q1.at,
        q20At: q20,
        q1Hour: q1.hour,
        q1Minute: q1.minute,
    };
}

export function renamedDailyNotice(at: Date): ExpectedNotice {
    return dailyNotice(IDS.dailyBase, LABELS.dailyRenamed, at);
}

export function delayNotice(itemId: string, label: string, at: number): ExpectedNotice {
    return {
        source: 'mydaysnooze',
        itemId,
        part: 'base',
        title: 'Daily Routine',
        body: `Time for ${label}!`,
        label,
        categoryIdentifier: 'routineactions',
        trigger: { kind: 'date', at },
    };
}

export function nextDayNotice(itemId: string, label: string, at: number): ExpectedNotice {
    return {
        source: 'lookaheaddelay',
        itemId,
        part: 'base',
        title: '🔭 Look Ahead',
        body: `Time for ${label}!`,
        label,
        categoryIdentifier: 'lookaheadactions',
        trigger: { kind: 'date', at },
    };
}

export function tomorrowDailyNotice(itemId: string, label: string, hour: number, minute: number, now: Date): ExpectedNotice {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hour, minute, 0, 0);
    return dailyNotice(itemId, label, t);
}

export function buildCeilingItems(): ReminderItem[] {
    const items: ReminderItem[] = [];
    const slots = 56;
    for (let i = 0; i < slots; i++) {
        const minutes = Math.floor((i * 24 * 60) / slots);
        items.push({
            id: `${TEST_PREFIX}ceiling-${String(i + 1).padStart(2, '0')}`,
            kind: 'daily',
            label: `TEST Ceiling ${i + 1}`,
            hour: Math.floor(minutes / 60),
            minute: minutes % 60,
        });
    }
    return items;
}

export function makeNoticeKey(notice: ExpectedNotice): string {
    return makeKey(notice.source, notice.itemId, notice.part);
}
