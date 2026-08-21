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
    // The moment a snoozed item is to be reminded about again, held as an
    // ordinary count of milliseconds. It is written down when the snooze is
    // made — by the page's own button or by the banner's — and this reader
    // turns it back into the reminder, so a snooze that went missing comes
    // back like everything else. One stamp per item, so snoozing twice moves
    // the one reminder rather than leaving two behind.
    snoozedUntil?: number;
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
 *
 * A snoozed item wants a second reminder on top of that one, at the moment it
 * was pushed to. The daily repeat is deliberately left alone: a snooze moves
 * today's reminder and says nothing about tomorrow's.
 *
 * `now` is handed in rather than read from the clock, so a test can say what
 * time it is.
 */
export function readMyDay(items: MyDayItem[], now: number): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
        // A snooze stands on its own. An item whose time was cleared after it
        // was snoozed still owes the reminder it promised, so this comes first
        // and does not depend on the item having a time of day at all.
        if (item.snoozedUntil != null && item.snoozedUntil > now) {
            wanted.push({
                key: makeKey('mydaysnooze', item.id, 'base'),
                source: 'mydaysnooze',
                itemId: item.id,
                label: item.label,
                title: 'Daily Routine',
                body: `Time for ${item.label}!`,
                categoryIdentifier: 'routineactions',
                trigger: { kind: 'date', at: item.snoozedUntil },
            });
        }
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
