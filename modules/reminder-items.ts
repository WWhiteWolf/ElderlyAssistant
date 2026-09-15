import { PAGE_LABELS } from '../constants/page-names';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppGroup from './app-group';
import { runDailyReset, runScheduler, runWeeklyReset } from '../scheduler/scheduler';
import { lastOccurrence } from '../scheduler/weeklyreset';
import { pushBackChoicesOf } from '../scheduler/banneractions';
import { warnIfFull } from '../scheduler/warn';
import {
    quarterlyStepCodeOf,
    quarterlyStepDaysOf,
} from '../scheduler/inputshape';
import {
    translateReminderItems,
    doneActionCodeOf,
    exclusiveGroupBitsOf,
    itemNameOf,
    keepsBirthYearOf,
    usesWeeklyCycleStampOf,
} from '../scheduler/translators/translate';
export { doneActionCodeOf, exclusiveGroupBitsOf, itemNameOf, keepsBirthYearOf };
import { shadedDaysInMonth } from '../scheduler/leadmoments';
import { isDateOf, shownOnDate } from '../scheduler/shown-on-date';
import type { ReminderItem, ReminderKind } from './reminder-types';
import { advanceDatedItem } from './advance-dated-item';
import {
    changeSavedReminderItems,
    readSavedReminderItems,
} from './reminder-list-storage';
export { advanceDatedItem };

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export type { LeadReminder, ReminderItem, ReminderKind } from './reminder-types';
export {
    quarterlyStepCodeOf,
    quarterlyStepDaysOf,
    QUARTERLY_STEP_CHIPS,
} from '../scheduler/inputshape';
export type { QuarterlyStepCode } from '../scheduler/inputshape';

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FROM_PAGE: Record<Exclude<ReminderKind, 'daily' | 'oneTime' | 'bucketlist'>, string> = {
    weekly: `from ${PAGE_LABELS.weekly}`,
    monthly: `from ${PAGE_LABELS.monthly}`,
    quarterly: `from ${PAGE_LABELS.quarterly}`,
    yearly: `from ${PAGE_LABELS.yearly}`,
    appointments: `from ${PAGE_LABELS.appointments}`,
    birthdays: `from ${PAGE_LABELS.birthdays}`,
};

export function hourMinuteOf(saved: { hour?: number | null; minute?: number | null }): { hour?: number; minute?: number } {
    if (typeof saved.hour === 'number' && typeof saved.minute === 'number') {
        return { hour: saved.hour, minute: saved.minute };
    }
    return {};
}

/** True when Snooze would mean something the engine will honour. */
export function hasReminderSet(item: ReminderItem): boolean {
    const shaped = translateReminderItems([item], Date.now())[0];
    return !!shaped?.canBePushedBackBit && !!shaped.hasDueTimeBit;
}

export type SnoozeChoice = {
    label: string;
    stampAt: (now: number) => number;
};

/** Snooze distances from the banner set the table already gave this item. */
export function snoozeChoicesOf(item: ReminderItem): SnoozeChoice[] {
    const shaped = translateReminderItems([item], Date.now())[0];
    if (!shaped?.bannerButtonsCode) return [];
    return pushBackChoicesOf(shaped.bannerButtonsCode, item).map((choice) => ({
        label: choice.buttonTitle,
        stampAt: choice.stampAt,
    }));
}

/** The due moment of this cycle, which Skip stamps so the engine arms the next. */
export function thisCycleDueStamp(item: ReminderItem, now: number = Date.now()): number | undefined {
    const shaped = translateReminderItems([item], now)[0];
    if (!shaped?.repeatUnitCode) return undefined;
    if (shaped.repeatUnitCode === 'day') {
        if (typeof shaped.dueHour !== 'number' || typeof shaped.dueMinute !== 'number') return undefined;
        const due = new Date(now);
        due.setHours(shaped.dueHour, shaped.dueMinute, 0, 0);
        return due.getTime();
    }
    if (shaped.repeatUnitCode === 'week') {
        const weekday = shaped.repeatWeekdayList?.[0]?.weekdayNumber;
        if (
            typeof weekday !== 'number'
            || typeof shaped.dueHour !== 'number'
            || typeof shaped.dueMinute !== 'number'
        ) {
            return undefined;
        }
        return lastOccurrence(weekday, shaped.dueHour, shaped.dueMinute, now);
    }
    if (typeof shaped.dueMoment === 'number') return shaped.dueMoment;
    return undefined;
}

// Roll the day and the week first, then read. A page that draws this list
// otherwise keeps yesterday's checkmarks until it happens to load again.
export async function loadReminderItems(): Promise<ReminderItem[]> {
    await runDailyReset();
    await runWeeklyReset();
    const saved = await readSavedReminderItems();
    return saved.failed ? [] : saved.items;
}

