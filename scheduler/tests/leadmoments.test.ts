// Tests for the piece that turns a lead time into a moment on the clock.

import { momentsFor, shadedDaysInMonth } from '../leadmoments.ts';
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
        sourceScreenCode: 'monthly',
        itemIdText: 'a1',
        itemNameText: 'Book the boiler',
        hasDueTimeBit: true,
        dueMoment: at(2026, 5, 3, 14, 0),
        floatsWithPhoneBit: true,
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
                sourceScreenCode: 'daily',
                repeatUnitCode: 'day',
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
                sourceScreenCode: 'daily',
                repeatUnitCode: 'day',
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
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 3 }],
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
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 1 }],
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
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 1 }],
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
                sourceScreenCode: 'daily',
                repeatUnitCode: 'day',
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
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 3 }],
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
                sourceScreenCode: 'daily',
                repeatUnitCode: 'day',
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

    // ---- the repeat group, constructed directly ----

    test('Every other week is interval 2 on unit week', () => {
        // NOW is Monday. The next Wednesday is the 3rd. Interval 2 then adds
        // one extra week, so the armed moment is the Wednesday after that.
        assertSame(
            momentsOf({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatIntervalCount: 2,
                repeatWeekdayList: [{ weekdayNumber: 3 }],
                dueHour: 18,
                dueMinute: 0,
            }),
            [at(2026, 5, 10, 18, 0)],
            'the next matching weekday, then seven times (interval minus one) days',
        );
    });

    test('The second Thursday is unit month, Thursday with ordinal 2', () => {
        assertSame(
            momentsOf({
                repeatUnitCode: 'month',
                repeatWeekdayList: [{ weekdayNumber: 4, weekdayOrdinalCount: 2 }],
                dueHour: 8,
                dueMinute: 0,
            }),
            [at(2026, 5, 11, 8, 0)],
            'June 2026\'s Thursdays are the 4th, 11th, 18th and 25th; the second is the 11th',
        );
    });

    test('Wednesday after the 6th, at eight in the morning, is the Social Security stretch', () => {
        assertSame(
            momentsOf({
                repeatUnitCode: 'month',
                repeatWeekdayList: [{ weekdayNumber: 3 }],
                repeatAfterDayCount: 6,
                dueHour: 8,
                dueMinute: 0,
            }),
            [at(2026, 5, 10, 8, 0)],
            'from Monday 1 June 2026 at nine, the next moment is Wednesday 10 June at eight',
        );
    });

    test('Wednesday after the 6th, once that Wednesday has gone, is next month\'s first after the 6th', () => {
        assertSame(
            momentsFor(
                item({
                    repeatUnitCode: 'month',
                    repeatWeekdayList: [{ weekdayNumber: 3 }],
                    repeatAfterDayCount: 6,
                    dueHour: 8,
                    dueMinute: 0,
                }),
                at(2026, 5, 11, 9, 0),
                CLOCK,
            ),
            [at(2026, 6, 8, 8, 0)],
            'the 17th and 24th of June are later Wednesdays, not the first after the 6th',
        );
    });

    test('The 31st of every month at noon, from 15 January 2026, is 31 January', () => {
        assertSame(
            momentsFor(
                item({
                    repeatUnitCode: 'month',
                    dueHour: 12,
                    dueMinute: 0,
                    dueMoment: at(2026, 0, 31, 12, 0),
                }),
                at(2026, 0, 15, 9, 0),
                CLOCK,
            ),
            [at(2026, 0, 31, 12, 0)],
            'January has a 31st, so that day stands unshifted',
        );
    });

    test('The 31st of every month at noon, from 1 February 2026, is 28 February', () => {
        assertSame(
            momentsFor(
                item({
                    repeatUnitCode: 'month',
                    dueHour: 12,
                    dueMinute: 0,
                    dueMoment: at(2026, 0, 31, 12, 0),
                }),
                at(2026, 1, 1, 9, 0),
                CLOCK,
            ),
            [at(2026, 1, 28, 12, 0)],
            'February 2026 has no 31st, so the last day that exists is used',
        );
    });

    test('A last date of 1 March 2026 on a daily item due at eight, from 1 March at nine, produces no moment', () => {
        assertSame(
            momentsFor(
                item({
                    repeatUnitCode: 'day',
                    repeatUntilMoment: at(2026, 2, 1, 0, 0),
                    dueHour: 8,
                    dueMinute: 0,
                }),
                at(2026, 2, 1, 9, 0),
                CLOCK,
            ),
            [],
            'the next moment would be 2 March, which is after the last date',
        );
    });

    // ---- time: float with the phone, or a named zone ----

    test('A daily eight o\'clock with the bit true still matches step 1', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'daily',
                repeatUnitCode: 'day',
                floatsWithPhoneBit: true,
                dueHour: 8,
                dueMinute: 0,
            }),
            [at(2026, 5, 2, 8, 0)],
            'NOW is nine, so eight o\'clock has gone by and the base is tomorrow',
        );
    });

    test('A daily eight o\'clock in America/New_York, from noon UTC in June, arms eight in that zone', () => {
        // 15 June 2026 at 12:00 UTC is 08:00 in America/New_York (EDT, UTC-4).
        // Eight o\'clock today is at or before now, so the next moment is
        // 16 June at 08:00 in that zone, which is 16 June 12:00 UTC. The
        // expected value is written as UTC so the test does not depend on
        // where it is run.
        const noonUtc = Date.UTC(2026, 5, 15, 12, 0, 0);
        const eightNextMorningInZone = Date.UTC(2026, 5, 16, 12, 0, 0);
        assertSame(
            momentsFor(
                item({
                    repeatUnitCode: 'day',
                    floatsWithPhoneBit: false,
                    dueTimeZoneText: 'America/New_York',
                    dueHour: 8,
                    dueMinute: 0,
                }),
                noonUtc,
                CLOCK,
            ),
            [eightNextMorningInZone],
            'eight o\'clock in that zone, not eight o\'clock on the machine',
        );
    });

    test('An appointment at half past midnight in America/Los_Angeles fires in that zone, not on the machine', () => {
        // 15 June 2026 at 00:30 in America/Los_Angeles is PDT (UTC-7),
        // which is 15 June 07:30 UTC. The translator packs the civil
        // numbers as a local Date; the engine must read them in the
        // named zone. Expected is UTC so the test does not depend on
        // where it is run.
        const before = Date.UTC(2026, 5, 14, 12, 0, 0);
        const halfPastInZone = Date.UTC(2026, 5, 15, 7, 30, 0);
        assertSame(
            momentsFor(
                item({
                    sourceScreenCode: 'appointments',
                    floatsWithPhoneBit: false,
                    dueTimeZoneText: 'America/Los_Angeles',
                    dueMoment: at(2026, 5, 15, 0, 30),
                    leadTimeList: [NOTHING_BEFORE],
                }),
                before,
                CLOCK,
            ),
            [halfPastInZone],
            '00:30 in that zone, not 00:30 on the machine',
        );
    });

    // ---- holidays: before or after a US federal holiday ----

    test('A Saturday weekly on Independence Day 2026 moves to the Friday before', () => {
        // 4 July 2026 is a Saturday. The next Saturday from Friday the 3rd
        // at nine is the 4th at ten. Day before is Friday the 3rd at ten.
        assertSame(
            momentsOf({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 6 }],
                dueHour: 10,
                dueMinute: 0,
                holidayMoveCode: 'before',
            }, at(2026, 6, 3, 9, 0)),
            [at(2026, 6, 3, 10, 0)],
            'the occurrence was the holiday, so it fires the day before',
        );
    });

    test('A Saturday weekly on Independence Day 2026 moves to the Sunday after', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 6 }],
                dueHour: 10,
                dueMinute: 0,
                holidayMoveCode: 'after',
            }, at(2026, 6, 3, 9, 0)),
            [at(2026, 6, 5, 10, 0)],
            'the occurrence was the holiday, so it fires the day after',
        );
    });

    test('A Saturday weekly on Independence Day 2026 stays put when holidays are unused', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 6 }],
                dueHour: 10,
                dueMinute: 0,
            }, at(2026, 6, 3, 9, 0)),
            [at(2026, 6, 4, 10, 0)],
            'no holiday code means the Saturday itself',
        );
    });

    test('A Friday weekly on the observed Independence Day 2026 moves to Saturday', () => {
        // 4 July 2026 is Saturday, so Friday the 3rd is the observed day.
        assertSame(
            momentsOf({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 5 }],
                dueHour: 10,
                dueMinute: 0,
                holidayMoveCode: 'after',
            }, at(2026, 6, 2, 9, 0)),
            [at(2026, 6, 4, 10, 0)],
            'the federal list includes the Friday or Monday when a fixed-date holiday falls on a weekend',
        );
    });

    test('An appointment on Thanksgiving 2026 moves to the Wednesday before', () => {
        assertSame(
            momentsOf({
                sourceScreenCode: 'appointments',
                dueMoment: at(2026, 10, 26, 9, 0),
                holidayMoveCode: 'before',
                leadTimeList: [NOTHING_BEFORE],
            }, at(2026, 10, 1, 9, 0)),
            [at(2026, 10, 25, 9, 0)],
            'Thanksgiving is the fourth Thursday of November',
        );
    });

    // ---- calendar shading: the same calculation, expanded across a month ----

    test('A weekly Wednesday in June 2026 shades every Wednesday', () => {
        assertSame(
            shadedDaysInMonth(item({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 3 }],
                dueHour: 18,
                dueMinute: 0,
            }), 2026, 5),
            [3, 10, 17, 24],
            'June 2026\'s Wednesdays, from the engine, not from matching today\'s weekday',
        );
    });

    test('A monthly 15th in June 2026 shades the 15th only', () => {
        assertSame(
            shadedDaysInMonth(item({
                repeatUnitCode: 'month',
                dueHour: 12,
                dueMinute: 0,
                dueMoment: at(2026, 5, 15, 12, 0),
            }), 2026, 5),
            [15],
            'the 15th is a Monday that month, and the other Mondays stay clear',
        );
    });

    test('A monthly 31st in February 2026 shades the last day that exists', () => {
        assertSame(
            shadedDaysInMonth(item({
                repeatUnitCode: 'month',
                dueHour: 12,
                dueMinute: 0,
                dueMoment: at(2026, 0, 31, 12, 0),
            }), 2026, 1),
            [28],
            'February 2026 has no 31st, so the 28th is the visible day',
        );
    });

    test('The second Thursday in June 2026 shades the 11th', () => {
        assertSame(
            shadedDaysInMonth(item({
                repeatUnitCode: 'month',
                repeatWeekdayList: [{ weekdayNumber: 4, weekdayOrdinalCount: 2 }],
                dueHour: 8,
                dueMinute: 0,
            }), 2026, 5),
            [11],
            'the same Thursday the next-occurrence calculation already named',
        );
    });

    test('Wednesday after the 6th in June 2026 shades the first Wednesday after the 6th only', () => {
        assertSame(
            shadedDaysInMonth(item({
                repeatUnitCode: 'month',
                repeatWeekdayList: [{ weekdayNumber: 3 }],
                repeatAfterDayCount: 6,
                dueHour: 8,
                dueMinute: 0,
            }), 2026, 5),
            [10],
            'the 17th and 24th stay clear; only the first occurrence after the 6th shows',
        );
    });

    test('A Saturday weekly in July 2026 with holidays before shades the 3rd instead of the 4th', () => {
        assertSame(
            shadedDaysInMonth(item({
                sourceScreenCode: 'weekly',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 6 }],
                dueHour: 10,
                dueMinute: 0,
                holidayMoveCode: 'before',
            }), 2026, 6),
            [3, 11, 18, 25],
            'Independence Day is Saturday the 4th, so the visible day is Friday the 3rd',
        );
    });
}
