// Whether the last run worked, and what to say when it did not.
//
// Until this file existed the module could fail completely and the app looked
// exactly as it does when everything is well: every error was caught and turned
// into silence, so there was nothing to look at afterwards and no way to tell a
// real fault from a mis-set time.
//
// Nothing here touches storage, the phone, React Native or Expo. It is plain
// data and plain arithmetic, so Node can run every case of it on a Mac with no
// build and no simulator — the same shape as the six readers and the reconcile.
// The scheduler writes the record; the housing reads it and speaks.

/** Where the record of the last several runs is kept. */
export const HEALTH_KEY = 'reminder_health';

/** Where the note of what has already been said today is kept. */
export const NOTICE_SEEN_KEY = 'reminder_notice_seen';

/** Where the reminders that never reached Patrick are kept until he is told. */
export const MISSES_KEY = 'reminder_misses';

/**
 * How many runs are kept.
 *
 * More than one, because the module runs on launch, on every return to the
 * front and after every save — so a failure at breakfast would otherwise be
 * wiped out by a good run at noon, and there would be nothing left to chase.
 */
export const RUNS_KEPT = 10;

/**
 * One thing that went wrong in a run.
 *
 * Four of the six speak to Patrick. The other two are written down and never
 * interrupt him, because neither one stops a reminder arriving.
 */
export type RunFault =
    // The phone is not letting the app show reminders at all. Nothing was
    // armed, and nothing will arrive until it is turned back on.
    | { kind: 'permission' }
    // Some reminders could not be put onto the phone. They do not exist.
    | { kind: 'create'; count: number }
    // A saved list could not be read, so it was treated as empty — which means
    // that screen's reminders were worked out as none, and the ones already on
    // the phone were then taken off as leftovers.
    | { kind: 'list'; listKey: string }
    // The run stopped part-way on something unexpected.
    | { kind: 'stopped' }
    // The day did not roll over for one screen, so yesterday's checkmarks and
    // counts are still showing. Quiet: no reminder is lost by it.
    | { kind: 'reset'; listKey: string }
    // Yesterday's delivered banners could not be taken down. Quiet.
    | { kind: 'sweep' };

/** What one run did, and how it went. */
export interface RunRecord {
    /** When the run happened. */
    at: number;
    /** Everything that went wrong in it. Empty means it went well. */
    faults: RunFault[];
    /** How many reminders it put onto the phone. */
    created: number;
    /** How many it took off. */
    cancelled: number;
    /** How many were already right and were left alone. */
    kept: number;
}

/**
 * One reminder that never reached Patrick.
 *
 * This is the safety net under single moments. A repeating alarm fires whether
 * or not the app is ever opened; a single moment does not, because only the
 * next occurrence is ever on the phone. So a stretch away costs every
 * occurrence after the first, and his ruling is that the move is fine as long
 * as a missed firing is noted on opening.
 */
export interface Miss {
    itemId: string;
    /** The item's own name, as the page shows it. */
    label: string;
    /** Which screen it belongs to. */
    listKey: string;
    /** The day it was for, as the phone writes a date. */
    forDay: string;
}

/** What has already been said, and on which day. */
export interface NoticeSeen {
    /** The day it was said on, as the phone writes a date. */
    day: string;
    /** Which faults were tapped away that day. */
    dismissed: string[];
}

/** What the pop-up should show. */
export interface Notice {
    title: string;
    /** One line per fault and then one per miss, in the order below. */
    lines: string[];
    /** The last line, under the rest. */
    footer: string;
    /** The faults being shown, so tapping the pop-up away can name them. */
    signatures: string[];
    /** The misses being shown, which are cleared for good on that same tap. */
    missIds: string[];
}

export const NOTICE_TITLE = 'Some reminders did not reach you';

export const NOTICE_FOOTER =
    'Settings › Scheduled Reminders shows what your phone is holding.';

