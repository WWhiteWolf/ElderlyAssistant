// Tests for a run requested while another run is in progress.

import { oneSchedulerRun, resetRunGateForTests } from '../rungate.ts';
import { assert, assertSame, asyncTest } from './runner.ts';

interface Deferred<T> {
    promise: Promise<T>;
    resolve: (value: T) => void;
}

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

async function nextTurn(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
}

export async function runRunGateTests(): Promise<void> {
    await asyncTest('A second caller waits for the active run and its queued rerun', async () => {
        resetRunGateForTests();
        const runs: Deferred<number>[] = [];
        const work = () => {
            const run = deferred<number>();
            runs.push(run);
            return run.promise;
        };

        const first = oneSchedulerRun(work);
        await nextTurn();
        const second = oneSchedulerRun(work);
        const third = oneSchedulerRun(work);
        assert(first === second && second === third, 'every caller should receive one promise');

        let settled = false;
        void second.then(() => {
            settled = true;
        });

        runs[0].resolve(1);
        await nextTurn();
        assertSame(runs.length, 2, 'many waiting requests should make one final rerun');
        assert(!settled, 'the shared promise must wait for that final rerun');

        runs[1].resolve(2);
        assertSame(
            [await first, await second, await third],
            [2, 2, 2],
            'every caller should receive the final run result',
        );
    });

    await asyncTest('A run with no second request does not rerun', async () => {
        resetRunGateForTests();
        let runs = 0;
        const result = await oneSchedulerRun(async () => {
            runs++;
            return 'finished';
        });
        assertSame([runs, result], [1, 'finished'], 'one request should make one run');
    });
}
