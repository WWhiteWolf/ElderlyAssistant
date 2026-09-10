// The one shape every screen's reminder is turned into before the engine sees
// it.
//
// Every current reminder page saves the same ReminderItem shape in one list.
// One translator, driven by a table of rules per saved kind, sets the fields
// below at the boundary, and from there on the engine is written once against
// one shape.
//
// Two rules from Patrick govern every name here. The name says what the thing
// does and carries its own kind in the name, so a bit reads as a bit and a code
// reads as a code. And the bits are separate named fields rather than one
// packed field: this app saves plain text on the phone, where packing buys
// nothing and costs both readability and the compiler's checking.
//
// A code is written as a named set of allowed words, which is what makes an
// impossible value impossible to write down at all.
//
// This file touches no storage, no phone, no React Native and no Expo. It is
// plain data, so Node can read it in a fraction of a second.

/** The current source carried from a saved kind into notification data. */
export type SourceScreenCode =
    | 'daily'
    | 'oneTime'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly'
    | 'appointments'
    | 'birthdays'
    | 'bucketlist';

/**
 * The unit a repeating item counts in.
 *
 * Left off, the item is a one-off: it comes due at one moment and does not
 * come round again. The phone still receives that moment as a single date
 * trigger, the same as it does now.
 */
export type RepeatUnitCode = 'day' | 'week' | 'month' | 'year';

/**
 * One weekday a repeating item comes due on.
 *
 * Sunday is 0 through Saturday is 6, the same counting as the machine's
 * ordinary day-of-week and as Weekly's saved day. An ordinal of 2 is the
 * second such weekday of the month, and -1 is the last. Left off means every
 * such weekday.
 */
export interface RepeatWeekday {
    weekdayNumber: number;
    weekdayOrdinalCount?: number;
}

/** The units an offset lead time is counted in. */
export type LeadUnitCode = 'minutes' | 'hours' | 'days';

/** The three times of day named in Settings. */
export type LeadNamedTimeCode = 'morning' | 'midday' | 'evening';

/**
 * Which registered set of banner buttons an item's reminder carries.
 *
 * These are exactly the category names the housing registers at launch, in
 * `app/_layout.tsx`, and no others. Writing them out as a named set is what
 * makes a button set that was never registered impossible to ask for: a
 * banner naming a category the phone does not know shows no buttons at all,
 * and that has bitten this app before.
 */
export type BannerButtonsCode =
    | 'routineactions'
    | 'cadenceactions'
    | 'appointmentsok'
    | 'shifteddayactions';

/**
 * What Done does. Only one of the three words is in force.
 *
 * thisCycle — this occurrence is done, and the item comes round again.
 * advanceDate — this cycle is done, and the saved date moves to the next.
 * endItem — the item is finished.
 */
export type DoneActionCode = 'thisCycle' | 'advanceDate' | 'endItem';

/**
 * What Save writes for year, month, and day.
 *
 * none — drop them.
 * weekday — day is the weekday number; drop year and month.
 * calendar — write the pending date unless an exclusive weekday bit is complete.
 * today — write today’s date.
 * required — always write the pending date.
 */
export type DateWriteCode =
    | 'none'
    | 'weekday'
    | 'calendar'
    | 'today'
    | 'required';

/**
 * What Save writes for hour and minute.
 *
 * none — drop them.
 * ifPendingTime — write from the pending time when it is there.
 * alwaysPendingTime — always write from the pending time; noon if missing.
 * alwaysPendingDate — always write from the pending date’s time.
 * ifTimeSet — write from the pending date’s time when a time was set.
 */
export type TimeWriteCode =
    | 'none'
    | 'ifPendingTime'
    | 'alwaysPendingTime'
    | 'alwaysPendingDate'
    | 'ifTimeSet';

/**
 * The monthly weekday exclusive group. Only one of these bits can be true.
 * Turning one on turns the others off. There is no both-true case.
 */
export const MONTHLY_WEEKDAY_EXCLUSIVE_GROUP = ['secondThursday', 'wednesdayAfter'] as const;
export type MonthlyWeekdayExclusiveBit = (typeof MONTHLY_WEEKDAY_EXCLUSIVE_GROUP)[number];

/**
 * The Quarterly step. Only one of the four words is in force.
 *
 * none — every three months. days30, days60, days90 — that many days from
 * the date entered. One chip at a time. A second tap is none.
 */
export type QuarterlyStepCode = 'none' | 'days30' | 'days60' | 'days90';

export const QUARTERLY_STEP_CODES: readonly QuarterlyStepCode[] = [
    'none',
    'days30',
    'days60',
    'days90',
];

