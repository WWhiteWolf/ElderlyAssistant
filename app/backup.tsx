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
import { applyReminderChange } from '../modules/reminder-items';

// Format the backup file. Bump VERSION only if the shape changes,
// so a future Import can tell how to read an older file.
const BACKUP_VERSION = 2;

// Everything that travels in the backup in plain (readable) form.
const READABLE_KEYS = [
    'reminder_items',
    'reminder_last_date',
    'daily_history',
    'weekly_history',
    'monthly_history',
    'quarterly_history',
    'yearly_history',
    'appointments_history',
    'bucket_list_history',
    'user_name', 'biometric_enabled',
    'reminder_morning_time', 'reminder_midday_time', 'reminder_evening_time',
    'app_theme', 'popup_style',
];

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
            const pairs = await AsyncStorage.multiGet(READABLE_KEYS);
            const data: Record<string, string | null> = {};
            pairs.forEach(([key, value]) => {
                data[key] = value;
            });
            await finishExport(data);
        } catch {
            Alert.alert(
                'Export failed',
                'Something went wrong while preparing your backup. No file was created.',
            );
        }
    };

    // Final step: overwrite storage with the backup, then go Home.
    // For a TRUE replace, any key not present in the backup is removed,
    // so nothing from the old data lingers.
    const applyRestore = async (data: Record<string, string | null>) => {
        try {
            const toSet: [string, string][] = [];
            const toRemove: string[] = [];

            READABLE_KEYS.forEach((key) => {
                const v = data[key];
                if (typeof v === 'string') toSet.push([key, v]);
                else toRemove.push(key);
            });

            if (toSet.length) await AsyncStorage.multiSet(toSet);
            if (toRemove.length) await AsyncStorage.multiRemove(toRemove);
            await AsyncStorage.multiRemove(RETIRED_KEYS);

            // Write the one list from the restored copy, so reminders still arm.
            await applyReminderChange((items) => items);

            Alert.alert('Restore complete', 'Your backup has been restored.', [
                { text: 'OK', onPress: () => router.replace('/home') },
            ]);
        } catch {
            Alert.alert(
                'Restore failed',
                'Something went wrong while restoring. Your data may be incomplete — you can try the import again.',
            );
        }
    };

    // The "are you sure" gate — nothing is overwritten until this is confirmed.
    const confirmAndRestore = (data: Record<string, string | null>) => {
        Alert.alert(
            'Replace Everything?',
            'This will replace everything currently in the app — your lists, routines, and settings — with the contents of this backup. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Replace',
                    style: 'destructive',
                    onPress: () => applyRestore(data),
                },
            ],
        );
    };

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets || !result.assets[0]) return;

            const raw = await new File(result.assets[0].uri).text();

            let parsed: any;
            try {
                parsed = JSON.parse(raw);
            } catch {
                Alert.alert(
                    'Not a valid backup',
                    'That file could not be read as a backup. Nothing was changed.',
                );
                return;
            }

            if (!parsed || parsed.type !== 'remember-backup' || !parsed.data) {
                Alert.alert(
                    'Not a backup from this app',
                    'That file is not a backup made by A Place To Remember. Nothing was changed.',
                );
                return;
            }
            if (parsed.version !== BACKUP_VERSION) {
                Alert.alert(
                    'Not a current backup',
                    'That file is from an older backup. Nothing was changed.',
                );
                return;
            }

            confirmAndRestore(parsed.data);
        } catch {
            Alert.alert(
                'Import failed',
                'Something went wrong while reading the file. Nothing was changed.',
            );
        }
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
                    Save all your lists, routines, and settings to a file you can keep in
                    Files, iCloud, or Google Drive. If the app is ever reinstalled, import
                    that file to bring everything back.
                </Text>

                <TouchableOpacity style={styles.bigBtn} onPress={handleExport}>
                    <Text style={styles.bigBtnIcon}>⬆️</Text>
                    <Text style={styles.bigBtnText}>Export Backup</Text>
                    <Text style={styles.bigBtnSub}>Save a backup file</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bigBtn} onPress={handleImport}>
                    <Text style={styles.bigBtnIcon}>⬇️</Text>
                    <Text style={styles.bigBtnText}>Import Backup</Text>
                    <Text style={styles.bigBtnSub}>Restore from a backup file</Text>
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
