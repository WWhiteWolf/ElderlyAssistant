// The Pets translator.
//
// It is handed the saved feed list and turns each saved feed into the one
// shape the engine reads. It decides nothing about which reminders to arm, how
// many occurrences to work out, or whether a done feed still wants speaking to
// — all of that is answered further along, once, against the common shape.
// Its whole job is to say what a Pets feed IS.
//
// Pets Day works exactly as My Day does, so this file is the twin of
// `./myday.ts` and differs from it only in the words the banner carries. It is
// kept as its own file for the same reason the two readers are: the two screens
// are their own things and either could change without the other.
//
// Nothing in the app calls this yet. The old reader in `../readers/pets.ts`
// stays exactly where it is and keeps working; it is retired only when this
// replacement is proved.
//
// It reads nothing, writes nothing, and knows nothing about the phone — so
// Node can check it in a fraction of a second. `now` is handed in rather than
// read from the clock, so a test can say what time it is.

import type { ShapedItem } from '../inputshape.ts';
import type { PetsItem } from '../readers/pets.ts';

/**
 * Turn every saved Pets feed into a shaped item.
 *
 * One shaped item per saved feed, in the order they were given, and none is
 * ever dropped. Dropping is a judgment, and judgments belong further along in
 * `stillwanted.ts`. A feed with no time and a feed already ticked off both
 * come through here like any other, carrying the facts that let the block
 * decide.
 *
 * `now` is not read at present. It is taken all the same, because every part
 * of this scheduler that could ever need the time takes it as an argument
 * rather than reaching for the clock, and a translator that later has to look
 * at the time should not change its shape to do it.
 */
export function translatePets(items: PetsItem[], now: number): ShapedItem[] {
    void now;
    return items.map((item) => translateOne(item));
}

/** One saved feed, in the shape the engine reads. */
function translateOne(item: PetsItem): ShapedItem {
    // A feed has a time only when both halves of it are actually numbers.
    // A time of null means it was cleared, and an older saved feed may have
    // no hour or minute at all, which counts as the same thing.
    const hasDueTimeBit =
        typeof item.hour === 'number' && typeof item.minute === 'number';

    return {
        // ---- what the item is ----

        sourceScreenCode: 'pets',
        itemIdText: item.id,
        itemNameText: item.label,

        // ---- when it comes due ----

        // Every Pets feed is a daily routine. That is what the screen is,
        // so there is no other kind to work out.
        triggerKindCode: 'daily',
        hasDueTimeBit,
        // Left off altogether when the feed has no time, rather than filled in
        // with zeros. Midnight is a real time, so a zero would have to be
        // interpreted before it could be told apart from an absence.
        ...(hasDueTimeBit
            ? { dueHour: item.hour as number, dueMinute: item.minute as number }
            : {}),
        // Neither a weekday nor a single moment belongs to a daily item, so
        // both are left off rather than filled in with something meaningless.

        // ---- capability bits: what this kind of item is allowed to do ----

        // Pets feeds are ticked off, and they can be snoozed both from the
        // page's own button and from the banner's.
        canBeDoneBit: true,
        canBePushedBackBit: true,
        // Clear, and this is the point of the whole screen. A feed done today
        // comes back tomorrow, because an animal needs feeding again.
        doneEndsItemBit: false,
        // Every Pets reminder stands for one feed. Standing for a group is
        // To-Do's eight o'clock banner and nothing here.
        standsForGroupBit: false,

        // ---- state: what has actually happened to this occurrence ----

        isDoneBit: item.completed,
        // Carried through exactly as saved, a stamp already in the past
        // included. Whether a stamp has been spent is a judgment, and
        // `stillwanted.ts` already makes it; making it twice, in two places,
        // is how the two would come to disagree.
        ...(item.snoozedUntil != null ? { pushedBackToStamp: item.snoozedUntil } : {}),

        // ---- how far ahead to speak ----

        // Empty, which for a daily item means it speaks at the moment itself.
        // Pets has never had lead times and does not want them: the whole
        // screen is about the thing happening now.
        leadTimeList: [],

        // ---- the banner's words ----

        // Word for word what the existing reader writes, so the swap over
        // changes nothing a person sees. The button set is the shared routine
        // one, which is what the old reader gives to the occurrence and to the
        // snooze alike — `'petssnooze'` is the name of the snooze's key and of
        // a registered category, but it is not the button set either banner
        // actually carries.
        bannerTitleText: 'Pets Routine',
        bannerBodyText: `Time for ${item.label}!`,
        bannerButtonsCode: 'routineactions',
    };
}
