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
        sourceScreenCode: 'daily',
        itemIdText: 'a1',
        itemNameText: 'Take the tablets',
        repeatUnitCode: 'day',
        hasDueTimeBit: true,
        dueHour: 18,
        dueMinute: 0,
        floatsWithPhoneBit: true,
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
    // ---- the last question: is there a time at all ----
    //
    // It is asked only when done and the push-back have not already answered,
    // because it is the one answer that throws the whole item away.

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

    test('Done is asked first, before the push-back and before no due time', () => {
        // The one item that touches all three questions at once, so it is what
        // holds the order in place. No due time used to be asked first and
        // threw the whole item away, which lost a push-back that had already
        // been promised. It is asked last now, and done is asked first.
        const said = isStillWanted(item({
            hasDueTimeBit: false,
            isDoneBit: true,
            pushedBackToStamp: at(2026, 5, 1, 22, 0),
        }), NOW);
        assertSame(
            said.becauseText,
            'this occurrence is done, later ones stand',
            'the first question should answer it',
        );
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
        // A dated cadence has no done field at all, so its done state is always
        // false and this is what keeps it out of the question.
        const said = isStillWanted(item({
            sourceScreenCode: 'monthly',
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

    // ---- skip ----

    test('A skipped cycle drops this occurrence and keeps the next event', () => {
        const said = isStillWanted(item({
            skippedCycleStamp: at(2026, 5, 1, 18, 0),
        }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.pushedBackToMoment, said.skippedThisCycleBit, said.becauseText],
            [true, true, null, true, 'this cycle was skipped, the next event stands'],
            'skip is this cycle, then the next event is armed; it is not done',
        );
    });

    test('Skip is named by its bit, not by the explanation', () => {
        const skipped = isStillWanted(item({
            skippedCycleStamp: at(2026, 5, 1, 18, 0),
        }), NOW);
        const done = isStillWanted(item({ isDoneBit: true }), NOW);
        assert(skipped.skippedThisCycleBit, 'later blocks read this bit');
        assert(!done.skippedThisCycleBit, 'done also drops this occurrence, and is not skip');
        assert(
            done.dropsThisOccurrenceBit && skipped.dropsThisOccurrenceBit,
            'the drop bit is shared, so it cannot tell skip from done',
        );
    });

    test('Skip does not carry a push-back forward', () => {
        const said = isStillWanted(item({
            skippedCycleStamp: at(2026, 5, 1, 18, 0),
            pushedBackToStamp: at(2026, 5, 1, 22, 0),
        }), NOW);
        assertSame(said.pushedBackToMoment, null, 'like done, skip does not carry a push-back forward');
    });

    test('A skip stamp on a one-off is ignored', () => {
        const said = isStillWanted(item({
            repeatUnitCode: undefined,
            dueMoment: at(2026, 5, 3, 14, 0),
            skippedCycleStamp: at(2026, 5, 1, 18, 0),
        }), NOW);
        assertSame(
            [said.wantsRemindersBit, said.dropsThisOccurrenceBit, said.becauseText],
            [true, false, 'wanted'],
            'a one-off has no next event, so skip does not apply',
        );
    });

    test('Done still wins over a skip stamp on the same item', () => {
        const said = isStillWanted(item({
            isDoneBit: true,
            skippedCycleStamp: at(2026, 5, 1, 18, 0),
        }), NOW);
        assertSame(
            said.becauseText,
            'this occurrence is done, later ones stand',
            'done is asked first',
        );
    });

    test('A skip stamp is spent once the skipped day has ended', () => {
        const said = isStillWanted(item({
            skippedCycleStamp: at(2026, 5, 2, 18, 0),
        }), at(2026, 5, 3, 9, 0));
        assertSame(
            [said.dropsThisOccurrenceBit, said.becauseText],
            [false, 'wanted'],
            'Wednesday is after the end of Tuesday, so the stamp is spent',
        );
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
        // An appointment: it cannot be snoozed, so a stamp on it means
        // nothing, and no exception anywhere is needed to say so.
        const said = isStillWanted(item({
            sourceScreenCode: 'appointments',
            canBePushedBackBit: false,
            pushedBackToStamp: at(2026, 5, 1, 22, 0),
        }), NOW);
        assertSame(said.pushedBackToMoment, null, 'the capability bit gates the state');
    });

    // ---- the kinds answering as a rule rather than an exception ----

    test('An appointment with neither bit set is simply wanted', () => {
        const said = isStillWanted(item({
            sourceScreenCode: 'appointments',
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
        // A group reminder stands for several items at once. The bit is there
        // to be read further along, not here.
        const said = isStillWanted(item({
            sourceScreenCode: 'appointments',
            itemIdText: 'background',
            standsForGroupBit: true,
        }), NOW);
        assert(said.wantsRemindersBit, 'standing for a group changes nothing in this block');
    });
}
