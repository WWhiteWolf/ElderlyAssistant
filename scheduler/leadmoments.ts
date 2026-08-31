// The piece that turns a lead time into a moment on the clock.
//
// A shaped item says when it comes due. It does not say which moments to
// actually arm. For the four screens built so far those were the same thing.
// To-Do is different: each reminder on a task is a moment of its own, counted
// back from the appointment. This is the counting.
//
// Every screen states its own lead times. An empty list means nothing to say.
// There is no branch on a three-word trigger to interpret the list, and none
// is to be added.
//
// `now` is handed in rather than read from the clock, so a test can say what
// time it is. The file reads nothing, writes nothing, and knows nothing about
// the phone, so Node can check it in a fraction of a second.

import type { LeadTime, RepeatWeekday, ShapedItem } from './inputshape.ts';

/** A time of day, as Settings holds it. */
export interface TimeOfDay {
    hour: number;
    minute: number;
}

/** The three fixed times of day, read from Settings by the caller. */
export interface ClockTimes {
    morning: TimeOfDay;
    midday: TimeOfDay;
    evening: TimeOfDay;
}

/**
 * The next due moment, and whether the last-existing-day rule had to move it.
 */
export interface BaseMoment {
    moment: number;
    shiftedForMissingDayBit: boolean;
}

/**
 * The moments this item wants speaking, counted from its due moment and its
 * lead times.
 *
 * An empty lead-time list comes back empty, for every kind. Missing numbers
 * the arithmetic needs come back empty as well — guessing a time would be
 * worse, and whether the item is wanted has already been answered further
 * back. Only moments after `now` are returned.
 */
export function momentsFor(
    item: ShapedItem,
    now: number,
    clockTimes: ClockTimes,
): number[] {
    // Nothing to count back from, in the only sense that matters here: the
    // screen said it wants no speaking.
    if (item.leadTimeList.length === 0) {
        return [];
    }

    const base = baseMoment(item, now);
    if (base === null) {
        return [];
    }

    const moments: number[] = [];
    for (const lead of item.leadTimeList) {
        const at = momentFromLead(lead, base.moment, clockTimes);
        // A moment at or before now has already gone. readToDo drops these
        // today, and it must keep happening. stillwanted.ts cannot do it,
        // because that block sees an item and this piece sees the moments.
        if (at > now) {
            moments.push(at);
        }
    }
    return moments;
}

/**
 * The moment the lead times are counted back from.
 *
 * When the item floats with the phone, local dates mean the machine's ordinary
 * Date, as step 1. When it does not, the civil date and the due clock time
 * are worked in the named zone, and the last-existing-day rule and the
 * weekday counts are in that same zone. A missing zone while the bit is false
 * returns null — the engine does not guess a zone.
 */
export function baseMoment(item: ShapedItem, now: number): BaseMoment | null {
    const calendar = calendarFor(item);
    if (calendar === null) {
        return null;
    }
    const found = nextBase(item, now, calendar);
    if (found === null) {
        return null;
    }
    const moved = applyHolidayMove(found, item, calendar);
    if (item.repeatUntilMoment !== undefined && moved.moment > item.repeatUntilMoment) {
        return null;
    }
    return moved;
}

/**
 * The days in this month that this item actually falls on.
 *
 * The page asks this so shading is a view of the same calculation that
 * finds the next occurrence, including a last-existing day and a holiday
 * move. It is not a scheduling instruction, and it does not guess from
 * the weekday alone.
 */
export function shadedDaysInMonth(item: ShapedItem, year: number, month: number): number[] {
    const last = new Date(year, month + 1, 0).getDate();
    const days: number[] = [];
    for (let day = 1; day <= last; day++) {
        const before = new Date(year, month, day, 0, 0, 0, 0).getTime() - 1;
        const found = baseMoment(item, before);
        if (found === null) {
            continue;
        }
        const when = new Date(found.moment);
        if (when.getFullYear() === year && when.getMonth() === month && when.getDate() === day) {
            days.push(day);
        }
    }
    return days;
}

/**
 * One calendar block: if this occurrence falls on a US federal holiday,
 * move it one day before or after. A missing-day shift is left as it is.
 */
function applyHolidayMove(
    found: BaseMoment,
    item: ShapedItem,
    calendar: CivilCalendar,
): BaseMoment {
    if (item.holidayMoveCode === undefined) {
        return found;
    }
    if (found.shiftedForMissingDayBit) {
        return found;
    }
    const parts = calendar.partsOf(found.moment);
    if (!isUsFederalHoliday(parts.year, parts.month, parts.day)) {
        return found;
    }
    const step = item.holidayMoveCode === 'before' ? -1 : 1;
    return {
        moment: addCalendarDays(calendar, found.moment, step),
        shiftedForMissingDayBit: false,
    };
}

