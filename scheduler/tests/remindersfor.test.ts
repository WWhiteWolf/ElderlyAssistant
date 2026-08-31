// Tests for the join that turns shaped items into wanted reminders.
//
// My Day and Pets go through the translator and then the join. They ask what
// the phone would be told to hold. Depth is one. A second copy is not armed;
// opening the app arms the next.

import { translateMyDay, translatePets, translateMyWeek, translateLookAhead, translateToDo } from '../translators/translate.ts';
import { remindersFor } from '../remindersfor.ts';
import { isStillWanted } from '../stillwanted.ts';
import type { ClockTimes } from '../leadmoments.ts';
import type { ShapedItem } from '../inputshape.ts';
import type { MyDayItem } from '../readers/myday.ts';
import type { PetsItem } from '../readers/pets.ts';
import type { Chore } from '../readers/myweek.ts';
import type { LookAheadItem } from '../readers/lookahead.ts';
import type { Task, TaskReminder } from '../readers/todo.ts';
import { assert, assertSame, test } from './runner.ts';

const NOW = new Date(2026, 7, 25, 6, 0, 0, 0).getTime();
const MINUTE = 60 * 1000;

/** Times of day the join must be handed. My Day does not read them. */
const CLOCK: ClockTimes = {
    morning: { hour: 7, minute: 15 },
    midday: { hour: 13, minute: 45 },
    evening: { hour: 19, minute: 30 },
};

function item(changes: Partial<MyDayItem> = {}): MyDayItem {
    return {
        id: 'a1',
        label: 'Breakfast',
        hour: 8,
        minute: 0,
        completed: false,
        ...changes,
    };
}

function wantedOf(saved: MyDayItem | MyDayItem[], now: number = NOW) {
    const list = Array.isArray(saved) ? saved : [saved];
    return remindersFor(translateMyDay(list, now), now, CLOCK);
}

function occurrences(saved: MyDayItem, now: number = NOW) {
    return wantedOf(saved, now)
        .filter((r) => r.source === 'myday')
        .sort((a, b) => (a.trigger as { at: number }).at - (b.trigger as { at: number }).at);
}

function readable(at: number): string {
    const when = new Date(at);
    return `${when.getFullYear()}-${when.getMonth() + 1}-${when.getDate()} ${when.getHours()}:${String(when.getMinutes()).padStart(2, '0')}`;
}

