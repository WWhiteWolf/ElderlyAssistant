// Lines that need a year of birth.

import { dayListLine, firstNameOf, monthCellLine, birthdayRowName, birthdayReminderLine, nextBirthdayYear } from '../../modules/birth-year.ts';
import { assertSame, test } from './runner.ts';

export function runBirthYearTests(): void {
    test('The first name is the first word of Name', () => {
        assertSame(firstNameOf('Pat Smith'), 'Pat', 'Mary Smith is Mary');
        assertSame(firstNameOf('Pat'), 'Pat', 'one word stays');
    });

    test('A month cell with a birth year says B-day and the first name', () => {
        assertSame(
            monthCellLine({
                id: 'b1',
                kind: 'birthdays',
                label: 'Pat Smith',
                birthYear: 1948,
            }),
            'B-day Pat',
            'short on the month',
        );
    });

    test('The day list with a birth year says Birthday, first name, and age', () => {
        assertSame(
            dayListLine({
                id: 'b1',
                kind: 'birthdays',
                label: 'Pat Smith',
                birthYear: 1948,
            }, 2026),
            'Birthday Pat 78',
            'long on the day',
        );
    });

    test('Without a birth year the lines stay the saved name', () => {
        const item = { id: 'a1', kind: 'appointments' as const, label: 'Dentist' };
        assertSame(monthCellLine(item), 'Dentist', 'month');
        assertSame(dayListLine(item, 2026), 'Dentist', 'day');
    });

    test('The Birthdays row name is the person and the birthdate', () => {
        assertSame(
            birthdayRowName({
                id: 'b1',
                kind: 'birthdays',
                label: 'Pat Smith',
                year: 2027,
                month: 5,
                day: 10,
                birthYear: 1948,
            }, 2026),
            'Pat Smith · Jun 10, 1948',
            'the next fire year is not on the row',
        );
    });

    test('The reminder names the age they turn on that occurrence', () => {
        assertSame(
            birthdayReminderLine({
                id: 'b1',
                kind: 'birthdays',
                label: 'Pat Smith',
                year: 2026,
                month: 5,
                day: 10,
                birthYear: 1948,
            }, 2026),
            'Birthday Pat 78',
            'age is the occurrence year minus the year of birth',
        );
    });

    test('The next fire year is derived from the birth month and day', () => {
        assertSame(
            nextBirthdayYear(5, 10, 12, 0, new Date(2026, 8, 13, 18, 0, 0, 0).getTime(), false),
            2027,
            'a June birthday in September is next year',
        );
        assertSame(
            nextBirthdayYear(11, 25, 12, 0, new Date(2026, 8, 13, 18, 0, 0, 0).getTime(), false),
            2026,
            'a December birthday in September is still this year',
        );
        assertSame(
            nextBirthdayYear(11, 25, 12, 0, new Date(2026, 8, 13, 18, 0, 0, 0).getTime(), true),
            2027,
            'Done skips this cycle even when the day is still ahead',
        );
    });
}
