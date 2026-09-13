// Controlled concurrency checks for the one physical saved-list queue.

import {
    createSavedReminderListStore,
    type ReminderListStorageBackend,
} from '../../modules/reminder-list-storage.ts';
import type { ReminderItem } from '../../modules/reminder-types.ts';
import { assert, assertSame, asyncTest } from './runner.ts';

interface Deferred {
    promise: Promise<void>;
    resolve: () => void;
}

function deferred(): Deferred {
    let resolve!: () => void;
    const promise = new Promise<void>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}

function memoryBackend(initial: ReminderItem[]): {
    storage: ReminderListStorageBackend;
    writes: string[];
} {
    let raw: string | null = JSON.stringify(initial);
    const writes: string[] = [];
    return {
        storage: {
            async getItem() {
                return raw;
            },
            async setItem(_key, value) {
                writes.push(value);
                raw = value;
            },
        },
        writes,
    };
}

function dailyItem(changes: Partial<ReminderItem> = {}): ReminderItem {
    return {
        id: 'daily',
        kind: 'daily',
        label: 'Breakfast',
        completed: true,
        ...changes,
    };
}

function personItem(): ReminderItem {
    return {
        id: 'person',
        kind: 'bucketlist',
        label: 'Call Pat',
    };
}

export async function runSavedListStorageTests(): Promise<void> {
    await asyncTest('A person change waits for an active rollover and keeps both results', async () => {
        const backend = memoryBackend([dailyItem()]);
        const store = createSavedReminderListStore(backend.storage);
        const rolloverStarted = deferred();
        const releaseRollover = deferred();

        const rollover = store.change(async (items) => {
            rolloverStarted.resolve();
            await releaseRollover.promise;
            return items.map((one) =>
                one.id === 'daily' ? { ...one, completed: false } : one
            );
        });
        await rolloverStarted.promise;
        const personChange = store.change((items) => [...items, personItem()]);
        releaseRollover.resolve();
        await Promise.all([rollover, personChange]);

        const final = await store.read();
        assertSame(
            final.items.map((one) => [one.id, one.completed]),
            [['daily', false], ['person', undefined]],
            'the later person change must read the rolled-over list',
        );
    });

    await asyncTest('A rollover waits for an active person change and keeps both results', async () => {
        const backend = memoryBackend([dailyItem()]);
        const store = createSavedReminderListStore(backend.storage);
        const personStarted = deferred();
        const releasePerson = deferred();

        const personChange = store.change(async (items) => {
            personStarted.resolve();
            await releasePerson.promise;
            return [...items, personItem()];
        });
        await personStarted.promise;
        const rollover = store.change((items) =>
            items.map((one) =>
                one.id === 'daily' ? { ...one, completed: false } : one
            )
        );
        releasePerson.resolve();
        await Promise.all([personChange, rollover]);

        const final = await store.read();
        assertSame(
            final.items.map((one) => [one.id, one.completed]),
            [['daily', false], ['person', undefined]],
            'the later rollover must read the list containing the person change',
        );
    });

    await asyncTest('A read waits for an active transaction and receives its finished result', async () => {
        const backend = memoryBackend([dailyItem()]);
        const store = createSavedReminderListStore(backend.storage);
        const transactionStarted = deferred();
        const releaseTransaction = deferred();

        const transaction = store.change(async (items) => {
            transactionStarted.resolve();
            await releaseTransaction.promise;
            return [...items, personItem()];
        });
        await transactionStarted.promise;

        let readFinished = false;
        const read = store.read().then((saved) => {
            readFinished = true;
            return saved;
        });
        await Promise.resolve();
        await Promise.resolve();
        assert(!readFinished, 'the read must still be waiting for the active transaction');

        releaseTransaction.resolve();
        await transaction;
        const saved = await read;
        assertSame(
            [saved.items.map((one) => one.id), saved.raw],
            [
                ['daily', 'person'],
                JSON.stringify([dailyItem(), personItem()]),
            ],
            'the waiting read must receive the transaction’s finished list and raw value',
        );
    });

    await asyncTest('Two ordinary patches both run in arrival order', async () => {
        const backend = memoryBackend([]);
        const store = createSavedReminderListStore(backend.storage);
        const order: string[] = [];

        const first = store.change((items) => {
            order.push(`first:${items.length}`);
            return [...items, dailyItem({ completed: false })];
        });
        const second = store.change((items) => {
            order.push(`second:${items.length}`);
            return [...items, personItem()];
        });
        await Promise.all([first, second]);

        const final = await store.read();
        assertSame(
            [order, final.items.map((one) => one.id), backend.writes.length],
            [['first:0', 'second:1'], ['daily', 'person'], 2],
            'each patch must run once against the result before it',
        );
    });
}
