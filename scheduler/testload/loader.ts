// Saves the sitting's items through saveReminderItems, which already runs
// the scheduler. A second load with the same preserve copy replaces only
// the test items and does not snapshot the test list as if it were his.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveReminderItems } from '../../modules/reminder-items';
import type { ReminderItem } from '../../modules/reminder-types';
import { buildCeilingItems, buildFeatureScenario } from './scenario';

export const PRESERVE_KEY = 'testload_preserve_v1';
export const LOADED_AT_KEY = 'testload_loaded_at';
export const PART1_KEY = 'testload_part1_done';
export const PART1_ROWS_KEY = 'testload_part1_rows';

const SNAPSHOT_KEYS = [
    'reminder_last_date',
    'reminder_morning_time',
    'reminder_midday_time',
    'reminder_evening_time',
    'my_history',
    'week_history',
    'lookahead_history',
    'onetime_history',
    'extended_history',
] as const;

export interface PreserveCopy {
    reminder_items: ReminderItem[];
    strings: Record<string, string | null>;
}

async function preserveIfNeeded(): Promise<void> {
    const existing = await AsyncStorage.getItem(PRESERVE_KEY);
    if (existing) return;

    const rawItems = await AsyncStorage.getItem('reminder_items');
    const parsed: ReminderItem[] = rawItems ? JSON.parse(rawItems) : [];
    const strings: Record<string, string | null> = {};
    for (const key of SNAPSHOT_KEYS) {
        strings[key] = await AsyncStorage.getItem(key);
    }
    const copy: PreserveCopy = {
        reminder_items: Array.isArray(parsed) ? parsed : [],
        strings,
    };
    await AsyncStorage.setItem(PRESERVE_KEY, JSON.stringify(copy));
}

export async function loadFeatureCases(): Promise<number> {
    await preserveIfNeeded();
    const loadAt = Date.now();
    const scenario = buildFeatureScenario(new Date(loadAt), loadAt);
    await saveReminderItems(scenario.items);
    await AsyncStorage.setItem(LOADED_AT_KEY, String(loadAt));
    await AsyncStorage.removeItem(PART1_KEY);
    await AsyncStorage.removeItem(PART1_ROWS_KEY);
    return loadAt;
}

export async function loadCeilingCases(): Promise<void> {
    await preserveIfNeeded();
    await saveReminderItems(buildCeilingItems());
    await AsyncStorage.removeItem(LOADED_AT_KEY);
    await AsyncStorage.removeItem(PART1_KEY);
    await AsyncStorage.removeItem(PART1_ROWS_KEY);
}

export async function readLoadedAt(): Promise<number | null> {
    const raw = await AsyncStorage.getItem(LOADED_AT_KEY);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}

export async function part1AlreadyDone(): Promise<boolean> {
    return (await AsyncStorage.getItem(PART1_KEY)) === '1';
}

export async function markPart1Done(): Promise<void> {
    await AsyncStorage.setItem(PART1_KEY, '1');
}
