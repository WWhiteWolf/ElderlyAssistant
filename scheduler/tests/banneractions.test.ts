// Tests for the one plain catalog shared by banner registration, banner
// responses, and the list's Snooze choices.

import {
    BANNER_ACTION_CATALOG,
    BANNER_ACTION_DEFINITIONS,
    bannerActionOf,
    bannerActionsOf,
    bannerButtonsCodes,
    pushBackActionsOf,
    pushBackChoicesOf,
    pushBackStampOf,
} from '../banneractions.ts';
import { assert, assertSame, test } from './runner.ts';

const NOW = new Date(2026, 0, 15, 10, 20, 0, 0).getTime();
const CLOCK = { hour: 8, minute: 45 };

export function runBannerActionTests(): void {
    test('Every banner button code has exactly one catalog row', () => {
        const codes = bannerButtonsCodes();
        assertSame(
            codes,
            [
                'routineactions',
                'onetimeactions',
                'weeklyactions',
                'cadenceactions',
                'appointmentsok',
                'shifteddayactions',
            ],
            'all six complete sets are present',
        );
        assertSame(new Set(codes).size, codes.length, 'no button set is described twice');
        assertSame(
            Object.keys(BANNER_ACTION_CATALOG).length,
            codes.length,
            'registration walks every catalog row',
        );
    });

    test('Every action code has one matching definition', () => {
        for (const [actionCode, definition] of Object.entries(BANNER_ACTION_DEFINITIONS)) {
            assertSame(definition.actionCode, actionCode, 'the definition carries its own code');
        }
    });

    test('One Time has no Skip action', () => {
        assert(
            !bannerActionsOf('onetimeactions').some((action) => action.actionCode === 'skip'),
            'a one-off has no next cycle to skip',
        );
    });

    test('Daily and Weekly still have Skip', () => {
        assert(
            bannerActionsOf('routineactions').some((action) => action.actionCode === 'skip'),
            'Daily keeps Skip',
        );
        assert(
            bannerActionsOf('weeklyactions').some((action) => action.actionCode === 'skip'),
            'Weekly keeps Skip',
        );
    });

    test('Only the actions meant to leave Memory closed say so', () => {
        assertSame(
            [
                BANNER_ACTION_DEFINITIONS.ok.leavesAppClosedBit,
                BANNER_ACTION_DEFINITIONS.skip.leavesAppClosedBit,
                BANNER_ACTION_DEFINITIONS.done.leavesAppClosedBit,
                BANNER_ACTION_DEFINITIONS.snooze15.leavesAppClosedBit,
            ],
            [true, true, false, false],
            'OK and Skip stay closed; Done and Delay open the app',
        );
    });

    test('An action is accepted only from its notification category', () => {
        assertSame(
            bannerActionOf('onetimeactions', 'skip'),
            undefined,
            'a stale Daily Skip cannot act on One Time',
        );
        assertSame(
            bannerActionOf('shifteddayactions', 'nextday')?.effectCode,
            'moveShiftedOccurrenceToNextDay',
            'Next Day keeps its different effect',
        );
    });

    test('Elapsed-minute and calendar push-back calculations keep their meanings', () => {
        assertSame(
            [
                pushBackStampOf('after15ElapsedMinutes', NOW, CLOCK),
                pushBackStampOf('after30ElapsedMinutes', NOW, CLOCK),
                pushBackStampOf('after60ElapsedMinutes', NOW, CLOCK),
                pushBackStampOf('after1CalendarDay', NOW, CLOCK),
                pushBackStampOf('after7CalendarDays', NOW, CLOCK),
                pushBackStampOf('after1CalendarMonth', NOW, CLOCK),
            ],
            [
                NOW + 15 * 60 * 1000,
                NOW + 30 * 60 * 1000,
                NOW + 60 * 60 * 1000,
                new Date(2026, 0, 16, 10, 20, 0, 0).getTime(),
                new Date(2026, 0, 22, 10, 20, 0, 0).getTime(),
                new Date(2026, 1, 15, 10, 20, 0, 0).getTime(),
            ],
            'minutes are elapsed time; days, weeks, and months are calendar moves',
        );
    });

    test('Next Day uses tomorrow at the item clock instead of tap time', () => {
        assertSame(
            pushBackStampOf('nextCalendarDayAtSavedTime', NOW, CLOCK),
            new Date(2026, 0, 16, 8, 45, 0, 0).getTime(),
            'the shifted occurrence keeps the item time',
        );
    });

    test('Page choices and banner actions use the same push-back definitions', () => {
        for (const categoryCode of bannerButtonsCodes()) {
            const choices = pushBackChoicesOf(categoryCode, CLOCK);
            const actions = pushBackActionsOf(categoryCode);
            assertSame(
                choices.map((choice) => [
                    choice.actionCode,
                    choice.buttonTitle,
                    choice.stampAt(NOW),
                ]),
                actions.map((action) => [
                    action.actionCode,
                    action.buttonTitle,
                    pushBackStampOf(action.pushBackCalculationCode, NOW, CLOCK),
                ]),
                `${categoryCode} reads one set of titles and calculations`,
            );
        }
    });
}
