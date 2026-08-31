// Restores the preserved list and settings, removes test ids, and lets
// the real scheduler reconcile the phone. It never clears all storage and
// never cancels every notification.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveReminderItems } from '../../modules/reminder-items';
import type { ReminderItem } from '../../modules/reminder-types';
import { TEST_PREFIX } from './scenario';
import { LOADED_AT_KEY, PART1_KEY, PART1_ROWS_KEY, PRESERVE_KEY, type PreserveCopy } from './loader';

export async function cleanupTestLoad(): Promise<void> {
    const raw = await AsyncStorage.getItem(PRESERVE_KEY);
    if (raw) {
        const copy = JSON.parse(raw) as PreserveCopy;
        for (const [key, value] of Object.entries(copy.strings ?? {})) {
            if (value == null) await AsyncStorage.removeItem(key);
            else await AsyncStorage.setItem(key, value);
        }
        const restored = Array.isArray(copy.reminder_items) ? copy.reminder_items : [];
        const withoutTest = restored.filter((one) => !one.id.startsWith(TEST_PREFIX));
        await saveReminderItems(withoutTest);
        await AsyncStorage.removeItem(PRESERVE_KEY);
    } else {
        const rawItems = await AsyncStorage.getItem('reminder_items');
        const parsed: ReminderItem[] = rawItems ? JSON.parse(rawItems) : [];
        const kept = Array.isArray(parsed) ? parsed.filter((one) => !one.id.startsWith(TEST_PREFIX)) : [];
        await saveReminderItems(kept);
    }
    await AsyncStorage.removeItem(LOADED_AT_KEY);
    await AsyncStorage.removeItem(PART1_KEY);
    await AsyncStorage.removeItem(PART1_ROWS_KEY);
}