/**
 * The name a screen goes by on the home page.
 *
 * The record holds the storage key, because that is what the scheduler has in
 * its hand when a read fails. Patrick should never see a storage key.
 */
export function screenName(listKey: string): string {
    if (listKey === 'my_routine') return 'My Day';
    if (listKey === 'pets_feeds') return 'My Pets Day';
    if (listKey === 'week_routine') return 'My Week';
    if (listKey === 'lookahead_items') return 'Look Ahead';
    if (listKey === 'todo_tasks') return 'To-Do';
    if (listKey === 'memtest_session') return 'Memory Test';
    return listKey;
}

/**
 * Whether a fault is put in front of Patrick or only written down.
 *
 * The rule is his: the pop-up speaks when a reminder he is expecting will not
 * arrive, and stays quiet about anything else.
 */
export function faultSpeaks(fault: RunFault): boolean {
    return fault.kind === 'permission'
        || fault.kind === 'create'
        || fault.kind === 'list'
        || fault.kind === 'stopped';
}

/**
 * What names one fault, for the purpose of not saying it twice in a day.
 *
 * The count is deliberately left out of a 'create' signature: two reminders
 * failing this morning and three failing this afternoon are the same trouble,
 * and a pop-up that came back for the second would be the kind you learn to tap
 * away without reading.
 */
export function faultSignature(fault: RunFault): string {
    if (fault.kind === 'list' || fault.kind === 'reset') return `${fault.kind}:${fault.listKey}`;
    return fault.kind;
}

/** The sentence one fault puts on screen. */
export function faultSentence(fault: RunFault): string {
    if (fault.kind === 'permission') {
        return 'Your phone is not letting this app show reminders, so none of them '
            + "will arrive. You can turn it back on in the phone's own Settings, "
            + 'under Notifications.';
    }
    if (fault.kind === 'create') {
        return fault.count === 1
            ? '1 reminder could not be set on your phone. It is not there and will '
                + 'not arrive.'
            : `${fault.count} reminders could not be set on your phone. They are not `
                + 'there and will not arrive.';
    }
    if (fault.kind === 'list') {
        return `The app could not read your ${screenName(fault.listKey)} list, so none `
            + 'of its reminders were set.';
    }
    if (fault.kind === 'stopped') {
        return 'The app could not finish setting up your reminders. Some of them may '
            + 'not arrive.';
    }
    if (fault.kind === 'reset') {
        return `The day did not roll over for ${screenName(fault.listKey)}, so `
            + "yesterday's checkmarks are still showing.";
    }
    return "Yesterday's banners could not be taken down.";
}

/**
 * The sentence one miss puts on screen.
 *
 * Patrick's own wording, carried across whole from Still To Do. `yesterday` is
 * handed in rather than worked out, so that nothing here has to parse a date
 * the phone wrote in its own way.
 */
export function missSentence(miss: Miss, yesterday: string): string {
    const when = miss.forDay === yesterday ? 'yesterday' : miss.forDay;
    return `${miss.label} from ${when} is hanging!`;
}

/** One item, as much of it as working out a miss needs. */
export interface MissableItem {
    id: string;
    label: string;
    hour: number | null;
    minute: number | null;
    completed: boolean;
}

/**
 * What was missed, worked out at the moment the day rolls over.
 *
 * That moment is the only one where the truth can still be seen: the rollover
 * wipes the checkmarks, and afterwards yesterday's undone item and today's
 * not-yet-done item look exactly alike.
 *
 * An item with no time of day raises no reminder at all, so it can miss
 * nothing and is never counted here.
 *
 * `hadGap` says the app went unopened for at least a whole day. In that case
 * the checkmarks say nothing useful — they are the marks of the last day the
 * app was open, and every item's occurrence yesterday came and went with
 * nobody there to mark it — so every reminding item is a miss. Without a gap,
 * only the ones actually left undone are.
 *
 * Every miss is dated yesterday either way: with a gap, yesterday is simply the
 * most recent of the days that went by, and one miss per item is the rule.
 */
