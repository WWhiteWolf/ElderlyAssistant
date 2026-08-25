// The pop-up that says a reminder is not going to arrive.
//
// This is the thin impure half of `health.ts`, the same split `warn.ts` has:
// every sentence and every rule about when to speak lives in the plain file
// where Node can test it, and this file only fetches, shows and writes down.
//
// It speaks on launch and on every return to the front, and never after a save
// — a save's own warning is `warn.ts`, which is about what the person just did.
// This one is about the app having failed, which is not their doing at all.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import { HEALTH_KEY, MISSES_KEY, NOTICE_SEEN_KEY, markSeen, noticeFor } from './health.ts';
import type { Miss, NoticeSeen, RunRecord } from './health.ts';

/** The last run the module wrote down, or nothing if it has never run. */
async function readLatestRun(): Promise<RunRecord | null> {
    const raw = await AsyncStorage.getItem(HEALTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed[0] as RunRecord;
}

/** What has already been tapped away, and on which day. */
async function readSeen(): Promise<NoticeSeen | null> {
    const raw = await AsyncStorage.getItem(NOTICE_SEEN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as NoticeSeen;
}

/** The reminders that never arrived and have not been told of yet. */
async function readMisses(): Promise<Miss[]> {
    const raw = await AsyncStorage.getItem(MISSES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Miss[]) : [];
}

/** Yesterday, written the way the phone writes a date. */
function yesterdaysDate(): string {
    const when = new Date();
    when.setDate(when.getDate() - 1);
    return when.toLocaleDateString();
}

/**
 * Show the pop-up, if the last run or the rolled-over day left anything to say.
 *
 * One tap takes it away. That tap silences the faults until the next day, and
 * clears the misses for good — a fault is a state that may still be true
 * tomorrow, a miss is something he has now been told about.
 */
export async function showHealthNotice(): Promise<void> {
    try {
        const today = new Date().toLocaleDateString();
        const seen = await readSeen();
        const misses = await readMisses();
        const notice = noticeFor(await readLatestRun(), seen, today, misses, yesterdaysDate());
        if (!notice) return;

        const message = [...notice.lines, notice.footer].join('\n\n');

        Alert.alert(notice.title, message, [
            {
                text: 'OK',
                onPress: () => {
                    // Written down after the tap, so a pop-up dismissed by
                    // something else — the app being closed on it — comes back.
                    // If either write fails the thing is simply said again,
                    // which is the safe way round.
                    AsyncStorage.setItem(
                        NOTICE_SEEN_KEY,
                        JSON.stringify(markSeen(seen, notice.signatures, today)),
                    ).catch(() => {});

                    if (notice.missIds.length > 0) {
                        const told = new Set(notice.missIds);
                        const left = misses.filter(
                            (miss) => !told.has(`${miss.listKey}:${miss.itemId}`),
                        );
                        AsyncStorage.setItem(MISSES_KEY, JSON.stringify(left)).catch(() => {});
                    }
                },
            },
        ]);
    } catch {
        // The notice failing is not worth a notice of its own.
    }
}
