// Tests for the queue view.
//
// Every one of them fixes the moment rather than reading the clock, so the
// answers do not change from one day to the next.

import {
    describeHowFull,
    describeTrigger,
    describeWhatIsNotShown,
    describeWhenNext,
    formatClock,
    formatDay,
    formatMoment,
    groupByWhen,
    groupFor,
    lastDueTime,
    repeats,
    toPending,
} from '../queueview.ts';
import type { PendingReminder } from '../queueview.ts';
import type { QueueEntry } from '../reconcile.ts';
import { assert, assertSame, test } from './runner.ts';

// Friday, August 21 2026 at 10:00 in the morning.
const NOW = new Date(2026, 7, 21, 10, 0, 0, 0).getTime();

/** A moment on a day of that same August, for the tests to compare against. */
function moment(day: number, hour: number, minute = 0): number {
    return new Date(2026, 7, day, hour, minute, 0, 0).getTime();
}

function entry(changes: Partial<QueueEntry> = {}): QueueEntry {
    return {
        identifier: 'phone-1',
        key: 'daily:1:base',
        source: 'daily',
        label: 'Morning pills',
        itemId: '1',
        title: 'Daily Routine',
        body: 'Time for Morning pills!',
        categoryIdentifier: 'routineactions',
        trigger: { kind: 'daily', hour: 8, minute: 0 },
        ...changes,
    };
}

function pending(changes: Partial<PendingReminder> = {}): PendingReminder {
    return {
        identifier: 'phone-1',
        label: 'Morning pills',
        page: 'Daily',
        trigger: { kind: 'daily', hour: 8, minute: 0 },
        nextDue: moment(22, 8),
        lastDue: moment(21, 8),
        ...changes,
    };
}

