// Tests for the weekly reset.

import { lastOccurrence, resetForNewCycle } from '../weeklyreset.ts';
import type { ResettableChore } from '../weeklyreset.ts';
import { assert, assertSame, test } from './runner.ts';

// A fixed moment to test against: Monday the first of June 2026, at nine in
// the morning. Every test says what time it is, so none of them depends on the
// day it happens to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();
const MONDAY = 1;

/** A moment on the same clock as NOW, written out in full. */
function at(year: number, month: number, day: number, hour: number, minute: number): number {
    return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

function chore(changes: Partial<ResettableChore> = {}): ResettableChore {
    return { id: 'c1', day: MONDAY, hour: 8, minute: 0, completed: false, ...changes };
}

export function runWeeklyResetTests(): void {
    test('The fixed moment really is a Monday', () => {
        assert(new Date(NOW).getDay() === MONDAY, 'the whole file rests on this');
    });

    // ---- when a cycle last came round ----

    test('A chore whose day is today and whose time has gone last came round this morning', () => {
        assertSame(lastOccurrence(MONDAY, 8, 0, NOW), at(2026, 5, 1, 8, 0), 'expected today');
    });

    test('A chore whose day is today but whose time has not arrived last came round a week ago', () => {
        assertSame(lastOccurrence(MONDAY, 18, 0, NOW), at(2026, 4, 25, 18, 0), 'expected last Monday');
    });

    test('A chore due exactly now counts as having come round', () => {
        assertSame(lastOccurrence(MONDAY, 9, 0, NOW), at(2026, 5, 1, 9, 0), 'expected today');
    });

    test('A chore earlier in the week last came round earlier in the week', () => {
        // Sunday, the day before.
        assertSame(lastOccurrence(0, 20, 0, NOW), at(2026, 4, 31, 20, 0), 'expected yesterday');
    });

    test('A chore later in the week last came round the week before', () => {
        // Saturday, which this week has not reached.
        assertSame(lastOccurrence(6, 10, 0, NOW), at(2026, 4, 30, 10, 0), 'expected the Saturday just gone');
    });

    // ---- the checkmark ----

    test('A tick made before the cycle came round is spent and cleared', () => {
        const after = resetForNewCycle([chore({ completed: true, doneAt: at(2026, 4, 25, 8, 30) })], NOW);
        assert(after[0].completed === false, 'expected the checkmark cleared');
    });

    test('Clearing the checkmark takes the moment it was made with it', () => {
        const after = resetForNewCycle([chore({ completed: true, doneAt: at(2026, 4, 25, 8, 30) })], NOW);
        assert(after[0].doneAt === undefined, 'expected doneAt gone');
    });

    test('A tick made since the cycle came round is kept', () => {
        const after = resetForNewCycle([chore({ completed: true, doneAt: at(2026, 5, 1, 8, 5) })], NOW);
        assert(after[0].completed === true, 'expected the checkmark kept');
    });

    test('A chore ticked this morning is not cleared again later the same day', () => {
        // The chore is due Monday at eight, it was done at five past, and it is
        // now nine. Its cycle has not come round again.
        const after = resetForNewCycle([chore({ hour: 8, completed: true, doneAt: at(2026, 5, 1, 8, 5) })], NOW);
        assertSame(
            { completed: after[0].completed, doneAt: after[0].doneAt },
            { completed: true, doneAt: at(2026, 5, 1, 8, 5) },
            'expected the tick left alone',
        );
    });

    test('A chore whose time today has not arrived keeps a tick made since last week', () => {
        const after = resetForNewCycle([chore({ hour: 18, completed: true, doneAt: at(2026, 4, 25, 18, 30) })], NOW);
        assert(after[0].completed === true, 'expected the checkmark kept');
    });

    test('A tick with no moment recorded is left alone', () => {
        const after = resetForNewCycle([chore({ completed: true })], NOW);
        assert(after[0].completed === true, 'nothing can be judged without a doneAt');
    });

    // ---- the postpone ----

    test('A postpone older than the latest occurrence is stale and dropped', () => {
        const after = resetForNewCycle([chore({ postponedTo: at(2026, 4, 26, 8, 0) })], NOW);
        assert(after[0].postponedTo === undefined, 'expected the postpone gone');
    });

    test('A postpone made since the latest occurrence is kept', () => {
        const after = resetForNewCycle([chore({ postponedTo: at(2026, 5, 2, 8, 0) })], NOW);
        assertSame(after[0].postponedTo, at(2026, 5, 2, 8, 0), 'expected the postpone kept');
    });

    test('A spent tick and a stale postpone go together', () => {
        const after = resetForNewCycle(
            [chore({ completed: true, doneAt: at(2026, 4, 25, 8, 30), postponedTo: at(2026, 4, 26, 8, 0) })],
            NOW,
        );
        assertSame(
            { completed: after[0].completed, doneAt: after[0].doneAt, postponedTo: after[0].postponedTo },
            { completed: false },
            'expected both cleared',
        );
    });

    // ---- everything else ----

    test('Nothing else about a chore is touched', () => {
        const after = resetForNewCycle(
            [chore({ id: 'c9', day: 4, hour: 17, minute: 30, completed: true, doneAt: at(2026, 4, 21, 17, 45) })],
            NOW,
        );
        assertSame(
            { id: after[0].id, day: after[0].day, hour: after[0].hour, minute: after[0].minute },
            { id: 'c9', day: 4, hour: 17, minute: 30 },
            'the chore itself changed',
        );
    });

    test('A chore already clear is handed back exactly as it was', () => {
        const before = chore();
        assertSame(resetForNewCycle([before], NOW)[0], before, 'expected no change');
    });

    test('Every chore in the list is judged, not just the first', () => {
        const spent = { completed: true, doneAt: at(2026, 4, 25, 8, 30) };
        const after = resetForNewCycle(
            [chore({ id: '1', ...spent }), chore({ id: '2', ...spent }), chore({ id: '3', ...spent })],
            NOW,
        );
        assert(after.every((c) => c.completed === false), 'expected all three cleared');
    });

    test('Each chore is judged against its own day, not a shared one', () => {
        // Both were ticked on Sunday evening. The Sunday chore's cycle has come
        // round since; the Saturday chore's has not.
        const doneAt = at(2026, 4, 31, 21, 0);
        const after = resetForNewCycle(
            [chore({ id: 'sun', day: 0, hour: 20, minute: 0, completed: true, doneAt }),
             chore({ id: 'sat', day: 6, hour: 10, minute: 0, completed: true, doneAt })],
            NOW,
        );
        assertSame(
            { sunday: after[0].completed, saturday: after[1].completed },
            { sunday: true, saturday: true },
            'both ticks were made after their own last occurrence',
        );
    });

    test('An empty list resets to an empty list', () => {
        assert(resetForNewCycle([], NOW).length === 0, 'expected nothing');
    });
}
