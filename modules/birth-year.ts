// Lines that need a year of birth. Calendar and Daily read birthYear.
// The Birthdays page does not. Done must not move this year.

import type { ReminderItem } from './reminder-types.ts';

export function firstNameOf(label: string): string {
    const t = label.trim();
    const space = t.indexOf(' ');
    return space === -1 ? t : t.slice(0, space);
}

export function ageOnCalendarYear(birthYear: number, viewYear: number): number | null {
    const age = viewYear - birthYear;
    return age >= 0 ? age : null;
}

/** Month cell: B-day and the first name. */
export function monthCellLine(item: ReminderItem): string {
    if (typeof item.birthYear !== 'number') return item.label;
    return `B-day ${firstNameOf(item.label)}`;
}

/** Day list and Daily: Birthday, first name, and the age they turn that year. */
export function dayListLine(item: ReminderItem, viewYear: number): string {
    if (typeof item.birthYear !== 'number') return item.label;
    const name = firstNameOf(item.label);
    const age = ageOnCalendarYear(item.birthYear, viewYear);
    return age == null ? `Birthday ${name}` : `Birthday ${name} ${age}`;
}
