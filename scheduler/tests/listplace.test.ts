// A held row on a long list lands on the row under the finger after a scroll.

import { placeInList, rowUnderPlace } from '../../modules/list-place.ts';
import { assertSame, test } from './runner.ts';

function rowsOf(count: number, height: number): { y: number; h: number }[] {
    return Array.from({ length: count }, (_, index) => ({ y: index * height, h: height }));
}

export function runListPlaceTests(): void {
    test('A short move at the top of an unscrolled list stays nearby', () => {
        const height = 80;
        const rows = rowsOf(16, height);
        const listTop = 100;
        const finger = listTop + height + height / 2;
        const place = placeInList(finger, listTop, 0);
        assertSame(rowUnderPlace(place, rows), 1, 'one row down lands one row down');
    });

    test('A short move on a scrolled list stays a short distance away', () => {
        const height = 80;
        const rows = rowsOf(30, height);
        const listTop = 100;
        const scrolled = 22 * height;
        const from = 28;
        const finger = listTop + (from * height - scrolled) + height / 2 - height;
        const place = placeInList(finger, listTop, scrolled);
        assertSame(rowUnderPlace(place, rows), from - 1, 'one row up near the bottom stays one row up');
    });

    test('A finger on a bottom row of a scrolled list does not land at the top', () => {
        const height = 80;
        const rows = rowsOf(30, height);
        const listTop = 100;
        const scrolled = 22 * height;
        const row = 24;
        const finger = listTop + (row * height - scrolled) + height / 2;
        const place = placeInList(finger, listTop, scrolled);
        assertSame(rowUnderPlace(place, rows), row, 'the row under the finger is the one that is kept');
    });
}
