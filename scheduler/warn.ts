// The near-the-ceiling warning.
//
// The phone holds only so many reminders that have not yet fired. When the
// saved lists ask for more than it can hold, the module keeps the soonest and
// leaves the rest unarmed — and this is the one place that says so out loud.
//
// It speaks as an item goes in, not when a reminder fails to arrive (Patrick).
// That is why only a screen's save calls it: the module also runs on launch and
// on every return to the front, and a pop-up at those moments would be about
// nothing the person just did.
//
// The words live here rather than in the six screens, so there is one wording
// to change and no chance of six drifting apart.

import { Alert } from 'react-native';

import type { Plan } from './reconcile.ts';

export const WARNING_TITLE = 'No room for this reminder';

export const WARNING_BODY =
    'Your phone holds only so many reminders and it is full. This one is saved, '
    + 'but the one furthest in the future will not go off until something makes '
    + 'room.';

/**
 * Say something if the phone could not hold everything the lists asked for.
 *
 * Handed what the module answered with. A run that was skipped — because
 * another was already going — answers with nothing at all, and then this says
 * nothing: it is a guard, and a warning missed at that moment costs nothing,
 * since the next save asks again.
 */
export function warnIfFull(plan: Plan | null): void {
    if (!plan) return;
    if (plan.trimmed.length === 0) return;
    Alert.alert(WARNING_TITLE, WARNING_BODY);
}
