import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SetupPin() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [step, setStep] = useState<'create' | 'confirm'>('create');

    const handlePress = (digit: string) => {
        if (step === 'create') {
            const newPin = pin + digit;
            setPin(newPin);
            if (newPin.length === 6) {
                setStep('confirm');
            }
        } else {
            const newConfirm = confirmPin + digit;
            setConfirmPin(newConfirm);
            if (newConfirm.length === 6) {
                if (newConfirm === pin) {
                    AsyncStorage.setItem('user_pin', newConfirm);
                    AsyncStorage.setItem('pin_set', 'true');
                    router.replace('/home');
                } else {
                    Alert.alert('PIN Mismatch', 'The PINs did not match. Please try again.');
                    setPin('');
                    setConfirmPin('');
                    setStep('create');
                }
            }
        }
    };

    const handleDelete = () => {
        if (step === 'create') {
            setPin(pin.slice(0, -1));
        } else {
            setConfirmPin(confirmPin.slice(0, -1));
        }
    };

    const currentPin = step === 'create' ? pin : confirmPin;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome!</Text>
                <Text style={styles.subgreeting}>Let's take a moment to set up your app.</Text>
                <Text style={styles.instruction}>
                    {step === 'create' ? 'Create a 6-digit PIN' : 'Confirm your PIN'}
                </Text>
                <View style={styles.dotsContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, i < currentPin.length && styles.dotFilled]}
                        />
                    ))}
                </View>
            </View>

            <View style={styles.bridge} />

            <View style={styles.keypadArea}>
                <View style={styles.keypad}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.key, key === '' && styles.keyEmpty]}
                            onPress={() => {
                                if (key === '⌫') handleDelete();
                                else if (key !== '') handlePress(key);
                            }}
                            disabled={key === ''}
                        >
                            <Text style={styles.keyText}>{key}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flex: 1,
        backgroundColor: '#1a6e8a',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    bridge: {
        height: 30,
        backgroundColor: '#2d9e8f',
    },
    keypadArea: {
        flex: 1.2,
        backgroundColor: '#85c5ab',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    greeting: {
        fontSize: 36,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 10,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'Georgia',
    },
    subgreeting: {
        fontSize: 19,
        color: '#a8d4e0',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
    },
    instruction: {
        fontSize: 18,
        fontWeight: '500',
        color: '#fff',
        marginBottom: 20,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    dot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#fff',
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: '#fff',
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: 300,
        gap: 15,
    },
    key: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    keyEmpty: {
        backgroundColor: 'transparent',
        elevation: 0,
        shadowOpacity: 0,
    },
    keyText: {
        fontSize: 28,
        fontWeight: '500',
        color: '#1a6e8a',
    },
});