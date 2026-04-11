import { useRouter } from 'expo-router';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const modules = [
    { id: 'shopping', label: 'Shopping List', icon: '🛒' },
    { id: 'spell', label: 'Spell Assist', icon: '🔤' },
    { id: 'week', label: 'Week Ahead', icon: '📆' },
    { id: 'timer', label: 'Timer Alerts', icon: '⏱️' },
    { id: 'myday', label: 'My Day', icon: '📅' },
    { id: 'mollie', label: 'Pets', icon: '🐾' },
    { id: 'todo', label: 'To-Do', icon: '✅' },
    { id: 'money', label: 'Money', icon: '💰' },
    { id: 'notepad', label: 'Notepad', icon: '📝' },
    { id: 'journal', label: 'Journal', icon: '📖' },
    { id: 'planner', label: 'Project Planner', icon: '📋' },
];

export default function HomeScreen() {
    const router = useRouter();

    const handleTile = (id: string) => {
        if (id === 'shopping') router.push('/shopping');
        if (id === 'timer') router.push('/timer');
        if (id === 'myday') router.push('/myday');
        if (id === 'mollie') router.push('/mollie');
        if (id === 'todo') router.push('/todo');
        if (id === 'planner') router.push('/planner');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }} edges={['top']}>
                <View style={styles.header}>
                    <View style={{ width: 70 }} />
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={styles.title}>Remember When</Text>
                        <Text style={styles.subtitle}>Good to see you, Patrick</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={{ width: 70, alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 22, color: Colors.textLight }}>⚙️</Text>
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
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '500',
        color: Colors.textLight,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 22,
        paddingBottom: 12,
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
        paddingVertical: 20,
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
        fontSize: 40,
        marginBottom: 8,
    },
    tileLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.primary,
        textAlign: 'center',
    },
});