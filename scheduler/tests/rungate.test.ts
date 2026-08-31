// Tests for a run requested while another run is in progress.

import { beginRun, consumePending, endRun, resetRunGateForTests } from '../rungate.ts';
import { assert, assertSame, test } from './runner.ts';

export function runRunGateTests(): void {
    test('A request during a run is kept as one pending rerun', () => {
        resetRunGateForTests();
        assert(beginRun(), 'the first request starts');
        assert(!beginRun(), 'the second does not start a second run');
        assert(!beginRun(), 'a third request still does not start another run');
        assert(consumePending(), 'those requests become one rerun when the first finishes');
        assert(!consumePending(), 'many requests collapse into that one rerun');
        endRun();
        assert(beginRun(), 'after it finishes, a new request starts');
        endRun();
    });

    test('A run with no second request does not rerun', () => {
        resetRunGateForTests();
        assert(beginRun(), 'the first request starts');
        assertSame(consumePending(), false, 'nothing was queued');
        endRun();
    });
}
