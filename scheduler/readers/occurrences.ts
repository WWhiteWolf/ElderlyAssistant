// The calendar arithmetic the daily screens share.
//
// It answers one question — when does a thing with a time of day next come
// round, and what is each of those moments called — and it knows nothing about
// any particular screen. The words a banner carries, the name of its source and
// what a snooze does all stay in the reader they belong to; only the day
// counting lives here, so a correction to it is made once rather than once per
// screen.
//
// It reads nothing, writes nothing, and touches neither the phone nor React
// Native, so Node can check it in a fraction of a second.

/**
 * How many occurrences of each item are armed at a time.
 *
 * A repeating alarm is one request that returns forever, and it costs one of
 * the phone's sixty-four places. A single moment is spent the instant it fires,
 * so several have to be standing ready — one for each of the next few days.
 *
 * Two is Patrick's number, and it is two occurrences rather than two days, so
 * a thing that comes round weekly gets a fortnight rather than nothing at all.
 * He first said three and settled on two once the arithmetic was in front of
 * him: fourteen items three deep take forty-two of the fifty-six places the
 * module has to spend, and two deep take twenty-eight. What covers the rest is
 * the missed-firing notice — a stretch away longer than two occurrences is
 * told rather than armed for, which was his condition on the whole move.
 */
export const OCCURRENCES_AHEAD = 2;

/** True when two moments fall on the same calendar day. */
export function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

/**
 * The day a moment falls on, written as 20260826.
 *
 * This is what names one occurrence apart from the others. It is deliberately
 * the day itself rather than the occurrence's place in the run: a name like
 * "the first of the next three" means a different day tomorrow than it does
 * today, so every run would find every name pointing somewhere new and take
 * all three down and put all three back. Named by its own day, an occurrence
 * keeps its name until it fires, and the reconcile leaves it alone.
 *
 * It is built out of the date's own parts rather than from a written-out date,
 * because a written-out one comes in the phone's own locale.
 */
export function dayStamp(at: number): string {
    const when = new Date(at);
    const month = String(when.getMonth() + 1).padStart(2, '0');
    const day = String(when.getDate()).padStart(2, '0');
    return `${when.getFullYear()}${month}${day}`;
}

/**
 * The next few moments an item's time of day comes round, counting from `now`.
 *
 * The day is stepped a day at a time rather than by adding twenty-four hours,
 * so an item keeps its time of day across the clocks going forward or back.
 *
 * `completed` is what makes this different from simply listing the next few
 * days. An item ticked off is done for TODAY and today only — the daily reset
 * clears the tick as the day turns — so today's own occurrence is dropped and
 * the count starts at tomorrow's. An occurrence on any later day is never
 * dropped, because a tick has nothing to say about tomorrow.
 */
export function nextOccurrences(
    hour: number,
    minute: number,
    now: number,
    completed: boolean,
    count: number,
): number[] {
    const today = new Date(now);
    const when = new Date(now);
    when.setHours(hour, minute, 0, 0);

    // Today's has already gone by, so the first one still to come is
    // tomorrow's.
    if (when.getTime() <= now) when.setDate(when.getDate() + 1);

    // Ticked off today, and today's moment has not yet arrived: that is the
    // reminder that must not fire. It is the whole of the fault Patrick
    // reported — a thing already done reminding him to do it.
    if (completed && sameDay(when, today)) when.setDate(when.getDate() + 1);

    const moments: number[] = [];
    for (let i = 0; i < count; i++) {
        moments.push(when.getTime());
        when.setDate(when.getDate() + 1);
    }
    return moments;
}