/** How many units between occurrences, 1 when the count is left off. */
function intervalOf(item: ShapedItem): number {
    return item.repeatIntervalCount === undefined ? 1 : item.repeatIntervalCount;
}

function nextBase(item: ShapedItem, now: number, calendar: CivilCalendar): BaseMoment | null {
    if (item.repeatUnitCode === undefined) {
        if (item.dueMoment === undefined) {
            return null;
        }
        return { moment: item.dueMoment, shiftedForMissingDayBit: false };
    }
    switch (item.repeatUnitCode) {
        case 'day':
            return nextDaily(item, now, calendar);
        case 'week':
            return nextWeekly(item, now, calendar);
        case 'month':
            return item.repeatWeekdayList !== undefined && item.repeatWeekdayList.length > 0
                ? nextMonthlyByWeekday(item, now, calendar)
                : nextByMonthDay(item, now, calendar, false);
        case 'year':
            return nextByMonthDay(item, now, calendar, true);
    }
}

function nextDaily(item: ShapedItem, now: number, calendar: CivilCalendar): BaseMoment | null {
    if (item.dueHour === undefined || item.dueMinute === undefined) {
        return null;
    }
    const step = intervalOf(item);
    const start = calendar.partsOf(now);
    let moment = calendar.at(start.year, start.month, start.day, item.dueHour, item.dueMinute);
    while (moment <= now) {
        moment = addCalendarDays(calendar, moment, step);
    }
    return { moment, shiftedForMissingDayBit: false };
}

function nextWeekly(item: ShapedItem, now: number, calendar: CivilCalendar): BaseMoment | null {
    if (item.dueHour === undefined
        || item.dueMinute === undefined
        || item.repeatWeekdayList === undefined
        || item.repeatWeekdayList.length === 0) {
        return null;
    }
    const wanted = new Set(item.repeatWeekdayList.map((one) => one.weekdayNumber));
    const start = calendar.partsOf(now);
    let moment = calendar.at(start.year, start.month, start.day, item.dueHour, item.dueMinute);
    while (!wanted.has(calendar.partsOf(moment).weekday)) {
        moment = addCalendarDays(calendar, moment, 1);
    }
    if (moment <= now) {
        moment = addCalendarDays(calendar, moment, 7);
    }
    const extraWeeks = intervalOf(item) - 1;
    if (extraWeeks > 0) {
        moment = addCalendarDays(calendar, moment, extraWeeks * 7);
    }
    return { moment, shiftedForMissingDayBit: false };
}

/**
 * Month or year, using the day of the month as the seed.
 *
 * The seed day comes from `dueMoment` when it is present, otherwise from
 * `now`'s date. Year also takes the month of the year from that same seed.
 * A day that does not exist in the target month uses the last day that does,
 * and that occurrence is marked shifted.
 */
function nextByMonthDay(
    item: ShapedItem,
    now: number,
    calendar: CivilCalendar,
    yearly: boolean,
): BaseMoment | null {
    if (item.dueHour === undefined || item.dueMinute === undefined) {
        return null;
    }
    const seed = calendar.partsOf(item.dueMoment !== undefined ? item.dueMoment : now);
    const seedDay = seed.day;
    const seedMonth = seed.month;
    const step = intervalOf(item);
    const start = calendar.partsOf(now);
    if (yearly) {
        let year = start.year;
        for (let n = 0; n < 8; n++) {
            const candidate = civilAt(calendar, year, seedMonth, seedDay, item.dueHour, item.dueMinute);
            if (candidate.moment > now) {
                return candidate;
            }
            year += step;
        }
        return null;
    }
    let year = start.year;
    let month = start.month;
    for (let n = 0; n < 48; n++) {
        const candidate = civilAt(calendar, year, month, seedDay, item.dueHour, item.dueMinute);
        if (candidate.moment > now) {
            return candidate;
        }
        const next = addMonths(year, month, step);
        year = next.year;
        month = next.month;
    }
    return null;
}

function nextMonthlyByWeekday(
    item: ShapedItem,
    now: number,
    calendar: CivilCalendar,
): BaseMoment | null {
    if (item.dueHour === undefined || item.dueMinute === undefined
        || item.repeatWeekdayList === undefined) {
        return null;
    }
    const list = item.repeatWeekdayList;
    const step = intervalOf(item);
    const start = calendar.partsOf(now);
    let year = start.year;
    let month = start.month;
    for (let n = 0; n < 48; n++) {
        const candidates: BaseMoment[] = [];
        for (const weekday of list) {
            let days = daysMatching(year, month, weekday);
            if (item.repeatAfterDayCount !== undefined) {
                // Only the first weekday after the numbered day is the occurrence.
                days = days.filter((day) => day > item.repeatAfterDayCount);
                if (days.length > 0) {
                    days = [days[0]];
                }
            }
            for (const day of days) {
                candidates.push({
                    moment: calendar.at(year, month, day, item.dueHour, item.dueMinute),
                    shiftedForMissingDayBit: false,
                });
            }
        }
        const later = candidates.filter((one) => one.moment > now);
        if (later.length > 0) {
            later.sort((a, b) => a.moment - b.moment);
            return later[0];
        }
        const next = addMonths(year, month, step);
        year = next.year;
        month = next.month;
    }
    return null;
}

