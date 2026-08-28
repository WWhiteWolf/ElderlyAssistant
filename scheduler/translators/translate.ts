// The one translator, and the table of rules that drives it.
//
// It is handed a screen's saved list and turns each saved item into the one
// shape the engine reads. It decides nothing about which reminders to arm, how
// many occurrences to work out, or whether a done item still wants speaking to
// — all of that is answered further along, once, against the common shape. Its
// whole job is to say what an item IS.
//
// There is one translator rather than one per screen because nothing in the
// engine goes by page. `stillwanted.ts` never mentions `sourceScreenCode`; it
// branches on the capability bits, the state fields and `hasDueTimeBit`.
// `armdepth.ts` answers one for every item. The screen code is carried
// only so a tapped banner can be routed home. That is what the codes and the
// bits were designed to do: turn a per-screen difference into data, set once at
// the boundary. So the per-screen difference lives in a table of rules below,
// and the work itself is written once.
//
// The rules are written as accessors rather than as field-name strings, so the
// compiler checks each rule set against the screen's real saved shape. A table
// of strings could not be checked, and readability and the compiler's checking
// are what this app trades for.
//
// Nothing in the app calls this yet. The old readers stay exactly where they
// are and keep working; each is retired only when its replacement is proved.
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
import type { MyDayItem } from '../readers/myday.ts';
import type { PetsItem } from '../readers/pets.ts';
import type { Chore } from '../readers/myweek.ts';
import type { LookAheadItem } from '../readers/lookahead.ts';
import type { Task } from '../readers/todo.ts';

// ---------------------------------------------------------------------------
// One: what a screen's rules are
// ---------------------------------------------------------------------------

/**
 * When an item comes due, as one screen's rules work it out.
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
 * Everything the translator needs to know about one screen.
 *
 * The first group is constant — the same for every item on that screen — and
 * the second group is read from the saved item. Between them they are the whole
 * of a screen's difference, which is why there is only one translator.
 */
export interface ScreenRules<TSaved> {
    // ---- constants, the same for every item on the screen ----

    /** Which of the five screens these items came from. */
    sourceScreenCode: SourceScreenCode;
    /**
     * The unit they repeat in, left off for a one-off screen.
     *
     * The translator writes the repeat group from the row. It does not read a
     * repeat rule from the saved item.
     */
    repeatUnitCode?: RepeatUnitCode;
    /** How many units between occurrences. Written with the unit, as 1. */
    repeatIntervalCount?: number;
    /**
     * The weekday this saved item comes due on, when the screen has one.
     *
     * My Week reads `chore.day` here, which is the same place `dueOf` used to
     * put `dueWeekday`. Left off on the other screens.
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
 * Turn every saved item on one screen into a shaped item.
 *
 * One shaped item per saved item, in the order they were given, and none is
 * ever dropped. Dropping is a judgment, and judgments belong further along in
 * `stillwanted.ts`. An item with no time and an item already ticked off both
 * come through here like any other, carrying the facts that let the block
 * decide.
 *
 * `now` is not read at present. It is taken all the same, because every part
 * of this scheduler that could ever need the time takes it as an argument
 * rather than reaching for the clock, and a translator that later has to look
 * at the time should not change its shape to do it.
 */
export function translateWith<TSaved>(
    rules: ScreenRules<TSaved>,
    saved: TSaved[],
    now: number,
): ShapedItem[] {
    void now;
    return saved.map((one) => translateOne(rules, one));
}

/** One saved item, in the shape the engine reads. */
function translateOne<TSaved>(rules: ScreenRules<TSaved>, saved: TSaved): ShapedItem {
    const due = rules.dueOf(saved);
    const pushedBackToStamp = rules.pushedBackStampOf(saved);
    const weekdayNumber = rules.weekdayNumberOf?.(saved);
    // The weekday list is written only when dueOf actually has a weekday, which
    // for My Week is the same guard that used to put dueWeekday on the due
    // fields: all three of day, hour and minute are numbers.
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
        // The due fields the screen's rules worked out, spread in as they came.
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
        // Default is float with the phone. No saved field yet, so every row
        // is true and the zone is left off.
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

        // Each screen states its own lead times. An empty list means nothing
        // to say. My Day, Pets, My Week and Look Ahead each give one lead
        // time of nothing-before. To-Do gives the reminders the person set.
        leadTimeList: rules.leadTimesOf(saved),

        // ---- the banner's words ----

        // Word for word what the existing readers write, so the swap over
        // changes nothing a person sees. The heading is an accessor like the
        // sentence, because To-Do puts the task's name in it and the others
        // do not — that is a saved field, not a second kind of table.
        bannerTitleText: rules.bannerTitleTextOf(saved),
        bannerBodyText: rules.bannerBodyTextOf(saved),
        bannerButtonsCode: rules.bannerButtonsCode,
    };
}

