// The join: shaped items become the reminders the phone should hold.
//
// The translator says what an item is. The two blocks say whether it is still
// wanted and how many occurrences to arm. Lead moments turn each lead time
// into a clock time. This file is the last step: it writes those answers as
// WantedReminder records, which is the shape the reconcile already speaks.
//
// Nothing here goes by page. A push-back's source name is the one the housing
// already routes — mydaysnooze, petssnooze, and so on — so a tapped banner
// still finds its screen. That is output naming, not a second judgment.
//
// `now` is handed in rather than read from the clock. The file reads nothing,
// writes nothing, and knows nothing about the phone, so Node can check it.

import { isStillWanted } from './stillwanted.ts';
import { momentsFor } from './leadmoments.ts';
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
            wanted.push(pushBackReminder(item, answer.pushedBackToMoment));
        }

        if (answer.dropsThisOccurrenceBit && item.triggerKindCode === 'weekly') {
            continue;
        }

        if (item.triggerKindCode === 'date') {
            // Depth is how many occurrences to arm, not how many lead times
            // one occurrence carries. A To-Do task's several reminders all
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

        let moments = momentsFor(item, now, clockTimes);
        if (answer.dropsThisOccurrenceBit) {
            const today = new Date(now);
            moments = moments.filter((at) => !sameDay(new Date(at), today));
        }
        moments = moments.slice(0, armDepthFor(item.triggerKindCode));

        for (const at of moments) {
            wanted.push(baseReminder(item, at));
        }
    }
    return wanted;
}

/** The source word the housing already routes for a push-back on this screen. */
function pushBackSource(screen: SourceScreenCode): string {
    switch (screen) {
        case 'myday':
            return 'mydaysnooze';
        case 'pets':
            return 'petssnooze';
        case 'myweek':
            return 'myweekpostpone';
        case 'lookahead':
            return 'lookaheaddelay';
        case 'todo':
            return 'todo';
    }
}

function pushBackReminder(item: ShapedItem, at: number): WantedReminder {
    const source = pushBackSource(item.sourceScreenCode);
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

function baseReminder(item: ShapedItem, at: number, partText?: string): WantedReminder {
    const source = item.sourceScreenCode;
    // Daily and weekly items are named for the day they fall on. A date item
    // with one moment uses `base`, which is what Look Ahead already answers
    // to. A date item with several lead times uses each reminder's own id,
    // which is what To-Do already answers to.
    const part = partText
        ?? (item.triggerKindCode === 'date' ? 'base' : dayStamp(at));
    return {
        key: makeKey(source, item.itemIdText, part),
        source,
        itemId: item.itemIdText,
        label: item.itemNameText,
        title: item.bannerTitleText ?? '',
        body: item.bannerBodyText ?? '',
        categoryIdentifier: item.bannerButtonsCode,
        trigger: { kind: 'date', at },
    };
}
