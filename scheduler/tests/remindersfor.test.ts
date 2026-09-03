// Tests for the join that turns shaped items into wanted reminders.
//
// Fixtures from the one saved reminder list go through the live translator and
// then the join. They ask what the phone would be told to hold.

import { translateReminderItems } from '../translators/translate.ts';
import { remindersFor } from '../remindersfor.ts';
import { isStillWanted } from '../stillwanted.ts';
import type { ClockTimes } from '../leadmoments.ts';
import type { ShapedItem } from '../inputshape.ts';
import type { LeadReminder, ReminderItem } from '../../modules/reminder-types.ts';
import { assert, assertSame, test } from './runner.ts';

const NOW = new Date(2026, 7, 25, 6, 0, 0, 0).getTime();
const MINUTE = 60 * 1000;

/** Times of day the join must be handed. Daily does not read them. */
const CLOCK: ClockTimes = {
    morning: { hour: 7, minute: 15 },
    midday: { hour: 13, minute: 45 },
    evening: { hour: 19, minute: 30 },
};

function reminderItem(
    changes: Partial<ReminderItem> & Pick<ReminderItem, 'kind'>,
): ReminderItem {
    return {
        id: 'a1',
        label: 'Breakfast',
        ...changes,
    };
}

function daily(changes: Partial<ReminderItem> = {}): ReminderItem {
    return reminderItem({
        kind: 'daily',
        id: 'a1',
        label: 'Breakfast',
        hour: 8,
        minute: 0,
        completed: false,
        ...changes,
    });
}

function wantedOf(saved: ReminderItem | ReminderItem[], now: number = NOW) {
    const list = Array.isArray(saved) ? saved : [saved];
    return remindersFor(translateReminderItems(list, now), now, CLOCK);
}

function dailyOccurrences(saved: ReminderItem, now: number = NOW) {
    return wantedOf(saved, now)
        .filter((r) => r.source === 'myday')
        .sort((a, b) => (a.trigger as { at: number }).at - (b.trigger as { at: number }).at);
}

function readable(at: number): string {
    const when = new Date(at);
    return `${when.getFullYear()}-${when.getMonth() + 1}-${when.getDate()} ${when.getHours()}:${String(when.getMinutes()).padStart(2, '0')}`;
}

