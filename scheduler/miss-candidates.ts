// Which saved items were due on the days that have just rolled over.
//
// Misses are worked out at the day-roll, from the checkmarks still sitting on
// those items. Daily items are due every day, so the old loop could hand the
// whole Daily slice to `missesForRollover`. Weekly, Monthly, Quarterly, Yearly
// and One Time are due only on the day they fall, so the same loop has to pick
// the ones that actually fell. Extended never falls; it has no day.
//
// The last reset day is a locale date string, the same form `isNewDay` already
// compares, and is not parsed. The unprocessed days are walked back from
// yesterday until that string matches, so a stretch away still sees a Monday
// weekly item when Friday is the first open.
//
// Nothing here touches storage or the phone.

import { shownOnDate } from './shown-on-date.ts';
import type { MissableItem } from './health.ts';
import type { ReminderItem } from '../modules/reminder-types.ts';

/**
 * The days whose occurrences have not yet been written as misses.
 *
 * Yesterday is always first. Walking stops when the cursor's locale date is
 * the last reset day, and that day is included: Monday's reset recorded
 * Sunday, so Monday's own items are still waiting.
 */
export function unprocessedDays(savedDate: string, today: Date, maxDays = 366): Date[] {
    const days: Date[] = [];
    const cursor = new Date(today);
    cursor.setHours(12, 0, 0, 0);
    for (let i = 0; i < maxDays; i++) {
        cursor.setDate(cursor.getDate() - 1);
        days.push(new Date(cursor));
        if (cursor.toLocaleDateString() === savedDate) break;
    }
    return days;
}

/** Items that fell on any of those days, other than Extended. */
export function dueOnDays(items: ReminderItem[], days: Date[]): ReminderItem[] {
    return items.filter((item) => {
        if (item.kind === 'extended') return false;
        return days.some((day) => shownOnDate(item, day));
    });
}

export function missableOf(item: ReminderItem): MissableItem {
    return {
        id: item.id,
        label: item.label,
        hour: typeof item.hour === 'number' ? item.hour : null,
        minute: typeof item.minute === 'number' ? item.minute : null,
        completed: !!item.completed,
    };
}

export function missablesDueOnDays(items: ReminderItem[], days: Date[]): MissableItem[] {
    return dueOnDays(items, days).map(missableOf);
}

/**
 * Monthly, Quarterly and Yearly keep a tick until the next occurrence begins.
 *
 * The tick has to survive overnight so the day-roll can still see Done. When
 * that kind of day comes round again, the old tick would hide a new miss, so
 * it comes off at the start of the new occurrence. Weekly's own reset already
 * does this. One Time keeps Done for good. Daily is cleared with the day.
 */
export function clearStartingOccurrenceTicks<T extends ReminderItem>(items: T[], today: Date): T[] {
    return items.map((item) => {
        if (item.kind !== 'monthly' && item.kind !== 'quarterly' && item.kind !== 'yearly') {
            return item;
        }
        if (!item.completed) return item;
        if (!shownOnDate(item, today)) return item;
        const { doneAt: _doneAt, ...rest } = item;
        void _doneAt;
        return { ...rest, completed: false } as T;
    });
}
