import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppGroup from './app-group';
import { runDailyReset, runScheduler, runWeeklyReset } from '../scheduler/scheduler';
import { warnIfFull } from '../scheduler/warn';
import { translateReminderItems } from '../scheduler/translators/translate';
import { baseMoment, shadedDaysInMonth } from '../scheduler/leadmoments';
import type { ReminderItem, ReminderKind } from './reminder-types';

export type { LeadReminder, ReminderItem, ReminderKind } from './reminder-types';

const STORAGE_KEY = 'reminder_items';

export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FROM_PAGE: Record<Exclude<ReminderKind, 'daily' | 'extended'>, string> = {
    weekly: 'from Weekly',
    monthly: 'from Monthly',
    quarterly: 'from Quarterly',
    yearly: 'from Yearly',
    oneTime: 'from One Time',
};

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export function hourMinuteOf(saved: { hour?: number | null; minute?: number | null }): { hour?: number; minute?: number } {
    if (typeof saved.hour === 'number' && typeof saved.minute === 'number') {
        return { hour: saved.hour, minute: saved.minute };
    }
    return {};
}

/** True when this item has a reminder that can fire, so Snooze can mean something. */
export function hasReminderSet(item: ReminderItem): boolean {
    if (item.kind === 'oneTime') {
        return (item.reminders?.length ?? 0) > 0;
    }
    const shaped = translateReminderItems([item], Date.now())[0];
    return !!shaped?.hasDueTimeBit;
}

// Roll a dated repeat forward to its next occurrence that lands in the
// future, copying Look Ahead's advanceItem, including clamping to the last
// day of a shorter month.
export function advanceDatedItem(item: ReminderItem): ReminderItem {
    const step =
        item.kind === 'yearly' ? 12
        : item.kind === 'monthly' ? 1
        : (item.intervalMonths ?? 3);
    const hour = typeof item.hour === 'number' ? item.hour : 12;
    const minute = typeof item.minute === 'number' ? item.minute : 0;
    const anchorDay = typeof item.day === 'number' ? item.day : 1;
    let d = new Date(
        typeof item.year === 'number' ? item.year : new Date().getFullYear(),
        typeof item.month === 'number' ? item.month : 0,
        anchorDay,
        hour,
        minute,
        0,
        0,
    );
    const now = new Date();
    do {
        const tmi = d.getMonth() + step;
        const y = d.getFullYear() + Math.floor(tmi / 12);
        const m = ((tmi % 12) + 12) % 12;
        d = new Date(y, m, Math.min(anchorDay, daysInMonth(y, m)), hour, minute, 0, 0);
    } while (d <= now);
    const { snoozedUntil, ...rest } = item;
    void snoozedUntil;
    return { ...rest, year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
}

// Roll the day and the week first, then read. A page that draws this list
// otherwise keeps yesterday's checkmarks until it happens to load again.
export async function loadReminderItems(): Promise<ReminderItem[]> {
    await runDailyReset();
    await runWeeklyReset();
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: ReminderItem[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
}

// Write the one list and run the scheduler. Siri's voice list is the daily
// items on this same list.
export async function saveReminderItems(items: ReminderItem[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    const daily = items.filter((one) => one.kind === 'daily');
    AppGroup.setMyDayItems(daily.map((one) => ({ id: one.id, label: one.label })));
    warnIfFull(await runScheduler());
}

export function isTodayDate(item: ReminderItem) {
    if (typeof item.year !== 'number' || typeof item.month !== 'number' || typeof item.day !== 'number') {
        return false;
    }
    const now = new Date();
    return item.year === now.getFullYear() && item.month === now.getMonth() && item.day === now.getDate();
}

export function shownOnDaily(item: ReminderItem) {
    if (item.kind === 'daily') return true;
    if (item.kind === 'weekly') return item.day === new Date().getDay();
    if (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly' || item.kind === 'oneTime') {
        if (isTodayDate(item)) return true;
        if (item.kind === 'oneTime') return false;
        const shaped = translateReminderItems([item], Date.now())[0];
        if (!shaped) return false;
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const base = baseMoment(shaped, start.getTime() - 1);
        if (base === null) return false;
        const when = new Date(base.moment);
        const now = new Date();
        return when.getFullYear() === now.getFullYear()
            && when.getMonth() === now.getMonth()
            && when.getDate() === now.getDate();
    }
    return false;
}

/** The days this item falls on in the month, from the engine's own calendar. */
export function shadedDaysForItem(item: ReminderItem, year: number, month: number): number[] {
    const shaped = translateReminderItems([item], Date.now())[0];
    if (!shaped) return [];
    return shadedDaysInMonth(shaped, year, month);
}

const DAILY_KIND_RANK: Record<ReminderKind, number> = {
    daily: 0,
    weekly: 1,
    monthly: 2,
    quarterly: 3,
    yearly: 4,
    oneTime: 5,
    extended: 6,
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
    if (
        (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly')
        && typeof item.weekdayOrdinal === 'number'
        && typeof item.ordinalWeekday === 'number'
    ) {
        const ordinal =
            item.weekdayOrdinal === -1 ? 'Last'
            : item.weekdayOrdinal === 1 ? '1st'
            : item.weekdayOrdinal === 2 ? '2nd'
            : item.weekdayOrdinal === 3 ? '3rd'
            : item.weekdayOrdinal === 4 ? '4th'
            : String(item.weekdayOrdinal);
        const day = DAY_NAMES[item.ordinalWeekday] ?? '';
        return time ? `${ordinal} ${day} · ${time}` : `${ordinal} ${day}`;
    }
    if (
        (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly')
        && typeof item.afterWeekday === 'number'
    ) {
        const day = DAY_NAMES[item.afterWeekday] ?? '';
        const after = typeof item.afterDayCount === 'number' ? item.afterDayCount : 6;
        return time ? `${day} after ${after} · ${time}` : `${day} after ${after}`;
    }
    if (
        (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly' || item.kind === 'oneTime')
        && typeof item.month === 'number'
        && typeof item.day === 'number'
        && typeof item.year === 'number'
    ) {
        const date = `${MONTH_NAMES[item.month]} ${item.day}, ${item.year}`;
        return time ? `${date} · ${time}` : date;
    }
    return time;
}

export function snoozeLineOf(item: ReminderItem): string | null {
    if (item.snoozedUntil == null || item.snoozedUntil <= Date.now()) return null;
    const when = new Date(item.snoozedUntil);
    return `Snoozed till: ${format12Hour(when.getHours(), when.getMinutes())}`;
}
