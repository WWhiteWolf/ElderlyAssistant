// The To-Do reader.
//
// A To-Do task is a one-time appointment, and each task can carry several
// reminders of its own: some counted backwards from the appointment itself
// ("thirty minutes before"), and some set at a fixed time of day some days
// earlier ("the morning of", "two days before, at midday").
//
// The three fixed times of day are set in Settings and are handed in, because
// a reader never reaches for storage itself.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';

/** One reminder attached to a task. */
export interface TaskReminder {
    id: string;
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
    // A reminder with no kind at all is an older one, and counts as 'offset'.
    kind?: 'offset' | 'clock';
    daysBefore?: number;
    timeOfDay?: 'morning' | 'midday' | 'evening';
}

/** One task, exactly as it is saved under `todo_tasks`. */
export interface Task {
    id: string;
    title: string;
    taskType: 'scheduled' | 'background';
    year: number;
    month: number; // January is 0.
    day: number;
    hour: number;
    minute: number;
    reminders: TaskReminder[];
    completed: boolean;
}

/** A time of day, as Settings holds it. */
export interface TimeOfDay {
    hour: number;
    minute: number;
}

/** The three fixed times of day, read from Settings by the module. */
export interface ClockTimes {
    morning: TimeOfDay;
    midday: TimeOfDay;
    evening: TimeOfDay;
}

/** What Settings falls back to when nothing has been set. */
export const DEFAULT_CLOCK_TIMES: ClockTimes = {
    morning: { hour: 8, minute: 0 },
    midday: { hour: 12, minute: 0 },
    evening: { hour: 17, minute: 0 },
};

// The banner's sentence is "Due: MM/DD/YY at HH:MM". The app builds that same
// sentence in DateTimeControl, but that file belongs to the screens and brings
// React Native with it, so the two lines of it that matter are written out
// again here to keep this reader plain.
function twoDigits(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
}

function dueSentence(due: Date): string {
    const date = `${twoDigits(due.getMonth() + 1)}/${twoDigits(due.getDate())}/${twoDigits(due.getFullYear() % 100)}`;
    const time = `${twoDigits(due.getHours())}:${twoDigits(due.getMinutes())}`;
    return `Due: ${date} at ${time}`;
}

/** The moment a task is due, or null when it has no date saved. */
function taskDueDate(task: Task): Date | null {
    if (typeof task.year !== 'number' || typeof task.month !== 'number' || typeof task.day !== 'number') {
        return null;
    }
    return new Date(task.year, task.month, task.day, task.hour ?? 12, task.minute ?? 0, 0, 0);
}

/**
 * Every reminder the To-Do list calls for.
 *
 * For each appointment still ahead, one reminder per reminder set on it. And
 * if there are any background tasks at all, one daily reminder at eight in the
 * morning saying how many there are to look over.
 *
 * That daily one is the reminder that has been piling up. It was created afresh
 * every time a task was saved, and nothing ever removed the old one, so the
 * phone filled with copies of it. Here it has one name, so there can only ever
 * be one of it.
 */
export function readToDo(tasks: Task[], times: ClockTimes, now: number): WantedReminder[] {
    const wanted: WantedReminder[] = [];

    for (const task of tasks) {
        // A completed task is removed from the list altogether, so this is a
        // guard rather than an everyday case.
        if (task.completed) continue;
        if (task.taskType === 'background') continue;
        if (!task.reminders || task.reminders.length === 0) continue;

        const due = taskDueDate(task);
        if (!due) continue;

        for (const reminder of task.reminders) {
            let fireTime: Date;
            if (reminder.kind === 'clock') {
                const which = reminder.timeOfDay === 'evening' ? times.evening
                    : reminder.timeOfDay === 'midday' ? times.midday
                        : times.morning;
                fireTime = new Date(task.year, task.month, task.day, 0, 0, 0, 0);
                fireTime.setDate(fireTime.getDate() - (reminder.daysBefore ?? 0));
                fireTime.setHours(which.hour, which.minute, 0, 0);
            } else {
                let howLongBefore = 0;
                if (reminder.unit === 'minutes') howLongBefore = reminder.amount * 60 * 1000;
                if (reminder.unit === 'hours') howLongBefore = reminder.amount * 60 * 60 * 1000;
                if (reminder.unit === 'days') howLongBefore = reminder.amount * 24 * 60 * 60 * 1000;
                fireTime = new Date(due.getTime() - howLongBefore);
            }
            if (fireTime.getTime() <= now) continue;

            wanted.push({
                key: makeKey('todo', task.id, reminder.id),
                source: 'todo',
                itemId: task.id,
                label: task.title,
                title: `📋 Reminder: ${task.title}`,
                body: dueSentence(due),
                categoryIdentifier: 'todook',
                trigger: { kind: 'date', at: fireTime.getTime() },
            });
        }
    }

    const background = tasks.filter((t) => t.taskType === 'background' && !t.completed);
    if (background.length > 0) {
        wanted.push({
            key: makeKey('todo', 'background', 'daily'),
            source: 'todo',
            itemId: 'background',
            label: 'Background Tasks',
            title: '📋 Background Tasks',
            body: `You have ${background.length} background task${background.length > 1 ? 's' : ''} to review.`,
            // No buttons, which is what this one carries today.
            trigger: { kind: 'daily', hour: 8, minute: 0 },
        });
    }

    return wanted;
}
