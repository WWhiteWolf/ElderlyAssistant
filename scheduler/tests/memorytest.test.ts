// Tests for the Memory Test reader.

import { readMemoryTest } from '../readers/memorytest.ts';
import type { MemoryTestSession } from '../readers/memorytest.ts';
import { assert, assertSame, test } from './runner.ts';

const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

function session(changes: Partial<MemoryTestSession> = {}): MemoryTestSession {
    return { date: '2026-06-01', phase: 'waiting', recallDue: NOW + 5 * 60000, ...changes };
}

export function runMemoryTestTests(): void {
    test('A test waiting for its five minutes gets one reminder at that moment', () => {
        const wanted = readMemoryTest(session(), NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(wanted[0].trigger, { kind: 'date', at: NOW + 5 * 60000 }, 'wrong moment');
    });

    test('No test running at all means no reminder', () => {
        assert(readMemoryTest(null, NOW).length === 0, 'expected none');
    });

    test('A test still showing its words has nothing to remind about yet', () => {
        assert(readMemoryTest(session({ phase: 'show', recallDue: null }), NOW).length === 0, 'expected none');
    });

    test('A test whose five minutes are already up gets no reminder', () => {
        assert(readMemoryTest(session({ recallDue: NOW - 60000 }), NOW).length === 0, 'expected none');
    });

    test('A finished test gets no reminder', () => {
        assert(readMemoryTest(session({ phase: 'done' }), NOW).length === 0, 'expected none');
    });

    test('The banner says what the memory test says today', () => {
        const wanted = readMemoryTest(session(), NOW);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, key: wanted[0].key },
            { title: '🧠 Memory Test', body: 'Time to recall your 5 words.', key: 'memorytest:session:recall' },
            'the words must match what the memory test sends today',
        );
    });
}
