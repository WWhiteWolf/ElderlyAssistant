// The scheduler's top.
//
// This is the one file in the scheduler that touches storage and the phone.
// Everything it decides is decided by the translators, the blocks and the
// reconcile, which are plain and are tested; this file only fetches, converts
// and applies. It is kept thin on purpose, because it is the part Node cannot
// check.
//
// It answers one question — given everything saved on this phone right now,
// which reminders should exist? — and then makes that true.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import { reconcile, unreadSourcesFor } from './reconcile.ts';
import type { Plan, QueueEntry } from './reconcile.ts';
import { isNewDay, resetForNewDay } from './dailyreset.ts';
import { resetForNewCycle } from './weeklyreset.ts';
import type { ResettableChore } from './weeklyreset.ts';
import { HEALTH_KEY, MISSES_KEY, addRun, faultSignature, mergeMisses, missesForRollover } from './health.ts';
import type { Miss, MissableItem, RunFault, RunRecord } from './health.ts';
import { clearStartingOccurrenceTicks, missablesDueOnDays, unprocessedDays } from './miss-candidates.ts';
import type { WantedReminder, WantedTrigger } from './types.ts';

import {
    translateReminderItems,
    usesWeeklyCycleStampOf,
} from './translators/translate.ts';
import { remindersFor } from './remindersfor.ts';
import { DEFAULT_CLOCK_TIMES } from './clocktimes.ts';
import { weeklyDoneHoldsUntil } from './leadmoments.ts';
import type { ClockTimes, TimeOfDay } from './leadmoments.ts';
import type { ReminderItem } from '../modules/reminder-types.ts';
import {
    changeSavedReminderItems,
    readSavedReminderItems,
} from '../modules/reminder-list-storage.ts';
import { applyOpsFor } from './apply.ts';
import { oneSchedulerRun } from './rungate.ts';
import { oneDailyReset } from './resetgate.ts';
import { REMINDER_LIST_SOURCE_CODES } from './sources.ts';
import {
    doneItemIdsOf,
    presentedIdentifiersToDismiss,
} from './presented.ts';

/**
 * The current notification sources the scheduler answers for.
 *
 * A reminder from anywhere else — the Timer's alerts above all — is never
 * cancelled and never re-created. It is simply left where it is and counted
 * against the room the phone has.
 *
 * Daily, One Time and Weekly each have a base source and a snoozed source.
 * Monthly, Quarterly and Yearly each have a base source and a delayed source.
 * Every source names its current page directly, so the same word travels
 * through translation, reconciliation, the phone and a banner return.
 *
 * Those pushed-back moments are written on the saved item itself. The
 * scheduler can therefore answer for them like any other reminder and can
 * move one without leaving a duplicate behind.
 *
 * Appointments carry one current source and only the OK action. They cannot
 * be pushed back.
 *
 * Bucket List produces no reminder, so it has no owned notification source.
 *
 * This set is also the boundary used by reconciliation: anything outside it
 * is left untouched.
 */
export const OWNED_SOURCES = REMINDER_LIST_SOURCE_CODES.slice();

/**
 * Roll the day over, if it has not been rolled yet.
 *
 * This used to happen only when a daily page was opened, which meant the day
 * never turned over for a page that was not visited. It now runs wherever the
 * module runs — on launch, on every return to the front, and after any save —
 * so the checkmarks clear whether or not those screens are looked at.
 *
 * Misses for every kind that has a day are written first, from the ticks still
 * sitting on those items. Daily's ticks then clear with the day. Monthly,
 * Quarterly, Yearly and Birthdays ticks stay until the morning of the next due
 * date, or come off if that date has already passed.
 *
 * It is safe to call at any time: on a day that has already been rolled over it
 * reads the date and does nothing else. The list load calls it before it reads,
 * so a page never draws yesterday's checkmarks from a stale load.
 *
 * Two callers can arrive together on open — the Siri list refresh and the
 * scheduler. They share one roll: a second call waits for the first instead of
 * reading the ticks after they have already been cleared.
 *
 * It answers with whatever went wrong, which is nothing on an ordinary day.
 */
export async function runDailyReset(): Promise<RunFault[]> {
    return oneDailyReset(rollTheDayOver);
}

