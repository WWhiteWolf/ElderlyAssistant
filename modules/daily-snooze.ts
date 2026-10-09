export const DAILY_SHORT_SNOOZE_MINUTES = [5, 10] as const;

export function dailyShortSnoozeLabel(minutes: number): string {
    return `Delay ${minutes} min`;
}

export function dailySnoozeStamp(startsAt: number, minutes: number): number {
    return startsAt + minutes * 60 * 1000;
}

export function dailyShortSnoozeChoices(): {
    label: string;
    stampAt: (startsAt: number) => number;
}[] {
    return DAILY_SHORT_SNOOZE_MINUTES.map((minutes) => ({
        label: dailyShortSnoozeLabel(minutes),
        stampAt: (startsAt: number) => dailySnoozeStamp(startsAt, minutes),
    }));
}

/** Daily and One Time ask for 5 and 10, then the choices they already had. */
export function dailyListSnoozeChoices<T extends { label: string }>(rest: T[]): (
    | { label: string; stampAt: (startsAt: number) => number }
    | T
)[] {
    return [...dailyShortSnoozeChoices(), ...rest];
}