export function missesForRollover(
    items: MissableItem[],
    listKey: string,
    yesterday: string,
    hadGap: boolean,
): Miss[] {
    const misses: Miss[] = [];
    for (const item of items) {
        if (item.hour == null || item.minute == null) continue;
        if (!hadGap && item.completed) continue;
        misses.push({ itemId: item.id, label: item.label, listKey, forDay: yesterday });
    }
    return misses;
}

/**
 * Fold fresh misses into the ones already waiting to be told.
 *
 * One miss per item, the most recent (Patrick), so a fortnight away gives one
 * line per item rather than fourteen.
 */
export function mergeMisses(existing: Miss[], fresh: Miss[]): Miss[] {
    const merged = existing.filter(
        (old) => !fresh.some((one) => one.itemId === old.itemId && one.listKey === old.listKey),
    );
    return [...merged, ...fresh];
}

// Permission first, because it stops everything and it is the one Patrick can
// put right himself in a few taps. Then the reminders that are missing, then
// the run that did not finish.
const SPEAKING_ORDER = ['permission', 'create', 'list', 'stopped'];

/** Add a run to the record, keeping only the last several. */
export function addRun(records: RunRecord[], record: RunRecord): RunRecord[] {
    return [record, ...records].slice(0, RUNS_KEPT);
}

/**
 * What the pop-up should say, or nothing at all.
 *
 * It carries two kinds of thing, and one pop-up carries both because two
 * pop-ups stacking on opening is what teaches a person to tap without reading.
 * The faults come first — those are the app's own failures — and then the
 * misses, which are reminders that did not reach him for any other reason.
 *
 * Only the newest run is looked at for faults, because the pop-up describes how
 * things stand now: a fault cured since should not still be nagging. The older
 * runs are kept for chasing something, not for speaking.
 *
 * The two are silenced differently, and that is deliberate. A fault tapped away
 * is silent until the next day and comes back if it is still there, because it
 * is a state. A miss tapped away is gone for good, because it is an event and
 * he has now been told of it — and it is always shown before he has any chance
 * to deal with the item, since the app cannot be used without being opened.
 */
export function noticeFor(
    latest: RunRecord | null,
    seen: NoticeSeen | null,
    today: string,
    misses: Miss[] = [],
    yesterday = '',
): Notice | null {
    const speaking = latest ? latest.faults.filter(faultSpeaks) : [];
    const alreadySaid = seen && seen.day === today ? seen.dismissed : [];
    const toSay = speaking.filter((fault) => !alreadySaid.includes(faultSignature(fault)));

    if (toSay.length === 0 && misses.length === 0) return null;

    toSay.sort((a, b) => SPEAKING_ORDER.indexOf(a.kind) - SPEAKING_ORDER.indexOf(b.kind));

    return {
        title: NOTICE_TITLE,
        lines: [
            ...toSay.map(faultSentence),
            ...misses.map((miss) => missSentence(miss, yesterday)),
        ],
        footer: NOTICE_FOOTER,
        signatures: toSay.map(faultSignature),
        missIds: misses.map((miss) => `${miss.listKey}:${miss.itemId}`),
    };
}

/**
 * The note to write down when the pop-up is tapped away.
 *
 * What was already tapped away today is kept, so dismissing a new fault this
 * afternoon does not un-silence one dismissed this morning. A note from
 * yesterday is dropped rather than added to.
 */
export function markSeen(
    seen: NoticeSeen | null,
    signatures: string[],
    today: string,
): NoticeSeen {
    const carried = seen && seen.day === today ? seen.dismissed : [];
    const dismissed = [...carried];
    for (const signature of signatures) {
        if (!dismissed.includes(signature)) dismissed.push(signature);
    }
    return { day: today, dismissed };
}
