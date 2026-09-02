// The names a person sees on each page.
//
// File names, saved kinds, and banner sources stay as they are.
// Scheduled Reminders rows read from here for the live pages.
// Other screens still have their own copies. Written at #54-new.
//
// One Time is Appointments. Extended is Bucket List.
// Look Ahead is only a leftover banner until it cycles off.
// My Day, Pets, and To-Do are not live pages.

export const PAGE_LABELS = {
    home: 'A Place To Remember',
    daily: 'Daily',
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