// Publish the app-facing side effects after the physical list transaction has
// released its queue. Siri's voice list is the daily items on this same list.
async function publishReminderItems(items: ReminderItem[]): Promise<void> {
    const daily = items.filter((one) => one.kind === 'daily');
    AppGroup.setDailyItems(daily.map((one) => ({ id: one.id, label: one.label })));
    warnIfFull(await runScheduler());
}

// One app-facing door for every change. Finish any rollover first, apply the
// patch to the latest list inside the neutral storage queue, release that
// queue, and only then publish Daily names and run the scheduler.
export async function applyReminderChange(
    patch: (items: ReminderItem[]) => ReminderItem[],
): Promise<ReminderItem[]> {
    await runDailyReset();
    await runWeeklyReset();
    const next = await changeSavedReminderItems(patch);
    await publishReminderItems(next);
    return next;
}

// Which log this kind writes. One Time uses Daily's key.
export function historyKeyFor(kind: ReminderKind): string | null {
    if (kind === 'daily' || kind === 'oneTime') return 'daily_history';
    if (kind === 'weekly') return 'weekly_history';
    if (kind === 'monthly') return 'monthly_history';
    if (kind === 'quarterly') return 'quarterly_history';
    if (kind === 'yearly') return 'yearly_history';
    if (kind === 'appointments') return 'appointments_history';
    if (kind === 'birthdays') return 'birthdays_history';
    if (kind === 'bucketlist') return 'bucket_list_history';
    return null;
}

interface HistoryEntry {
    id: string;
    date: string;
    sched: string;
    actual: string;
    what?: string;
    note?: string;
}

// One Done line on this log. The caller passes the clock time so a page
// can write now and a banner can write the fire time. Cap 50. The label
// is the line's sched, as the list already writes it.
export async function writeHistoryEntry(
    historyKey: string,
    clockTime: string,
    sched: string,
): Promise<void> {
    const saved = await AsyncStorage.getItem(historyKey);
    const existing: HistoryEntry[] = saved ? JSON.parse(saved) : [];
    const entry: HistoryEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
        sched,
        actual: clockTime,
        what: '',
        note: '',
    };
    await AsyncStorage.setItem(historyKey, JSON.stringify([entry, ...existing].slice(0, 50)));
}

// Mark this item done the way the list already does, and write the log.
// The history key is the caller's, so Daily still logs a visitor on Daily.
// If the item lives on another page, that page's log is written as well.
export async function markReminderDone(
    id: string,
    historyKey: string | null,
    clockTime: string,
): Promise<void> {
    const items = await loadReminderItems();
    const item = items.find((one) => one.id === id);
    if (!item) return;
    if (historyKey) {
        await writeHistoryEntry(historyKey, clockTime, item.label);
    }
    const ownKey = historyKeyFor(item.kind);
    if (ownKey && ownKey !== historyKey) {
        await writeHistoryEntry(ownKey, clockTime, item.label);
    }
    await applyReminderChange((list) => list.map((one) => {
        if (one.id !== id) return one;
        const doneActionCode = doneActionCodeOf(one.kind);
        if (doneActionCode === 'advanceDate') {
            const prior =
                typeof one.year === 'number'
                && typeof one.month === 'number'
                && typeof one.day === 'number'
                    ? { priorYear: one.year, priorMonth: one.month, priorDay: one.day }
                    : {};
            return { ...advanceDatedItem({ ...one, ...prior }), completed: true };
        }
        const { snoozedUntil, ...rest } = one;
        if (usesWeeklyCycleStampOf(one.kind)) {
            return { ...rest, completed: true, doneAt: Date.now() };
        }
        return { ...rest, completed: true };
    }));
}

export function isTodayDate(item: ReminderItem) {
    return isDateOf(item, new Date());
}

export function shownOnDaily(item: ReminderItem) {
    return shownOnDate(item, new Date());
}

/** The days this item falls on in the month, from the engine's own calendar. */
export function shadedDaysForItem(item: ReminderItem, year: number, month: number): number[] {
    const shaped = translateReminderItems([item], Date.now())[0];
    if (!shaped) return [];
    return shadedDaysInMonth(shaped, year, month);
}

const DAILY_KIND_RANK: Record<ReminderKind, number> = {
    daily: 0,
    oneTime: 1,
    weekly: 2,
    monthly: 3,
    quarterly: 4,
    yearly: 5,
    appointments: 6,
    birthdays: 7,
    bucketlist: 8,
};

export function sortDailyVisible(items: ReminderItem[]): ReminderItem[] {
    return items
        .filter(shownOnDaily)
        .slice()
        .sort((a, b) => DAILY_KIND_RANK[a.kind] - DAILY_KIND_RANK[b.kind]);
}

