import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from '../components/Bridge';
import AddWherePopup from '../components/AddWherePopup';
import OptionCaseBody from '../components/OptionCaseBody';
import { Theme, useTheme } from '../constants/Themes';
import { emptyOptionSettings, OPTION_CASES, type OptionSettings } from '../modules/option-cases';

export default function OptionsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [openId, setOpenId] = useState<string | null>(null);
    const [showWhere, setShowWhere] = useState(false);
    const [settings, setSettings] = useState<OptionSettings>(emptyOptionSettings);
    const openCase = OPTION_CASES.find((one) => one.id === openId) ?? null;

    return (
        <View style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    {openCase ? (
                        <TouchableOpacity onPress={() => setOpenId(null)} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>Back</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={() => {
                                if (router.canDismiss()) router.dismissAll();
                                router.replace('/home');
                            }}
                            style={styles.headerBtn}
                        >
                            <Text style={styles.headerBtnText}>Home</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.title}>{openCase ? openCase.name : 'Options'}</Text>
                    {openCase ? (
                        <View style={styles.headerBtn} />
                    ) : (
                        <TouchableOpacity onPress={() => setShowWhere(true)} style={styles.headerBtn}>
                            <Text style={styles.screenBtnText}>+{'\n'}Screen{'\n'} </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </SafeAreaView>
            <Bridge />
            {openCase ? (
                <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                    <OptionCaseBody
                        openCase={openCase}
                        settings={settings}
                        onChange={setSettings}
                    />
                </ScrollView>
            ) : (
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    <View style={styles.settingCard}>
                        {OPTION_CASES.map((one, i) => (
                            <TouchableOpacity
                                key={one.id}
                                style={[styles.settingRow, i > 0 && styles.settingRowBorder]}
                                onPress={() => setOpenId(one.id)}
                            >
                                <View style={styles.iconCircle}>
                                    <Text style={styles.tileIcon}>{one.icon}</Text>
                                </View>
                                <Text style={styles.settingLabel}>{one.name}</Text>
                                <Text style={styles.settingArrow}>›</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
            <AddWherePopup
                visible={showWhere}
                onClose={() => setShowWhere(false)}
            />
        </View>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            paddingTop: 20,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        headerBtn: {
            width: 54,
            height: 54,
            borderRadius: 27,
            borderWidth: 1,
            borderColor: t.headerButton,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        screenBtnText: {
            color: t.headerButton,
            fontSize: 11,
            fontWeight: '600',
            textAlign: 'center',
            lineHeight: 13,
        },
        scroll: { flex: 1 },
        settingCard: {
            backgroundColor: t.card,
            borderRadius: 12,
            marginHorizontal: 12,
            marginTop: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        settingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 12,
        },
        settingRowBorder: {
            borderTopWidth: 0.5,
            borderTopColor: t.cardBorder,
        },
        iconCircle: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: t.tileCircle,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
        },
        tileIcon: { fontSize: 16 },
        settingLabel: { flex: 1, fontSize: 16, color: t.cardTitle, fontWeight: '500' },
        settingArrow: { fontSize: 22, color: t.settingArrow },
    });
