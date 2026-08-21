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
 * A reminder from anywhere else — the Timer's alerts, and the snoozes, delays
 * and postpones until they come under the module — is never cancelled and never
 * re-created. It is simply left where it is, and counted against the room the
 * phone has.
 *
 * Orders is here without a reader, and that is deliberate. The page is being
 * taken out of the app, so nothing wants any of its reminders back; naming its
 * two sources as owned makes the reconcile see every one of them as a leftover
 * with no name and cancel it. Since the page no longer arms anything, they go
 * for good the first time the module runs.
 */
export const OWNED_SOURCES = [
    'myday',
    'pets',
    'myweek',
    'lookahead',
    'todo',
    'memorytest',
    'orders',
    'orderssnooze',
];

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
        ...readMyDay(routine),
        ...readPets(feeds),
        ...readMyWeek(chores),
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
