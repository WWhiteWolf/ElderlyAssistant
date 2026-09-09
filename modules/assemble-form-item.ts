// Save writes the item from the translator's table.
//
// The visible form still decides which rows to show. This function only
// decides which saved fields belong. It does not import React.

import {
    dateWriteCodeOf,
    exclusiveGroupBitsOf,
    hasQuarterlyStepOf,
    keepsLeadChipsOf,
    timeWriteCodeOf,
} from '../scheduler/translators/translate.ts';
import { quarterlyStepDaysOf } from '../scheduler/inputshape.ts';
import type { QuarterlyStepCode } from '../scheduler/inputshape.ts';
import {
    applyConnectedOptions,
    applyExclusiveGroupToItem,
    emptyOptionSettings,
    keepOptionsForKind,
    optionCasesForKind,
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

export type AssembleFormParts = {
    existing: ReminderItem | null;
    id: string;
    name: string;
    editKind: ReminderKind;
    pendingDay: number;
    pendingTime: Date | null;
    pendingDate: Date;
    dateSet: boolean;
    timeSet: boolean;
    reminders: LeadReminder[];
    intervalMonths: number;
    quarterlyStep: QuarterlyStepCode;
    optionSettings: OptionSettings;
    note: string;
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
            next.year = parts.pendingDate.getFullYear();
            next.month = parts.pendingDate.getMonth();
            next.day = parts.pendingDate.getDate();
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
        next.year = parts.pendingDate.getFullYear();
        next.month = parts.pendingDate.getMonth();
        next.day = parts.pendingDate.getDate();
    } else if (parts.dateSet) {
        next.year = parts.pendingDate.getFullYear();
        next.month = parts.pendingDate.getMonth();
        next.day = parts.pendingDate.getDate();
    } else {
        delete next.year;
        delete next.month;
        delete next.day;
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
        next.reminders = parts.reminders;
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

    if (optionCasesForKind(kind).length > 0) {
        next = keepOptionsForKind(
            applyConnectedOptions(next, parts.optionSettings),
            kind,
        );
        if (exclusiveGroupBitsOf(kind)) {
            next = applyExclusiveGroupToItem(next, parts.optionSettings);
        }
    } else {
        next = keepOptionsForKind(
            applyConnectedOptions(next, emptyOptionSettings()),
            kind,
        );
    }

    const trimmedNote = parts.note.trim();
    if (trimmedNote) next.notes = trimmedNote;
    else delete next.notes;
    return next;
}
