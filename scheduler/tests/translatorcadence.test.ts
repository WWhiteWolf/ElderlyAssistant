// Tests for translating the one saved list by kind.
//
// The live scheduler calls translateReminderItems. These tests ask that each
// kind reaches the same common facts the old per-screen rules already proved.

import {
    allowedOptionCaseCodesOf,
    translateReminderItems,
    doneActionCodeOf,
    exclusiveGroupBitsOf,
    dateWriteCodeOf,
    timeWriteCodeOf,
    keepsLeadChipsOf,
    hasQuarterlyStepOf,
    keepsBirthYearOf,
    dateLabelTextOf,
    itemNameOf,
    waitsUntilNearDaysOf,
    repeatUnitCodeOf,
    sanitizeCurrentReminderItems,
    usesWeeklyCycleStampOf,
} from '../translators/translate.ts';
import { MONTHLY_WEEKDAY_EXCLUSIVE_GROUP, QUARTERLY_STEP_CODES } from '../inputshape.ts';
import { momentsFor } from '../leadmoments.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import {
    emptyOptionSettings,
    optionCasesForCodes,
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

function optionCaseIdsFor(
    kind: ReminderItem['kind'],
    quarterlyStep?: 'none' | 'days30' | 'days60' | 'days90',
) {
    return optionCasesForCodes(allowedOptionCaseCodesOf(kind, quarterlyStep)).map((one) => one.id);
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
            ['oneTime', 'thisCycle', 2, 'onetimeactions', 'Daily Routine'],
            'a Daily one-shot is a one-off that still belongs to Daily',
        );
    });

    test('A Daily one-shot with no clock has no due time', () => {
        const shaped = shapeOf(item({
            kind: 'oneTime',
            year: 2026,
            month: 5,
            day: 10,
        }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [false, undefined],
            'no clock means no firing, which is the point of not setting the clock',
        );
    });

    test('Every kind that allows push-back names its source on the table', () => {
        assertSame(
            [
                shapeOf(item({ kind: 'daily' })).pushBackSourceCode,
                shapeOf(item({ kind: 'oneTime' })).pushBackSourceCode,
                shapeOf(item({ kind: 'weekly' })).pushBackSourceCode,
                shapeOf(item({ kind: 'monthly' })).pushBackSourceCode,
                shapeOf(item({ kind: 'quarterly' })).pushBackSourceCode,
                shapeOf(item({ kind: 'yearly' })).pushBackSourceCode,
                shapeOf(item({ kind: 'appointments' })).pushBackSourceCode,
                shapeOf(item({ kind: 'birthdays' })).pushBackSourceCode,
                shapeOf(item({ kind: 'bucketlist' })).pushBackSourceCode,
            ],
            [
                'dailysnooze',
                'oneTimesnooze',
                'weeklysnooze',
                'monthlydelay',
                'quarterlydelay',
                'yearlydelay',
                undefined,
                undefined,
                undefined,
            ],
            'the join reads table data and never reconstructs a source from kind',
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

    test('Wrong-kind Options fields never reach the common shape', () => {
        const daily = shapeOf(item({
            kind: 'daily',
            hour: 8,
            minute: 0,
            holidayMove: 'before',
            afterSetDay: true,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        const appointment = shapeOf(item({
            kind: 'appointments',
            year: 2026,
            month: 5,
            day: 10,
            afterSetDay: true,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
        }));
        const bucket = shapeOf(item({
            kind: 'bucketlist',
            holidayMove: 'after',
            floatsWithPhone: false,
            dueTimeZoneText: 'America/New_York',
        }));
        assertSame(
            [
                daily.holidayMoveCode,
                daily.afterSetDayBit,
                daily.repeatWeekdayList,
                appointment.afterSetDayBit,
                appointment.repeatWeekdayList,
                bucket.holidayMoveCode,
                bucket.dueTimeZoneText,
                bucket.floatsWithPhoneBit,
            ],
            [undefined, undefined, undefined, undefined, undefined, undefined, undefined, true],
            'each Options field reaches the engine only when the kind row allows its case',
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
            optionCaseIdsFor('bucketlist'),
            [],
            'Bucket List is the name, an optional note, and Done',
        );
    });

    test('A restore list with an unknown kind is rejected whole', () => {
        assertSame(
            sanitizeCurrentReminderItems([
                item({ kind: 'daily' }),
                { id: 'bad', label: 'Unknown', kind: 'nope' },
            ]),
            null,
            'an unknown saved kind makes the current backup invalid',
        );
    });

    test('A restore sanitizes Options from the current kind row', () => {
        const restored = sanitizeCurrentReminderItems([
            item({
                kind: 'daily',
                holidayMove: 'before',
                afterSetDay: true,
                floatsWithPhone: false,
                dueTimeZoneText: 'America/New_York',
                shadeCalendar: true,
                weekdayOrdinal: 2,
                ordinalWeekday: 4,
            }),
        ]);
        assert(restored !== null, 'a known kind is a current backup item');
        const saved = restored?.[0];
        assertSame(
            [
                saved?.holidayMove,
                saved?.afterSetDay,
                saved?.floatsWithPhone,
                saved?.dueTimeZoneText,
                saved?.shadeCalendar,
                saved?.weekdayOrdinal,
                saved?.ordinalWeekday,
            ],
            [undefined, undefined, false, 'America/New_York', true, undefined, undefined],
            'restore keeps Daily time zone and inert shade history, and strips wrong-kind fields',
        );
    });

    test('Restore strips a weekday pattern from a Quarterly day-count item', () => {
        const restored = sanitizeCurrentReminderItems([
            item({
                kind: 'quarterly',
                year: 2026,
                month: 0,
                day: 15,
                hour: 10,
                minute: 0,
                intervalDays: 90,
                holidayMove: 'before',
                weekdayOrdinal: 2,
                ordinalWeekday: 4,
                afterWeekday: 3,
                afterDayCount: 6,
            }),
        ]);
        const saved = restored?.[0];
        assertSame(
            [
                saved?.holidayMove,
                saved?.weekdayOrdinal,
                saved?.ordinalWeekday,
                saved?.afterWeekday,
                saved?.afterDayCount,
            ],
            ['before', undefined, undefined, undefined, undefined],
            'a 90 day item keeps Holidays and drops both weekday patterns',
        );
    });

    test('Restore writes the year of birth onto an older Birthday', () => {
        const restored = sanitizeCurrentReminderItems([
            item({
                kind: 'birthdays',
                label: 'Pat Smith',
                year: 1948,
                month: 5,
                day: 10,
                hour: 12,
                minute: 0,
            }),
        ], NOW);
        const saved = restored?.[0];
        assertSame(
            [saved?.birthYear, saved?.year, saved?.month, saved?.day],
            [1948, 2026, 5, 10],
            'the birthdate stays; the next fire is derived',
        );
    });

    test('Restore does not invent a year of birth on Yearly', () => {
        const restored = sanitizeCurrentReminderItems([
            item({
                kind: 'yearly',
                year: 1948,
                month: 5,
                day: 10,
            }),
        ], NOW);
        assertSame(
            restored?.[0]?.birthYear,
            undefined,
            'only the year-of-birth bit writes that field',
        );
    });

    test('Weekly Options has Day after the set day', () => {
        assertSame(
            optionCaseIdsFor('weekly'),
            ['holidays', 'afterSetDay', 'timezone'],
            'Weekly has Holidays, Day after the set day, and Time zone',
        );
    });

    test('Daily has only time zone', () => {
        assertSame(
            optionCaseIdsFor('daily'),
            ['timezone'],
            'Daily New and Edit get only time zone',
        );
    });

    test('One Time for today from Daily has only time zone', () => {
        assertSame(
            optionCaseIdsFor('oneTime'),
            ['timezone'],
            'Daily\'s One Time for today is time zone only',
        );
    });

    test('Appointments from its own page keeps holidays and time zone', () => {
        assertSame(
            optionCaseIdsFor('appointments'),
            ['holidays', 'timezone'],
            'Appointments on its own page keeps Weekly\'s holidays and time zone',
        );
    });

    test('Birthdays keep the same Options as Appointments', () => {
        assertSame(
            optionCaseIdsFor('birthdays'),
            ['holidays', 'timezone'],
            'Birthdays copy Appointments’ holidays and time zone, not Yearly’s extra cases',
        );
    });

    test('Monthly Options has no extra tap', () => {
        assertSame(
            optionCaseIdsFor('monthly'),
            ['holidays', 'timezone', 'secondThursday', 'wednesdayAfter'],
            'Then and Next Day are the missing-day banner, not an Options case',
        );
    });

    test('Quarterly and Yearly use the dated Options list from their rows', () => {
        assertSame(
            [optionCaseIdsFor('quarterly'), optionCaseIdsFor('yearly')],
            [
                ['holidays', 'timezone', 'secondThursday', 'wednesdayAfter'],
                ['holidays', 'timezone', 'secondThursday', 'wednesdayAfter'],
            ],
            'no-chip Quarterly and Yearly carry the same allowed Options codes as Monthly',
        );
    });

    test('A Quarterly day-count chip has Holidays and Time zone only', () => {
        assertSame(
            [
                optionCaseIdsFor('quarterly', 'days30'),
                optionCaseIdsFor('quarterly', 'days60'),
                optionCaseIdsFor('quarterly', 'days90'),
                exclusiveGroupBitsOf('quarterly', 'days90'),
            ],
            [
                ['holidays', 'timezone'],
                ['holidays', 'timezone'],
                ['holidays', 'timezone'],
                undefined,
            ],
            'a 30, 60, or 90 day item does not offer a weekday pattern',
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

    test('Weekly alone writes and clears a cycle stamp from the existing field group', () => {
        assertSame(
            [
                usesWeeklyCycleStampOf('daily'),
                usesWeeklyCycleStampOf('oneTime'),
                usesWeeklyCycleStampOf('weekly'),
                usesWeeklyCycleStampOf('monthly'),
                usesWeeklyCycleStampOf('quarterly'),
                usesWeeklyCycleStampOf('yearly'),
                usesWeeklyCycleStampOf('birthdays'),
                usesWeeklyCycleStampOf('appointments'),
                usesWeeklyCycleStampOf('bucketlist'),
            ],
            [false, false, true, false, false, false, false, false, false],
            'thisCycle together with week is the shared answer; Daily does not gain a stamp',
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

    test('A Quarterly day-count chip does not carry a leftover weekday pattern', () => {
        const shaped = shapeOf(item({
            kind: 'quarterly',
            year: 2026,
            month: 0,
            day: 15,
            hour: 10,
            minute: 0,
            intervalDays: 90,
            weekdayOrdinal: 2,
            ordinalWeekday: 4,
            afterWeekday: 3,
            afterDayCount: 6,
        }));
        assertSame(
            [shaped.repeatUnitCode, shaped.repeatIntervalCount, shaped.repeatWeekdayList, shaped.repeatAfterDayCount],
            ['day', 90, undefined, undefined],
            'the chip is the step; a leftover weekday is not in force',
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
        assertSame(
            itemNameOf({
                id: 'b1',
                kind: 'birthdays',
                label: 'Pat Smith',
                year: 2027,
                month: 5,
                day: 10,
                birthYear: 1948,
            }),
            'Pat Smith · Jun 10, 1948',
            'the table’s name for Birthdays is the person and the birthdate',
        );
        const reminded = translateReminderItems([{
            id: 'b1',
            kind: 'birthdays',
            label: 'Pat Smith',
            year: 2026,
            month: 5,
            day: 10,
            hour: 12,
            minute: 0,
            birthYear: 1948,
        }], new Date(2026, 8, 13, 18, 0, 0, 0).getTime())[0];
        assertSame(
            reminded?.bannerBodyText,
            'Birthday Pat 78',
            'the table’s reminder names the age they turn',
        );
    });
}
