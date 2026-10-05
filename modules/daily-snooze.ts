export const DAILY_SNOOZE_MINUTE_MIN = 1;
export const DAILY_SNOOZE_MINUTE_MAX = 14;
export const DAILY_SNOOZE_MINUTE_DEFAULT = 5;

export function dailySnoozeMinute(value: number): number {
    if (!Number.isFinite(value)) return DAILY_SNOOZE_MINUTE_DEFAULT;
    return Math.max(
        DAILY_SNOOZE_MINUTE_MIN,
        Math.min(DAILY_SNOOZE_MINUTE_MAX, Math.round(value)),
    );
}

export function stepDailySnoozeMinute(value: number, delta: -1 | 1): number {
    return dailySnoozeMinute(value + delta);
}

export function dailySnoozeMinuteFromOffset(offset: number, rowHeight: number): number {
    return dailySnoozeMinute(
        Math.round(Math.max(0, offset) / rowHeight) + DAILY_SNOOZE_MINUTE_MIN,
    );
}

export function dailySnoozeOffsetForMinute(value: number, rowHeight: number): number {
    return (dailySnoozeMinute(value) - DAILY_SNOOZE_MINUTE_MIN) * rowHeight;
}

export function dailySnoozeStamp(now: number, minutes: number): number {
    return now + dailySnoozeMinute(minutes) * 60 * 1000;
}

export function dailySnoozeLabel(minutes: number): string {
    const value = dailySnoozeMinute(minutes);
    return `${value} ${value === 1 ? 'minute' : 'minutes'}`;
}
