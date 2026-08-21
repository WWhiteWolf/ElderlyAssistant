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
 * Every reminder the Pets list calls for.
 *
 * One daily repeat for each feed that has a time, and nothing for a feed
 * without one. Whether it has been checked off today makes no difference, for
 * the same reason it makes none in My Day: the next firing is tomorrow, and
 * tomorrow the dog still needs feeding.
 *
 * A snoozed feed wants a second reminder on top of that one, at the moment it
 * was pushed to, and the daily repeat is left alone.
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
        wanted.push({
            key: makeKey('pets', item.id, 'base'),
            source: 'pets',
            itemId: item.id,
            label: item.label,
            title: 'Pets Routine',
            body: `Time for ${item.label}!`,
            categoryIdentifier: 'routineactions',
            trigger: { kind: 'daily', hour: item.hour, minute: item.minute },
        });
    }
    return wanted;
}
