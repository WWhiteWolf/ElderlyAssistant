// Tests for the daily reset.

import { isNewDay, resetForNewDay } from '../dailyreset.ts';
import type { ResettableItem } from '../dailyreset.ts';
import { assert, assertSame, test } from './runner.ts';

interface Item extends ResettableItem {
    label: string;
    hour: number | null;
    minute: number | null;
}

function item(changes: Partial<Item> = {}): Item {
    return { id: '1', label: 'Breakfast', hour: 8, minute: 0, completed: true, ...changes };
}

export function runDailyResetTests(): void {
    test('A saved day that is not today is a new day', () => {
        assert(isNewDay('8/20/2026', '8/21/2026'), 'expected a new day');
    });

    test('A saved day that is today is not a new day', () => {
        assert(!isNewDay('8/21/2026', '8/21/2026'), 'expected the same day');
    });

    test('A day never written down at all counts as a new day', () => {
        assert(isNewDay(null, '8/21/2026'), 'expected a new day');
    });

    test('A new day takes the checkmark off', () => {
        const after = resetForNewDay([item()]);
        assert(after[0].completed === false, 'expected the checkmark cleared');
    });

    test('A new day takes yesterday\'s snooze off with it', () => {
        const after = resetForNewDay([item({ snoozedUntil: 1 })]);
        assert(after[0].snoozedUntil === undefined, 'expected the snooze gone');
    });

    test('Nothing else about an item is touched', () => {
        const after = resetForNewDay([item({ label: 'Evening Feed', hour: 17, minute: 30 })]);
        assertSame(
            { id: after[0].id, label: after[0].label, hour: after[0].hour, minute: after[0].minute },
            { id: '1', label: 'Evening Feed', hour: 17, minute: 30 },
            'the item itself changed',
        );
    });

    test('An item with no time of day is reset like any other', () => {
        const after = resetForNewDay([item({ hour: null, minute: null, snoozedUntil: 1 })]);
        assertSame(
            { completed: after[0].completed, snoozedUntil: after[0].snoozedUntil, hour: after[0].hour },
            { completed: false, hour: null },
            'expected the checkmark and snooze cleared and the empty time kept',
        );
    });

    test('An item already clear is left exactly as it was', () => {
        const after = resetForNewDay([item({ completed: false })]);
        assertSame(after[0], item({ completed: false }), 'expected no change');
    });

    test('Every item in the list is reset, not just the first', () => {
        const after = resetForNewDay([item({ id: '1' }), item({ id: '2' }), item({ id: '3' })]);
        assert(after.every((i) => i.completed === false), 'expected all three cleared');
    });

    test('An empty list resets to an empty list', () => {
        assert(resetForNewDay([]).length === 0, 'expected nothing');
    });
}
