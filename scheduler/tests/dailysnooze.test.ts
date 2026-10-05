import {
    DAILY_SNOOZE_MINUTE_DEFAULT,
    DAILY_SNOOZE_MINUTE_MAX,
    DAILY_SNOOZE_MINUTE_MIN,
    dailySnoozeLabel,
    dailySnoozeMinuteFromOffset,
    dailySnoozeOffsetForMinute,
    dailySnoozeStamp,
    stepDailySnoozeMinute,
} from '../../modules/daily-snooze.ts';
import { assertSame, test } from './runner.ts';

const ROW_HEIGHT = 44;
const NOW = new Date(2026, 9, 5, 17, 20, 0, 0).getTime();

export function runDailySnoozeTests(): void {
    test('The Daily minute wheel starts at 5 and runs from 1 through 14', () => {
        assertSame(
            [DAILY_SNOOZE_MINUTE_MIN, DAILY_SNOOZE_MINUTE_DEFAULT, DAILY_SNOOZE_MINUTE_MAX],
            [1, 5, 14],
            'the wheel limits or starting minute changed',
        );
    });

    test('Daily minute Up and Down stop at the ends instead of wrapping', () => {
        assertSame(
            [
                stepDailySnoozeMinute(1, -1),
                stepDailySnoozeMinute(14, 1),
                stepDailySnoozeMinute(5, 1),
                stepDailySnoozeMinute(5, -1),
            ],
            [1, 14, 6, 4],
            'Up and Down must clamp at 1 and 14',
        );
    });

    test('The spinning wheel maps its first, starting, and last rows to 1, 5, and 14', () => {
        assertSame(
            [
                dailySnoozeMinuteFromOffset(0, ROW_HEIGHT),
                dailySnoozeMinuteFromOffset(4 * ROW_HEIGHT, ROW_HEIGHT),
                dailySnoozeMinuteFromOffset(13 * ROW_HEIGHT, ROW_HEIGHT),
                dailySnoozeOffsetForMinute(5, ROW_HEIGHT),
            ],
            [1, 5, 14, 4 * ROW_HEIGHT],
            'the centered wheel row must match the selected minute',
        );
    });

    test('Daily minute Snooze uses elapsed minutes and readable words', () => {
        assertSame(
            [
                dailySnoozeStamp(NOW, 5),
                dailySnoozeLabel(1),
                dailySnoozeLabel(5),
            ],
            [
                NOW + 5 * 60 * 1000,
                '1 minute',
                '5 minutes',
            ],
            'the wheel must set the selected elapsed-minute delay',
        );
    });
}
