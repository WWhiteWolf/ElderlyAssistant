import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

export default function VaultPinScreen() {
    const router = useRouter();
    const [pin, setPin] = useState('');

    const handlePress = async (digit: string) => {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 6) {
            const savedPin = await AsyncStorage.getItem('user_pin');
            if (newPin === savedPin) {
                router.replace('/vault?verified=true');
            } else {
                setPin('');
                alert('Incorrect PIN');
            }
        }
    };

    const handleDelete = () => setPin(p => p.slice(0, -1));

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.replace('/home')} style={styles.backBtn}>
                        <Text style={styles.backText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Vault 🔒</Text>
                    <View style={styles.backBtn} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <View style={styles.body}>
                <Text style={styles.instruction}>Enter your PIN to access the Vault</Text>
                <View style={styles.dotsContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
                    ))}
                </View>
                <View style={styles.keypad}>
                    {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.key, key === '' && styles.keyEmpty]}
                            onPress={() => { if (key === '⌫') handleDelete(); else if (key !== '') handlePress(key); }}
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
    body: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    instruction: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.primary,
        marginBottom: 30,
        textAlign: 'center',
        fontStyle: 'italic',
        fontFamily: 'Georgia',
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
});