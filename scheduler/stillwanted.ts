// The block that answers one question: is this still wanted?
//
// Every returning arrow lands here. Done, pushed back and skipped all come back
// from the far end of the app and change what a shaped item should produce, and
// today each of the five readers answers that its own way. This is the one
// place it is answered instead.
//
// It decides nothing about how many reminders to arm, nothing about what the
// banner says, and nothing about fitting inside the phone's sixty-four places.
// It only says whether an item should produce reminders at all, whether this
// one occurrence is dropped, and whether a pushed-back moment stands beside it.
//
// `now` is handed in and never read from the clock, so a test can say what time
// it is.

import type { ShapedItem } from './inputshape.ts';

/**
 * What the block answers.
 *
 * Three things rather than one, because "not wanted" has two quite different
 * meanings and running them together is what forced the exceptions in the
 * readers. An item can be finished outright, or it can be finished for this
 * occurrence only with the ones after it still standing.
 */
export interface StillWantedAnswer {
    /** False when the item should produce no reminder at all, ever. */
    wantsRemindersBit: boolean;
    /**
     * True when this one occurrence is dropped and the ones after it stand.
     * Only ever true while `wantsRemindersBit` is also true.
     */
    dropsThisOccurrenceBit: boolean;
    /**
     * The extra moment a push-back calls for, or nothing.
     *
     * A push-back adds a reminder; it does not move the base occurrence, which
     * still stands.
     */
    pushedBackToMoment: number | null;
    /** Why, in plain words, so a fault or a test reads for itself. */
    becauseText: string;
}

/**
 * Is this item still wanted, and in what way?
 *
 * The questions are asked in the order below, and the order matters.
 */
export function isStillWanted(item: ShapedItem, now: number): StillWantedAnswer {
    // 1. No due time, so there is nothing to arm. Every one of the five
    //    readers guards on this today, and it comes first because an item
    //    without a time is not a reminder whatever else is set on it.
    if (!item.hasDueTimeBit) {
        return answer(false, false, null, 'the item has no due time');
    }

    // 2. Done, and how far the done reaches. The capability bit gates the
    //    state: an item that cannot be marked done is never treated as done,
    //    whatever its state field happens to say. Look Ahead falls out here
    //    without an exception, having no done field at all.
    //
    //    Nothing here knows about the day's rollover clearing the tick. That
    //    is the daily reset's job and it already works, so this block only
    //    ever asks whether the item is done NOW.
    if (item.canBeDoneBit && item.isDoneBit) {
        if (item.doneEndsItemBit) {
            return answer(false, false, null, 'the item is done and done ends it');
        }
        // Only this occurrence goes. The ones after it stand, and the
        // push-back stamp goes with the occurrence it belonged to, which is
        // the same thing Done does on the pages today.
        return answer(true, true, null, 'this occurrence is done, later ones stand');
    }

    // 3. Pushed back. The stamp adds a reminder at that moment; the base
    //    occurrence is left exactly where it was. A stamp already in the past
    //    has been spent and is ignored, and a stamp on an item that cannot be
    //    pushed back is ignored as well — the capability bit gates the state
    //    here in the same way it does for done.
    if (item.canBePushedBackBit
        && item.pushedBackToStamp !== undefined
        && item.pushedBackToStamp > now) {
        return answer(true, false, item.pushedBackToStamp, 'wanted, with a push-back standing');
    }

    return answer(true, false, null, 'wanted');
}

/** Build the answer, so every road out of the block reads the same. */
function answer(
    wantsRemindersBit: boolean,
    dropsThisOccurrenceBit: boolean,
    pushedBackToMoment: number | null,
    becauseText: string,
): StillWantedAnswer {
    return { wantsRemindersBit, dropsThisOccurrenceBit, pushedBackToMoment, becauseText };
}
