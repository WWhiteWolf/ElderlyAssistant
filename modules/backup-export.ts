import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { readBackupSettings } from './backup-settings';
import { homeOrderText, readHomeArrangement } from './home-badges';
import { readSavedReminderItems } from './reminder-list-storage';

// Bump this only when the backup shape changes, so Restore can reject a file
// whose shape this version does not understand.
export const BACKUP_VERSION = 3;

function backupFileName(now: Date): string {
    const stamp =
        `${now.getFullYear()}-` +
        `${String(now.getMonth() + 1).padStart(2, '0')}-` +
        `${String(now.getDate()).padStart(2, '0')}-` +
        `${String(now.getHours()).padStart(2, '0')}` +
        `${String(now.getMinutes()).padStart(2, '0')}`;
    return `Remember-Backup-${stamp}.json`;
}

function pickerWasCancelled(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return message.toLowerCase().includes('cancel');
}

async function saveBackupIntoChosenFolder(json: string, fileName: string): Promise<void> {
    let directory;
    try {
        directory = await Directory.pickDirectoryAsync();
    } catch (error) {
        if (pickerWasCancelled(error)) return;
        throw error;
    }
    const file = directory.createFile(fileName, 'application/json');
    file.write(json);
    Alert.alert('Backup saved', `Your backup was saved as ${fileName}.`);
}

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
        const fileName = backupFileName(new Date());

        if (Platform.OS === 'android') {
            await saveBackupIntoChosenFolder(json, fileName);
            return;
        }

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
        const [saved, lastDate, settings, arrangement] = await Promise.all([
            readSavedReminderItems(),
            AsyncStorage.getItem('reminder_last_date'),
            readBackupSettings(AsyncStorage),
            readHomeArrangement(AsyncStorage),
        ]);
        if (saved.failed) {
            throw new Error('The saved reminder list could not be read.');
        }
        const data: Record<string, string | null> = {
            reminder_items: saved.raw,
            reminder_last_date: lastDate,
            home_badge_order: homeOrderText(arrangement),
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
