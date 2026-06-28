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
import { Colors } from '../constants/Colors';

export default function SettingsScreen() {
    const router = useRouter();
    const [userName, setUserName] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [vaultPinEnabled, setVaultPinEnabled] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const [morningTime, setMorningTime] = useState('08:00');
    const [eveningTime, setEveningTime] = useState('17:00');
    const [showTimeModal, setShowTimeModal] = useState(false);
    const [editingWhich, setEditingWhich] = useState<'morning' | 'evening'>('morning');
    const [pendingTime, setPendingTime] = useState<Date | null>(null);

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
            const evening = await AsyncStorage.getItem('reminder_evening_time');
            if (name) { setUserName(name); setNewUserName(name); }
            if (biometric) setBiometricEnabled(biometric === 'true');
            if (vaultPin) setVaultPinEnabled(vaultPin === 'true');
            if (morning) setMorningTime(morning);
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

    const openTimeEditor = (which: 'morning' | 'evening') => {
        const hhmm = which === 'morning' ? morningTime : eveningTime;
        const [h, m] = hhmm.split(':').map(n => parseInt(n, 10));
        setPendingTime(new Date(new Date().setHours(h, m, 0, 0)));
        setEditingWhich(which);
        setShowTimeModal(true);
    };

    const saveTime = async () => {
        const t = pendingTime || new Date(new Date().setHours(8, 0, 0, 0));
        const hhmm = `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
        if (editingWhich === 'morning') {
            setMorningTime(hhmm);
            await AsyncStorage.setItem('reminder_morning_time', hhmm);
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
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={styles.backBtn} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>

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
                        <TouchableOpacity style={[styles.settingRow, styles.settingRowBorder]} onPress={() => openTimeEditor('evening')}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Evening Reminder Time</Text>
                                <Text style={styles.settingHint}>Used by day / week / month before alerts</Text>
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
                                trackColor={{ false: '#ccc', true: Colors.bridge }}
                                thumbColor={vaultPinEnabled ? Colors.primary : '#fff'}
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
                                <Text style={[styles.settingLabel, { color: '#e74c3c' }]}>Reset All Data</Text>
                                <Text style={styles.settingHint}>Permanently deletes everything — cannot be undone</Text>
                            </View>
                            <Text style={[styles.settingArrow, { color: '#e74c3c' }]}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.versionText}>Remember When v1.0</Text>

                </ScrollView>

                <Modal transparent={true} animationType="fade" visible={showTimeModal}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <View style={styles.modalOverlay}>
                            <View style={styles.pickerModal}>
                                <Text style={styles.modalTitle}>
                                    {editingWhich === 'morning' ? 'Morning Reminder Time' : 'Evening Reminder Time'}
                                </Text>

                                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginVertical: 10 }}>
                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                            const next = new Date(pendingTime || new Date());
                                            const h = next.getHours();
                                            const isPM = h >= 12;
                                            let h12 = h % 12; if (h12 === 0) h12 = 12;
                                            h12 = h12 === 12 ? 1 : h12 + 1;
                                            next.setHours(isPM ? (h12 % 12) + 12 : h12 % 12);
                                            setPendingTime(next);
                                        }}>
                                            <Text style={styles.timeAdjText}>▲</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.timeDisplayText}>
                                            {(() => { const h = (pendingTime || new Date()).getHours(); let h12 = h % 12; if (h12 === 0) h12 = 12; return String(h12).padStart(2, '0'); })()}
                                        </Text>
                                        <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                            const next = new Date(pendingTime || new Date());
                                            const h = next.getHours();
                                            const isPM = h >= 12;
                                            let h12 = h % 12; if (h12 === 0) h12 = 12;
                                            h12 = h12 === 1 ? 12 : h12 - 1;
                                            next.setHours(isPM ? (h12 % 12) + 12 : h12 % 12);
                                            setPendingTime(next);
                                        }}>
                                            <Text style={styles.timeAdjText}>▼</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: Colors.primary, fontSize: 13 }}>Hour</Text>
                                    </View>

                                    <Text style={styles.timeDisplayText}>:</Text>

                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                            const next = new Date(pendingTime || new Date());
                                            next.setMinutes((next.getMinutes() + 1) % 60);
                                            setPendingTime(next);
                                        }}>
                                            <Text style={styles.timeAdjText}>▲</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.timeDisplayText}>
                                            {String((pendingTime || new Date()).getMinutes()).padStart(2, '0')}
                                        </Text>
                                        <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                            const next = new Date(pendingTime || new Date());
                                            next.setMinutes((next.getMinutes() + 59) % 60);
                                            setPendingTime(next);
                                        }}>
                                            <Text style={styles.timeAdjText}>▼</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: Colors.primary, fontSize: 13 }}>Minute</Text>
                                    </View>

                                    <View style={{ alignItems: 'center' }}>
                                        <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                            const next = new Date(pendingTime || new Date());
                                            next.setHours((next.getHours() + 12) % 24);
                                            setPendingTime(next);
                                        }}>
                                            <Text style={styles.timeAdjText}>▲</Text>
                                        </TouchableOpacity>
                                        <Text style={[styles.timeDisplayText, { fontSize: 28 }]}>
                                            {(pendingTime || new Date()).getHours() < 12 ? 'AM' : 'PM'}
                                        </Text>
                                        <TouchableOpacity style={styles.timeAdjBtn} onPress={() => {
                                            const next = new Date(pendingTime || new Date());
                                            next.setHours((next.getHours() + 12) % 24);
                                            setPendingTime(next);
                                        }}>
                                            <Text style={styles.timeAdjText}>▼</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: Colors.primary, fontSize: 13 }}>AM/PM</Text>
                                    </View>
                                </View>

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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingTop: 20,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 8,
    },
    backBtn: { width: 70 },
    backText: { color: Colors.lightBlue, fontSize: 16 },
    title: {
        fontSize: 26,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        flex: 1,
        textAlign: 'center',
    },
    bridge: { height: 8, backgroundColor: Colors.bridge },
    scroll: { flex: 1 },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.bridge,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    settingCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        marginHorizontal: 12,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    settingRowBorder: {
        borderTopWidth: 0.5,
        borderTopColor: Colors.lightBlue,
    },
    settingLabel: { fontSize: 16, color: Colors.primary, fontWeight: '500' },
    settingValue: { fontSize: 16, color: Colors.bridge },
    settingArrow: { fontSize: 22, color: Colors.lightBlue },
    settingHint: { fontSize: 12, color: '#aaa', marginTop: 2 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nameInput: {
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        borderRadius: 8,
        padding: 8,
        fontSize: 16,
        color: Colors.text,
        width: 150,
        backgroundColor: Colors.background,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        padding: 8,
        borderRadius: 8,
    },
    saveBtnText: { color: '#fff', fontWeight: '600' },
    versionText: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 13,
        marginTop: 30,
        fontStyle: 'italic',
    },
    headerBtn: {
        borderWidth: 1,
        borderColor: Colors.white,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerModal: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        width: '100%',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary, marginBottom: 10, textAlign: 'center' },
    timeAdjBtn: {
        backgroundColor: Colors.primary,
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 6,
    },
    timeAdjText: { color: Colors.white, fontSize: 22, fontWeight: '600' },
    timeDisplayText: { fontSize: 40, fontWeight: '600', color: Colors.primary, marginVertical: 4 },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    cancelBtn: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: { color: '#333', fontWeight: '600' },
    confirmBtn: {
        backgroundColor: Colors.primary,
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
    },
    confirmBtnText: { color: Colors.white, fontWeight: '600' },
});