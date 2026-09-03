// Tests for the apply order: create a replacement before removing the old one.

import { applyOpsFor, runApplyOps } from '../apply.ts';
import type { Plan } from '../reconcile.ts';
import type { WantedReminder, WantedTrigger } from '../types.ts';
import { assert, assertSame, test } from './runner.ts';

const trigger: WantedTrigger = { kind: 'daily', hour: 8, minute: 0 };

function reminder(key: string): WantedReminder {
    return {
        key,
        source: 'daily',
        itemId: key,
        label: key,
        title: 'Daily Routine',
        body: `Time for ${key}!`,
        categoryIdentifier: 'routineactions',
        trigger,
    };
}

function emptyPlan(changes: Partial<Plan> = {}): Plan {
    return {
        cancel: [],
        create: [],
        replace: [],
        keep: 0,
        trimmed: [],
        others: 0,
        ...changes,
    };
}

export function runApplyTests(): void {
    test('A replacement is created before the old identifier is cancelled', () => {
        const order: string[] = [];
        const plan = emptyPlan({
            replace: [{ identifier: 'old1', reminder: reminder('daily:a:base') }],
        });
        runApplyOps(applyOpsFor(plan), {
            create: (one) => {
                order.push(`create:${one.key}`);
                return true;
            },
            cancel: (id) => {
                order.push(`cancel:${id}`);
            },
        });
        assertSame(
            order,
            ['create:daily:a:base', 'cancel:old1'],
            'the new request exists before the old one is taken off',
        );
    });

    test('A failed replacement create leaves the old reminder in place', () => {
        const cancelled: string[] = [];
        const plan = emptyPlan({
            replace: [{ identifier: 'old1', reminder: reminder('daily:a:base') }],
        });
        const said = runApplyOps(applyOpsFor(plan), {
            create: () => false,
            cancel: (id) => {
                cancelled.push(id);
            },
        });
        assertSame(cancelled, [], 'the old reminder is not lost');
        assertSame(said.failedToCreate, 1, 'the fault is counted');
        assertSame(said.created, 0, 'nothing new was made');
        assertSame(said.cancelled, 0, 'nothing was taken off');
    });

    test('A request that is simply no longer wanted is still cancelled', () => {
        const cancelled: string[] = [];
        const plan = emptyPlan({ cancel: ['gone1'] });
        runApplyOps(applyOpsFor(plan), {
            create: () => true,
            cancel: (id) => {
                cancelled.push(id);
            },
        });
        assertSame(cancelled, ['gone1'], 'an unwanted reminder still goes');
    });
}
