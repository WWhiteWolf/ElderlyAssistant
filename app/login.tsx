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
import { Colors } from '../constants/Colors';

export default function LoginScreen() {
    const router = useRouter();
    const [pin, setPin] = useState('');

    const handlePress = async (digit: string) => {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 6) {
            const savedPin = await AsyncStorage.getItem('user_pin');
            if (newPin === savedPin) {
                router.replace('/home');
            } else {
                Alert.alert('Incorrect PIN', 'Please try again.');
                setPin('');
            }
        }
    };

    const handleDelete = () => {
        setPin(pin.slice(0, -1));
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Welcome Back!</Text>
                <Text style={styles.subgreeting}>Enter your PIN to continue.</Text>
                <View style={styles.dotsContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, i < pin.length && styles.dotFilled]}
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
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
    },
    bridge: {
        height: 30,
        backgroundColor: Colors.bridge,
    },
    keypadArea: {
        flex: 1.2,
        backgroundColor: Colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    greeting: {
        fontSize: 36,
        fontWeight: '500',
        color: Colors.textLight,
        marginBottom: 10,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'Georgia',
    },
    subgreeting: {
        fontSize: 19,
        color: Colors.lightBlue,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
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
        borderColor: Colors.white,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: Colors.white,
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
        backgroundColor: Colors.white,
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
        color: Colors.primary,
    },
});