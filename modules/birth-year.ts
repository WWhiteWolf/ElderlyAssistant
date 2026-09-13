// Lines that need a year of birth. Calendar, Daily, the row name, and the
// reminder read birthYear. The next fire date is derived from the birthdate.
// Done must not move this year.

import type { ReminderItem } from './reminder-types.ts';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function firstNameOf(label: string): string {
    const t = label.trim();
    const space = t.indexOf(' ');
    return space === -1 ? t : t.slice(0, space);
}

export function ageOnCalendarYear(birthYear: number, viewYear: number): number | null {
    const age = viewYear - birthYear;
    return age >= 0 ? age : null;
}

/** The year they were born. Recovers it from a stored date that was never split. */
export function birthYearOf(item: ReminderItem, nowYear: number): number | undefined {
    if (typeof item.birthYear === 'number') return item.birthYear;
    if (typeof item.year === 'number' && item.year < nowYear) return item.year;
    return undefined;
}

function lastDayOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** The birthdate as a line, or nothing when the year of birth is not known. */
export function birthDateText(item: ReminderItem, nowYear: number): string | null {
    if (typeof item.month !== 'number' || typeof item.day !== 'number') return null;
    const year = birthYearOf(item, nowYear);
    if (typeof year !== 'number') return null;
    const day = Math.min(item.day, lastDayOfMonth(year, item.month));
    return `${MONTH_NAMES[item.month]} ${day}, ${year}`;
}

/** The row name is the person's name and their birthdate. */
export function birthdayRowName(item: ReminderItem, nowYear: number): string {
    const when = birthDateText(item, nowYear);
    return when ? `${item.label} · ${when}` : item.label;
}

/**
 * The next calendar year that occurrence should fire in.
 *
 * This is the reminder setting, derived from the birth month and day.
 */
export function nextBirthdayYear(
    month: number,
    day: number,
    hour: number,
    minute: number,
    nowMs: number,
    thisCycleDone: boolean,
): number {
    const now = new Date(nowMs);
    const year = now.getFullYear();
    const due = new Date(year, month, Math.min(day, lastDayOfMonth(year, month)), hour, minute, 0, 0);
    if (thisCycleDone || due.getTime() <= nowMs) return year + 1;
    return year;
}

/**
 * Write the year of birth when it was never split off, and derive the next
 * fire date from that birthdate. Restore uses this so an older backup still
 * keeps the birthdate.
 */
export function withDerivedBirthdaySetting(item: ReminderItem, nowMs: number): ReminderItem {
    const nowYear = new Date(nowMs).getFullYear();
    const born = birthYearOf(item, nowYear);
    if (typeof born !== 'number' || typeof item.month !== 'number' || typeof item.day !== 'number') {
        return item;
    }
    const yearIsNextFire =
        typeof item.year === 'number' && item.year > born && item.year >= nowYear;
    const year = yearIsNextFire
        ? item.year
        : nextBirthdayYear(
            item.month,
            item.day,
            item.hour ?? 12,
            item.minute ?? 0,
            nowMs,
            !!item.completed,
        );
    if (item.birthYear === born && item.year === year) return item;
    return { ...item, birthYear: born, year };
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

/** The reminder names the age they turn on that occurrence. */
export function birthdayReminderLine(item: ReminderItem, nowYear: number): string {
    const born = birthYearOf(item, nowYear);
    if (typeof born !== 'number') return item.label;
    const viewYear =
        typeof item.year === 'number' && item.year > born ? item.year : nowYear;
    return dayListLine({ ...item, birthYear: born }, viewYear);
}
