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
import type { WantedReminder, WantedTrigger } from './types.ts';

import { translateReminderItems } from './translators/translate.ts';
import { remindersFor } from './remindersfor.ts';
import { DEFAULT_CLOCK_TIMES } from './clocktimes.ts';
import type { ClockTimes, TimeOfDay } from './leadmoments.ts';
import { readMemoryTest } from './readers/memorytest.ts';
import type { MemoryTestSession } from './readers/memorytest.ts';
import type { ReminderItem } from '../modules/reminder-types.ts';
import { applyOpsFor } from './apply.ts';
import { beginRun, consumePending, endRun } from './rungate.ts';

/**
 * The screens the scheduler answers for.
 *
 * A reminder from anywhere else — the Timer's alerts, and the snoozes that
 * have not come under the module yet — is never cancelled and never
 * re-created. It is simply left where it is, and counted against the room the
 * phone has.
 *
 * My Week's postpone, Look Ahead's delay and the My Day and Pets snoozes are
 * here as sources of their own, because that is how the app has always tagged
 * them and how a tapped banner still finds its way to the right page. All four
 * are written down on the item itself, so their readers can answer for them
 * like anything else.
 *
 * My Week has no snooze source of its own, and that is the point rather than an
 * omission (#20-new). A Delay tapped on a chore's banner writes the same
 * `postponedTo` stamp the page's Postpone button writes, so it comes back
 * through `myweekpostpone` like any other postpone. There is no longer any
 * reminder in the app armed where the module cannot see it.
 *
 * To-Do has no need of a snooze (Patrick), so its banner carries a single OK
 * button and nothing else.
 *
 * Orders is here without a reader, and that is deliberate. The page is being
 * taken out of the app, so nothing wants any of its reminders back; naming its
 * two sources as owned makes the reconcile see every one of them as a leftover
 * with no name and cancel it. Since the page no longer arms anything, they go
 * for good the first time the module runs.
 */
export const OWNED_SOURCES = [
    'myday',
    'mydaysnooze',
    'pets',
    'petssnooze',
    'myweek',
    'myweekpostpone',
    'lookahead',
    'lookaheaddelay',
    'todo',
    'memorytest',
    'orders',
    'orderssnooze',
];

/**
 * Roll the day over for every-day items, if it has not been rolled yet.
 *
 * This used to happen only when My Day or Pets was opened, which meant the day
 * never turned over for a screen that was not visited. It now runs wherever the
 * module runs — on launch, on every return to the front, and after any save —
 * so the checkmarks clear whether or not those screens are looked at.
 *
 * It is safe to call at any time: on a day that has already been rolled over it
 * reads the date and does nothing else. That is what lets the screens call it
 * before they read, so neither of them can ever draw yesterday's checkmarks
 * while waiting for the module's own run.
 *
 * It answers with whatever went wrong, which is nothing on an ordinary day.
 */
