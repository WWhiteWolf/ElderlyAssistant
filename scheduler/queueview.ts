// The queue view.
//
// Plain arithmetic that turns the phone's pending reminders into something a
// person can read: which page each one came from, when it last came due, when
// it comes due next, and which part of the week it falls in.
//
// Nothing here touches storage, the phone, React Native or Expo, so Node can
// check every case of it without a build and without a simulator.
//
// Why it exists: a missing reminder is invisible until the moment it fails to
// arrive, and by then it is too late to matter. This is what the Scheduled
// Reminders screen reads, so that a reminder which has quietly gone can be
// found on a quiet afternoon instead of on the morning it lets you down.

import { PAGE_LABELS } from '../constants/page-names.ts';
import { nextFireTime } from './reconcile.ts';
import type { QueueEntry } from './reconcile.ts';
import type { WantedTrigger } from './types.ts';

/**
 * What each page is called on screen.
 *
 * The key is the current source the app tags a reminder with, which is also
 * how a tapped banner finds its way back to the right page. A source that is
 * not here belongs to something the screen cannot name — the Timer above all
 * — and those are counted but never listed (Patrick, #12-new).
 *
 * Every cadence has its own source. A snoozed or delayed source is named
 * separately so it does not look like a second copy of the base reminder.
 */
export const PAGE_NAMES: Record<string, string> = {
    daily: PAGE_LABELS.daily,
    dailysnooze: `${PAGE_LABELS.daily} — snoozed`,
    weekly: PAGE_LABELS.weekly,
    weeklysnooze: `${PAGE_LABELS.weekly} — snoozed`,
    monthly: PAGE_LABELS.monthly,
    monthlydelay: `${PAGE_LABELS.monthly} — delayed`,
    quarterly: PAGE_LABELS.quarterly,
    quarterlydelay: `${PAGE_LABELS.quarterly} — delayed`,
    yearly: PAGE_LABELS.yearly,
    yearlydelay: `${PAGE_LABELS.yearly} — delayed`,
    appointments: PAGE_LABELS.appointments,
    memorytest: PAGE_LABELS.memorytest,
};

/** The page name a queue row should show. */
function pageNameOf(entry: QueueEntry): string | undefined {
    if (!entry.source) return undefined;
    return PAGE_NAMES[entry.source];
}

/** One pending reminder, described for a person rather than for the app. */
export interface PendingReminder {
    // The phone's own name for it. Only ever used to tell two rows apart.
    identifier: string;
    // The item's own name, as the banner shows it.
    label: string;
    itemId?: string;
    // The page it belongs to, already turned into words.
    page: string;
    // When it fires, when the app knows. Null for one armed by hand.
    trigger: WantedTrigger | null;
    // The heading and sentence the banner will actually show.
    title?: string;
    body?: string;
    // Which set of buttons it carries when pressed and held.
    categoryIdentifier?: string;
    // The next moment it comes due, and the last one it came due at. Null when
    // the trigger is unknown, and lastDue is null for a one-off still ahead.
    nextDue: number | null;
    lastDue: number | null;
}

/**
 * When a reminder was last due to fire, counting back from `now`.
 *
 * This is arithmetic and not a record. It says when the phone should have
 * spoken, which is the useful half: if a repeating reminder was due at eight
 * this morning and is still sitting here properly armed, then it fired and was
 * missed. If it has gone from the list altogether, that is the problem.
 *
 * The app cannot know whether the phone actually delivered anything — iOS keeps
 * no history an app can read (#12-new).
 */
export function lastDueTime(trigger: WantedTrigger, now: number): number | null {
    if (trigger.kind === 'date') {
        return trigger.at <= now ? trigger.at : null;
    }

    const when = new Date(now);
    when.setHours(trigger.hour, trigger.minute, 0, 0);

    if (trigger.kind === 'daily') {
        if (when.getTime() > now) when.setDate(when.getDate() - 1);
        return when.getTime();
    }

    // Weekly. The trigger counts Sunday as 1, and a date counts it as 0.
    const wantedDay = trigger.weekday - 1;
    let daysBack = (when.getDay() - wantedDay + 7) % 7;
    if (daysBack === 0 && when.getTime() > now) daysBack = 7;
    when.setDate(when.getDate() - daysBack);
    return when.getTime();
}

/**
 * Turn one entry from the phone's queue into a row a person can read.
 *
 * Returns null when the source is one the screen cannot name, which is how the
 * Timer's alerts stay off the list.
 */
export function toPending(entry: QueueEntry, now: number): PendingReminder | null {
    if (!entry.source) return null;
    const page = pageNameOf(entry);
    if (!page) return null;

    return {
        identifier: entry.identifier,
        label: entry.label && entry.label.trim() ? entry.label : 'Unnamed reminder',
        itemId: entry.itemId,
        page,
        trigger: entry.trigger,
        title: entry.title,
        body: entry.body,
        categoryIdentifier: entry.categoryIdentifier,
        nextDue: entry.trigger ? nextFireTime(entry.trigger, now) : null,
        lastDue: entry.trigger ? lastDueTime(entry.trigger, now) : null,
    };
}

/** The headings the list is broken under. */
export type GroupName = 'Today' | 'Tomorrow' | 'This Week' | 'Later' | 'Time not known';

/** One heading and the reminders beneath it. */
export interface Group {
    name: GroupName;
    reminders: PendingReminder[];
}

