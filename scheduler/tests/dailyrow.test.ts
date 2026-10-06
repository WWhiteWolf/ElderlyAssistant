import { dailyRowSubtitleOf } from '../../modules/daily-row.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import { assertSame, test } from './runner.ts';

function item(kind: ReminderItem['kind']): ReminderItem {
    return {
        id: kind,
        kind,
        label: 'Test item',
    };
}

export function runDailyRowTests(): void {
    test('Daily marks only a One Time item as One Time only', () => {
        assertSame(
            [
                dailyRowSubtitleOf(item('oneTime')),
                dailyRowSubtitleOf(item('daily')),
                dailyRowSubtitleOf(item('weekly')),
            ],
            ['One Time only', undefined, undefined],
            'the second line must distinguish One Time without changing other Daily rows',
        );
    });
}
