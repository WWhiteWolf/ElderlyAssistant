// The join: shaped items become the reminders the phone should hold.
//
// The translator says what an item is. The two blocks say whether it is still
// wanted and how many occurrences to arm. Lead moments turn each lead time
// into a clock time. This file is the last step: it writes those answers as
// WantedReminder records, which is the shape the reconcile already speaks.
//
// Nothing here goes by page. A push-back's source name stays tied to the
// current source of the saved kind, so a tapped banner still finds its page.
// That is output naming, not a second judgment.
//
// `now` is handed in rather than read from the clock. The file reads nothing,
// writes nothing, and knows nothing about the phone, so Node can check it.

import { isStillWanted } from './stillwanted.ts';
import { baseMoment, momentsFor } from './leadmoments.ts';
import type { ClockTimes } from './leadmoments.ts';
import { armDepthFor } from './armdepth.ts';
import type { ShapedItem, SourceScreenCode } from './inputshape.ts';
import { makeKey } from './types.ts';
import type { WantedReminder } from './types.ts';
import { dayStamp, sameDay } from './readers/occurrences.ts';

/**
 * Every reminder these shaped items call for, in the order the items were
 * given. An item that is not wanted produces nothing. A push-back stands
 * beside the base occurrence; it does not replace it.
 */
export function remindersFor(
    items: ShapedItem[],
    now: number,
    clockTimes: ClockTimes,
): WantedReminder[] {
    const wanted: WantedReminder[] = [];
    for (const item of items) {
        const answer = isStillWanted(item, now);
        if (!answer.wantsRemindersBit) {
            continue;
        }

        // A push-back first, as every old reader did, so a promised snooze is
        // not lost behind a missing due time.
        if (answer.pushedBackToMoment != null) {
            const reminder = pushBackReminder(item, answer.pushedBackToMoment);
            if (reminder !== null) {
                wanted.push(reminder);
            }
        }

        const skippedThisCycle = answer.skippedThisCycleBit;

        // A weekly item that is done arms nothing further. Skip must not take
        // that path: it arms the next event on this run.
        if (answer.dropsThisOccurrenceBit && item.repeatUnitCode === 'week' && !skippedThisCycle) {
            continue;
        }

        if (item.repeatUnitCode === undefined) {
            // Depth is how many occurrences to arm, not how many lead times
            // one occurrence carries. An appointment's several reminders all
            // belong to the one appointment.
            if (answer.dropsThisOccurrenceBit) {
                continue;
            }
            for (const lead of item.leadTimeList) {
                const ats = momentsFor({ ...item, leadTimeList: [lead] }, now, clockTimes);
                for (const at of ats) {
                    wanted.push(baseReminder(item, at, lead.leadPartText ?? 'base'));
                }
            }
            continue;
        }

        // Skip asks for the cycle after the skipped one, so the clock handed
        // to momentsFor is the skipped stamp rather than now. Daily Done asks
        // for tomorrow: today's notice is gone, and tomorrow is the one armed
        // date. Depth stays one.
        let from = now;
        if (skippedThisCycle && item.skippedCycleStamp !== undefined) {
            from = item.skippedCycleStamp;
        } else if (answer.dropsThisOccurrenceBit && item.repeatUnitCode === 'day') {
            from = startOfNextLocalDay(now);
        }
        let moments = momentsFor(item, from, clockTimes);
        if (answer.dropsThisOccurrenceBit && !skippedThisCycle) {
            const today = new Date(now);
            moments = moments.filter((at) => !sameDay(new Date(at), today));
        }
        moments = moments.slice(0, armDepthFor());

        const base = baseMoment(item, from);
        const shifted = base !== null && base.shiftedForMissingDayBit;
        for (const at of moments) {
            wanted.push(baseReminder(item, at, undefined, shifted));
        }
    }
    return wanted;
}

/** The first instant of the local calendar day after `now`. */
function startOfNextLocalDay(now: number): number {
    const day = new Date(now);
    return new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1, 0, 0, 0, 0).getTime();
}

/** The current source for a possible push-back, or null when it cannot happen. */
function pushBackSource(screen: SourceScreenCode): string | null {
    switch (screen) {
        case 'daily':
            return 'dailysnooze';
        case 'weekly':
            return 'weeklysnooze';
        case 'monthly':
            return 'monthlydelay';
        case 'quarterly':
            return 'quarterlydelay';
        case 'yearly':
            return 'yearlydelay';
        case 'onetime':
        case 'extended':
            return null;
    }
}

function pushBackReminder(item: ShapedItem, at: number): WantedReminder | null {
    const source = pushBackSource(item.sourceScreenCode);
    if (source === null) {
        return null;
    }
    return {
        key: makeKey(source, item.itemIdText, 'base'),
        source,
        itemId: item.itemIdText,
        label: item.itemNameText,
        title: item.bannerTitleText ?? '',
        body: item.bannerBodyText ?? '',
        categoryIdentifier: item.bannerButtonsCode,
        trigger: { kind: 'date', at },
    };
}

function baseReminder(
    item: ShapedItem,
    at: number,
    partText?: string,
    shiftedForMissingDayBit?: boolean,
): WantedReminder {
    const source = item.sourceScreenCode;
    // A repeating item is named for the day it falls on. A one-off with one
    // moment uses `base`. An appointment with several lead times uses each
    // reminder's own id.
    const part = partText
        ?? (item.repeatUnitCode === undefined ? 'base' : dayStamp(at));
    return {
        key: makeKey(source, item.itemIdText, part),
        source,
        itemId: item.itemIdText,
        label: item.itemNameText,
        title: item.bannerTitleText ?? '',
        body: item.bannerBodyText ?? '',
        categoryIdentifier: shiftedForMissingDayBit ? 'shifteddayactions' : item.bannerButtonsCode,
        trigger: { kind: 'date', at },
        ...(shiftedForMissingDayBit ? { shiftedForMissingDayBit: true } : {}),
    };
}
