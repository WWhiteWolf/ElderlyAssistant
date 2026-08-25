// Tests for the My Day reader.
//
// Each one hands the reader a saved list and checks what comes back.

import { readMyDay } from '../readers/myday.ts';
import type { MyDayItem } from '../readers/myday.ts';
import { OCCURRENCES_AHEAD } from '../readers/occurrences.ts';
import { assert, assertSame, test } from './runner.ts';

/**
 * A moment to call "now", so no test depends on the real clock.
 *
 * It is built rather than written as a plain number, because these tests are
 * about times of day and calendar days, and both of those are read in the
 * machine's own time zone. Six in the morning leaves the whole of an eight
 * o'clock item still ahead.
 */
const NOW = new Date(2026, 7, 25, 6, 0, 0, 0).getTime();
const MINUTE = 60 * 1000;

/** A saved item, with anything not named taking a sensible default. */
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

/** The occurrences an item asks for, soonest first. */
function occurrences(saved: MyDayItem, now: number = NOW) {
    return readMyDay([saved], now)
        .filter((r) => r.source === 'myday')
        .sort((a, b) => (a.trigger as { at: number }).at - (b.trigger as { at: number }).at);
}

/** One moment, written out so a failure says something a person can read. */
function readable(at: number): string {
    const when = new Date(at);
    return `${when.getFullYear()}-${when.getMonth() + 1}-${when.getDate()} ${when.getHours()}:${String(when.getMinutes()).padStart(2, '0')}`;
}

