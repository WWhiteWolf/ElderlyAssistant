// Tests for the Pets translator.
//
// The translator's whole job is to say what a Pets feed IS, so these tests
// ask only that: the right facts came across, in the right fields, unchanged.
// Nothing here asks what the engine then does about them.

import { translatePets } from '../translators/translate.ts';
import type { PetsItem } from '../readers/pets.ts';
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
 * A plain saved Pets feed with a time and nothing done to it. Each test
 * changes only the fields it is about.
 */
function saved(changes: Partial<PetsItem> = {}): PetsItem {
    return {
        id: 'p1',
        label: 'Feed the dog',
        hour: 18,
        minute: 0,
        completed: false,
        ...changes,
    };
}

/** Translate one saved feed and hand back the one shaped item it becomes. */
function shapeOf(item: PetsItem, now: number = NOW) {
    return translatePets([item], now)[0];
}

export function runTranslatorPetsTests(): void {
    // ---- what the item is ----

    test('A saved feed keeps its screen, its id and its name', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.sourceScreenCode, shaped.itemIdText, shaped.itemNameText],
            ['pets', 'p1', 'Feed the dog'],
            'the three facts about what the feed is should come straight across',
        );
    });

    test('Every saved feed becomes one shaped item, in order', () => {
        const shapedList = translatePets(
            [saved({ id: 'p1' }), saved({ id: 'p2' }), saved({ id: 'p3' })],
            NOW,
        );
        assertSame(
            shapedList.map((one) => one.itemIdText),
            ['p1', 'p2', 'p3'],
            'the translator drops nothing, because dropping is a judgment made further along',
        );
    });

    // ---- when it comes due ----

    test('A feed with an hour and a minute is a daily item with its time', () => {
        const shaped = shapeOf(saved({ hour: 8, minute: 30 }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.hasDueTimeBit, shaped.dueHour, shaped.dueMinute],
            ['day', 1, true, 8, 30],
            'a Pets feed is a daily routine at the time it was given',
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
            'a feed set to midnight has a time',
        );
    });

    test('A feed with a null hour has no due time and no hour or minute at all', () => {
        const shaped = shapeOf(saved({ hour: null }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueHour, shaped.dueMinute],
            [false, undefined, undefined],
            'a cleared hour means no time was set, and the two fields are left out entirely',
        );
    });

    test('A feed with a null minute has no due time and no hour or minute at all', () => {
        const shaped = shapeOf(saved({ minute: null }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueHour, shaped.dueMinute],
            [false, undefined, undefined],
            'a cleared minute means no time was set, and the two fields are left out entirely',
        );
    });

    test('An older feed with no hour or minute at all has no due time', () => {
        // Saved before the fields existed. It counts as the same thing as a
        // time that was cleared.
        const older = { id: 'p1', label: 'Feed the dog', completed: false } as unknown as PetsItem;
        assert(!shapeOf(older).hasDueTimeBit, 'a missing time is the same as a cleared one');
    });

    test('A daily item carries neither a weekday nor a single moment', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.repeatWeekdayList, shaped.dueMoment],
            [undefined, undefined],
            'neither belongs to a daily item, so neither is filled in',
        );
    });

    // ---- capability bits ----

    test('A Pets feed can be done and can be pushed back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.canBeDoneBit, shaped.canBePushedBackBit],
            [true, true],
            'Pets feeds are ticked off and can be snoozed from page and banner',
        );
    });

    test('A ticked feed is done, but the done does not end it', () => {
        const shaped = shapeOf(saved({ completed: true }));
        assertSame(
            [shaped.isDoneBit, shaped.doneEndsItemBit],
            [true, false],
            'Pets done covers today only; the feed comes back tomorrow',
        );
    });

    test('A Pets reminder stands for one feed, never a group', () => {
        assert(!shapeOf(saved()).standsForGroupBit, 'standing for a group is To-Do background only');
    });

    // ---- state ----

    test('An untouched feed is not done and carries no push-back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.isDoneBit, shaped.pushedBackToStamp],
            [false, undefined],
            'nothing has happened to it yet',
        );
    });

    test('A snoozed feed carries its stamp through untouched', () => {
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

    test('A Pets feed speaks at the moment itself', () => {
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
        const shaped = shapeOf(saved({ label: 'Feed the cat' }));
        assertSame(
            [shaped.bannerTitleText, shaped.bannerBodyText, shaped.bannerButtonsCode],
            ['Pets Routine', 'Time for Feed the cat!', 'routineactions'],
            'the swap over must change nothing a person sees',
        );
    });

    // ---- the one thing that must survive the move ----

    test('A feed with no time but a live snooze keeps both', () => {
        // The Pets snooze deliberately stands on its own. In the old reader
        // the snooze is armed BEFORE the guard on the feed having a time,
        // because a feed whose time was cleared after it was snoozed still
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

    test('The wanted-block keeps a live snooze on a feed with no time', () => {
        // The whole point of the case. The feed has no base occurrence left to
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
            'a promised push-back survives the feed losing its time',
        );
    });

    test('A feed with no time and no live snooze is still not wanted', () => {
        // The last-resort question, held in place. Nothing above it has
        // anything to say about this feed, so the plain answer stands: no due
        // time, nothing to arm.
        const shaped = shapeOf(saved({ hour: null, minute: null }));
        const said = isStillWanted(shaped, NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment,
                said.becauseText],
            [false, false, null, 'the item has no due time'],
            'without a promise standing, a feed with no time is not a reminder',
        );
    });
}
