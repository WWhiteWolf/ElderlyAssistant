// The block that answers one question: is this still wanted?
//
// Every returning arrow lands here. Done, pushed back and skipped all come back
// from the far end of the app and change what a shaped item should produce, and
// every kind is answered here once, against the common shape.
//
// It decides nothing about how many reminders to arm, nothing about what the
// banner says, and nothing about fitting inside the phone's sixty-four places.
// It only says whether an item should produce reminders at all, whether this
// one occurrence is dropped, and whether a pushed-back moment stands beside it.
//
// `now` is handed in and never read from the clock, so a test can say what time
// it is.

import type { ShapedItem } from './inputshape.ts';
import { sameDay } from './readers/occurrences.ts';

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
    /**
     * True when this cycle was skipped and the next event should be armed.
     * Later blocks read this bit. `becauseText` is only an explanation.
     */
    skippedThisCycleBit: boolean;
    /** Why, in plain words, so a fault or a test reads for itself. */
    becauseText: string;
}

/**
 * Is this item still wanted, and in what way?
 *
 * The questions are asked in the order below, and the order matters.
 */
export function isStillWanted(item: ShapedItem, now: number): StillWantedAnswer {
    // 1. Done, and how far the done reaches. The capability bit gates the
    //    state: an item that cannot be marked done is never treated as done,
    //    whatever its state field happens to say. A dated cadence falls out
    //    here without an exception.
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

    // 2. Skip. This cycle is dropped and the next event stands. It is not
    //    done. Asked after done so a tick still wins when both are set, and
    //    before push-back so skip, like done, does not carry a push-back
    //    forward. A one-off has no next event, so a stamp there is ignored.
    if (item.skippedCycleStamp !== undefined
        && item.repeatUnitCode !== undefined
        && skipStillHolds(now, item.skippedCycleStamp)) {
        return answer(true, true, null, 'this cycle was skipped, the next event stands', true);
    }

    // 3. Pushed back. The stamp adds a reminder at that moment; the base
    //    occurrence is left exactly where it was. A stamp already in the past
    //    has been spent and is ignored, and a stamp on an item that cannot be
    //    pushed back is ignored as well — the capability bit gates the state
    //    here in the same way it does for done.
    if (item.canBePushedBackBit
        && item.pushedBackToStamp !== undefined
        && item.pushedBackToStamp > now) {
        // An item whose time was cleared after it was snoozed still owes the
        // reminder it promised, and this is why the push-back is asked before
        // the due-time question rather than after it. There is no base
        // occurrence left to arm, so this occurrence is dropped; the promised
        // moment stands beside it all the same. A Daily snooze has always
        // worked this way: it is answered before the guard on the item having
        // a time. Asking in this order is what
        // keeps that true for every screen at once, as a rule rather than as
        // an exception.
        if (!item.hasDueTimeBit) {
            return answer(true, true, item.pushedBackToStamp,
                'the item has no due time, but a promised push-back still stands');
        }
        return answer(true, false, item.pushedBackToStamp, 'wanted, with a push-back standing');
    }

    // 4. No due time, so there is nothing to arm. Every current kind follows
    //    this guard. It is asked last rather than first
    //    because it is the only answer that throws the whole item away, and
    //    the questions above can each have something to say about an item
    //    that has lost its time.
    if (!item.hasDueTimeBit) {
        return answer(false, false, null, 'the item has no due time');
    }

    return answer(true, false, null, 'wanted');
}

/** Build the answer, so every road out of the block reads the same. */
function answer(
    wantsRemindersBit: boolean,
    dropsThisOccurrenceBit: boolean,
    pushedBackToMoment: number | null,
    becauseText: string,
    skippedThisCycleBit = false,
): StillWantedAnswer {
    return {
        wantsRemindersBit,
        dropsThisOccurrenceBit,
        pushedBackToMoment,
        skippedThisCycleBit,
        becauseText,
    };
}

/**
 * True while `now` is not after the end of the skipped stamp's local calendar
 * day. That includes days before the skipped day, so a skip made ahead of the
 * cycle still holds, and the stamp is spent as soon as the next local day
 * begins.
 */
function skipStillHolds(now: number, stamp: number): boolean {
    const stampDay = new Date(stamp);
    const nowDay = new Date(now);
    if (sameDay(nowDay, stampDay)) {
        return true;
    }
    const startOfStampDay = new Date(
        stampDay.getFullYear(),
        stampDay.getMonth(),
        stampDay.getDate(),
    ).getTime();
    return now < startOfStampDay;
}