export function runMyDayTests(): void {
    // ---- The occurrences an item asks for ----

    test('An item with a time is armed for its next two occurrences', () => {
        const armed = occurrences(item({ hour: 8, minute: 30 }));
        assertSame(armed.length, OCCURRENCES_AHEAD, 'expected one reminder per occurrence');
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-25 8:30', '2026-8-26 8:30'],
            'the occurrences must be today and the day after, each at the item\'s own time',
        );
    });

    test('Every occurrence is a single moment, never a repeat', () => {
        assert(
            occurrences(item()).every((r) => r.trigger.kind === 'date'),
            'a repeating alarm cannot be told to skip a day, which is the whole reason for the change',
        );
    });

    test('An item with no time set gets no reminder at all', () => {
        assert(readMyDay([item({ hour: null, minute: null })], NOW).length === 0, 'expected none');
    });

    test('An older saved item with no hour or minute field gets no reminder', () => {
        const stripped = { id: 'a1', label: 'Breakfast', completed: false } as unknown as MyDayItem;
        assert(readMyDay([stripped], NOW).length === 0, 'expected no reminders');
    });

    test("A time already gone by today starts the run at tomorrow's", () => {
        // Nine in the morning, with the item at eight: today's has passed.
        const nineAm = new Date(2026, 7, 25, 9, 0, 0, 0).getTime();
        const armed = occurrences(item({ hour: 8, minute: 0 }), nineAm);
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-26 8:00', '2026-8-27 8:00'],
            'a moment already past cannot be armed',
        );
    });

    test('An empty list gives nothing', () => {
        assert(readMyDay([], NOW).length === 0, 'expected no reminders');
    });

    // ---- The fault Patrick reported ----

    test('An item ticked off gets no reminder for today', () => {
        const armed = occurrences(item({ completed: true }));
        assert(
            armed.every((r) => readable((r.trigger as { at: number }).at) !== '2026-8-25 8:00'),
            'an item already done must not call out again today — this is the fault',
        );
    });

    test('An item ticked off still gets tomorrow and the day after', () => {
        const armed = occurrences(item({ completed: true }));
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-26 8:00', '2026-8-27 8:00'],
            'a tick says what happened today and nothing about tomorrow — breakfast comes round again',
        );
    });

    test('A day passing: the item ticked off today still reminds tomorrow', () => {
        // Tick the item off today, then ask again tomorrow morning as the app
        // would on its next launch — with the tick cleared, because the daily
        // reset clears it as the day turns.
        const armedToday = occurrences(item({ completed: true }));
        assert(
            armedToday.length === OCCURRENCES_AHEAD,
            'a ticked item still wants its later occurrences',
        );

        const tomorrowSixAm = new Date(2026, 7, 26, 6, 0, 0, 0).getTime();
        const armedTomorrow = occurrences(item({ completed: false }), tomorrowSixAm);
        assertSame(
            readable((armedTomorrow[0].trigger as { at: number }).at),
            '2026-8-26 8:00',
            "tomorrow's reminder is what used to go silent, and it must be there",
        );
    });

    test('A tick never touches an occurrence on a later day', () => {
        const ticked = occurrences(item({ completed: true })).map((r) => (r.trigger as { at: number }).at);
        const untouched = occurrences(item({ completed: false })).map((r) => (r.trigger as { at: number }).at);
        assertSame(
            ticked.slice(0, OCCURRENCES_AHEAD - 1),
            untouched.slice(1),
            'the days after today must be the same whether or not the item was ticked',
        );
    });

    // ---- Names ----

    test('An occurrence is named for the day it falls on', () => {
        assertSame(
            occurrences(item({ hour: 8, minute: 0 })).map((r) => r.key),
            ['myday:a1:20260825', 'myday:a1:20260826'],
            'unexpected keys',
        );
    });

    test('An occurrence keeps its name from one run to the next', () => {
        // Named by its own day, tomorrow's reminder answers to the same name
        // whether it is asked for today or tomorrow. That is what lets the
        // reconcile leave it alone instead of taking it down and putting it
        // back on every single run.
        const askedToday = occurrences(item()).map((r) => r.key);
        const tomorrowSixAm = new Date(2026, 7, 26, 6, 0, 0, 0).getTime();
        const askedTomorrow = occurrences(item(), tomorrowSixAm).map((r) => r.key);
        assert(
            askedTomorrow.slice(0, OCCURRENCES_AHEAD - 1).every((key) => askedToday.includes(key)),
            'the occurrences both runs agree on must carry the same names',
        );
    });

    test('Two items get reminders with different keys', () => {
        const both = readMyDay([
            item({ id: 'a1', label: 'Breakfast' }),
            item({ id: 'b2', label: 'Pills', hour: 9, minute: 15 }),
        ], NOW);
        assertSame(new Set(both.map((r) => r.key)).size, both.length, 'every name must be its own');
    });

    test('The same list read twice gives exactly the same keys', () => {
        const list = [item({ id: 'a1' }), item({ id: 'b2' })];
        const first = readMyDay(list, NOW).map((r) => r.key);
        const second = readMyDay(list, NOW).map((r) => r.key);
        assertSame(second, first, 'reading twice must not invent a second set of reminders');
    });

    test('A My Day key can never collide with a Pets key', () => {
        assert(
            occurrences(item({ id: 'shared' })).every((r) => r.key.startsWith('myday:shared:')),
            'the screen must be part of the name',
        );
    });

    test('The banner says what the screen says today', () => {
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
            'the words and buttons must match what My Day sends today',
        );
        assert(
            armed.every((r) => r.body === 'Time for Breakfast!'),
            'every occurrence must read the same — the reader cannot tell them apart',
        );
    });

    test('Every occurrence carries the item it belongs to', () => {
        assert(
            occurrences(item({ id: 'a9' })).every((r) => r.itemId === 'a9'),
            'a tapped banner finds its row by this',
        );
    });

    // ---- Snoozes (#10-new) ----

    test('A snoozed item gets a reminder at the moment it was snoozed to', () => {
        const at = NOW + 30 * MINUTE;
        const wanted = readMyDay([item({ snoozedUntil: at })], NOW);
        const snooze = wanted.find((r) => r.source === 'mydaysnooze');
        assert(snooze != null, 'expected a snooze reminder');
        assertSame(snooze!.trigger, { kind: 'date', at }, 'the snooze must fire at its own moment');
    });

    test('A snooze leaves the occurrences alone', () => {
        const withSnooze = occurrences(item({ snoozedUntil: NOW + 15 * MINUTE }));
        const without = occurrences(item());
        assertSame(
            withSnooze.map((r) => r.key),
            without.map((r) => r.key),
            'a snooze moves today\'s reminder and says nothing about the days after it',
        );
    });

    test('A snooze whose moment has gone is wanted no more', () => {
        const wanted = readMyDay([item({ snoozedUntil: NOW - MINUTE })], NOW);
        assert(
            wanted.every((r) => r.source !== 'mydaysnooze'),
            'a snooze already past cannot be acted on and must not be armed',
        );
    });

    test('Snoozing twice still wants only one snooze reminder', () => {
        const first = readMyDay([item({ snoozedUntil: NOW + 15 * MINUTE })], NOW);
        const second = readMyDay([item({ snoozedUntil: NOW + 30 * MINUTE })], NOW);
        const a = first.find((r) => r.source === 'mydaysnooze')!;
        const b = second.find((r) => r.source === 'mydaysnooze')!;
        assertSame(b.key, a.key, 'both snoozes must carry one name, so the second moves the first');
        assert(
            second.filter((r) => r.source === 'mydaysnooze').length === 1,
            'expected exactly one snooze reminder',
        );
    });

    test('A snoozed item with no time of day still gets its snooze', () => {
        const at = NOW + 20 * MINUTE;
        const wanted = readMyDay([item({ hour: null, minute: null, snoozedUntil: at })], NOW);
        assert(wanted.length === 1, 'expected the snooze and nothing else');
        assertSame(wanted[0].source, 'mydaysnooze', 'expected the snooze');
    });

    test('The snooze banner says what the item says', () => {
        const wanted = readMyDay([item({ label: 'Pills', snoozedUntil: NOW + MINUTE })], NOW);
        const snooze = wanted.find((r) => r.source === 'mydaysnooze')!;
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
}
