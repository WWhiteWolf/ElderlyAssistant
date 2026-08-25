// The My Day reader.
//
// It is handed the saved routine list and it returns the reminders that list
// calls for. It reads nothing, writes nothing, and knows nothing about the
// phone — so Node can check it in a fraction of a second.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';
import { OCCURRENCES_AHEAD, dayStamp, nextOccurrences } from './occurrences.ts';

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
 * An item with a time gets its next few occurrences as single moments, each
 * under a name of its own; an item without a time gets nothing.
 *
 * An item ticked off gets no reminder for today and keeps the ones after it,
 * which is the change. It used to get one alarm repeating daily, armed whether
 * or not the item was done, because a repeating alarm cannot be told to skip a
 * day — and so a thing already seen to still called out. A tick says what
 * happened today and nothing about tomorrow, when the item needs doing again.
 *
 * A snoozed item wants a reminder on top of those, at the moment it was pushed
 * to. The occurrences are left alone: a snooze moves today's reminder and says
 * nothing about the days after it.
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
                key: makeKey('myday', item.id, dayStamp(at)),
                source: 'myday',
                itemId: item.id,
                label: item.label,
                title: 'Daily Routine',
                body: `Time for ${item.label}!`,
                categoryIdentifier: 'routineactions',
                trigger: { kind: 'date', at },
            });
        }
    }
    return wanted;
}
