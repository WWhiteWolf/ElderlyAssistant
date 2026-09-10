// Lines that need a year of birth.

import { dayListLine, firstNameOf, monthCellLine } from '../../modules/birth-year.ts';
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
}
