// Tests for which items were due on the days that rolled over, and so which
// misses the day-roll should write.

import type { ReminderItem } from '../../modules/reminder-types.ts';
import { missesForRollover } from '../health.ts';
import {
    clearStartingOccurrenceTicks,
    missablesDueOnDays,
    unprocessedDays,
} from '../miss-candidates.ts';
import { shownOnDate } from '../shown-on-date.ts';
import { assert, assertSame, test } from './runner.ts';

const WEDNESDAY = new Date(2026, 8, 2, 9, 0, 0, 0);
const THURSDAY = new Date(2026, 8, 3, 9, 0, 0, 0);
const YESTERDAY = WEDNESDAY.toLocaleDateString();

function item(changes: Partial<ReminderItem> & Pick<ReminderItem, 'kind'>): ReminderItem {
    return {
        id: '1',
        label: 'Sit',
        hour: 8,
        minute: 0,
        ...changes,
    };
}

function missesOn(items: ReminderItem[], days: Date[], hadGap: boolean) {
    return missesForRollover(missablesDueOnDays(items, days), 'reminder_items', YESTERDAY, hadGap);
}

export function runMissCandidateTests(): void {
    test('A Daily item is due every day', () => {
        assert(shownOnDate(item({ kind: 'daily' }), WEDNESDAY), 'expected Daily on Wednesday');
        assert(shownOnDate(item({ kind: 'daily' }), THURSDAY), 'expected Daily on Thursday');
    });

    test('A Weekly item is due on its weekday and not the day beside it', () => {
        const weekly = item({ kind: 'weekly', day: WEDNESDAY.getDay() });
        assert(shownOnDate(weekly, WEDNESDAY), 'expected Weekly on Wednesday');
        assert(!shownOnDate(weekly, THURSDAY), 'expected Weekly off on Thursday');
    });

    test('A Daily one-shot is due on its saved date and not the next day', () => {
        const oneTime = item({
            kind: 'oneTime',
            year: WEDNESDAY.getFullYear(),
            month: WEDNESDAY.getMonth(),
            day: WEDNESDAY.getDate(),
        });
        assert(shownOnDate(oneTime, WEDNESDAY), 'expected Daily one-shot on its date');
        assert(!shownOnDate(oneTime, THURSDAY), 'expected Daily one-shot off the next day');
    });

    test('An Appointments item is due on its saved date and not the next day', () => {
        const appointments = item({
            kind: 'appointments',
            year: WEDNESDAY.getFullYear(),
            month: WEDNESDAY.getMonth(),
            day: WEDNESDAY.getDate(),
        });
        assert(shownOnDate(appointments, WEDNESDAY), 'expected Appointments on its date');
        assert(!shownOnDate(appointments, THURSDAY), 'expected Appointments off the next day');
    });

    test('A first-Thursday Monthly item is due that Thursday and not the Wednesday before', () => {
        const monthly = item({
            kind: 'monthly',
            weekdayOrdinal: 1,
            ordinalWeekday: 4,
            hour: 8,
            minute: 0,
        });
        assert(shownOnDate(monthly, THURSDAY), 'expected first Thursday on 3 September 2026');
        assert(!shownOnDate(monthly, WEDNESDAY), 'expected first Thursday off on Wednesday');
    });

    test('A Bucket List item is due on no day', () => {
        assert(!shownOnDate(item({ kind: 'bucketlist' }), WEDNESDAY), 'expected Bucket List off');
    });

    test('The ordinary next morning is only yesterday', () => {
        const days = unprocessedDays(YESTERDAY, THURSDAY);
        assertSame(
            days.map((d) => d.toLocaleDateString()),
            [YESTERDAY],
            'expected yesterday alone',
        );
    });

    test('A stretch away includes the last reset day', () => {
        const monday = new Date(2026, 7, 31, 12, 0, 0, 0);
        const days = unprocessedDays(monday.toLocaleDateString(), THURSDAY);
        assertSame(
            days.map((d) => d.toLocaleDateString()),
            [
                new Date(2026, 8, 2, 12, 0, 0, 0).toLocaleDateString(),
                new Date(2026, 8, 1, 12, 0, 0, 0).toLocaleDateString(),
                monday.toLocaleDateString(),
            ],
            'expected Wednesday back through Monday',
        );
    });

    test('A Daily item left undone yesterday is still a miss', () => {
        const misses = missesOn([item({ kind: 'daily', label: 'Sit Daily' })], [WEDNESDAY], false);
        assertSame(misses.map((m) => m.label), ['Sit Daily'], 'expected the Daily miss');
    });

    test('A Weekly item for yesterday left undone is a miss', () => {
        const misses = missesOn(
            [item({ kind: 'weekly', day: WEDNESDAY.getDay(), label: 'Sit Weekly' })],
            [WEDNESDAY],
            false,
        );
        assertSame(misses.map((m) => m.label), ['Sit Weekly'], 'expected the Weekly miss');
    });

    test('A Weekly item for a different day is not a miss', () => {
        const misses = missesOn(
            [item({ kind: 'weekly', day: THURSDAY.getDay(), label: 'Sit Thursday' })],
            [WEDNESDAY],
            false,
        );
        assert(misses.length === 0, 'expected no miss for a Thursday weekly on Wednesday');
    });

    test('A Monthly item for yesterday left undone is a miss', () => {
        const misses = missesOn(
            [item({
                kind: 'monthly',
                year: WEDNESDAY.getFullYear(),
                month: WEDNESDAY.getMonth(),
                day: WEDNESDAY.getDate(),
                label: 'Sit Monthly',
            })],
            [WEDNESDAY],
            false,
        );
        assertSame(misses.map((m) => m.label), ['Sit Monthly'], 'expected the Monthly miss');
    });

    test('A Monthly item for yesterday that was done is not a miss', () => {
        const misses = missesOn(
            [item({
                kind: 'monthly',
                year: WEDNESDAY.getFullYear(),
                month: WEDNESDAY.getMonth(),
                day: WEDNESDAY.getDate(),
                completed: true,
                label: 'Sit Monthly',
            })],
            [WEDNESDAY],
            false,
        );
        assert(misses.length === 0, 'expected no miss after Done');
    });

    test('A Quarterly item for yesterday left undone is a miss', () => {
        const misses = missesOn(
            [item({
                kind: 'quarterly',
                year: WEDNESDAY.getFullYear(),
                month: WEDNESDAY.getMonth(),
                day: WEDNESDAY.getDate(),
                label: 'Sit Quarterly',
            })],
            [WEDNESDAY],
            false,
        );
        assertSame(misses.map((m) => m.label), ['Sit Quarterly'], 'expected the Quarterly miss');
    });

    test('A Yearly item for yesterday left undone is a miss', () => {
        const misses = missesOn(
            [item({
                kind: 'yearly',
                year: WEDNESDAY.getFullYear(),
                month: WEDNESDAY.getMonth(),
                day: WEDNESDAY.getDate(),
                label: 'Sit Yearly',
            })],
            [WEDNESDAY],
            false,
        );
        assertSame(misses.map((m) => m.label), ['Sit Yearly'], 'expected the Yearly miss');
    });

    test('An Appointments item for yesterday left undone is a miss', () => {
        const misses = missesOn(
            [item({
                kind: 'appointments',
                year: WEDNESDAY.getFullYear(),
                month: WEDNESDAY.getMonth(),
                day: WEDNESDAY.getDate(),
                label: 'Sit Appointments',
            })],
            [WEDNESDAY],
            false,
        );
        assertSame(misses.map((m) => m.label), ['Sit Appointments'], 'expected the Appointments miss');
    });

    test('A Bucket List item is never a miss', () => {
        const misses = missesOn([item({ kind: 'bucketlist', hour: 8, minute: 0 })], [WEDNESDAY], false);
        assert(misses.length === 0, 'expected Bucket List to stay out');
    });

    test('A first-Thursday item is not a miss on the Wednesday before', () => {
        const misses = missesOn(
            [item({
                kind: 'monthly',
                weekdayOrdinal: 1,
                ordinalWeekday: 4,
                label: 'Sit first Thursday',
            })],
            [WEDNESDAY],
            false,
        );
        assert(misses.length === 0, 'expected no miss the day before it falls');
    });

    test('A Weekly miss from a stretch away is still one line, dated yesterday', () => {
        const monday = new Date(2026, 7, 31, 12, 0, 0, 0);
        const days = unprocessedDays(monday.toLocaleDateString(), THURSDAY);
        const misses = missesOn(
            [item({ kind: 'weekly', day: monday.getDay(), label: 'Sit Monday' })],
            days,
            true,
        );
        assertSame(
            misses.map((m) => [m.label, m.forDay]),
            [['Sit Monday', YESTERDAY]],
            'expected one miss dated yesterday',
        );
    });

    test('A Monthly tick comes off when that kind of day comes round again', () => {
        const monthly = item({
            kind: 'monthly',
            year: THURSDAY.getFullYear(),
            month: THURSDAY.getMonth(),
            day: THURSDAY.getDate(),
            completed: true,
        });
        const after = clearStartingOccurrenceTicks([monthly], THURSDAY);
        assert(after[0].completed === false, 'expected the old tick off at the new occurrence');
    });

    test('A Monthly tick stays the day after it was made', () => {
        const monthly = item({
            kind: 'monthly',
            year: WEDNESDAY.getFullYear(),
            month: WEDNESDAY.getMonth(),
            day: WEDNESDAY.getDate(),
            completed: true,
        });
        const after = clearStartingOccurrenceTicks([monthly], THURSDAY);
        assert(after[0].completed === true, 'expected the tick still there overnight');
    });
}
