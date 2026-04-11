import AsyncStorage from '@react-native-async-storage/async-storage';
//import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
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
    const [showChangePIN, setShowChangePIN] = useState(false);
    const [currentPIN, setCurrentPIN] = useState('');
    const [newPIN, setNewPIN] = useState('');
    const [confirmPIN, setConfirmPIN] = useState('');
    const [pinStep, setPinStep] = useState<'current' | 'new' | 'confirm'>('current');
    const [editingName, setEditingName] = useState(false);

    useEffect(() => {
        loadSettings();
        //checkBiometric();
    }, []);

    const loadSettings = async () => {
        try {
            const name = await AsyncStorage.getItem('user_name');
            const biometric = await AsyncStorage.getItem('biometric_enabled');
            const vaultPin = await AsyncStorage.getItem('vault_pin_enabled');
            if (name) { setUserName(name); setNewUserName(name); }
            if (biometric) setBiometricEnabled(biometric === 'true');
            if (vaultPin) setVaultPinEnabled(vaultPin === 'true');
        } catch (e) {
            console.error(e);
        }
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
        setVaultPinEnabled(value);
        await AsyncStorage.setItem('vault_pin_enabled', value.toString());
    };

    const startChangePIN = () => {
        setCurrentPIN('');
        setNewPIN('');
        setConfirmPIN('');
        setPinStep('current');
        setShowChangePIN(true);
    };

    const handlePinDigit = async (digit: string) => {
        if (pinStep === 'current') {
            const updated = currentPIN + digit;
            setCurrentPIN(updated);
            if (updated.length === 6) {
                const saved = await AsyncStorage.getItem('user_pin');
                if (updated === saved) {
                    setPinStep('new');
                    setCurrentPIN('');
                } else {
                    Alert.alert('Incorrect PIN', 'That PIN is incorrect.');
                    setCurrentPIN('');
                }
            }
        } else if (pinStep === 'new') {
            const updated = newPIN + digit;
            setNewPIN(updated);
            if (updated.length === 6) {
                setPinStep('confirm');
            }
        } else {
            const updated = confirmPIN + digit;
            setConfirmPIN(updated);
            if (updated.length === 6) {
                if (updated === newPIN) {
                    await AsyncStorage.setItem('user_pin', updated);
                    Alert.alert('Success', 'Your PIN has been changed.');
                    setShowChangePIN(false);
                    setCurrentPIN('');
                    setNewPIN('');
                    setConfirmPIN('');
                } else {
                    Alert.alert('Mismatch', 'PINs do not match. Try again.');
                    setNewPIN('');
                    setConfirmPIN('');
                    setPinStep('new');
                }
            }
        }
    };

    const handlePinDelete = () => {
        if (pinStep === 'current') setCurrentPIN(p => p.slice(0, -1));
        else if (pinStep === 'new') setNewPIN(p => p.slice(0, -1));
        else setConfirmPIN(p => p.slice(0, -1));
    };

    const getCurrentPinDisplay = () => {
        if (pinStep === 'current') return currentPIN;
        if (pinStep === 'new') return newPIN;
        return confirmPIN;
    };

    const resetApp = async () => {
        const savedPin = await AsyncStorage.getItem('user_pin');
        Alert.alert(
            'Reset All Data',
            'This will delete ALL your data. Enter your PIN to confirm.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue', style: 'destructive', onPress: () => {
                        Alert.prompt(
                            'Enter PIN',
                            'Type your 6-digit PIN to confirm reset',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Reset', style: 'destructive', onPress: async (pin) => {
                                        if (pin === savedPin) {
                                            await AsyncStorage.clear();
                                            router.replace('/setup-pin');
                                        } else {
                                            Alert.alert('Incorrect PIN', 'Reset cancelled.');
                                        }
                                    }
                                }
                            ],
                            'secure-text'
                        );
                    }
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Settings</Text>
                    <View style={styles.backBtn} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            {showChangePIN ? (
                <View style={styles.pinContainer}>
                    <Text style={styles.pinInstruction}>
                        {pinStep === 'current' ? 'Enter your current PIN' :
                         pinStep === 'new' ? 'Enter your new PIN' :
                         'Confirm your new PIN'}
                    </Text>
                    <View style={styles.dotsContainer}>
                        {[...Array(6)].map((_, i) => (
                            <View key={i} style={[styles.dot, i < getCurrentPinDisplay().length && styles.dotFilled]} />
                        ))}
                    </View>
                    <View style={styles.keypad}>
                        {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.key, key === '' && styles.keyEmpty]}
                                onPress={() => { if (key === '⌫') handlePinDelete(); else if (key !== '') handlePinDigit(key); }}
                                disabled={key === ''}
                            >
                                <Text style={styles.keyText}>{key}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.cancelPinBtn} onPress={() => setShowChangePIN(false)}>
                        <Text style={styles.cancelPinText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            ) : (
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

                    <Text style={styles.sectionHeader}>Security</Text>
                    <View style={styles.settingCard}>
                        <TouchableOpacity style={styles.settingRow} onPress={startChangePIN}>
                            <Text style={styles.settingLabel}>Change PIN</Text>
                            <Text style={styles.settingArrow}>›</Text>
                        </TouchableOpacity>

                        {/*{biometricAvailable && (
                            <View style={[styles.settingRow, styles.settingRowBorder]}>
                                <Text style={styles.settingLabel}>Face ID / Touch ID</Text>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={toggleBiometric}
                                    trackColor={{ false: '#ccc', true: Colors.bridge }}
                                    thumbColor={biometricEnabled ? Colors.primary : '#fff'}
                                />
                            </View>
                        )}*/}

                        <View style={[styles.settingRow, styles.settingRowBorder]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.settingLabel}>Extra Vault Security</Text>
                                <Text style={styles.settingHint}>Require PIN to open Vault</Text>
                            </View>
                            <Switch
                                value={vaultPinEnabled}
                                onValueChange={toggleVaultPin}
                                trackColor={{ false: '#ccc', true: Colors.bridge }}
                                thumbColor={vaultPinEnabled ? Colors.primary : '#fff'}
                            />
                        </View>
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
            )}
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
    pinContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: Colors.background,
    },
    pinInstruction: {
        fontSize: 20,
        fontWeight: '500',
        color: Colors.primary,
        marginBottom: 24,
        textAlign: 'center',
    },
    dotsContainer: { flexDirection: 'row', marginBottom: 40, gap: 15 },
    dot: {
        width: 20, height: 20, borderRadius: 10,
        borderWidth: 2, borderColor: Colors.primary,
        backgroundColor: 'transparent',
    },
    dotFilled: { backgroundColor: Colors.primary },
    keypad: {
        flexDirection: 'row', flexWrap: 'wrap',
        justifyContent: 'center', width: 300, gap: 15,
    },
    key: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
        elevation: 2, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 2,
    },
    keyEmpty: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
    keyText: { fontSize: 28, fontWeight: '500', color: Colors.primary },
    cancelPinBtn: { marginTop: 20, padding: 12 },
    cancelPinText: { color: Colors.bridge, fontSize: 16 },
});