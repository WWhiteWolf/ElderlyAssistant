// Tests for the My Day reader.
//
// Each one hands the reader a saved list and checks what comes back.

import { readMyDay } from '../readers/myday.ts';
import type { MyDayItem } from '../readers/myday.ts';
import { assert, assertSame, test } from './runner.ts';

/** A moment to call "now", so no test depends on the real clock. */
const NOW = 1_800_000_000_000;
const MINUTE = 60 * 1000;

/** A saved item, with anything not named taking a sensible default. */
function item(changes: Partial<MyDayItem> = {}): MyDayItem {
    return {
        id: 'a1',
        label: 'Breakfast',
        hour: 8,
        minute: 0,
        completed: false,
        ...changes,
    };
}

export function runMyDayTests(): void {
    test('An item with a time gets one daily reminder at that time', () => {
        const wanted = readMyDay([item({ hour: 8, minute: 30 })], NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(
            wanted[0].trigger,
            { kind: 'daily', hour: 8, minute: 30 },
            'the reminder should repeat daily at half past eight',
        );
    });

    test('An item with no time set gets no reminder at all', () => {
        const wanted = readMyDay([item({ hour: null, minute: null })], NOW);
        assert(wanted.length === 0, 'expected no reminders');
    });

    test('An older saved item with no hour or minute field gets no reminder', () => {
        const stripped = { id: 'a1', label: 'Breakfast', completed: false } as unknown as MyDayItem;
        const wanted = readMyDay([stripped], NOW);
        assert(wanted.length === 0, 'expected no reminders');
    });

    test('An item already checked off still gets its daily reminder', () => {
        const wanted = readMyDay([item({ completed: true })], NOW);
        assert(wanted.length === 1, 'checking an item off must not remove its daily repeat');
    });

    test('Two items get two reminders with different keys', () => {
        const wanted = readMyDay([
            item({ id: 'a1', label: 'Breakfast' }),
            item({ id: 'b2', label: 'Pills', hour: 9, minute: 15 }),
        ], NOW);
        assert(wanted.length === 2, 'expected two reminders');
        assert(wanted[0].key !== wanted[1].key, 'two items must never share a key');
    });

    test('The same list read twice gives exactly the same keys', () => {
        const list = [item({ id: 'a1' }), item({ id: 'b2' })];
        const first = readMyDay(list, NOW).map((r) => r.key);
        const second = readMyDay(list, NOW).map((r) => r.key);
        assertSame(second, first, 'reading twice must not invent a second set of reminders');
    });

    test('An empty list gives nothing', () => {
        assert(readMyDay([], NOW).length === 0, 'expected no reminders');
    });

    test('The banner says what the screen says today', () => {
        const wanted = readMyDay([item({ label: 'Breakfast' })], NOW);
        assertSame(
            {
                title: wanted[0].title,
                body: wanted[0].body,
                categoryIdentifier: wanted[0].categoryIdentifier,
                source: wanted[0].source,
            },
            {
                title: 'Daily Routine',
                body: 'Time for Breakfast!',
                categoryIdentifier: 'routineactions',
                source: 'myday',
            },
            'the words and buttons must match what My Day sends today',
        );
    });

    test('The key names the screen, the item and which reminder it is', () => {
        const wanted = readMyDay([item({ id: 'a1' })], NOW);
        const base = wanted.find((r) => r.source === 'myday');
        assertSame(base!.key, 'myday:a1:base', 'unexpected key');
    });

    // ---- Snoozes (#10-new) ----

    test('A snoozed item gets a second reminder at the moment it was snoozed to', () => {
        const at = NOW + 30 * MINUTE;
        const wanted = readMyDay([item({ snoozedUntil: at })], NOW);
        assert(wanted.length === 2, 'expected the daily repeat and the snooze');
        const snooze = wanted.find((r) => r.source === 'mydaysnooze');
        assert(snooze != null, 'expected a snooze reminder');
        assertSame(snooze!.trigger, { kind: 'date', at }, 'the snooze must fire at its own moment');
    });

    test('A snooze leaves the daily repeat alone', () => {
        const wanted = readMyDay([item({ hour: 8, minute: 0, snoozedUntil: NOW + 15 * MINUTE })], NOW);
        const base = wanted.find((r) => r.source === 'myday');
        assert(base != null, 'the daily repeat must survive a snooze');
        assertSame(base!.trigger, { kind: 'daily', hour: 8, minute: 0 }, 'the repeat must not move');
    });

    test('A snooze whose moment has gone is wanted no more', () => {
        const wanted = readMyDay([item({ snoozedUntil: NOW - MINUTE })], NOW);
        assert(
            wanted.every((r) => r.source !== 'mydaysnooze'),
            'a snooze already past cannot be acted on and must not be armed',
        );
    });

    test('Snoozing twice still wants only one snooze reminder', () => {
        const first = readMyDay([item({ snoozedUntil: NOW + 15 * MINUTE })], NOW);
        const second = readMyDay([item({ snoozedUntil: NOW + 30 * MINUTE })], NOW);
        const a = first.find((r) => r.source === 'mydaysnooze')!;
        const b = second.find((r) => r.source === 'mydaysnooze')!;
        assertSame(b.key, a.key, 'both snoozes must carry one name, so the second moves the first');
        assert(
            second.filter((r) => r.source === 'mydaysnooze').length === 1,
            'expected exactly one snooze reminder',
        );
    });

    test('A snoozed item with no time of day still gets its snooze', () => {
        const at = NOW + 20 * MINUTE;
        const wanted = readMyDay([item({ hour: null, minute: null, snoozedUntil: at })], NOW);
        assert(wanted.length === 1, 'expected the snooze and nothing else');
        assertSame(wanted[0].source, 'mydaysnooze', 'expected the snooze');
    });

    test('The snooze banner says what the item says', () => {
        const wanted = readMyDay([item({ label: 'Pills', snoozedUntil: NOW + MINUTE })], NOW);
        const snooze = wanted.find((r) => r.source === 'mydaysnooze')!;
        assertSame(
            {
                key: snooze.key,
                title: snooze.title,
                body: snooze.body,
                categoryIdentifier: snooze.categoryIdentifier,
            },
            {
                key: 'mydaysnooze:a1:base',
                title: 'Daily Routine',
                body: 'Time for Pills!',
                categoryIdentifier: 'routineactions',
            },
            'a snoozed reminder must read exactly like the one it stands in for',
        );
    });
}
