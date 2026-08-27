// Tests for the To-Do rules in the one translator.
//
// The translator's whole job is to say what a To-Do task IS, so these tests
// ask only that: the right facts came across, in the right fields, unchanged.
// Nothing here asks what the engine then does about them.

import { translateToDo } from '../translators/translate.ts';
import type { Task, TaskReminder } from '../readers/todo.ts';
import { isStillWanted } from '../stillwanted.ts';
import { assert, assertSame, test } from './runner.ts';

// A fixed moment to test against: Monday the first of June 2026, at nine in
// the morning. Every test says what time it is, so none of them depends on the
// day it happens to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

/** A moment on the same clock as NOW, written out in full. */
function at(year: number, month: number, day: number, hour: number, minute: number): number {
    return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

function reminder(changes: Partial<TaskReminder> = {}): TaskReminder {
    return { id: 'r1', amount: 30, unit: 'minutes', kind: 'offset', ...changes };
}

/**
 * A plain saved To-Do appointment, dated well ahead of NOW, with one offset
 * reminder and nothing done to it. Each test changes only the fields it is
 * about. The month counts from zero, as the phone counts months, so 5 is June.
 */
function saved(changes: Partial<Task> = {}): Task {
    return {
        id: 't1',
        title: 'Dentist',
        taskType: 'scheduled',
        year: 2026,
        month: 5,
        day: 10,
        hour: 14,
        minute: 0,
        reminders: [reminder()],
        completed: false,
        ...changes,
    };
}

/** Translate one saved task and hand back the one shaped item it becomes. */
function shapeOf(task: Task, now: number = NOW) {
    return translateToDo([task], now)[0];
}

export function runTranslatorToDoTests(): void {
    // ---- what the item is ----

    test('A saved task keeps its screen, its id and its name', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.sourceScreenCode, shaped.itemIdText, shaped.itemNameText],
            ['todo', 't1', 'Dentist'],
            'the name is saved as title, and it comes straight across',
        );
    });

    test('Every saved task becomes one shaped item, in order', () => {
        const shapedList = translateToDo(
            [saved({ id: 't1' }), saved({ id: 't2' }), saved({ id: 't3' })],
            NOW,
        );
        assertSame(
            shapedList.map((one) => one.itemIdText),
            ['t1', 't2', 't3'],
            'the translator drops nothing, because dropping is a judgment made further along',
        );
    });

    // ---- when it comes due ----

    test('A task is a date item whose moment is its own date and time', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.triggerKindCode, shaped.hasDueTimeBit, shaped.dueMoment],
            ['date', true, at(2026, 5, 10, 14, 0)],
            'a To-Do appointment comes due at one moment, worked out from what was saved',
        );
    });

    test('A date task carries its moment alone, with no hour or minute beside it', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.dueHour, shaped.dueMinute, shaped.dueWeekday],
            [undefined, undefined, undefined],
            'each trigger kind sets exactly the fields its own kind needs',
        );
    });

    test('A missing hour counts as noon', () => {
        const noHour = { ...saved(), hour: null } as unknown as Task;
        assertSame(
            shapeOf(noHour).dueMoment,
            at(2026, 5, 10, 12, 0),
            'the old reader treats a missing hour as noon, and this keeps that',
        );
    });

    test('A task with no year has no due time and no moment', () => {
        const noYear = { ...saved(), year: null } as unknown as Task;
        const shaped = shapeOf(noYear);
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [false, undefined],
            'without a year there is no date, the same guard the old reader makes',
        );
    });

    test('A background task has no due time, even when a date is sitting on it', () => {
        const shaped = shapeOf(saved({ taskType: 'background' }));
        assertSame(
            [shaped.hasDueTimeBit, shaped.dueMoment],
            [false, undefined],
            'a background task has no appointment, so a leftover date is not a due time',
        );
    });

    // ---- capability bits ----

    test('A task can be finished, and finishing it ends it', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.canBeDoneBit, shaped.doneEndsItemBit],
            [true, true],
            'a task finished on the page is finished, not done for today only',
        );
    });

    test('A task cannot be pushed back', () => {
        assert(!shapeOf(saved()).canBePushedBackBit,
            'an appointment cannot be snoozed or delayed');
    });

    test('A To-Do reminder stands for one task, never a group', () => {
        assert(!shapeOf(saved()).standsForGroupBit,
            'there is no eight o\'clock group banner in this table');
        assert(!shapeOf(saved({ taskType: 'background' })).standsForGroupBit,
            'a background task is one item with no time, not a group signal');
    });

    // ---- state ----

    test('An unfinished task is not done and carries no push-back', () => {
        const shaped = shapeOf(saved());
        assertSame(
            [shaped.isDoneBit, shaped.pushedBackToStamp],
            [false, undefined],
            'nothing has happened to it yet',
        );
    });

    test('A finished task is done', () => {
        assert(shapeOf(saved({ completed: true })).isDoneBit,
            'completed on the page is the done state');
    });

    test('A finished task still comes through', () => {
        const shaped = shapeOf(saved({ completed: true }));
        assertSame(shaped.itemIdText, 't1',
            'the translator drops nothing; stillwanted.ts answers whether it is wanted');
    });

    // ---- how far ahead to speak ----

    test('An offset reminder becomes an offset lead time', () => {
        assertSame(
            shapeOf(saved()).leadTimeList,
            [{ leadFormCode: 'offset', leadAmount: 30, leadUnitCode: 'minutes', leadPartText: 'r1' }],
            'thirty minutes before is one lead time, not a special kind of reminder',
        );
    });

    test('An older reminder with no kind counts as an offset', () => {
        assertSame(
            shapeOf(saved({ reminders: [reminder({ kind: undefined, amount: 2, unit: 'hours' })] })).leadTimeList,
            [{ leadFormCode: 'offset', leadAmount: 2, leadUnitCode: 'hours', leadPartText: 'r1' }],
            'the old reader counts a missing kind as offset, and this keeps that',
        );
    });

    test('A clock reminder becomes a clock lead time', () => {
        assertSame(
            shapeOf(saved({
                reminders: [reminder({ kind: 'clock', daysBefore: 2, timeOfDay: 'evening' })],
            })).leadTimeList,
            [{ leadFormCode: 'clock', leadDaysBefore: 2, leadNamedTimeCode: 'evening', leadPartText: 'r1' }],
            'two days before at evening is the other form, not a second table',
        );
    });

    test('A task with no reminders has an empty lead-time list', () => {
        assertSame(
            shapeOf(saved({ reminders: [] })).leadTimeList,
            [],
            'an empty list means nothing to say, not even at the appointment',
        );
    });

    test('Two reminders become two lead times, in the order they were saved', () => {
        assertSame(
            shapeOf(saved({
                reminders: [
                    reminder({ id: 'r1', amount: 30, unit: 'minutes' }),
                    reminder({ id: 'r2', amount: 1, unit: 'days' }),
                ],
            })).leadTimeList,
            [
                { leadFormCode: 'offset', leadAmount: 30, leadUnitCode: 'minutes', leadPartText: 'r1' },
                { leadFormCode: 'offset', leadAmount: 1, leadUnitCode: 'days', leadPartText: 'r2' },
            ],
            'the order of the saved list is kept',
        );
    });

    // ---- the banner's words ----

    test('The banner words come out exactly as the existing reader writes them', () => {
        const shaped = shapeOf(saved({ title: 'Dentist' }));
        assertSame(
            [shaped.bannerTitleText, shaped.bannerBodyText, shaped.bannerButtonsCode],
            ['📋 Reminder: Dentist', 'Due: 06/10/26 at 14:00', 'todook'],
            'the swap over must change nothing a person sees',
        );
    });

    // ---- the wanted-block, against the bits this screen sets ----

    test('The wanted-block wants an unfinished appointment', () => {
        const said = isStillWanted(shapeOf(saved()), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment],
            [true, false, null],
            'an ordinary dated task is simply wanted',
        );
    });

    test('The wanted-block does not want a finished task', () => {
        const said = isStillWanted(shapeOf(saved({ completed: true })), NOW);
        assert(!said.wantsRemindersBit, 'done ends the item, so nothing further is produced');
    });

    test('The wanted-block does not want a background task', () => {
        const said = isStillWanted(shapeOf(saved({ taskType: 'background' })), NOW);
        assert(!said.wantsRemindersBit, 'no due time means nothing to arm, with no extra rule');
    });
}
