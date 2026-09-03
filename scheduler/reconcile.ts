// The reconcile.
//
// It is handed the reminders the saved lists call for, and a plain description
// of what the phone is holding right now. It works out what to cancel, what to
// create, and what to leave exactly as it is — and it leaves alone anything the
// scheduler does not own, such as the Timer's alerts.
//
// Nothing here touches storage or the phone. It is arithmetic and comparison,
// so Node can check every case of it in a fraction of a second.

import { sameTrigger } from './types.ts';
import type { WantedReminder, WantedTrigger } from './types.ts';

/** One reminder the phone is holding, described plainly. */
export interface QueueEntry {
    // The phone's own name for it, which is what a cancel needs.
    identifier: string;
    // Our name for it, when it is one of ours. Reminders left over from the
    // old way of scheduling have none.
    key?: string;
    // Which current reminder source it belongs to.
    source?: string;
    // When it fires. Null when it could not be read.
    trigger: WantedTrigger | null;

    // Everything below used to be only for the Scheduled Reminders screen.
    // The reconcile now compares name, heading, sentence and buttons as well
    // as key and time, so a renamed item replaces the stale banner.

    // The item's own name, and which item on its page.
    label?: string;
    itemId?: string;
    // The heading and the sentence the banner will actually show.
    title?: string;
    body?: string;
    // Which set of buttons it carries when pressed and held.
    categoryIdentifier?: string;
}

/** What the reconcile decided. */
export interface Plan {
    // Phone names to cancel. These are gone, not being replaced.
    cancel: string[];
    // Reminders to create. These are new, not replacements.
    create: WantedReminder[];
    // A held reminder whose contents or time changed. Create the new one
    // first; cancel the old identifier only after that succeeds.
    replace: { identifier: string; reminder: WantedReminder }[];
    // How many were already right and were left untouched.
    keep: number;
    // Wanted reminders that did not fit under the ceiling. The furthest away.
    trimmed: WantedReminder[];
    // How many of the phone's reminders belong to something else, such as the
    // Timer. They are never touched, but they do take up room.
    others: number;
}

// Apple holds sixty-four reminders that have not yet fired. Past that it keeps
// the soonest and throws the rest away without saying so.
export const CEILING = 64;

// Room left free for the reminders the scheduler does not own — a running
// Timer sets three of its own, and a few spare on top of that. The spare is
// also what lets a replacement be created before the old one is cancelled.
export const ROOM_FOR_OTHERS = 8;

/**
 * Sources that come from the one saved reminder list.
 *
 * When that list cannot be read, held reminders from these sources stay
 * on the phone. They are unknown, not empty.
 */
export const REMINDER_ITEM_SOURCES = [
    'daily',
    'dailysnooze',
    'weekly',
    'weeklysnooze',
    'monthly',
    'monthlydelay',
    'quarterly',
    'quarterlydelay',
    'yearly',
    'yearlydelay',
    'onetime',
];

/** Sources whose held reminders must be left untouched after a failed read. */
export function unreadSourcesFor(failedListKeys: string[]): string[] {
    const unread: string[] = [];
    if (failedListKeys.includes('reminder_items')) {
        unread.push(...REMINDER_ITEM_SOURCES);
    }
    if (failedListKeys.includes('memtest_session')) {
        unread.push('memorytest');
    }
    return unread;
}

/**
 * When a reminder will next fire, counting from `now`.
 *
 * A repeating reminder has no single moment, so this answers with its next
 * one. It is used for sorting, so that if anything has to be trimmed it is the
 * furthest away.
 */
export function nextFireTime(trigger: WantedTrigger, now: number): number {
    if (trigger.kind === 'date') return trigger.at;

    const when = new Date(now);
    when.setHours(trigger.hour, trigger.minute, 0, 0);

    if (trigger.kind === 'daily') {
        if (when.getTime() <= now) when.setDate(when.getDate() + 1);
        return when.getTime();
    }

    // Weekly. The trigger counts Sunday as 1, and a date counts it as 0.
    const wantedDay = trigger.weekday - 1;
    let daysAway = (wantedDay - when.getDay() + 7) % 7;
    if (daysAway === 0 && when.getTime() <= now) daysAway = 7;
    when.setDate(when.getDate() + daysAway);
    return when.getTime();
}

/**
 * Work out what to change so the phone holds exactly the wanted reminders.
 *
 * Anything already right is left alone, which matters: it means a save that
 * changes one item touches one reminder instead of tearing the whole set down
 * and building it again.
 *
 * `ownedSources` says which sources the scheduler answers for. A reminder from
 * anywhere else is never cancelled and never counted as ours.
 */
export function reconcile(
    wanted: WantedReminder[],
    queue: QueueEntry[],
    ownedSources: string[],
    now: number,
    unreadSources: string[] = [],
): Plan {
    const owned = queue.filter((entry) => entry.source != null && ownedSources.includes(entry.source));
    const others = queue.length - owned.length;

    // Trim to what the phone can actually hold, furthest away first.
    const allowance = Math.max(0, CEILING - ROOM_FOR_OTHERS - others);
    const sorted = [...wanted].sort((a, b) => nextFireTime(a.trigger, now) - nextFireTime(b.trigger, now));
    const fits = sorted.slice(0, allowance);
    const trimmed = sorted.slice(allowance);

    // What the phone is holding, by our own name for it. A name that somehow
    // turns up twice keeps the first and the rest are cancelled below.
    const held = new Map<string, QueueEntry>();
    const spare: QueueEntry[] = [];
    let preserved = 0;
    for (const entry of owned) {
        if (entry.source != null && unreadSources.includes(entry.source)) {
            // Unknown, not empty: leave this source's requests where they are.
            preserved++;
            continue;
        }
        if (!entry.key) {
            // One of ours by screen, but with no name — left over from the old
            // way of scheduling. It goes.
            spare.push(entry);
        } else if (held.has(entry.key)) {
            spare.push(entry);
        } else {
            held.set(entry.key, entry);
        }
    }

    const create: WantedReminder[] = [];
    const replace: { identifier: string; reminder: WantedReminder }[] = [];
    const kept = new Set<string>();
    const accounted = new Set<string>();
    for (const reminder of fits) {
        const already = held.get(reminder.key);
        if (already && sameHeld(already, reminder)) {
            kept.add(reminder.key);
            accounted.add(reminder.key);
        } else if (already) {
            replace.push({ identifier: already.identifier, reminder });
            accounted.add(reminder.key);
        } else {
            create.push(reminder);
        }
    }

    const cancel: string[] = spare.map((entry) => entry.identifier);
    for (const [key, entry] of held) {
        if (!accounted.has(key)) cancel.push(entry.identifier);
    }

    return {
        cancel,
        create,
        replace,
        keep: kept.size + preserved,
        trimmed,
        others,
    };
}

/** True when the held request is already the wanted reminder, contents included. */
function sameHeld(already: QueueEntry, reminder: WantedReminder): boolean {
    if (!already.trigger || !sameTrigger(already.trigger, reminder.trigger)) return false;
    if (already.source !== reminder.source) return false;
    if (already.itemId !== reminder.itemId) return false;
    if (already.label !== reminder.label) return false;
    if (already.title !== reminder.title) return false;
    if (already.body !== reminder.body) return false;
    if ((already.categoryIdentifier ?? undefined) !== (reminder.categoryIdentifier ?? undefined)) {
        return false;
    }
    return true;
}
