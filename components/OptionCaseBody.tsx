import { Switch, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../constants/Themes';
import { DAY_NAMES, MONTH_NAMES } from '../modules/reminder-items';
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
    shadedDays,
}: {
    openCase: OptionCase;
    settings: OptionSettings;
    onChange: (next: OptionSettings) => void;
    shadedDays: number[];
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
                {openCase.id === 'shading' && (
                    <>
                        <View style={styles.switchRow}>
                            <Text style={styles.settingLabel}>Shade the calendar</Text>
                            <Switch
                                value={settings.shadeCalendar}
                                onValueChange={(shadeCalendar) => set({ shadeCalendar })}
                                trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
                                thumbColor={theme.switchThumb}
                            />
                        </View>
                        <ShadeMonth days={shadedDays} on={settings.shadeCalendar} styles={styles} />
                    </>
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

function ShadeMonth({
    days,
    on,
    styles,
}: {
    days: number[];
    on: boolean;
    styles: ReturnType<typeof makeStyles>;
}) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const startPad = new Date(year, month, 1).getDay();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array.from({ length: startPad }, () => null),
        ...Array.from({ length: lastDay }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return (
        <View style={styles.cal}>
            <Text style={styles.calTitle}>{MONTH_NAMES[month]} {year}</Text>
            <View style={styles.calRow}>
                {DAY_NAMES.map((d) => (
                    <Text key={d} style={styles.calDow}>{d.slice(0, 1)}</Text>
                ))}
            </View>
            {rows.map((row, r) => (
                <View key={r} style={styles.calRow}>
                    {row.map((day, c) => {
                        const shaded = on && day != null && days.includes(day);
                        return (
                            <View key={c} style={[styles.calCell, shaded && styles.calCellOn]}>
                                <Text style={[styles.calDay, shaded && styles.calDayOn]}>{day ?? ''}</Text>
                            </View>
                        );
                    })}
                </View>
            ))}
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
        switchRow: { flexDirection: 'row', alignItems: 'center' },
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
        cal: { gap: 4 },
        calTitle: { fontSize: 16, color: t.cardTitle, fontWeight: '500', marginBottom: 4 },
        calRow: { flexDirection: 'row' },
        calDow: { flex: 1, textAlign: 'center', fontSize: 12, color: t.mutedText, paddingVertical: 4 },
        calCell: {
            flex: 1,
            aspectRatio: 1,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
        },
        calCellOn: { backgroundColor: t.buttonPrimary },
        calDay: { fontSize: 14, color: t.bodyText },
        calDayOn: { color: t.buttonPrimaryText, fontWeight: '600' },
    });
