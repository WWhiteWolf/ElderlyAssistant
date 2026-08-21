// Tests for the My Day reader.
//
// Each one hands the reader a saved list and checks what comes back.

import { readMyDay } from '../readers/myday.ts';
import type { MyDayItem } from '../readers/myday.ts';
import { assert, assertSame, test } from './runner.ts';

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
        const wanted = readMyDay([item({ hour: 8, minute: 30 })]);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(
            wanted[0].trigger,
            { kind: 'daily', hour: 8, minute: 30 },
            'the reminder should repeat daily at half past eight',
        );
    });

    test('An item with no time set gets no reminder at all', () => {
        const wanted = readMyDay([item({ hour: null, minute: null })]);
        assert(wanted.length === 0, 'expected no reminders');
    });

    test('An older saved item with no hour or minute field gets no reminder', () => {
        const stripped = { id: 'a1', label: 'Breakfast', completed: false } as unknown as MyDayItem;
        const wanted = readMyDay([stripped]);
        assert(wanted.length === 0, 'expected no reminders');
    });

    test('An item already checked off still gets its daily reminder', () => {
        const wanted = readMyDay([item({ completed: true })]);
        assert(wanted.length === 1, 'checking an item off must not remove its daily repeat');
    });

    test('Two items get two reminders with different keys', () => {
        const wanted = readMyDay([
            item({ id: 'a1', label: 'Breakfast' }),
            item({ id: 'b2', label: 'Pills', hour: 9, minute: 15 }),
        ]);
        assert(wanted.length === 2, 'expected two reminders');
        assert(wanted[0].key !== wanted[1].key, 'two items must never share a key');
    });

    test('The same list read twice gives exactly the same keys', () => {
        const list = [item({ id: 'a1' }), item({ id: 'b2' })];
        const first = readMyDay(list).map((r) => r.key);
        const second = readMyDay(list).map((r) => r.key);
        assertSame(second, first, 'reading twice must not invent a second set of reminders');
    });

    test('An empty list gives nothing', () => {
        assert(readMyDay([]).length === 0, 'expected no reminders');
    });

    test('The banner says what the screen says today', () => {
        const wanted = readMyDay([item({ label: 'Breakfast' })]);
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
        const wanted = readMyDay([item({ id: 'a1' })]);
        assertSame(wanted[0].key, 'myday:a1:base', 'unexpected key');
    });
}
