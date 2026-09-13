import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReminderItem } from './reminder-types.ts';

const STORAGE_KEY = 'reminder_items';

export interface ReminderListStorageBackend {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
}

export interface SavedReminderListRead {
    items: ReminderItem[];
    failed: boolean;
    raw: string | null;
}

export type ReminderListChange = (
    items: ReminderItem[],
) => ReminderItem[] | Promise<ReminderItem[]>;

export interface SavedReminderListStore {
    read(): Promise<SavedReminderListRead>;
    change(patch: ReminderListChange): Promise<ReminderItem[]>;
}

/**
 * Make the one saved-list reader and transaction queue.
 *
 * The injected backend lets the queue be checked with controlled storage. The
 * live instance below uses AsyncStorage.
 */
export function createSavedReminderListStore(
    storage: ReminderListStorageBackend,
): SavedReminderListStore {
    let transactionTail: Promise<void> = Promise.resolve();

    const readRaw = async (): Promise<SavedReminderListRead> => {
        try {
            const raw = await storage.getItem(STORAGE_KEY);
            if (!raw) return { items: [], failed: false, raw };
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return { items: [], failed: true, raw };
            return { items: parsed as ReminderItem[], failed: false, raw };
        } catch {
            return { items: [], failed: true, raw: null };
        }
    };

    const read = async (): Promise<SavedReminderListRead> => {
        const earlierTransactions = transactionTail;
        await earlierTransactions;
        return readRaw();
    };

    const change = (
        patch: ReminderListChange,
    ): Promise<ReminderItem[]> => {
        const run = transactionTail.then(async () => {
            const current = await readRaw();
            if (current.failed) {
                throw new Error('The saved reminder list could not be read.');
            }
            const next = await patch(current.items);
            await storage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
        transactionTail = run.then(
            () => undefined,
            () => undefined,
        );
        return run;
    };

    return { read, change };
}

const savedReminderListStore = createSavedReminderListStore(AsyncStorage);

/** Read the list after every transaction that was already waiting. */
export function readSavedReminderItems(): Promise<SavedReminderListRead> {
    return savedReminderListStore.read();
}

/** Apply one distinct change to the latest list inside the physical queue. */
export function changeSavedReminderItems(
    patch: ReminderListChange,
): Promise<ReminderItem[]> {
    return savedReminderListStore.change(patch);
}
