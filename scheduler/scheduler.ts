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

import { reconcile } from './reconcile.ts';
import type { Plan, QueueEntry } from './reconcile.ts';
import { isNewDay, resetForNewDay } from './dailyreset.ts';
import type { ResettableItem } from './dailyreset.ts';
import { resetForNewCycle } from './weeklyreset.ts';
import type { ResettableChore } from './weeklyreset.ts';
import { HEALTH_KEY, MISSES_KEY, addRun, faultSignature, mergeMisses, missesForRollover } from './health.ts';
import type { Miss, MissableItem, RunFault, RunRecord } from './health.ts';
import type { WantedReminder, WantedTrigger } from './types.ts';

import { translateMyDay, translatePets, translateMyWeek, translateLookAhead, translateToDo } from './translators/translate.ts';
import { remindersFor } from './remindersfor.ts';
import type { MyDayItem } from './readers/myday.ts';
import type { PetsItem } from './readers/pets.ts';
import type { Chore } from './readers/myweek.ts';
import type { LookAheadItem } from './readers/lookahead.ts';
import { DEFAULT_CLOCK_TIMES } from './readers/todo.ts';
import type { ClockTimes, Task, TimeOfDay } from './readers/todo.ts';
import { readMemoryTest } from './readers/memorytest.ts';
import type { MemoryTestSession } from './readers/memorytest.ts';

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
 * Roll the day over for the two daily screens, if it has not been rolled yet.
 *
 * This used to happen only when My Day or Pets was opened, which meant the day
 * never turned over for a screen that was not visited. It now runs wherever the
 * module runs — on launch, on every return to the front, and after any save —
 * so the checkmarks clear whether or not those screens are looked at.
 *
 * It is safe to call at any time: on a day that has already been rolled over it
 * reads two dates and does nothing else. That is what lets the screens call it
 * before they read, so neither of them can ever draw yesterday's checkmarks
 * while waiting for the module's own run.
 *
 * The counts go back to zero with the checkmarks — the cups of coffee and
 * glasses of water on My Day, and the treats on Pets — because each of those
 * counts a day.
 *
 * It answers with whatever went wrong, which is nothing on an ordinary day. One
 * screen failing still must not stop the other, and must not stop the reminders
 * being worked out below — but it is now written down instead of vanishing.
 */
export async function runDailyReset(): Promise<RunFault[]> {
    const today = new Date().toLocaleDateString();
    const faults: RunFault[] = [];

    const screens = [
        { dateKey: 'my_last_date', listKey: 'my_routine', counters: ['my_coffee', 'my_water'] },
        { dateKey: 'pets_last_date', listKey: 'pets_feeds', counters: ['pets_treats'] },
    ];

    for (const screen of screens) {
        try {
            const savedDate = await AsyncStorage.getItem(screen.dateKey);
            if (!isNewDay(savedDate, today)) continue;

            const saved = await readList<ResettableItem>(screen.listKey);
            // A list we cannot read is a fault of the rolling-over here, and the
            // quiet kind. The loud one is raised below, where the same unreadable
            // list means that screen's reminders are worked out as none.
            if (saved.failed) faults.push({ kind: 'reset', listKey: screen.listKey });

            // What was left undone has to be written down before the reset wipes
            // it, because this is the last moment it can be seen at all.
            await recordMisses(saved.items as unknown as MissableItem[], screen.listKey, savedDate);

            if (saved.items.length > 0) {
                await AsyncStorage.setItem(screen.listKey, JSON.stringify(resetForNewDay(saved.items)));
            }
            for (const counter of screen.counters) {
                await AsyncStorage.setItem(counter, '0');
            }
            await AsyncStorage.setItem(screen.dateKey, today);
        } catch {
            faults.push({ kind: 'reset', listKey: screen.listKey });
        }
    }

    return faults;
}

/**
 * Roll My Week's chores on, for any whose cycle has come round again.
 *
 * This is the daily reset's sibling rather than a part of it, because My Week
 * has no single boundary to turn on: each chore rolls over on its own day of
 * the week, so every chore is judged separately against its own last
 * occurrence. That is why there is no saved date here and no guard like
 * `isNewDay` — the chores themselves carry when they were done.
 *
 * Like the daily reset it runs wherever the module runs, so a chore's
 * checkmark now clears whether or not My Week is ever opened. That is what
 * makes the tick worth reading at all: until this existed, a tick could only
 * be cleared by visiting the page.
 *
 * It is safe to call at any time. When nothing has come round it reads the
 * list and writes nothing, which is what lets the page call it before it
 * draws, so My Week cannot show a stale checkmark while waiting for the
 * module's own run.
 *
 * It answers with whatever went wrong, which is nothing on an ordinary run.
 */