// ---------------------------------------------------------------------------
// Three: the five rule sets, and the named wrapper for each
// ---------------------------------------------------------------------------

/**
 * One lead time of nothing-before: speak at the moment itself.
 *
 * My Day, Pets, My Week and Look Ahead each want that and only that. Writing
 * it once is what keeps the four from drifting apart. An amount of zero is
 * not a special case later on — zero taken from the base is the base.
 */
const atTheMomentItself: LeadTime[] = [
    { leadFormCode: 'offset', leadAmount: 0, leadUnitCode: 'minutes' },
];

/**
 * My Day's rules.
 *
 * Every My Day item is a daily routine. That is what the screen is, so there is
 * no other kind to work out.
 */
export const myDayRules: ScreenRules<MyDayItem> = {
    sourceScreenCode: 'myday',
    repeatUnitCode: 'day',
    repeatIntervalCount: 1,
    // My Day items are ticked off, and they can be snoozed both from the page's
    // own button and from the banner's.
    canBeDoneBit: true,
    canBePushedBackBit: true,
    // Clear, and this is the point of the whole screen. My Day's done covers
    // today and only today; the item comes back tomorrow, because a routine is
    // a thing that needs doing again.
    doneEndsItemBit: false,
    // Every My Day reminder stands for one item. Standing for a group is
    // To-Do's eight o'clock banner and nothing here.
    standsForGroupBit: false,
    bannerTitleTextOf: () => 'Daily Routine',
    bannerButtonsCode: 'routineactions',

    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: (item) => item.completed,
    pushedBackStampOf: (item) => item.snoozedUntil,
    // An item has a time only when both halves of it are actually numbers. A
    // time of null means it was cleared, and an older saved item may have no
    // hour or minute at all, which counts as the same thing. A weekday list
    // and a single moment do not belong to a daily item, so both are left off.
    dueOf: (item) =>
        typeof item.hour === 'number' && typeof item.minute === 'number'
            ? { hasDueTimeBit: true, dueHour: item.hour, dueMinute: item.minute }
            : { hasDueTimeBit: false },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (item) => `Time for ${item.label}!`,
};

/**
 * Pets' rules.
 *
 * Pets Day works exactly as My Day does, and the two rule sets differ in the
 * screen code and the banner's heading and in nothing else at all. That is the
 * whole reason the two translator files became this table.
 *
 * The button set is the shared routine one, which is what the old reader gives
 * to the occurrence and to the snooze alike — `'petssnooze'` is the name of the
 * snooze's key and of a registered category, but it is not the button set
 * either banner actually carries.
 */
export const petsRules: ScreenRules<PetsItem> = {
    sourceScreenCode: 'pets',
    repeatUnitCode: 'day',
    repeatIntervalCount: 1,
    // Pets feeds are ticked off, and they can be snoozed from page and banner.
    canBeDoneBit: true,
    canBePushedBackBit: true,
    // Clear. A feed done today comes back tomorrow, because an animal needs
    // feeding again.
    doneEndsItemBit: false,
    standsForGroupBit: false,
    bannerTitleTextOf: () => 'Pets Routine',
    bannerButtonsCode: 'routineactions',

    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: (item) => item.completed,
    pushedBackStampOf: (item) => item.snoozedUntil,
    // A feed has a time only when both halves of it are actually numbers, the
    // same as My Day.
    dueOf: (item) =>
        typeof item.hour === 'number' && typeof item.minute === 'number'
            ? { hasDueTimeBit: true, dueHour: item.hour, dueMinute: item.minute }
            : { hasDueTimeBit: false },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (item) => `Time for ${item.label}!`,
};

