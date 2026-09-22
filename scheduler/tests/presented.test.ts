// Tests for removing banners that have already reached the phone.

import {
    doneItemIdsOf,
    presentedIdentifiersToDismiss,
} from '../presented.ts';
import { assertSame, test } from './runner.ts';

const START_OF_TODAY = new Date(2026, 8, 22, 0, 0, 0, 0).getTime();

export function runPresentedTests(): void {
    test('The saved Done state names the items whose banners must stop', () => {
        assertSame(
            doneItemIdsOf([
                { id: 'done', completed: true },
                { id: 'open', completed: false },
                { id: 'unset' },
            ]),
            ['done'],
            'only saved Done items belong in the cleanup',
        );
    });

    test('Every delivered banner for a Done item is taken down', () => {
        const identifiers = presentedIdentifiersToDismiss(
            [
                { identifier: 'base', deliveredAt: START_OF_TODAY + 1000, itemId: 'done' },
                { identifier: 'delay', deliveredAt: START_OF_TODAY + 2000, itemId: 'done' },
                { identifier: 'other', deliveredAt: START_OF_TODAY + 3000, itemId: 'open' },
            ],
            START_OF_TODAY,
            ['done'],
        );
        assertSame(identifiers, ['base', 'delay'], 'all copies for the Done item must go');
    });

    test('A banner from before today is still taken down', () => {
        const identifiers = presentedIdentifiersToDismiss(
            [
                { identifier: 'old', deliveredAt: START_OF_TODAY - 1, itemId: 'open' },
                { identifier: 'today', deliveredAt: START_OF_TODAY + 1, itemId: 'open' },
            ],
            START_OF_TODAY,
            [],
        );
        assertSame(identifiers, ['old'], 'today’s unfinished banner must stay');
    });
}
