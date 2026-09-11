// Tests for translating the one saved list by kind.
//
// The live scheduler calls translateReminderItems. These tests ask that each
// kind reaches the same common facts the old per-screen rules already proved.

import {
    translateReminderItems,
    doneActionCodeOf,
    exclusiveGroupBitsOf,
    dateWriteCodeOf,
    timeWriteCodeOf,
    keepsLeadChipsOf,
    hasQuarterlyStepOf,
    keepsBirthYearOf,
    dateLabelTextOf,
    waitsUntilNearDaysOf,
    repeatUnitCodeOf,
} from '../translators/translate.ts';
import { MONTHLY_WEEKDAY_EXCLUSIVE_GROUP, QUARTERLY_STEP_CODES } from '../inputshape.ts';
import { momentsFor } from '../leadmoments.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import {
    emptyOptionSettings,
    optionCasesForKind,
    withExclusiveGroup,
    clearExclusiveGroupFields,
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
    test('A daily item is a Daily routine at its time', () => {
        const shaped = shapeOf(item({ kind: 'daily', hour: 8, minute: 30 }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.dueHour, shaped.dueMinute, shaped.bannerButtonsCode],
            ['daily', 'day', 8, 30, 'routineactions'],
            'a daily item carries the Daily source so banners still open Daily',
        );
        assert(shaped.hasDueTimeBit, 'a time is a due time');
    });

    test('A weekly item carries its weekday', () => {
        const shaped = shapeOf(item({ kind: 'weekly', day: 2, hour: 18, minute: 15 }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.repeatWeekdayList?.[0]?.weekdayNumber, shaped.bannerButtonsCode],
            ['weekly', 'week', 2, 'weeklyactions'],
            'a weekly item is a Weekly item on its day, with Weekly\'s own banner set',
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
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.dueHour, shaped.bannerButtonsCode, shaped.shiftedBannerButtonsCode, shaped.bannerTitleText],
            ['monthly', 'month', 1, 9, 'cadenceactions', 'shifteddayactions', 'Monthly'],
            'a dated monthly item repeats each month from that day, and the banner names Monthly',
        );
        assert(shaped.hasDueTimeBit, 'a time is a due time');
    });

    test('A monthly 31st kept through February is still the 31st', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 1,
            day: 31,
            hour: 12,
            minute: 0,
        }));
        assertSame(
            [shaped.dueMonthDay, new Date(shaped.dueMoment ?? 0).getDate(), new Date(shaped.dueMoment ?? 0).getMonth()],
            [31, 28, 1],
            'February uses the 28th that month; the series is still the 31st',
        );
    });

    test('A Daily one-shot carries its leads and opens Daily', () => {
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
            [shaped.sourceScreenCode, shaped.doneActionCode, shaped.leadTimeList.length, shaped.bannerButtonsCode, shaped.bannerTitleText],
            ['oneTime', 'thisCycle', 2, 'routineactions', 'Daily Routine'],
            'a Daily one-shot is a one-off that still belongs to Daily',
        );
    });

    test('An appointment carries its leads', () => {
        const shaped = shapeOf(item({
            kind: 'appointments',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
            reminders: [{ id: 'r1', amount: 30, unit: 'minutes', kind: 'offset' }],
        }));
        assertSame(
            [shaped.sourceScreenCode, shaped.doneActionCode, shaped.leadTimeList.length, shaped.bannerButtonsCode],
            ['appointments', 'endItem', 2, 'appointmentsok'],
            'the set time is one lead, and each before-chip is another',
        );
    });

    test('A birthday repeats yearly and carries appointment leads', () => {
        const shaped = shapeOf(item({
            kind: 'birthdays',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
            reminders: [{ id: 'r1', amount: 30, unit: 'minutes', kind: 'offset' }],
        }));
        assertSame(
            [shaped.sourceScreenCode, shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.doneActionCode, shaped.leadTimeList.length, shaped.bannerButtonsCode],
            ['birthdays', 'year', 1, 'advanceDate', 2, 'appointmentsok'],
            'a birthday comes round every year and still speaks on the day and each chip',
        );
    });

    test('A Bucket List item has no due time', () => {
        const shaped = shapeOf(item({ kind: 'bucketlist' }));
        assertSame(
            [shaped.sourceScreenCode, shaped.hasDueTimeBit, shaped.leadTimeList.length],
            ['bucketlist', false, 0],
            'a Bucket List item has no due time',
        );
    });

    test('Items keep their order and none are dropped', () => {
        const shaped = translateReminderItems(
            [
                item({ id: 'a', kind: 'daily', hour: 8, minute: 0 }),
                item({ id: 'b', kind: 'weekly', day: 1, hour: 9, minute: 0 }),
                item({ id: 'c', kind: 'bucketlist' }),
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

    test('A saved skip stamp reaches the common shape', () => {
        const stamp = new Date(2026, 5, 1, 8, 0, 0, 0).getTime();
        const shaped = shapeOf(item({ kind: 'daily', hour: 8, minute: 0, skippedCycleStamp: stamp }));
        assertSame(shaped.skippedCycleStamp, stamp, 'Skip is a saved stamp the engine already knows how to read');
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

    test('Day after the set day reaches the common shape as a bit', () => {
        const shaped = shapeOf(item({
            kind: 'weekly',
            day: 4,
            hour: 10,
            minute: 0,
            afterSetDay: true,
        }));
        assertSame(
            shaped.afterSetDayBit,
            true,
            'the engine moves the occurrence; the page does not',
        );
    });

    test('Day after the set day unused is left off the common shape', () => {
        const shaped = shapeOf(item({
            kind: 'weekly',
            day: 4,
            hour: 10,
            minute: 0,
        }));
        assertSame(
            shaped.afterSetDayBit,
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

    test('The monthly weekday exclusive group writes only one pattern', () => {
        const thursday = shapeOf(item({
            kind: 'monthly',
            hour: 8,
            minute: 0,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
        }));
        const wednesday = shapeOf(item({
            kind: 'monthly',
            hour: 8,
            minute: 0,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        assertSame(
            [thursday.repeatAfterDayCount, wednesday.repeatWeekdayList?.[0]?.weekdayOrdinalCount],
            [undefined, undefined],
            'a second Thursday does not also write a Wednesday after, and the reverse',
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

    test('The table list turns the other exclusive bit off', () => {
        const start = emptyOptionSettings();
        const withThursday = {
            ...start,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
        };
        const cleared = withExclusiveGroup(start, withThursday, MONTHLY_WEEKDAY_EXCLUSIVE_GROUP);
        assertSame(
            [cleared.afterWeekday, cleared.weekdayOrdinal, cleared.ordinalWeekday],
            [undefined, 2, 4],
            'choosing a second Thursday clears a Wednesday after the 6th',
        );
        const withDate = clearExclusiveGroupFields(cleared);
        assertSame(
            [withDate.weekdayOrdinal, withDate.ordinalWeekday],
            [undefined, undefined],
            'choosing a dated day clears the second Thursday',
        );
    });

    test('A partial second Thursday is kept until the pattern completes', () => {
        const start = emptyOptionSettings();
        let settings = start;

        settings = withExclusiveGroup(
            settings,
            { ...settings, weekdayOrdinal: 2 },
            MONTHLY_WEEKDAY_EXCLUSIVE_GROUP,
        );
        assertSame(
            [settings.weekdayOrdinal, settings.ordinalWeekday],
            [2, undefined],
            'the first chip alone stays lit while the pattern is still open',
        );

        settings = withExclusiveGroup(
            settings,
            { ...settings, ordinalWeekday: 4 },
            MONTHLY_WEEKDAY_EXCLUSIVE_GROUP,
        );
        assertSame(
            [settings.weekdayOrdinal, settings.ordinalWeekday],
            [2, 4],
            'the second chip completes the pattern',
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
        assertSame(
            shaped.shiftedBannerButtonsCode,
            'shifteddayactions',
            'the missing-day buttons are on the table',
        );
    });

    test('Bucket List has no Options cases', () => {
        assertSame(
            optionCasesForKind('bucketlist').map((one) => one.id),
            [],
            'Bucket List is the name, an optional note, and Done',
        );
    });

    test('An unknown kind does not get the Weekly Options set', () => {
        assertSame(
            optionCasesForKind('nope').map((one) => one.id),
            [],
            'every kind is named; nothing unknown inherits Weekly',
        );
    });

    test('Weekly Options has Day after the set day', () => {
        assertSame(
            optionCasesForKind('weekly').map((one) => one.id),
            ['holidays', 'afterSetDay', 'timezone'],
            'Weekly has Holidays, Day after the set day, and Time zone',
        );
    });

    test('Daily has only time zone', () => {
        assertSame(
            optionCasesForKind('daily').map((one) => one.id),
            ['timezone'],
            'Daily New and Edit get only time zone',
        );
    });

    test('One Time for today from Daily has only time zone', () => {
        assertSame(
            optionCasesForKind('oneTime').map((one) => one.id),
            ['timezone'],
            'Daily\'s One Time for today is time zone only',
        );
    });

    test('Appointments from its own page keeps holidays and time zone', () => {
        assertSame(
            optionCasesForKind('appointments').map((one) => one.id),
            ['holidays', 'timezone'],
            'Appointments on its own page keeps Weekly\'s holidays and time zone',
        );
    });

    test('Birthdays keep the same Options as Appointments', () => {
        assertSame(
            optionCasesForKind('birthdays').map((one) => one.id),
            ['holidays', 'timezone'],
            'Birthdays copy Appointments’ holidays and time zone, not Yearly’s extra cases',
        );
    });

    test('Monthly Options has no extra tap', () => {
        assertSame(
            optionCasesForKind('monthly').map((one) => one.id),
            ['holidays', 'timezone', 'secondThursday', 'wednesdayAfter'],
            'Then and Next Day are the missing-day banner, not an Options case',
        );
    });

    test('Dated kinds can be marked done', () => {
        const monthly = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 5,
            day: 10,
            hour: 9,
            minute: 0,
        }));
        const birthday = shapeOf(item({
            kind: 'birthdays',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
        }));
        assertSame(
            [monthly.canBeDoneBit, birthday.canBeDoneBit],
            [true, true],
            'dated kinds are allowed a tick; the three-word code says what it means',
        );
    });

    test('A ticked dated item carries the tick', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 5,
            day: 10,
            hour: 9,
            minute: 0,
            completed: true,
        }));
        assertSame(
            [shaped.isDoneBit, shaped.doneActionCode],
            [true, 'advanceDate'],
            'the translator reads the tick so the wanted-block can read the code',
        );
    });

    test('Done on the table is a three-word code', () => {
        assertSame(
            [
                doneActionCodeOf('daily'),
                doneActionCodeOf('weekly'),
                doneActionCodeOf('oneTime'),
                doneActionCodeOf('monthly'),
                doneActionCodeOf('quarterly'),
                doneActionCodeOf('yearly'),
                doneActionCodeOf('birthdays'),
                doneActionCodeOf('appointments'),
                doneActionCodeOf('bucketlist'),
            ],
            [
                'thisCycle',
                'thisCycle',
                'thisCycle',
                'advanceDate',
                'advanceDate',
                'advanceDate',
                'advanceDate',
                'endItem',
                'endItem',
            ],
            'each kind names what Done does, so the pages do not remember the kind',
        );
    });

    test('Yearly and Birthdays write year on the table', () => {
        assertSame(
            [
                repeatUnitCodeOf('yearly'),
                repeatUnitCodeOf('birthdays'),
                repeatUnitCodeOf('monthly'),
                repeatUnitCodeOf('appointments'),
            ],
            ['year', 'year', 'month', undefined],
            'the date-advance reads that word, so it does not remember Yearly or Birthdays',
        );
    });

    test('How near is a number on the table', () => {
        assertSame(
            [
                waitsUntilNearDaysOf('daily'),
                waitsUntilNearDaysOf('weekly'),
                waitsUntilNearDaysOf('oneTime'),
                waitsUntilNearDaysOf('monthly'),
                waitsUntilNearDaysOf('quarterly'),
                waitsUntilNearDaysOf('yearly'),
                waitsUntilNearDaysOf('birthdays'),
                waitsUntilNearDaysOf('appointments'),
                waitsUntilNearDaysOf('bucketlist'),
            ],
            [
                undefined,
                undefined,
                undefined,
                30,
                60,
                60,
                60,
                undefined,
                undefined,
            ],
            'each kind names how far ahead, so the join does not remember the kind',
        );
    });

    test('Both weekday fields complete writes neither pattern', () => {
        const shaped = shapeOf(item({
            kind: 'monthly',
            year: 2026,
            month: 5,
            day: 10,
            hour: 8,
            minute: 0,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        assertSame(
            [shaped.repeatWeekdayList, shaped.repeatAfterDayCount, shaped.repeatUnitCode],
            [undefined, undefined, 'month'],
            'both complete is not a case the group allows, so Thursday does not win',
        );
    });

    test('Birthdays stay off the weekday exclusive path', () => {
        const shaped = shapeOf(item({
            kind: 'birthdays',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.repeatWeekdayList],
            ['year', 1, undefined],
            'Birthdays repeat yearly and do not carry a weekday list',
        );
    });

    test('Monthly, Quarterly, and Yearly carry the weekday exclusive group', () => {
        assertSame(
            [
                exclusiveGroupBitsOf('monthly'),
                exclusiveGroupBitsOf('quarterly'),
                exclusiveGroupBitsOf('yearly'),
                exclusiveGroupBitsOf('daily'),
            ],
            [
                [...MONTHLY_WEEKDAY_EXCLUSIVE_GROUP],
                [...MONTHLY_WEEKDAY_EXCLUSIVE_GROUP],
                [...MONTHLY_WEEKDAY_EXCLUSIVE_GROUP],
                undefined,
            ],
            'a second Thursday and a Wednesday after the 6th cannot both be true',
        );
    });
    test('A Quarterly item with no day chip repeats every three months', () => {
        const shaped = shapeOf(item({
            kind: 'quarterly',
            year: 2026,
            month: 0,
            day: 15,
            hour: 10,
            minute: 0,
        }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.quarterlyStepCode],
            ['month', 3, 'none'],
            'no chip is every three months, as before',
        );
    });

    test('A Quarterly 90-day chip repeats in days from the entered date', () => {
        const shaped = shapeOf(item({
            kind: 'quarterly',
            year: 2026,
            month: 0,
            day: 15,
            hour: 10,
            minute: 0,
            intervalDays: 90,
        }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.quarterlyStepCode],
            ['day', 90, 'days90'],
            'the chip writes a day count the engine already steps',
        );
    });

    test('The Quarterly step is a named set of four words', () => {
        assertSame(
            QUARTERLY_STEP_CODES.slice(),
            ['none', 'days30', 'days60', 'days90'],
            'an impossible step cannot be written down',
        );
    });

    test('Save write codes sit on the table for every kind', () => {
        assertSame(
            [
                dateWriteCodeOf('daily'),
                dateWriteCodeOf('weekly'),
                dateWriteCodeOf('monthly'),
                dateWriteCodeOf('quarterly'),
                dateWriteCodeOf('yearly'),
                dateWriteCodeOf('oneTime'),
                dateWriteCodeOf('appointments'),
                dateWriteCodeOf('birthdays'),
                dateWriteCodeOf('bucketlist'),
            ],
            ['none', 'weekday', 'calendar', 'calendar', 'calendar', 'today', 'required', 'required', 'none'],
            'Save asks the table what date fields belong',
        );
        assertSame(
            [
                timeWriteCodeOf('daily'),
                timeWriteCodeOf('weekly'),
                timeWriteCodeOf('monthly'),
                timeWriteCodeOf('quarterly'),
                timeWriteCodeOf('yearly'),
                timeWriteCodeOf('oneTime'),
                timeWriteCodeOf('appointments'),
                timeWriteCodeOf('birthdays'),
                timeWriteCodeOf('bucketlist'),
            ],
            [
                'ifPendingTime',
                'alwaysPendingTime',
                'alwaysPendingDate',
                'alwaysPendingDate',
                'alwaysPendingDate',
                'ifTimeSet',
                'ifTimeSet',
                'ifTimeSet',
                'none',
            ],
            'Save asks the table what time fields belong',
        );
        assertSame(
            [
                keepsLeadChipsOf('daily'),
                keepsLeadChipsOf('weekly'),
                keepsLeadChipsOf('monthly'),
                keepsLeadChipsOf('oneTime'),
                keepsLeadChipsOf('appointments'),
                keepsLeadChipsOf('birthdays'),
                keepsLeadChipsOf('bucketlist'),
            ],
            [false, false, false, true, true, true, false],
            'Save asks the table whether reminder chips belong',
        );
        assertSame(
            [
                hasQuarterlyStepOf('quarterly'),
                hasQuarterlyStepOf('monthly'),
                hasQuarterlyStepOf('yearly'),
                hasQuarterlyStepOf('daily'),
            ],
            [true, false, false, false],
            'only Quarterly writes a Quarterly step',
        );
        assertSame(
            [
                keepsBirthYearOf('birthdays'),
                keepsBirthYearOf('yearly'),
                keepsBirthYearOf('appointments'),
                keepsBirthYearOf('daily'),
            ],
            [true, false, false, false],
            'only Birthdays keep a year of birth',
        );
        assertSame(
            [
                dateLabelTextOf('birthdays'),
                dateLabelTextOf('appointments'),
                dateLabelTextOf('monthly'),
            ],
            ['Birthdate', 'Due Date', 'Due Date'],
            'Birthdays’ date line is Birthdate; others keep Due Date',
        );
    });
}
