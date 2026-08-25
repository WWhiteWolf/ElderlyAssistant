// The Pets reader.
//
// Pets Day works exactly as My Day does — a list of items, each with a time of
// day — so this reader is My Day's twin, differing only in the words the
// banner carries. It is kept as its own file because the two screens are their
// own things and either could change without the other.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';

/** One feed, exactly as it is saved under `pets_feeds`. */
export interface PetsItem {
    id: string;
    label: string;
    // A time of null means no time was set, and an older saved item may have
    // no hour or minute field at all, which counts as the same thing.
    hour: number | null;
    minute: number | null;
    completed: boolean;
    // The moment a snoozed feed is to be reminded about again, held as an
    // ordinary count of milliseconds and written down when the snooze is made.
    // My Day's twin in this as in everything else.
    snoozedUntil?: number;
}

/**
 * How many occurrences of each feed are armed at a time.
 *
 * A repeating alarm is one request that returns forever, and it costs one of
 * the phone's sixty-four places. A single moment is spent the instant it fires,
 * so several have to be standing ready — one for each of the next few days.
 *
 * Two is Patrick's number, and it is two occurrences rather than two days, so
 * a thing that comes round weekly gets a fortnight rather than nothing at all.
 * He first said three and settled on two once the arithmetic was in front of
 * him: fourteen items three deep take forty-two of the fifty-six places the
 * module has to spend, and two deep take twenty-eight. What covers the rest is
 * the missed-firing notice — a stretch away longer than two occurrences is
 * told rather than armed for, which was his condition on the whole move.
 *
 * It lives here while Pets is the only screen moved across. When My Day and My
 * Week follow it belongs somewhere all three can see it.
 */
export const OCCURRENCES_AHEAD = 2;

/** True when two moments fall on the same calendar day. */
function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

/**
 * The day a moment falls on, written as 20260826.
 *
 * This is what names one occurrence apart from the others. It is deliberately
 * the day itself rather than the occurrence's place in the run: a name like
 * "the first of the next three" means a different day tomorrow than it does
 * today, so every run would find every name pointing somewhere new and take
 * all three down and put all three back. Named by its own day, an occurrence
 * keeps its name until it fires, and the reconcile leaves it alone.
 *
 * It is built out of the date's own parts rather than from a written-out date,
 * because a written-out one comes in the phone's own locale.
 */
function dayStamp(at: number): string {
    const when = new Date(at);
    const month = String(when.getMonth() + 1).padStart(2, '0');
    const day = String(when.getDate()).padStart(2, '0');
    return `${when.getFullYear()}${month}${day}`;
}

/**
 * The next few moments a feed's time of day comes round, counting from `now`.
 *
 * The day is stepped a day at a time rather than by adding twenty-four hours,
 * so a feed keeps its time of day across the clocks going forward or back.
 *
 * `completed` is what makes this different from simply listing the next three
 * days. A feed ticked off is done for TODAY and today only — the daily reset
 * clears the tick as the day turns — so today's own occurrence is dropped and
 * the count starts at tomorrow's. An occurrence on any later day is never
 * dropped, because a tick has nothing to say about tomorrow.
 */
function nextOccurrences(
    hour: number,
    minute: number,
    now: number,
    completed: boolean,
    count: number,
): number[] {
    const today = new Date(now);
    const when = new Date(now);
    when.setHours(hour, minute, 0, 0);

    // Today's has already gone by, so the first one still to come is
    // tomorrow's.
    if (when.getTime() <= now) when.setDate(when.getDate() + 1);

    // Ticked off today, and today's moment has not yet arrived: that is the
    // reminder that must not fire. It is the whole of the fault Patrick
    // reported — a thing already done reminding him to do it.
    if (completed && sameDay(when, today)) when.setDate(when.getDate() + 1);

    const moments: number[] = [];
    for (let i = 0; i < count; i++) {
        moments.push(when.getTime());
        when.setDate(when.getDate() + 1);
    }
    return moments;
}

/**
 * Every reminder the Pets list calls for.
 *
 * A feed with a time gets its next few occurrences as single moments, each
 * under a name of its own; a feed without a time gets nothing.
 *
 * A feed ticked off gets no reminder for today and keeps the ones after it,
 * which is the change. It used to get one alarm repeating daily, armed whether
 * or not the feed was done, because a repeating alarm cannot be told to skip a
 * day — and so a feed already seen to still called out.
 *
 * A snoozed feed wants a reminder on top of those, at the moment it was pushed
 * to. The occurrences are left alone: a snooze moves today's reminder and says
 * nothing about the days after it.
 *
 * `now` is handed in rather than read from the clock, so a test can say what
 * time it is.
 */
export function readPets(items: PetsItem[], now: number): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
        // A snooze stands on its own, so it does not depend on the feed still
        // having a time of day.
        if (item.snoozedUntil != null && item.snoozedUntil > now) {
            wanted.push({
                key: makeKey('petssnooze', item.id, 'base'),
                source: 'petssnooze',
                itemId: item.id,
                label: item.label,
                title: 'Pets Routine',
                body: `Time for ${item.label}!`,
                categoryIdentifier: 'routineactions',
                trigger: { kind: 'date', at: item.snoozedUntil },
            });
        }
        if (item.hour == null || item.minute == null) continue;

        const moments = nextOccurrences(
            item.hour,
            item.minute,
            now,
            item.completed,
            OCCURRENCES_AHEAD,
        );
        for (const at of moments) {
            wanted.push({
                // Each occurrence is named for the day it falls on, so it keeps
                // its name from one run to the next and the reconcile leaves it
                // where it is. One that has fired simply stops being asked for.
                key: makeKey('pets', item.id, dayStamp(at)),
                source: 'pets',
                itemId: item.id,
                label: item.label,
                title: 'Pets Routine',
                body: `Time for ${item.label}!`,
                categoryIdentifier: 'routineactions',
                trigger: { kind: 'date', at },
            });
        }
    }
    return wanted;
}
