// The one shape every screen's reminder is turned into before the engine sees
// it.
//
// The app's five reminder screens each save their items their own way, and
// that is left exactly as it is. What changes is that nothing downstream reads
// those five shapes any more. A small translator per screen sets the fields
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

/** Which of the five reminder screens an item came from. */
export type SourceScreenCode =
    | 'myday'
    | 'pets'
    | 'myweek'
    | 'lookahead'
    | 'todo';

/**
 * The rule for when an item comes due.
 *
 * Three kinds and no others. They are the three the phone's own queue speaks
 * in, so a shaped item never has to be interpreted twice.
 */
export type TriggerKindCode = 'daily' | 'weekly' | 'date';

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
    }
    | {
        leadFormCode: 'clock';
        // Counted back this many whole days, then set to the named time.
        leadDaysBefore: number;
        leadNamedTimeCode: LeadNamedTimeCode;
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

    /** Which rule says when it comes due. */
    triggerKindCode: TriggerKindCode;
    /**
     * The item actually has a time.
     *
     * Every one of the five readers guards on this today, and it is the first
     * question the wanted-block asks. An item with no time is not a reminder
     * at all, whatever else is set on it.
     */
    hasDueTimeBit: boolean;
    /** The time of day it comes due. Used by all three kinds. */
    dueHour: number;
    dueMinute: number;
    /** Which day of the week. Weekly items only. */
    dueWeekday?: number;
    /**
     * The one moment it comes due, as the ordinary count of milliseconds.
     * Date items only.
     */
    dueMoment?: number;

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

    // ---- how far ahead to speak ----

    /**
     * The lead times, if any.
     *
     * An empty list is answered by the trigger kind rather than globally:
     * daily and weekly items speak at the moment itself, and a date item with
     * no lead time speaks never.
     */
    leadTimeList: LeadTime[];
}
