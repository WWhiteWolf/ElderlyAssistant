// The names a person sees on each page.
//
// Routes and saved kinds are the same word: `appointments` and `bucketlist`.
// These labels are the words a person sees. Live screens read from here so a
// visible rename is one change. Started at #54-new; wired through headers,
// Home, + Add, and Daily's from-line at #56-new. The notification road reads
// the same labels. Saved kinds and routes took those words at #65-new.

import type { ReminderKind } from '../modules/reminder-types';

export const PAGE_LABELS = {
    home: 'A Place To Remember',
    daily: 'Daily',
    where: 'Where?',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    appointments: 'Appointments',
    bucketlist: 'Bucket List',
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
