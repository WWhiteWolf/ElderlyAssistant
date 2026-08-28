// The shape of one reminder the app wants to exist, and the key that names it.
//
// Nothing in this file touches storage, the phone, React Native or Expo. It is
// plain data and plain arithmetic, so Node can run it on a Mac with no build
// and no simulator. Everything the scheduler works with is built from these
// two pieces.

/** When a reminder fires. */
export type WantedTrigger =
    // Every day, at this time of day. One request that repeats forever.
    | { kind: 'daily'; hour: number; minute: number }
    // Once a week. The weekday numbers are the ones the phone itself uses,
    // where 1 is Sunday and 7 is Saturday.
    | { kind: 'weekly'; weekday: number; hour: number; minute: number }
    // Once, at one moment, and then it is spent. The moment is held as the
    // ordinary count of milliseconds so that a reader never has to build a
    // date object the tests would then have to guess at.
    | { kind: 'date'; at: number };

/** One reminder that the saved lists call for. */
export interface WantedReminder {
    // Names this one reminder and nothing else. See makeKey below.
    key: string;
    // Which screen the reminder belongs to. The app already routes a tapped
    // banner by this, so it is carried unchanged.
    source: string;
    // Which item on that screen.
    itemId: string;
    // The item's own name, as the banner shows it.
    label: string;
    // The banner's heading and its sentence.
    title: string;
    body: string;
    // Which set of buttons the banner carries when it is pressed and held.
    // A few reminders deliberately have no buttons at all, and leave it out.
    categoryIdentifier?: string;
    trigger: WantedTrigger;
    /**
     * The due day did not exist in that month, so the last day that does
     * exist was used instead.
     *
     * Left off means it was not shifted. A one-off and an unshifted series
     * leave it off. A later sheet can show an extra tap from this bit; this
     * step only makes the bit available.
     */
    shiftedForMissingDayBit?: boolean;
}

/**
 * Build the key that names one reminder.
 *
 * Three parts: the screen it came from, the item on that screen, and which of
 * that item's reminders this is. An order can want four reminders, so the
 * third part is what tells them apart — "daybefore" from "morningof". An item
 * with only one reminder uses "base".
 *
 * Because the key is built from what the reminder is rather than from when it
 * was made, the same item can never quietly end up with two of the same
 * reminder. That is what stops the piling up.
 */
export function makeKey(source: string, itemId: string, part: string): string {
    return `${source}:${itemId}:${part}`;
}

/** True when two triggers fire at exactly the same times. */
export function sameTrigger(a: WantedTrigger, b: WantedTrigger): boolean {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'daily' && b.kind === 'daily') {
        return a.hour === b.hour && a.minute === b.minute;
    }
    if (a.kind === 'weekly' && b.kind === 'weekly') {
        return a.weekday === b.weekday && a.hour === b.hour && a.minute === b.minute;
    }
    if (a.kind === 'date' && b.kind === 'date') {
        return a.at === b.at;
    }
    return false;
}
