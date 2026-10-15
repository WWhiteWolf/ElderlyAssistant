import {
    PICTURE_BUILD,
    PRACTICE_DOWNLOAD_MS,
    addingAndChangingWaitsNow,
    trialEndsAt,
} from '../../modules/purchase-standing.ts';
import { assert, test } from './runner.ts';

export function runPurchaseStandingTests(): void {
    test('A trial that starts on 14 March ends on 14 April', () => {
        const start = new Date(2026, 2, 14, 15, 30, 0).getTime();
        const end = trialEndsAt(start);
        assert(end.getFullYear() === 2026, 'The year stays 2026');
        assert(end.getMonth() === 3, 'April is the next month');
        assert(end.getDate() === 14, 'The day stays the 14th');
    });

    test('A trial that starts on 31 January ends on the last day of February', () => {
        const start = new Date(2026, 0, 31, 9, 0, 0).getTime();
        const end = trialEndsAt(start);
        assert(end.getFullYear() === 2026, 'The year stays 2026');
        assert(end.getMonth() === 1, 'February is the next month');
        assert(end.getDate() === 28, '2026 has no 31 February, so the trial ends on the 28th');
    });

    test('Adding and changing stay open during the trial', () => {
        const start = new Date(2026, 2, 14, 15, 0, 0).getTime();
        const during = new Date(2026, 2, 20, 12, 0, 0);
        assert(
            addingAndChangingWaitsNow(true, { originalPurchaseMs: start, purchased: false }, during) === false,
            'A day inside the month does not wait',
        );
    });

    test('Adding and changing wait once the trial is over and they have not paid', () => {
        const start = new Date(2026, 2, 14, 15, 0, 0).getTime();
        const after = trialEndsAt(start);
        assert(
            addingAndChangingWaitsNow(true, { originalPurchaseMs: start, purchased: false }, after) === true,
            'The trial end is when adding and changing wait',
        );
    });

    test('A purchased account does not wait', () => {
        const start = new Date(2020, 0, 1, 0, 0, 0).getTime();
        const now = new Date(2026, 5, 1, 0, 0, 0);
        assert(
            addingAndChangingWaitsNow(true, { originalPurchaseMs: start, purchased: true }, now) === false,
            'Paid means adding and changing work',
        );
    });

    test('The picture build uses 1 August 2013 when Apple gives no day', () => {
        const now = new Date(2026, 9, 15, 12, 0, 0);
        const end = trialEndsAt(PRACTICE_DOWNLOAD_MS);
        assert(end.getFullYear() === 2013, '1 August 2013 ends in 2013');
        assert(end.getMonth() === 8, 'September is the next month');
        assert(end.getDate() === 1, 'The day stays the 1st');
        assert(PICTURE_BUILD === true, 'The fake date is in this build');
        assert(
            addingAndChangingWaitsNow(true, null, now) === true,
            'No day on the iPhone opens the notice',
        );
        assert(
            addingAndChangingWaitsNow(true, { originalPurchaseMs: null, purchased: false }, now) === true,
            'A saved standing with no day opens the notice',
        );
        assert(
            addingAndChangingWaitsNow(false, null, now) === false,
            'The Galaxy stays open',
        );
    });
}
