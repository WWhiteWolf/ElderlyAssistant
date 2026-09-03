// The one translator, and the table of rules that drives it.
//
// It is handed the one saved reminder list and turns each saved item into the
// shape the engine reads. It decides nothing about which reminders to arm, how
// many occurrences to work out, or whether a done item still wants speaking to
// — all of that is answered further along, once, against the common shape. Its
// whole job is to say what an item IS.
//
// There is one translator because nothing in the
// engine goes by page. `stillwanted.ts` never mentions `sourceScreenCode`; it
// branches on the capability bits, the state fields and `hasDueTimeBit`.
// `armdepth.ts` answers one for every item. The screen code is carried
// only so a tapped banner can be routed home. That is what the codes and the
// bits were designed to do: turn each reminder kind's difference into data,
// set once at the boundary. The differences live in a table of rules below,
// and the translating work itself is written once.
//
// The rules are written as accessors rather than as field-name strings, so the
// compiler checks each rule set against the one saved shape. A table
// of strings could not be checked, and readability and the compiler's checking
// are what this app trades for.
//
// It reads nothing, writes nothing, and knows nothing about the phone — so
// Node can check it in a fraction of a second. `now` is handed in rather than
// read from the clock, so a test can say what time it is.

import type {
    BannerButtonsCode,
    LeadTime,
    RepeatUnitCode,
    ShapedItem,
    SourceScreenCode,
} from '../inputshape.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import {
    secondThursdayComplete,
    wednesdayAfterComplete,
} from '../../modules/option-cases.ts';

// ---------------------------------------------------------------------------
// One: what a reminder kind's rules are
// ---------------------------------------------------------------------------

/**
 * When an item comes due, as one reminder kind's rules work it out.
 *
 * Repeating items set the hour and the minute, and a one-off sets the moment
 * alone. The fields that do not belong are left off rather than filled in with
 * something meaningless.
 */
export interface DueFields {
    hasDueTimeBit: boolean;
    dueHour?: number;
    dueMinute?: number;
    dueMoment?: number;
}

/**
 * Everything the translator needs to know about one reminder kind.
 *
 * The first group is constant — the same for every item of that kind — and
 * the second group is read from the saved item. Between them they are the whole
 * difference between kinds, which is why there is only one translator.
 */
export interface ScreenRules<TSaved> {
    // ---- constants, the same for every item of the kind ----

    /** The existing notification source used to route a tapped banner home. */
    sourceScreenCode: SourceScreenCode;
    /**
     * The unit they repeat in, left off for a one-time or extended item.
     *
     * The translator writes the repeat group from the row. It does not read a
     * repeat rule from the saved item.
     */
    repeatUnitCode?: RepeatUnitCode;
    /** How many units between occurrences. Written with the unit, as 1. */
    repeatIntervalCount?: number;
    /**
     * The weekday this saved item comes due on, when its kind has one.
     */
    weekdayNumberOf?: (saved: TSaved) => number | undefined;
    /** The items can be marked done at all. */
    canBeDoneBit: boolean;
    /** They can be snoozed, postponed or delayed. */
    canBePushedBackBit: boolean;
    /** Done ends the item outright rather than only this occurrence. */
    doneEndsItemBit: boolean;
    /** The reminder stands for a group rather than one item. */
    standsForGroupBit: boolean;
    /** Which registered button set the banner carries. */
    bannerButtonsCode: BannerButtonsCode;

    // ---- read from the saved item ----

    idOf: (saved: TSaved) => string;
    nameOf: (saved: TSaved) => string;
    isDoneOf: (saved: TSaved) => boolean;
    pushedBackStampOf: (saved: TSaved) => number | undefined;
    dueOf: (saved: TSaved) => DueFields;
    leadTimesOf: (saved: TSaved) => LeadTime[];
    bannerTitleTextOf: (saved: TSaved) => string;
    bannerBodyTextOf: (saved: TSaved) => string;
}

// ---------------------------------------------------------------------------
// Two: the core
// ---------------------------------------------------------------------------

/**
 * Turn one saved reminder into the common shape the engine reads.
 */
