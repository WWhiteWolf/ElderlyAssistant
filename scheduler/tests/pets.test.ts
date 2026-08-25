// Tests for the Pets reader.

import { readPets } from '../readers/pets.ts';
import type { PetsItem } from '../readers/pets.ts';
import { OCCURRENCES_AHEAD } from '../readers/occurrences.ts';
import { assert, assertSame, test } from './runner.ts';

/**
 * A moment to call "now", so no test depends on the real clock.
 *
 * It is built rather than written as a plain number, because these tests are
 * about times of day and calendar days, and both of those are read in the
 * machine's own time zone. Six in the morning leaves the whole of a seven
 * o'clock feed still ahead.
 */
const NOW = new Date(2026, 7, 25, 6, 0, 0, 0).getTime();
const MINUTE = 60 * 1000;

function feed(changes: Partial<PetsItem> = {}): PetsItem {
    return { id: 'p1', label: 'Morning feed', hour: 7, minute: 0, completed: false, ...changes };
}

/** The occurrences a feed asks for, soonest first. */
function occurrences(item: PetsItem, now: number = NOW) {
    return readPets([item], now)
        .filter((r) => r.source === 'pets')
        .sort((a, b) => (a.trigger as { at: number }).at - (b.trigger as { at: number }).at);
}

/** One moment, written out so a failure says something a person can read. */
function readable(at: number): string {
    const when = new Date(at);
    return `${when.getFullYear()}-${when.getMonth() + 1}-${when.getDate()} ${when.getHours()}:${String(when.getMinutes()).padStart(2, '0')}`;
}

