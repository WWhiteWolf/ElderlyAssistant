// Tests for the My Week rules in the one translator.
//
// The translator's whole job is to say what a chore IS, so these tests ask only
// that: the right facts came across, in the right fields, unchanged. Nothing
// here asks what the engine then does about them.

import { translateMyWeek } from '../translators/translate.ts';
import type { Chore } from '../readers/myweek.ts';
import { isStillWanted } from '../stillwanted.ts';
import { assert, assertSame, test } from './runner.ts';

// A fixed moment to test against: Monday the first of June 2026, at nine in
// the morning. Every test says what time it is, so none of them depends on the
// day it happens to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

/** A moment on the same clock as NOW, written out in full. */
function at(year: number, month: number, day: number, hour: number, minute: number): number {
    return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

/**
 * A plain saved chore with a day and a time and nothing done to it. Each test
 * changes only the fields it is about.
 */
function saved(changes: Partial<Chore> = {}): Chore {
    return {
        id: 'c1',
        label: 'Put the bins out',
        day: 3,
        hour: 18,
        minute: 30,
        completed: false,
        ...changes,
    };
}

/** Translate one saved chore and hand back the one shaped item it becomes. */
function shapeOf(chore: Chore, now: number = NOW) {
    return translateMyWeek([chore], now)[0];
}

export function runTranslatorMyWeekTests(): void {
    // ---- what the item is ----

    test('A saved chore keeps its screen, its id and its name', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.sourceScreenCode, shaped.itemIdText, shaped.itemNameText],
            ['myweek', 'c1', 'Put the bins out'],
            'the three facts about what the chore is should come straight across',
        );
    });

    test('Every saved chore becomes one shaped item, in order', () => {
        const shapedList = translateMyWeek(
            [saved({ id: 'c1' }), saved({ id: 'c2' }), saved({ id: 'c3' })],
            NOW,
        );
        assertSame(
            shapedList.map((one) => one.itemIdText),
            ['c1', 'c2', 'c3'],
            'the translator drops nothing, because dropping is a judgment made further along',
        );
    });

    // ---- when it comes due ----

    test('A whole chore is a weekly item with its day, hour and minute', () => {
        const shaped = shapeOf(saved({ day: 2, hour: 8, minute: 15 }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.repeatWeekdayList,
                shaped.hasDueTimeBit, shaped.dueHour, shaped.dueMinute],
            ['week', 1, [{ weekdayNumber: 2 }], true, 8, 15],
            'a chore comes due on its own day at its own time',
        );
    });

    test('The weekday is carried through exactly as the app saves it', () => {
        // Sunday is 0 in the saved list, and it stays 0 in the shape. The old
        // reader adds one because the phone counts weekdays from one, and that
        // addition belongs at the phone boundary and nowhere else. This test
        // exists because adding one here is exactly the kind of thing a later
        // session would "fix" into place.
        assertSame(shapeOf(saved({ day: 0 })).repeatWeekdayList, [{ weekdayNumber: 0 }],
            'a chore saved on Sunday comes out with a weekday of 0, not 1');
    });

    test('Midnight is a time like any other', () => {
        const shaped = shapeOf(saved({ day: 0, hour: 0, minute: 0 }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.repeatWeekdayList, shaped.dueHour, shaped.dueMinute],
            [true, [{ weekdayNumber: 0 }], 0, 0],
            'a chore set to midnight on a Sunday has a time',
        );
    });

    test('A chore with no day has no due time and no day, hour or minute at all', () => {
        const noDay = { ...saved(), day: null } as unknown as Chore;
        const shaped = shapeOf(noDay);
        assertSame(
            [shaped.hasDueTimeBit, shaped.repeatWeekdayList, shaped.dueHour, shaped.dueMinute],
            [false, undefined, undefined, undefined],
            'without a day there is nothing to arm, and the three fields are left out entirely',
        );
    });

    test('A chore with no hour has no due time and no day, hour or minute at all', () => {
        const noHour = { ...saved(), hour: null } as unknown as Chore;
        const shaped = shapeOf(noHour);
        assertSame(
            [shaped.hasDueTimeBit, shaped.repeatWeekdayList, shaped.dueHour, shaped.dueMinute],
            [false, undefined, undefined, undefined],
            'a cleared hour means no time was set, the same guard the old reader makes',
        );
    });

    test('A chore with no minute has no due time and no day, hour or minute at all', () => {
        const noMinute = { ...saved(), minute: null } as unknown as Chore;
        const shaped = shapeOf(noMinute);
        assertSame(
            [shaped.hasDueTimeBit, shaped.repeatWeekdayList, shaped.dueHour, shaped.dueMinute],
            [false, undefined, undefined, undefined],
            'a cleared minute means no time was set, the same guard the old reader makes',
        );
    });

    test('A weekly chore carries no single moment', () => {
        assertSame(shapeOf(saved()).dueMoment, undefined,
            'a moment does not belong to a weekly item, so it is not filled in');
    });

    // ---- capability bits ----

    test('A chore can be done and can be pushed back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.canBeDoneBit, shaped.canBePushedBackBit],
            [true, true],
            'chores are ticked off and can be postponed from page and banner',
        );
    });

    test('A ticked chore is done, but the done does not end it', () => {
        // The old reader never looks at the tick, because a repeating alarm
        // cannot be told to skip a single week. The translator tells the truth
        // instead, and nothing on the phone moves until the screen is swapped
        // over.
        const shaped = shapeOf(saved({ completed: true }));
        assertSame(
            [shaped.isDoneBit, shaped.canBeDoneBit, shaped.doneEndsItemBit],
            [true, true, false],
            'a chore done this week comes round again next week',
        );
    });

    test('A My Week reminder stands for one chore, never a group', () => {
        assert(!shapeOf(saved()).standsForGroupBit, 'standing for a group is To-Do background only');
    });

    // ---- state ----

    test('An untouched chore is not done and carries no push-back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.isDoneBit, shaped.pushedBackToStamp],
            [false, undefined],
            'nothing has happened to it yet',
        );
    });

    test('A postponed chore carries its stamp through untouched', () => {
        const later = at(2026, 5, 1, 22, 0);
        assertSame(shapeOf(saved({ postponedTo: later })).pushedBackToStamp, later,
            'the stamp is copied, not interpreted');
    });

    test('A stamp already in the past is carried through all the same', () => {
        const spent = at(2026, 5, 1, 7, 0);
        assertSame(shapeOf(saved({ postponedTo: spent })).pushedBackToStamp, spent,
            'whether a stamp has been spent is stillwanted.ts to answer, not this');
    });

    // ---- how far ahead to speak ----

    test('A chore speaks at the moment itself', () => {
        assertSame(shapeOf(saved()).leadTimeList,
            [{ leadFormCode: 'offset', leadAmount: 0, leadUnitCode: 'minutes' }],
            'one lead time of nothing-before is the moment itself');
    });

    test('The translator writes float-with-the-phone and leaves the zone off', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.floatsWithPhoneBit, shaped.dueTimeZoneText],
            [true, undefined],
            'no saved field yet; every row floats with the phone',
        );
    });

    // ---- the banner's words ----

    test('The banner words come out exactly as the existing reader writes them', () => {
        const shaped = shapeOf(saved({ label: 'Change the sheets' }));
        assertSame(
            [shaped.bannerTitleText, shaped.bannerBodyText, shaped.bannerButtonsCode],
            ['Weekly Chore', 'Time for Change the sheets!', 'routineactions'],
            'the swap over must change nothing a person sees',
        );
    });

    // ---- the one thing that must survive the move ----

    test('The wanted-block keeps a live postpone on a chore with no time', () => {
        // A chore whose time was cleared after it was postponed still owes the
        // reminder it promised. There is no base occurrence left to arm, so
        // this occurrence is dropped, and the promised moment stands beside it.
        const later = at(2026, 5, 1, 22, 0);
        const noTime = { ...saved(), hour: null, minute: null, postponedTo: later } as unknown as Chore;
        const shaped = shapeOf(noTime);
        assertSame(
            [shaped.hasDueTimeBit, shaped.pushedBackToStamp],
            [false, later],
            'no due time and a live push-back must be able to hold at once',
        );
        const said = isStillWanted(shaped, NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment],
            [true, true, later],
            'a promised push-back survives the chore losing its time',
        );
    });
}
