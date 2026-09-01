import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Cover } from './Cover';
import OptionCaseBody from './OptionCaseBody';
import { PageFrame } from './PageFrame';
import { Theme, useTheme } from '../constants/Themes';
import type { OptionCase, OptionSettings } from '../modules/option-cases';

export default function ScreenOptionsSheet({
    visible,
    cases,
    settings,
    onChange,
    startId,
    warning,
    onClose,
    onDone,
}: {
    visible: boolean;
    cases: OptionCase[];
    settings: OptionSettings;
    onChange: (next: OptionSettings) => void;
    startId?: string | null;
    warning?: string;
    onClose: () => void;
    onDone: () => void;
}) {
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [openId, setOpenId] = useState<string | null>(null);
    const openCase = cases.find((one) => one.id === openId) ?? null;

    useEffect(() => {
        if (!visible) setOpenId(null);
        else setOpenId(startId ?? null);
    }, [visible, startId]);

    return (
        <Cover visible={visible}>
                <View style={styles.container}>
                    <PageFrame
                        headerColor={theme.header}
                        header={
                            <View style={styles.header}>
                                {openCase ? (
                                    <TouchableOpacity onPress={() => setOpenId(null)} style={styles.headerBtn}>
                                        <Text style={styles.headerBtnText}>Back</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
                                        <Text style={styles.headerBtnText}>Back</Text>
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.title}>{openCase ? openCase.name : 'Options'}</Text>
                                <TouchableOpacity onPress={onDone} style={styles.headerBtn}>
                                    <Text style={styles.headerBtnText}>Done</Text>
                                </TouchableOpacity>
                            </View>
                        }
                    >
                    {openCase ? (
                        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                            <OptionCaseBody
                                openCase={openCase}
                                settings={settings}
                                onChange={onChange}
                            />
                        </ScrollView>
                    ) : (
                        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                            {warning ? (
                                <View style={styles.settingCard}>
                                    <Text style={styles.warningText}>{warning}</Text>
                                </View>
                            ) : null}
                            {cases.length > 0 ? (
                                <View style={styles.settingCard}>
                                    {cases.map((one, i) => (
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
                            ) : null}
                        </ScrollView>
                    )}
                    </PageFrame>
                </View>
        </Cover>
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
        warningText: { fontSize: 16, color: t.bodyText, lineHeight: 22, padding: 16 },
    });
