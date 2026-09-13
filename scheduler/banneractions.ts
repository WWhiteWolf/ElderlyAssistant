// The one plain catalog for every notification banner action.
//
// Expo registration, response handling, and the list's Snooze choices all
// read this file. React Native and Expo stay outside it, so Node can prove the
// action sets and their calendar arithmetic without a phone.

import type { BannerButtonsCode } from './inputshape.ts';

/** Every action identifier Expo may register and return. */
export type BannerActionCode =
    | 'done'
    | 'ok'
    | 'skip'
    | 'snooze15'
    | 'snooze30'
    | 'snooze60'
    | 'delayday'
    | 'delayweek'
    | 'delaymonth'
    | 'then'
    | 'nextday';

/** What one action means after the housing has found its item. */
export type BannerActionEffectCode =
    | 'acknowledge'
    | 'done'
    | 'skip'
    | 'pushBack'
    | 'keepShiftedDay'
    | 'moveShiftedOccurrenceToNextDay';

/** The one named calculation used to write a pushed-back target stamp. */
export type PushBackCalculationCode =
    | 'after15ElapsedMinutes'
    | 'after30ElapsedMinutes'
    | 'after60ElapsedMinutes'
    | 'after1CalendarDay'
    | 'after7CalendarDays'
    | 'after1CalendarMonth'
    | 'nextCalendarDayAtSavedTime';

interface BannerActionDefinitionBase {
    actionCode: BannerActionCode;
    buttonTitle: string;
    /** True when Expo should perform the action without opening Memory. */
    leavesAppClosedBit: boolean;
}

export type BannerActionDefinition =
    | (BannerActionDefinitionBase & {
        effectCode: 'pushBack' | 'moveShiftedOccurrenceToNextDay';
        pushBackCalculationCode: PushBackCalculationCode;
    })
    | (BannerActionDefinitionBase & {
        effectCode: Exclude<
            BannerActionEffectCode,
            'pushBack' | 'moveShiftedOccurrenceToNextDay'
        >;
        pushBackCalculationCode?: never;
    });

export type PushBackBannerActionDefinition = Extract<
    BannerActionDefinition,
    { pushBackCalculationCode: PushBackCalculationCode }
>;

/**
 * Each action's words and meaning, written once even when several button sets
 * include it.
 */
export const BANNER_ACTION_DEFINITIONS: Record<BannerActionCode, BannerActionDefinition> = {
    done: {
        actionCode: 'done',
        buttonTitle: 'Done',
        leavesAppClosedBit: false,
        effectCode: 'done',
    },
    ok: {
        actionCode: 'ok',
        buttonTitle: 'OK',
        leavesAppClosedBit: true,
        effectCode: 'acknowledge',
    },
    skip: {
        actionCode: 'skip',
        buttonTitle: 'Skip',
        leavesAppClosedBit: true,
        effectCode: 'skip',
    },
    snooze15: {
        actionCode: 'snooze15',
        buttonTitle: 'Delay 15 min',
        leavesAppClosedBit: false,
        effectCode: 'pushBack',
        pushBackCalculationCode: 'after15ElapsedMinutes',
    },
    snooze30: {
        actionCode: 'snooze30',
        buttonTitle: 'Delay 30 min',
        leavesAppClosedBit: false,
        effectCode: 'pushBack',
        pushBackCalculationCode: 'after30ElapsedMinutes',
    },
    snooze60: {
        actionCode: 'snooze60',
        buttonTitle: 'Delay 60 min',
        leavesAppClosedBit: false,
        effectCode: 'pushBack',
        pushBackCalculationCode: 'after60ElapsedMinutes',
    },
    delayday: {
        actionCode: 'delayday',
        buttonTitle: 'Delay 1 Day',
        leavesAppClosedBit: false,
        effectCode: 'pushBack',
        pushBackCalculationCode: 'after1CalendarDay',
    },
    delayweek: {
        actionCode: 'delayweek',
        buttonTitle: 'Delay 1 Week',
        leavesAppClosedBit: false,
        effectCode: 'pushBack',
        pushBackCalculationCode: 'after7CalendarDays',
    },
    delaymonth: {
        actionCode: 'delaymonth',
        buttonTitle: 'Delay 1 Month',
        leavesAppClosedBit: false,
        effectCode: 'pushBack',
        pushBackCalculationCode: 'after1CalendarMonth',
    },
    then: {
        actionCode: 'then',
        buttonTitle: 'Then',
        leavesAppClosedBit: false,
        effectCode: 'keepShiftedDay',
    },
    nextday: {
        actionCode: 'nextday',
        buttonTitle: 'Next Day',
        leavesAppClosedBit: false,
        effectCode: 'moveShiftedOccurrenceToNextDay',
        pushBackCalculationCode: 'nextCalendarDayAtSavedTime',
    },
};