function daysMatching(year: number, month: number, weekday: RepeatWeekday): number[] {
    const dates: number[] = [];
    const last = lastDayOfMonth(year, month);
    for (let day = 1; day <= last; day++) {
        if (weekdayOfCivilDate(year, month, day) === weekday.weekdayNumber) {
            dates.push(day);
        }
    }
    if (weekday.weekdayOrdinalCount === undefined) {
        return dates;
    }
    if (weekday.weekdayOrdinalCount === -1) {
        return dates.length === 0 ? [] : [dates[dates.length - 1]];
    }
    const index = weekday.weekdayOrdinalCount - 1;
    if (index < 0 || index >= dates.length) {
        return [];
    }
    return [dates[index]];
}

function civilAt(
    calendar: CivilCalendar,
    year: number,
    month: number,
    seedDay: number,
    hour: number,
    minute: number,
): BaseMoment {
    const lastDay = lastDayOfMonth(year, month);
    const day = Math.min(seedDay, lastDay);
    return {
        moment: calendar.at(year, month, day, hour, minute),
        shiftedForMissingDayBit: day !== seedDay,
    };
}

function lastDayOfMonth(year: number, month: number): number {
    return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function weekdayOfCivilDate(year: number, month: number, day: number): number {
    return new Date(Date.UTC(year, month, day)).getUTCDay();
}

/**
 * The nationwide US federal holidays, including the Friday or Monday
 * observed when a fixed-date holiday falls on a weekend.
 *
 * The list is New Year's Day, Martin Luther King Jr. Day, Washington's
 * Birthday, Memorial Day, Juneteenth, Independence Day, Labor Day,
 * Columbus Day, Veterans Day, Thanksgiving, and Christmas. Inauguration
 * Day is not on it: that one is only for the DC area.
 */
function isUsFederalHoliday(year: number, month: number, day: number): boolean {
    if (isActualUsFederalHoliday(year, month, day)) {
        return true;
    }
    const weekday = weekdayOfCivilDate(year, month, day);
    if (weekday === 5) {
        const next = addUtcDays(year, month, day, 1);
        return isFixedDateUsFederalHoliday(next.year, next.month, next.day);
    }
    if (weekday === 1) {
        const prev = addUtcDays(year, month, day, -1);
        return isFixedDateUsFederalHoliday(prev.year, prev.month, prev.day);
    }
    return false;
}

function isActualUsFederalHoliday(year: number, month: number, day: number): boolean {
    if (isFixedDateUsFederalHoliday(year, month, day)) {
        return true;
    }
    if (month === 0 && day === nthWeekdayOfMonth(year, 0, 1, 3)) return true;
    if (month === 1 && day === nthWeekdayOfMonth(year, 1, 1, 3)) return true;
    if (month === 4 && day === nthWeekdayOfMonth(year, 4, 1, -1)) return true;
    if (month === 8 && day === nthWeekdayOfMonth(year, 8, 1, 1)) return true;
    if (month === 9 && day === nthWeekdayOfMonth(year, 9, 1, 2)) return true;
    if (month === 10 && day === nthWeekdayOfMonth(year, 10, 4, 4)) return true;
    return false;
}

function isFixedDateUsFederalHoliday(year: number, month: number, day: number): boolean {
    void year;
    if (month === 0 && day === 1) return true;
    if (month === 5 && day === 19) return true;
    if (month === 6 && day === 4) return true;
    if (month === 10 && day === 11) return true;
    if (month === 11 && day === 25) return true;
    return false;
}

function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): number {
    const last = lastDayOfMonth(year, month);
    const dates: number[] = [];
    for (let day = 1; day <= last; day++) {
        if (weekdayOfCivilDate(year, month, day) === weekday) {
            dates.push(day);
        }
    }
    if (dates.length === 0) {
        return 0;
    }
    if (n === -1) {
        return dates[dates.length - 1];
    }
    return dates[n - 1] ?? 0;
}

function addUtcDays(
    year: number,
    month: number,
    day: number,
    count: number,
): { year: number; month: number; day: number } {
    const noon = new Date(Date.UTC(year, month, day, 12, 0, 0));
    noon.setUTCDate(noon.getUTCDate() + count);
    return { year: noon.getUTCFullYear(), month: noon.getUTCMonth(), day: noon.getUTCDate() };
}

