import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';

const modules = [
  { id: 'options', label: 'Options', icon: '⚙️' },
  { id: 'memorytest', label: 'Memory Test', icon: '🧠' },
  { id: 'shopping', label: 'Shopping List', icon: '🛒' },
  { id: 'vault', label: 'Vault', icon: '🔒' },
  { id: 'timer', label: 'Timer Alerts', icon: '⏰' },
  { id: 'onetime', label: 'One Time', icon: '✅' },
  { id: 'extended', label: 'Extended', icon: '✅' },
  { id: 'yearly', label: 'Yearly', icon: '🔭' },
  { id: 'quarterly', label: 'Quarterly', icon: '🔭' },
  { id: 'monthly', label: 'Monthly', icon: '🔭' },
  { id: 'weekly', label: 'Weekly', icon: '🗓️' },
  { id: 'daily', label: 'Daily', icon: '☀️' },
  { id: 'testload', label: 'Test load', icon: '📥' },
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
        if (id === 'daily') router.push('/daily' as Href);
        if (id === 'weekly') router.push('/weekly' as Href);
        if (id === 'monthly') router.push('/monthly' as Href);
        if (id === 'quarterly') router.push('/quarterly' as Href);
        if (id === 'yearly') router.push('/yearly' as Href);
        if (id === 'onetime') router.push('/onetime' as Href);
        if (id === 'extended') router.push('/extended' as Href);
        if (id === 'options') router.push('/options' as Href);
        if (id === 'vault') router.push('/vault');
        if (id === 'memorytest') router.push('/memorytest');
        if (id === 'testload') router.push('/testload' as Href);
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    {/* #65: title on its own full-width line so the longer name
                        fits; gear moved down beside the subtitle. */}
                    <Text style={styles.title}>A Place To Remember</Text>
                    <View style={styles.subtitleRow}>
                        {/* #65: small app-icon face (transparent background
                            version — Patrick's call), mirroring the gear. */}
                        <View style={{ width: 70, alignItems: 'flex-start' }}>
                            <Image
                                source={require('../assets/images/icon-face.png')}
                                style={styles.headerIcon}
                            />
                        </View>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={styles.subtitle}>Good to see you{userName ? `, ${userName}` : ''}!</Text>
                        </View>
                        {/* #63: hitSlop — the 22px gear was a hard target on the phone */}
                        <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 70, alignItems: 'flex-end' }} hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}>
                            <Ionicons name="settings" size={32} color={theme.settingsGear} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
            {/* #62 four-band bridge — now the shared component (#63 rollout). */}
            <Bridge />
            <ScrollView contentContainerStyle={styles.grid}>
                {modules.map((mod) => (
                    <TouchableOpacity
                        key={mod.id}
                        style={styles.tile}
                        onPress={() => handleTile(mod.id)}
                    >
                        <View style={styles.iconCircle}>
                            {mod.id === 'shopping' ? (
                                <Ionicons name="cart" size={24} color={theme.cartIcon} />
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
            // #65: was a single row; now title line over subtitle row.
        },
        subtitleRow: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerIcon: {
            width: 32,
            height: 32,
            // #65: face matches the gear's themed color (Patrick's call —
            // the raw art's brick-red clashed with the light teal header).
            tintColor: t.settingsGear,
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
        // #62: tiles ~10% bigger (Patrick's phone call — sized for the real
        // screen, not the Simulator): circle 44→48, emoji 22→24; the label
        // size and halo radius scale in Themes.ts.
        iconCircle: {
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: t.tileCircle,
            // #64: crisp outline — width + contrasting color come from the theme
            borderWidth: t.tileCircleBorderWidth,
            borderColor: t.tileCircleBorder,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
            // #56: the halo — a soft glow in the theme's header color
            // (iOS shadow; strength keys live in Themes.ts).
            shadowColor: t.tileHalo,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: t.tileHaloOpacity,
            shadowRadius: t.tileHaloRadius,
        },
        tileIcon: {
            fontSize: 24,
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