async function rollTheDayOver(): Promise<RunFault[]> {
    const now = new Date();
    const today = now.toLocaleDateString();
    const faults: RunFault[] = [];

    try {
        const savedDate = await AsyncStorage.getItem('reminder_last_date');
        if (!isNewDay(savedDate, today)) return [];

        await changeSavedReminderItems(async (items) => {
            // Daily, Weekly, Monthly, Quarterly, Yearly and One Time: anything
            // that fell on an unprocessed day is written as a miss from this
            // same pre-clear snapshot. Bucket List has no day and is not in this
            // set.
            if (savedDate) {
                const days = unprocessedDays(savedDate, now);
                await recordMisses(missablesDueOnDays(items, days), 'reminder_items', savedDate);
            }

            if (items.length === 0) return items;
            const daily = items.filter((one) => one.kind === 'daily');
            const resetDaily = resetForNewDay(daily);
            const byId = new Map(resetDaily.map((one) => [one.id, one]));
            return clearStartingOccurrenceTicks(
                items.map((one) => byId.get(one.id) ?? one),
                now,
            );
        });
        await AsyncStorage.setItem('reminder_last_date', today);
    } catch {
        faults.push({ kind: 'reset', listKey: 'reminder_items' });
    }

    return faults;
}

/**
 * Roll weekly items on, for any whose cycle has come round again.
 *
 * This is the daily reset's sibling rather than a part of it, because a weekly
 * item has no single boundary to turn on: each rolls over on its own day of
 * the week, so every item is judged separately against its own last
 * occurrence. That is why there is no saved date here and no guard like
 * `isNewDay` — the items themselves carry when they were done.
 *
 * It is safe to call at any time. When nothing has come round the transaction
 * leaves the list unchanged.
 *
 * It answers with whatever went wrong, which is nothing on an ordinary run.
 */
export async function runWeeklyReset(): Promise<RunFault[]> {
    try {
        await changeSavedReminderItems((items) => {
            const resettable = items.filter((one) =>
                usesWeeklyCycleStampOf(one.kind)
            );
            if (resettable.length === 0) return items;

            const now = Date.now();
            const asChores: ResettableChore[] = resettable.map((one) => {
                const shaped = translateReminderItems([one], now)[0];
                const holds = shaped !== undefined && typeof one.doneAt === 'number'
                    ? weeklyDoneHoldsUntil(shaped, one.doneAt)
                    : null;
                return {
                    id: one.id,
                    day: one.day ?? 0,
                    hour: typeof one.hour === 'number' ? one.hour : 12,
                    minute: typeof one.minute === 'number' ? one.minute : 0,
                    completed: !!one.completed,
                    ...(typeof one.doneAt === 'number' ? { doneAt: one.doneAt } : {}),
                    ...(holds !== null ? { doneHoldsUntil: holds } : {}),
                    ...(typeof one.snoozedUntil === 'number' ? { postponedTo: one.snoozedUntil } : {}),
                };
            });
            const rolled = resetForNewCycle(asChores, now);
            const changed = rolled.some((chore, index) => chore !== asChores[index]);
            if (!changed) return items;

            const byId = new Map(rolled.map((one) => [one.id, one]));
            return items.map((one) => {
                if (!usesWeeklyCycleStampOf(one.kind)) return one;
                const chore = byId.get(one.id);
                if (!chore) return one;
                const { snoozedUntil: _dropSnooze, doneAt: _dropDone, ...rest } = one;
                void _dropSnooze;
                void _dropDone;
                return {
                    ...rest,
                    completed: chore.completed,
                    ...(chore.doneAt != null ? { doneAt: chore.doneAt } : {}),
                    ...(chore.postponedTo != null ? { snoozedUntil: chore.postponedTo } : {}),
                };
            });
        });
        return [];
    } catch {
        return [{ kind: 'reset', listKey: 'weekly' }];
    }
}

/**
 * Yesterday, written the same way the phone writes a date.
 *
 * It counts back from the clock rather than reading the date string the app
 * saved, because that string is written in the phone's own locale — 8/25/2026
 * here, 25/08/2026 elsewhere — and a string like that cannot be safely parsed
 * back into a day.
 */
function yesterdaysDate(): string {
    const when = new Date();
    when.setDate(when.getDate() - 1);
    return when.toLocaleDateString();
}

/**
 * Write down the reminders that never reached Patrick, as the day rolls over.
 *
 * `savedDate` is the last day this screen rolled over. When that is the day
 * before today, the app was open yesterday and the checkmarks mean what they
 * say. When it is older, the app went unopened for at least a whole day and
 * every reminding item missed yesterday whatever its checkmark shows. When
 * there is none at all, this screen has never rolled over and there is nothing
 * to claim was missed.
 */
