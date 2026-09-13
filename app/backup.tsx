import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { HeaderButton, PageFrame } from '../components/PageFrame';
import { Theme, useTheme } from '../constants/Themes';
import { applyReminderChange, type ReminderItem } from '../modules/reminder-items';
import { readSavedReminderItems } from '../modules/reminder-list-storage';
import { HEALTH_KEY, MISSES_KEY, NOTICE_SEEN_KEY } from '../scheduler/health.ts';
import { sanitizeCurrentReminderItems } from '../scheduler/translators/translate.ts';

// Format the backup file. Bump VERSION only if the shape changes,
// so a future Import can tell how to read an older file.
const BACKUP_VERSION = 3;

// Old page lists. Taken off the backup at #35-new. A restore still
// removes them so they cannot linger on the phone. The old log keys
// left the backup at #63-new; a restore strips them. Shopping, Vault,
// and Memory Test left at #76-new; a restore strips those too.
const RETIRED_KEYS = [
    'my_routine', 'my_last_date', 'my_coffee', 'my_water',
    'week_routine',
    'pets_feeds', 'pets_history', 'pets_last_date', 'pets_treats',
    'todo_tasks', 'todo_log',
    'planner_projects', 'planner_log',
    'lookahead_items',
    'lookahead_history',
    'my_history',
    'week_history',
    'onetime_history',
    'extended_history',
    'watchlist_movies', 'watchlist_shows',
    'orders_items', 'orders_history',
    'shopping_items',
    'memtest_session', 'memtest_history',
    'vault_items', 'vault_categories', 'vault_pin_enabled',
];

const HEALTH_KEYS = [HEALTH_KEY, MISSES_KEY, NOTICE_SEEN_KEY];

type RestoredBackup = {
    data: Record<string, string | null>;
    reminderItems: ReminderItem[];
};

function itemsFromBackup(raw: string | null | undefined): ReminderItem[] | null {
    if (raw == null) return [];
    if (typeof raw !== 'string' || !raw) return null;
    try {
        return sanitizeCurrentReminderItems(JSON.parse(raw));
    } catch {
        return null;
    }
}

function mergeReminderLists(current: ReminderItem[], incoming: ReminderItem[]): ReminderItem[] {
    const have = new Set(current.map((one) => one.id));
    const added = incoming.filter((one) => !have.has(one.id));
    return [...current, ...added];
}