export function placeKind(
    items: ReminderItem[],
    kind: ReminderKind,
    nextVisible: ReminderItem[],
): ReminderItem[] {
    let i = 0;
    return items.map((item) => (item.kind === kind ? nextVisible[i++] : item));
}

export function dragKindTo(
    items: ReminderItem[],
    kind: ReminderKind,
    fromId: string,
    toIndex: number,
): ReminderItem[] {
    const vis = items.filter((one) => one.kind === kind);
    const from = vis.findIndex((one) => one.id === fromId);
    if (from < 0 || toIndex < 0 || toIndex >= vis.length || from === toIndex) return items;
    const next = [...vis];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    return placeKind(items, kind, next);
}

export function placeVisible(
    items: ReminderItem[],
    nextVisible: ReminderItem[],
): ReminderItem[] {
    let i = 0;
    return items.map((item) => (shownOnDaily(item) ? nextVisible[i++] : item));
}

export function dragVisibleTo(
    items: ReminderItem[],
    fromId: string,
    toIndex: number,
): ReminderItem[] {
    const vis = sortDailyVisible(items);
    const from = vis.findIndex((one) => one.id === fromId);
    if (from < 0 || toIndex < 0 || toIndex >= vis.length || from === toIndex) return items;
    const next = [...vis];
    const [moved] = next.splice(from, 1);
    next.splice(toIndex, 0, moved);
    return placeVisible(items, next);
}

export function format12Hour(h: number, m: number) {
    const period = h < 12 ? 'AM' : 'PM';
    let hr = h % 12;
    if (hr === 0) hr = 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatItemWhen(item: ReminderItem): string {
    const time =
        typeof item.hour === 'number' && typeof item.minute === 'number'
            ? format12Hour(item.hour, item.minute)
            : '';
    if (item.kind === 'weekly' && typeof item.day === 'number') {
        return time ? `${DAY_NAMES[item.day]} ${time}` : DAY_NAMES[item.day];
    }
    const shaped = translateReminderItems([item], Date.now())[0];
    const weekday = shaped?.repeatWeekdayList?.[0];
    if (
        (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly')
        && weekday
        && typeof weekday.weekdayOrdinalCount === 'number'
    ) {
        const ordinal =
            weekday.weekdayOrdinalCount === -1 ? 'Last'
            : weekday.weekdayOrdinalCount === 1 ? '1st'
            : weekday.weekdayOrdinalCount === 2 ? '2nd'
            : weekday.weekdayOrdinalCount === 3 ? '3rd'
            : weekday.weekdayOrdinalCount === 4 ? '4th'
            : String(weekday.weekdayOrdinalCount);
        const day = DAY_NAMES[weekday.weekdayNumber] ?? '';
        return time ? `${ordinal} ${day} · ${time}` : `${ordinal} ${day}`;
    }
    if (
        (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly')
        && weekday
        && typeof shaped.repeatAfterDayCount === 'number'
    ) {
        const day = DAY_NAMES[weekday.weekdayNumber] ?? '';
        const after = shaped.repeatAfterDayCount;
        return time ? `${day} after ${after} · ${time}` : `${day} after ${after}`;
    }
    if (
        (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly' || item.kind === 'appointments' || item.kind === 'birthdays' || item.kind === 'oneTime')
        && typeof item.month === 'number'
        && typeof item.day === 'number'
        && typeof item.year === 'number'
    ) {
        const shownDay = Math.min(item.day, daysInMonth(item.year, item.month));
        const date = `${MONTH_NAMES[item.month]} ${shownDay}, ${item.year}`;
        return time ? `${date} · ${time}` : date;
    }
    return time;
}

export function snoozeLineOf(item: ReminderItem): string | null {
    const shaped = translateReminderItems([item], Date.now())[0];
    if (!shaped?.canBePushedBackBit) return null;
    if (item.snoozedUntil == null || item.snoozedUntil <= Date.now()) return null;
    const when = new Date(item.snoozedUntil);
    const time = format12Hour(when.getHours(), when.getMinutes());
    const now = new Date();
    const sameDay =
        when.getFullYear() === now.getFullYear()
        && when.getMonth() === now.getMonth()
        && when.getDate() === now.getDate();
    if (sameDay) return `Snoozed till: ${time}`;
    const day = `${DAY_NAMES[when.getDay()]} ${MONTH_NAMES[when.getMonth()]} ${when.getDate()}`;
    const withYear = when.getFullYear() === now.getFullYear()
        ? day
        : `${day}, ${when.getFullYear()}`;
    return `Snoozed till: ${withYear} · ${time}`;
}