async function recordMisses(
    items: MissableItem[],
    listKey: string,
    savedDate: string | null,
): Promise<void> {
    try {
        if (!savedDate) return;
        const yesterday = yesterdaysDate();
        const fresh = missesForRollover(items, listKey, yesterday, savedDate !== yesterday);
        if (fresh.length === 0) return;

        const raw = await AsyncStorage.getItem(MISSES_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const waiting: Miss[] = Array.isArray(parsed) ? parsed : [];
        await AsyncStorage.setItem(MISSES_KEY, JSON.stringify(mergeMisses(waiting, fresh)));
    } catch {
        // Nothing can be done, and the reset itself must still go ahead.
    }
}

/**
 * Take down delivered banners that have finished their work.
 *
 * A thing not done on time is of no use as a reminder (Patrick), so yesterday's
 * untapped banner does not stay in Notification Center. Done is stronger: every
 * delivered copy carrying that item's identity goes, including a base banner
 * and a delay that had both arrived before the tap.
 *
 * The saved Done state is handed in by `gatherWanted`, so pages, banner actions
 * and Siri all reach this same cleanup without remembering it themselves.
 *
 * The phone is read back after dismissal and any remainder is tried once more.
 * A banner that still cannot be removed is a quiet sweep fault — it has already
 * fired, so no expected reminder is being lost.
 */
export async function sweepPresentedBanners(doneItemIds: string[]): Promise<RunFault[]> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const removable = async (): Promise<string[]> => {
        const presented = await Notifications.getPresentedNotificationsAsync();
        return presentedIdentifiersToDismiss(
            presented.map((banner) => {
                const data = (banner.request.content.data ?? {}) as Record<string, unknown>;
                return {
                    identifier: banner.request.identifier,
                    // iOS reports the moment in seconds since 1970.
                    deliveredAt: banner.date * 1000,
                    itemId: typeof data.itemId === 'string' ? data.itemId : undefined,
                };
            }),
            startOfToday.getTime(),
            doneItemIds,
        );
    };

    const dismiss = async (identifiers: string[]): Promise<void> => {
        for (const identifier of identifiers) {
            try {
                await Notifications.dismissNotificationAsync(identifier);
            } catch {
                // The read-back below decides whether it is really still there.
            }
        }
    };

    try {
        await dismiss(await removable());
        let remaining = await removable();
        if (remaining.length > 0) {
            await dismiss(remaining);
            remaining = await removable();
        }
        return remaining.length === 0 ? [] : [{ kind: 'sweep' }];
    } catch {
        return [{ kind: 'sweep' }];
    }
}

/** Turn a saved "HH:MM" into an hour and a minute. */
function parseTime(raw: string | null, fallback: TimeOfDay): TimeOfDay {
    if (!raw) return fallback;
    const [h, m] = raw.split(':');
    const hour = parseInt(h, 10);
    const minute = parseInt(m, 10);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return fallback;
    return { hour, minute };
}

/** The three fixed times of day, as Settings has them. */
async function readClockTimes(): Promise<ClockTimes> {
    return {
        morning: parseTime(await AsyncStorage.getItem('reminder_morning_time'), DEFAULT_CLOCK_TIMES.morning),
        midday: parseTime(await AsyncStorage.getItem('reminder_midday_time'), DEFAULT_CLOCK_TIMES.midday),
        evening: parseTime(await AsyncStorage.getItem('reminder_evening_time'), DEFAULT_CLOCK_TIMES.evening),
    };
}

/**
 * Every reminder the saved list calls for.
 *
 * The storage reading all happens here, once, and the parsed list is handed
 * to the translator — which is what keeps the translator plain enough to test.
 *
 * It answers with the reminders and with a fault if the list could not be
 * read. A list that fails here is unknown, not empty: its held reminders
 * stay on the phone.
 */
export async function gatherWanted(
    now: number,
): Promise<{
    wanted: WantedReminder[];
    faults: RunFault[];
    unreadSources: string[];
    doneItemIds: string[];
}> {
    const [saved, times] = await Promise.all([
        readSavedReminderItems(),
        readClockTimes(),
    ]);

    const faults: RunFault[] = [];
    const failedKeys: string[] = [];
    if (saved.failed) {
        faults.push({ kind: 'list', listKey: 'reminder_items' });
        failedKeys.push('reminder_items');
    }

    const fromList = saved.failed
        ? []
        : remindersFor(translateReminderItems(saved.items, now), now, times);

    return {
        wanted: fromList,
        faults,
        unreadSources: unreadSourcesFor(failedKeys),
        doneItemIds: saved.failed ? [] : doneItemIdsOf(saved.items),
    };
}

