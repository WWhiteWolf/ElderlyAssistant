// One run at a time, with one queued rerun and one promise for every caller.
//
// Two runs at once would each read the queue before the other had changed it.
// A request that arrives during a run asks for one final rerun against the
// latest saved truth. It then waits for both runs instead of returning early.

let inFlight: Promise<unknown> | null = null;
let pending = false;

/**
 * Run scheduler work once, followed by one requested rerun at a time.
 *
 * Every caller that arrives before the work is complete receives the same
 * promise. Many callers during one run collapse into one following run.
 */
export function oneSchedulerRun<T>(work: () => Promise<T>): Promise<T> {
    if (inFlight) {
        pending = true;
        return inFlight as Promise<T>;
    }

    pending = false;
    const run = Promise.resolve().then(async () => {
        let last = await work();
        while (pending) {
            pending = false;
            last = await work();
        }
        return last;
    });
    const tracked = run.finally(() => {
        if (inFlight === tracked) {
            inFlight = null;
            pending = false;
        }
    });
    inFlight = tracked;
    return tracked;
}

/** Tests reset the gate so one check cannot leak into the next. */
export function resetRunGateForTests(): void {
    inFlight = null;
    pending = false;
}
