import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppGroup from './app-group';
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

export type ReminderKind =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly'
    | 'oneTime'
    | 'extended';

// One row on the saved list `reminder_items`. A page is a filter on this
// list rather than a store of its own.
export interface ReminderItem {
    id: string;
    kind: ReminderKind;
    label: string;
    hour?: number;
    minute?: number;
    year?: number;
    month?: number;
    day?: number;
    intervalMonths?: number;
    reminders?: LeadReminder[];
    completed?: boolean;
    doneAt?: number;
    snoozedUntil?: number;
    // Options written from + OPT (#37-new). Dual-write and the engine do
    // not read these yet. Left off means the default: no holiday move,
    // float with the phone, no shading. Notes is a field on New and Edit,
    // not an Options case.
    holidayMove?: 'before' | 'after';
    floatsWithPhone?: boolean;
    dueTimeZoneText?: string;
    shadeCalendar?: boolean;
    notes?: string;
    floatDay?: boolean;
    shiftedChoice?: 'then' | 'next';
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
    afterWeekday?: number;
    afterDayCount?: number;
}

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

function dated(one: { year?: number; month?: number; day?: number }) {
    return typeof one.year === 'number' && typeof one.month === 'number' && typeof one.day === 'number';
}

async function foldOldLists(existing: ReminderItem[]): Promise<ReminderItem[]> {
    const seen = new Set(existing.map((one) => one.id));
    const extra: ReminderItem[] = [];

    if (existing.length === 0) {
        const routineRaw = await AsyncStorage.getItem('my_routine');
        const petsRaw = await AsyncStorage.getItem('pets_feeds');
        const routine: { id: string; label: string; hour?: number | null; minute?: number | null; completed?: boolean; snoozedUntil?: number }[] =
            routineRaw ? JSON.parse(routineRaw) : [];
        const pets: { id: string; label: string; hour?: number | null; minute?: number | null; completed?: boolean; snoozedUntil?: number }[] =
            petsRaw ? JSON.parse(petsRaw) : [];
        for (const one of [...routine, ...pets]) {
            if (seen.has(one.id)) continue;
            seen.add(one.id);
            extra.push({
                id: one.id,
                kind: 'daily',
                label: one.label,
                ...hourMinuteOf(one),
                ...(one.completed ? { completed: true } : {}),
                ...(typeof one.snoozedUntil === 'number' ? { snoozedUntil: one.snoozedUntil } : {}),
            });
        }
    }

    const weekRaw = await AsyncStorage.getItem('week_routine');
    const week: { id: string; label: string; day: number; hour: number; minute: number; completed?: boolean; doneAt?: number; postponedTo?: number }[] =
        weekRaw ? JSON.parse(weekRaw) : [];
    for (const one of week) {
        if (seen.has(one.id)) continue;
        seen.add(one.id);
        extra.push({
            id: one.id,
            kind: 'weekly',
            label: one.label,
            day: one.day,
            hour: one.hour,
            minute: one.minute,
            ...(one.completed ? { completed: true } : {}),
            ...(typeof one.doneAt === 'number' ? { doneAt: one.doneAt } : {}),
            ...(typeof one.postponedTo === 'number' ? { snoozedUntil: one.postponedTo } : {}),
        });
    }

    const lookRaw = await AsyncStorage.getItem('lookahead_items');
    const look: { id: string; label: string; year: number; month: number; day: number; hour: number; minute: number; interval: string; delayedUntil?: number }[] =
        lookRaw ? JSON.parse(lookRaw) : [];
    for (const one of look) {
        if (seen.has(one.id)) continue;
        seen.add(one.id);
        const kind: ReminderKind =
            one.interval === 'yearly' ? 'yearly'
            : one.interval === 'monthly' ? 'monthly'
            : 'quarterly';
        extra.push({
            id: one.id,
            kind,
            label: one.label,
            year: one.year,
            month: one.month,
            day: one.day,
            hour: one.hour,
            minute: one.minute,
            ...(kind === 'quarterly' ? { intervalMonths: one.interval === '6month' ? 6 : 3 } : {}),
            ...(typeof one.delayedUntil === 'number' ? { snoozedUntil: one.delayedUntil } : {}),
        });
    }

    const todoRaw = await AsyncStorage.getItem('todo_tasks');
    const todo: { id: string; title: string; year?: number; month?: number; day?: number; hour?: number; minute?: number; reminders?: LeadReminder[]; completed?: boolean }[] =
        todoRaw ? JSON.parse(todoRaw) : [];
    for (const one of todo) {
        if (seen.has(one.id)) continue;
        seen.add(one.id);
        extra.push({
            id: one.id,
            kind: dated(one) ? 'oneTime' : 'extended',
            label: one.title,
            ...(dated(one) ? { year: one.year, month: one.month, day: one.day } : {}),
            ...hourMinuteOf(one),
            ...(one.reminders ? { reminders: one.reminders } : {}),
            ...(one.completed ? { completed: true } : {}),
        });
    }

    if (extra.length === 0) return existing;
    const merged = [...existing, ...extra];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
}

