// Tests for rolling a dated item to its next month without losing the 31st.

import { advanceDatedItem } from '../../modules/advance-dated-item.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import { assertSame, test } from './runner.ts';

function monthly31(changes: Partial<ReminderItem> = {}): ReminderItem {
    return {
        id: 'i1',
        kind: 'monthly',
        label: 'The 31st',
        year: 2026,
        month: 0,
        day: 31,
        hour: 12,
        minute: 0,
        ...changes,
    };
}

export function runAdvanceDatedTests(): void {
    test('Done on 31 January leaves the reminder as the 31st in February', () => {
        const next = advanceDatedItem(monthly31(), new Date(2026, 0, 31, 20, 0, 0, 0).getTime());
        assertSame(
            [next.year, next.month, next.day],
            [2026, 1, 31],
            'February still uses the 28th that month; the day saved is 31',
        );
    });

    test('Done on 28 February brings the 31st back in March', () => {
        const next = advanceDatedItem(
            monthly31({ month: 1, day: 31 }),
            new Date(2026, 1, 28, 20, 0, 0, 0).getTime(),
        );
        assertSame(
            [next.year, next.month, next.day],
            [2026, 2, 31],
            'March has a 31st, so that is the next date',
        );
    });

    test('Done on a birthday moves the date a year', () => {
        const next = advanceDatedItem(
            {
                id: 'b1',
                kind: 'birthdays',
                label: 'Pat',
                year: 2026,
                month: 5,
                day: 10,
                hour: 12,
                minute: 0,
            },
            new Date(2026, 5, 10, 20, 0, 0, 0).getTime(),
        );
        assertSame(
            [next.year, next.month, next.day],
            [2027, 5, 10],
            'Birthdays write year on the table, so Done steps a year',
        );
    });
}
