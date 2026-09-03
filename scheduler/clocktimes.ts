// The three Settings times of day, and the defaults when nothing is set.
//
// The current one-list road uses these.

import type { ClockTimes } from './leadmoments.ts';

export const DEFAULT_CLOCK_TIMES: ClockTimes = {
    morning: { hour: 8, minute: 0 },
    midday: { hour: 12, minute: 0 },
    evening: { hour: 17, minute: 0 },
};