export async function runWeeklyReset(): Promise<RunFault[]> {
    try {
        const saved = await readList<ResettableChore>('week_routine');
        // A list we cannot read is a fault of the rolling-over here, and the
        // quiet kind. The loud one is raised below, where the same unreadable
        // list means My Week's reminders are worked out as none.
        if (saved.failed) return [{ kind: 'reset', listKey: 'week_routine' }];
        if (saved.items.length === 0) return [];

        const rolled = resetForNewCycle(saved.items, Date.now());
        // A chore with nothing to clear is handed back as the very same object,
        // so this says plainly whether the list changed at all. Nothing is
        // written on a run that found nothing spent.
        const changed = rolled.some((chore, index) => chore !== saved.items[index]);
        if (changed) {
            await AsyncStorage.setItem('week_routine', JSON.stringify(rolled));
        }
        return [];
    } catch {
        return [{ kind: 'reset', listKey: 'week_routine' }];
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
 * it is the worst kind: the list is treated as empty, so that screen's
 * reminders are worked out as none and the ones already on the phone are then
 * taken off as leftovers. Reminders would disappear and nothing would be said.
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
 * Every reminder the saved lists call for.
 *
 * The storage reading all happens here, once, and the parsed lists are handed
 * down to the readers — which is what keeps a reader plain enough to test.
 *
 * It answers with the reminders and with any list it could not read. A list
 * that fails here is the loud fault: that screen's reminders come out as none.
 */
export async function gatherWanted(
    now: number,
): Promise<{ wanted: WantedReminder[]; faults: RunFault[] }> {
    const [routine, feeds, chores, lookahead, tasks, times] = await Promise.all([
        readList<MyDayItem>('my_routine'),
        readList<PetsItem>('pets_feeds'),
        readList<Chore>('week_routine'),
        readList<LookAheadItem>('lookahead_items'),
        readList<Task>('todo_tasks'),
        readClockTimes(),
    ]);

    const faults: RunFault[] = [];
    const lists: [{ failed: boolean }, string][] = [
        [routine, 'my_routine'],
        [feeds, 'pets_feeds'],
        [chores, 'week_routine'],
        [lookahead, 'lookahead_items'],
        [tasks, 'todo_tasks'],
    ];
    for (const [list, listKey] of lists) {
        if (list.failed) faults.push({ kind: 'list', listKey });
    }

    // The memory test saves one session rather than a list.
    let session: MemoryTestSession | null = null;
    try {
        const raw = await AsyncStorage.getItem('memtest_session');
        if (raw) session = JSON.parse(raw) as MemoryTestSession;
    } catch {
        session = null;
        faults.push({ kind: 'list', listKey: 'memtest_session' });
    }

    return {
        wanted: [
            ...remindersFor(translateMyDay(routine.items, now), now, times),
            ...remindersFor(translatePets(feeds.items, now), now, times),
            ...remindersFor(translateMyWeek(chores.items, now), now, times),
            ...remindersFor(translateLookAhead(lookahead.items, now), now, times),
            ...remindersFor(translateToDo(tasks.items, now), now, times),
            ...readMemoryTest(session, now),
        ],
        faults,
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

            // The reconcile has no use for any of this. It is carried so the
            // Scheduled Reminders screen can say what a reminder is and what it
            // will show, without asking the phone a second time (#12-new).
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
 * Cancel what the plan says to cancel, then create what it says to create.
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

    for (const identifier of plan.cancel) {
        try {
            await Notifications.cancelScheduledNotificationAsync(identifier);
            cancelled++;
        } catch {
            // A reminder that has already fired or gone is nothing to worry
            // about; the next run will see the truth either way.
        }
    }

    for (const reminder of plan.create) {
        try {
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
        } catch {
            // One reminder failing must not stop the rest.
            failedToCreate++;
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
// front — would each read the queue before the other had changed it. So a run
// already under way is simply let finish.
let running = false;

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
 * A run that was skipped writes nothing: it is the module protecting itself
 * rather than a failure, and the run already going will write for both.
 */
export async function runScheduler(): Promise<Plan | null> {
    if (running) return null;
    running = true;
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
        const plan = reconcile(gathered.wanted, queue, OWNED_SOURCES, now);
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
    } finally {
        running = false;
    }
}
