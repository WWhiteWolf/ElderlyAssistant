import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
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
import { Theme, useTheme, useThemeControls } from '../constants/Themes';
import {
    writeReplacedBackupSettings,
} from '../modules/backup-settings';
import { BACKUP_VERSION, exportBackup } from '../modules/backup-export';
import { homeArrangementFromBackup, writeHomeArrangement } from '../modules/home-badges';
import { applyReminderChange, type ReminderItem } from '../modules/reminder-items';
import { HEALTH_KEY, MISSES_KEY, NOTICE_SEEN_KEY } from '../scheduler/health.ts';
import { sanitizeCurrentReminderItems } from '../scheduler/translators/translate.ts';

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
    const { reloadPreferences } = useThemeControls();
    const styles = makeStyles(theme);

    const handleExport = () => {
        void exportBackup();
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
            await writeReplacedBackupSettings(AsyncStorage, data);
            const arrangement = homeArrangementFromBackup(data.home_badge_order);
            if (arrangement) await writeHomeArrangement(AsyncStorage, arrangement);
            await reloadPreferences();
            await AsyncStorage.multiRemove(HEALTH_KEYS);

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
            'This will replace the reminders currently in the app with the contents of this backup. The name, the app look, the home arrangement, and the reminder times come from the backup when the file has them. The notes about missed reminders and whether reminders ran will come off. This cannot be undone.',
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
            'This will keep the reminders already in the app, and add from the backup only those that are not already here. Settings on this phone stay. The notes about missed reminders stay. This cannot be undone.',
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
                    the backup's reminders in place of what is here, and writes the
                    name, the app look, the home arrangement, and the reminder times
                    when the file has them. Merge keeps what is here and adds from the backup only
                    what is not already here. Merge leaves Settings, and the
                    home arrangement, as they are on this phone.
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