export function runPetsTests(): void {
    // ---- The occurrences a feed asks for ----

    test('A feed with a time is armed for its next two occurrences', () => {
        const armed = occurrences(feed({ hour: 7, minute: 30 }));
        assertSame(armed.length, OCCURRENCES_AHEAD, 'expected one reminder per occurrence');
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-25 7:30', '2026-8-26 7:30'],
            'the occurrences must be today and the day after, each at the feed\'s own time',
        );
    });

    test('Every occurrence is a single moment, never a repeat', () => {
        assert(
            occurrences(feed()).every((r) => r.trigger.kind === 'date'),
            'a repeating alarm cannot be told to skip a day, which is the whole reason for the change',
        );
    });

    test('A feed with no time set gets no reminder', () => {
        assert(readPets([feed({ hour: null, minute: null })], NOW).length === 0, 'expected none');
    });

    test("A time already gone by today starts the run at tomorrow's", () => {
        // Eight in the morning, with the feed at seven: today's has passed.
        const eightAm = new Date(2026, 7, 25, 8, 0, 0, 0).getTime();
        const armed = occurrences(feed({ hour: 7, minute: 0 }), eightAm);
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-26 7:00', '2026-8-27 7:00'],
            'a moment already past cannot be armed',
        );
    });

    // ---- The fault Patrick reported ----

    test("A feed ticked off gets no reminder for today", () => {
        const armed = occurrences(feed({ completed: true }));
        assert(
            armed.every((r) => readable((r.trigger as { at: number }).at) !== '2026-8-25 7:00'),
            'a feed already seen to must not call out again today — this is the fault',
        );
    });

    test('A feed ticked off still gets tomorrow and the day after', () => {
        const armed = occurrences(feed({ completed: true }));
        assertSame(
            armed.map((r) => readable((r.trigger as { at: number }).at)),
            ['2026-8-26 7:00', '2026-8-27 7:00'],
            'a tick says what happened today and nothing about tomorrow — the dog still needs feeding',
        );
    });

    test('A day passing: the feed ticked off today still reminds tomorrow', () => {
        // The one test that has never run. Tick the feed off today, then ask
        // again tomorrow morning as the app would on its next launch — with the
        // tick cleared, because the daily reset clears it as the day turns.
        const armedToday = occurrences(feed({ completed: true }));
        assert(
            armedToday.length === OCCURRENCES_AHEAD,
            'a ticked feed still wants its later occurrences',
        );

        const tomorrowSixAm = new Date(2026, 7, 26, 6, 0, 0, 0).getTime();
        const armedTomorrow = occurrences(feed({ completed: false }), tomorrowSixAm);
        assertSame(
            readable((armedTomorrow[0].trigger as { at: number }).at),
            '2026-8-26 7:00',
            "tomorrow's reminder is what used to go silent, and it must be there",
        );
    });

    test("A tick never touches an occurrence on a later day", () => {
        const ticked = occurrences(feed({ completed: true })).map((r) => (r.trigger as { at: number }).at);
        const untouched = occurrences(feed({ completed: false })).map((r) => (r.trigger as { at: number }).at);
        assertSame(
            ticked.slice(0, OCCURRENCES_AHEAD - 1),
            untouched.slice(1),
            'the days after today must be the same whether or not the feed was ticked',
        );
    });

    // ---- Names ----

    test('An occurrence is named for the day it falls on', () => {
        assertSame(
            occurrences(feed({ hour: 7, minute: 0 })).map((r) => r.key),
            ['pets:p1:20260825', 'pets:p1:20260826'],
            'unexpected keys',
        );
    });

    test('An occurrence keeps its name from one run to the next', () => {
        // Named by its own day, tomorrow's reminder answers to the same name
        // whether it is asked for today or tomorrow. That is what lets the
        // reconcile leave it alone instead of taking it down and putting it
        // back on every single run.
        const askedToday = occurrences(feed()).map((r) => r.key);
        const tomorrowSixAm = new Date(2026, 7, 26, 6, 0, 0, 0).getTime();
        const askedTomorrow = occurrences(feed(), tomorrowSixAm).map((r) => r.key);
        assert(
            askedTomorrow.slice(0, OCCURRENCES_AHEAD - 1).every((key) => askedToday.includes(key)),
            'the occurrences both runs agree on must carry the same names',
        );
    });

    test('Two feeds can never take each other\'s names', () => {
        const both = readPets([feed({ id: 'a' }), feed({ id: 'b' })], NOW);
        assertSame(new Set(both.map((r) => r.key)).size, both.length, 'every name must be its own');
    });

    test('A Pets key can never collide with a My Day key', () => {
        assert(
            occurrences(feed({ id: 'shared' })).every((r) => r.key.startsWith('pets:shared:')),
            'the screen must be part of the name',
        );
    });

    test('The banner says what Pets Day says today', () => {
        const armed = occurrences(feed({ label: 'Morning feed' }));
        assertSame(
            { title: armed[0].title, body: armed[0].body, categoryIdentifier: armed[0].categoryIdentifier },
            { title: 'Pets Routine', body: 'Time for Morning feed!', categoryIdentifier: 'routineactions' },
            'the words and buttons must match what Pets Day sends today',
        );
        assert(
            armed.every((r) => r.body === 'Time for Morning feed!'),
            'every occurrence must read the same — the player cannot tell them apart',
        );
    });

    test('Every occurrence carries the feed it belongs to', () => {
        assert(
            occurrences(feed({ id: 'p9' })).every((r) => r.itemId === 'p9'),
            'a tapped banner finds its row by this',
        );
    });

    // ---- Snoozes (#10-new) ----

    test('A snoozed feed gets a reminder at the moment it was snoozed to', () => {
        const at = NOW + 30 * MINUTE;
        const wanted = readPets([feed({ snoozedUntil: at })], NOW);
        const snooze = wanted.find((r) => r.source === 'petssnooze');
        assert(snooze != null, 'expected a snooze reminder');
        assertSame(snooze!.trigger, { kind: 'date', at }, 'the snooze must fire at its own moment');
    });

    test('A snooze leaves the occurrences alone', () => {
        const withSnooze = occurrences(feed({ snoozedUntil: NOW + 15 * MINUTE }));
        const without = occurrences(feed());
        assertSame(
            withSnooze.map((r) => r.key),
            without.map((r) => r.key),
            'a snooze moves today\'s reminder and says nothing about the days after it',
        );
    });

    test('A snooze whose moment has gone is wanted no more', () => {
        const wanted = readPets([feed({ snoozedUntil: NOW - MINUTE })], NOW);
        assert(
            wanted.every((r) => r.source !== 'petssnooze'),
            'a snooze already past cannot be acted on and must not be armed',
        );
    });

    test('Snoozing twice still wants only one snooze reminder', () => {
        const wanted = readPets([feed({ snoozedUntil: NOW + 30 * MINUTE })], NOW);
        assert(
            wanted.filter((r) => r.source === 'petssnooze').length === 1,
            'expected exactly one snooze reminder',
        );
        assertSame(
            wanted.find((r) => r.source === 'petssnooze')!.key,
            'petssnooze:p1:base',
            'one name per feed is what stops a second snooze leaving two reminders',
        );
    });

    test('A snooze survives the feed losing its time of day', () => {
        const wanted = readPets(
            [feed({ hour: null, minute: null, snoozedUntil: NOW + MINUTE })],
            NOW,
        );
        assert(
            wanted.some((r) => r.source === 'petssnooze'),
            'a feed owes the reminder it promised even once its time is cleared',
        );
    });

    test('A Pets snooze key can never collide with a My Day snooze key', () => {
        const wanted = readPets([feed({ id: 'shared', snoozedUntil: NOW + MINUTE })], NOW);
        assertSame(
            wanted.find((r) => r.source === 'petssnooze')!.key,
            'petssnooze:shared:base',
            'unexpected key',
        );
    });

    test('The snooze banner says what the feed says', () => {
        const wanted = readPets([feed({ label: 'Morning feed', snoozedUntil: NOW + MINUTE })], NOW);
        const snooze = wanted.find((r) => r.source === 'petssnooze')!;
        assertSame(
            { title: snooze.title, body: snooze.body, categoryIdentifier: snooze.categoryIdentifier },
            { title: 'Pets Routine', body: 'Time for Morning feed!', categoryIdentifier: 'routineactions' },
            'a snoozed reminder must read exactly like the one it stands in for',
        );
    });
}
