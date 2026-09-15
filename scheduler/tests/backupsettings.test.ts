import {
    BACKUP_SETTING_KEYS,
    readBackupSettings,
    writeReplacedBackupSettings,
    type KeyValueStorage,
} from '../../modules/backup-settings.ts';
import { assert, assertSame, asyncTest } from './runner.ts';

function memorySettings(
    initial: Record<string, string | null> = {},
): { storage: KeyValueStorage; store: Record<string, string | null> } {
    const store: Record<string, string | null> = { ...initial };
    return {
        store,
        storage: {
            async getItem(key) {
                return key in store ? store[key] : null;
            },
            async setItem(key, value) {
                store[key] = value;
            },
            async removeItem(key) {
                delete store[key];
            },
        },
    };
}

export async function runBackupSettingsTests(): Promise<void> {
    await asyncTest('A read returns every Settings key the backup carries', async () => {
        const { storage } = memorySettings({
            user_name: 'Pat',
            app_theme: 'dark',
            popup_style: 'phone',
            look_lettering: '1',
            look_page: '-1',
            reminder_morning_time: '07:30',
            reminder_midday_time: '12:15',
            reminder_evening_time: '18:00',
        });
        const got = await readBackupSettings(storage);
        assertSame(Object.keys(got), [...BACKUP_SETTING_KEYS], 'the read uses the one Settings list');
        assertSame(got.user_name, 'Pat', 'the name is in the read');
        assertSame(got.app_theme, 'dark', 'the theme is in the read');
        assertSame(got.look_lettering, '1', 'Letters is in the read');
        assertSame(got.reminder_evening_time, '18:00', 'the evening time is in the read');
    });

    await asyncTest('A full restore writes keys the file has and leaves the rest', async () => {
        const { storage, store } = memorySettings({
            user_name: 'Old',
            app_theme: 'light',
            reminder_morning_time: '08:00',
        });
        await writeReplacedBackupSettings(storage, {
            user_name: 'Pat',
            app_theme: 'dark',
        });
        assertSame(store.user_name, 'Pat', 'the name comes from the file');
        assertSame(store.app_theme, 'dark', 'the theme comes from the file');
        assertSame(store.reminder_morning_time, '08:00', 'a missing file key is left as it is');
    });

    await asyncTest('A full restore clears a Settings key the file carries empty', async () => {
        const { storage, store } = memorySettings({
            user_name: 'Pat',
            app_theme: 'dark',
        });
        await writeReplacedBackupSettings(storage, {
            user_name: '',
            app_theme: null,
        });
        assert(!('user_name' in store), 'an empty name is removed');
        assert(!('app_theme' in store), 'a null theme is removed');
    });
}
