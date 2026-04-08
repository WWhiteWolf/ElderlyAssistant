import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';

const modules = [
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'shopping', label: 'Shopping List', icon: '🛒' },
    { id: 'spell', label: 'Spell Assist', icon: '🔤' },
    { id: 'week', label: 'Week Ahead', icon: '📆' },
    { id: 'timer', label: 'Timer Alerts', icon: '⏱️' },
    { id: 'myday', label: 'My Day', icon: '📅' },
    { id: 'mollie', label: 'Mollie', icon: '🐕' },
    { id: 'todo', label: 'To-Do', icon: '✅' },
    { id: 'money', label: 'Money', icon: '💰' },
    { id: 'notepad', label: 'Notepad', icon: '📝' },
];

export default function HomeScreen() {
    const router = useRouter();

    const handleTile = (id: string) => {
        if (id === 'shopping') router.push('/shopping');
        if (id === 'timer') router.push('/timer');
        if (id === 'myday') router.push('/myday');
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Elderly Assistant</Text>
                <Text style={styles.subtitle}>Good to see you, Patrick</Text>
            </View>

            <View style={styles.bridge} />

            <ScrollView contentContainerStyle={styles.grid}>
                {modules.map((mod) => (
                    <TouchableOpacity
                        key={mod.id}
                        style={styles.tile}
                        onPress={() => handleTile(mod.id)}
                    >
                        <Text style={styles.tileIcon}>{mod.icon}</Text>
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
        backgroundColor: Colors.background,
    },
    header: {
        backgroundColor: Colors.primary,
        paddingTop: 60,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
    },
    subtitle: {
        fontSize: 24,
        color: Colors.lightBlue,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        marginTop: 4,
    },
    bridge: {
        height: 8,
        backgroundColor: Colors.bridge,
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
        backgroundColor: Colors.white,
        borderRadius: 16,
        paddingVertical: 28,
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    tileIcon: {
        fontSize: 44,
        marginBottom: 12,
    },
    tileLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        textAlign: 'center',
    },
});