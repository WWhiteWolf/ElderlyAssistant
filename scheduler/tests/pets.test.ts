// Tests for the Pets reader.

import { readPets } from '../readers/pets.ts';
import type { PetsItem } from '../readers/pets.ts';
import { assert, assertSame, test } from './runner.ts';

/** A moment to call "now", so no test depends on the real clock. */
const NOW = 1_800_000_000_000;
const MINUTE = 60 * 1000;

function feed(changes: Partial<PetsItem> = {}): PetsItem {
    return { id: 'p1', label: 'Morning feed', hour: 7, minute: 0, completed: false, ...changes };
}

export function runPetsTests(): void {
    test('A feed with a time gets one daily reminder at that time', () => {
        const wanted = readPets([feed({ hour: 7, minute: 30 })], NOW);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(wanted[0].trigger, { kind: 'daily', hour: 7, minute: 30 }, 'wrong trigger');
    });

    test('A feed with no time set gets no reminder', () => {
        assert(readPets([feed({ hour: null, minute: null })], NOW).length === 0, 'expected none');
    });

    test('A feed already checked off still gets its daily reminder', () => {
        assert(readPets([feed({ completed: true })], NOW).length === 1, 'the repeat must survive a tick');
    });

    test('A Pets key can never collide with a My Day key', () => {
        const wanted = readPets([feed({ id: 'shared' })], NOW);
        assertSame(wanted[0].key, 'pets:shared:base', 'unexpected key');
    });

    test('The banner says what Pets Day says today', () => {
        const wanted = readPets([feed({ label: 'Morning feed' })], NOW);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, categoryIdentifier: wanted[0].categoryIdentifier },
            { title: 'Pets Routine', body: 'Time for Morning feed!', categoryIdentifier: 'routineactions' },
            'the words and buttons must match what Pets Day sends today',
        );
    });

    // ---- Snoozes (#10-new) ----

    test('A snoozed feed gets a second reminder at the moment it was snoozed to', () => {
        const at = NOW + 30 * MINUTE;
        const wanted = readPets([feed({ snoozedUntil: at })], NOW);
        assert(wanted.length === 2, 'expected the daily repeat and the snooze');
        const snooze = wanted.find((r) => r.source === 'petssnooze');
        assert(snooze != null, 'expected a snooze reminder');
        assertSame(snooze!.trigger, { kind: 'date', at }, 'the snooze must fire at its own moment');
    });

    test('A snooze leaves the daily repeat alone', () => {
        const wanted = readPets([feed({ hour: 7, minute: 0, snoozedUntil: NOW + 15 * MINUTE })], NOW);
        const base = wanted.find((r) => r.source === 'pets');
        assert(base != null, 'the daily repeat must survive a snooze');
        assertSame(base!.trigger, { kind: 'daily', hour: 7, minute: 0 }, 'the repeat must not move');
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