export function runQueueViewTests(): void {
    // ---- When it was last due -------------------------------------------

    test('A daily reminder whose hour has passed was last due today', () => {
        assertSame(
            lastDueTime({ kind: 'daily', hour: 8, minute: 0 }, NOW),
            moment(21, 8),
            'expected eight this morning',
        );
    });

    test('A daily reminder whose hour is still ahead was last due yesterday', () => {
        assertSame(
            lastDueTime({ kind: 'daily', hour: 14, minute: 30 }, NOW),
            moment(20, 14, 30),
            'expected half past two yesterday',
        );
    });

    test('A weekly reminder on today, past its hour, was last due today', () => {
        // Weekday 6 is Friday, the phone counting Sunday as 1.
        assertSame(
            lastDueTime({ kind: 'weekly', weekday: 6, hour: 8, minute: 0 }, NOW),
            moment(21, 8),
            'expected eight this morning',
        );
    });

    test('A weekly reminder on today, still ahead, was last due a week ago', () => {
        assertSame(
            lastDueTime({ kind: 'weekly', weekday: 6, hour: 11, minute: 0 }, NOW),
            moment(14, 11),
            'expected last Friday',
        );
    });

    test('A weekly reminder earlier in the week was last due that day', () => {
        // Weekday 3 is Tuesday.
        assertSame(
            lastDueTime({ kind: 'weekly', weekday: 3, hour: 9, minute: 0 }, NOW),
            moment(18, 9),
            'expected Tuesday',
        );
    });

    test('A one-off already gone by was last due at its own moment', () => {
        assertSame(lastDueTime({ kind: 'date', at: moment(21, 9) }, NOW), moment(21, 9), 'expected nine');
    });

    test('A one-off still ahead has never been due', () => {
        assertSame(lastDueTime({ kind: 'date', at: moment(21, 16) }, NOW), null, 'expected nothing');
    });

    // ---- Turning a queue entry into a row --------------------------------

    test('A reminder from a page the screen knows becomes a row', () => {
        const row = toPending(entry(), NOW);
        assertSame(
            { label: row?.label, page: row?.page, nextDue: row?.nextDue, lastDue: row?.lastDue },
            { label: 'Morning pills', page: 'Daily', nextDue: moment(22, 8), lastDue: moment(21, 8) },
            'expected a Daily row',
        );
    });

    test('A Timer alert is left off the list', () => {
        assertSame(toPending(entry({ source: undefined }), NOW), null, 'expected nothing');
    });

    test('A reminder from a source the screen cannot name is left off too', () => {
        assertSame(toPending(entry({ source: 'somethingelse' }), NOW), null, 'expected nothing');
    });

    test('A Daily snooze is named separately from its base reminder', () => {
        const row = toPending(entry({ source: 'dailysnooze' }), NOW);
        assertSame(row?.page, 'Daily — snoozed', 'expected the snooze named');
    });

    test('A reminder with no name of its own still makes a readable row', () => {
        const row = toPending(entry({ label: '  ' }), NOW);
        assertSame(row?.label, 'Unnamed reminder', 'expected the fallback');
    });

    test('A reminder whose firing time cannot be read keeps its name but has no times', () => {
        const row = toPending(entry({ source: 'weeklysnooze', trigger: null }), NOW);
        assertSame(
            { page: row?.page, label: row?.label, nextDue: row?.nextDue, lastDue: row?.lastDue },
            { page: 'Weekly — snoozed', label: 'Morning pills', nextDue: null, lastDue: null },
            'expected a named row with no times',
        );
    });

    test('The banner heading, sentence and buttons come across', () => {
        const row = toPending(entry(), NOW);
        assertSame(
            { title: row?.title, body: row?.body, categoryIdentifier: row?.categoryIdentifier },
            { title: 'Daily Routine', body: 'Time for Morning pills!', categoryIdentifier: 'routineactions' },
            'expected the banner carried through',
        );
    });

    test('A weekly reminder is named Weekly', () => {
        assertSame(
            toPending(entry({ source: 'weekly', title: 'Weekly Chore' }), NOW)?.page,
            'Weekly',
            'expected Weekly',
        );
    });

    test('An Appointments reminder is named Appointments', () => {
        assertSame(
            toPending(entry({ source: 'onetime', title: '📋 Reminder: Dentist' }), NOW)?.page,
            'Appointments',
            'expected Appointments',
        );
    });

    test('Bucket List has no notification row', () => {
        assertSame(
            toPending(entry({ source: 'extended', title: '📋 Reminder: Paris' }), NOW),
            null,
            'Bucket List produces no reminder',
        );
    });

    test('A Monthly reminder takes its page name from its source', () => {
        assertSame(
            toPending(entry({ source: 'monthly', title: 'Different heading' }), NOW)?.page,
            'Monthly',
            'expected Monthly',
        );
    });

    test('A Quarterly reminder takes its page name from its source', () => {
        assertSame(
            toPending(entry({ source: 'quarterly', title: 'Different heading' }), NOW)?.page,
            'Quarterly',
            'expected Quarterly',
        );
    });

    test('A Yearly reminder takes its page name from its source', () => {
        assertSame(
            toPending(entry({ source: 'yearly', title: 'Different heading' }), NOW)?.page,
            'Yearly',
            'expected Yearly',
        );
    });

    test('Each delayed cadence keeps its own page name', () => {
        assertSame(
            [
                toPending(entry({ source: 'monthlydelay' }), NOW)?.page,
                toPending(entry({ source: 'quarterlydelay' }), NOW)?.page,
                toPending(entry({ source: 'yearlydelay' }), NOW)?.page,
            ],
            ['Monthly — delayed', 'Quarterly — delayed', 'Yearly — delayed'],
            'expected each delayed cadence named directly',
        );
    });

    // ---- Which heading a row falls under ---------------------------------

    test('Later today is Today', () => {
        assertSame(groupFor(pending({ nextDue: moment(21, 14) }), NOW), 'Today', 'expected Today');
    });

    test('Tomorrow morning is Tomorrow', () => {
        assertSame(groupFor(pending({ nextDue: moment(22, 8) }), NOW), 'Tomorrow', 'expected Tomorrow');
    });

    test('Four days out is This Week', () => {
        assertSame(groupFor(pending({ nextDue: moment(25, 9) }), NOW), 'This Week', 'expected This Week');
    });

    test('A week out falls past This Week', () => {
        assertSame(groupFor(pending({ nextDue: moment(28, 8) }), NOW), 'Later', 'expected Later');
    });

    test('A row with no time of its own has a heading of its own', () => {
        assertSame(groupFor(pending({ nextDue: null }), NOW), 'Time not known', 'expected the last heading');
    });

    // ---- Breaking the list up --------------------------------------------

    test('The headings come in their settled order', () => {
        const groups = groupByWhen(
            [
                pending({ identifier: 'd', nextDue: moment(30, 8) }),
                pending({ identifier: 'c', nextDue: null }),
                pending({ identifier: 'b', nextDue: moment(22, 8) }),
                pending({ identifier: 'a', nextDue: moment(21, 14) }),
            ],
            NOW,
        );
        assertSame(
            groups.map((g) => g.name),
            ['Today', 'Tomorrow', 'Later', 'Time not known'],
            'expected the settled order with the empty heading left out',
        );
    });

    test('Inside a heading the soonest comes first', () => {
        const groups = groupByWhen(
            [
                pending({ identifier: 'late', nextDue: moment(21, 20) }),
                pending({ identifier: 'early', nextDue: moment(21, 11) }),
                pending({ identifier: 'middle', nextDue: moment(21, 15) }),
            ],
            NOW,
        );
        assertSame(
            groups[0].reminders.map((r) => r.identifier),
            ['early', 'middle', 'late'],
            'expected soonest first',
        );
    });

    test('A heading with nothing under it is left out', () => {
        const groups = groupByWhen([pending({ nextDue: moment(22, 8) })], NOW);
        assertSame(groups.map((g) => g.name), ['Tomorrow'], 'expected only the one heading');
    });

    test('An empty queue makes no headings at all', () => {
        assertSame(groupByWhen([], NOW), [], 'expected nothing');
    });

    // ---- Saying it in words ----------------------------------------------

    test('Morning times read as the rest of the app writes them', () => {
        assertSame(formatClock(moment(21, 8, 5)), '8:05 AM', 'expected a padded morning time');
    });

    test('Midnight reads as twelve rather than zero', () => {
        assertSame(formatClock(moment(21, 0, 0)), '12:00 AM', 'expected midnight');
    });

    test('Noon reads as twelve in the afternoon', () => {
        assertSame(formatClock(moment(21, 12, 0)), '12:00 PM', 'expected noon');
    });

    test('A day reads with its weekday and its date', () => {
        assertSame(formatDay(NOW), 'Friday, August 21', 'expected the day named');
    });

    test('A whole moment joins the day and the time', () => {
        assertSame(formatMoment(moment(21, 16, 15)), 'Friday, August 21 at 4:15 PM', 'expected both');
    });

    test('A row due today shows the time alone, the heading having the day', () => {
        assertSame(describeWhenNext(pending({ nextDue: moment(21, 14) }), NOW), '2:00 PM', 'expected the time only');
    });

    test('A row due tomorrow shows the time alone as well', () => {
        assertSame(describeWhenNext(pending({ nextDue: moment(22, 8) }), NOW), '8:00 AM', 'expected the time only');
    });

    test('A row later in the week brings its weekday back', () => {
        assertSame(
            describeWhenNext(pending({ nextDue: moment(25, 9) }), NOW),
            'Tuesday at 9:00 AM',
            'expected the weekday',
        );
    });

    test('A row beyond this week shows the whole date', () => {
        assertSame(
            describeWhenNext(pending({ nextDue: moment(28, 8) }), NOW),
            'Friday, August 28 at 8:00 AM',
            'expected the whole date',
        );
    });

    test('A row with no time says so on its face', () => {
        assertSame(describeWhenNext(pending({ nextDue: null }), NOW), 'Time not known', 'expected the plain words');
    });

    test('A daily reminder says it comes every day', () => {
        assertSame(
            describeTrigger({ kind: 'daily', hour: 8, minute: 0 }),
            'Every day at 8:00 AM',
            'expected the daily sentence',
        );
    });

    test('A weekly reminder names its day', () => {
        assertSame(
            describeTrigger({ kind: 'weekly', weekday: 3, hour: 17, minute: 30 }),
            'Every Tuesday at 5:30 PM',
            'expected the weekly sentence',
        );
    });

    test('A one-off says it happens once', () => {
        assertSame(
            describeTrigger({ kind: 'date', at: moment(21, 16, 15) }),
            'Once, on Friday, August 21 at 4:15 PM',
            'expected the one-off sentence',
        );
    });

    test('A reminder with no known trigger says so plainly', () => {
        assert(describeTrigger(null).includes('no record'), 'expected the plain admission');
    });

    test('Daily and weekly repeat, a one-off does not', () => {
        assert(repeats({ kind: 'daily', hour: 8, minute: 0 }), 'expected daily to repeat');
        assert(repeats({ kind: 'weekly', weekday: 3, hour: 8, minute: 0 }), 'expected weekly to repeat');
        assert(!repeats({ kind: 'date', at: NOW }), 'expected a one-off not to repeat');
        assert(!repeats(null), 'expected an unknown one not to claim it repeats');
    });

    test('How full the phone is reads as a sentence', () => {
        assertSame(
            describeHowFull(23, 64),
            'Your phone is holding 23 reminders. It has room for 64.',
            'expected the plain sentence',
        );
    });

    test('One reminder is not called reminders', () => {
        assert(describeHowFull(1, 64).includes('1 reminder.'), 'expected the singular');
    });

    test('Nothing hidden means nothing is said about it', () => {
        assertSame(describeWhatIsNotShown(0), null, 'expected silence');
    });

    test('One hidden reminder is named in the singular', () => {
        assertSame(
            describeWhatIsNotShown(1),
            '1 more reminder is set by the Timer and not shown here.',
            'expected the singular',
        );
    });

    test('Several hidden reminders are named in the plural', () => {
        assertSame(
            describeWhatIsNotShown(3),
            '3 more reminders are set by the Timer and not shown here.',
            'expected the plural',
        );
    });
}
