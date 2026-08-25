// The Pets reader.
//
// Pets Day works exactly as My Day does — a list of items, each with a time of
// day — so this reader is My Day's twin, differing only in the words the
// banner carries. It is kept as its own file because the two screens are their
// own things and either could change without the other.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';
import { OCCURRENCES_AHEAD, dayStamp, nextOccurrences } from './occurrences.ts';

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
