import { addingAndChangingWaitsNow, trialEndsAt } from '../../modules/purchase-standing.ts';
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

    test('No answer from Apple does not lock the app, and the Galaxy does not lock', () => {
        const now = new Date(2026, 5, 1, 0, 0, 0);
        assert(addingAndChangingWaitsNow(true, null, now) === false, 'No answer stays open');
        assert(
            addingAndChangingWaitsNow(false, { originalPurchaseMs: new Date(2020, 0, 1).getTime(), purchased: false }, now) === false,
            'The Galaxy is not part of this lock',
        );
    });
}
