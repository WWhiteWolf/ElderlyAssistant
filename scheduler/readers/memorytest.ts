// The Memory Test reader.
//
// The memory test shows five words, asks for them back five times, and then
// waits five minutes before asking once more. That five-minute wait is the
// only reminder the test ever sets, and the moment it is due is already saved
// with the session — so the scheduler can read it like anything else.

import { makeKey } from '../types.ts';
import type { WantedReminder } from '../types.ts';

/** The test in progress, exactly as it is saved under `memtest_session`. */
export interface MemoryTestSession {
    date: string;
    phase: 'show' | 'entry' | 'between' | 'waiting' | 'recall' | 'done';
    // When the five-minute check falls due, or null before the wait begins.
    recallDue: number | null;
}

/**
 * The reminder the memory test calls for, which is at most one.
 *
 * There is a reminder only while the test is in its waiting phase and the due
 * moment is still ahead. Before the wait there is nothing to remind about, and
 * once the moment has passed the screen itself asks for the words.
 *
 * A session that is not running at all is handed in as null.
 */
export function readMemoryTest(session: MemoryTestSession | null, now: number): WantedReminder[] {
    if (!session) return [];
    if (session.phase !== 'waiting') return [];
    if (session.recallDue == null) return [];
    if (session.recallDue <= now) return [];

    return [{
        key: makeKey('memorytest', 'session', 'recall'),
        source: 'memorytest',
        itemId: 'session',
        label: 'Memory Test',
        title: '🧠 Memory Test',
        body: 'Time to recall your 5 words.',
        // No buttons, which is what this one carries today.
        trigger: { kind: 'date', at: session.recallDue },
    }];
}
