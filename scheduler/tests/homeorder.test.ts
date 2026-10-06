// Tests for the home page's own arrangement, including what a backup carries.

import {
    HOME_BADGE_ORDER_KEY,
    HOME_BADGES,
    homeArrangementFromBackup,
    homeOrderText,
    readHomeArrangement,
    writeHomeArrangement,
} from '../../modules/home-badges.ts';
import { assert, assertSame, asyncTest, test } from './runner.ts';

function memoryOrder(initial: string | null = null): {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    store: Record<string, string | null>;
} {
    const store: Record<string, string | null> = {};
    if (initial != null) store[HOME_BADGE_ORDER_KEY] = initial;
    return {
        store,
        async getItem(key) {
            return key in store ? store[key] : null;
        },
        async setItem(key, value) {
            store[key] = value;
        },
    };
}

export function runHomeOrderTests(): void {
    test('The saved text is the badge ids in the order Home shows', () => {
        const text = homeOrderText(HOME_BADGES);
        assertSame(JSON.parse(text)[0], HOME_BADGES[0].id, 'the first badge stays first');
        assertSame(JSON.parse(text).length, HOME_BADGES.length, 'every badge is in the text');
    });

    test('A backup list becomes that home arrangement, with every current badge', () => {
        const list = homeArrangementFromBackup('["daily","weekly"]');
        assert(list != null, 'the value is an arrangement');
        assertSame(list![0].id, 'daily', 'daily is first');
        assertSame(list!.map((one) => one.id).length, HOME_BADGES.length, 'a missing badge is still on Home');
    });

    test('An unknown badge is left out and the real ones remain', () => {
        const list = homeArrangementFromBackup('["not-a-page","daily"]');
        assert(list != null, 'the real badge is enough');
        assertSame(list![0].id, 'daily', 'daily leads');
        assert(!list!.some((one) => one.id === 'not-a-page'), 'the unknown badge is gone');
    });

    test('A missing or broken backup value is not an arrangement', () => {
        assertSame(homeArrangementFromBackup(null), null, 'nothing saved is not an arrangement');
        assertSame(homeArrangementFromBackup(''), null, 'an empty value is not an arrangement');
        assertSame(homeArrangementFromBackup('nope'), null, 'a broken value is not an arrangement');
    });
}

export async function runHomeOrderStorageTests(): Promise<void> {
    await asyncTest('Reading and writing use the home page order', async () => {
        const storage = memoryOrder('["daily","weekly"]');
        const read = await readHomeArrangement(storage);
        assertSame(read[0].id, 'daily', 'the saved order is what Home reads');
        await writeHomeArrangement(storage, read);
        assertSame(
            storage.store[HOME_BADGE_ORDER_KEY],
            homeOrderText(read),
            'the write is the same order, on the home page key',
        );
    });
}