/**
 * My Week's rules.
 *
 * The weekday is `chore.day` exactly as the app saves it, Sunday as 0 through
 * Saturday as 6. The old reader adds one when it builds the trigger, because
 * the phone counts weekdays from one, and that addition belongs at the phone
 * boundary and nowhere else. The shape is the app's own truth about an item,
 * and a phone's counting convention living inside it would be a second thing
 * every reader of the shape has to remember. `scheduler/weeklyreset.ts` already
 * works in the saved counting, so the shape agrees with the app's own
 * arithmetic and disagrees with nothing.
 *
 * `isDoneOf` is `chore.completed`, and this is a deliberate difference from the
 * old reader, which never looks at the tick. That reader arms one true weekly
 * repeat per chore whatever the tick says, because a repeating alarm cannot be
 * told to skip a single week — so a chore already ticked off still calls out.
 * That is My Week's own long-standing fault. The translator tells the truth
 * instead, and nothing on the phone changes because of it: nothing calls the
 * translator, and the behaviour only moves when the screen is swapped over, at
 * which point My Week stops being a repeat and becomes single moments like the
 * other two, which is the cure.
 *
 * The tick is safe to read. `resetForNewCycle` in `scheduler/weeklyreset.ts`
 * clears `completed` once the chore's own cycle comes round again, each chore
 * on its own day, and clears a stale `postponedTo` the same way.
 *
 * A chore also carries a `doneAt` which the weekly reset uses and the reader
 * does not declare. It belongs to the reset and not to the engine, so nothing
 * here looks at it.
 */
export const myWeekRules: ScreenRules<Chore> = {
    sourceScreenCode: 'myweek',
    repeatUnitCode: 'week',
    repeatIntervalCount: 1,
    canBeDoneBit: true,
    canBePushedBackBit: true,
    // Clear. A chore done this week comes round next week.
    doneEndsItemBit: false,
    standsForGroupBit: false,
    bannerTitleTextOf: () => 'Weekly Chore',
    // The shared routine button set, the same trap as Pets: `'myweekpostpone'`
    // is the name of the postpone's key in the old reader, not a button set.
    bannerButtonsCode: 'routineactions',

    idOf: (chore) => chore.id,
    nameOf: (chore) => chore.label,
    isDoneOf: (chore) => chore.completed,
    pushedBackStampOf: (chore) => chore.postponedTo,
    weekdayNumberOf: (chore) =>
        typeof chore.day === 'number' ? chore.day : undefined,
    // A chore has a time only when all three of its parts are actually numbers,
    // which is the guard the old reader makes. A single moment does not belong
    // to a weekly item, so it is left off. The weekday itself is written on
    // the repeat group, not here.
    dueOf: (chore) =>
        typeof chore.day === 'number'
            && typeof chore.hour === 'number'
            && typeof chore.minute === 'number'
            ? {
                hasDueTimeBit: true,
                dueHour: chore.hour,
                dueMinute: chore.minute,
            }
            : { hasDueTimeBit: false },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (chore) => `Time for ${chore.label}!`,
};

/**
 * Look Ahead's rules.
 *
 * A Look Ahead entry comes due at one moment, so it carries `dueMoment` and
 * leaves the hour and the minute off. The hour is already inside the moment,
 * and two copies of one fact are two things that can come to disagree.
 *
 * The screen has no done field at all, so `isDoneOf` is always false and
 * `canBeDoneBit` is clear. With the capability bit clear, `stillwanted.ts`
 * never reaches the state, and Look Ahead falls out as a rule rather than as an
 * exception.
 *
 * The old reader's `due.getTime() > now` guard is deliberately not carried
 * across. That is a judgment about whether a past entry still wants arming, and
 * judgments belong in `stillwanted.ts`. The translator says what the item IS,
 * so an entry whose moment has gone comes through here with its moment intact.
 */
export const lookAheadRules: ScreenRules<LookAheadItem> = {
    sourceScreenCode: 'lookahead',
    // The screen has no done at all.
    canBeDoneBit: false,
    // The page delays and the banner delays, both writing `delayedUntil`.
    canBePushedBackBit: true,
    // It never matters, the done bit being clear, but it is written down all
    // the same so that every bit of the shape is set on purpose.
    doneEndsItemBit: false,
    standsForGroupBit: false,
    // The emoji is part of the heading, word for word as the old reader writes
    // it, so the swap over changes nothing a person sees.
    bannerTitleTextOf: () => '🔭 Look Ahead',
    bannerButtonsCode: 'lookaheadactions',

    idOf: (item) => item.id,
    nameOf: (item) => item.label,
    isDoneOf: () => false,
    pushedBackStampOf: (item) => item.delayedUntil,
    // The entry has a date only when the year, the month and the day are all
    // actually numbers, which is the guard the old reader makes. An entry saved
    // without an hour or a minute counts as midnight, as the old reader has it.
    dueOf: (item) =>
        typeof item.year === 'number'
            && typeof item.month === 'number'
            && typeof item.day === 'number'
            ? {
                hasDueTimeBit: true,
                dueMoment: new Date(
                    item.year,
                    item.month,
                    item.day,
                    item.hour ?? 0,
                    item.minute ?? 0,
                    0,
                    0,
                ).getTime(),
            }
            : { hasDueTimeBit: false },
    leadTimesOf: () => atTheMomentItself,
    bannerBodyTextOf: (item) => `Time for ${item.label}!`,
};