/**
 * What the phone is holding, described plainly.
 *
 * Each reminder the scheduler creates carries its own name and its own firing
 * times inside it, so they can be read straight back. Nothing here tries to
 * interpret the phone's own description of a trigger, which differs between
 * kinds and between versions; a reminder we cannot read is simply treated as
 * wrong and made afresh.
 */
export async function readQueue(): Promise<QueueEntry[]> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.map((request) => {
        const data = (request.content.data ?? {}) as Record<string, unknown>;
        return {
            identifier: request.identifier,
            key: typeof data.key === 'string' ? data.key : undefined,
            source: typeof data.source === 'string' ? data.source : undefined,
            trigger: (data.fires as WantedTrigger | undefined) ?? null,

            label: typeof data.label === 'string' ? data.label : undefined,
            itemId: typeof data.itemId === 'string' ? data.itemId : undefined,
            title: request.content.title ?? undefined,
            body: request.content.body ?? undefined,
            categoryIdentifier: request.content.categoryIdentifier ?? undefined,
        };
    });
}

/** Turn a wanted trigger into the form the phone is asked in. */
function triggerInput(trigger: WantedTrigger): Notifications.NotificationTriggerInput {
    if (trigger.kind === 'daily') {
        return {
            type: SchedulableTriggerInputTypes.DAILY,
            hour: trigger.hour,
            minute: trigger.minute,
        } as Notifications.DailyTriggerInput;
    }
    if (trigger.kind === 'weekly') {
        return {
            type: SchedulableTriggerInputTypes.WEEKLY,
            weekday: trigger.weekday,
            hour: trigger.hour,
            minute: trigger.minute,
        } as Notifications.WeeklyTriggerInput;
    }
    return {
        type: SchedulableTriggerInputTypes.DATE,
        date: new Date(trigger.at),
    } as Notifications.DateTriggerInput;
}

/**
 * Cancel what the plan says to cancel, and create what it says to create.
 *
 * A replacement is created first. The old request is cancelled only after
 * that succeeds. If creation fails, the old reminder remains.
 *
 * It answers with what it managed. One reminder failing must still not stop the
 * rest. A failed create is missing; a failed cancellation may still arrive.
 * Both are counted and handed back.
 */
export async function applyPlan(
    plan: Plan,
): Promise<{
    cancelled: number;
    created: number;
    failedToCreate: number;
    failedToCancel: number;
}> {
    let created = 0;
    let failedToCreate = 0;
    const cancellationTargets = new Set<string>();

    const tryCancel = async (identifier: string): Promise<void> => {
        cancellationTargets.add(identifier);
        try {
            await Notifications.cancelScheduledNotificationAsync(identifier);
        } catch {
            // A request that has already fired is already absent. The read-back
            // below tells that case from a request that is still standing.
        }
    };

    for (const op of applyOpsFor(plan)) {
        if (op.kind === 'create') {
            try {
                const reminder = op.reminder;
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: reminder.title,
                        body: reminder.body,
                        // `key` and `fires` are the scheduler's own; the rest is
                        // what the screens have always carried, so a tapped banner
                        // still routes and still knows its item.
                        data: {
                            key: reminder.key,
                            fires: reminder.trigger,
                            source: reminder.source,
                            itemId: reminder.itemId,
                            label: reminder.label,
                            ...(reminder.shiftedForMissingDayBit ? { shiftedForMissingDayBit: true } : {}),
                        },
                        ...(reminder.categoryIdentifier ? { categoryIdentifier: reminder.categoryIdentifier } : {}),
                        sound: 'default',
                        // Each notice is its own thread, named by the reminder
                        // key, so the phone can list them separately. This Expo
                        // does not yet hand the name to the phone.
                        threadIdentifier: reminder.key,
                    } as Notifications.NotificationContentInput,
                    trigger: triggerInput(reminder.trigger),
                });
                created++;
                if (op.thenCancel !== undefined) {
                    await tryCancel(op.thenCancel);
                }
            } catch {
                failedToCreate++;
            }
        } else {
            await tryCancel(op.identifier);
        }
    }

    const targets = [...cancellationTargets];
    if (targets.length === 0) {
        return {
            cancelled: 0,
            created,
            failedToCreate,
            failedToCancel: 0,
        };
    }

    let remaining: string[];
    try {
        const held = new Set(
            (await Notifications.getAllScheduledNotificationsAsync())
                .map((request) => request.identifier),
        );
        remaining = targets.filter((identifier) => held.has(identifier));
    } catch {
        remaining = targets;
    }

    if (remaining.length > 0) {
        for (const identifier of remaining) {
            try {
                await Notifications.cancelScheduledNotificationAsync(identifier);
            } catch {
                // The final read-back is the answer.
            }
        }
        try {
            const held = new Set(
                (await Notifications.getAllScheduledNotificationsAsync())
                    .map((request) => request.identifier),
            );
            remaining = remaining.filter((identifier) => held.has(identifier));
        } catch {
            // None can be claimed gone when the phone cannot confirm the queue.
        }
    }

    const failedToCancel = remaining.length;
    const cancelled = targets.length - failedToCancel;
    return { cancelled, created, failedToCreate, failedToCancel };
}

