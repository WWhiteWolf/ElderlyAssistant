// Tests for the Look Ahead rules in the one translator.
//
// The translator's whole job is to say what a Look Ahead entry IS, so these
// tests ask only that: the right facts came across, in the right fields,
// unchanged. Nothing here asks what the engine then does about them.

import { translateLookAhead } from '../translators/translate.ts';
import type { LookAheadItem } from '../readers/lookahead.ts';
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
 * A plain saved Look Ahead entry, dated well ahead of NOW and with nothing done
 * to it. Each test changes only the fields it is about. The month counts from
 * zero, as the phone counts months, so 8 is September.
 */
function saved(changes: Partial<LookAheadItem> = {}): LookAheadItem {
    return {
        id: 'l1',
        label: 'Renew the passport',
        year: 2026,
        month: 8,
        day: 14,
        hour: 10,
        minute: 45,
        ...changes,
    };
}

/** Translate one saved entry and hand back the one shaped item it becomes. */
function shapeOf(item: LookAheadItem, now: number = NOW) {
    return translateLookAhead([item], now)[0];
}

export function runTranslatorLookAheadTests(): void {
    // ---- what the item is ----

    test('A saved entry keeps its screen, its id and its name', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.sourceScreenCode, shaped.itemIdText, shaped.itemNameText],
            ['lookahead', 'l1', 'Renew the passport'],
            'the three facts about what the entry is should come straight across',
        );
    });

    test('Every saved entry becomes one shaped item, in order', () => {
        const shapedList = translateLookAhead(
            [saved({ id: 'l1' }), saved({ id: 'l2' }), saved({ id: 'l3' })],
            NOW,
        );
        assertSame(
            shapedList.map((one) => one.itemIdText),
            ['l1', 'l2', 'l3'],
            'the translator drops nothing, because dropping is a judgment made further along',
        );
    });

    // ---- when it comes due ----

    test('An entry is a date item whose moment is its own date and time', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.triggerKindCode, shaped.hasDueTimeBit, shaped.dueMoment],
            ['date', true, at(2026, 8, 14, 10, 45)],
            'a Look Ahead entry comes due at one moment, worked out from what was saved',
        );
    });

    test('A date entry carries its moment alone, with no hour or minute beside it', () => {
        // The hour is already inside the moment. Two copies of one fact are
        // two things that can come to disagree, so the entry carries the
        // moment and nothing else.
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.dueHour, shaped.dueMinute, shaped.dueWeekday],
            [undefined, undefined, undefined],
            'each trigger kind sets exactly the fields its own kind needs',
        );
    });

    test('An entry with no year has no due time and no moment', () => {
        const noYear = { ...saved(), year: null } as unknown as LookAheadItem;
        const shaped = shapeOf(noYear);
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [false, undefined],
            'without a year there is no date, the same guard the old reader makes',
        );
    });

    test('An entry with no month has no due time and no moment', () => {
        const noMonth = { ...saved(), month: null } as unknown as LookAheadItem;
        const shaped = shapeOf(noMonth);
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [false, undefined],
            'without a month there is no date, the same guard the old reader makes',
        );
    });

    test('An entry with no day has no due time and no moment', () => {
        const noDay = { ...saved(), day: null } as unknown as LookAheadItem;
        const shaped = shapeOf(noDay);
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [false, undefined],
            'without a day there is no date, the same guard the old reader makes',
        );
    });

    // ---- capability bits ----

    test('An entry cannot be done, and is never done', () => {
        // The screen has no done field at all. With the capability bit clear as
        // well, the wanted-block never reaches the state, so Look Ahead falls
        // out as a rule rather than as an exception.
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.canBeDoneBit, shaped.isDoneBit],
            [false, false],
            'Look Ahead has nothing to tick off',
        );
    });

    test('The wanted-block wants an entry that is neither done nor delayed', () => {
        const said = isStillWanted(shapeOf(saved()), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment],
            [true, false, null],
            'an ordinary dated entry is simply wanted',
        );
    });

    test('An entry can be pushed back', () => {
        assert(shapeOf(saved()).canBePushedBackBit,
            'the page delays and the banner delays, both writing delayedUntil');
    });

    test('A Look Ahead reminder stands for one entry, never a group', () => {
        assert(!shapeOf(saved()).standsForGroupBit, 'standing for a group is To-Do background only');
    });

    // ---- state ----

    test('A delayed entry carries its stamp through as the push-back stamp', () => {
        const later = at(2026, 5, 1, 22, 0);
        assertSame(shapeOf(saved({ delayedUntil: later })).pushedBackToStamp, later,
            'a delay is a push-back like any other, and the stamp is copied, not interpreted');
    });

    test('An entry whose moment has already gone still comes through', () => {
        // The old reader guards on the moment still being ahead. That is a
        // judgment about whether a past entry wants arming, and judgments
        // belong in stillwanted.ts. The translator says what the entry IS.
        const gone = saved({ year: 2026, month: 0, day: 5, hour: 9, minute: 0 });
        const shaped = shapeOf(gone);
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [true, at(2026, 0, 5, 9, 0)],
            'the translator drops nothing and keeps the moment intact',
        );
    });

    // ---- how far ahead to speak ----

    test('A Look Ahead entry has no lead times', () => {
        assertSame(shapeOf(saved()).leadTimeList, [],
            'Look Ahead has never had lead times');
    });

    // ---- the banner's words ----

    test('The banner words come out exactly as the existing reader writes them', () => {
        const shaped = shapeOf(saved({ label: 'Book the boiler service' }));
        assertSame(
            [shaped.bannerTitleText, shaped.bannerBodyText, shaped.bannerButtonsCode],
            ['🔭 Look Ahead', 'Time for Book the boiler service!', 'lookaheadactions'],
            'the heading carries its telescope, word for word as the old reader writes it',
        );
    });
}