function translateOne<TSaved>(rules: ScreenRules<TSaved>, saved: TSaved): ShapedItem {
    const due = rules.dueOf(saved);
    const pushedBackToStamp = rules.pushedBackStampOf(saved);
    const weekdayNumber = rules.weekdayNumberOf?.(saved);
    // The weekday list is written only when the weekly item has a complete
    // weekday and time.
    const repeatWeekdayList =
        due.hasDueTimeBit && weekdayNumber !== undefined
            ? [{ weekdayNumber }]
            : undefined;

    return {
        // ---- what the item is ----

        sourceScreenCode: rules.sourceScreenCode,
        itemIdText: rules.idOf(saved),
        itemNameText: rules.nameOf(saved),

        // ---- when it comes due ----

        hasDueTimeBit: due.hasDueTimeBit,
        // The due fields the kind's rules worked out, spread in as they came.
        // Each rule set leaves off the fields that do not belong, and leaves
        // off all of them when the item has no time, rather than filling them
        // in with zeros. Midnight is a real time, so a zero would have to be
        // interpreted before it could be told apart from an absence.
        ...(due.dueHour !== undefined ? { dueHour: due.dueHour } : {}),
        ...(due.dueMinute !== undefined ? { dueMinute: due.dueMinute } : {}),
        ...(due.dueMoment !== undefined ? { dueMoment: due.dueMoment } : {}),
        ...(rules.repeatUnitCode !== undefined ? { repeatUnitCode: rules.repeatUnitCode } : {}),
        ...(rules.repeatIntervalCount !== undefined
            ? { repeatIntervalCount: rules.repeatIntervalCount }
            : {}),
        ...(repeatWeekdayList !== undefined ? { repeatWeekdayList } : {}),
        // Default is float with the phone. The one-list translator overwrites
        // this from the saved Options fields when a named zone is present.
        floatsWithPhoneBit: true,

        // ---- capability bits: what this kind of item is allowed to do ----

        canBeDoneBit: rules.canBeDoneBit,
        canBePushedBackBit: rules.canBePushedBackBit,
        doneEndsItemBit: rules.doneEndsItemBit,
        standsForGroupBit: rules.standsForGroupBit,

        // ---- state: what has actually happened to this occurrence ----

        isDoneBit: rules.isDoneOf(saved),
        // Carried through exactly as saved, a stamp already in the past
        // included. Whether a stamp has been spent is a judgment, and
        // `stillwanted.ts` already makes it; making it twice, in two places,
        // is how the two would come to disagree.
        ...(pushedBackToStamp != null ? { pushedBackToStamp } : {}),

        // ---- how far ahead to speak ----

        // Each kind states its own lead times. An empty list means nothing to
        // say. The recurring kinds speak at the moment itself. One Time uses
        // the reminders the person set, and Extended has none.
        leadTimeList: rules.leadTimesOf(saved),

        // ---- the banner's words ----

        // The heading and sentence are accessors because some reminder kinds
        // include the item's name or cadence in their banner words.
        bannerTitleText: rules.bannerTitleTextOf(saved),
        bannerBodyText: rules.bannerBodyTextOf(saved),
        bannerButtonsCode: rules.bannerButtonsCode,
    };
}

// ---------------------------------------------------------------------------
// Three: the one saved list, by kind
// ---------------------------------------------------------------------------

/**
 * One lead time of nothing-before: speak at the moment itself.
 *
 * The recurring kinds want that and only that. An amount of zero is not a
 * special case later on — zero taken from the base is the base.
 */
const atTheMomentItself: LeadTime[] = [
    { leadFormCode: 'offset', leadAmount: 0, leadUnitCode: 'minutes' },
];

/**
 * The banner's due sentence for a One Time appointment.
 */
