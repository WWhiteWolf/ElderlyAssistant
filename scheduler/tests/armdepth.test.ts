// Tests for the block that answers "how far ahead do we arm?".

import { armDepthFor } from '../armdepth.ts';
import { assertSame, test } from './runner.ts';

export function runArmDepthTests(): void {
    test('One occurrence stands', () => {
        assertSame(armDepthFor(), 1, 'one stands, and opening the app arms the next');
    });

    test('Nothing is doubled', () => {
        // Written as one test of its own because this is the ruling itself:
        // the depth is one, and recovery on opening carries what a second
        // copy used to carry.
        assertSame(armDepthFor(), 1, 'nothing is doubled anywhere');
    });
}
