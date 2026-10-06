import type { ReminderItem } from './reminder-types';

/** The second line used only when a One Time item is shown on Daily. */
export function dailyRowSubtitleOf(item: ReminderItem): string | undefined {
    return item.kind === 'oneTime' ? 'One Time only' : undefined;
}