export async function loadReminderItems(): Promise<ReminderItem[]> {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: ReminderItem[] = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    return foldOldLists(list);
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

    const weekly = items.filter((one) => one.kind === 'weekly');
    await AsyncStorage.setItem('week_routine', JSON.stringify(weekly.map((one) => ({
        id: one.id,
        label: one.label,
        day: one.day ?? 0,
        hour: typeof one.hour === 'number' ? one.hour : 12,
        minute: typeof one.minute === 'number' ? one.minute : 0,
        completed: !!one.completed,
        ...(typeof one.doneAt === 'number' ? { doneAt: one.doneAt } : {}),
        ...(typeof one.snoozedUntil === 'number' ? { postponedTo: one.snoozedUntil } : {}),
    }))));

    const datedRepeats = items.filter((one) =>
        one.kind === 'monthly' || one.kind === 'quarterly' || one.kind === 'yearly'
    );
    await AsyncStorage.setItem('lookahead_items', JSON.stringify(datedRepeats.map((one) => {
        const interval =
            one.kind === 'yearly' ? 'yearly'
            : one.kind === 'monthly' ? 'monthly'
            : one.intervalMonths === 6 ? '6month'
            : '3month';
        return {
            id: one.id,
            label: one.label,
            year: one.year ?? new Date().getFullYear(),
            month: one.month ?? 0,
            day: one.day ?? 1,
            hour: typeof one.hour === 'number' ? one.hour : 12,
            minute: typeof one.minute === 'number' ? one.minute : 0,
            interval,
            ...(typeof one.snoozedUntil === 'number' ? { delayedUntil: one.snoozedUntil } : {}),
        };
    })));

    const oneTime = items.filter((one) => one.kind === 'oneTime');
    const extended = items.filter((one) => one.kind === 'extended');
    const ours = new Set([...oneTime, ...extended].map((one) => one.id));
    const todoRaw = await AsyncStorage.getItem('todo_tasks');
    const existingTodo: Record<string, unknown>[] = todoRaw ? JSON.parse(todoRaw) : [];
    const kept = existingTodo.filter((task) => typeof task.id === 'string' && !ours.has(task.id));
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
            ...hourMinuteOf(one),
            reminders: one.reminders ?? [],
            completed: !!one.completed,
            createdDate,
            notes: '',
        })),
        ...extended.map((one) => ({
            id: one.id,
            title: one.label,
            taskType: 'background',
            ...hourMinuteOf(one),
            reminders: one.reminders ?? [],
            completed: !!one.completed,
            createdDate,
            notes: '',
        })),
    ];
    await AsyncStorage.setItem('todo_tasks', JSON.stringify(merged));

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
        return isTodayDate(item);
    }
    return false;
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
