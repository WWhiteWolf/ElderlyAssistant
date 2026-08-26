// Tests for the block that answers "is this still wanted?".

import { isStillWanted } from '../stillwanted.ts';
import type { ShapedItem } from '../inputshape.ts';
import { assert, assertSame, test } from './runner.ts';

// A fixed moment to test against: Monday the first of June 2026, at nine in
// the morning. Every test says what time it is, so none of them depends on the
// day it happens to be run.
const NOW = new Date(2026, 5, 1, 9, 0, 0, 0).getTime();

/** A moment on the same clock as NOW, written out in full. */
function at(year: number, month: number, day: number, hour: number, minute: number): number {
    return new Date(year, month, day, hour, minute, 0, 0).getTime();
}

/**
 * A plain daily chore that can be ticked off and pushed back, with nothing
 * having happened to it yet. Each test changes only the fields it is about.
 */
function item(changes: Partial<ShapedItem> = {}): ShapedItem {
    return {
        sourceScreenCode: 'myday',
        itemIdText: 'a1',
        itemNameText: 'Take the tablets',
        triggerKindCode: 'daily',
        hasDueTimeBit: true,
        dueHour: 18,
        dueMinute: 0,
        canBeDoneBit: true,
        canBePushedBackBit: true,
        doneEndsItemBit: false,
        standsForGroupBit: false,
        isDoneBit: false,
        leadTimeList: [],
        ...changes,
    };
}

export function runStillWantedTests(): void {
    // ---- the first question: is there a time at all ----

    test('An item with nothing done to it is wanted', () => {
        const said = isStillWanted(item(), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment],
            [true, false, null],
            'a plain item should simply be wanted',
        );
    });

    test('An item with no due time is not wanted', () => {
        const said = isStillWanted(item({ hasDueTimeBit: false }), NOW);
        assert(!said.wantsRemindersBit, 'an item without a time is not a reminder');
    });

    test('No due time is asked first, before done or push-back', () => {
        const said = isStillWanted(item({
            hasDueTimeBit: false,
            isDoneBit: true,
            pushedBackToStamp: at(2026, 5, 1, 22, 0),
        }), NOW);
        assertSame(said.becauseText, 'the item has no due time', 'the first question should answer it');
    });

    // ---- done, and how far the done reaches ----

    test('A chore ticked off drops this occurrence and keeps the ones after it', () => {
        const said = isStillWanted(item({ isDoneBit: true }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit],
            [true, true],
            'today is done, tomorrow is not',
        );
    });

    test('A task finished outright is not wanted at all', () => {
        const said = isStillWanted(item({ isDoneBit: true, doneEndsItemBit: true }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit],
            [false, false],
            'done ends the item, so there is no later occurrence to keep',
        );
    });

    test('An item that cannot be marked done is never treated as done', () => {
        // Look Ahead has no done field at all, so its done state is always
        // false and this is what keeps it out of the question.
        const said = isStillWanted(item({
            sourceScreenCode: 'lookahead',
            canBeDoneBit: false,
            isDoneBit: true,
        }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit],
            [true, false],
            'the capability bit gates the state',
        );
    });

    test('A done occurrence carries no push-back with it', () => {
        const said = isStillWanted(item({
            isDoneBit: true,
            pushedBackToStamp: at(2026, 5, 1, 22, 0),
        }), NOW);
        assertSame(said.pushedBackToMoment, null, 'Done clears the push-back on the pages too');
    });

    // ---- push-back ----

    test('A push-back still ahead adds its own moment', () => {
        const later = at(2026, 5, 1, 22, 0);
        const said = isStillWanted(item({ pushedBackToStamp: later }), NOW);
        assertSame(said.pushedBackToMoment, later, 'the pushed-back moment should come back');
    });

    test('A push-back does not take the base occurrence away', () => {
        const said = isStillWanted(item({ pushedBackToStamp: at(2026, 5, 1, 22, 0) }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit],
            [true, false],
            'a push-back adds a reminder rather than moving one',
        );
    });

    test('A push-back already in the past is ignored', () => {
        const said = isStillWanted(item({ pushedBackToStamp: at(2026, 5, 1, 7, 0) }), NOW);
        assertSame(said.pushedBackToMoment, null, 'a spent stamp calls for nothing');
    });

    test('A push-back at exactly now is ignored', () => {
        const said = isStillWanted(item({ pushedBackToStamp: NOW }), NOW);
        assertSame(said.pushedBackToMoment, null, 'the moment has arrived, so it is spent');
    });

    test('A push-back on an item that cannot be pushed back is ignored', () => {
        // A To-Do appointment: it cannot be snoozed, so a stamp on it means
        // nothing, and no exception anywhere is needed to say so.
        const said = isStillWanted(item({
            sourceScreenCode: 'todo',
            triggerKindCode: 'date',
            canBePushedBackBit: false,
            pushedBackToStamp: at(2026, 5, 1, 22, 0),
        }), NOW);
        assertSame(said.pushedBackToMoment, null, 'the capability bit gates the state');
    });

    // ---- the kinds answering as a rule rather than an exception ----

    test('A To-Do appointment with neither bit set is simply wanted', () => {
        const said = isStillWanted(item({
            sourceScreenCode: 'todo',
            triggerKindCode: 'date',
            dueMoment: at(2026, 5, 3, 14, 0),
            canBeDoneBit: false,
            canBePushedBackBit: false,
        }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment],
            [true, false, null],
            'nothing anywhere has to special-case appointments',
        );
    });

    test('A group reminder is answered no differently from any other', () => {
        // To-Do's eight o'clock background banner stands for all the tasks at
        // once. The bit is there to be read further along, not here.
        const said = isStillWanted(item({
            sourceScreenCode: 'todo',
            itemIdText: 'background',
            standsForGroupBit: true,
        }), NOW);
        assert(said.wantsRemindersBit, 'standing for a group changes nothing in this block');
    });
}