/**
 * One complete row for every BannerButtonsCode. The Record makes a newly
 * added set a compile error until its buttons have been described here.
 */
export const BANNER_ACTION_CATALOG: Record<
    BannerButtonsCode,
    readonly BannerActionCode[]
> = {
    routineactions: ['done', 'ok', 'skip', 'snooze15', 'snooze30', 'snooze60'],
    onetimeactions: ['done', 'ok', 'snooze15', 'snooze30', 'snooze60'],
    weeklyactions: ['done', 'ok', 'skip', 'snooze15', 'snooze30', 'snooze60', 'delayday'],
    cadenceactions: ['done', 'delayday', 'delayweek', 'delaymonth'],
    appointmentsok: ['ok'],
    shifteddayactions: ['then', 'nextday'],
};

/** Every complete button-set code, in the catalog's registration order. */
export function bannerButtonsCodes(): BannerButtonsCode[] {
    return Object.keys(BANNER_ACTION_CATALOG) as BannerButtonsCode[];
}

/** The full definitions for one complete button set. */
export function bannerActionsOf(code: BannerButtonsCode): BannerActionDefinition[] {
    return BANNER_ACTION_CATALOG[code].map(
        (actionCode) => BANNER_ACTION_DEFINITIONS[actionCode],
    );
}

/** A category code received from the phone, when it is one of ours. */
export function bannerButtonsCodeOf(value: unknown): BannerButtonsCode | undefined {
    if (
        typeof value === 'string'
        && Object.prototype.hasOwnProperty.call(BANNER_ACTION_CATALOG, value)
    ) {
        return value as BannerButtonsCode;
    }
    return undefined;
}

/**
 * Find an action only inside the category that the notification actually
 * carried. An action copied from another category is not accepted.
 */
export function bannerActionOf(
    categoryCode: BannerButtonsCode,
    actionValue: unknown,
): BannerActionDefinition | undefined {
    if (typeof actionValue !== 'string') return undefined;
    const actionCode = actionValue as BannerActionCode;
    if (!BANNER_ACTION_CATALOG[categoryCode].includes(actionCode)) return undefined;
    return BANNER_ACTION_DEFINITIONS[actionCode];
}

/** The push-back actions in one set, in their visible order. */
export function pushBackActionsOf(
    categoryCode: BannerButtonsCode,
): PushBackBannerActionDefinition[] {
    return bannerActionsOf(categoryCode).filter(
        (action): action is PushBackBannerActionDefinition =>
            action.effectCode === 'pushBack'
            || action.effectCode === 'moveShiftedOccurrenceToNextDay',
    );
}

/** The saved clock fields needed by Next Day's different calculation. */
export interface SavedBannerClock {
    hour?: number | null;
    minute?: number | null;
}

/** One page choice taken from the same action definition as its banner. */
export interface BannerPushBackChoice {
    actionCode: BannerActionCode;
    buttonTitle: string;
    stampAt: (now: number) => number;
}

/**
 * Calculate one pushed-back target. Elapsed minutes stay elapsed; day, week,
 * and month choices use the local calendar. Next Day deliberately resets the
 * clock to the item's saved hour and minute.
 */
export function pushBackStampOf(
    code: PushBackCalculationCode,
    now: number,
    item: SavedBannerClock = {},
): number {
    if (code === 'after15ElapsedMinutes') return now + 15 * 60 * 1000;
    if (code === 'after30ElapsedMinutes') return now + 30 * 60 * 1000;
    if (code === 'after60ElapsedMinutes') return now + 60 * 60 * 1000;

    const target = new Date(now);
    if (code === 'after1CalendarDay') {
        target.setDate(target.getDate() + 1);
    } else if (code === 'after7CalendarDays') {
        target.setDate(target.getDate() + 7);
    } else if (code === 'after1CalendarMonth') {
        target.setMonth(target.getMonth() + 1);
    } else {
        target.setDate(target.getDate() + 1);
        target.setHours(
            typeof item.hour === 'number' ? item.hour : 12,
            typeof item.minute === 'number' ? item.minute : 0,
            0,
            0,
        );
    }
    return target.getTime();
}

/** The page-facing push-back choices for one banner set. */
export function pushBackChoicesOf(
    categoryCode: BannerButtonsCode,
    item: SavedBannerClock,
): BannerPushBackChoice[] {
    return pushBackActionsOf(categoryCode).map((action) => ({
        actionCode: action.actionCode,
        buttonTitle: action.buttonTitle,
        stampAt: (now) => pushBackStampOf(action.pushBackCalculationCode, now, item),
    }));
}
