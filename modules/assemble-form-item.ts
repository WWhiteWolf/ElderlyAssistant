// Save writes the item from the translator's table.
//
// The visible form still decides which rows to show. This function only
// decides which saved fields belong. It does not import React.

import {
    allowedOptionCaseCodesOf,
    dateWriteCodeOf,
    exclusiveGroupBitsOf,
    hasQuarterlyStepOf,
    keepsLeadChipsOf,
    keepsBirthYearOf,
    timeWriteCodeOf,
} from '../scheduler/translators/translate.ts';
import { quarterlyStepDaysOf } from '../scheduler/inputshape.ts';
import type { QuarterlyStepCode } from '../scheduler/inputshape.ts';
import { nextBirthdayYear } from './birth-year.ts';
import {
    applyConnectedOptions,
    applyExclusiveGroupToItem,
    keepOptionsForCodes,
    weekdayPatternComplete,
    type OptionSettings,
} from './option-cases.ts';
import type { LeadReminder, ReminderItem, ReminderKind } from './reminder-types.ts';

function hourMinuteOf(saved: { hour?: number | null; minute?: number | null }): { hour?: number; minute?: number } {
    if (typeof saved.hour === 'number' && typeof saved.minute === 'number') {
        return { hour: saved.hour, minute: saved.minute };
    }
    return {};
}

function lastDayOfMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** The day of the month the series is for, not the last day of a short month on the picker. */
function seriesDayOf(pending: Date, existingDay: number | undefined): number {
    const last = lastDayOfMonth(pending.getFullYear(), pending.getMonth());
    const pendingDay = pending.getDate();
    if (typeof existingDay === 'number' && existingDay > last && pendingDay === last) {
        return existingDay;
    }
    return pendingDay;
}

function writePendingDate(next: ReminderItem, pending: Date, existingDay: number | undefined): void {
    next.year = pending.getFullYear();
    next.month = pending.getMonth();
    next.day = seriesDayOf(pending, existingDay);
}

export type AssembleFormParts = {
    existing: ReminderItem | null;
    id: string;
    name: string;
    editKind: ReminderKind;
    pendingDay: number;
    pendingTime: Date | null;
    pendingDate: Date;
    timeSet: boolean;
    reminders: LeadReminder[];
    intervalMonths: number;
    quarterlyStep: QuarterlyStepCode;
    optionSettings: OptionSettings;
    note: string;
    nowMs?: number;
};

export function assembleFormItem(parts: AssembleFormParts): ReminderItem {
    const kind = parts.editKind;
    const base: ReminderItem = parts.existing ?? {
        id: parts.id,
        kind,
        label: parts.name,
    };
    let next: ReminderItem = { ...base, id: parts.id, kind, label: parts.name };

    const dateCode = dateWriteCodeOf(kind);
    if (dateCode === 'none') {
        delete next.year;
        delete next.month;
        delete next.day;
    } else if (dateCode === 'weekday') {
        next.day = parts.pendingDay;
        delete next.year;
        delete next.month;
    } else if (dateCode === 'calendar') {
        if (!weekdayPatternComplete(parts.optionSettings)) {
            writePendingDate(next, parts.pendingDate, parts.existing?.day);
        } else {
            delete next.year;
            delete next.month;
            delete next.day;
        }
    } else if (dateCode === 'today') {
        const now = new Date();
        next.year = now.getFullYear();
        next.month = now.getMonth();
        next.day = now.getDate();
    } else if (dateCode === 'required') {
        writePendingDate(next, parts.pendingDate, parts.existing?.day);
    }

    const timeCode = timeWriteCodeOf(kind);
    if (timeCode === 'none') {
        delete next.hour;
        delete next.minute;
    } else if (timeCode === 'ifPendingTime') {
        if (parts.pendingTime) {
            next = {
                ...next,
                ...hourMinuteOf({
                    hour: parts.pendingTime.getHours(),
                    minute: parts.pendingTime.getMinutes(),
                }),
            };
        } else {
            delete next.hour;
            delete next.minute;
        }
    } else if (timeCode === 'alwaysPendingTime') {
        const t = parts.pendingTime ?? new Date(new Date().setHours(12, 0, 0, 0));
        next.hour = t.getHours();
        next.minute = t.getMinutes();
    } else if (timeCode === 'alwaysPendingDate') {
        next.hour = parts.pendingDate.getHours();
        next.minute = parts.pendingDate.getMinutes();
    } else if (parts.timeSet) {
        next = {
            ...next,
            ...hourMinuteOf({
                hour: parts.pendingDate.getHours(),
                minute: parts.pendingDate.getMinutes(),
            }),
        };
    } else {
        delete next.hour;
        delete next.minute;
    }

    if (keepsLeadChipsOf(kind)) {
        if (timeCode === 'ifTimeSet' && !parts.timeSet) {
            next.reminders = parts.reminders.filter((one) => one.kind === 'clock');
        } else {
            next.reminders = parts.reminders;
        }
    } else {
        delete next.reminders;
    }

    if (hasQuarterlyStepOf(kind)) {
        const days = quarterlyStepDaysOf(parts.quarterlyStep);
        if (days !== undefined) {
            next.intervalDays = days;
            delete next.intervalMonths;
        } else {
            next.intervalMonths = 3;
            delete next.intervalDays;
        }
    } else {
        delete next.intervalMonths;
        delete next.intervalDays;
    }

    if (keepsBirthYearOf(kind)) {
        next.birthYear = parts.pendingDate.getFullYear();
        if (typeof next.month === 'number' && typeof next.day === 'number') {
            next.year = nextBirthdayYear(
                next.month,
                next.day,
                next.hour ?? 12,
                next.minute ?? 0,
                parts.nowMs ?? Date.now(),
                !!parts.existing?.completed,
            );
        }
    } else {
        delete next.birthYear;
    }

    next = keepOptionsForCodes(
        applyConnectedOptions(next, parts.optionSettings),
        allowedOptionCaseCodesOf(kind),
    );
    if (exclusiveGroupBitsOf(kind)) {
        next = applyExclusiveGroupToItem(next, parts.optionSettings);
    }

    const trimmedNote = parts.note.trim();
    if (trimmedNote) next.notes = trimmedNote;
    else delete next.notes;
    return next;
}
