// Whether an item would have shown on Daily on a given day.
//
// Daily already asks this of today. Miss-telling asks it of the days that
// rolled over unopened, so the same question has to take a date rather than
// reading the clock. Nothing here touches storage or the phone.

import { baseMoment } from './leadmoments.ts';
import { translateReminderItems } from './translators/translate.ts';
import type { ReminderItem } from '../modules/reminder-types.ts';

/** True when the item's saved year, month and day are that calendar day. */
export function isDateOf(item: ReminderItem, when: Date): boolean {
    if (typeof item.year !== 'number' || typeof item.month !== 'number' || typeof item.day !== 'number') {
        return false;
    }
    return item.year === when.getFullYear() && item.month === when.getMonth() && item.day === when.getDate();
}

/**
 * True when this item belongs on Daily on `when`.
 *
 * Daily items belong every day. Weekly items belong on their weekday. A
 * Daily one-shot and an Appointment belong only on the saved date. Monthly,
 * Quarterly and Yearly belong on the saved date, or on the day the engine's
 * next occurrence lands — first Thursday and Wednesday after the 6th have no
 * saved date that matches. Extended never belongs; it has no day.
 */
export function shownOnDate(item: ReminderItem, when: Date): boolean {
    if (item.kind === 'daily') return true;
    if (item.kind === 'weekly') return item.day === when.getDay();
    if (item.kind === 'monthly' || item.kind === 'quarterly' || item.kind === 'yearly' || item.kind === 'appointments' || item.kind === 'oneTime') {
        if (isDateOf(item, when)) return true;
        if (item.kind === 'appointments' || item.kind === 'oneTime') return false;
        const shaped = translateReminderItems([item], when.getTime())[0];
        if (!shaped) return false;
        const start = new Date(when);
        start.setHours(0, 0, 0, 0);
        const base = baseMoment(shaped, start.getTime() - 1);
        if (base === null) return false;
        const occurs = new Date(base.moment);
        return occurs.getFullYear() === when.getFullYear()
            && occurs.getMonth() === when.getMonth()
            && occurs.getDate() === when.getDate();
    }
    return false;
}