export const QUARTERLY_STEP_CHIPS: readonly Exclude<QuarterlyStepCode, 'none'>[] = [
    'days30',
    'days60',
    'days90',
];

const QUARTERLY_STEP_DAYS: Record<Exclude<QuarterlyStepCode, 'none'>, number> = {
    days30: 30,
    days60: 60,
    days90: 90,
};

/** The named Quarterly step for a saved day-count, or none. */
export function quarterlyStepCodeOf(intervalDays?: number): QuarterlyStepCode {
    if (intervalDays === 30) return 'days30';
    if (intervalDays === 60) return 'days60';
    if (intervalDays === 90) return 'days90';
    return 'none';
}

/** The day-count the engine already steps, left off when the step is none. */
export function quarterlyStepDaysOf(code: QuarterlyStepCode): number | undefined {
    if (code === 'none') return undefined;
    return QUARTERLY_STEP_DAYS[code];
}

/**
 * One lead time — how far ahead of the due moment to speak.
 *
 * The form code says which of the two sets of fields is the live one, so a
 * lead time can never be half of each.
 */
export type LeadTime =
    | {
        leadFormCode: 'offset';
        // Counted straight back from the due moment.
        leadAmount: number;
        leadUnitCode: LeadUnitCode;
        // Which of this item's reminders this is, when the saved list names
        // them. Used as the third part of the key so two leads on one
        // appointment never share a name. A dated cadence has one moment and
        // leaves it off.
        leadPartText?: string;
    }
    | {
        leadFormCode: 'clock';
        // Counted back this many whole days, then set to the named time.
        leadDaysBefore: number;
        leadNamedTimeCode: LeadNamedTimeCode;
        leadPartText?: string;
    };

/**
 * One item, in the shape the engine reads.
 *
 * The fields fall into four groups, and the third and fourth are deliberately
 * kept apart. The capability bits say what this kind of item is ALLOWED to do
 * and are set once by the translator; the state fields say what has actually
 * HAPPENED to this occurrence and change constantly.
 *
 * Keeping them apart is what lets a kind answer a question differently as a
 * rule rather than as an exception. An appointment simply has its push-back
 * bit clear, so nothing anywhere has to special-case it.
 */
export interface ShapedItem {
    // ---- what the item is ----

    /** The current source for this saved kind. */
    sourceScreenCode: SourceScreenCode;
    /** The item's own id on that screen. */
    itemIdText: string;
    /** The name the banner shows. */
    itemNameText: string;

    // ---- when it comes due ----

    /**
     * The unit the item repeats in, left off when it is a one-off.
     *
     * Daily writes day, Weekly writes week, the dated cadences write month or
     * year, and Appointments and Bucket List leave the whole repeat group off.
     */
    repeatUnitCode?: RepeatUnitCode;
    /**
     * How many units between occurrences.
     *
     * When the unit is present and this is left off, it is treated as 1. The
     * translator writes 1 on the three repeating screens so a missing count
     * and a count of one never have to be told apart downstream.
     */
    repeatIntervalCount?: number;
    /**
     * The weekdays the item comes due on, left off when it does not use them.
     *
     * Weekly writes the item's own day here. A monthly rule that names a
     * weekday — the second Thursday, Wednesday after the sixth — writes that
     * weekday here too, with or without an ordinal.
     */
    repeatWeekdayList?: RepeatWeekday[];
    /**
     * A numbered day of the month, used with a weekday list.
     *
     * 6 means the first matching weekday after the 6th, and only that
     * occurrence (Patrick, #42-new). Left off means no numbered day.
     */
    repeatAfterDayCount?: number;
    /**
     * The Quarterly step, when this item is Quarterly.
     *
     * Left off for every other kind. none is every three months.
     */
    quarterlyStepCode?: QuarterlyStepCode;
    /**
     * A last date, as the ordinary count of milliseconds.
     *
     * Left off means the series does not end. A candidate after this moment
     * is not armed.
     */
    repeatUntilMoment?: number;
    /**
     * The item actually has a time.
     *
     * The wanted-block asks this as its last question: an item with no time
     * has nothing to arm, though a promise already made to it can still stand.
     */
    hasDueTimeBit: boolean;
    /**
     * The time of day it comes due, set by repeating items. A one-off
     * carries the hour inside `dueMoment` instead.
     *
     * Both are left off when the item has no time, the way a weekday list and
     * a single moment are left off when they do not belong. An absent field
     * says plainly that there is nothing here; a zero has to be interpreted,
     * and midnight is a real time, so the two could not be told apart.
     */
    dueHour?: number;
    dueMinute?: number;
    /**
     * The day of the month the series is for.
     *
     * A 31st stays 31 even when this month only has 28 days. The last day
     * that exists is used for that month; the series is still the 31st.
     * Left off when dueMoment already carries a real calendar day, as a
     * one-off does.
     */
    dueMonthDay?: number;
    /**
     * The one moment it comes due, as the ordinary count of milliseconds.
     *
     * A one-off uses this as the due moment itself. A monthly or yearly item
     * may also carry it as the seed for the month of the year. The day of
     * the month is `dueMonthDay` when that is present, so a 31st is not
     * lost inside a shorter month.
     */
    dueMoment?: number;
    /**
     * The due clock time floats with the phone's local zone.
     *
     * True when the item has no named zone. False when Options named one, and
     * then `dueTimeZoneText` is required: the engine will not guess a zone.
     */
    floatsWithPhoneBit: boolean;
    /**
     * An IANA zone name, for example `America/New_York`.
     *
     * Left off when the item floats with the phone. Required when the bit is
     * false: the engine will not guess a zone.
     */
    dueTimeZoneText?: string;
    /**
     * Move the occurrence to the day before or after a US federal holiday.
     *
     * Left off when unused. The translator writes `before` or `after` from
     * the saved Options field. A missing day and a holiday move cannot both
     * apply, so a shifted occurrence is left as it is.
     */
    holidayMoveCode?: 'before' | 'after';

