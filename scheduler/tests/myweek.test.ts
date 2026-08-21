// Tests for the My Week reader.

import { readMyWeek } from '../readers/myweek.ts';
import type { Chore } from '../readers/myweek.ts';
import { assert, assertSame, test } from './runner.ts';

// A fixed moment to test against: the first of June 2026, at nine in the
// morning. Every test that cares says what time it is, so none of them depends
// on the day they happen to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();
const ONE_DAY = 86400000;

function chore(changes: Partial<Chore> = {}): Chore {
    return { id: 'c1', label: 'Take the bins out', day: 2, hour: 18, minute: 0, completed: false, ...changes };
}

export function runMyWeekTests(): void {
    test('A chore gets one weekly reminder on its own day and time', () => {
        const wanted = readMyWeek([chore({ day: 2, hour: 18, minute: 15 })], NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
        // Tuesday is 2 when Sunday is 0, and the phone counts it as 3.
        assertSame(wanted[0].trigger, { kind: 'weekly', weekday: 3, hour: 18, minute: 15 }, 'wrong trigger');
    });

    test('Sunday becomes the phone day one', () => {
        const wanted = readMyWeek([chore({ day: 0 })], NOW);
        assert(wanted[0].trigger.kind === 'weekly' && wanted[0].trigger.weekday === 1, 'Sunday should be 1');
    });

    test('Saturday becomes the phone day seven', () => {
        const wanted = readMyWeek([chore({ day: 6 })], NOW);
        assert(wanted[0].trigger.kind === 'weekly' && wanted[0].trigger.weekday === 7, 'Saturday should be 7');
    });

    test('A chore already ticked still gets its weekly reminder', () => {
        assert(readMyWeek([chore({ completed: true })], NOW).length === 1, 'the repeat must survive a tick');
    });

    test('A postponed chore still keeps its ordinary weekly reminder', () => {
        const wanted = readMyWeek([chore({ postponedTo: NOW + ONE_DAY })], NOW);
        const base = wanted.filter(w => w.source === 'myweek');
        assert(base.length === 1, 'a postpone must not remove the chore’s home reminder');
    });

    test('A postponed chore also gets a reminder at the moment it was moved to', () => {
        const wanted = readMyWeek([chore({ postponedTo: NOW + ONE_DAY })], NOW);
        const moved = wanted.filter(w => w.source === 'myweekpostpone');
        assert(moved.length === 1, 'expected exactly one postponed reminder');
        assertSame(moved[0].trigger, { kind: 'date', at: NOW + ONE_DAY }, 'wrong moment');
    });

    test('A postpone whose moment has gone wants nothing', () => {
        const wanted = readMyWeek([chore({ postponedTo: NOW - ONE_DAY })], NOW);
        assert(wanted.length === 1, 'a moment already gone cannot be acted on');
        assert(wanted[0].source === 'myweek', 'only the home reminder should be left');
    });

    test('A postpone due this very minute wants nothing', () => {
        const wanted = readMyWeek([chore({ postponedTo: NOW })], NOW);
        assert(wanted.length === 1, 'expected only the home reminder');
    });

    test('A chore with no postpone gets only its weekly reminder', () => {
        const wanted = readMyWeek([chore()], NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
    });

    test('The postponed reminder says the same thing the chore does', () => {
        const wanted = readMyWeek([chore({ postponedTo: NOW + ONE_DAY })], NOW);
        const moved = wanted.find(w => w.source === 'myweekpostpone')!;
        assertSame(
            { title: moved.title, body: moved.body, categoryIdentifier: moved.categoryIdentifier },
            { title: 'Weekly Chore', body: 'Time for Take the bins out!', categoryIdentifier: 'routineactions' },
            'a postponed reminder must read exactly like the one it replaces',
        );
    });

    test('A chore and its postpone never share a key', () => {
        const wanted = readMyWeek([chore({ postponedTo: NOW + ONE_DAY })], NOW);
        assert(wanted[0].key !== wanted[1].key, 'the two must be told apart');
    });

    test('Two postponed chores get two postponed reminders with different keys', () => {
        const wanted = readMyWeek(
            [chore({ id: 'c1', postponedTo: NOW + ONE_DAY }), chore({ id: 'c2', postponedTo: NOW + ONE_DAY })],
            NOW,
        );
        const moved = wanted.filter(w => w.source === 'myweekpostpone');
        assert(moved.length === 2 && moved[0].key !== moved[1].key, 'two chores must never share a key');
    });

    test('The banner says what My Week says today', () => {
        const wanted = readMyWeek([chore({ label: 'Take the bins out' })], NOW);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, categoryIdentifier: wanted[0].categoryIdentifier },
            { title: 'Weekly Chore', body: 'Time for Take the bins out!', categoryIdentifier: 'routineactions' },
            'the words and buttons must match what My Week sends today',
        );
    });

    test('An empty chore list gives nothing', () => {
        assert(readMyWeek([], NOW).length === 0, 'expected none');
    });
}
