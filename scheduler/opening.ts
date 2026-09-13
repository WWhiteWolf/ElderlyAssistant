// The order of work when Memory opens or returns to the foreground.
//
// This file is plain TypeScript. The root housing supplies the phone work and
// the native notice, so Node can prove the order without React Native or Expo.

/** The work that belongs to one opening of Memory. */
export interface OpeningWork {
    /** Rolls the day and week over, then brings the phone reminders up to date. */
    runScheduler: () => Promise<unknown>;
    /** Decides whether there is anything to say and waits for OK when there is. */
    showHealthNotice: () => Promise<void>;
}

/** Finish all work belonging to one launch or foreground return. */
export async function completeOpening(work: OpeningWork): Promise<void> {
    await work.runScheduler();
    await work.showHealthNotice();
}

/** True when a banner response opens Memory and must wait for root readiness. */
export function responseWaitsForOpening(
    bodyTap: boolean,
    leavesAppClosedBit?: boolean,
): boolean {
    return bodyTap || leavesAppClosedBit === false;
}

/** One root-owned opening cycle and the banner destinations waiting behind it. */
export interface RootOpeningCycle {
    /** Start the one cycle belonging to this launch or foreground return. */
    begin: (work: OpeningWork) => Promise<void>;
    /** Forget the prior cycle when Memory leaves the foreground. */
    prepareForNext: () => void;
    /** Release a banner destination after the current cycle has completed. */
    releaseAfterCurrent: (destination: () => void | Promise<void>) => Promise<void>;
}

/**
 * Keep banner body handling behind the opening cycle that the root already
 * owns. A body response arriving just before the cycle starts waits for it; it
 * never starts another scheduler or notice sequence.
 */
export function rootOpeningCycle(): RootOpeningCycle {
    let current: Promise<void> | null = null;
    const waiting: Array<{
        destination: () => void | Promise<void>;
        resolve: () => void;
        reject: (problem: unknown) => void;
    }> = [];

    const releaseAfter = (
        cycle: Promise<void>,
        destination: () => void | Promise<void>,
    ): Promise<void> => cycle.then(destination);

    return {
        begin: (work) => {
            const cycle = completeOpening(work);
            current = cycle;

            for (const waiter of waiting.splice(0)) {
                void releaseAfter(cycle, waiter.destination).then(
                    waiter.resolve,
                    waiter.reject,
                );
            }
            return cycle;
        },
        prepareForNext: () => {
            current = null;
        },
        releaseAfterCurrent: (destination) => {
            if (current) return releaseAfter(current, destination);
            return new Promise<void>((resolve, reject) => {
                waiting.push({ destination, resolve, reject });
            });
        },
    };
}

/**
 * Give every caller the same promise while one native presentation is active.
 *
 * The tracked promise is cleared after success or failure, so a later opening
 * can make a fresh decision.
 */
export function sharePresentation(
    present: () => Promise<void>,
): () => Promise<void> {
    let inFlight: Promise<void> | null = null;

    return () => {
        if (inFlight) return inFlight;

        const run = Promise.resolve().then(present);
        const tracked = run.finally(() => {
            if (inFlight === tracked) inFlight = null;
        });
        inFlight = tracked;
        return tracked;
    };
}

/**
 * Make one persisted response checker for the current app process.
 *
 * The in-memory set closes the small gap while storage is being read. The
 * saved key closes the larger gap after the app has been killed and reopened.
 */
export function persistedResponseChecker(
    readLastKey: () => Promise<string | null>,
    writeLastKey: (key: string) => Promise<void>,
): (key: string) => Promise<boolean> {
    const claimed = new Set<string>();

    return async (key: string) => {
        if (claimed.has(key)) return false;
        claimed.add(key);

        try {
            if (await readLastKey() === key) return false;
            await writeLastKey(key);
            return true;
        } catch (problem) {
            claimed.delete(key);
            throw problem;
        }
    };
}
