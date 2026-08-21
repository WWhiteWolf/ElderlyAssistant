// The My Day reader.
//
// It is handed the saved routine list and it returns the reminders that list
// calls for. It reads nothing, writes nothing, and knows nothing about the
// phone — so Node can check it in a fraction of a second.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';

/** One My Day item, exactly as it is saved under `my_routine`. */
export interface MyDayItem {
    id: string;
    label: string;
    // A time of null means no time was set. Older saved items may have no
    // hour or minute at all, which counts as the same thing.
    hour: number | null;
    minute: number | null;
    completed: boolean;
}

/**
 * Every reminder the My Day list calls for.
 *
 * One daily repeat for each item that has a time, and nothing at all for an
 * item without one.
 *
 * Whether the item is checked off makes no difference. A daily reminder's next
 * firing is tomorrow, and tomorrow the item needs doing again — so checking
 * something off today has nothing to say about it. This is the rule that My
 * Week has always followed and the two daily screens never did, and it is the
 * fault at the centre of the silence.
 */
export function readMyDay(items: MyDayItem[]): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
        if (item.hour == null || item.minute == null) continue;
        wanted.push({
            key: makeKey('myday', item.id, 'base'),
            source: 'myday',
            itemId: item.id,
            label: item.label,
            title: 'Daily Routine',
            body: `Time for ${item.label}!`,
            categoryIdentifier: 'routineactions',
            trigger: { kind: 'daily', hour: item.hour, minute: item.minute },
        });
    }
    return wanted;
}
