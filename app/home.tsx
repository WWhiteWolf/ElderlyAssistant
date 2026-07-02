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
import { Theme, useTheme } from '../constants/Themes';

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
    const theme = useTheme();
    const styles = makeStyles(theme);

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
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <View style={{ width: 70 }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.title}>Remember When</Text>
                        <Text style={styles.subtitle}>Good to see you{userName ? `, ${userName}` : ''}!</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 70, alignItems: 'flex-end' }}>
                        <Ionicons name="settings" size={22} color={theme.settingsGear} />
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
                                <Ionicons name="cart" size={22} color={theme.cartIcon} />
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

// Styles are built from the active theme when the page draws (not at
// load), so colors AND typography follow whichever theme is active.
// This is the pattern every converted page copies.
const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: t.pageBackground,
        },
        header: {
            backgroundColor: t.header,
            paddingBottom: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
        },
        title: {
            fontSize: t.titleSize,
            fontWeight: t.titleWeight,
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            textAlign: 'center',
        },
        subtitle: {
            fontSize: t.subtitleSize,
            paddingBottom: 12,
            color: t.subtitleText,
            fontWeight: t.subtitleWeight,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            marginTop: 4,
        },
        bridge: {
            height: 8,
            backgroundColor: t.bridge,
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
            backgroundColor: t.tileCircle,
            borderWidth: 1.5,
            borderColor: t.tileCircleBorder,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
        },
        tileIcon: {
            fontSize: 22,
            ...(t.iconShadow
                ? {
                      textShadowColor: 'rgba(0,0,0,0.5)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 3,
                  }
                : null),
        },
        tileLabel: {
            fontSize: t.tileLabelSize,
            fontWeight: '600',
            fontFamily: t.tileLabelFont,
            color: t.tileLabel,
            textAlign: 'center',
        },
    });