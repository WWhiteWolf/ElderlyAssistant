// One day-roll at a time.
//
// Two rolls at once would each read the ticks, and the second can see the
// list after the first has already cleared them, so last night's Done items
// get written as hanging. A second call waits for the one already going
// and uses that result, rather than rolling again.

let inFlight: Promise<unknown> | null = null;

/**
 * Run this day-roll. A second call while it is going waits for it instead
 * of starting another.
 */
export function oneDailyReset<T>(work: () => Promise<T>): Promise<T> {
    if (inFlight) return inFlight as Promise<T>;
    const run = work();
    const tracked: Promise<T> = run.finally(() => {
        if (inFlight === tracked) inFlight = null;
    });
    inFlight = tracked;
    return tracked;
}

/** Tests reset the gate so one check cannot leak into the next. */
export function resetResetGateForTests(): void {
    inFlight = null;
}
