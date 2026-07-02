import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Dark theme for the Home page (approved #43, built #44).
// Kept local to this file for now — the other 12 pages still use
// constants/Colors.ts until each gets its own reskin session.
const Theme = {
    header: '#f0a83a',
    titleText: '#4a1f0c',
    subtitleText: '#6b3418',
    pageBackground: '#3a3024',
    bridge: '#c9622e',
    tileCircle: '#c9622e',
    tileCircleBorder: '#a3481f',
    tileLabel: '#f0d9a8',
};

const modules = [
  { id: 'shopping', label: 'Shopping List', icon: '🛒' },
  { id: 'timer', label: 'Timer Alerts', icon: '⏰' },
  { id: 'myday', label: 'My Day', icon: '☀️' },
  { id: 'myweek', label: 'My Week', icon: '🗓️' },
  { id: 'mollie', label: 'Pets Day', icon: '🐾' },
  { id: 'lookahead', label: 'Look Ahead', icon: '🔭' },
  { id: 'todo', label: 'To-Do', icon: '✅' },
  { id: 'planner', label: 'Project Planner', icon: '📋' },
  { id: 'watchlist', label: 'Watch List', icon: '🎬' },
  { id: 'vault', label: 'Vault', icon: '🔒' },
];

export default function HomeScreen() {
    const router = useRouter();

    const [userName, setUserName] = useState('');

    useFocusEffect(
        useCallback(() => {
            const loadName = async () => {
                const name = await AsyncStorage.getItem('user_name');
                if (name) setUserName(name);
            };
            loadName();
        }, [])
    );

    const handleTile = (id: string) => {
        if (id === 'shopping') router.push('/shopping');
        if (id === 'timer') router.push('/timer');
        if (id === 'myday') router.push('/myday');
        if (id === 'myweek') router.push('/myweek');
        if (id === 'mollie') router.push('/mollie');
        if (id === 'lookahead') router.push('/lookahead');
        if (id === 'todo') router.push('/todo');
        if (id === 'planner') router.push('/planner');
        if (id === 'watchlist') router.push('/watchlist');
        if (id === 'vault') router.push('/vault');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <View style={{ width: 70 }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.title}>Remember When</Text>
                        <Text style={styles.subtitle}>Good to see you{userName ? `, ${userName}` : ''}!</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 70, alignItems: 'flex-end' }}>
                        <Ionicons name="settings" size={22} color={Theme.tileCircle} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
            <View style={styles.bridge} />
            <ScrollView contentContainerStyle={styles.grid}>
                {modules.map((mod) => (
                    <TouchableOpacity
                        key={mod.id}
                        style={styles.tile}
                        onPress={() => handleTile(mod.id)}
                    >
                        <View style={styles.iconCircle}>
                            {mod.id === 'shopping' ? (
                                <Ionicons name="cart" size={22} color="#d8dde3" />
                            ) : (
                                <Text style={styles.tileIcon}>{mod.icon}</Text>
                            )}
                        </View>
                        <Text style={styles.tileLabel}>{mod.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.pageBackground,
    },
    header: {
        backgroundColor: Theme.header,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.titleText,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13,
        paddingBottom: 12,
        color: Theme.subtitleText,
        fontWeight: '500',
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        marginTop: 4,
    },
    bridge: {
        height: 8,
        backgroundColor: Theme.bridge,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
        justifyContent: 'space-between',
    },
    tile: {
        width: '47%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.tileCircle,
        borderWidth: 1.5,
        borderColor: Theme.tileCircleBorder,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    tileIcon: {
        fontSize: 22,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    tileLabel: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Georgia',
        color: Theme.tileLabel,
        textAlign: 'center',
    },
});