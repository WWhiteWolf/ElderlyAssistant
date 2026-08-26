// The My Week reader.
//
// My Week is the one screen that never had the fault: it arms every chore
// whether or not the chore has been ticked. This reader keeps that behaviour
// exactly, which is why it is also the shape the two daily screens are being
// brought round to.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';

/** One chore, exactly as it is saved under `week_routine`. */
export interface Chore {
    id: string;
    label: string;
    // The day of the week the chore belongs to, counting Sunday as 0 through
    // to Saturday as 6. The phone counts from one instead, so the reader adds
    // one when it builds the trigger.
    day: number;
    hour: number;
    minute: number;
    completed: boolean;
    // The moment a postponed chore is to be reminded about instead, held as an
    // ordinary count of milliseconds. It is written down when the postpone is
    // made — by the page's Postpone button or by a Delay tapped on the chore's
    // banner — and this reader turns it back into the reminder, so a postpone
    // that went missing comes back like everything else.
    //
    // The banner's Delay writes this field rather than one of its own
    // (#20-new). A delay and a postpone are the same thing at different
    // distances: one moment in the future for this occurrence only, leaving the
    // weekly repeat alone. One stamp per chore means the module moves the one
    // reminder rather than leaving a second behind.
    postponedTo?: number;
}

/**
 * Every reminder the chore list calls for.
 *
 * One weekly repeat for each chore, on its own day and at its own time. A
 * weekly repeat is one request that returns of its own accord every week, so
 * there is nothing to re-create and nothing to lose.
 *
 * A postponed chore wants a second reminder on top of that one, at the moment
 * it was pushed to. The weekly repeat is deliberately left alone: a postpone
 * moves this week's reminder and says nothing about the ones after it.
 *
 * `now` is handed in rather than read from the clock, so a test can say what
 * time it is.
 */
export function readMyWeek(chores: Chore[], now: number): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const chore of chores) {
        if (chore.day == null || chore.hour == null || chore.minute == null) continue;
        wanted.push({
            key: makeKey('myweek', chore.id, 'base'),
            source: 'myweek',
            itemId: chore.id,
            label: chore.label,
            title: 'Weekly Chore',
            body: `Time for ${chore.label}!`,
            categoryIdentifier: 'routineactions',
            trigger: {
                kind: 'weekly',
                weekday: chore.day + 1,
                hour: chore.hour,
                minute: chore.minute,
            },
        });
        // A postpone whose moment has already gone wants nothing. It cannot be
        // acted on, and the page drops the stamp when the chore's own day comes
        // round again.
        if (chore.postponedTo != null && chore.postponedTo > now) {
            wanted.push({
                key: makeKey('myweekpostpone', chore.id, 'base'),
                source: 'myweekpostpone',
                itemId: chore.id,
                label: chore.label,
                title: 'Weekly Chore',
                body: `Time for ${chore.label}!`,
                categoryIdentifier: 'routineactions',
                trigger: { kind: 'date', at: chore.postponedTo },
            });
        }
    }
    return wanted;
}