export function runRemindersForTests(): void {
    test('A Daily item with a time is armed for one occurrence', () => {
        const armed = dailyOccurrences(daily({ hour: 8, minute: 30 }));
        assertSame(armed.length, 1, 'depth is one; opening the app arms the next');
        assertSame(
            readable((armed[0].trigger as { at: number }).at),
            '2026-8-25 8:30',
            'today, at the item\'s own time',
        );
    });

    test('Every occurrence is a single moment, never a repeat', () => {
        assert(
            dailyOccurrences(daily()).every((r) => r.trigger.kind === 'date'),
            'a repeating alarm cannot be told to skip a day',
        );
    });

    test('An item with no time set gets no reminder at all', () => {
        assert(wantedOf(daily({ hour: undefined, minute: undefined })).length === 0, 'expected none');
    });

    test('A time already gone by today starts at tomorrow', () => {
        const nineAm = new Date(2026, 7, 25, 9, 0, 0, 0).getTime();
        const armed = dailyOccurrences(daily({ hour: 8, minute: 0 }), nineAm);
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-26 8:00'],
            'a moment already past cannot be armed',
        );
    });

    test('An empty list gives nothing', () => {
        assert(wantedOf([]).length === 0, 'expected no reminders');
    });

    test('An item ticked off gets no reminder for today', () => {
        const armed = dailyOccurrences(daily({ completed: true }));
        assert(
            armed.every((r) => readable((r.trigger as { at: number }).at) !== '2026-8-25 8:00'),
            'an item already done must not call out again today',
        );
    });

    test('An item ticked off arms tomorrow, and only tomorrow', () => {
        const armed = dailyOccurrences(daily({ completed: true }));
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-26 8:00'],
            'Done covers today; tomorrow still owes a notice',
        );
    });

    test('An occurrence is named for the day it falls on', () => {
        assertSame(
            dailyOccurrences(daily({ hour: 8, minute: 0 })).map((r) => r.key),
            ['myday:a1:20260825'],
            'the name stays the same from one run to the next',
        );
    });

    test('The Daily banner keeps the existing words and source', () => {
        const armed = dailyOccurrences(daily({ label: 'Breakfast' }));
        assertSame(
            {
                title: armed[0].title,
                body: armed[0].body,
                categoryIdentifier: armed[0].categoryIdentifier,
                source: armed[0].source,
            },
            {
                title: 'Daily Routine',
                body: 'Time for Breakfast!',
                categoryIdentifier: 'routineactions',
                source: 'myday',
            },
            'the one-list path must preserve the live banner',
        );
    });

    test('A snoozed item gets a reminder at the moment it was snoozed to', () => {
        const at = NOW + 30 * MINUTE;
        const snooze = wantedOf(daily({ snoozedUntil: at })).find((r) => r.source === 'mydaysnooze');
        assert(snooze != null, 'expected a snooze reminder');
        assertSame(snooze!.trigger, { kind: 'date', at }, 'the snooze must fire at its own moment');
    });

    test('A snooze leaves the base occurrence standing', () => {
        const withSnooze = dailyOccurrences(daily({ snoozedUntil: NOW + 15 * MINUTE }));
        const without = dailyOccurrences(daily());
        assertSame(
            withSnooze.map((r) => r.key),
            without.map((r) => r.key),
            'a snooze adds a reminder; it does not take the base away',
        );
    });

    test('A snooze whose moment has gone is wanted no more', () => {
        const wanted = wantedOf(daily({ snoozedUntil: NOW - MINUTE }));
        assert(
            wanted.every((r) => r.source !== 'mydaysnooze'),
            'a snooze already past cannot be acted on and must not be armed',
        );
    });

    test('A snoozed item with no time of day still gets its snooze', () => {
        const at = NOW + 20 * MINUTE;
        const wanted = wantedOf(daily({
            hour: undefined,
            minute: undefined,
            snoozedUntil: at,
        }));
        assertSame(wanted.length, 1, 'expected the snooze and nothing else');
        assertSame(wanted[0].source, 'mydaysnooze', 'expected the snooze');
        assertSame(wanted[0].key, 'mydaysnooze:a1:base', 'one name, so snoozing twice moves it');
    });

    test('The snooze banner says what the item says', () => {
        const snooze = wantedOf(daily({ label: 'Pills', snoozedUntil: NOW + MINUTE }))
            .find((r) => r.source === 'mydaysnooze')!;
        assertSame(
            {
                key: snooze.key,
                title: snooze.title,
                body: snooze.body,
                categoryIdentifier: snooze.categoryIdentifier,
            },
            {
                key: 'mydaysnooze:a1:base',
                title: 'Daily Routine',
                body: 'Time for Pills!',
                categoryIdentifier: 'routineactions',
            },
            'a snoozed reminder must read exactly like the one it stands in for',
        );
    });

    // ---- Weekly, and the tick can skip this week ----

    function weekly(changes: Partial<ReminderItem> = {}): ReminderItem {
        return reminderItem({
            kind: 'weekly',
            id: 'c1',
            label: 'Take the bins out',
            day: 2,
            hour: 18,
            minute: 0,
            completed: false,
            ...changes,
        });
    }

    function weekWanted(saved: ReminderItem, now: number = NOW) {
        return wantedOf(saved, now);
    }

    test('A Weekly item is armed as one moment on its next day', () => {
        // NOW is Tuesday the 25th, at six in the morning. The item is Tuesday
        // at six in the evening, which has not come yet.
        const base = weekWanted(weekly()).find((r) => r.source === 'myweek')!;
        assertSame(base.trigger.kind, 'date', 'a repeating alarm cannot skip a ticked week');
        assertSame(
            readable((base.trigger as { at: number }).at),
            '2026-8-25 18:00',
            'today, at the item\'s own time',
        );
        assertSame(base.key, 'myweek:c1:20260825', 'named for the day it falls on');
    });

    test('A Weekly item whose day has gone by comes back next week', () => {
        const ninePm = new Date(2026, 7, 25, 21, 0, 0, 0).getTime();
        const base = weekWanted(weekly({ day: 2, hour: 18, minute: 0 }), ninePm)
            .find((r) => r.source === 'myweek')!;
        assertSame(
            readable((base.trigger as { at: number }).at),
            '2026-9-1 18:00',
            'the next Tuesday, not tomorrow',
        );
    });

    test('A completed Weekly item is not armed for this week', () => {
        const wanted = weekWanted(weekly({ completed: true }));
        assert(
            wanted.every((r) => r.source !== 'myweek'),
            'a tick must skip this week — that is the fault the repeat could not cure',
        );
    });

    test('A completed Weekly item later in the week is not armed either', () => {
        // Thursday is 4. Same-day filtering would have left Thursday standing.
        const wanted = weekWanted(weekly({ day: 4, completed: true }));
        assert(
            wanted.every((r) => r.source !== 'myweek'),
            'this occurrence is this week, not merely today',
        );
    });

    test('A Weekly banner keeps the existing words and source', () => {
        const base = weekWanted(weekly()).find((r) => r.source === 'myweek')!;
        assertSame(
            [base.title, base.body, base.categoryIdentifier],
            ['Weekly Chore', 'Time for Take the bins out!', 'routineactions'],
            'the one-list path must preserve the live banner',
        );
    });

    test('A postponed Weekly item keeps its home moment and adds the postpone', () => {
        const at = NOW + 60 * MINUTE;
        const wanted = weekWanted(weekly({ snoozedUntil: at }));
        assert(wanted.some((r) => r.source === 'myweek'), 'a postpone must not take the home reminder away');
        const moved = wanted.find((r) => r.source === 'myweekpostpone')!;
        assertSame(moved.key, 'myweekpostpone:c1:base', 'one name, so postponing twice moves it');
        assertSame(moved.trigger, { kind: 'date', at }, 'the postpone fires at its own moment');
    });

    // ---- Monthly, Quarterly and Yearly dated cadences ----

    type DatedKind = 'monthly' | 'quarterly' | 'yearly';

    function dated(kind: DatedKind, changes: Partial<ReminderItem> = {}): ReminderItem {
        return reminderItem({
            kind,
            id: 'd1',
            label: 'Renew the passport',
            year: 2026,
            month: 7,
            day: 14,
            hour: 10,
            minute: 45,
            ...changes,
        });
    }

    function datedWanted(
        kind: DatedKind,
        changes: Partial<ReminderItem> = {},
        now: number = NOW,
    ) {
        return wantedOf(dated(kind, changes), now);
    }

    test('A Monthly item arms the next monthly occurrence', () => {
        const base = datedWanted('monthly').find((r) => r.source === 'lookahead')!;
        assertSame(base.key, 'lookahead:d1:20260914', 'the existing source and dated key stay in use');
        assertSame(
            [base.trigger, base.title, base.body, base.categoryIdentifier],
            [
                { kind: 'date', at: new Date(2026, 8, 14, 10, 45, 0, 0).getTime() },
                'Monthly',
                'Time for Renew the passport!',
                'lookaheadactions',
            ],
            'the one-list path reaches the next month with its live banner',
        );
    });

    test('A Quarterly item arms the next three-month occurrence', () => {
        const base = datedWanted('quarterly').find((r) => r.source === 'lookahead')!;
        assertSame(
            [base.key, base.trigger, base.title],
            [
                'lookahead:d1:20261114',
                { kind: 'date', at: new Date(2026, 10, 14, 10, 45, 0, 0).getTime() },
                'Quarterly',
            ],
            'the one-list path carries the three-month cadence into the join',
        );
    });

    test('A Yearly item arms the next yearly occurrence', () => {
        const base = datedWanted('yearly').find((r) => r.source === 'lookahead')!;
        assertSame(
            [base.key, base.trigger, base.title],
            [
                'lookahead:d1:20270814',
                { kind: 'date', at: new Date(2027, 7, 14, 10, 45, 0, 0).getTime() },
                'Yearly',
            ],
            'the one-list path carries the yearly cadence into the join',
        );
    });

    test('A delayed dated item keeps its cadence and adds the delay', () => {
        const at = NOW + 60 * MINUTE;
        const wanted = datedWanted('monthly', { snoozedUntil: at });
        assert(wanted.some((r) => r.source === 'lookahead'), 'the cadence remains armed');
        const delay = wanted.find((r) => r.source === 'lookaheaddelay')!;
        assertSame(delay.key, 'lookaheaddelay:d1:base', 'one name, so delaying twice moves it');
        assertSame(delay.trigger, { kind: 'date', at }, 'the delay fires at its own moment');
    });

    // ---- Appointments, with several leads on one due moment ----

    const APPOINTMENT_NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

    function appointmentReminder(changes: Partial<LeadReminder> = {}): LeadReminder {
        return { id: 'r1', amount: 30, unit: 'minutes', kind: 'offset', ...changes };
    }

    function appointment(changes: Partial<ReminderItem> = {}): ReminderItem {
        return reminderItem({
            kind: 'oneTime',
            id: 't1',
            label: 'Dentist',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
            reminders: [appointmentReminder()],
            completed: false,
            ...changes,
        });
    }

    function appointmentWanted(
        saved: ReminderItem | ReminderItem[],
        now: number = APPOINTMENT_NOW,
    ) {
        return wantedOf(saved, now);
    }

    test('An appointment reminder fires that far before the due moment', () => {
        const wanted = appointmentWanted(appointment());
        assertSame(wanted.length, 1, 'one reminder on the appointment, one wanted');
        assertSame(wanted[0].key, 'todo:t1:r1', 'the reminder\'s own id, so two leads never share a name');
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 5, 10, 13, 30, 0, 0).getTime() },
            'thirty minutes before two is half past one',
        );
    });

    test('Two reminders on one appointment both stand', () => {
        const wanted = appointmentWanted(appointment({
            reminders: [
                appointmentReminder({ id: 'r1', amount: 30, unit: 'minutes' }),
                appointmentReminder({ id: 'r2', amount: 1, unit: 'days' }),
            ],
        }));
        assertSame(wanted.map((r) => r.key), ['todo:t1:r1', 'todo:t1:r2'], 'depth does not trim lead times');
    });

    test('An appointment with no reminders set gets nothing', () => {
        assertSame(appointmentWanted(appointment({ reminders: [] })).length, 0,
            'an empty list means nothing to say, not even at the appointment');
    });

    test('A finished appointment gets nothing', () => {
        assertSame(appointmentWanted(appointment({ completed: true })).length, 0, 'done ends the item');
    });

    test('An appointment banner keeps the existing words and source', () => {
        const wanted = appointmentWanted(appointment({ label: 'Dentist' }));
        assertSame(
            [wanted[0].source, wanted[0].title, wanted[0].body, wanted[0].categoryIdentifier],
            ['todo', '📋 Reminder: Dentist', 'Due: 06/10/26 at 14:00', 'todook'],
            'the one-list path must preserve the live banner',
        );
    });

    // ---- the repeat group, constructed directly ----

    function shaped(changes: Partial<ShapedItem> = {}): ShapedItem {
        return {
            sourceScreenCode: 'myday',
            itemIdText: 'm1',
            itemNameText: 'The 31st',
            hasDueTimeBit: true,
            floatsWithPhoneBit: true,
            canBeDoneBit: true,
            canBePushedBackBit: true,
            doneEndsItemBit: false,
            standsForGroupBit: false,
            isDoneBit: false,
            leadTimeList: [{ leadFormCode: 'offset', leadAmount: 0, leadUnitCode: 'minutes' }],
            ...changes,
        };
    }

    test('The 31st of every month from 15 January arms 31 January, unshifted', () => {
        const wanted = remindersFor(
            [shaped({
                repeatUnitCode: 'month',
                dueHour: 12,
                dueMinute: 0,
                dueMoment: new Date(2026, 0, 31, 12, 0, 0, 0).getTime(),
            })],
            new Date(2026, 0, 15, 9, 0, 0, 0).getTime(),
            CLOCK,
        );
        assertSame(wanted.length, 1, 'one occurrence');
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 0, 31, 12, 0, 0, 0).getTime() },
            'January has a 31st',
        );
        assertSame(wanted[0].shiftedForMissingDayBit, undefined, 'that day exists, so the bit is left off');
        assert(wanted[0].categoryIdentifier !== 'shifteddayactions', 'an unshifted day does not get the extra tap');
    });

    test('The 31st of every month from 1 February arms 28 February, shifted', () => {
        const wanted = remindersFor(
            [shaped({
                repeatUnitCode: 'month',
                dueHour: 12,
                dueMinute: 0,
                dueMoment: new Date(2026, 0, 31, 12, 0, 0, 0).getTime(),
            })],
            new Date(2026, 1, 1, 9, 0, 0, 0).getTime(),
            CLOCK,
        );
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 1, 28, 12, 0, 0, 0).getTime() },
            'February 2026 has no 31st, so the last day that exists is used',
        );
        assertSame(wanted[0].shiftedForMissingDayBit, true, 'the rest of the engine must see that the day moved');
        assertSame(wanted[0].categoryIdentifier, 'shifteddayactions', 'the extra tap is Then or Next Day on that banner');
    });

    test('A weekly Tuesday chore, skipped this Tuesday, from Monday arms the following Tuesday', () => {
        const tuesday = new Date(2026, 5, 2, 18, 0, 0, 0).getTime();
        const monday = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();
        const wanted = remindersFor(
            [shaped({
                sourceScreenCode: 'myweek',
                itemIdText: 'c1',
                itemNameText: 'Take the bins out',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 2 }],
                dueHour: 18,
                dueMinute: 0,
                skippedCycleStamp: tuesday,
            })],
            monday,
            CLOCK,
        );
        const base = wanted.filter((r) => r.source === 'myweek');
        assertSame(base.length, 1, 'skip arms the next event; the item is not treated as done');
        assertSame(
            readable((base[0].trigger as { at: number }).at),
            '2026-6-9 18:00',
            'the following Tuesday, not this one',
        );
    });

    test('The same chore, from the Wednesday after the skipped Tuesday, uses the ordinary next', () => {
        const tuesday = new Date(2026, 5, 2, 18, 0, 0, 0).getTime();
        const wednesday = new Date(2026, 5, 3, 9, 0, 0, 0).getTime();
        const wanted = remindersFor(
            [shaped({
                sourceScreenCode: 'myweek',
                itemIdText: 'c1',
                itemNameText: 'Take the bins out',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 2 }],
                dueHour: 18,
                dueMinute: 0,
                skippedCycleStamp: tuesday,
            })],
            wednesday,
            CLOCK,
        );
        const base = wanted.filter((r) => r.source === 'myweek');
        assertSame(
            readable((base[0].trigger as { at: number }).at),
            '2026-6-9 18:00',
            'the stamp is spent, and the next Tuesday is the ordinary next',
        );
    });

    test('A one-off with a skip stamp still arms the one-off', () => {
        const now = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();
        const due = new Date(2026, 5, 10, 14, 0, 0, 0).getTime();
        const wanted = remindersFor(
            [shaped({
                sourceScreenCode: 'lookahead',
                itemIdText: 'l1',
                dueMoment: due,
                skippedCycleStamp: new Date(2026, 5, 1, 18, 0, 0, 0).getTime(),
            })],
            now,
            CLOCK,
        );
        assertSame(wanted.length, 1, 'skip does not apply to a one-off');
        assertSame(wanted[0].trigger, { kind: 'date', at: due }, 'the one-off still stands');
        assertSame(wanted[0].key, 'lookahead:l1:base', 'named as a one-off, not as a skipped cycle');
    });

    test('Done still wins over a skip stamp, so the next event is not armed', () => {
        const tuesday = new Date(2026, 5, 2, 18, 0, 0, 0).getTime();
        const monday = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();
        const wanted = remindersFor(
            [shaped({
                sourceScreenCode: 'myweek',
                itemIdText: 'c1',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 2 }],
                dueHour: 18,
                dueMinute: 0,
                isDoneBit: true,
                skippedCycleStamp: tuesday,
            })],
            monday,
            CLOCK,
        );
        assertSame(
            wanted.filter((r) => r.source === 'myweek').length,
            0,
            'done keeps the weekly path that arms nothing further',
        );
    });

    test('Changing Skip’s explanation cannot change what Skip does', () => {
        // remindersFor reads skippedThisCycleBit. The skip tests above still
        // arm the next Tuesday if becauseText is rewritten; this one holds the
        // same fact by asking the bit on a skip that already proved the date.
        const tuesday = new Date(2026, 5, 2, 18, 0, 0, 0).getTime();
        const monday = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();
        const wanted = remindersFor(
            [shaped({
                sourceScreenCode: 'myweek',
                itemIdText: 'c1',
                itemNameText: 'Take the bins out',
                repeatUnitCode: 'week',
                repeatWeekdayList: [{ weekdayNumber: 2 }],
                dueHour: 18,
                dueMinute: 0,
                skippedCycleStamp: tuesday,
            })],
            monday,
            CLOCK,
        );
        const said = isStillWanted(shaped({
            sourceScreenCode: 'myweek',
            itemIdText: 'c1',
            itemNameText: 'Take the bins out',
            repeatUnitCode: 'week',
            repeatWeekdayList: [{ weekdayNumber: 2 }],
            dueHour: 18,
            dueMinute: 0,
            skippedCycleStamp: tuesday,
        }), monday);
        assert(said.skippedThisCycleBit, 'the bit is what the join reads');
        assertSame(
            readable((wanted.filter((r) => r.source === 'myweek')[0].trigger as { at: number }).at),
            '2026-6-9 18:00',
            'the next event is armed from the bit, not from the sentence',
        );
    });
}
