// The apply order for a plan.
//
// A replacement is created first. The old request is cancelled only after
// that create succeeds. If the create fails, the old reminder stays and the
// fault is counted. A request that is simply no longer wanted is cancelled
// in the ordinary way.
//
// Nothing here touches the phone. The scheduler performs each step.

import type { Plan } from './reconcile.ts';
import type { WantedReminder } from './types.ts';

export type ApplyOp =
    | { kind: 'create'; reminder: WantedReminder; thenCancel?: string }
    | { kind: 'cancel'; identifier: string };

/** The steps to perform, replacement creates before their cancels. */
export function applyOpsFor(plan: Plan): ApplyOp[] {
    const ops: ApplyOp[] = [];
    for (const one of plan.replace) {
        ops.push({ kind: 'create', reminder: one.reminder, thenCancel: one.identifier });
    }
    for (const reminder of plan.create) {
        ops.push({ kind: 'create', reminder });
    }
    for (const identifier of plan.cancel) {
        ops.push({ kind: 'cancel', identifier });
    }
    return ops;
}

/**
 * Walk the steps with handed-in create and cancel.
 *
 * `create` answers false when the new request could not be made. A failed
 * replacement then leaves the old identifier in place.
 */
export function runApplyOps(
    ops: ApplyOp[],
    perform: {
        create: (reminder: WantedReminder) => boolean;
        cancel: (identifier: string) => void;
    },
): { cancelled: number; created: number; failedToCreate: number } {
    let cancelled = 0;
    let created = 0;
    let failedToCreate = 0;
    for (const op of ops) {
        if (op.kind === 'create') {
            let ok = false;
            try {
                ok = perform.create(op.reminder);
            } catch {
                ok = false;
            }
            if (!ok) {
                failedToCreate++;
                continue;
            }
            created++;
            if (op.thenCancel !== undefined) {
                try {
                    perform.cancel(op.thenCancel);
                    cancelled++;
                } catch {
                    // A reminder that has already fired or gone is nothing to
                    // worry about; the next run will see the truth either way.
                }
            }
        } else {
            try {
                perform.cancel(op.identifier);
                cancelled++;
            } catch {
                // Same as above.
            }
        }
    }
    return { cancelled, created, failedToCreate };
}
