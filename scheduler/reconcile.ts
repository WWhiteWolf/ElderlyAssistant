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
    // Which screen it belongs to.
    source?: string;
    // When it fires. Null when it could not be read.
    trigger: WantedTrigger | null;

    // Everything below is for the Scheduled Reminders screen to show and the
    // reconcile never looks at any of it (#12-new). It is carried here rather
    // than read a second time so the phone's queue is only ever asked once.
    //
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
    // Phone names to cancel.
    cancel: string[];
    // Reminders to create.
    create: WantedReminder[];
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
// Timer sets three of its own, and a few spare on top of that.
export const ROOM_FOR_OTHERS = 8;

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
 * `ownedSources` says which screens the scheduler answers for. A reminder from
 * anywhere else is never cancelled and never counted as ours.
 */
export function reconcile(
    wanted: WantedReminder[],
    queue: QueueEntry[],
    ownedSources: string[],
    now: number,
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
    for (const entry of owned) {
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
    const kept = new Set<string>();
    for (const reminder of fits) {
        const already = held.get(reminder.key);
        if (already && already.trigger && sameTrigger(already.trigger, reminder.trigger)) {
            kept.add(reminder.key);
        } else {
            create.push(reminder);
        }
    }

    const cancel: string[] = spare.map((entry) => entry.identifier);
    for (const [key, entry] of held) {
        if (!kept.has(key)) cancel.push(entry.identifier);
    }

    return { cancel, create, keep: kept.size, trimmed, others };
}
