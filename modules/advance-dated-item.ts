// Roll a dated item to its next month. A 31st stays the 31st.

import {
    quarterlyStepCodeOf,
    quarterlyStepDaysOf,
} from '../scheduler/inputshape.ts';
import { repeatUnitCodeOf } from '../scheduler/translators/translate.ts';
import type { ReminderItem } from './reminder-types.ts';

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// A 31st stays the 31st. A shorter month still uses the last day that
// exists for that month only.
export function advanceDatedItem(item: ReminderItem, nowMs: number = Date.now()): ReminderItem {
    const hour = typeof item.hour === 'number' ? item.hour : 12;
    const minute = typeof item.minute === 'number' ? item.minute : 0;
    const anchorDay = typeof item.day === 'number' ? item.day : 1;
    let year = typeof item.year === 'number' ? item.year : new Date(nowMs).getFullYear();
    let month = typeof item.month === 'number' ? item.month : 0;
    const civilClock = (y: number, m: number, day: number) =>
        new Date(y, m, Math.min(day, daysInMonth(y, m)), hour, minute, 0, 0);
    let d = civilClock(year, month, anchorDay);
    const now = new Date(nowMs);
    const dayStep = quarterlyStepDaysOf(quarterlyStepCodeOf(item.intervalDays)) ?? 0;
    do {
        if (dayStep > 0) {
            d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayStep, hour, minute, 0, 0);
            year = d.getFullYear();
            month = d.getMonth();
        } else {
            const step =
                repeatUnitCodeOf(item.kind) === 'year' ? 12
                : item.kind === 'monthly' ? 1
                : (item.intervalMonths ?? 3);
            const tmi = month + step;
            year = year + Math.floor(tmi / 12);
            month = ((tmi % 12) + 12) % 12;
            d = civilClock(year, month, anchorDay);
        }
    } while (d <= now);
    const { snoozedUntil, ...rest } = item;
    void snoozedUntil;
    if (dayStep > 0) {
        return { ...rest, year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
    }
    return { ...rest, year: d.getFullYear(), month: d.getMonth(), day: anchorDay };
}
