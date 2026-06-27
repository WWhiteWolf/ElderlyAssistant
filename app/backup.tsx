import { useRouter } from 'expo-router';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

export default function BackupScreen() {
    const router = useRouter();

    const handleExport = () => {
        // Real logic comes in the next step.
        Alert.alert('Export Backup', 'Not built yet — coming in the next step.');
    };

    const handleImport = () => {
        // Real logic comes in a later step.
        Alert.alert('Import Backup', 'Not built yet — coming in a later step.');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: Colors.primary }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Settings</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Backup & Restore</Text>
                    <View style={styles.headerSpacer} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <ScrollView contentContainerStyle={styles.body}>
                <Text style={styles.intro}>
                    Save all your lists, routines, and settings to a file you can keep in
                    Files, iCloud, or Google Drive. If the app is ever reinstalled, import
                    that file to bring everything back.
                </Text>

                <TouchableOpacity style={styles.bigBtn} onPress={handleExport}>
                    <Text style={styles.bigBtnIcon}>⬆️</Text>
                    <Text style={styles.bigBtnText}>Export Backup</Text>
                    <Text style={styles.bigBtnSub}>Save a backup file</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.bigBtn} onPress={handleImport}>
                    <Text style={styles.bigBtnIcon}>⬇️</Text>
                    <Text style={styles.bigBtnText}>Import Backup</Text>
                    <Text style={styles.bigBtnSub}>Restore from a backup file</Text>
                </TouchableOpacity>

                <Text style={styles.note}>
                    Your Vault is protected with your PIN inside the backup file.
                </Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
        paddingTop: 20,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
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
    body: { padding: 20 },
    intro: {
        fontSize: 17,
        color: Colors.text,
        lineHeight: 24,
        marginBottom: 28,
        textAlign: 'center',
    },
    bigBtn: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: Colors.lightBlue,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 18,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    bigBtnIcon: { fontSize: 34, marginBottom: 8 },
    bigBtnText: { fontSize: 22, fontWeight: '600', color: Colors.primary },
    bigBtnSub: { fontSize: 15, color: '#888', marginTop: 4 },
    note: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginTop: 12,
        fontStyle: 'italic',
    },
    headerBtn: {
        width: 90,
        borderWidth: 1,
        borderColor: Colors.white,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    headerBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
    headerSpacer: { width: 90 },
});

