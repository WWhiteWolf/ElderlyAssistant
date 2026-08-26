// The block that answers the other question: how far ahead do we arm?
//
// It says how many occurrences of one item stand in the phone's queue at a
// time. The answer is one, for every kind, and the reasoning below is settled
// and is not to be reopened.
//
// Arming two was decided under the old structure. The second occurrence only
// ever bought one day — the day on which the app was never opened at all — and
// Patrick's ruling is that rock solid is for when you use it, an app that is
// not being opened not being an app in use. What the second copy was carrying
// is carried instead by recovery on opening: every run rebuilds the whole set
// from the saved lists, so opening the app after a missed day tells him what he
// missed and arms the next occurrence there and then.
//
// It is written as a function of the trigger kind even though all three answer
// one today. That is where the judgment belongs, and it makes a later change a
// change to one line rather than a hunt through the readers.

import type { TriggerKindCode } from './inputshape.ts';

/**
 * How many occurrences of an item of this kind to arm at once.
 *
 * Not this block's job: trimming to fit the phone's sixty-four places. That
 * lives in the reconcile and stays there, where the whole set can be seen at
 * once. It trims the furthest away first, which is self-healing, because the
 * thing dropped always has the most time left for a run to happen before it
 * matters.
 */
export function armDepthFor(triggerKindCode: TriggerKindCode): number {
    switch (triggerKindCode) {
        // One reminder stands, and opening the app arms the next.
        case 'daily':
            return 1;
        // The same, and a weekly chore costs the one place today that a true
        // weekly repeat costs.
        case 'weekly':
            return 1;
        // There is no second occurrence to arm.
        case 'date':
            return 1;
    }
}
