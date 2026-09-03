// The weekly reset, as plain arithmetic.
//
// Weekly checkmarks clear on their own cycle rather than on the Daily
// boundary, so this is a sibling of `dailyreset.ts` and not an extension of
// it. The daily reset turns on one saved date for a whole kind; Weekly has no
// single boundary at all, because each item rolls over on its own weekday.
//
// The arithmetic used to live on a page, where it could run only while that
// page was open. It is unchanged in what it decides — only where it lives,
// and the fact that `now` is handed in rather than read from the clock, so a
// test can say what time it is.
//
// Nothing in this file touches storage, the phone, React Native or Expo.

/** What the weekly reset needs of a chore. */
export interface ResettableChore {
    id: string;
    // The chore's own day of the week, counting Sunday as 0 through Saturday
    // as 6. This is what gives each chore a cycle of its own.
    day: number;
    hour: number;
    minute: number;
    completed: boolean;
    // The moment the chore was last marked done.
    doneAt?: number;
    // The moment a postponed chore was pushed to, for this cycle only.
    postponedTo?: number;
}

/**
 * The moment a chore's cycle last came round, on or before `now`.
 *
 * That is its own weekday at its own time, counting backwards. If today is its
 * day but its time has not arrived yet, the cycle it belongs to began a week
 * ago rather than this morning — which is what keeps a chore ticked at eight
 * in the morning from being cleared again at noon the same day.
 *
 * The day is stepped rather than a number of hours subtracted, so the chore
 * keeps its time of day across the clocks going forward or back.
 */
export function lastOccurrence(day: number, hour: number, minute: number, now: number): number {
    const today = new Date(now);
    const when = new Date(now);
    when.setHours(hour, minute, 0, 0);

    let back = (today.getDay() - day + 7) % 7;
    if (back === 0 && when.getTime() > now) back = 7;

    when.setDate(when.getDate() - back);
    return when.getTime();
}

/**
 * The chore list, with anything belonging to a finished cycle cleared.
 *
 * A checkmark says the chore was done, and it holds only until the chore comes
 * round again. So a tick made before the cycle's most recent start is spent,
 * and comes off along with the moment it was made.
 *
 * A postpone belongs to its cycle in the same way: it moves this week's
 * reminder and says nothing about the weeks after it, so a postpone older than
 * the latest occurrence is stale and goes too.
 *
 * Nothing else about a chore is touched — its name, its day and its time all
 * belong to the chore rather than to the cycle. A chore already clear is
 * handed back exactly as it was.
 */
export function resetForNewCycle<T extends ResettableChore>(chores: T[], now: number): T[] {
    return chores.map((chore) => {
        let next = chore;
        const last = lastOccurrence(chore.day, chore.hour, chore.minute, now);

        if (next.completed && next.doneAt != null && next.doneAt < last) {
            next = { ...next, completed: false, doneAt: undefined };
        }
        if (next.postponedTo != null && next.postponedTo < last) {
            next = { ...next, postponedTo: undefined };
        }
        return next;
    });
}
