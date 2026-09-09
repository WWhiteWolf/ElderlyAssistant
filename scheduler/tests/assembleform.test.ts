// Tests that Save writes from the table.

import { assembleFormItem, type AssembleFormParts } from '../../modules/assemble-form-item.ts';
import { emptyOptionSettings } from '../../modules/option-cases.ts';
import { assert, assertSame, test } from './runner.ts';

function parts(changes: Partial<AssembleFormParts> & Pick<AssembleFormParts, 'editKind'>): AssembleFormParts {
    const pendingDate = changes.pendingDate ?? new Date(2026, 5, 10, 9, 30, 0, 0);
    return {
        existing: null,
        id: 'i1',
        name: 'Take the tablets',
        pendingDay: 2,
        pendingTime: new Date(2026, 5, 10, 8, 15, 0, 0),
        pendingDate,
        dateSet: true,
        timeSet: true,
        reminders: [{ id: 'r1', amount: 30, unit: 'minutes', kind: 'offset' }],
        intervalMonths: 6,
        quarterlyStep: 'none',
        optionSettings: emptyOptionSettings(),
        note: '',
        ...changes,
    };
}

export function runAssembleFormTests(): void {
    test('Daily with a time keeps hour and minute and has no date and no reminders', () => {
        const next = assembleFormItem(parts({
            editKind: 'daily',
            pendingTime: new Date(2026, 5, 10, 8, 15, 0, 0),
        }));
        assertSame(
            [next.hour, next.minute, next.year, next.month, next.day, next.reminders],
            [8, 15, undefined, undefined, undefined, undefined],
            'Daily keeps the time and drops date and chips',
        );
    });

    test('Weekly writes the weekday in day and has no year', () => {
        const next = assembleFormItem(parts({ editKind: 'weekly', pendingDay: 2 }));
        assertSame(
            [next.day, next.year, next.month],
            [2, undefined, undefined],
            'Weekly’s day is the weekday, not a calendar date',
        );
    });

    test('Monthly with no weekday pattern writes the calendar date', () => {
        const next = assembleFormItem(parts({
            editKind: 'monthly',
            pendingDate: new Date(2026, 5, 10, 9, 30, 0, 0),
        }));
        assertSame(
            [next.year, next.month, next.day],
            [2026, 5, 10],
            'a dated Monthly keeps the date',
        );
    });

    test('Monthly with a complete second Thursday drops the calendar date', () => {
        const next = assembleFormItem(parts({
            editKind: 'monthly',
            pendingDate: new Date(2026, 5, 10, 9, 30, 0, 0),
            optionSettings: {
                ...emptyOptionSettings(),
                weekdayOrdinal: 2,
                ordinalWeekday: 4,
            },
        }));
        assertSame(
            [next.year, next.month, next.day, next.weekdayOrdinal, next.ordinalWeekday],
            [undefined, undefined, undefined, 2, 4],
            'a complete second Thursday is the date',
        );
    });

    test('Quarterly none writes intervalMonths 3 and no intervalDays', () => {
        const next = assembleFormItem(parts({
            editKind: 'quarterly',
            quarterlyStep: 'none',
            intervalMonths: 6,
        }));
        assertSame(
            [next.intervalMonths, next.intervalDays],
            [3, undefined],
            'no chip is every three months',
        );
    });

    test('Quarterly 90 writes intervalDays 90 and no intervalMonths', () => {
        const next = assembleFormItem(parts({
            editKind: 'quarterly',
            quarterlyStep: 'days90',
        }));
        assertSame(
            [next.intervalDays, next.intervalMonths],
            [90, undefined],
            'a day chip is the only step',
        );
    });

    test('One Time writes today’s date', () => {
        const next = assembleFormItem(parts({
            editKind: 'oneTime',
            pendingDate: new Date(2020, 0, 1, 14, 0, 0, 0),
        }));
        const today = new Date();
        assertSame(
            [next.year, next.month, next.day],
            [today.getFullYear(), today.getMonth(), today.getDate()],
            'One Time is today, not the picker date',
        );
    });

    test('Appointments with no date set has no year, month, or day', () => {
        const next = assembleFormItem(parts({
            editKind: 'appointments',
            dateSet: false,
        }));
        assertSame(
            [next.year, next.month, next.day],
            [undefined, undefined, undefined],
            'a missing date is not invented',
        );
    });

    test('Birthdays always write a date', () => {
        const next = assembleFormItem(parts({
            editKind: 'birthdays',
            pendingDate: new Date(2026, 5, 10, 12, 0, 0, 0),
        }));
        assertSame(
            [next.year, next.month, next.day],
            [2026, 5, 10],
            'Birthdays require a date',
        );
    });

    test('Bucket List has no date, no time, and no reminders', () => {
        const next = assembleFormItem(parts({ editKind: 'bucketlist' }));
        assertSame(
            [next.year, next.month, next.day, next.hour, next.minute, next.reminders],
            [undefined, undefined, undefined, undefined, undefined, undefined],
            'Bucket List keeps name and Done only',
        );
        assert(!('hour' in next) && !('reminders' in next), 'dropped fields are gone, not left empty');
    });
}
