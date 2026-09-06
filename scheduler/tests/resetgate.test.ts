// Tests for a day-roll requested while another roll is already going.

import { oneDailyReset, resetResetGateForTests } from '../resetgate.ts';
import { assert, test } from './runner.ts';

export function runResetGateTests(): void {
    test('A second call during a roll does not start another roll', () => {
        resetResetGateForTests();
        let started = 0;
        const work = () => {
            started++;
            return new Promise<number>(() => {});
        };
        void oneDailyReset(work);
        void oneDailyReset(work);
        assert(started === 1, 'expected one roll');
        resetResetGateForTests();
    });

    test('After the gate is cleared, a new call starts a new roll', () => {
        resetResetGateForTests();
        let started = 0;
        const work = async () => {
            started++;
        };
        void oneDailyReset(work);
        resetResetGateForTests();
        void oneDailyReset(work);
        assert(started === 2, 'expected a second roll after the first finished');
        resetResetGateForTests();
    });
}
