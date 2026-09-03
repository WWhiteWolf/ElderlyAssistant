// The names a person sees on each page.
//
// Routes and saved kinds are separate from these visible labels.
// Live screens read from here so a visible rename is one change. Started at
// #54-new; wired through headers, Home, + Add, and Daily's from-line at
// #56-new. The notification road reads the same labels.
//
// The saved kinds `oneTime` and `extended` appear as Appointments and Bucket
// List.

import type { ReminderKind } from '../modules/reminder-types';

export const PAGE_LABELS = {
    home: 'A Place To Remember',
    daily: 'Daily',
    where: 'Where?',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    oneTime: 'Appointments',
    extended: 'Bucket List',
    options: 'Options',
    calendar: 'Calendar',
    shopping: 'Shopping List',
    vault: 'Vault',
    timer: 'Timer Alerts',
    memorytest: 'Memory Test',
    settings: 'Settings',
    reminders: 'Scheduled Reminders',
    backup: 'Backup & Restore',
} as const;

/** The page title for a saved reminder kind. */
export function pageLabelFor(kind: ReminderKind): string {
    return PAGE_LABELS[kind];
}
