import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeControl from '../components/DateTimeControl';
import Bridge from '../components/Bridge';
import { Theme, useTheme, useThemeControls } from '../constants/Themes';

export default function SettingsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const { themeName, setThemeName, popupStyle, setPopupStyle } = useThemeControls();
    const [userName, setUserName] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [vaultPinEnabled, setVaultPinEnabled] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [morningTime, setMorningTime] = useState('08:00');
    const [middayTime, setMiddayTime] = useState('12:00');
    const [eveningTime, setEveningTime] = useState('17:00');
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [editingWhich, setEditingWhich] = useState<'morning' | 'midday' | 'evening'>('morning');
    const [pendingTime, setPendingTime] = useState<Date | null>(null);
    // True while the shared control's typed time box holds a real time;
    // Save is blocked with a warning while false (#61, Look Ahead's pattern).
    const [pendingTimeValid, setPendingTimeValid] = useState(true);

    useEffect(() => {
        loadSettings();
        //checkBiometric();
    }, []);

    const loadSettings = async () => {
        try {
            const name = await AsyncStorage.getItem('user_name');
            const biometric = await AsyncStorage.getItem('biometric_enabled');
            const vaultPin = await AsyncStorage.getItem('vault_pin_enabled');
            const morning = await AsyncStorage.getItem('reminder_morning_time');
            const midday = await AsyncStorage.getItem('reminder_midday_time');
            const evening = await AsyncStorage.getItem('reminder_evening_time');
            if (name) { setUserName(name); setNewUserName(name); }
            if (biometric) setBiometricEnabled(biometric === 'true');
            if (vaultPin) setVaultPinEnabled(vaultPin === 'true');
            if (morning) setMorningTime(morning);
            if (midday) setMiddayTime(midday);
            if (evening) setEveningTime(evening);
        } catch (e) {
            console.error(e);
        }
    };

    // "HH:MM" (24h) -> "h:MM AM/PM" for display.
    const format12Hour = (hhmm: string) => {
        const [hStr, mStr] = hhmm.split(':');
        const h = parseInt(hStr, 10);
        const period = h < 12 ? 'AM' : 'PM';
        let h12 = h % 12; if (h12 === 0) h12 = 12;
        return `${h12}:${mStr} ${period}`;
    };

    const openTimeEditor = (which: 'morning' | 'midday' | 'evening') => {
        const hhmm = which === 'morning' ? morningTime : which === 'midday' ? middayTime : eveningTime;
        const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
        setPendingTime(new Date(new Date().setHours(h, m, 0, 0)));
        setPendingTimeValid(true);
        setEditingWhich(which);
        setShowTimeModal(true);
    };

    const saveTime = async () => {
        if (!pendingTimeValid) {
            Alert.alert('Check Time', 'The typed time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        const t = pendingTime || new Date(new Date().setHours(8, 0, 0, 0));
        const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        if (editingWhich === 'morning') {
            setMorningTime(hhmm);
            await AsyncStorage.setItem('reminder_morning_time', hhmm);
        } else if (editingWhich === 'midday') {
            setMiddayTime(hhmm);
            await AsyncStorage.setItem('reminder_midday_time', hhmm);
        } else {
            setEveningTime(hhmm);
            await AsyncStorage.setItem('reminder_evening_time', hhmm);
        }
        setShowTimeModal(false);
    };

    //const checkBiometric = async () => {
    //const available = await LocalAuthentication.hasHardwareAsync();
    //const enrolled = await LocalAuthentication.isEnrolledAsync();
    //setBiometricAvailable(available && enrolled);
    //};

    const saveUserName = async () => {
        if (!newUserName.trim()) {
            Alert.alert('Missing Name', 'Please enter your name.');
            return;
        }
        await AsyncStorage.setItem('user_name', newUserName.trim());
        setUserName(newUserName.trim());
        setEditingName(false);
        Alert.alert('Saved', 'Your name has been updated.');
    };

    /*const toggleBiometric = async (value: boolean) => {
        if (value) {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Confirm your identity to enable biometric login',
                fallbackLabel: 'Use PIN',
            });
            if (result.success) {
                setBiometricEnabled(true);
                await AsyncStorage.setItem('biometric_enabled', 'true');
                Alert.alert('Enabled', 'Biometric login is now enabled.');
            }
        } else {
            setBiometricEnabled(false);
            await AsyncStorage.setItem('biometric_enabled', 'false');
        }
    };*/

    const toggleVaultPin = async (value: boolean) => {
        if (!value) {
            // Turning protection OFF — require Face ID / passcode first, so a
            // person holding the phone can't silently disable Vault security.
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Authenticate to turn off Vault security',
                fallbackLabel: 'Use Passcode',
            });
            if (!result.success) return;   // auth failed/cancelled — leave it ON
        }
        setVaultPinEnabled(value);
        await AsyncStorage.setItem('vault_pin_enabled', value.toString());
    };

    const resetApp = async () => {
        Alert.alert(
            'Reset All Data',
            'This will permanently delete ALL your data. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue', style: 'destructive', onPress: async () => {
                        // Confirm identity with Face ID / passcode before wiping,
                        // matching the Vault gate (no more 6-digit PIN).
                        const result = await LocalAuthentication.authenticateAsync({
                            promptMessage: 'Authenticate to reset all data',
                            fallbackLabel: 'Use Passcode',
                        });
                        if (result.success) {
                            await AsyncStorage.clear();
                            router.replace('/home');
                        } else {
                            Alert.alert('Reset Cancelled', 'Your data was not deleted.');
                        }
                    }
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* #62: no edges prop (default all edges), matching the seven taller-header
                pages — Patrick standardized on the taller header look. */}
            <SafeAreaView style={{ backgroundColor: theme.header }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={styles.backBtn} />
                </View>
            </SafeAreaView>

            <Bridge />

                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 12 }}>

                    <Text style={styles.sectionHeader}>Appearance</Text>
                    <View style={styles.settingCard}>
                        <View style={styles.choiceRow}>
                            <Text style={[styles.settingLabel, styles.choiceLabel]}>App Colors</Text>
                            <TouchableOpacity
                                style={[styles.choiceBtn, themeName === 'light' && styles.choiceBtnActive]}
                                onPress={() => setThemeName('light')}
                            >
                                <Text style={[styles.choiceText, themeName === 'light' && styles.choiceTextActive]}>Light</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.choiceBtn, themeName === 'dark' && styles.choiceBtnActive]}
                                onPress={() => setThemeName('dark')}
                            >
                                <Text style={[styles.choiceText, themeName === 'dark' && styles.choiceTextActive]}>Dark</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.choiceRow, styles.settingRowBorder]}>
                            <Text style={[styles.settingLabel, styles.choiceLabel]}>Popup Colors</Text>
                            <TouchableOpacity
                                style={[styles.choiceBtn, popupStyle === 'match' && styles.choiceBtnActive]}
                                onPress={() => setPopupStyle('match')}
                            >
                                <Text style={[styles.choiceText, popupStyle === 'match' && styles.choiceTextActive]}>Match App</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.choiceBtn, popupStyle === 'phone' && styles.choiceBtnActive]}
                                onPress={() => setPopupStyle('phone')}
                            >
                                <Text style={[styles.choiceText, popupStyle === 'phone' && styles.choiceTextActive]}>Follow iPhone</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.sectionHeader}>Profile</Text>
                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <Text style={styles.settingLabel}>Your Name</Text>
                            {editingName ? (
                                <View style={styles.nameEditRow}>
                                    <TextInput
                                        style={styles.nameInput}
                                        value={newUserName}
                                        onChangeText={setNewUserName}
                                        autoFocus={true}
                                    />
                                    <TouchableOpacity style={styles.saveBtn} onPress={saveUserName}>
                                        <Text style={styles.saveBtnText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity onPress={() => setEditingName(true)}>
                                    <Text style={styles.settingValue}>{userName || 'Tap to set'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <Text style={styles.sectionHeader}>Reminders</Text>
                    <View style={styles.settingCard}>
                        <TouchableOpacity style={styles.settingRow} onPress={() => openTimeEditor('morning')}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Morning Reminder Time</Text>
                                <Text style={styles.settingHint}>Used by "Morning of" appointment alerts</Text>
                            </View>
                            <Text style={styles.settingValue}>{format12Hour(morningTime)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.settingRow, styles.settingRowBorder]} onPress={() => openTimeEditor('midday')}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Midday Reminder Time</Text>
                                <Text style={styles.settingHint}>Used by "Day Before" / "2 Days Before" alerts</Text>
                            </View>
                            <Text style={styles.settingValue}>{format12Hour(middayTime)}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.settingRow, styles.settingRowBorder]} onPress={() => openTimeEditor('evening')}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Evening Reminder Time</Text>
                                <Text style={styles.settingHint}>Used by "Night Before" / week / month alerts</Text>
                            </View>
                            <Text style={styles.settingValue}>{format12Hour(eveningTime)}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionHeader}>Security</Text>
                    <View style={styles.settingCard}>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Extra Vault Security</Text>
                                <Text style={styles.settingHint}>Require Face ID to open Vault</Text>
                            </View>
                            <Switch
                                value={vaultPinEnabled}
                                onValueChange={toggleVaultPin}
                                trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                                thumbColor={theme.switchThumb}
                            />
                        </View>
                    </View>

                    <Text style={styles.sectionHeader}>Backup</Text>
                    <View style={styles.settingCard}>
                        <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/backup')}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Backup & Restore</Text>
                                <Text style={styles.settingHint}>Save or restore all your data</Text>
                            </View>
                            <Text style={styles.settingArrow}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.sectionHeader}>Danger Zone</Text>
                    <View style={styles.settingCard}>
                        <TouchableOpacity style={styles.settingRow} onPress={resetApp}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.settingLabel, { color: theme.buttonDelete }]}>Reset All Data</Text>
                                <Text style={styles.settingHint}>Permanently deletes everything — cannot be undone</Text>
                            </View>
                            <Text style={[styles.settingArrow, { color: theme.buttonDelete }]}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.versionText}>A Place To Remember v1.0</Text>

                </ScrollView>

                <Modal transparent={true} animationType="fade" visible={showTimeModal}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.pickerModal}>
                                <Text style={styles.modalTitle}>
                                    {editingWhich === 'morning' ? 'Morning Reminder Time' : editingWhich === 'midday' ? 'Midday Reminder Time' : 'Evening Reminder Time'}
                                </Text>

                                {/* Shared date/time control, time-only (#61) — spinners +
                                    type-in box, auto-padding, red-border bad-value hint. */}
                                <DateTimeControl
                                    mode="time"
                                    value={pendingTime || new Date(new Date().setHours(8, 0, 0, 0))}
                                    onChange={setPendingTime}
                                    timeLabel="Time"
                                    onValidityChange={setPendingTimeValid}
                                />

                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTimeModal(false)}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmBtn} onPress={saveTime}>
                                        <Text style={styles.confirmBtnText}>Save</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
        </View>
    );
}

