import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../constants/Themes';
import { DAY_NAMES } from '../modules/reminder-items';
import {
    phoneTimeZone,
    type HolidayMove,
    type OptionCase,
    type OptionSettings,
    type ShiftedChoice,
} from '../modules/option-cases';

const ORDINALS: { value: number; label: string }[] = [
    { value: 1, label: '1st' },
    { value: 2, label: '2nd' },
    { value: 3, label: '3rd' },
    { value: 4, label: '4th' },
    { value: -1, label: 'Last' },
];

export default function OptionCaseBody({
    openCase,
    settings,
    onChange,
}: {
    openCase: OptionCase;
    settings: OptionSettings;
    onChange: (next: OptionSettings) => void;
}) {
    const theme = useTheme();
    const styles = makeStyles(theme);
    const set = (part: Partial<OptionSettings>) => onChange({ ...settings, ...part });

    return (
        <View style={styles.settingCard}>
            <View style={styles.caseBody}>
                <Text style={styles.hint}>{openCase.body}</Text>
                {openCase.id === 'holidays' && (
                    <ChipRow
                        styles={styles}
                        options={[
                            { id: 'before' as HolidayMove, label: 'Day before' },
                            { id: 'after' as HolidayMove, label: 'Day after' },
                        ]}
                        value={settings.holidayMove}
                        onChange={(holidayMove) => set({ holidayMove })}
                    />
                )}
                {openCase.id === 'timezone' && (
                    <>
                        <ChipRow
                            styles={styles}
                            options={[
                                { id: 'float', label: 'Float with phone' },
                                { id: 'keep', label: 'Keep this zone' },
                            ]}
                            value={settings.floatsWithPhone ? 'float' : 'keep'}
                            onChange={(id) => {
                                if (id == null) return;
                                if (id === 'keep') {
                                    set({ floatsWithPhone: false, dueTimeZoneText: phoneTimeZone() });
                                } else {
                                    set({ floatsWithPhone: true, dueTimeZoneText: undefined });
                                }
                            }}
                        />
                        {!settings.floatsWithPhone && (
                            <Text style={styles.zoneName}>{settings.dueTimeZoneText ?? phoneTimeZone()}</Text>
                        )}
                    </>
                )}
                {openCase.id === 'shifted' && (
                    <ChipRow
                        styles={styles}
                        options={[
                            { id: 'then' as ShiftedChoice, label: 'Then' },
                            { id: 'next' as ShiftedChoice, label: 'Next day' },
                        ]}
                        value={settings.shiftedChoice}
                        onChange={(shiftedChoice) => set({ shiftedChoice })}
                    />
                )}
                {openCase.id === 'secondThursday' && (
                    <>
                        <ChipRow
                            styles={styles}
                            options={ORDINALS.map((one) => ({ id: String(one.value), label: one.label }))}
                            value={settings.weekdayOrdinal != null ? String(settings.weekdayOrdinal) : undefined}
                            onChange={(id) => set({ weekdayOrdinal: id != null ? Number(id) : undefined })}
                        />
                        <ChipRow
                            styles={styles}
                            options={DAY_NAMES.map((d, i) => ({ id: String(i), label: d }))}
                            value={settings.ordinalWeekday != null ? String(settings.ordinalWeekday) : undefined}
                            onChange={(id) => set({ ordinalWeekday: id != null ? Number(id) : undefined })}
                        />
                    </>
                )}
                {openCase.id === 'wednesdayAfter' && (
                    <>
                        <ChipRow
                            styles={styles}
                            options={DAY_NAMES.map((d, i) => ({ id: String(i), label: d }))}
                            value={settings.afterWeekday != null ? String(settings.afterWeekday) : undefined}
                            onChange={(id) => set({ afterWeekday: id != null ? Number(id) : undefined })}
                        />
                        <View style={styles.stepRow}>
                            <Text style={styles.settingLabel}>After the</Text>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => set({ afterDayCount: Math.max(1, settings.afterDayCount - 1) })}
                            >
                                <Text style={styles.stepBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.stepValue}>{settings.afterDayCount}</Text>
                            <TouchableOpacity
                                style={styles.stepBtn}
                                onPress={() => set({ afterDayCount: Math.min(28, settings.afterDayCount + 1) })}
                            >
                                <Text style={styles.stepBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </View>
    );
}

function ChipRow<T extends string>({
    styles,
    options,
    value,
    onChange,
}: {
    styles: ReturnType<typeof makeStyles>;
    options: { id: T; label: string }[];
    value?: T;
    onChange: (next: T | undefined) => void;
}) {
    return (
        <View style={styles.chipRow}>
            {options.map((one) => {
                const on = value === one.id;
                return (
                    <TouchableOpacity
                        key={one.id}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => onChange(on ? undefined : one.id)}
                    >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{one.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        settingCard: {
            backgroundColor: t.card,
            borderRadius: 12,
            marginHorizontal: 12,
            marginTop: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        caseBody: { padding: 16, gap: 12 },
        hint: { fontSize: 16, color: t.bodyText, lineHeight: 22 },
        settingLabel: { flex: 1, fontSize: 16, color: t.cardTitle, fontWeight: '500' },
        zoneName: { fontSize: 14, color: t.mutedText },
        chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        chip: {
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: t.cardBorder,
            backgroundColor: t.chip,
        },
        chipOn: { backgroundColor: t.buttonPrimary, borderColor: t.buttonPrimary },
        chipText: { fontSize: 13, color: t.cardTitle },
        chipTextOn: { color: t.buttonPrimaryText },
        stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        stepBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: t.headerButton,
            alignItems: 'center',
            justifyContent: 'center',
        },
        stepBtnText: { fontSize: 18, color: t.headerButton, fontWeight: '600' },
        stepValue: { fontSize: 18, color: t.cardTitle, fontWeight: '600', minWidth: 24, textAlign: 'center' },
    });
