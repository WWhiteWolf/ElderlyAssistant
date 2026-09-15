/** The one list of Settings keys that a backup carries. */
export const BACKUP_SETTING_KEYS = [
    'user_name',
    'app_theme',
    'popup_style',
    'look_lettering',
    'look_page',
    'reminder_morning_time',
    'reminder_midday_time',
    'reminder_evening_time',
] as const;

export type BackupSettingKey = (typeof BACKUP_SETTING_KEYS)[number];

export interface KeyValueStorage {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
}

export async function readBackupSettings(
    storage: KeyValueStorage,
): Promise<Record<string, string | null>> {
    const out: Record<string, string | null> = {};
    for (const key of BACKUP_SETTING_KEYS) {
        out[key] = await storage.getItem(key);
    }
    return out;
}

/** Write Settings from a backup file. Keys the file does not carry are left as they are. */
export async function writeReplacedBackupSettings(
    storage: KeyValueStorage,
    data: Record<string, string | null | undefined>,
): Promise<void> {
    for (const key of BACKUP_SETTING_KEYS) {
        if (!(key in data)) continue;
        const value = data[key];
        if (typeof value === 'string' && value !== '') {
            await storage.setItem(key, value);
        } else {
            await storage.removeItem(key);
        }
    }
}
