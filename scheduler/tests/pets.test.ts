// Tests for the Pets reader.

import { readPets } from '../readers/pets.ts';
import type { PetsItem } from '../readers/pets.ts';
import { assert, assertSame, test } from './runner.ts';

function feed(changes: Partial<PetsItem> = {}): PetsItem {
    return { id: 'p1', label: 'Morning feed', hour: 7, minute: 0, completed: false, ...changes };
}

export function runPetsTests(): void {
    test('A feed with a time gets one daily reminder at that time', () => {
        const wanted = readPets([feed({ hour: 7, minute: 30 })]);
        assert(wanted.length === 1, 'expected exactly one reminder');
        assertSame(wanted[0].trigger, { kind: 'daily', hour: 7, minute: 30 }, 'wrong trigger');
    });

    test('A feed with no time set gets no reminder', () => {
        assert(readPets([feed({ hour: null, minute: null })]).length === 0, 'expected none');
    });

    test('A feed already checked off still gets its daily reminder', () => {
        assert(readPets([feed({ completed: true })]).length === 1, 'the repeat must survive a tick');
    });

    test('A Pets key can never collide with a My Day key', () => {
        const wanted = readPets([feed({ id: 'shared' })]);
        assertSame(wanted[0].key, 'pets:shared:base', 'unexpected key');
    });

    test('The banner says what Pets Day says today', () => {
        const wanted = readPets([feed({ label: 'Morning feed' })]);
        assertSame(
            { title: wanted[0].title, body: wanted[0].body, categoryIdentifier: wanted[0].categoryIdentifier },
            { title: 'Pets Routine', body: 'Time for Morning feed!', categoryIdentifier: 'routineactions' },
            'the words and buttons must match what Pets Day sends today',
        );
    });
}