export function runRemindersForTests(): void {
    test('An item with a time is armed for one occurrence', () => {
        const armed = occurrences(item({ hour: 8, minute: 30 }));
        assertSame(armed.length, 1, 'depth is one; opening the app arms the next');
        assertSame(
            readable((armed[0].trigger as { at: number }).at),
            '2026-8-25 8:30',
            'today, at the item\'s own time',
        );
    });

    test('Every occurrence is a single moment, never a repeat', () => {
        assert(
            occurrences(item()).every((r) => r.trigger.kind === 'date'),
            'a repeating alarm cannot be told to skip a day',
        );
    });

    test('An item with no time set gets no reminder at all', () => {
        assert(wantedOf(item({ hour: null, minute: null })).length === 0, 'expected none');
    });

    test('A time already gone by today starts at tomorrow', () => {
        const nineAm = new Date(2026, 7, 25, 9, 0, 0, 0).getTime();
        const armed = occurrences(item({ hour: 8, minute: 0 }), nineAm);
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
        const armed = occurrences(item({ completed: true }));
        assert(
            armed.every((r) => readable((r.trigger as { at: number }).at) !== '2026-8-25 8:00'),
            'an item already done must not call out again today',
        );
    });

    test('An item ticked off is not pre-armed for tomorrow', () => {
        // Depth is one. Tomorrow is armed when the app opens and the tick has
        // been cleared. That is recovery on opening, which is what the second
        // copy used to do.
        assertSame(occurrences(item({ completed: true })).length, 0,
            'nothing stands while today is done; opening tomorrow arms tomorrow');
    });

    test('An occurrence is named for the day it falls on', () => {
        assertSame(
            occurrences(item({ hour: 8, minute: 0 })).map((r) => r.key),
            ['myday:a1:20260825'],
            'the name stays the same from one run to the next',
        );
    });

    test('The banner words come out exactly as My Day writes them', () => {
        const armed = occurrences(item({ label: 'Breakfast' }));
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
            'the swap over must change nothing a person sees on the banner',
        );
    });

    test('A snoozed item gets a reminder at the moment it was snoozed to', () => {
        const at = NOW + 30 * MINUTE;
        const snooze = wantedOf(item({ snoozedUntil: at })).find((r) => r.source === 'mydaysnooze');
        assert(snooze != null, 'expected a snooze reminder');
        assertSame(snooze!.trigger, { kind: 'date', at }, 'the snooze must fire at its own moment');
    });

    test('A snooze leaves the base occurrence standing', () => {
        const withSnooze = occurrences(item({ snoozedUntil: NOW + 15 * MINUTE }));
        const without = occurrences(item());
        assertSame(
            withSnooze.map((r) => r.key),
            without.map((r) => r.key),
            'a snooze adds a reminder; it does not take the base away',
        );
    });

    test('A snooze whose moment has gone is wanted no more', () => {
        const wanted = wantedOf(item({ snoozedUntil: NOW - MINUTE }));
        assert(
            wanted.every((r) => r.source !== 'mydaysnooze'),
            'a snooze already past cannot be acted on and must not be armed',
        );
    });

    test('A snoozed item with no time of day still gets its snooze', () => {
        const at = NOW + 20 * MINUTE;
        const wanted = wantedOf(item({ hour: null, minute: null, snoozedUntil: at }));
        assertSame(wanted.length, 1, 'expected the snooze and nothing else');
        assertSame(wanted[0].source, 'mydaysnooze', 'expected the snooze');
        assertSame(wanted[0].key, 'mydaysnooze:a1:base', 'one name, so snoozing twice moves it');
    });

    test('The snooze banner says what the item says', () => {
        const snooze = wantedOf(item({ label: 'Pills', snoozedUntil: NOW + MINUTE }))
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

    // ---- Pets, the same machine ----

    function feed(changes: Partial<PetsItem> = {}): PetsItem {
        return {
            id: 'a1',
            label: 'Breakfast',
            hour: 8,
            minute: 0,
            completed: false,
            ...changes,
        };
    }

    function petsWanted(saved: PetsItem, now: number = NOW) {
        return remindersFor(translatePets([saved], now), now, CLOCK);
    }

    test('A Pets feed is armed for one occurrence, under a Pets name', () => {
        const armed = petsWanted(feed()).filter((r) => r.source === 'pets');
        assertSame(armed.length, 1, 'depth is one, the same as My Day');
        assertSame(armed[0].key, 'pets:a1:20260825', 'the screen is part of the name');
    });

    test('A Pets banner says Pets Routine', () => {
        const armed = petsWanted(feed({ label: 'Breakfast' })).find((r) => r.source === 'pets')!;
        assertSame(
            [armed.title, armed.body, armed.categoryIdentifier],
            ['Pets Routine', 'Time for Breakfast!', 'routineactions'],
            'the words must match what Pets Day sends today',
        );
    });

    test('A ticked Pets feed is not pre-armed for tomorrow', () => {
        assertSame(
            petsWanted(feed({ completed: true })).filter((r) => r.source === 'pets').length,
            0,
            'nothing stands while today is done',
        );
    });

    test('A snoozed Pets feed uses the Pets snooze name', () => {
        const snooze = petsWanted(feed({ snoozedUntil: NOW + MINUTE }))
            .find((r) => r.source === 'petssnooze')!;
        assertSame(snooze.key, 'petssnooze:a1:base', 'one name, so snoozing twice moves it');
        assertSame(snooze.title, 'Pets Routine', 'the snooze reads as a Pets banner');
    });

    // ---- My Week, the same machine, and the tick can skip this week ----

    function chore(changes: Partial<Chore> = {}): Chore {
        return {
            id: 'c1',
            label: 'Take the bins out',
            day: 2,
            hour: 18,
            minute: 0,
            completed: false,
            ...changes,
        };
    }

    function weekWanted(saved: Chore, now: number = NOW) {
        return remindersFor(translateMyWeek([saved], now), now, CLOCK);
    }

    test('A chore is armed as one moment on its next day, not as a weekly repeat', () => {
        // NOW is Tuesday the 25th, at six in the morning. The chore is Tuesday
        // at six in the evening, which has not come yet.
        const base = weekWanted(chore()).find((r) => r.source === 'myweek')!;
        assertSame(base.trigger.kind, 'date', 'a repeating alarm cannot skip a ticked week');
        assertSame(
            readable((base.trigger as { at: number }).at),
            '2026-8-25 18:00',
            'today, at the chore\'s own time',
        );
        assertSame(base.key, 'myweek:c1:20260825', 'named for the day it falls on');
    });

    test('A chore whose day has gone by this week comes back next week', () => {
        const ninePm = new Date(2026, 7, 25, 21, 0, 0, 0).getTime();
        const base = weekWanted(chore({ day: 2, hour: 18, minute: 0 }), ninePm)
            .find((r) => r.source === 'myweek')!;
        assertSame(
            readable((base.trigger as { at: number }).at),
            '2026-9-1 18:00',
            'the next Tuesday, not tomorrow',
        );
    });

    test('A ticked chore is not armed for this week', () => {
        const wanted = weekWanted(chore({ completed: true }));
        assert(
            wanted.every((r) => r.source !== 'myweek'),
            'a tick must skip this week — that is the fault the repeat could not cure',
        );
    });

    test('A ticked chore later in the week is not armed either', () => {
        // Thursday is 4. Same-day filtering would have left Thursday standing.
        const wanted = weekWanted(chore({ day: 4, completed: true }));
        assert(
            wanted.every((r) => r.source !== 'myweek'),
            'this occurrence is this week, not merely today',
        );
    });

    test('A My Week banner says Weekly Chore', () => {
        const base = weekWanted(chore()).find((r) => r.source === 'myweek')!;
        assertSame(
            [base.title, base.body, base.categoryIdentifier],
            ['Weekly Chore', 'Time for Take the bins out!', 'routineactions'],
            'the words must match what My Week sends today',
        );
    });

    test('A postponed chore keeps its home moment and adds the postpone', () => {
        const at = NOW + 60 * MINUTE;
        const wanted = weekWanted(chore({ postponedTo: at }));
        assert(wanted.some((r) => r.source === 'myweek'), 'a postpone must not take the home reminder away');
        const moved = wanted.find((r) => r.source === 'myweekpostpone')!;
        assertSame(moved.key, 'myweekpostpone:c1:base', 'one name, so postponing twice moves it');
        assertSame(moved.trigger, { kind: 'date', at }, 'the postpone fires at its own moment');
    });

    // ---- Look Ahead, one moment of its own ----

    function entry(changes: Partial<LookAheadItem> = {}): LookAheadItem {
        return {
            id: 'l1',
            label: 'Renew the passport',
            year: 2026,
            month: 8,
            day: 14,
            hour: 10,
            minute: 45,
            ...changes,
        };
    }

    function lookWanted(saved: LookAheadItem, now: number = NOW) {
        return remindersFor(translateLookAhead([saved], now), now, CLOCK);
    }

    test('A Look Ahead entry is armed at its own moment, under the name it already has', () => {
        const base = lookWanted(entry()).find((r) => r.source === 'lookahead')!;
        assertSame(base.key, 'lookahead:l1:base', 'the name the phone already holds, so the reconcile leaves it');
        assertSame(
            base.trigger,
            { kind: 'date', at: new Date(2026, 8, 14, 10, 45, 0, 0).getTime() },
            'one moment, the date that was saved',
        );
    });

    test('An entry whose moment has gone is not armed', () => {
        const wanted = lookWanted(entry({ year: 2026, month: 0, day: 5, hour: 9, minute: 0 }));
        assert(
            wanted.every((r) => r.source !== 'lookahead'),
            'a moment already past cannot be acted on',
        );
    });

    test('A delayed entry whose own moment has gone still gets the delay', () => {
        const at = NOW + 60 * MINUTE;
        const wanted = lookWanted(entry({
            year: 2026,
            month: 0,
            day: 5,
            hour: 9,
            minute: 0,
            delayedUntil: at,
        }));
        assert(wanted.every((r) => r.source !== 'lookahead'), 'the home moment is gone');
        const delay = wanted.find((r) => r.source === 'lookaheaddelay')!;
        assertSame(delay.key, 'lookaheaddelay:l1:base', 'one name, so delaying twice moves it');
        assertSame(delay.trigger, { kind: 'date', at }, 'the delay fires at its own moment');
    });

    test('A Look Ahead banner keeps its telescope', () => {
        const base = lookWanted(entry({ label: 'Book the boiler service' })).find((r) => r.source === 'lookahead')!;
        assertSame(
            [base.title, base.body, base.categoryIdentifier],
            ['🔭 Look Ahead', 'Time for Book the boiler service!', 'lookaheadactions'],
            'the heading carries its telescope, word for word as the old reader writes it',
        );
    });

    // ---- To-Do, several leads on one appointment, and no eight o'clock banner ----

    const TODO_NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

    function todoReminder(changes: Partial<TaskReminder> = {}): TaskReminder {
        return { id: 'r1', amount: 30, unit: 'minutes', kind: 'offset', ...changes };
    }

    function task(changes: Partial<Task> = {}): Task {
        return {
            id: 't1',
            title: 'Dentist',
            taskType: 'scheduled',
            year: 2026,
            month: 5,
            day: 10,
            hour: 14,
            minute: 0,
            reminders: [todoReminder()],
            completed: false,
            ...changes,
        };
    }

    function todoWanted(saved: Task | Task[], now: number = TODO_NOW) {
        const list = Array.isArray(saved) ? saved : [saved];
        return remindersFor(translateToDo(list, now), now, CLOCK);
    }

    test('A To-Do reminder fires that far before the appointment, under its own name', () => {
        const wanted = todoWanted(task());
        assertSame(wanted.length, 1, 'one reminder on the task, one wanted');
        assertSame(wanted[0].key, 'todo:t1:r1', 'the reminder\'s own id, so two leads never share a name');
        assertSame(
            wanted[0].trigger,
            { kind: 'date', at: new Date(2026, 5, 10, 13, 30, 0, 0).getTime() },
            'thirty minutes before two is half past one',
        );
    });

    test('Two reminders on one task both stand', () => {
        const wanted = todoWanted(task({
            reminders: [
                todoReminder({ id: 'r1', amount: 30, unit: 'minutes' }),
                todoReminder({ id: 'r2', amount: 1, unit: 'days' }),
            ],
        }));
        assertSame(wanted.map((r) => r.key), ['todo:t1:r1', 'todo:t1:r2'], 'depth does not trim lead times');
    });

    test('A task with no reminders set gets nothing', () => {
        assertSame(todoWanted(task({ reminders: [] })).length, 0,
            'an empty list means nothing to say, not even at the appointment');
    });

    test('A finished task gets nothing', () => {
        assertSame(todoWanted(task({ completed: true })).length, 0, 'done ends the item');
    });

    test('A background task gets no banner', () => {
        const wanted = todoWanted([
            task({ id: 'b1', taskType: 'background' }),
            task({ id: 'b2', taskType: 'background' }),
        ]);
        assertSame(wanted.length, 0, 'no time means nothing to arm, and there is no eight o\'clock group banner');
    });

    test('A To-Do banner says what the old reader said', () => {
        const wanted = todoWanted(task({ title: 'Dentist' }));
        assertSame(
            [wanted[0].title, wanted[0].body, wanted[0].categoryIdentifier],
            ['📋 Reminder: Dentist', 'Due: 06/10/26 at 14:00', 'todook'],
            'the swap over must change nothing a person sees on the banner',
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
