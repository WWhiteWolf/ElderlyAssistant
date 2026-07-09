import 'react-native-get-random-values'; // must load before crypto-js so AES has a secure RNG
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';

// Format the backup file. Bump VERSION only if the shape changes,
// so a future Import can tell how to read an older file.
const BACKUP_VERSION = 1;

// Everything that travels in the backup in plain (readable) form.
// Deliberately EXCLUDES user_pin and pin_set (the retired PIN), and
// vault_items (handled separately, encrypted).
const READABLE_KEYS = [
    'my_routine', 'my_history', 'my_last_date', 'my_coffee', 'my_water',
    'week_routine', 'week_history',
    'pets_feeds', 'pets_history', 'pets_last_date', 'pets_treats',
    'todo_tasks', 'todo_log', // todo_categories dropped (#42): categories removed from To-Do
    'shopping_items',
    'planner_projects', 'planner_log',
    'lookahead_items', 'lookahead_history',   // missing since #36 built the page (#57 fix)
    'watchlist_movies', 'watchlist_shows',    // missing since #41 brought Watch List in (#57 fix)
    'orders_items', 'orders_history',         // Orders page (#63), added the session it was built
    'memtest_session', 'memtest_history',     // Memory Test page, added the session it was built
    'vault_categories',                       // user-defined Vault categories (#67) — names only; the items stay in the encrypted vault_items
    'user_name', 'biometric_enabled', 'vault_pin_enabled',
    'reminder_morning_time', 'reminder_midday_time', 'reminder_evening_time',
    'app_theme', 'popup_style',               // #48's theme + popup choices (#57 fix)
];

const VAULT_KEY = 'vault_items';

