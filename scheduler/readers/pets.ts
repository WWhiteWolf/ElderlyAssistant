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
}

/**
 * Every reminder the Pets list calls for.
 *
 * One daily repeat for each feed that has a time, and nothing for a feed
 * without one. Whether it has been checked off today makes no difference, for
 * the same reason it makes none in My Day: the next firing is tomorrow, and
 * tomorrow the dog still needs feeding.
 */
export function readPets(items: PetsItem[]): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
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
