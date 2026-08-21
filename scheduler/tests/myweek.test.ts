// Tests for the My Week reader.

import { readMyWeek } from '../readers/myweek.ts';
import type { Chore } from '../readers/myweek.ts';
import { assert, assertSame, test } from './runner.ts';

function chore(changes: Partial<Chore> = {}): Chore {
    return { id: 'c1', label: 'Take the bins out', day: 2, hour: 18, minute: 0, completed: false, ...changes };
}

export function runMyWeekTests(): void {
    test('A chore gets one weekly reminder on its own day and time', () => {
        const wanted = readMyWeek([chore({ day: 2, hour: 18, minute: 15 })]);
        assert(wanted.length === 1, 'expected exactly one reminder');
        // Tuesday is 2 when Sunday is 0, and the phone counts it as 3.
        assertSame(wanted[0].trigger, { kind: 'weekly', weekday: 3, hour: 18, minute: 15 }, 'wrong trigger');
    });

    test('Sunday becomes the phone day one', () => {
        const wanted = readMyWeek([chore({ day: 0 })]);
        assert(wanted[0].trigger.kind === 'weekly' && wanted[0].trigger.weekday === 1, 'Sunday should be 1');
    });

    test('Saturday becomes the phone day seven', () => {
        const wanted = readMyWeek([chore({ day: 6 })]);
        assert(wanted[0].trigger.kind === 'weekly' && wanted[0].trigger.weekday === 7, 'Saturday should be 7');
    });

    test('A chore already ticked still gets its weekly reminder', () => {
        assert(readMyWeek([chore({ completed: true })]).length === 1, 'the repeat must survive a tick');
    });

    test('A postponed chore still keeps its ordinary weekly reminder', () => {
        const wanted = readMyWeek([chore({ postponedTo: Date.now() + 86400000 })]);
        assert(wanted.length === 1, 'a postpone must not remove the chore’s home reminder');
    });

    test('The banner says what My Week says today', () => {
        const wanted = readMyWeek([chore({ label: 'Take the bins out' })]);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, categoryIdentifier: wanted[0].categoryIdentifier },
            { title: 'Weekly Chore', body: 'Time for Take the bins out!', categoryIdentifier: 'routineactions' },
            'the words and buttons must match what My Week sends today',
        );
    });

    test('An empty chore list gives nothing', () => {
        assert(readMyWeek([]).length === 0, 'expected none');
    });
}
