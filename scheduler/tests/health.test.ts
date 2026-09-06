// Tests for the record of how a run went, and for what the pop-up says.

import {
    NOTICE_FOOTER,
    NOTICE_TITLE,
    RUNS_KEPT,
    addRun,
    faultSentence,
    faultSignature,
    faultSpeaks,
    markSeen,
    mergeMisses,
    missSentence,
    missesForRollover,
    noticeFor,
    screenName,
} from '../health.ts';
import type { MissableItem, RunFault, RunRecord } from '../health.ts';
import { assert, assertSame, test } from './runner.ts';

const TODAY = '8/25/2026';
const YESTERDAY = '8/24/2026';
const LAST_WEEK = '8/18/2026';

function run(faults: RunFault[] = [], changes: Partial<RunRecord> = {}): RunRecord {
    return { at: 1000, faults, created: 0, cancelled: 0, kept: 0, ...changes };
}

function item(changes: Partial<MissableItem> = {}): MissableItem {
    return { id: '1', label: 'Take pills', hour: 8, minute: 0, completed: false, ...changes };
}

export function runHealthTests(): void {
    // Which faults reach Patrick at all.

    test('A reminder that could not be set speaks', () => {
        assert(faultSpeaks({ kind: 'create', count: 1 }), 'expected it to speak');
    });

    test('Permission being off speaks', () => {
        assert(faultSpeaks({ kind: 'permission' }), 'expected it to speak');
    });

    test('A list that could not be read speaks', () => {
        assert(faultSpeaks({ kind: 'list', listKey: 'reminder_items' }), 'expected it to speak');
    });

    test('A run that stopped part-way speaks', () => {
        assert(faultSpeaks({ kind: 'stopped' }), 'expected it to speak');
    });

    test('The day failing to roll over speaks', () => {
        assert(faultSpeaks({ kind: 'reset', listKey: 'reminder_items' }), 'expected it to speak');
    });

    test("Yesterday's banners staying up stays quiet", () => {
        assert(!faultSpeaks({ kind: 'sweep' }), 'expected silence');
    });

    // The sentences.

    test('Each live scheduler record has its current name', () => {
        assertSame(
            [screenName('reminder_items'), screenName('weekly')],
            ['reminders', 'Weekly'],
            'the wrong names',
        );
    });

    test('A storage key nobody has named falls back to itself', () => {
        assert(screenName('something_else') === 'something_else', 'expected the key back');
    });

    test('One reminder failing is said in the singular', () => {
        const said = faultSentence({ kind: 'create', count: 1 });
        assert(said.startsWith('1 reminder could not be set'), said);
        assert(said.includes('It is not there'), said);
    });

    test('Several reminders failing are said in the plural', () => {
        const said = faultSentence({ kind: 'create', count: 3 });
        assert(said.startsWith('3 reminders could not be set'), said);
        assert(said.includes('They are not there'), said);
    });

    test('An unreadable list names the page, never the storage key', () => {
        const said = faultSentence({ kind: 'list', listKey: 'weekly' });
        assert(said.includes('Weekly'), said);
        assert(!said.includes('weekly'), said);
        assert(said.includes('left as they are'), 'it must not claim the reminders were taken off');
    });

    test('Permission being off says where to put it right', () => {
        const said = faultSentence({ kind: 'permission' });
        assert(said.includes('Settings'), said);
        assert(said.includes('Notifications'), said);
    });

    // What names a fault, for the purpose of not repeating it.

    test('The count is left out of what names a failed create', () => {
        assert(
            faultSignature({ kind: 'create', count: 2 }) === faultSignature({ kind: 'create', count: 5 }),
            'expected two counts to name the same trouble',
        );
    });

    test('Two different lists are two different faults', () => {
        assert(
            faultSignature({ kind: 'list', listKey: 'reminder_items' })
                !== faultSignature({ kind: 'list', listKey: 'weekly' }),
            'expected different names',
        );
    });

    test('A quiet fault and a loud one about the same list are not confused', () => {
        assert(
            faultSignature({ kind: 'list', listKey: 'reminder_items' })
                !== faultSignature({ kind: 'reset', listKey: 'reminder_items' }),
            'expected different names',
        );
    });

    // Keeping the runs.

    test('The newest run goes at the front', () => {
        const after = addRun([run([], { at: 1 })], run([], { at: 2 }));
        assert(after[0].at === 2, 'expected the newest first');
    });

    test('Only the last several runs are kept', () => {
        let records: RunRecord[] = [];
        for (let i = 0; i < RUNS_KEPT + 5; i++) records = addRun(records, run([], { at: i }));
        assert(records.length === RUNS_KEPT, `expected ${RUNS_KEPT}, got ${records.length}`);
    });

    test('A failure at breakfast survives a good run at noon', () => {
        let records = addRun([], run([{ kind: 'stopped' }], { at: 1 }));
        records = addRun(records, run([], { at: 2 }));
        assert(records[1].faults.length === 1, 'expected the earlier failure still there');
    });

    // What the pop-up says.

    test('A run that went well says nothing', () => {
        assert(noticeFor(run(), null, TODAY) === null, 'expected silence');
    });

    test('A module that has never run says nothing', () => {
        assert(noticeFor(null, null, TODAY) === null, 'expected silence');
    });

    test('A run with only a sweep fault says nothing', () => {
        const notice = noticeFor(run([{ kind: 'sweep' }]), null, TODAY);
        assert(notice === null, 'expected silence');
    });

    test('A failed day rollover raises the pop-up', () => {
        const notice = noticeFor(run([{ kind: 'reset', listKey: 'reminder_items' }]), null, TODAY);
        assert(notice !== null, 'expected a notice');
        assert(notice!.lines[0].includes('did not roll over'), notice!.lines[0]);
    });

    test('A sweep fault is left out when a reset fault speaks', () => {
        const notice = noticeFor(run([{ kind: 'sweep' }, { kind: 'reset', listKey: 'reminder_items' }]), null, TODAY);
        assert(notice!.lines.length === 1, `expected one line, got ${notice!.lines.length}`);
    });

    test('A loud fault carries the heading and the footer', () => {
        const notice = noticeFor(run([{ kind: 'stopped' }]), null, TODAY);
        assert(notice !== null, 'expected a notice');
        assert(notice!.title === NOTICE_TITLE, notice!.title);
        assert(notice!.footer === NOTICE_FOOTER, notice!.footer);
    });

    test('A quiet fault is left out of a notice raised by a loud one', () => {
        const notice = noticeFor(run([{ kind: 'sweep' }, { kind: 'stopped' }]), null, TODAY);
        assert(notice!.lines.length === 1, `expected one line, got ${notice!.lines.length}`);
    });

    test('Permission is said first, then the missing reminders, then the run', () => {
        const notice = noticeFor(
            run([{ kind: 'stopped' }, { kind: 'list', listKey: 'reminder_items' }, { kind: 'create', count: 1 }, { kind: 'permission' }]),
            null,
            TODAY,
        );
        assertSame(
            notice!.signatures,
            ['permission', 'create', 'list:reminder_items', 'stopped'],
            'the wrong order',
        );
    });

    // The once-a-day rule.

    test('A fault tapped away today is not said again today', () => {
        const seen = markSeen(null, ['stopped'], TODAY);
        assert(noticeFor(run([{ kind: 'stopped' }]), seen, TODAY) === null, 'expected silence');
    });

    test('A fault tapped away yesterday is said again today', () => {
        const seen = markSeen(null, ['stopped'], YESTERDAY);
        assert(noticeFor(run([{ kind: 'stopped' }]), seen, TODAY) !== null, 'expected it said again');
    });

    test('A fault not yet tapped away shows at once, beside a dismissed one', () => {
        const seen = markSeen(null, ['stopped'], TODAY);
        const notice = noticeFor(run([{ kind: 'stopped' }, { kind: 'permission' }]), seen, TODAY);
        assertSame(notice!.signatures, ['permission'], 'expected only the new one');
    });

    test('More reminders failing later the same day does not nag', () => {
        const seen = markSeen(null, ['create'], TODAY);
        assert(noticeFor(run([{ kind: 'create', count: 9 }]), seen, TODAY) === null, 'expected silence');
    });

    test('Dismissing this afternoon keeps what was dismissed this morning', () => {
        const morning = markSeen(null, ['permission'], TODAY);
        const afternoon = markSeen(morning, ['stopped'], TODAY);
        assertSame(afternoon.dismissed, ['permission', 'stopped'], 'lost the morning');
    });

    test("Yesterday's note is dropped rather than added to", () => {
        const before = markSeen(null, ['permission'], YESTERDAY);
        const after = markSeen(before, ['stopped'], TODAY);
        assertSame(after, { day: TODAY, dismissed: ['stopped'] }, 'expected a fresh note');
    });

    test('Tapping the same fault away twice does not write it down twice', () => {
        const once = markSeen(null, ['stopped'], TODAY);
        const twice = markSeen(once, ['stopped'], TODAY);
        assertSame(twice.dismissed, ['stopped'], 'expected one entry');
    });

    test('Only the newest run is spoken about, so a cured fault stops nagging', () => {
        const records = addRun([run([{ kind: 'stopped' }], { at: 1 })], run([], { at: 2 }));
        assert(noticeFor(records[0], null, TODAY) === null, 'expected silence');
    });

    // The reminders that never reached him.

    test('An item left undone yesterday is a miss', () => {
        const misses = missesForRollover([item()], 'reminder_items', YESTERDAY, false);
        assertSame(
            misses,
            [{ itemId: '1', label: 'Take pills', listKey: 'reminder_items', forDay: YESTERDAY }],
            'expected one miss',
        );
    });

    test('An item done yesterday is not a miss', () => {
        const misses = missesForRollover([item({ completed: true })], 'reminder_items', YESTERDAY, false);
        assert(misses.length === 0, 'expected no miss');
    });

    test('An item with no time of day can miss nothing', () => {
        const misses = missesForRollover(
            [item({ hour: null, minute: null })],
            'reminder_items',
            YESTERDAY,
            false,
        );
        assert(misses.length === 0, 'expected no miss');
    });

    test('After a stretch away even a checked item is a miss', () => {
        const misses = missesForRollover([item({ completed: true })], 'reminder_items', YESTERDAY, true);
        assert(misses.length === 1, 'expected the miss');
    });

    test('A stretch away still gives one miss per item, dated yesterday', () => {
        const misses = missesForRollover(
            [item({ id: '1' }), item({ id: '2' })],
            'reminder_items',
            YESTERDAY,
            true,
        );
        assertSame(misses.map((m) => m.forDay), [YESTERDAY, YESTERDAY], 'expected yesterday');
    });

    test('A fresh miss replaces the one already waiting for that item', () => {
        const waiting = [{ itemId: '1', label: 'Take pills', listKey: 'reminder_items', forDay: LAST_WEEK }];
        const merged = mergeMisses(waiting, missesForRollover([item()], 'reminder_items', YESTERDAY, false));
        assertSame(merged.map((m) => m.forDay), [YESTERDAY], 'expected the newer one only');
    });

    test('The same item under two live records is two misses', () => {
        const waiting = [{ itemId: '1', label: 'Take pills', listKey: 'weekly', forDay: YESTERDAY }];
        const merged = mergeMisses(waiting, missesForRollover([item()], 'reminder_items', YESTERDAY, false));
        assert(merged.length === 2, `expected two, got ${merged.length}`);
    });

    test("A miss from yesterday is said as 'yesterday'", () => {
        const said = missSentence(
            { itemId: '1', label: 'Take pills', listKey: 'reminder_items', forDay: YESTERDAY },
            YESTERDAY,
        );
        assert(said === 'Take pills from yesterday is hanging!', said);
    });

    test('An older miss is said by its date', () => {
        const said = missSentence(
            { itemId: '1', label: 'Take pills', listKey: 'reminder_items', forDay: LAST_WEEK },
            YESTERDAY,
        );
        assert(said === `Take pills from ${LAST_WEEK} is hanging!`, said);
    });

    test('A miss raises the pop-up on its own, with no fault at all', () => {
        const misses = missesForRollover([item()], 'reminder_items', YESTERDAY, false);
        const notice = noticeFor(run(), null, TODAY, misses, YESTERDAY);
        assert(notice !== null, 'expected a notice');
        assertSame(notice!.lines, ['Take pills from yesterday is hanging!'], 'the wrong line');
    });

    test('The faults are said before the misses', () => {
        const misses = missesForRollover([item()], 'reminder_items', YESTERDAY, false);
        const notice = noticeFor(run([{ kind: 'permission' }]), null, TODAY, misses, YESTERDAY);
        assert(notice!.lines.length === 2, `expected two lines, got ${notice!.lines.length}`);
        assert(notice!.lines[1].includes('hanging'), 'expected the miss last');
    });

    test('A miss is shown even when its fault was already tapped away today', () => {
        const seen = markSeen(null, ['permission'], TODAY);
        const misses = missesForRollover([item()], 'reminder_items', YESTERDAY, false);
        const notice = noticeFor(run([{ kind: 'permission' }]), seen, TODAY, misses, YESTERDAY);
        assertSame(notice!.lines, ['Take pills from yesterday is hanging!'], 'expected the miss alone');
    });

    test('The misses shown are named so they can be cleared for good', () => {
        const misses = missesForRollover([item()], 'reminder_items', YESTERDAY, false);
        const notice = noticeFor(run(), null, TODAY, misses, YESTERDAY);
        assertSame(notice!.missIds, ['reminder_items:1'], 'the wrong names');
    });

    test('No faults and no misses is still silence', () => {
        assert(noticeFor(run(), null, TODAY, [], YESTERDAY) === null, 'expected silence');
    });
}
