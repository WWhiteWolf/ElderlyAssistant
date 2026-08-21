// The scheduler's top.
//
// This is the one file in the scheduler that touches storage and the phone.
// Everything it decides is decided by the readers and the reconcile, which are
// plain and are tested; this file only fetches, converts and applies. It is
// kept thin on purpose, because it is the part Node cannot check.
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
import type { WantedReminder, WantedTrigger } from './types.ts';

import { readMyDay } from './readers/myday.ts';
import type { MyDayItem } from './readers/myday.ts';
import { readPets } from './readers/pets.ts';
import type { PetsItem } from './readers/pets.ts';
import { readMyWeek } from './readers/myweek.ts';
import type { Chore } from './readers/myweek.ts';
import { readLookAhead } from './readers/lookahead.ts';
import type { LookAheadItem } from './readers/lookahead.ts';
import { DEFAULT_CLOCK_TIMES, readToDo } from './readers/todo.ts';
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
 * My Week's own snooze is not here yet. It is still armed straight onto the
 * phone and written down nowhere, so the module must leave it alone until it
 * is brought across.
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
 */
export async function runDailyReset(): Promise<void> {
    const today = new Date().toLocaleDateString();

    const screens = [
        { dateKey: 'my_last_date', listKey: 'my_routine', counters: ['my_coffee', 'my_water'] },
        { dateKey: 'pets_last_date', listKey: 'pets_feeds', counters: ['pets_treats'] },
    ];

    for (const screen of screens) {
        try {
            const savedDate = await AsyncStorage.getItem(screen.dateKey);
            if (!isNewDay(savedDate, today)) continue;

            const items = await readList<ResettableItem>(screen.listKey);
            if (items.length > 0) {
                await AsyncStorage.setItem(screen.listKey, JSON.stringify(resetForNewDay(items)));
            }
            for (const counter of screen.counters) {
                await AsyncStorage.setItem(counter, '0');
            }
            await AsyncStorage.setItem(screen.dateKey, today);
        } catch {
            // One screen failing to roll over must not stop the other, and must
            // not stop the reminders being worked out below.
        }
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
 */
export async function sweepStaleBanners(): Promise<void> {
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
    } catch {
        // A banner that has already gone is nothing to worry about.
    }
}

/** Read one saved list, tolerating a key that has never been written. */
async function readList<T>(key: string): Promise<T[]> {
    try {
        const raw = await AsyncStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
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
 */
export async function gatherWanted(now: number): Promise<WantedReminder[]> {
    const [routine, feeds, chores, lookahead, tasks, times] = await Promise.all([
        readList<MyDayItem>('my_routine'),
        readList<PetsItem>('pets_feeds'),
        readList<Chore>('week_routine'),
        readList<LookAheadItem>('lookahead_items'),
        readList<Task>('todo_tasks'),
        readClockTimes(),
    ]);

    // The memory test saves one session rather than a list.
    let session: MemoryTestSession | null = null;
    try {
        const raw = await AsyncStorage.getItem('memtest_session');
        if (raw) session = JSON.parse(raw) as MemoryTestSession;
    } catch {
        session = null;
    }

    return [
        ...readMyDay(routine, now),
        ...readPets(feeds, now),
        ...readMyWeek(chores, now),
        ...readLookAhead(lookahead, now),
        ...readToDo(tasks, times, now),
        ...readMemoryTest(session, now),
    ];
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

/** Cancel what the plan says to cancel, then create what it says to create. */
export async function applyPlan(plan: Plan): Promise<void> {
    for (const identifier of plan.cancel) {
        try {
            await Notifications.cancelScheduledNotificationAsync(identifier);
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
        } catch {
            // One reminder failing must not stop the rest.
        }
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
 */
export async function runScheduler(): Promise<Plan | null> {
    if (running) return null;
    running = true;
    try {
        const permission = await Notifications.getPermissionsAsync();
        if (!permission.granted) return null;

        // The clean slate comes first, in both its halves. The reset has to
        // happen before the lists are read, or a snooze made yesterday would be
        // armed for today; the sweep is independent and simply belongs here.
        await runDailyReset();
        await sweepStaleBanners();

        const now = Date.now();
        const wanted = await gatherWanted(now);
        const queue = await readQueue();
        const plan = reconcile(wanted, queue, OWNED_SOURCES, now);
        await applyPlan(plan);
        return plan;
    } catch {
        return null;
    } finally {
        running = false;
    }
}