/** The start of the day `now` falls in. */
function startOfDay(now: number): number {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
}

/** The start of the day `days` days after the one `now` falls in. */
function startOfDayAhead(now: number, days: number): number {
    const d = new Date(startOfDay(now));
    d.setDate(d.getDate() + days);
    return d.getTime();
}

/** Which heading one reminder falls under. */
export function groupFor(reminder: PendingReminder, now: number): GroupName {
    if (reminder.nextDue == null) return 'Time not known';
    if (reminder.nextDue < startOfDayAhead(now, 1)) return 'Today';
    if (reminder.nextDue < startOfDayAhead(now, 2)) return 'Tomorrow';
    if (reminder.nextDue < startOfDayAhead(now, 7)) return 'This Week';
    return 'Later';
}

// The order the headings appear in. A heading with nothing under it is left out
// entirely rather than shown empty.
const GROUP_ORDER: GroupName[] = ['Today', 'Tomorrow', 'This Week', 'Later', 'Time not known'];

/**
 * Break the reminders under their headings, soonest first inside each.
 *
 * Apple's own guidance for lists is that rows sit under a heading which gives
 * them their context, rather than running as one flat column.
 */
export function groupByWhen(reminders: PendingReminder[], now: number): Group[] {
    const buckets = new Map<GroupName, PendingReminder[]>();
    for (const reminder of reminders) {
        const name = groupFor(reminder, now);
        const bucket = buckets.get(name);
        if (bucket) bucket.push(reminder);
        else buckets.set(name, [reminder]);
    }

    const groups: Group[] = [];
    for (const name of GROUP_ORDER) {
        const bucket = buckets.get(name);
        if (!bucket || bucket.length === 0) continue;
        bucket.sort((a, b) => (a.nextDue ?? 0) - (b.nextDue ?? 0));
        groups.push({ name, reminders: bucket });
    }
    return groups;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * A moment's time of day, as the rest of the app writes it — "8:00 AM".
 *
 * Built by hand rather than handed to the phone's own formatter, so that a test
 * running under Node gets the same answer the phone gives.
 */
export function formatClock(at: number): string {
    const d = new Date(at);
    const hour = d.getHours();
    const period = hour < 12 ? 'AM' : 'PM';
    let shown = hour % 12;
    if (shown === 0) shown = 12;
    return `${shown}:${String(d.getMinutes()).padStart(2, '0')} ${period}`;
}

/** A moment's day — "Friday, August 21". */
export function formatDay(at: number): string {
    const d = new Date(at);
    return `${DAY_NAMES[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

/** A whole moment — "Friday, August 21 at 4:15 PM". */
export function formatMoment(at: number): string {
    return `${formatDay(at)} at ${formatClock(at)}`;
}

/**
 * The short "when" that sits on a row in the list.
 *
 * The heading above the row already says which day it is, so a row under Today
 * or Tomorrow needs only the time. Further out the heading stops being enough,
 * so the day comes back — the weekday inside this week, the whole date beyond
 * it.
 */
export function describeWhenNext(reminder: PendingReminder, now: number): string {
    if (reminder.nextDue == null) return 'Time not known';
    const group = groupFor(reminder, now);
    if (group === 'Today' || group === 'Tomorrow') return formatClock(reminder.nextDue);
    if (group === 'This Week') {
        return `${DAY_NAMES[new Date(reminder.nextDue).getDay()]} at ${formatClock(reminder.nextDue)}`;
    }
    return formatMoment(reminder.nextDue);
}

/** True when this reminder comes round again rather than being spent. */
export function repeats(trigger: WantedTrigger | null): boolean {
    return trigger != null && trigger.kind !== 'date';
}

/** When it fires, in a sentence — "Every day at 8:00 AM". */
export function describeTrigger(trigger: WantedTrigger | null): string {
    if (!trigger) return 'The app has no record of when this one fires.';
    if (trigger.kind === 'daily') {
        return `Every day at ${formatClock(momentOf(trigger.hour, trigger.minute))}`;
    }
    if (trigger.kind === 'weekly') {
        return `Every ${DAY_NAMES[trigger.weekday - 1]} at ${formatClock(momentOf(trigger.hour, trigger.minute))}`;
    }
    return `Once, on ${formatMoment(trigger.at)}`;
}

/** A throwaway moment carrying one hour and minute, for the clock formatter. */
function momentOf(hour: number, minute: number): number {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.getTime();
}

/**
 * How full the phone is, in plain words.
 *
 * The ceiling is Apple's, and it is the thing that silently throws reminders
 * away, so it is worth saying — but as a sentence rather than as a number in a
 * heading, which is where the engineering language would show.
 */
export function describeHowFull(held: number, ceiling: number): string {
    const word = held === 1 ? 'reminder' : 'reminders';
    return `Your phone is holding ${held} ${word}. It has room for ${ceiling}.`;
}

/**
 * What the list is not showing, in plain words, or null when it shows
 * everything.
 *
 * The Timer's alerts are the usual answer. They take up room on the phone, so
 * they are counted, but they are short-lived things you set and then hear from
 * within the hour, so listing them here would be noise (Patrick, #12-new).
 */
export function describeWhatIsNotShown(hidden: number): string | null {
    if (hidden <= 0) return null;
    const word = hidden === 1 ? 'reminder is' : 'reminders are';
    return `${hidden} more ${word} set by the Timer and not shown here.`;
}