    // ---- capability bits: what this kind of item is allowed to do ----

    /** The item can be marked done at all. */
    canBeDoneBit: boolean;
    /** It can be snoozed, postponed or delayed. */
    canBePushedBackBit: boolean;
    /**
     * What Done does for this kind.
     *
     * The three words cannot share a two-way bit. A chore ticked off is done
     * for today and comes round again; a dated cycle advances the saved date;
     * a task finished is finished.
     */
    doneActionCode: DoneActionCode;
    /**
     * The reminder stands for a group rather than one item.
     *
     * This marks a reminder that stands for a group rather than one item.
     */
    standsForGroupBit: boolean;
    /**
     * How many calendar days ahead the due date may be before it takes a slot.
     *
     * Set once by the translator from the table. The join reads this number
     * and measures from the due date. Left off means this kind does not wait.
     */
    waitsUntilNearDays?: number;

    // ---- state: what has actually happened to this occurrence ----

    /** Done right now. */
    isDoneBit: boolean;
    /**
     * The one moment this occurrence is pushed back to, or nothing.
     *
     * One stamp per item: pushing back a second time moves that moment rather
     * than leaving a second one behind. A snooze, a postpone and a banner's
     * delay are all the same act at different distances, so they all write
     * here.
     */
    pushedBackToStamp?: number;
    /**
     * The millisecond due of the cycle that was skipped, or nothing.
     *
     * One stamp, like push-back. Skip is this cycle, then the next event is
     * armed. It is not done. A one-off has no next event, so a stamp on an
     * item with no repeat unit is ignored. The translator reads this from the
     * saved item when Skip has written it.
     */
    skippedCycleStamp?: number;

    // ---- how far ahead to speak ----

    /**
     * The lead times, if any.
     *
     * An empty list is answered by whether the item repeats rather than
     * globally: repeating items speak at the moment itself, and a one-off
     * with no lead time speaks never.
     */
    leadTimeList: LeadTime[];

    // ---- the banner's words ----

    /**
     * What the banner says, and which buttons it carries.
     *
     * These three ride inside the shaped item because the words are the
     * translator's work. Each saved kind builds its own sentence. Carrying
     * them here means the engine has everything one reminder needs in one
     * thing, and never has to reach back to a page to find out what to say.
     *
     * They are optional so that a test or a caller concerned only with when an
     * item comes due can write a shaped item without them. The translator sets
     * them for every kind that can produce a reminder.
     *
     * The placement is deliberately reversible. The output side has not been
     * designed yet, so if that work wants the words held somewhere else, it is
     * three fields moving.
     */
    bannerTitleText?: string;
    /** The sentence under the heading. */
    bannerBodyText?: string;
    /** Which registered button set the banner carries. */
    bannerButtonsCode?: BannerButtonsCode;
    /**
     * Which registered button set a missing-day occurrence carries.
     *
     * Left off when this kind has no extra tap for a day that does not
     * exist. Then and Next Day live here, not as a saved Options choice.
     */
    shiftedBannerButtonsCode?: BannerButtonsCode;
}
