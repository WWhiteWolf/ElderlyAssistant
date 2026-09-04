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
