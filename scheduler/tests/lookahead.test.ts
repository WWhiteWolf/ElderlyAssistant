// Tests for the Look Ahead reader.

import { readLookAhead } from '../readers/lookahead.ts';
import type { LookAheadItem } from '../readers/lookahead.ts';
import { assert, assertSame, test } from './runner.ts';

// A fixed moment to test against: the first of June 2026, at nine in the
// morning. Every test says what time it is, so none of them depends on the day
// they happen to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

function entry(changes: Partial<LookAheadItem> = {}): LookAheadItem {
    return { id: 'l1', label: 'Change the smoke alarm battery', year: 2026, month: 8, day: 15, hour: 10, minute: 0, ...changes };
}

export function runLookAheadTests(): void {
    test('An entry still in the future gets one reminder at its own moment', () => {
        const wanted = readLookAhead([entry()], NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 8, 15, 10, 0, 0, 0).getTime() },
            'wrong moment',
        );
    });

    test('An entry whose moment has passed gets nothing', () => {
        const wanted = readLookAhead([entry({ year: 2026, month: 0, day: 5 })], NOW);
        assert(wanted.length === 0, 'a moment already gone cannot be acted on');
    });

    test('An entry due this very minute gets nothing', () => {
        const wanted = readLookAhead([entry({ year: 2026, month: 5, day: 1, hour: 9, minute: 0 })], NOW);
        assert(wanted.length === 0, 'expected none');
    });

    test('An entry due one minute from now still gets its reminder', () => {
        const wanted = readLookAhead([entry({ year: 2026, month: 5, day: 1, hour: 9, minute: 1 })], NOW);
        assert(wanted.length === 1, 'expected one reminder');
    });

    test('A delayed entry still keeps its own reminder', () => {
        const wanted = readLookAhead([entry({ delayedUntil: NOW + 86400000 })], NOW);
        const base = wanted.filter(w => w.source === 'lookahead');
        assert(base.length === 1, 'a delay must not remove the entry’s own reminder');
    });

    test('A delayed entry also gets a reminder at the moment it was pushed to', () => {
        const wanted = readLookAhead([entry({ delayedUntil: NOW + 86400000 })], NOW);
        const delayed = wanted.filter(w => w.source === 'lookaheaddelay');
        assert(delayed.length === 1, 'expected exactly one delayed reminder');
        assertSame(delayed[0].trigger, { kind: 'date', at: NOW + 86400000 }, 'wrong moment');
    });

    test('A delay whose moment has gone wants nothing', () => {
        const wanted = readLookAhead([entry({ delayedUntil: NOW - 86400000 })], NOW);
        assert(wanted.length === 1, 'a moment already gone cannot be acted on');
        assert(wanted[0].source === 'lookahead', 'only the entry’s own reminder should be left');
    });

    test('A delay due this very minute wants nothing', () => {
        const wanted = readLookAhead([entry({ delayedUntil: NOW })], NOW);
        assert(wanted.length === 1, 'expected only the entry’s own reminder');
    });

    test('An entry whose own moment has gone still gets its delayed reminder', () => {
        // The ordinary case: the reminder fired, and Delay was tapped on it.
        const wanted = readLookAhead(
            [entry({ year: 2026, month: 0, day: 5, delayedUntil: NOW + 86400000 })],
            NOW,
        );
        assert(wanted.length === 1, 'expected exactly one reminder');
        assert(wanted[0].source === 'lookaheaddelay', 'the delay is the only one left to arrive');
    });

    test('The delayed reminder says the same thing the entry does', () => {
        const wanted = readLookAhead([entry({ delayedUntil: NOW + 86400000 })], NOW);
        const delayed = wanted.find(w => w.source === 'lookaheaddelay')!;
        assertSame(
            { title: delayed.title, body: delayed.body, categoryIdentifier: delayed.categoryIdentifier },
            {
                title: '🔭 Look Ahead',
                body: 'Time for Change the smoke alarm battery!',
                categoryIdentifier: 'lookaheadactions',
            },
            'a delayed reminder must read exactly like the one it replaces',
        );
    });

    test('An entry and its delay never share a key', () => {
        const wanted = readLookAhead([entry({ delayedUntil: NOW + 86400000 })], NOW);
        assert(wanted[0].key !== wanted[1].key, 'the two must be told apart');
    });

    test('Two delayed entries get two delayed reminders with different keys', () => {
        const wanted = readLookAhead(
            [entry({ id: 'l1', delayedUntil: NOW + 86400000 }), entry({ id: 'l2', delayedUntil: NOW + 86400000 })],
            NOW,
        );
        const delayed = wanted.filter(w => w.source === 'lookaheaddelay');
        assert(delayed.length === 2 && delayed[0].key !== delayed[1].key, 'two entries must never share a key');
    });

    test('The banner says what Look Ahead says today', () => {
        const wanted = readLookAhead([entry({ label: 'Change the smoke alarm battery' })], NOW);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, categoryIdentifier: wanted[0].categoryIdentifier },
            {
                title: '🔭 Look Ahead',
                body: 'Time for Change the smoke alarm battery!',
                categoryIdentifier: 'lookaheadactions',
            },
            'the words and buttons must match what Look Ahead sends today',
        );
    });

    test('Two entries get two reminders with different keys', () => {
        const wanted = readLookAhead([entry({ id: 'l1' }), entry({ id: 'l2' })], NOW);
        assert(wanted.length === 2 && wanted[0].key !== wanted[1].key, 'two entries must never share a key');
    });
}
