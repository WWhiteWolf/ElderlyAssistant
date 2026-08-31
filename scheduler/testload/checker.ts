// Reads the real phone queue with readQueue and compares it to the
// scenario's expected list. It never asks the engine to calculate its
// own answer.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveReminderItems } from '../../modules/reminder-items';
import type { ReminderItem } from '../../modules/reminder-types';
import { readQueue } from '../scheduler';
import type { QueueEntry } from '../reconcile';
import { sameTrigger } from '../types';
import {
    IDS,
    LABELS,
    TEST_PREFIX,
    buildFeatureScenario,
    delayNotice,
    makeNoticeKey,
    nextDayNotice,
    renamedDailyNotice,
    tomorrowDailyNotice,
    type ExpectedNotice,
    type QueueCase,
} from './scenario';
import { PART1_ROWS_KEY, markPart1Done, part1AlreadyDone, readLoadedAt } from './loader';

export type Verdict = 'Pass' | 'Fail' | 'Look' | 'Waiting';

export interface ReportRow {
    id: string;
    name: string;
    verdict: Verdict;
    detail?: string;
}

interface HistoryEntry {
    id: string;
    sched: string;
}

async function readItems(): Promise<ReminderItem[]> {
    const raw = await AsyncStorage.getItem('reminder_items');
    const parsed: ReminderItem[] = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
}

function pad2(n: number): string {
    return String(n).padStart(2, '0');
}