function twoDigits(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function dueSentence(year: number, month: number, day: number, hour: number, minute: number): string {
    const date = `${twoDigits(month + 1)}/${twoDigits(day)}/${twoDigits(year % 100)}`;
    const time = `${twoDigits(hour)}:${twoDigits(minute)}`;
    return `Due: ${date} at ${time}`;
}

function leadTimesFromReminders(item: ReminderItem): LeadTime[] {
    if (!item.reminders || item.reminders.length === 0) {
        return [];
    }
    return item.reminders.map((reminder) => {
        if (reminder.kind === 'clock') {
            const named = reminder.timeOfDay === 'evening' ? 'evening'
                : reminder.timeOfDay === 'midday' ? 'midday'
                    : 'morning';
            return {
                leadFormCode: 'clock' as const,
                leadDaysBefore: reminder.daysBefore ?? 0,
                leadNamedTimeCode: named,
                leadPartText: reminder.id,
            };
        }
        return {
            leadFormCode: 'offset' as const,
            leadAmount: reminder.amount,
            leadUnitCode: reminder.unit,
            leadPartText: reminder.id,
        };
    });
}

const dailyCadenceRules: ScreenRules<ReminderItem> = {
    sourceScreenCode: 'myday',
    repeatUnitCode: 'day',
    repeatIntervalCount: 1,
    canBeDoneBit: true,
    canBePushedBackBit: true,
    doneEndsItemBit: false,
    standsForGroupBit: false,
    bannerTitleTextOf: () => 'Daily Routine',
    bannerButtonsCode: 'routineactions',
    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: (item) => !!item.completed,
    pushedBackStampOf: (item) => item.snoozedUntil,
    dueOf: (item) =>
        typeof item.hour === 'number' && typeof item.minute === 'number'
            ? { hasDueTimeBit: true, dueHour: item.hour, dueMinute: item.minute }
            : { hasDueTimeBit: false },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (item) => `Time for ${item.label}!`,
};

const weeklyCadenceRules: ScreenRules<ReminderItem> = {
    sourceScreenCode: 'myweek',
    repeatUnitCode: 'week',
    repeatIntervalCount: 1,
    canBeDoneBit: true,
    canBePushedBackBit: true,
    doneEndsItemBit: false,
    standsForGroupBit: false,
    bannerTitleTextOf: () => 'Weekly Chore',
    bannerButtonsCode: 'routineactions',
    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: (item) => !!item.completed,
    pushedBackStampOf: (item) => item.snoozedUntil,
    weekdayNumberOf: (item) =>
        typeof item.day === 'number' ? item.day : undefined,
    dueOf: (item) =>
        typeof item.day === 'number'
            && typeof item.hour === 'number'
            && typeof item.minute === 'number'
            ? {
                hasDueTimeBit: true,
                dueHour: item.hour,
                dueMinute: item.minute,
            }
            : { hasDueTimeBit: false },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (item) => `Time for ${item.label}!`,
};

const datedCadenceRules: ScreenRules<ReminderItem> = {
    sourceScreenCode: 'lookahead',
    canBeDoneBit: false,
    canBePushedBackBit: true,
    doneEndsItemBit: false,
    standsForGroupBit: false,
    bannerTitleTextOf: (item) =>
        item.kind === 'yearly' ? 'Yearly'
        : item.kind === 'quarterly' ? 'Quarterly'
        : 'Monthly',
    bannerButtonsCode: 'lookaheadactions',
    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: () => false,
    pushedBackStampOf: (item) => item.snoozedUntil,
    dueOf: (item) => {
        const hour = typeof item.hour === 'number' ? item.hour : undefined;
        const minute = typeof item.minute === 'number' ? item.minute : undefined;
        if (typeof item.year === 'number'
            && typeof item.month === 'number'
            && typeof item.day === 'number') {
            return {
                hasDueTimeBit: true,
                dueMoment: new Date(
                    item.year,
                    item.month,
                    item.day,
                    hour ?? 0,
                    minute ?? 0,
                    0,
                    0,
                ).getTime(),
                dueHour: hour ?? 0,
                dueMinute: minute ?? 0,
            };
        }
        if (hour !== undefined && minute !== undefined) {
            return { hasDueTimeBit: true, dueHour: hour, dueMinute: minute };
        }
        return { hasDueTimeBit: false };
    },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (item) => `Time for ${item.label}!`,
};

const oneTimeCadenceRules: ScreenRules<ReminderItem> = {
    sourceScreenCode: 'todo',
    canBeDoneBit: true,
    canBePushedBackBit: false,
    doneEndsItemBit: true,
    standsForGroupBit: false,
    bannerButtonsCode: 'todook',
    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: (item) => !!item.completed,
    pushedBackStampOf: () => undefined,
    dueOf: (item) => {
        if (typeof item.year === 'number'
            && typeof item.month === 'number'
            && typeof item.day === 'number') {
            return {
                hasDueTimeBit: true,
                dueMoment: new Date(
                    item.year,
                    item.month,
                    item.day,
                    item.hour ?? 12,
                    item.minute ?? 0,
                    0,
                    0,
                ).getTime(),
            };
        }
        return { hasDueTimeBit: false };
    },
    leadTimesOf: (item) => leadTimesFromReminders(item),
    bannerTitleTextOf: (item) => `📋 Reminder: ${item.label}`,
    bannerBodyTextOf: (item) => {
        if (typeof item.year !== 'number'
            || typeof item.month !== 'number'
            || typeof item.day !== 'number') {
            return '';
        }
        return dueSentence(
            item.year,
            item.month,
            item.day,
            item.hour ?? 12,
            item.minute ?? 0,
        );
    },
};

const extendedCadenceRules: ScreenRules<ReminderItem> = {
    sourceScreenCode: 'todo',
    canBeDoneBit: true,
    canBePushedBackBit: false,
    doneEndsItemBit: true,
    standsForGroupBit: false,
    bannerButtonsCode: 'todook',
    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: (item) => !!item.completed,
    pushedBackStampOf: () => undefined,
    dueOf: () => ({ hasDueTimeBit: false }),
    leadTimesOf: () => [],
    bannerTitleTextOf: (item) => `📋 Reminder: ${item.label}`,
    bannerBodyTextOf: () => '',
};

function rulesForKind(kind: ReminderItem['kind']): ScreenRules<ReminderItem> | null {
    if (kind === 'daily') return dailyCadenceRules;
    if (kind === 'weekly') return weeklyCadenceRules;
    if (kind === 'monthly' || kind === 'quarterly' || kind === 'yearly') {
        return datedCadenceRules;
    }
    if (kind === 'oneTime') return oneTimeCadenceRules;
    if (kind === 'extended') return extendedCadenceRules;
    return null;
}

/** Turn the one saved list into shaped items, in the order given. */
export function translateReminderItems(items: ReminderItem[], now: number): ShapedItem[] {
    void now;
    const shaped: ShapedItem[] = [];
    for (const one of items) {
        const rules = rulesForKind(one.kind);
        if (!rules) continue;
        shaped.push(withSavedOptions(one, translateOne(rules, one)));
    }
    return shaped;
}

/**
 * Carry the Options fields the engine already knows how to read.
 *
 * A named zone is written only as a complete pair. An incomplete pair is
 * rejected: the item keeps floating with the phone rather than silently
 * producing no reminder. Holidays are one code, absent when unused. A
 * complete second Thursday or Wednesday after the 6th becomes the engine's
 * weekday entry; a half-entered pair is left off. A numbered-day
 * weekday keeps only the first occurrence after that day. Shifted-day
 * preference is not mapped here.
 */
function withSavedOptions(saved: ReminderItem, shaped: ShapedItem): ShapedItem {
    let out = shaped;
    if (saved.floatsWithPhone === false && saved.dueTimeZoneText) {
        out = {
            ...out,
            floatsWithPhoneBit: false,
            dueTimeZoneText: saved.dueTimeZoneText,
        };
    }
    if (saved.holidayMove === 'before' || saved.holidayMove === 'after') {
        out = { ...out, holidayMoveCode: saved.holidayMove };
    }
    if (saved.kind === 'monthly' || saved.kind === 'quarterly' || saved.kind === 'yearly') {
        out = withMonthlyRepeat(saved, out);
    }
    return out;
}

function withMonthlyRepeat(saved: ReminderItem, shaped: ShapedItem): ShapedItem {
    const thursday = secondThursdayComplete(saved);
    const wednesday = wednesdayAfterComplete(saved);
    const interval =
        saved.kind === 'monthly' ? 1
        : saved.kind === 'yearly' ? 1
        : (typeof saved.intervalMonths === 'number' ? saved.intervalMonths : 3);
    if (thursday && wednesday) {
        if (saved.kind === 'yearly') {
            return { ...shaped, repeatUnitCode: 'year', repeatIntervalCount: 1 };
        }
        return { ...shaped, repeatUnitCode: 'month', repeatIntervalCount: interval };
    }
    if (thursday && saved.ordinalWeekday != null && saved.weekdayOrdinal != null) {
        return {
            ...shaped,
            repeatUnitCode: 'month',
            repeatIntervalCount: saved.kind === 'yearly' ? 12 : interval,
            repeatWeekdayList: [{
                weekdayNumber: saved.ordinalWeekday,
                weekdayOrdinalCount: saved.weekdayOrdinal,
            }],
        };
    }
    if (wednesday && saved.afterWeekday != null) {
        return {
            ...shaped,
            repeatUnitCode: 'month',
            repeatIntervalCount: saved.kind === 'yearly' ? 12 : interval,
            repeatWeekdayList: [{ weekdayNumber: saved.afterWeekday }],
            repeatAfterDayCount: typeof saved.afterDayCount === 'number' ? saved.afterDayCount : 6,
        };
    }
    if (saved.kind === 'yearly') {
        return { ...shaped, repeatUnitCode: 'year', repeatIntervalCount: 1 };
    }
    return { ...shaped, repeatUnitCode: 'month', repeatIntervalCount: interval };
}
