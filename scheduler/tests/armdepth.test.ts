// Tests for the block that answers "how far ahead do we arm?".

import { armDepthFor } from '../armdepth.ts';
import type { TriggerKindCode } from '../inputshape.ts';
import { assertSame, test } from './runner.ts';

export function runArmDepthTests(): void {
    test('A daily item arms one occurrence', () => {
        assertSame(armDepthFor('daily'), 1, 'one stands, and opening the app arms the next');
    });

    test('A weekly item arms one occurrence', () => {
        assertSame(armDepthFor('weekly'), 1, 'the same one place a weekly repeat costs today');
    });

    test('A date item arms one occurrence', () => {
        assertSame(armDepthFor('date'), 1, 'there is no second occurrence to arm');
    });

    test('Nothing is doubled anywhere', () => {
        // Written as one test of its own because this is the ruling itself
        // rather than three separate facts: the depth is one for every kind,
        // and recovery on opening carries what a second copy used to carry.
        const kinds: TriggerKindCode[] = ['daily', 'weekly', 'date'];
        assertSame(kinds.map(armDepthFor), [1, 1, 1], 'every kind arms one');
    });
}
