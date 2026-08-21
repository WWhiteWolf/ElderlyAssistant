// Tests for the To-Do reader.

import { DEFAULT_CLOCK_TIMES, readToDo } from '../readers/todo.ts';
import type { Task, TaskReminder } from '../readers/todo.ts';
import { assert, assertSame, test } from './runner.ts';

// The first of June 2026, at nine in the morning.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

function reminder(changes: Partial<TaskReminder> = {}): TaskReminder {
    return { id: 'r1', amount: 30, unit: 'minutes', kind: 'offset', ...changes };
}

function task(changes: Partial<Task> = {}): Task {
    return {
        id: 't1',
        title: 'Dentist',
        taskType: 'scheduled',
        year: 2026,
        month: 5,
        day: 10,
        hour: 14,
        minute: 0,
        reminders: [reminder()],
        completed: false,
        ...changes,
    };
}

export function runToDoTests(): void {
    test('A reminder counted backwards fires that far before the appointment', () => {
        const wanted = readToDo([task()], DEFAULT_CLOCK_TIMES, NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 5, 10, 13, 30, 0, 0).getTime() },
            'half an hour before two in the afternoon is half past one',
        );
    });

    test('An older reminder with no kind counts as one counted backwards', () => {
        const wanted = readToDo([task({ reminders: [reminder({ kind: undefined, amount: 2, unit: 'hours' })] })], DEFAULT_CLOCK_TIMES, NOW);
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 5, 10, 12, 0, 0, 0).getTime() },
            'two hours before two in the afternoon is midday',
        );
    });

    test('A fixed-time reminder fires at that time of day, the right number of days early', () => {
        const wanted = readToDo(
            [task({ reminders: [reminder({ kind: 'clock', daysBefore: 2, timeOfDay: 'evening' })] })],
            DEFAULT_CLOCK_TIMES,
            NOW,
        );
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 5, 8, 17, 0, 0, 0).getTime() },
            'two days before the tenth, at five in the evening',
        );
    });

    test('A fixed-time reminder counts days back across the end of a month', () => {
        const wanted = readToDo(
            [task({ year: 2026, month: 6, day: 2, reminders: [reminder({ kind: 'clock', daysBefore: 3, timeOfDay: 'morning' })] })],
            DEFAULT_CLOCK_TIMES,
            NOW,
        );
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 5, 29, 8, 0, 0, 0).getTime() },
            'three days before the second of July is the twenty-ninth of June',
        );
    });

    test('A reminder whose moment has passed is left out', () => {
        const wanted = readToDo([task({ year: 2026, month: 0, day: 5 })], DEFAULT_CLOCK_TIMES, NOW);
        assert(wanted.length === 0, 'expected none');
    });

    test('A task with no reminders set gets nothing', () => {
        assert(readToDo([task({ reminders: [] })], DEFAULT_CLOCK_TIMES, NOW).length === 0, 'expected none');
    });

    test('A task with two reminders gets two, with different keys', () => {
        const wanted = readToDo(
            [task({ reminders: [reminder({ id: 'r1' }), reminder({ id: 'r2', amount: 1, unit: 'days' })] })],
            DEFAULT_CLOCK_TIMES,
            NOW,
        );
        assert(wanted.length === 2, 'expected two reminders');
        assert(wanted[0].key !== wanted[1].key, 'two reminders on one task must never share a key');
    });

    test('A background task gets no appointment reminders of its own', () => {
        const wanted = readToDo([task({ taskType: 'background' })], DEFAULT_CLOCK_TIMES, NOW);
        assert(wanted.every((r) => r.itemId === 'background'), 'a background task has no appointment');
    });

    test('Background tasks share one daily reminder at eight in the morning', () => {
        const wanted = readToDo(
            [task({ id: 'b1', taskType: 'background' }), task({ id: 'b2', taskType: 'background' })],
            DEFAULT_CLOCK_TIMES,
            NOW,
        );
        assert(wanted.length === 1, 'two background tasks must still want only one daily reminder');
        assertSame(wanted[0].trigger, { kind: 'daily', hour: 8, minute: 0 }, 'wrong trigger');
        assertSame(wanted[0].body, 'You have 2 background tasks to review.', 'wrong wording');
    });

    test('One background task is spoken of in the singular', () => {
        const wanted = readToDo([task({ id: 'b1', taskType: 'background' })], DEFAULT_CLOCK_TIMES, NOW);
        assertSame(wanted[0].body, 'You have 1 background task to review.', 'wrong wording');
    });

    test('The background daily has the same key however many times it is read', () => {
        const list = [task({ id: 'b1', taskType: 'background' })];
        const first = readToDo(list, DEFAULT_CLOCK_TIMES, NOW)[0].key;
        const second = readToDo(list, DEFAULT_CLOCK_TIMES, NOW)[0].key;
        assertSame(second, first, 'this is the reminder that used to pile up — its name must never change');
    });

    test('No background tasks means no daily reminder at all', () => {
        const wanted = readToDo([task()], DEFAULT_CLOCK_TIMES, NOW);
        assert(wanted.every((r) => r.itemId !== 'background'), 'expected no background reminder');
    });

    test('The banner says what To-Do says today', () => {
        const wanted = readToDo([task({ title: 'Dentist' })], DEFAULT_CLOCK_TIMES, NOW);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, categoryIdentifier: wanted[0].categoryIdentifier },
            { title: '📋 Reminder: Dentist', body: 'Due: 06/10/26 at 14:00', categoryIdentifier: 'todook' },
            'the words and buttons must match what To-Do sends today',
        );
    });

    test('A task with no date saved is left alone', () => {
        const older = { ...task(), year: undefined, month: undefined, day: undefined } as unknown as Task;
        assert(readToDo([older], DEFAULT_CLOCK_TIMES, NOW).length === 0, 'expected none');
    });
}