// makeStyles(theme) pattern from home.tsx (#45).
const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            paddingTop: 20,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
        },
        backBtn: { width: 70 },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        scroll: { flex: 1 },
        sectionHeader: {
            fontSize: 13,
            fontWeight: '600',
            color: t.pill,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        settingCard: {
            backgroundColor: t.card,
            borderRadius: 12,
            marginHorizontal: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 10,
            paddingHorizontal: 12,
        },
        settingRowBorder: {
            borderTopWidth: 0.5,
            borderTopColor: t.cardBorder,
        },
        settingLabel: { fontSize: 16, color: t.cardTitle, fontWeight: '500' },
        settingValue: { fontSize: 16, color: t.settingValue },
        settingArrow: { fontSize: 22, color: t.settingArrow },
        settingHint: { fontSize: 12, color: t.mutedText, marginTop: 2 },
        // Appearance choice buttons (#48): solid = active, outlined = the
        // other option; active carries an invisible border for size match.
        // Label and buttons share one row to keep the page short.
        choiceRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 10,
            paddingHorizontal: 12,
        },
        choiceLabel: { width: 100 },
        choiceBtn: {
            flex: 1,
            paddingVertical: 6,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: t.cardTitle,
            backgroundColor: t.chip,
            alignItems: 'center',
        },
        choiceBtnActive: { backgroundColor: t.buttonPrimary, borderColor: t.buttonPrimary },
        choiceText: { color: t.cardTitle, fontWeight: '500', fontSize: 13 },
        choiceTextActive: { color: t.buttonPrimaryText },
        nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        nameInput: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 8,
            fontSize: 16,
            color: t.bodyText,
            width: 150,
            backgroundColor: t.pageBackground,
        },
        saveBtn: {
            backgroundColor: t.buttonPrimary,
            padding: 8,
            borderRadius: 8,
        },
        saveBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
        versionText: {
            textAlign: 'center',
            color: t.mutedText,
            fontSize: 13,
            marginTop: 10,
            fontStyle: 'italic',
        },
        headerBtn: {
            borderWidth: 1,
            borderColor: t.headerButton,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },

        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        pickerModal: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            width: '100%',
        },
        modalTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10, textAlign: 'center' },
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
        // Cancel is the quiet button (outlined gold in dark); Save carries an
        // invisible border of the same width so the two stay the same size (#47 rule).
        cancelBtn: {
            backgroundColor: t.buttonNeutral,
            borderWidth: 1.5,
            borderColor: t.buttonNeutralBorder,
            padding: 10,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
            marginRight: 8,
        },
        cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
        confirmBtn: {
            backgroundColor: t.buttonPrimary,
            borderWidth: 1.5,
            borderColor: t.buttonPrimary,
            padding: 10,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    });