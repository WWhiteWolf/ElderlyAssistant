/**
 * Every notification source produced from the one saved reminder list.
 *
 * The scheduler's ownership boundary, unread-list protection, and queue view
 * all read this same typed list. Adding a source here makes every consumer
 * account for it instead of relying on three lists that can drift apart.
 */
export const REMINDER_LIST_SOURCE_CODES = [
    'daily',
    'dailysnooze',
    'oneTime',
    'oneTimesnooze',
    'weekly',
    'weeklysnooze',
    'monthly',
    'monthlydelay',
    'quarterly',
    'quarterlydelay',
    'yearly',
    'yearlydelay',
    'appointments',
    'birthdays',
] as const;

export type ReminderListSourceCode = (typeof REMINDER_LIST_SOURCE_CODES)[number];

/** True when a phone reminder names one source from the saved reminder list. */
export function isReminderListSourceCode(value: unknown): value is ReminderListSourceCode {
    return typeof value === 'string'
        && (REMINDER_LIST_SOURCE_CODES as readonly string[]).includes(value);
}
