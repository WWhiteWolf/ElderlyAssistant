// The piece that turns a lead time into a moment on the clock.
//
// A shaped item says when it comes due. It does not say which moments to
// actually arm. For the four screens built so far those were the same thing.
// To-Do is different: each reminder on a task is a moment of its own, counted
// back from the appointment. This is the counting.
//
// Every screen states its own lead times. An empty list means nothing to say.
// There is no branch on the trigger kind to interpret the list, and none is
// to be added.
//
// `now` is handed in rather than read from the clock, so a test can say what
// time it is. The file reads nothing, writes nothing, and knows nothing about
// the phone, so Node can check it in a fraction of a second.

import type { LeadTime, ShapedItem } from './inputshape.ts';

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
 * The moments this item wants speaking, counted from its due moment and its
 * lead times.
 *
 * An empty lead-time list comes back empty, for every kind. Missing numbers
 * the arithmetic needs come back empty as well — guessing a time would be
 * worse, and whether the item is wanted has already been answered further
 * back.
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
        const at = momentFromLead(lead, base, clockTimes);
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
 * This is the one place that reads the trigger kind. Daily and weekly items
 * step the calendar day rather than adding twenty-four hours, so the time of
 * day survives the clocks going forward or back.
 */
function baseMoment(item: ShapedItem, now: number): number | null {
    switch (item.triggerKindCode) {
        case 'date':
            return item.dueMoment === undefined ? null : item.dueMoment;
        case 'daily': {
            if (item.dueHour === undefined || item.dueMinute === undefined) {
                return null;
            }
            const when = new Date(now);
            when.setHours(item.dueHour, item.dueMinute, 0, 0);
            if (when.getTime() <= now) {
                when.setDate(when.getDate() + 1);
            }
            return when.getTime();
        }
        case 'weekly': {
            if (item.dueHour === undefined
                || item.dueMinute === undefined
                || item.dueWeekday === undefined) {
                return null;
            }
            const when = new Date(now);
            when.setHours(item.dueHour, item.dueMinute, 0, 0);
            while (when.getDay() !== item.dueWeekday) {
                when.setDate(when.getDate() + 1);
            }
            if (when.getTime() <= now) {
                when.setDate(when.getDate() + 7);
            }
            return when.getTime();
        }
    }
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
