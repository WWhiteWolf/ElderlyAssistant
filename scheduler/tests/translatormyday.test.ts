// Tests for the My Day translator.
//
// The translator's whole job is to say what a My Day item IS, so these tests
// ask only that: the right facts came across, in the right fields, unchanged.
// Nothing here asks what the engine then does about them.

import { translateMyDay } from '../translators/myday.ts';
import type { MyDayItem } from '../readers/myday.ts';
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
 * A plain saved My Day item with a time and nothing done to it. Each test
 * changes only the fields it is about.
 */
function saved(changes: Partial<MyDayItem> = {}): MyDayItem {
    return {
        id: 'a1',
        label: 'Take the tablets',
        hour: 18,
        minute: 0,
        completed: false,
        ...changes,
    };
}

/** Translate one saved item and hand back the one shaped item it becomes. */
function shapeOf(item: MyDayItem, now: number = NOW) {
    return translateMyDay([item], now)[0];
}

export function runTranslatorMyDayTests(): void {
    // ---- what the item is ----

    test('A saved item keeps its screen, its id and its name', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.sourceScreenCode, shaped.itemIdText, shaped.itemNameText],
            ['myday', 'a1', 'Take the tablets'],
            'the three facts about what the item is should come straight across',
        );
    });

    test('Every saved item becomes one shaped item, in order', () => {
        const shapedList = translateMyDay(
            [saved({ id: 'a1' }), saved({ id: 'a2' }), saved({ id: 'a3' })],
            NOW,
        );
        assertSame(
            shapedList.map((one) => one.itemIdText),
            ['a1', 'a2', 'a3'],
            'the translator drops nothing, because dropping is a judgment made further along',
        );
    });

    // ---- when it comes due ----

    test('An item with an hour and a minute is a daily item with its time', () => {
        const shaped = shapeOf(saved({ hour: 8, minute: 30 }));
        assertSame(
            [shaped.triggerKindCode, shaped.hasDueTimeBit, shaped.dueHour, shaped.dueMinute],
            ['daily', true, 8, 30],
            'a My Day item is a daily routine at the time it was given',
        );
    });

    test('Midnight is a time like any other', () => {
        // Zero is a real hour and a real minute. A translator that tested for
        // truth rather than for a number would lose midnight, which is the
        // sort of fault that shows up months later.
        const shaped = shapeOf(saved({ hour: 0, minute: 0 }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueHour, shaped.dueMinute],
            [true, 0, 0],
            'an item set to midnight has a time',
        );
    });

    test('An item with a null hour has no due time', () => {
        const shaped = shapeOf(saved({ hour: null }));
        assert(!shaped.hasDueTimeBit, 'a cleared hour means no time was set');
    });

    test('An item with a null minute has no due time', () => {
        const shaped = shapeOf(saved({ minute: null }));
        assert(!shaped.hasDueTimeBit, 'a cleared minute means no time was set');
    });

    test('An older item with no hour or minute at all has no due time', () => {
        // Saved before the fields existed. It counts as the same thing as a
        // time that was cleared.
        const older = { id: 'a1', label: 'Take the tablets', completed: false } as unknown as MyDayItem;
        assert(!shapeOf(older).hasDueTimeBit, 'a missing time is the same as a cleared one');
    });

    test('A daily item carries neither a weekday nor a single moment', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.dueWeekday, shaped.dueMoment],
            [undefined, undefined],
            'neither belongs to a daily item, so neither is filled in',
        );
    });

    // ---- capability bits ----

    test('A My Day item can be done and can be pushed back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.canBeDoneBit, shaped.canBePushedBackBit],
            [true, true],
            'My Day items are ticked off and can be snoozed from page and banner',
        );
    });

    test('A ticked item is done, but the done does not end it', () => {
        const shaped = shapeOf(saved({ completed: true }));
        assertSame(
            [shaped.isDoneBit, shaped.doneEndsItemBit],
            [true, false],
            'My Day done covers today only; the item comes back tomorrow',
        );
    });

    test('A My Day reminder stands for one item, never a group', () => {
        assert(!shapeOf(saved()).standsForGroupBit, 'standing for a group is To-Do background only');
    });

    // ---- state ----

    test('An untouched item is not done and carries no push-back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.isDoneBit, shaped.pushedBackToStamp],
            [false, undefined],
            'nothing has happened to it yet',
        );
    });

    test('A snoozed item carries its stamp through untouched', () => {
        const later = at(2026, 5, 1, 22, 0);
        assertSame(shapeOf(saved({ snoozedUntil: later })).pushedBackToStamp, later,
            'the stamp is copied, not interpreted');
    });

    test('A stamp already in the past is carried through all the same', () => {
        const spent = at(2026, 5, 1, 7, 0);
        assertSame(shapeOf(saved({ snoozedUntil: spent })).pushedBackToStamp, spent,
            'whether a stamp has been spent is stillwanted.ts to answer, not this');
    });

    // ---- how far ahead to speak ----

    test('A My Day item has no lead times', () => {
        assertSame(shapeOf(saved()).leadTimeList, [],
            'a daily item speaks at the moment itself, which is what an empty list means');
    });

    // ---- the banner's words ----

    test('The banner words come out exactly as the existing reader writes them', () => {
        const shaped = shapeOf(saved({ label: 'Feed the cat' }));
        assertSame(
            [shaped.bannerTitleText, shaped.bannerBodyText, shaped.bannerButtonsCode],
            ['Daily Routine', 'Time for Feed the cat!', 'routineactions'],
            'the swap over must change nothing a person sees',
        );
    });

    // ---- the one thing that must survive the move ----

    test('An item with no time but a live snooze keeps both', () => {
        // My Day's snooze deliberately stands on its own. In the old reader
        // the snooze is armed BEFORE the guard on the item having a time,
        // because an item whose time was cleared after it was snoozed still
        // owes the reminder it promised. The translator's part of keeping
        // that is to let the two states stand side by side.
        const later = at(2026, 5, 1, 22, 0);
        const shaped = shapeOf(saved({ hour: null, minute: null, snoozedUntil: later }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.pushedBackToStamp],
            [false, later],
            'no due time and a live push-back must be able to hold at once',
        );
    });

    test('The wanted-block keeps a live snooze on an item with no time', () => {
        // The whole point of the case. The item has no base occurrence left to
        // arm, so this occurrence is dropped — but the promise was already
        // made, so the moment stands beside it. This is what the old reader
        // did by arming the snooze before its own time guard, now answered
        // once for every screen instead of five times over.
        const later = at(2026, 5, 1, 22, 0);
        const shaped = shapeOf(saved({ hour: null, minute: null, snoozedUntil: later }));
        const said = isStillWanted(shaped, NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment],
            [true, true, later],
            'a promised push-back survives the item losing its time',
        );
    });

    test('An item with no time and no live snooze is still not wanted', () => {
        // The last-resort question, held in place. Nothing above it has
        // anything to say about this item, so the plain answer stands: no due
        // time, nothing to arm.
        const shaped = shapeOf(saved({ hour: null, minute: null }));
        const said = isStillWanted(shaped, NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment,
                said.becauseText],
            [false, false, null, 'the item has no due time'],
            'without a promise standing, an item with no time is not a reminder',
        );
    });
}
