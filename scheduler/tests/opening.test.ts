// Tests for the one ordered path used when Memory opens.

import {
    persistedResponseChecker,
    responseWaitsForOpening,
    rootOpeningCycle,
    sharePresentation,
} from '../opening.ts';
import { BANNER_ACTION_DEFINITIONS } from '../banneractions.ts';
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

export async function runOpeningTests(): Promise<void> {
    await asyncTest('A simultaneous opening and body response share one cycle through OK', async () => {
        const order: string[] = [];
        const schedulerFinished = deferred<void>();
        const okay = deferred<void>();
        let schedulerRuns = 0;
        let notices = 0;
        let destinations = 0;
        const cycle = rootOpeningCycle();

        // A prior launch has finished. Leaving the foreground makes its settled
        // promise ineligible for the next banner response.
        await cycle.begin({
            runScheduler: async () => {},
            showHealthNotice: async () => {},
        });
        cycle.prepareForNext();

        // The body response wins the race by one turn. It waits for the normal
        // root opening instead of creating another opening of its own.
        const bodyResponse = cycle.releaseAfterCurrent(() => {
            destinations++;
            order.push('destination');
        });
        const normalOpening = cycle.begin({
            runScheduler: async () => {
                schedulerRuns++;
                order.push('scheduling');
                await schedulerFinished.promise;
            },
            showHealthNotice: async () => {
                notices++;
                order.push('notice');
                await okay.promise;
            },
        });

        await nextTurn();
        assertSame(
            [schedulerRuns, notices, destinations, order],
            [1, 0, 0, ['scheduling']],
            'the normal opening should own the one scheduler sequence',
        );

        schedulerFinished.resolve(undefined);
        await nextTurn();
        assertSame(
            [schedulerRuns, notices, destinations, order],
            [1, 1, 0, ['scheduling', 'notice']],
            'one notice should follow scheduling while the destination waits',
        );

        okay.resolve(undefined);
        await Promise.all([normalOpening, bodyResponse]);
        assertSame(
            [schedulerRuns, notices, destinations, order],
            [1, 1, 1, ['scheduling', 'notice', 'destination']],
            'OK should release exactly one destination after the one opening cycle',
        );
    });

    await asyncTest('A real notice holds the body destination until OK', async () => {
        const okay = deferred<void>();
        let presentations = 0;
        let released = false;
        const showHealthNotice = sharePresentation(async () => {
            presentations++;
            await okay.promise;
        });
        const cycle = rootOpeningCycle();

        const opening = cycle.begin({
            runScheduler: async () => {},
            showHealthNotice,
        });
        const destination = cycle.releaseAfterCurrent(() => {
            released = true;
        });

        await nextTurn();
        assertSame([presentations, released], [1, false], 'the destination should wait behind the alert');

        okay.resolve(undefined);
        await Promise.all([opening, destination]);
        assert(released, 'OK should release the destination');
    });

    await asyncTest('No notice releases the destination immediately after housekeeping', async () => {
        const order: string[] = [];
        const cycle = rootOpeningCycle();
        const opening = cycle.begin({
            runScheduler: async () => {
                order.push('scheduler');
            },
            showHealthNotice: async () => {
                order.push('nothing to say');
            },
        });
        const destination = cycle.releaseAfterCurrent(() => {
            order.push('destination');
        });
        await Promise.all([opening, destination]);
        assertSame(
            order,
            ['scheduler', 'nothing to say', 'destination'],
            'a quiet opening should have no extra stop',
        );
    });

    await asyncTest('Two notice callers share one presentation', async () => {
        const okay = deferred<void>();
        let presentations = 0;
        const showHealthNotice = sharePresentation(async () => {
            presentations++;
            await okay.promise;
        });

        const first = showHealthNotice();
        const second = showHealthNotice();
        assert(first === second, 'both callers should receive the same presentation promise');
        await nextTurn();
        assertSame(presentations, 1, 'only one native alert should be presented');

        okay.resolve(undefined);
        await Promise.all([first, second]);
    });

    await asyncTest('A failed presentation leaves the next opening free to try again', async () => {
        let attempts = 0;
        const showHealthNotice = sharePresentation(async () => {
            attempts++;
            if (attempts === 1) throw new Error('presentation failed');
        });

        try {
            await showHealthNotice();
        } catch {
            // The first failure is the condition being checked.
        }
        await showHealthNotice();
        assertSame(attempts, 2, 'failed in-flight state should always be cleared');
    });

    await asyncTest('A banner response is handled once after a cold launch', async () => {
        let saved: string | null = null;
        let handled = 0;
        const read = async () => saved;
        const write = async (key: string) => {
            saved = key;
        };
        const responseKey = 'banner-12:expo.modules.notifications.actions.DEFAULT';

        const firstSession = persistedResponseChecker(read, write);
        if (await firstSession(responseKey)) handled++;

        // A killed app loses its in-memory claims, but not the saved key.
        const coldSession = persistedResponseChecker(read, write);
        if (await coldSession(responseKey)) handled++;

        assertSame(
            [handled, saved],
            [1, responseKey],
            'the persisted notification-and-action pair should prevent replay',
        );
    });

    await asyncTest('Opening actions wait for readiness while OK and Skip stay closed', async () => {
        assertSame(
            [
                responseWaitsForOpening(true),
                responseWaitsForOpening(
                    false,
                    BANNER_ACTION_DEFINITIONS.done.leavesAppClosedBit,
                ),
                responseWaitsForOpening(
                    false,
                    BANNER_ACTION_DEFINITIONS.ok.leavesAppClosedBit,
                ),
                responseWaitsForOpening(
                    false,
                    BANNER_ACTION_DEFINITIONS.skip.leavesAppClosedBit,
                ),
            ],
            [true, true, false, false],
            'only a body tap or an action that opens Memory should wait',
        );
    });
}