export default function BackupScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    // Step 4 + 5: build the JSON, write the file, open the share sheet.
    const finishExport = async (
        data: Record<string, string | null>,
        encryptedVault: string | null,
    ) => {
        try {
            const backup = {
                app: 'A Place To Remember',
                // #65 rename: new backups carry the new marker; restore
                // accepts this AND the old 'elyfont-backup' (old files
                // must stay restorable).
                type: 'remember-backup',
                version: BACKUP_VERSION,
                exportedAt: new Date().toISOString(),
                vaultEncrypted: !!encryptedVault,
                data,
                vault: encryptedVault
                    ? { encrypted: true, payload: encryptedVault }
                    : { encrypted: false, payload: null },
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

    // Second password entry — must match the first, or nothing is saved.
    const confirmPassword = (
        firstPassword: string,
        vaultRaw: string,
        data: Record<string, string | null>,
    ) => {
        Alert.prompt(
            'Confirm Password',
            'Type the same backup password again.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: (second?: string) => {
                        if (second !== firstPassword) {
                            Alert.alert(
                                'Passwords did not match',
                                'The two entries were different, so no file was created. Please tap Export and try again.',
                            );
                            return;
                        }
                        const encrypted = CryptoJS.AES.encrypt(
                            vaultRaw,
                            firstPassword,
                        ).toString();
                        finishExport(data, encrypted);
                    },
                },
            ],
            'secure-text',
        );
    };

    // First password entry (only reached when the Vault has items).
    const promptForPassword = (
        vaultRaw: string,
        data: Record<string, string | null>,
    ) => {
        Alert.prompt(
            'Backup Password',
            'Create a password to lock your Vault inside this backup. You will need this same password to restore the Vault later, so keep it somewhere safe.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Next',
                    onPress: (first?: string) => {
                        if (!first || first.length < 4) {
                            Alert.alert(
                                'Password too short',
                                'Please use at least 4 characters. No file was created.',
                            );
                            return;
                        }
                        confirmPassword(first, vaultRaw, data);
                    },
                },
            ],
            'secure-text',
        );
    };

    const handleExport = async () => {
        try {
            // Step 1: gather the readable data.
            const pairs = await AsyncStorage.multiGet(READABLE_KEYS);
            const data: Record<string, string | null> = {};
            pairs.forEach(([key, value]) => {
                data[key] = value;
            });

            // Step 2: does the Vault actually hold anything?
            const vaultRaw = await AsyncStorage.getItem(VAULT_KEY);
            let vaultHasItems = false;
            if (vaultRaw) {
                try {
                    const parsed = JSON.parse(vaultRaw);
                    vaultHasItems = Array.isArray(parsed)
                        ? parsed.length > 0
                        : !!parsed;
                } catch {
                    vaultHasItems = vaultRaw.trim().length > 0;
                }
            }

            // Step 3: password only when there's something to protect.
            if (vaultHasItems && vaultRaw) {
                promptForPassword(vaultRaw, data);
            } else {
                await finishExport(data, null);
            }
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
    const applyRestore = async (
        data: Record<string, string | null>,
        vaultValue: string | null,
    ) => {
        try {
            const toSet: [string, string][] = [];
            const toRemove: string[] = [];

            READABLE_KEYS.forEach((key) => {
                const v = data[key];
                if (typeof v === 'string') toSet.push([key, v]);
                else toRemove.push(key);
            });

            if (typeof vaultValue === 'string' && vaultValue.length > 0) {
                toSet.push([VAULT_KEY, vaultValue]);
            } else {
                toRemove.push(VAULT_KEY);
            }

            if (toSet.length) await AsyncStorage.multiSet(toSet);
            if (toRemove.length) await AsyncStorage.multiRemove(toRemove);

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
    const confirmAndRestore = (
        data: Record<string, string | null>,
        vaultValue: string | null,
    ) => {
        Alert.alert(
            'Replace Everything?',
            'This will replace everything currently in the app — your lists, routines, settings, and Vault — with the contents of this backup. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Replace',
                    style: 'destructive',
                    onPress: () => applyRestore(data, vaultValue),
                },
            ],
        );
    };

    // Encrypted Vault: ask once for the backup password and decrypt.
    // A wrong password yields empty/garbage, which we catch — and change nothing.
    const promptImportPassword = (parsed: any) => {
        Alert.prompt(
            'Backup Password',
            'Enter the backup password you set when you exported this file, to unlock its Vault.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Unlock',
                    onPress: (password?: string) => {
                        if (!password) {
                            Alert.alert(
                                'No password',
                                'No password was entered, so nothing was changed.',
                            );
                            return;
                        }
                        let vaultValue: string;
                        try {
                            const bytes = CryptoJS.AES.decrypt(parsed.vault.payload, password);
                            const text = bytes.toString(CryptoJS.enc.Utf8);
                            if (!text) throw new Error('empty');
                            JSON.parse(text); // sanity-check it's real Vault data
                            vaultValue = text;
                        } catch {
                            Alert.alert(
                                'Wrong password',
                                'That password did not unlock the backup’s Vault, so nothing was changed. Please try Import again.',
                            );
                            return;
                        }
                        confirmAndRestore(parsed.data, vaultValue);
                    },
                },
            ],
            'secure-text',
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

            // #65 rename: accept the new marker AND the old one — every
            // backup ever exported must stay restorable.
            const validTypes = ['remember-backup', 'elyfont-backup'];
            if (!parsed || !validTypes.includes(parsed.type) || !parsed.data) {
                Alert.alert(
                    'Not a backup from this app',
                    'That file is not a backup made by A Place To Remember. Nothing was changed.',
                );
                return;
            }
            if (typeof parsed.version === 'number' && parsed.version > BACKUP_VERSION) {
                Alert.alert(
                    'Newer backup',
                    'This backup was made by a newer version of the app. Please update the app before importing it. Nothing was changed.',
                );
                return;
            }

            const vault = parsed.vault || { encrypted: false, payload: null };
            if (vault.encrypted && vault.payload) {
                promptImportPassword(parsed);
            } else {
                const vaultValue =
                    typeof vault.payload === 'string' ? vault.payload : null;
                confirmAndRestore(parsed.data, vaultValue);
            }
        } catch {
            Alert.alert(
                'Import failed',
                'Something went wrong while reading the file. Nothing was changed.',
            );
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Backup & Restore</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <Bridge />

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

                <Text style={styles.note}>
                    If your Vault has items, you'll be asked for a backup password to lock
                    that part of the file.
                </Text>
            </ScrollView>
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
        note: {
            fontSize: 14,
            color: t.mutedText,
            textAlign: 'center',
            marginTop: 12,
            fontStyle: 'italic',
        },
        headerBtn: {
            width: 90,
            borderWidth: 1,
            borderColor: t.headerButton,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        headerSpacer: { width: 90 },
    });
