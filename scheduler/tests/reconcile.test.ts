// Tests for the reconcile.
//
// Each one hands it a wanted list and a pretended queue, and checks what it
// decided.

import { CEILING, ROOM_FOR_OTHERS, nextFireTime, reconcile } from '../reconcile.ts';
import type { QueueEntry } from '../reconcile.ts';
import type { WantedReminder, WantedTrigger } from '../types.ts';
import { assert, assertSame, test } from './runner.ts';

// Monday the first of June 2026, at nine in the morning.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

const OWNED = ['myday', 'pets', 'myweek', 'lookahead', 'todo', 'memorytest'];

function want(key: string, trigger: WantedTrigger, source = 'myday'): WantedReminder {
    return {
        key,
        source,
        itemId: key,
        label: key,
        title: 'Daily Routine',
        body: `Time for ${key}!`,
        categoryIdentifier: 'routineactions',
        trigger,
    };
}

function held(identifier: string, key: string, trigger: WantedTrigger | null, source = 'myday'): QueueEntry {
    return { identifier, key, source, trigger };
}

export function runReconcileTests(): void {
    test('A wanted reminder the phone does not hold is created', () => {
        const plan = reconcile([want('myday:a:base', { kind: 'daily', hour: 8, minute: 0 })], [], OWNED, NOW);
        assertSame(plan.create.map((r) => r.key), ['myday:a:base'], 'expected it to be created');
        assertSame(plan.cancel, [], 'nothing to cancel');
    });

    test('A reminder that is already exactly right is left alone', () => {
        const trigger: WantedTrigger = { kind: 'daily', hour: 8, minute: 0 };
        const plan = reconcile([want('myday:a:base', trigger)], [held('n1', 'myday:a:base', trigger)], OWNED, NOW);
        assertSame(plan.create, [], 'nothing to create');
        assertSame(plan.cancel, [], 'nothing to cancel');
        assertSame(plan.keep, 1, 'it should have been kept');
    });

    test('A reminder whose time has changed is replaced', () => {
        const plan = reconcile(
            [want('myday:a:base', { kind: 'daily', hour: 9, minute: 0 })],
            [held('n1', 'myday:a:base', { kind: 'daily', hour: 8, minute: 0 })],
            OWNED,
            NOW,
        );
        assertSame(plan.cancel, ['n1'], 'the old one should go');
        assertSame(plan.create.map((r) => r.key), ['myday:a:base'], 'the new one should be created');
    });

    test('A reminder the lists no longer call for is cancelled', () => {
        const plan = reconcile([], [held('n1', 'myday:gone:base', { kind: 'daily', hour: 8, minute: 0 })], OWNED, NOW);
        assertSame(plan.cancel, ['n1'], 'expected it to be cancelled');
    });

    test('A reminder belonging to something else is never touched', () => {
        const queue: QueueEntry[] = [{ identifier: 'timer1', source: 'timer', trigger: { kind: 'date', at: NOW + 60000 } }];
        const plan = reconcile([], queue, OWNED, NOW);
        assertSame(plan.cancel, [], 'the Timer is not ours to cancel');
        assertSame(plan.others, 1, 'but it does take up room');
    });

    test('An Orders reminder is left alone while the page is still there', () => {
        const queue: QueueEntry[] = [{ identifier: 'o1', key: 'orders:x:daybefore', source: 'orders', trigger: { kind: 'date', at: NOW + 60000 } }];
        const plan = reconcile([], queue, OWNED, NOW);
        assertSame(plan.cancel, [], 'Orders has no reader, so it is not ours');
    });

    test('One of ours with no name is a leftover and is cancelled', () => {
        const queue: QueueEntry[] = [{ identifier: 'old1', source: 'myday', trigger: { kind: 'daily', hour: 8, minute: 0 } }];
        const plan = reconcile([], queue, OWNED, NOW);
        assertSame(plan.cancel, ['old1'], 'a reminder from the old way of scheduling goes');
    });

    test('The same name held twice keeps one and cancels the rest', () => {
        const trigger: WantedTrigger = { kind: 'daily', hour: 8, minute: 0 };
        const plan = reconcile(
            [want('myday:a:base', trigger)],
            [held('n1', 'myday:a:base', trigger), held('n2', 'myday:a:base', trigger)],
            OWNED,
            NOW,
        );
        assertSame(plan.cancel, ['n2'], 'the copy goes');
        assertSame(plan.keep, 1, 'the first stays');
        assertSame(plan.create, [], 'nothing needs creating');
    });

    test('Reading the same thing twice changes nothing the second time', () => {
        const trigger: WantedTrigger = { kind: 'daily', hour: 8, minute: 0 };
        const wanted = [want('myday:a:base', trigger)];
        const first = reconcile(wanted, [], OWNED, NOW);
        assertSame(first.create.length, 1, 'the first run creates it');
        const second = reconcile(wanted, [held('n1', 'myday:a:base', trigger)], OWNED, NOW);
        assertSame(second.create.length, 0, 'the second run must create nothing');
        assertSame(second.cancel.length, 0, 'and cancel nothing');
    });

    test('Nothing is trimmed while the list is well under the ceiling', () => {
        const wanted = [];
        for (let n = 0; n < 20; n++) wanted.push(want(`myday:${n}:base`, { kind: 'date', at: NOW + n * 60000 }));
        const plan = reconcile(wanted, [], OWNED, NOW);
        assertSame(plan.trimmed, [], 'twenty reminders is nowhere near the limit');
    });

    test('Past the ceiling, the furthest away are the ones trimmed', () => {
        const allowance = CEILING - ROOM_FOR_OTHERS;
        const wanted = [];
        for (let n = 0; n < allowance + 3; n++) {
            wanted.push(want(`myday:${n}:base`, { kind: 'date', at: NOW + (n + 1) * 60000 }));
        }
        const plan = reconcile(wanted, [], OWNED, NOW);
        assertSame(plan.trimmed.length, 3, 'three should not fit');
        assertSame(
            plan.trimmed.map((r) => r.key),
            [`myday:${allowance}:base`, `myday:${allowance + 1}:base`, `myday:${allowance + 2}:base`],
            'the three furthest away are the ones to go',
        );
    });

    test('Reminders belonging to something else take room from the allowance', () => {
        const queue: QueueEntry[] = [];
        for (let n = 0; n < 5; n++) {
            queue.push({ identifier: `t${n}`, source: 'timer', trigger: { kind: 'date', at: NOW + 60000 } });
        }
        const allowance = CEILING - ROOM_FOR_OTHERS - 5;
        const wanted = [];
        for (let n = 0; n < allowance + 1; n++) {
            wanted.push(want(`myday:${n}:base`, { kind: 'date', at: NOW + (n + 1) * 60000 }));
        }
        const plan = reconcile(wanted, queue, OWNED, NOW);
        assertSame(plan.trimmed.length, 1, 'the Timer’s five push one out');
    });

    test('A daily reminder later today fires today', () => {
        assertSame(
            nextFireTime({ kind: 'daily', hour: 18, minute: 0 }, NOW),
            new Date(2026, 5, 1, 18, 0, 0, 0).getTime(),
            'six this evening is still ahead',
        );
    });

    test('A daily reminder already past today fires tomorrow', () => {
        assertSame(
            nextFireTime({ kind: 'daily', hour: 7, minute: 0 }, NOW),
            new Date(2026, 5, 2, 7, 0, 0, 0).getTime(),
            'seven this morning has gone, so it is tomorrow',
        );
    });

    test('A weekly reminder later this week fires this week', () => {
        // Today is a Monday, so the phone's day three is Wednesday.
        assertSame(
            nextFireTime({ kind: 'weekly', weekday: 4, hour: 10, minute: 0 }, NOW),
            new Date(2026, 5, 3, 10, 0, 0, 0).getTime(),
            'Wednesday is two days off',
        );
    });

    test('A weekly reminder already past today fires next week', () => {
        // Today is Monday, the phone's day two, and seven this morning has gone.
        assertSame(
            nextFireTime({ kind: 'weekly', weekday: 2, hour: 7, minute: 0 }, NOW),
            new Date(2026, 5, 8, 7, 0, 0, 0).getTime(),
            'next Monday',
        );
    });

    test('A reminder the phone holds but cannot describe is replaced', () => {
        const plan = reconcile(
            [want('myday:a:base', { kind: 'daily', hour: 8, minute: 0 })],
            [held('n1', 'myday:a:base', null)],
            OWNED,
            NOW,
        );
        assertSame(plan.cancel, ['n1'], 'if we cannot tell, we do not guess');
        assertSame(plan.create.length, 1, 'it is made afresh');
    });

    test('An empty phone and an empty list means nothing to do', () => {
        const plan = reconcile([], [], OWNED, NOW);
        assert(plan.cancel.length === 0 && plan.create.length === 0, 'expected nothing at all');
    });
}
