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
    | 'appointments'
    | 'bucketlist';

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
    // Skip: the due moment of the cycle that was skipped. The engine drops
    // that cycle and arms the next. Not Done.
    skippedCycleStamp?: number;
    // Options written from + OPT (#37-new). Time zone, holidays, a second
    // Thursday and a Wednesday after the 6th are read by the translator.
    // Extra tap is Then or Next Day on a shifted banner, not a field.
    // Float is not a row; last existing day is always the engine's rule.
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