/**
 * Write down how a run went.
 *
 * This is the one place that can fail with nowhere to report it, so it stays
 * silent: a phone that cannot write to storage cannot be told about it either.
 * Faults that name the same trouble twice are folded into one, so the pop-up
 * never says the same sentence two lines running.
 */
async function recordRun(record: RunRecord): Promise<void> {
    try {
        const seen = new Set<string>();
        const faults: RunFault[] = [];
        for (const fault of record.faults) {
            const signature = faultSignature(fault);
            if (seen.has(signature)) continue;
            seen.add(signature);
            faults.push(fault);
        }

        const raw = await AsyncStorage.getItem(HEALTH_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const previous: RunRecord[] = Array.isArray(parsed) ? parsed : [];
        await AsyncStorage.setItem(HEALTH_KEY, JSON.stringify(addRun(previous, { ...record, faults })));
    } catch {
        // Nothing can be done and nowhere to say so.
    }
}

// Two runs at once — one from the launch and one from the app coming to the
// front — would each read the queue before the other had changed it. A request
// during a run is queued, and when the current run finishes the scheduler
// runs once more against the latest saved truth.

/**
 * Bring the phone's reminders into line with what is saved.
 *
 * Called on launch and every time the app comes back to the front. Because it
 * works out the whole answer from the saved lists each time, a reminder that
 * went missing for any reason comes back on the next run.
 *
 * It returns what it did, which is what the queue screen will show later, or
 * null when it did nothing at all. A caller arriving during a run receives
 * the same promise and waits for the active run and its queued rerun.
 *
 * Every run also writes down how it went, so a failure is no longer invisible.
 */
export function runScheduler(): Promise<Plan | null> {
    return oneSchedulerRun(runOnce);
}

async function runOnce(): Promise<Plan | null> {
    try {
        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) {
            await recordRun({
                at: Date.now(),
                faults: [{ kind: 'permission' }],
                created: 0,
                cancelled: 0,
                kept: 0,
            });
            return null;
        }

        const faults: RunFault[] = [];

        // The reset has to happen before the list is read, or a snooze made
        // yesterday would be armed for today.
        faults.push(...(await runDailyReset()));
        faults.push(...(await runWeeklyReset()));

        const now = Date.now();
        const gathered = await gatherWanted(now);
        faults.push(...gathered.faults);

        const queue = await readQueue();
        const plan = reconcile(
            gathered.wanted,
            queue,
            OWNED_SOURCES,
            now,
            gathered.unreadSources,
            gathered.doneItemIds,
        );
        const applied = await applyPlan(plan);
        if (applied.failedToCreate > 0) {
            faults.push({ kind: 'create', count: applied.failedToCreate });
        }
        if (applied.failedToCancel > 0) {
            faults.push({ kind: 'cancel', count: applied.failedToCancel });
        }
        faults.push(...(await sweepPresentedBanners(gathered.doneItemIds)));

        await recordRun({
            at: now,
            faults,
            created: applied.created,
            cancelled: applied.cancelled,
            kept: plan.keep,
        });
        return plan;
    } catch {
        await recordRun({
            at: Date.now(),
            faults: [{ kind: 'stopped' }],
            created: 0,
            cancelled: 0,
            kept: 0,
        });
        return null;
    }
}
