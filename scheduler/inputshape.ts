// The one shape every screen's reminder is turned into before the engine sees
// it.
//
// The app's five reminder screens each save their items their own way, and
// that is left exactly as it is. What changes is that nothing downstream reads
// those five shapes any more. One translator, driven by a table of rules per
// screen, sets the fields below at the boundary, and from there on the engine
// is written once against one shape.
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

/** Which of the five reminder screens an item came from. */
export type SourceScreenCode =
    | 'myday'
    | 'pets'
    | 'myweek'
    | 'lookahead'
    | 'todo';

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
 * ordinary day-of-week and as My Week's saved day. An ordinal of 2 is the
 * second such weekday of the month, and -1 is the last. Left off means every
 * such weekday.
 */
export interface RepeatWeekday {
    weekdayNumber: number;
    weekdayOrdinalCount?: number;
}

/**
 * Which of the two forms a lead time takes.
 *
 * An offset is counted straight back from the due moment — twenty minutes
 * before, two hours before. A clock lead time is counted back a whole number
 * of days and then set to one of the three times named in Settings, which is
 * what a person means by "the evening before".
 */
export type LeadFormCode = 'offset' | 'clock';

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
    | 'mydaysnooze'
    | 'petssnooze'
    | 'todook'
    | 'myweekactions'
    | 'lookaheadactions'
    | 'routineactions'
    | 'orderactions';

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
        // them. Used as the third part of the key so two leads on one task
        // never share a name. Look Ahead has one moment and leaves it off.
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
 * rule rather than as an exception. A To-Do appointment simply has its done
 * and push-back bits clear, so nothing anywhere has to special-case
 * appointments.
 */
export interface ShapedItem {
    // ---- what the item is ----

    /** Which of the five screens it came from. */
    sourceScreenCode: SourceScreenCode;
    /** The item's own id on that screen. */
    itemIdText: string;
    /** The name the banner shows. */
    itemNameText: string;

    // ---- when it comes due ----

    /**
     * The unit the item repeats in, left off when it is a one-off.
     *
     * My Day and Pets write day, My Week writes week, and Look Ahead and To-Do
     * leave the whole repeat group off. A later screen can write month or year
     * without a new kind of trigger.
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
     * My Week writes the chore's own day here. A monthly rule that names a
     * weekday — the second Thursday, Wednesday after the sixth — writes that
     * weekday here too, with or without an ordinal.
     */
    repeatWeekdayList?: RepeatWeekday[];
    /**
     * A floor on the day of the month, used with a weekday list.
     *
     * 6 means the date must be the 7th through the 13th. Left off means no
     * floor.
     */
    repeatAfterDayCount?: number;
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
     * Every one of the five readers guards on this today, and the wanted-block
     * asks it as its last question: an item with no time has nothing to arm,
     * though a promise already made to it can still stand.
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
     * The one moment it comes due, as the ordinary count of milliseconds.
     *
     * A one-off uses this as the due moment itself. A monthly or yearly item
     * may also carry it as the seed for the day of the month, and for the
     * month of the year.
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

    // ---- capability bits: what this kind of item is allowed to do ----

    /** The item can be marked done at all. */
    canBeDoneBit: boolean;
    /** It can be snoozed, postponed or delayed. */
    canBePushedBackBit: boolean;
    /**
     * Done ends the item outright rather than only this occurrence.
     *
     * The app has two kinds of done and they cannot share a bit. A chore
     * ticked off is done for today and comes round again; a task finished is
     * finished.
     */
    doneEndsItemBit: boolean;
    /**
     * The reminder stands for a group rather than one item.
     *
     * This is To-Do's eight o'clock background banner, which today is
     * recognised only by its id happening to be the word `background`.
     */
    standsForGroupBit: boolean;

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
     * item with no repeat unit is ignored. The translator does not read this
     * from saved items in this step; tests construct it.
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
     * translator's work, settled the same way the background banner's count
     * was: each screen builds its own sentence, exactly as each reader does
     * today. Carrying them here means the engine has everything one reminder
     * needs in one thing, and never has to reach back to the screen it came
     * from to find out what to say.
     *
     * They are optional so that a test or a caller concerned only with when an
     * item comes due can write a shaped item without them. Every translator
     * sets all three.
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
}
