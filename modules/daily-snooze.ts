export const DAILY_SNOOZE_MINUTE_MIN = 1;
export const DAILY_SNOOZE_MINUTE_MAX = 14;
export const DAILY_SNOOZE_MINUTE_DEFAULT = 5;
export const DAILY_SNOOZE_WHEEL_MINUTES = Array.from(
    { length: DAILY_SNOOZE_MINUTE_MAX - DAILY_SNOOZE_MINUTE_MIN + 1 },
    (_, index) => DAILY_SNOOZE_MINUTE_MAX - index,
);

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
        DAILY_SNOOZE_MINUTE_MAX - Math.round(Math.max(0, offset) / rowHeight),
    );
}

export function dailySnoozeOffsetForMinute(value: number, rowHeight: number): number {
    return (DAILY_SNOOZE_MINUTE_MAX - dailySnoozeMinute(value)) * rowHeight;
}

export function dailySnoozeStamp(startsAt: number, minutes: number): number {
    return startsAt + dailySnoozeMinute(minutes) * 60 * 1000;
}

export function dailySnoozeLabel(minutes: number): string {
    const value = dailySnoozeMinute(minutes);
    return `${value} ${value === 1 ? 'minute' : 'minutes'}`;
}
