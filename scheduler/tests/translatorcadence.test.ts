// Tests for translating the one saved list by kind.
//
// The live scheduler calls translateReminderItems. These tests ask that each
// kind reaches the same common facts the old per-screen rules already proved.

import { translateReminderItems } from '../translators/translate.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
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

    test('A monthly item is a Look Ahead moment', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 5,
            day: 10,
            hour: 9,
            minute: 0,
        }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.dueMoment, shaped.bannerButtonsCode],
            ['lookahead', undefined, new Date(2026, 5, 10, 9, 0, 0, 0).getTime(), 'lookaheadactions'],
            'dated repeats keep the Look Ahead banner road',
        );
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
}
