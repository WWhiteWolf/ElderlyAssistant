import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { readBackupSettings } from './backup-settings';
import { readSavedReminderItems } from './reminder-list-storage';

// Bump this only when the backup shape changes, so Restore can reject a file
// whose shape this version does not understand.
export const BACKUP_VERSION = 3;

async function shareBackup(data: Record<string, string | null>): Promise<void> {
    try {
        const backup = {
            app: 'A Place To Remember',
            type: 'remember-backup',
            version: BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            data,
        };
        const json = JSON.stringify(backup, null, 2);

        const now = new Date();
        const stamp =
            `${now.getFullYear()}-` +
            `${String(now.getMonth() + 1).padStart(2, '0')}-` +
            `${String(now.getDate()).padStart(2, '0')}-` +
            `${String(now.getHours()).padStart(2, '0')}` +
            `${String(now.getMinutes()).padStart(2, '0')}`;
        const fileName = `Remember-Backup-${stamp}.json`;

        const file = new File(Paths.cache, fileName);
        if (file.exists) file.delete();
        file.create();
        file.write(json);

        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) {
            Alert.alert(
                'Sharing unavailable',
                `Your backup was saved as ${fileName}, but this device can't open the share screen.`,
            );
            return;
        }

        await Sharing.shareAsync(file.uri, {
            mimeType: 'application/json',
            UTI: 'public.json',
            dialogTitle: 'Save your Remember backup',
        });
    } catch {
        Alert.alert(
            'Export failed',
            'The backup file could not be created. No file was saved.',
        );
    }
}

/** Use the same export process from Backup & Restore and after a new item. */
export async function exportBackup(): Promise<void> {
    try {
        const [saved, lastDate, settings] = await Promise.all([
            readSavedReminderItems(),
            AsyncStorage.getItem('reminder_last_date'),
            readBackupSettings(AsyncStorage),
        ]);
        if (saved.failed) {
            throw new Error('The saved reminder list could not be read.');
        }
        const data: Record<string, string | null> = {
            reminder_items: saved.raw,
            reminder_last_date: lastDate,
            ...settings,
        };
        await shareBackup(data);
    } catch {
        Alert.alert(
            'Export failed',
            'Something went wrong while preparing your backup. No file was created.',
        );
    }
}
