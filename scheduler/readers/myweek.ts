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
    // Set when a chore is postponed for this cycle only. It is read here so
    // the field is not forgotten, but nothing is done with it yet — postpones
    // come under the scheduler at a later step, along with snoozes and delays.
    postponedTo?: number;
}

/**
 * Every reminder the chore list calls for.
 *
 * One weekly repeat for each chore, on its own day and at its own time. A
 * weekly repeat is one request that returns of its own accord every week, so
 * there is nothing to re-create and nothing to lose.
 */
export function readMyWeek(chores: Chore[]): WantedReminder[] {
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
    }
    return wanted;
}