function civilTime(ms: number): string {
    const d = new Date(ms);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())} on ${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function triggerAt(entry: QueueEntry): number | null {
    if (entry.trigger && entry.trigger.kind === 'date') return entry.trigger.at;
    return null;
}

function noticesFor(queue: QueueEntry[], itemId: string): QueueEntry[] {
    return queue.filter((one) => one.itemId === itemId);
}

function findExpected(queue: QueueEntry[], notice: ExpectedNotice): QueueEntry | undefined {
    const key = makeNoticeKey(notice);
    return queue.find((one) => one.key === key)
        ?? queue.find((one) => one.source === notice.source && one.itemId === notice.itemId);
}

function compareNotice(expected: ExpectedNotice, actual: QueueEntry | undefined): string | null {
    if (!actual) return 'missing notice';
    const bits: string[] = [];
    if ((actual.title ?? '') !== expected.title) {
        bits.push(`heading expected ${expected.title}, got ${actual.title ?? '(none)'}`);
    }
    if ((actual.body ?? '') !== expected.body) {
        bits.push(`sentence expected ${expected.body}, got ${actual.body ?? '(none)'}`);
    }
    if ((actual.categoryIdentifier ?? '') !== expected.categoryIdentifier) {
        bits.push(`buttons expected ${expected.categoryIdentifier}, got ${actual.categoryIdentifier ?? '(none)'}`);
    }
    if ((actual.label ?? '') !== expected.label) {
        bits.push(`name expected ${expected.label}, got ${actual.label ?? '(none)'}`);
    }
    if ((actual.source ?? '') !== expected.source) {
        bits.push(`source expected ${expected.source}, got ${actual.source ?? '(none)'}`);
    }
    if (!actual.trigger || !sameTrigger(expected.trigger, actual.trigger)) {
        const got = triggerAt(actual);
        const want = expected.trigger.kind === 'date' ? expected.trigger.at : null;
        bits.push(
            `time expected ${want != null ? civilTime(want) : '(none)'}, got ${got != null ? civilTime(got) : '(none)'}`,
        );
    }
    return bits.length ? bits.join('; ') : null;
}

function scoreQueueCase(c: QueueCase, queue: QueueEntry[], items: ReminderItem[]): ReportRow {
    if (c.lookHint && c.id === 'Q21') {
        return { id: c.id, name: c.name, verdict: 'Look', detail: c.lookHint };
    }
    const item = items.find((one) => one.id === c.itemId);
    if (!item) {
        return { id: c.id, name: c.name, verdict: 'Fail', detail: 'missing item' };
    }
    if (c.savedDay != null && item.day !== c.savedDay) {
        return {
            id: c.id,
            name: c.name,
            verdict: 'Fail',
            detail: `saved day expected ${c.savedDay}, got ${item.day ?? '(none)'}`,
        };
    }
    const actual = noticesFor(queue, c.itemId);
    if (c.notices.length === 0) {
        if (actual.length > 0) {
            return {
                id: c.id,
                name: c.name,
                verdict: 'Fail',
                detail: `extra notice at ${triggerAt(actual[0]) != null ? civilTime(triggerAt(actual[0]) as number) : '(none)'}`,
            };
        }
        return { id: c.id, name: c.name, verdict: 'Pass' };
    }
    const used = new Set<string>();
    for (const expected of c.notices) {
        const hit = findExpected(queue, expected);
        const diff = compareNotice(expected, hit);
        if (diff) return { id: c.id, name: c.name, verdict: 'Fail', detail: diff };
        if (hit?.identifier) used.add(hit.identifier);
    }
    const extra = actual.filter((one) => !used.has(one.identifier));
    if (extra.length > 0) {
        const got = triggerAt(extra[0]);
        return {
            id: c.id,
            name: c.name,
            verdict: 'Fail',
            detail: `extra notice at ${got != null ? civilTime(got) : '(none)'}`,
        };
    }
    return { id: c.id, name: c.name, verdict: 'Pass' };
}

async function writeItems(items: ReminderItem[]): Promise<void> {
    await saveReminderItems(items);
}

async function applyRename(): Promise<QueueEntry[]> {
    const items = await readItems();
    await writeItems(items.map((one) => (
        one.id === IDS.dailyBase ? { ...one, label: LABELS.dailyRenamed } : one
    )));
    return readQueue();
}

async function applyMonthlyPageDone(id: string): Promise<ReminderItem[]> {
    const items = await readItems();
    const next = items.map((one) => {
        if (one.id !== id) return one;
        const { snoozedUntil, ...rest } = one;
        void snoozedUntil;
        return rest;
    });
    await writeItems(next);
    return next;
}

async function appendHistory(key: string, label: string): Promise<void> {
    const raw = await AsyncStorage.getItem(key);
    const hist: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const now = new Date();
    const entry = {
        id: Date.now().toString(),
        date: now.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
        sched: label,
        actual: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
        what: '',
        note: '',
    };
    await AsyncStorage.setItem(key, JSON.stringify([entry, ...hist].slice(0, 50)));
}

async function historyHas(key: string, label: string): Promise<boolean> {
    const raw = await AsyncStorage.getItem(key);
    const hist: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    return hist.some((one) => one.sched === label);
}

function lookAheadForDate(itemId: string, label: string, at: Date): ExpectedNotice {
    return {
        source: 'lookahead',
        itemId,
        part: `${at.getFullYear()}${pad2(at.getMonth() + 1)}${pad2(at.getDate())}`,
        title: '🔭 Look Ahead',
        body: `Time for ${label}!`,
        label,
        categoryIdentifier: 'lookaheadactions',
        trigger: { kind: 'date', at: at.getTime() },
    };
}

async function scoreQ19(q1At: Date): Promise<ReportRow> {
    const queue = await applyRename();
    const expected = renamedDailyNotice(q1At);
    const diff = compareNotice(expected, findExpected(queue, expected));
    if (diff) return { id: 'Q19', name: LABELS.dailyRenamed, verdict: 'Fail', detail: diff };
    const oldBody = `Time for ${LABELS.dailyBase}!`;
    if (queue.some((one) => one.itemId === IDS.dailyBase && one.body === oldBody)) {
        return {
            id: 'Q19',
            name: LABELS.dailyRenamed,
            verdict: 'Fail',
            detail: 'old sentence is still queued',
        };
    }
    return { id: 'Q19', name: LABELS.dailyRenamed, verdict: 'Pass' };
}

async function scoreQ20(q20At: Date): Promise<ReportRow> {
    const items = await applyMonthlyPageDone(IDS.monthly15);
    const item = items.find((one) => one.id === IDS.monthly15);
    if (!item || item.day !== 15 || item.year !== q20At.getFullYear() || item.month !== q20At.getMonth()) {
        return {
            id: 'Q20',
            name: LABELS.monthly15,
            verdict: 'Fail',
            detail: `saved date expected the 15th, got ${item?.year ?? '?'}-${item?.month != null ? item.month + 1 : '?'}-${item?.day ?? '?'}`,
        };
    }
    const queue = await readQueue();
    const expected = lookAheadForDate(IDS.monthly15, LABELS.monthly15, q20At);
    const diff = compareNotice(expected, findExpected(queue, expected));
    if (diff) return { id: 'Q20', name: LABELS.monthly15, verdict: 'Fail', detail: diff };
    return { id: 'Q20', name: LABELS.monthly15, verdict: 'Pass' };
}

async function scoreC1(q1At: Date): Promise<ReportRow> {
    const target = Date.now() + 15 * 60 * 1000;
    const items = await readItems();
    await writeItems(items.map((one) => (
        one.id === IDS.dailyBase ? { ...one, snoozedUntil: target } : one
    )));
    const queue = await readQueue();
    const original = renamedDailyNotice(q1At);
    const delayed = delayNotice(IDS.dailyBase, LABELS.dailyRenamed, target);
    const missOriginal = compareNotice(original, findExpected(queue, original));
    if (missOriginal) {
        return { id: 'C1', name: 'Delay then the delayed notice', verdict: 'Fail', detail: missOriginal };
    }
    const missDelay = compareNotice(delayed, findExpected(queue, delayed));
    if (missDelay) return { id: 'C1', name: 'Delay then the delayed notice', verdict: 'Fail', detail: missDelay };
    const item = (await readItems()).find((one) => one.id === IDS.dailyBase);
    if (item?.completed) {
        return { id: 'C1', name: 'Delay then the delayed notice', verdict: 'Fail', detail: 'item is checked' };
    }
    return { id: 'C1', name: 'Delay then the delayed notice', verdict: 'Pass' };
}

async function scoreC2(now: Date): Promise<ReportRow> {
    const items = await readItems();
    const skip = items.find((one) => one.id === IDS.dailySkip);
    await writeItems(items.map((one) => {
        if (one.id !== IDS.dailySkip) return one;
        const { snoozedUntil, ...rest } = one;
        void snoozedUntil;
        return rest;
    }));
    const after = (await readItems()).find((one) => one.id === IDS.dailySkip);
    if (after?.completed) {
        return { id: 'C2', name: LABELS.dailySkip, verdict: 'Fail', detail: 'item is checked' };
    }
    if (await historyHas('my_history', LABELS.dailySkip)) {
        return { id: 'C2', name: LABELS.dailySkip, verdict: 'Fail', detail: 'Log has a line for it' };
    }
    const hour = typeof skip?.hour === 'number' ? skip.hour : now.getHours();
    const minute = typeof skip?.minute === 'number' ? skip.minute : now.getMinutes();
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    const expected = {
        source: 'myday',
        itemId: IDS.dailySkip,
        part: `${at.getFullYear()}${pad2(at.getMonth() + 1)}${pad2(at.getDate())}`,
        title: 'Daily Routine',
        body: `Time for ${LABELS.dailySkip}!`,
        label: LABELS.dailySkip,
        categoryIdentifier: 'routineactions',
        trigger: { kind: 'date' as const, at: at.getTime() },
    };
    const diff = compareNotice(expected, findExpected(await readQueue(), expected));
    if (diff) return { id: 'C2', name: LABELS.dailySkip, verdict: 'Fail', detail: diff };
    return { id: 'C2', name: LABELS.dailySkip, verdict: 'Pass' };
}

async function scoreC3(now: Date, hour: number, minute: number): Promise<ReportRow> {
    const items = await readItems();
    await writeItems(items.map((one) => {
        if (one.id !== IDS.dailyBase) return one;
        const { snoozedUntil, ...rest } = one;
        void snoozedUntil;
        return { ...rest, completed: true };
    }));
    await appendHistory('my_history', LABELS.dailyRenamed);
    const after = (await readItems()).find((one) => one.id === IDS.dailyBase);
    if (!after?.completed) {
        return { id: 'C3', name: 'Done, then tomorrow still arms', verdict: 'Fail', detail: 'item is not checked' };
    }
    if (!(await historyHas('my_history', LABELS.dailyRenamed))) {
        return { id: 'C3', name: 'Done, then tomorrow still arms', verdict: 'Fail', detail: 'Log has no line' };
    }
    const expected = tomorrowDailyNotice(IDS.dailyBase, LABELS.dailyRenamed, hour, minute, now);
    const diff = compareNotice(expected, findExpected(await readQueue(), expected));
    if (diff) return { id: 'C3', name: 'Done, then tomorrow still arms', verdict: 'Fail', detail: diff };
    return { id: 'C3', name: 'Done, then tomorrow still arms', verdict: 'Pass' };
}

async function scoreC4(shifted: boolean): Promise<ReportRow> {
    if (!shifted) {
        return {
            id: 'C4',
            name: 'Next Day on a shifted 31st',
            verdict: 'Look',
            detail: 'This sitting’s 31st fires on a day that exists, so Next Day has nothing to tap.',
        };
    }
    const items = await readItems();
    const item = items.find((one) => one.id === IDS.monthly31);
    if (!item) {
        return { id: 'C4', name: 'Next Day on a shifted 31st', verdict: 'Fail', detail: 'missing item' };
    }
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(
        typeof item.hour === 'number' ? item.hour : 12,
        typeof item.minute === 'number' ? item.minute : 0,
        0,
        0,
    );
    await writeItems(items.map((one) => (
        one.id === IDS.monthly31 ? { ...one, snoozedUntil: target.getTime() } : one
    )));
    const after = (await readItems()).find((one) => one.id === IDS.monthly31);
    if (after?.day !== 31) {
        return {
            id: 'C4',
            name: 'Next Day on a shifted 31st',
            verdict: 'Fail',
            detail: `saved day expected 31, got ${after?.day ?? '(none)'}`,
        };
    }
    const expected = nextDayNotice(IDS.monthly31, LABELS.monthly31, target.getTime());
    const diff = compareNotice(expected, findExpected(await readQueue(), expected));
    if (diff) return { id: 'C4', name: 'Next Day on a shifted 31st', verdict: 'Fail', detail: diff };
    return { id: 'C4', name: 'Next Day on a shifted 31st', verdict: 'Pass' };
}

function scoreLive(
    live: { id: string; name: string; itemId: string; fireAt: number; tap: string; after: string }[],
    queue: QueueEntry[],
    items: ReminderItem[],
    now: number,
): ReportRow[] {
    return live.map((one) => {
        if (now < one.fireAt) {
            return { id: one.id, name: one.name, verdict: 'Waiting', detail: `Tap ${one.tap}. ${one.after}` };
        }
        const item = items.find((it) => it.id === one.itemId);
        if (one.id === 'L1' && item?.completed) {
            return { id: one.id, name: one.name, verdict: 'Pass' };
        }
        if (one.id === 'L2' && !item?.completed && item?.snoozedUntil) {
            return { id: one.id, name: one.name, verdict: 'Pass' };
        }
        if (one.id === 'L3' && !item?.completed) {
            return { id: one.id, name: one.name, verdict: 'Look', detail: `${one.after} This banner’s time has already passed.` };
        }
        if (one.id === 'L4' && item?.completed) {
            return { id: one.id, name: one.name, verdict: 'Pass' };
        }
        if (one.id === 'L5' && item && !item.completed) {
            const still = noticesFor(queue, one.itemId);
            if (still.length === 0) return { id: one.id, name: one.name, verdict: 'Pass' };
        }
        return {
            id: one.id,
            name: one.name,
            verdict: 'Look',
            detail: `${one.after} This banner’s time has already passed.`,
        };
    });
}

function scoreReopen(queue: QueueEntry[]): ReportRow[] {
    const keys = queue.map((one) => one.key).filter((k): k is string => !!k);
    const seen = new Set<string>();
    const dups = new Set<string>();
    for (const key of keys) {
        if (seen.has(key)) dups.add(key);
        seen.add(key);
    }
    if (dups.size > 0) {
        return [
            { id: 'R1', name: 'Close and reopen', verdict: 'Fail', detail: 'duplicate notices' },
            { id: 'R2', name: 'Leave Daily on screen', verdict: 'Fail', detail: 'duplicate notices' },
        ];
    }
    return [
        {
            id: 'R1',
            name: 'Close and reopen',
            verdict: 'Look',
            detail: 'Open Daily. Send Memory to the background, then open it again. Yesterday’s ticks are not back. The test notices that should still be there still are.',
        },
        {
            id: 'R2',
            name: 'Leave Daily on screen',
            verdict: 'Look',
            detail: 'Leave Daily on screen, send Memory to the background, open it again without changing page. Daily still shows today, not yesterday’s ticks.',
        },
    ];
}

export function countLine(rows: ReportRow[]): string {
    const passed = rows.filter((r) => r.verdict === 'Pass').length;
    const failed = rows.filter((r) => r.verdict === 'Fail').length;
    const look = rows.filter((r) => r.verdict === 'Look').length;
    const waiting = rows.filter((r) => r.verdict === 'Waiting').length;
    const bits = [`${passed} passed`, `${failed} failed`, `${look} look`];
    if (waiting > 0) bits.push(`${waiting} waiting`);
    return bits.join(', ');
}

export async function runFeatureCheck(): Promise<ReportRow[]> {
    const loadAt = await readLoadedAt();
    if (loadAt == null) {
        return [{ id: '—', name: 'Load the cases first', verdict: 'Fail', detail: 'Nothing is loaded.' }];
    }
    const loaded = new Date(loadAt);
    const scenario = buildFeatureScenario(loaded, loadAt);
    const already = await part1AlreadyDone();
    const rows: ReportRow[] = [];

    if (already) {
        const cached = await AsyncStorage.getItem(PART1_ROWS_KEY);
        if (cached) {
            const parsed = JSON.parse(cached) as ReportRow[];
            if (Array.isArray(parsed)) rows.push(...parsed);
        }
    } else {
        const items = await readItems();
        const queue = await readQueue();
        for (const c of scenario.queueCases) {
            rows.push(scoreQueueCase(c, queue, items));
        }
        rows.push(await scoreQ19(scenario.q1At));
        rows.push(await scoreQ20(scenario.q20At));
        rows.push(await scoreC1(scenario.q1At));
        rows.push(await scoreC2(loaded));
        rows.push(await scoreC3(loaded, scenario.q1Hour, scenario.q1Minute));
        rows.push(await scoreC4(scenario.q14Shifted));
        await AsyncStorage.setItem(PART1_ROWS_KEY, JSON.stringify(rows));
        await markPart1Done();
    }

    const queue = await readQueue();
    const items = await readItems();
    rows.push(...scoreLive(scenario.live, queue, items, Date.now()));
    rows.push(...scoreReopen(queue));
    return rows;
}

export async function runCeilingCheck(): Promise<ReportRow[]> {
    const queue = await readQueue();
    const ours = queue.filter((one) => (one.itemId ?? '').startsWith(`${TEST_PREFIX}ceiling-`));
    const count = ours.length;
    if (count === 56) {
        return [{ id: 'Z1', name: 'Ceiling', verdict: 'Pass', detail: 'Fifty-six of ours on the queue.' }];
    }
    return [{
        id: 'Z1',
        name: 'Ceiling',
        verdict: 'Fail',
        detail: `expected 56 of ours, got ${count}`,
    }];
}
