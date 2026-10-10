import {
    DAILY_SHORT_SNOOZE_MINUTES,
    dailyListSnoozeChoices,
    dailyShortSnoozeLabel,
    dailySnoozeStamp,
} from '../../modules/daily-snooze.ts';
import { assertSame, test } from './runner.ts';

const NOW = new Date(2026, 9, 5, 17, 20, 0, 0).getTime();

export function runDailySnoozeTests(): void {
    test('Daily asks for 1, 5, and 10, then the choices it already had', () => {
        const asked = dailyListSnoozeChoices([
            { label: 'Delay 15 min' },
            { label: 'Delay 30 min' },
            { label: 'Delay 60 min' },
        ]);
        assertSame(
            [
                DAILY_SHORT_SNOOZE_MINUTES[0],
                DAILY_SHORT_SNOOZE_MINUTES[1],
                DAILY_SHORT_SNOOZE_MINUTES[2],
                asked.map((one) => one.label),
            ],
            [1, 5, 10, ['Delay 1 min', 'Delay 5 min', 'Delay 10 min', 'Delay 15 min', 'Delay 30 min', 'Delay 60 min']],
            'Daily must ask for 1, 5, 10, and the rest, with no wheel',
        );
    });

    test('A Daily short Snooze adds 1, 5, or 10 minutes to the machine\'s starting moment', () => {
        assertSame(
            [
                dailySnoozeStamp(NOW, 1),
                dailySnoozeStamp(NOW, 5),
                dailySnoozeStamp(NOW, 10),
                dailyShortSnoozeLabel(1),
                dailyShortSnoozeLabel(5),
                dailyShortSnoozeLabel(10),
            ],
            [
                NOW + 1 * 60 * 1000,
                NOW + 5 * 60 * 1000,
                NOW + 10 * 60 * 1000,
                'Delay 1 min',
                'Delay 5 min',
                'Delay 10 min',
            ],
            '1, 5, and 10 must add that delay and keep the same kind of words as the rest',
        );
    });
}
