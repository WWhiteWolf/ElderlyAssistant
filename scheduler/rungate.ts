// One run at a time, with one queued rerun.
//
// Two runs at once would each read the queue before the other had changed
// it. A request that arrives during a run is not discarded: it sets a
// pending flag, and when the current run finishes the scheduler runs once
// more against the latest saved truth. Many requests collapse into that
// one final rerun.

let running = false;
let pending = false;

/** True when this request should start the work. False when it was queued. */
export function beginRun(): boolean {
    if (running) {
        pending = true;
        return false;
    }
    running = true;
    pending = false;
    return true;
}

/** True when another run should follow immediately against the latest save. */
export function consumePending(): boolean {
    if (!pending) return false;
    pending = false;
    return true;
}

export function endRun(): void {
    running = false;
    pending = false;
}

/** Tests reset the gate so one check cannot leak into the next. */
export function resetRunGateForTests(): void {
    running = false;
    pending = false;
}