export async function runDailyReset(): Promise<RunFault[]> {
    const today = new Date().toLocaleDateString();
    const faults: RunFault[] = [];

    try {
        const savedDate = await AsyncStorage.getItem('reminder_last_date');
        if (!isNewDay(savedDate, today)) return [];

        const saved = await readList<ReminderItem>('reminder_items');
        if (saved.failed) return [{ kind: 'reset', listKey: 'reminder_items' }];

        const daily = saved.items.filter((one) => one.kind === 'daily');
        await recordMisses(
            daily.map((one) => ({
                id: one.id,
                label: one.label,
                hour: typeof one.hour === 'number' ? one.hour : null,
                minute: typeof one.minute === 'number' ? one.minute : null,
                completed: !!one.completed,
            })),
            'reminder_items',
            savedDate,
        );

        if (saved.items.length > 0) {
            const resetDaily = resetForNewDay(daily);
            const byId = new Map(resetDaily.map((one) => [one.id, one]));
            const next = saved.items.map((one) => byId.get(one.id) ?? one);
            await AsyncStorage.setItem('reminder_items', JSON.stringify(next));
        }
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
 * It is safe to call at any time. When nothing has come round it reads the
 * list and writes nothing.
 *
 * It answers with whatever went wrong, which is nothing on an ordinary run.
 */
export async function runWeeklyReset(): Promise<RunFault[]> {
    try {
        const saved = await readList<ReminderItem>('reminder_items');
        if (saved.failed) return [{ kind: 'reset', listKey: 'weekly' }];
        const weekly = saved.items.filter((one) => one.kind === 'weekly');
        if (weekly.length === 0) return [];

        const asChores: ResettableChore[] = weekly.map((one) => ({
            id: one.id,
            day: one.day ?? 0,
            hour: typeof one.hour === 'number' ? one.hour : 12,
            minute: typeof one.minute === 'number' ? one.minute : 0,
            completed: !!one.completed,
            ...(typeof one.doneAt === 'number' ? { doneAt: one.doneAt } : {}),
            ...(typeof one.snoozedUntil === 'number' ? { postponedTo: one.snoozedUntil } : {}),
        }));
        const rolled = resetForNewCycle(asChores, Date.now());
        const changed = rolled.some((chore, index) => chore !== asChores[index]);
        if (changed) {
            const byId = new Map(rolled.map((one) => [one.id, one]));
            const next = saved.items.map((one) => {
                if (one.kind !== 'weekly') return one;
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
            await AsyncStorage.setItem('reminder_items', JSON.stringify(next));
        }
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
 * Take down any banner delivered before today.
 *
 * A thing not done on time is of no use as a reminder (Patrick), so yesterday's
 * untapped banner is not left sitting in Notification Center to be tapped
 * today. Only delivered banners are touched; nothing still waiting to fire is
 * affected.
 *
 * The honest limit: this can only happen while the app is running or as it
 * comes to the front. A phone left unopened for two days keeps those banners
 * until it is opened.
 *
 * It answers with whatever went wrong. A banner that has already gone is still
 * nothing to worry about, and this is one of the two quiet faults — no reminder
 * is lost by it — but it is written down rather than swallowed.
 */
export async function sweepStaleBanners(): Promise<RunFault[]> {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const presented = await Notifications.getPresentedNotificationsAsync();
        for (const banner of presented) {
            // iOS reports the moment in seconds since 1970.
            const deliveredAt = banner.date * 1000;
            if (deliveredAt < startOfToday.getTime()) {
                await Notifications.dismissNotificationAsync(banner.request.identifier);
            }
        }
        return [];
    } catch {
        return [{ kind: 'sweep' }];
    }
}

/**
 * Read one saved list.
 *
 * A key that has never been written is not a fault — that is simply a screen
 * with nothing on it yet. A key holding something that cannot be read is, and
 * it is the worst kind: the list is unknown, not empty. Held reminders from
 * that source stay on the phone, the fault is reported, and the next run
 * tries again.
 */
async function readList<T>(key: string): Promise<{ items: T[]; failed: boolean }> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return { items: [], failed: false };
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return { items: [], failed: true };
        return { items: parsed as T[], failed: false };
    } catch {
        return { items: [], failed: true };
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
): Promise<{ wanted: WantedReminder[]; faults: RunFault[]; unreadSources: string[] }> {
    const [saved, times] = await Promise.all([
        readList<ReminderItem>('reminder_items'),
        readClockTimes(),
    ]);

    const faults: RunFault[] = [];
    const failedKeys: string[] = [];
    if (saved.failed) {
        faults.push({ kind: 'list', listKey: 'reminder_items' });
        failedKeys.push('reminder_items');
    }

    // The memory test saves one session rather than a list.
    let session: MemoryTestSession | null = null;
    let memtestFailed = false;
    try {
        const raw = await AsyncStorage.getItem('memtest_session');
        if (raw) session = JSON.parse(raw) as MemoryTestSession;
    } catch {
        session = null;
        memtestFailed = true;
        faults.push({ kind: 'list', listKey: 'memtest_session' });
        failedKeys.push('memtest_session');
    }

    const fromList = saved.failed
        ? []
        : remindersFor(translateReminderItems(saved.items, now), now, times);
    const fromMemtest = memtestFailed ? [] : readMemoryTest(session, now);

    return {
        wanted: [...fromList, ...fromMemtest],
        faults,
        unreadSources: unreadSourcesFor(failedKeys),
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
 * rest — but a reminder that could not be created simply does not exist, and
 * that is the fault that matters most, so it is counted and handed back.
 */
export async function applyPlan(
    plan: Plan,
): Promise<{ cancelled: number; created: number; failedToCreate: number }> {
    let cancelled = 0;
    let created = 0;
    let failedToCreate = 0;

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
                        },
                        ...(reminder.categoryIdentifier ? { categoryIdentifier: reminder.categoryIdentifier } : {}),
                        sound: 'default',
                    },
                    trigger: triggerInput(reminder.trigger),
                });
                created++;
                if (op.thenCancel !== undefined) {
                    try {
                        await Notifications.cancelScheduledNotificationAsync(op.thenCancel);
                        cancelled++;
                    } catch {
                        // A reminder that has already fired or gone is nothing to
                        // worry about; the next run will see the truth either way.
                    }
                }
            } catch {
                failedToCreate++;
            }
        } else {
            try {
                await Notifications.cancelScheduledNotificationAsync(op.identifier);
                cancelled++;
            } catch {
                // A reminder that has already fired or gone is nothing to worry
                // about; the next run will see the truth either way.
            }
        }
    }

    return { cancelled, created, failedToCreate };
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
 * null when it did nothing at all.
 *
 * Every run also writes down how it went, so a failure is no longer invisible.
 * A run that was skipped because another is already going writes nothing: the
 * queued rerun will write for both.
 */
export async function runScheduler(): Promise<Plan | null> {
    if (!beginRun()) return null;
    try {
        let last: Plan | null = null;
        do {
            last = await runOnce();
        } while (consumePending());
        return last;
    } finally {
        endRun();
    }
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

        // The clean slate comes first, in both its halves. The reset has to
        // happen before the lists are read, or a snooze made yesterday would be
        // armed for today; the sweep is independent and simply belongs here.
        faults.push(...(await runDailyReset()));
        faults.push(...(await runWeeklyReset()));
        faults.push(...(await sweepStaleBanners()));

        const now = Date.now();
        const gathered = await gatherWanted(now);
        faults.push(...gathered.faults);

        const queue = await readQueue();
        const plan = reconcile(gathered.wanted, queue, OWNED_SOURCES, now, gathered.unreadSources);
        const applied = await applyPlan(plan);
        if (applied.failedToCreate > 0) {
            faults.push({ kind: 'create', count: applied.failedToCreate });
        }

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
