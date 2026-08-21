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
    // The moment a delayed reminder is to arrive instead, held as an ordinary
    // count of milliseconds. It is written down when the delay is made — by the
    // page's own button or by the banner's — and this reader turns it back into
    // the reminder, so a delay that went missing comes back like everything
    // else.
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
 * A delayed entry wants a second reminder at the moment it was pushed to. The
 * entry's own date is not touched by a delay, so the two are independent: an
 * entry can want both, or the delay alone once its own moment has gone by.
 *
 * `now` is handed in rather than read from the clock, so a test can say what
 * time it is.
 */
export function readLookAhead(items: LookAheadItem[], now: number): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
        if (item.year == null || item.month == null || item.day == null) continue;
        const due = new Date(item.year, item.month, item.day, item.hour ?? 0, item.minute ?? 0, 0, 0);
        if (due.getTime() > now) {
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
        // A delay whose moment has already gone wants nothing, and the page
        // drops the stamp when it next reads the list.
        if (item.delayedUntil != null && item.delayedUntil > now) {
            wanted.push({
                key: makeKey('lookaheaddelay', item.id, 'base'),
                source: 'lookaheaddelay',
                itemId: item.id,
                label: item.label,
                title: '🔭 Look Ahead',
                body: `Time for ${item.label}!`,
                categoryIdentifier: 'lookaheadactions',
                trigger: { kind: 'date', at: item.delayedUntil },
            });
        }
    }
    return wanted;
}
