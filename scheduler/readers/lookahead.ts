// The Look Ahead reader.
//
// Look Ahead holds the long-lead things — the ones due in a month or a year.
// Each one wants a single reminder at its own date and time, and only while
// that moment is still ahead.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';

/** One Look Ahead entry, exactly as it is saved under `lookahead_items`. */
export interface LookAheadItem {
    id: string;
    label: string;
    year: number;
    month: number; // January is 0, as the phone counts months.
    day: number;
    hour: number;
    minute: number;
    // Set when a reminder has been delayed by a day, a week or a month. It is
    // named here so the field is not forgotten, but nothing is done with it
    // yet — delays come under the scheduler at a later step.
    delayedUntil?: number;
}

/**
 * Every reminder the Look Ahead list calls for.
 *
 * One reminder for each entry whose date and time are still in the future.
 * An entry whose moment has already passed wants nothing: it has either been
 * dealt with, or it is waiting on the screen to be dealt with, and a reminder
 * for a moment that is gone cannot be acted on.
 *
 * `now` is handed in rather than read from the clock, so a test can say what
 * time it is.
 */
export function readLookAhead(items: LookAheadItem[], now: number): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
        if (item.year == null || item.month == null || item.day == null) continue;
        const due = new Date(item.year, item.month, item.day, item.hour ?? 0, item.minute ?? 0, 0, 0);
        if (due.getTime() <= now) continue;
        wanted.push({
            key: makeKey('lookahead', item.id, 'base'),
            source: 'lookahead',
            itemId: item.id,
            label: item.label,
            title: '🔭 Look Ahead',
            body: `Time for ${item.label}!`,
            categoryIdentifier: 'lookaheadactions',
            trigger: { kind: 'date', at: due.getTime() },
        });
    }
    return wanted;
}
