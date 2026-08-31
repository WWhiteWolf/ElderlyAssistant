// The one saved reminder list. Pages, banners and Siri write this shape.
// The scheduler reads it. Nothing here touches storage or the phone.

export interface LeadReminder {
    id: string;
    amount: number;
    unit: 'minutes' | 'hours' | 'days';
    kind?: 'offset' | 'clock';
    daysBefore?: number;
    timeOfDay?: 'morning' | 'midday' | 'evening';
}

export type ReminderKind =
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly'
    | 'oneTime'
    | 'extended';

// One row on the saved list `reminder_items`. A page is a filter on this
// list rather than a store of its own.
export interface ReminderItem {
    id: string;
    kind: ReminderKind;
    label: string;
    hour?: number;
    minute?: number;
    year?: number;
    month?: number;
    day?: number;
    intervalMonths?: number;
    reminders?: LeadReminder[];
    completed?: boolean;
    doneAt?: number;
    snoozedUntil?: number;
    // Options written from + OPT (#37-new). Time zone is read by the
    // translator. The other fields wait on open questions.
    holidayMove?: 'before' | 'after';
    floatsWithPhone?: boolean;
    dueTimeZoneText?: string;
    shadeCalendar?: boolean;
    notes?: string;
    floatDay?: boolean;
    shiftedChoice?: 'then' | 'next';
    weekdayOrdinal?: number;
    ordinalWeekday?: number;
    afterWeekday?: number;
    afterDayCount?: number;
}