function addMonths(year: number, month: number, count: number): { year: number; month: number } {
    const total = year * 12 + month + count;
    return { year: Math.floor(total / 12), month: total % 12 };
}

/**
 * The civil calendar an item's due rule is worked in.
 *
 * Floating items use the machine's ordinary Date. Named-zone items use that
 * zone's wall clock, so eight in the morning means eight in that zone.
 */
interface CivilParts {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    weekday: number;
}

interface CivilCalendar {
    partsOf(ms: number): CivilParts;
    at(year: number, month: number, day: number, hour: number, minute: number): number;
}

function calendarFor(item: ShapedItem): CivilCalendar | null {
    if (item.floatsWithPhoneBit) {
        return localCalendar;
    }
    const zone = item.dueTimeZoneText;
    if (zone === undefined || zone === '') {
        return null;
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: zone }).format(new Date(0));
    } catch {
        return null;
    }
    return zoneCalendar(zone);
}

const localCalendar: CivilCalendar = {
    partsOf(ms: number): CivilParts {
        const when = new Date(ms);
        return {
            year: when.getFullYear(),
            month: when.getMonth(),
            day: when.getDate(),
            hour: when.getHours(),
            minute: when.getMinutes(),
            weekday: when.getDay(),
        };
    },
    at(year: number, month: number, day: number, hour: number, minute: number): number {
        return new Date(year, month, day, hour, minute, 0, 0).getTime();
    },
};

function zoneCalendar(timeZone: string): CivilCalendar {
    return {
        partsOf(ms: number): CivilParts {
            return partsInZone(ms, timeZone);
        },
        at(year: number, month: number, day: number, hour: number, minute: number): number {
            return fromZonedCivil(year, month, day, hour, minute, timeZone);
        },
    };
}

function partsInZone(ms: number, timeZone: string): CivilParts {
    const fmt = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
    });
    const map = new Map<string, string>();
    for (const part of fmt.formatToParts(new Date(ms))) {
        if (part.type !== 'literal') {
            map.set(part.type, part.value);
        }
    }
    const year = Number(map.get('year'));
    const month = Number(map.get('month')) - 1;
    const day = Number(map.get('day'));
    return {
        year,
        month,
        day,
        hour: Number(map.get('hour')),
        minute: Number(map.get('minute')),
        weekday: weekdayOfCivilDate(year, month, day),
    };
}

/**
 * The instant at which a named zone's wall clock shows this civil time.
 *
 * The first guess treats the numbers as UTC, then walks the difference
 * between what the zone actually shows and what was asked for. A second pass
 * covers the clocks going forward or back.
 */
function fromZonedCivil(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number,
    timeZone: string,
): number {
    let instant = Date.UTC(year, month, day, hour, minute, 0, 0);
    const wanted = Date.UTC(year, month, day, hour, minute, 0, 0);
    for (let n = 0; n < 4; n++) {
        const shown = partsInZone(instant, timeZone);
        const shownAsUtc = Date.UTC(shown.year, shown.month, shown.day, shown.hour, shown.minute, 0, 0);
        const delta = wanted - shownAsUtc;
        if (delta === 0) {
            return instant;
        }
        instant += delta;
    }
    return instant;
}

function addCalendarDays(calendar: CivilCalendar, moment: number, count: number): number {
    const parts = calendar.partsOf(moment);
    const noon = new Date(Date.UTC(parts.year, parts.month, parts.day, 12, 0, 0));
    noon.setUTCDate(noon.getUTCDate() + count);
    return calendar.at(
        noon.getUTCFullYear(),
        noon.getUTCMonth(),
        noon.getUTCDate(),
        parts.hour,
        parts.minute,
    );
}

/**
 * One lead time, as a moment, counted back from the base.
 *
 * Offset amounts are converted by multiplication, exactly as readToDo does
 * it today — minutes times sixty thousand, hours times three million six
 * hundred thousand, days times eighty-six million four hundred thousand.
 * Clock lead times step the calendar day, which is also what readToDo does.
 */
function momentFromLead(lead: LeadTime, base: number, clockTimes: ClockTimes): number {
    if (lead.leadFormCode === 'offset') {
        let howLongBefore = 0;
        if (lead.leadUnitCode === 'minutes') howLongBefore = lead.leadAmount * 60 * 1000;
        if (lead.leadUnitCode === 'hours') howLongBefore = lead.leadAmount * 60 * 60 * 1000;
        if (lead.leadUnitCode === 'days') howLongBefore = lead.leadAmount * 24 * 60 * 60 * 1000;
        return base - howLongBefore;
    }
    const which = clockTimes[lead.leadNamedTimeCode];
    const fire = new Date(base);
    fire.setHours(0, 0, 0, 0);
    fire.setDate(fire.getDate() - lead.leadDaysBefore);
    fire.setHours(which.hour, which.minute, 0, 0);
    return fire.getTime();
}
