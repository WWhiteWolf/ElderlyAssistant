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

    test('Monthly Save in February keeps a 31st as the 31st', () => {
        const next = assembleFormItem(parts({
            editKind: 'monthly',
            existing: {
                id: 'i1',
                kind: 'monthly',
                label: 'The 31st',
                year: 2026,
                month: 1,
                day: 31,
                hour: 12,
                minute: 0,
            },
            pendingDate: new Date(2026, 1, 28, 12, 0, 0, 0),
        }));
        assertSame(
            [next.year, next.month, next.day],
            [2026, 1, 31],
            'the picker can only show the 28th; Save must not turn the series into a 28th',
        );
    });

    test('Monthly Save writes a day that was actually changed', () => {
        const next = assembleFormItem(parts({
            editKind: 'monthly',
            existing: {
                id: 'i1',
                kind: 'monthly',
                label: 'The 31st',
                year: 2026,
                month: 1,
                day: 31,
                hour: 12,
                minute: 0,
            },
            pendingDate: new Date(2026, 1, 15, 12, 0, 0, 0),
        }));
        assertSame(
            [next.year, next.month, next.day],
            [2026, 1, 15],
            'picking a real other day is a new series day',
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

    test('Appointments always write a date', () => {
        const next = assembleFormItem(parts({
            editKind: 'appointments',
            pendingDate: new Date(2026, 5, 10, 12, 0, 0, 0),
        }));
        assertSame(
            [next.year, next.month, next.day],
            [2026, 5, 10],
            'Appointments require a date',
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

    test('ifTimeSet with no time keeps clock chips and drops offset chips', () => {
        const next = assembleFormItem(parts({
            editKind: 'birthdays',
            timeSet: false,
            reminders: [
                { id: 'r1', amount: 30, unit: 'minutes', kind: 'offset' },
                { id: 'r2', amount: 0, unit: 'days', kind: 'clock', daysBefore: 0, timeOfDay: 'morning' },
            ],
        }));
        assertSame(
            next.reminders?.map((one) => one.id),
            ['r2'],
            'offset chips need a time; clock chips use the date',
        );
    });

    test('A new Birthday writes the year of birth from the date', () => {
        const next = assembleFormItem(parts({
            editKind: 'birthdays',
            existing: null,
            pendingDate: new Date(1948, 5, 10, 12, 0, 0, 0),
        }));
        assertSame(next.birthYear, 1948, 'New keeps the year they were born');
    });

    test('Save on an existing Birthday does not move the year of birth', () => {
        const next = assembleFormItem(parts({
            editKind: 'birthdays',
            existing: {
                id: 'i1',
                kind: 'birthdays',
                label: 'Pat Smith',
                year: 2026,
                month: 5,
                day: 10,
                birthYear: 1948,
            },
            pendingDate: new Date(2026, 5, 10, 12, 0, 0, 0),
        }));
        assertSame(next.birthYear, 1948, 'Done already moved the next date; birth year stays');
    });

    test('Appointments do not keep a year of birth', () => {
        const next = assembleFormItem(parts({
            editKind: 'appointments',
            pendingDate: new Date(1948, 5, 10, 12, 0, 0, 0),
        }));
        assert(!('birthYear' in next), 'Appointments have no birth year');
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

    test('Weekly Save writes Day after the set day when that choice is on', () => {
        const next = assembleFormItem(parts({
            editKind: 'weekly',
            optionSettings: { ...emptyOptionSettings(), afterSetDay: true },
        }));
        assertSame(next.afterSetDay, true, 'Save writes the bit; the page does not move the day');
    });
}