export default function BackupScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const finishExport = async (data: Record<string, string | null>) => {
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
    };

    const handleExport = async () => {
        try {
            const [saved, lastDate] = await Promise.all([
                readSavedReminderItems(),
                AsyncStorage.getItem('reminder_last_date'),
            ]);
            if (saved.failed) {
                throw new Error('The saved reminder list could not be read.');
            }
            // Settings and page logs stay on the phone and are not written
            // here (#77-new). Keep the existing two-key backup shape.
            const data: Record<string, string | null> = {
                reminder_items: saved.raw,
                reminder_last_date: lastDate,
            };
            await finishExport(data);
        } catch {
            Alert.alert(
                'Export failed',
                'Something went wrong while preparing your backup. No file was created.',
            );
        }
    };

    const applyReplace = async (backup: RestoredBackup) => {
        try {
            await applyReminderChange(() => backup.reminderItems);
            const { data } = backup;
            if (typeof data.reminder_last_date === 'string') {
                await AsyncStorage.setItem('reminder_last_date', data.reminder_last_date);
            } else {
                await AsyncStorage.removeItem('reminder_last_date');
            }
            await AsyncStorage.multiRemove([...RETIRED_KEYS, ...HEALTH_KEYS]);

            Alert.alert('Replace complete', 'Your backup has been restored.', [
                { text: 'OK', onPress: () => router.replace('/home') },
            ]);
        } catch {
            Alert.alert(
                'Restore failed',
                'Something went wrong while restoring. Your data may be incomplete — you can try again.',
            );
        }
    };

    const applyMerge = async (backup: RestoredBackup) => {
        try {
            await applyReminderChange((current) =>
                mergeReminderLists(current, backup.reminderItems)
            );
            const { data } = backup;
            const existingDate = await AsyncStorage.getItem('reminder_last_date');
            if (existingDate == null && typeof data.reminder_last_date === 'string') {
                await AsyncStorage.setItem('reminder_last_date', data.reminder_last_date);
            }
            await AsyncStorage.multiRemove(RETIRED_KEYS);

            Alert.alert('Merge complete', 'Your backup has been merged.', [
                { text: 'OK', onPress: () => router.replace('/home') },
            ]);
        } catch {
            Alert.alert(
                'Restore failed',
                'Something went wrong while restoring. Your data may be incomplete — you can try again.',
            );
        }
    };

    const pickBackupFile = async (): Promise<RestoredBackup | null> => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets || !result.assets[0]) return null;

            const raw = await new File(result.assets[0].uri).text();

            let parsed: any;
            try {
                parsed = JSON.parse(raw);
            } catch {
                Alert.alert(
                    'Not a valid backup',
                    'That file could not be read as a backup. Nothing was changed.',
                );
                return null;
            }

            if (!parsed || parsed.type !== 'remember-backup' || !parsed.data) {
                Alert.alert(
                    'Not a backup from this app',
                    'That file is not a backup made by A Place To Remember. Nothing was changed.',
                );
                return null;
            }
            if (parsed.version !== BACKUP_VERSION) {
                Alert.alert(
                    'Not a current backup',
                    'That file is from an older backup. Nothing was changed.',
                );
                return null;
            }

            const data = parsed.data as Record<string, string | null>;
            const reminderItems = itemsFromBackup(data.reminder_items);
            if (reminderItems === null) {
                Alert.alert(
                    'Not a current backup',
                    'That file contains reminders this version of A Place To Remember does not recognize. Nothing was changed.',
                );
                return null;
            }
            return { data, reminderItems };
        } catch {
            Alert.alert(
                'Import failed',
                'Something went wrong while reading the file. Nothing was changed.',
            );
            return null;
        }
    };

    const handleReplace = async () => {
        const backup = await pickBackupFile();
        if (!backup) return;
        Alert.alert(
            'Replace reminders?',
            'This will replace the reminders currently in the app with the contents of this backup. Settings and page logs on the phone stay. The notes about missed reminders and whether reminders ran will come off. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Replace',
                    style: 'destructive',
                    onPress: () => applyReplace(backup),
                },
            ],
        );
    };

    const handleMerge = async () => {
        const backup = await pickBackupFile();
        if (!backup) return;
        Alert.alert(
            'Merge reminders?',
            'This will keep the reminders already in the app, and add from the backup only those that are not already here. Settings, page logs, and the notes about missed reminders stay. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Merge',
                    onPress: () => applyMerge(backup),
                },
            ],
        );
    };

    return (
        <View style={styles.container}>
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        <HeaderButton onPress={() => router.back()}>
                            <Text style={styles.headerBtnText}>Back</Text>
                        </HeaderButton>
                        <Text style={styles.title}>Backup & Restore</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                }
            >

            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.intro}>
                    Save your reminders to a file you can keep in Files, iCloud, or Google
                    Drive. Choose, replace, or merge to pick a file. Replace puts
                    the backup's reminders in place of what is here. Merge keeps what is
                    here and adds from the backup only what is not already here. Settings
                    and page logs stay on the phone.
                </Text>

                <TouchableOpacity style={styles.bigBtn} onPress={handleExport}>
                    <Text style={styles.bigBtnIcon}>⬆️</Text>
                    <Text style={styles.bigBtnText}>Export Backup</Text>
                    <Text style={styles.bigBtnSub}>Save a backup file</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bigBtn} onPress={handleReplace}>
                    <Text style={styles.bigBtnIcon}>⬇️</Text>
                    <Text style={styles.bigBtnText}>Replace from Backup</Text>
                    <Text style={styles.bigBtnSub}>Put the backup's reminders in place of these</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bigBtn} onPress={handleMerge}>
                    <Text style={styles.bigBtnIcon}>⬇️</Text>
                    <Text style={styles.bigBtnText}>Merge from Backup</Text>
                    <Text style={styles.bigBtnSub}>Keep these reminders and add what is missing</Text>
                </TouchableOpacity>
            </ScrollView>
            </PageFrame>
        </View>
    );
}

// Styles are built from the active theme when the page draws — the
// makeStyles(theme) pattern from home.tsx (#45).
const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            backgroundColor: t.header,
            paddingTop: 20,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        body: { padding: 20 },
        intro: {
            fontSize: 17,
            color: t.bodyText,
            lineHeight: 24,
            marginBottom: 28,
            textAlign: 'center',
        },
        bigBtn: {
            backgroundColor: t.card,
            borderRadius: 14,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            paddingVertical: 24,
            paddingHorizontal: 16,
            alignItems: 'center',
            marginBottom: 18,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
        },
        bigBtnIcon: {
            fontSize: 34,
            marginBottom: 8,
            ...(t.iconShadow
                ? {
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                  }
                : null),
        },
        bigBtnText: { fontSize: 22, fontWeight: '600', color: t.cardTitle },
        bigBtnSub: { fontSize: 15, color: t.mutedText, marginTop: 4 },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        headerSpacer: { width: 54 },
    });
