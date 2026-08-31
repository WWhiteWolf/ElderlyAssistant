// Tests for translating the one saved list by kind.
//
// The live scheduler calls translateReminderItems. These tests ask that each
// kind reaches the same common facts the old per-screen rules already proved.

import { translateReminderItems } from '../translators/translate.ts';
import { momentsFor } from '../leadmoments.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import {
    lastEnteredMonthlyPattern,
    withLastMonthlyPattern,
    emptyOptionSettings,
} from '../../modules/option-cases.ts';
import { assert, assertSame, test } from './runner.ts';

const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

function item(changes: Partial<ReminderItem> & Pick<ReminderItem, 'kind'>): ReminderItem {
    return {
        id: 'i1',
        label: 'Take the tablets',
        ...changes,
    };
}

function shapeOf(saved: ReminderItem) {
    return translateReminderItems([saved], NOW)[0];
}

export function runTranslatorCadenceTests(): void {
    test('A daily item is a My Day routine at its time', () => {
        const shaped = shapeOf(item({ kind: 'daily', hour: 8, minute: 30 }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.dueHour, shaped.dueMinute, shaped.bannerButtonsCode],
            ['myday', 'day', 8, 30, 'routineactions'],
            'a daily item keeps the My Day screen code so banners still open Daily',
        );
        assert(shaped.hasDueTimeBit, 'a time is a due time');
    });

    test('A weekly item carries its weekday', () => {
        const shaped = shapeOf(item({ kind: 'weekly', day: 2, hour: 18, minute: 15 }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.repeatWeekdayList?.[0]?.weekdayNumber],
            ['myweek', 'week', 2],
            'a weekly item is a My Week chore on its day',
        );
    });

    test('A monthly item is a repeating month with its date as the seed', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 5,
            day: 10,
            hour: 9,
            minute: 0,
        }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.dueHour, shaped.bannerButtonsCode],
            ['lookahead', 'month', 1, 9, 'lookaheadactions'],
            'a dated monthly item repeats each month from that day',
        );
        assert(shaped.hasDueTimeBit, 'a time is a due time');
    });

    test('A One Time item is a To-Do appointment with its leads', () => {
        const shaped = shapeOf(item({
            kind: 'oneTime',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
            reminders: [{ id: 'r1', amount: 30, unit: 'minutes', kind: 'offset' }],
        }));
        assertSame(
            [shaped.sourceScreenCode, shaped.doneEndsItemBit, shaped.leadTimeList.length, shaped.bannerButtonsCode],
            ['todo', true, 1, 'todook'],
            'One Time keeps the To-Do appointment shape',
        );
    });

    test('An Extended item has no due time', () => {
        const shaped = shapeOf(item({ kind: 'extended' }));
        assertSame(
            [shaped.sourceScreenCode, shaped.hasDueTimeBit, shaped.leadTimeList.length],
            ['todo', false, 0],
            'an Extended item is a dateless To-Do',
        );
    });

    test('Items keep their order and none are dropped', () => {
        const shaped = translateReminderItems(
            [
                item({ id: 'a', kind: 'daily', hour: 8, minute: 0 }),
                item({ id: 'b', kind: 'weekly', day: 1, hour: 9, minute: 0 }),
                item({ id: 'c', kind: 'extended' }),
            ],
            NOW,
        );
        assertSame(
            shaped.map((one) => one.itemIdText),
            ['a', 'b', 'c'],
            'the translator drops nothing, because dropping is a judgment made further along',
        );
    });

    test('A ticked daily item still becomes a shaped item', () => {
        const shaped = shapeOf(item({ kind: 'daily', hour: 8, minute: 0, completed: true }));
        assert(shaped.isDoneBit, 'the tick comes across so still-wanted can judge it');
    });

    test('A named time zone reaches the common shape as a complete pair', () => {
        const shaped = shapeOf(item({
            kind: 'weekly',
            day: 2,
            hour: 18,
            minute: 0,
            floatsWithPhone: false,
            dueTimeZoneText: 'America/New_York',
        }));
        assertSame(
            [shaped.floatsWithPhoneBit, shaped.dueTimeZoneText],
            [false, 'America/New_York'],
            'the engine already knows how to fire in that zone',
        );
    });

    test('An incomplete named zone is rejected rather than silently making no reminder', () => {
        const shaped = shapeOf(item({
            kind: 'weekly',
            day: 2,
            hour: 18,
            minute: 0,
            floatsWithPhone: false,
        }));
        assertSame(
            [shaped.floatsWithPhoneBit, shaped.dueTimeZoneText],
            [true, undefined],
            'the pair is incomplete, so the item keeps floating with the phone',
        );
    });

    test('A holiday move reaches the common shape as before or after', () => {
        const shaped = shapeOf(item({
            kind: 'weekly',
            day: 6,
            hour: 10,
            minute: 0,
            holidayMove: 'before',
        }));
        assertSame(
            shaped.holidayMoveCode,
            'before',
            'the engine moves the occurrence; the page does not',
        );
    });

    test('No holiday move is left off the common shape', () => {
        const shaped = shapeOf(item({
            kind: 'weekly',
            day: 6,
            hour: 10,
            minute: 0,
        }));
        assertSame(
            shaped.holidayMoveCode,
            undefined,
            'absent means unused',
        );
    });

    test('A second Thursday becomes a complete weekday entry', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            hour: 8,
            minute: 0,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
        }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatWeekdayList, shaped.repeatAfterDayCount],
            ['month', [{ weekdayNumber: 4, weekdayOrdinalCount: 2 }], undefined],
            'the ordinal and weekday are one complete entry',
        );
    });

    test('A half-entered second Thursday is not a valid recipe', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            hour: 8,
            minute: 0,
            weekdayOrdinal: 2,
        }));
        assertSame(
            shaped.repeatWeekdayList,
            undefined,
            'a half-entered pair is left off',
        );
    });

    test('A Wednesday after the 6th uses the same weekday calendar block', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            hour: 8,
            minute: 0,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        assertSame(
            [shaped.repeatWeekdayList, shaped.repeatAfterDayCount],
            [[{ weekdayNumber: 3 }], 6],
            'the weekday and the numbered floor are both set',
        );
    });

    test('Both weekday patterns together are not mapped as a combination', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 5,
            day: 10,
            hour: 9,
            minute: 0,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        assertSame(
            [shaped.repeatWeekdayList, shaped.repeatAfterDayCount, shaped.repeatUnitCode],
            [undefined, undefined, 'month'],
            'a worker does not invent which of the two weekday patterns wins',
        );
    });

    test('A saved second Thursday fires on that weekday', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            hour: 8,
            minute: 0,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
        }));
        assertSame(
            momentsFor(shaped, NOW, {
                morning: { hour: 7, minute: 15 },
                midday: { hour: 13, minute: 45 },
                evening: { hour: 19, minute: 30 },
            }),
            [new Date(2026, 5, 11, 8, 0, 0, 0).getTime()],
            'June 2026\'s second Thursday is the 11th',
        );
    });

    test('The last of the three stays and clears the other two', () => {
        const start = emptyOptionSettings();
        const withThursday = {
            ...start,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
        };
        const last = lastEnteredMonthlyPattern(start, withThursday, 'date');
        const cleared = withLastMonthlyPattern(withThursday, last);
        assertSame(
            [last, cleared.afterWeekday, cleared.weekdayOrdinal, cleared.ordinalWeekday],
            ['secondThursday', undefined, 2, 4],
            'choosing a second Thursday clears a Wednesday after the 6th',
        );
        const withDate = withLastMonthlyPattern(cleared, 'date');
        assertSame(
            [withDate.weekdayOrdinal, withDate.ordinalWeekday],
            [undefined, undefined],
            'choosing a dated day clears the second Thursday',
        );
    });

    test('A saved Then or Next Day on the item does not reach the common shape', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 0,
            day: 31,
            hour: 12,
            minute: 0,
            shiftedChoice: 'next',
        }));
        assertSame(
            (shaped as { shiftedChoice?: string }).shiftedChoice,
            undefined,
            'then or next day is an action on the shifted banner, not a recipe',
        );
    });
}
