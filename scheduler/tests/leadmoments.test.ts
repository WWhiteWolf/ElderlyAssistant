// Tests for the piece that turns a lead time into a moment on the clock.

import { momentsFor } from '../leadmoments.ts';
import type { ClockTimes } from '../leadmoments.ts';
import type { LeadTime, ShapedItem } from '../inputshape.ts';
import { assertSame, test } from './runner.ts';

// A fixed moment to test against: Monday the first of June 2026, at nine in
// the morning. Every test says what time it is, so none of them depends on
// the day it happens to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

/** A moment on the same clock as NOW, written out in full. */
function at(year: number, month: number, day: number, hour: number, minute: number): number {
    return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

/**
 * Times of day that are not Settings' fallbacks, so a clock lead time that
 * used a default instead of what was handed in would miss the assertion.
 */
const CLOCK: ClockTimes = {
    morning: { hour: 7, minute: 15 },
    midday: { hour: 13, minute: 45 },
    evening: { hour: 19, minute: 30 },
};

const NOTHING_BEFORE: LeadTime = {
    leadFormCode: 'offset',
    leadAmount: 0,
    leadUnitCode: 'minutes',
};

/**
 * A date item due on Wednesday the third, at two in the afternoon, with one
 * lead time of nothing-before. Each test changes only the fields it is about.
 */
function item(changes: Partial<ShapedItem> = {}): ShapedItem {
    return {
        sourceScreenCode: 'lookahead',
        itemIdText: 'a1',
        itemNameText: 'Book the boiler',
        triggerKindCode: 'date',
        hasDueTimeBit: true,
        dueMoment: at(2026, 5, 3, 14, 0),
        canBeDoneBit: false,
        canBePushedBackBit: true,
        doneEndsItemBit: false,
        standsForGroupBit: false,
        isDoneBit: false,
        leadTimeList: [NOTHING_BEFORE],
        ...changes,
    };
}

function momentsOf(changes: Partial<ShapedItem> = {}, now: number = NOW): number[] {
    return momentsFor(item(changes), now, CLOCK);
}

export function runLeadMomentsTests(): void {
    // ---- nothing-before, which is the moment itself ----

    test('A date item with nothing-before comes back with its own moment', () => {
        assertSame(
            momentsOf(),
            [at(2026, 5, 3, 14, 0)],
            'zero taken from the base is the base, and nothing else is armed',
        );
    });

    test('A daily item whose time is later today comes back with today', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'myday',
                triggerKindCode: 'daily',
                dueHour: 18,
                dueMinute: 0,
            }),
            [at(2026, 5, 1, 18, 0)],
            'the time has not gone by, so the base is today',
        );
    });

    test('A daily item whose time has gone by today comes back with tomorrow', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'myday',
                triggerKindCode: 'daily',
                dueHour: 8,
                dueMinute: 0,
            }),
            [at(2026, 5, 2, 8, 0)],
            'the day is stepped, so the time of day is kept',
        );
    });

    test('A weekly item comes back on the next matching weekday', () => {
        // NOW is Monday. Wednesday is 3.
        assertSame(
            momentsOf({
                sourceScreenCode: 'myweek',
                triggerKindCode: 'weekly',
                dueWeekday: 3,
                dueHour: 18,
                dueMinute: 0,
            }),
            [at(2026, 5, 3, 18, 0)],
            'Monday steps forward to Wednesday, at the chore\'s own time',
        );
    });

    test('A weekly item on today whose time has not come gives today', () => {
        // Monday is 1. Eighteen hundred has not come yet at nine in the morning.
        assertSame(
            momentsOf({
                sourceScreenCode: 'myweek',
                triggerKindCode: 'weekly',
                dueWeekday: 1,
                dueHour: 18,
                dueMinute: 0,
            }),
            [at(2026, 5, 1, 18, 0)],
            'today is that weekday and the time is still ahead, so it is not a week away',
        );
    });

    test('A weekly item on today whose time has gone by comes back seven days on', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'myweek',
                triggerKindCode: 'weekly',
                dueWeekday: 1,
                dueHour: 8,
                dueMinute: 0,
            }),
            [at(2026, 5, 8, 8, 0)],
            'the next Monday, not tomorrow',
        );
    });

    // ---- offset and clock lead times ----

    test('An offset of thirty minutes, two hours and three days counts back from the base', () => {
        assertSame(
            momentsOf({
                leadTimeList: [
                    { leadFormCode: 'offset', leadAmount: 30, leadUnitCode: 'minutes' },
                ],
            }),
            [at(2026, 5, 3, 13, 30)],
            'thirty minutes before two o\'clock is half past one',
        );
        assertSame(
            momentsOf({
                leadTimeList: [
                    { leadFormCode: 'offset', leadAmount: 2, leadUnitCode: 'hours' },
                ],
            }),
            [at(2026, 5, 3, 12, 0)],
            'two hours before two o\'clock is noon',
        );
        assertSame(
            momentsOf({
                dueMoment: at(2026, 5, 10, 14, 0),
                leadTimeList: [
                    { leadFormCode: 'offset', leadAmount: 3, leadUnitCode: 'days' },
                ],
            }),
            [at(2026, 5, 7, 14, 0)],
            'three days by multiplication, the same arithmetic readToDo uses',
        );
    });

    test('A clock lead time of two days before at midday uses the times handed in', () => {
        assertSame(
            momentsOf({
                leadTimeList: [
                    { leadFormCode: 'clock', leadDaysBefore: 2, leadNamedTimeCode: 'midday' },
                ],
            }),
            [at(2026, 5, 1, 13, 45)],
            'midday is thirteen forty-five from CLOCK, not Settings\' noon',
        );
    });

    test('A clock lead time of zero days before at morning is that morning on the due day', () => {
        assertSame(
            momentsOf({
                leadTimeList: [
                    { leadFormCode: 'clock', leadDaysBefore: 0, leadNamedTimeCode: 'morning' },
                ],
            }),
            [at(2026, 5, 3, 7, 15)],
            'zero days before is the base moment\'s own calendar day',
        );
    });

    // ---- an empty list means nothing to say, for every kind ----

    test('An empty lead-time list gives nothing for a date item', () => {
        assertSame(momentsOf({ leadTimeList: [] }), [], 'nothing to say');
    });

    test('An empty lead-time list gives nothing for a daily item', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'myday',
                triggerKindCode: 'daily',
                dueHour: 18,
                dueMinute: 0,
                leadTimeList: [],
            }),
            [],
            'nothing to say, and the kind does not change that',
        );
    });

    test('An empty lead-time list gives nothing for a weekly item', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'myweek',
                triggerKindCode: 'weekly',
                dueWeekday: 3,
                dueHour: 18,
                dueMinute: 0,
                leadTimeList: [],
            }),
            [],
            'nothing to say, and the kind does not change that',
        );
    });

    // ---- gone-by moments, missing numbers, and order ----

    test('A lead time already gone by is dropped and the others still come back', () => {
        // The appointment is today at ten. Two hours before is eight, which
        // has gone by at nine. Nothing-before is ten, which has not.
        assertSame(
            momentsOf({
                dueMoment: at(2026, 5, 1, 10, 0),
                leadTimeList: [
                    { leadFormCode: 'offset', leadAmount: 2, leadUnitCode: 'hours' },
                    NOTHING_BEFORE,
                ],
            }),
            [at(2026, 5, 1, 10, 0)],
            'the spent lead time is dropped and the one still ahead stands',
        );
    });

    test('A date item with no due moment gives nothing', () => {
        assertSame(
            momentsOf({ dueMoment: undefined }),
            [],
            'there is no number to count back from',
        );
    });

    test('A daily item with no hour gives nothing', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'myday',
                triggerKindCode: 'daily',
                dueHour: undefined,
                dueMinute: undefined,
            }),
            [],
            'there is no number to count back from',
        );
    });

    test('Two lead times give two moments in the order they were given', () => {
        assertSame(
            momentsOf({
                leadTimeList: [
                    { leadFormCode: 'offset', leadAmount: 30, leadUnitCode: 'minutes' },
                    { leadFormCode: 'offset', leadAmount: 2, leadUnitCode: 'hours' },
                ],
            }),
            [at(2026, 5, 3, 13, 30), at(2026, 5, 3, 12, 0)],
            'the order of the lead times is kept; sorting is the reconcile\'s',
        );
    });
}