/**
 * The banner's sentence for a To-Do appointment, word for word as the old
 * reader writes it. The app also builds this in a screen file that brings
 * React Native with it, so the two lines that matter are written out here
 * to keep the translator plain.
 */
function twoDigits(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function dueSentence(year: number, month: number, day: number, hour: number, minute: number): string {
    const date = `${twoDigits(month + 1)}/${twoDigits(day)}/${twoDigits(year % 100)}`;
    const time = `${twoDigits(hour)}:${twoDigits(minute)}`;
    return `Due: ${date} at ${time}`;
}

/**
 * To-Do's rules.
 *
 * A To-Do task is a date item. Its name is saved as `title` rather than
 * `label`, and its several reminders are lead times off one due moment. An
 * empty reminder list means nothing to say, not even at the appointment —
 * that is what the app does today, and it falls out of the empty list rather
 * than out of a rule about kinds.
 *
 * A task finished on the page is finished. Done ends the item. An appointment
 * cannot be snoozed or delayed, so the push-back bit is clear and there is
 * no stamp to copy.
 *
 * A background task is the same shape with no time. No time means nothing to
 * arm, so it needs no banner and no extra bit. The eight o'clock group banner
 * the old reader still builds is not a To-Do item and is not produced here.
 *
 * A missing hour counts as noon, as the old reader has it. Look Ahead counts
 * a missing hour as midnight. Both stay as they are until the swap.
 */
export const todoRules: ScreenRules<Task> = {
    sourceScreenCode: 'todo',
    canBeDoneBit: true,
    canBePushedBackBit: false,
    doneEndsItemBit: true,
    standsForGroupBit: false,
    bannerButtonsCode: 'todook',

    idOf: (task) => task.id,
    nameOf: (task) => task.title,
    isDoneOf: (task) => task.completed,
    pushedBackStampOf: () => undefined,
    dueOf: (task) => {
        // A background task has no appointment. Any date sitting on it is not
        // a due time, and reading the saved kind here is the same act as
        // reading a chore's weekday.
        if (task.taskType === 'background') {
            return { hasDueTimeBit: false };
        }
        if (typeof task.year === 'number'
            && typeof task.month === 'number'
            && typeof task.day === 'number') {
            return {
                hasDueTimeBit: true,
                dueMoment: new Date(
                    task.year,
                    task.month,
                    task.day,
                    task.hour ?? 12,
                    task.minute ?? 0,
                    0,
                    0,
                ).getTime(),
            };
        }
        return { hasDueTimeBit: false };
    },
    leadTimesOf: (task) => {
        if (!task.reminders || task.reminders.length === 0) {
            return [];
        }
        return task.reminders.map((reminder) => {
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
    },
    bannerTitleTextOf: (task) => `📋 Reminder: ${task.title}`,
    bannerBodyTextOf: (task) => {
        if (task.taskType === 'background'
            || typeof task.year !== 'number'
            || typeof task.month !== 'number'
            || typeof task.day !== 'number') {
            return '';
        }
        return dueSentence(
            task.year,
            task.month,
            task.day,
            task.hour ?? 12,
            task.minute ?? 0,
        );
    },
};

/** Turn every saved My Day item into a shaped item. */
export function translateMyDay(items: MyDayItem[], now: number): ShapedItem[] {
    return translateWith(myDayRules, items, now);
}

/** Turn every saved Pets feed into a shaped item. */
export function translatePets(items: PetsItem[], now: number): ShapedItem[] {
    return translateWith(petsRules, items, now);
}

/** Turn every saved chore into a shaped item. */
export function translateMyWeek(chores: Chore[], now: number): ShapedItem[] {
    return translateWith(myWeekRules, chores, now);
}

/** Turn every saved Look Ahead entry into a shaped item. */
export function translateLookAhead(items: LookAheadItem[], now: number): ShapedItem[] {
    return translateWith(lookAheadRules, items, now);
}

/** Turn every saved To-Do task into a shaped item. */
export function translateToDo(tasks: Task[], now: number): ShapedItem[] {
    return translateWith(todoRules, tasks, now);
}
