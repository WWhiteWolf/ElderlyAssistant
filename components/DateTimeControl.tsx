import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Theme, useTheme } from '../constants/Themes';

// Shared date/time control (#58). One control for every page's date and
// time entry, built from Look Ahead's proven spinners (sized smaller)
// plus an optional type-in box under each spinner group — type or spin,
// either works, and the two always stay in step.
//
// Rules agreed in #58's design talk:
// - Spinners display 12-hour time with AM/PM; the type-in box is 24-hour.
// - Typed date is MM/DD/YY; padding is automatic (7/4/26 -> 07/04/26,
//   9:5 -> 09:05) when the box loses focus.
// - While the text in a box does not parse to a real date/time, the
//   control reports "not valid" via onValidityChange; the PAGE blocks
//   the save with a warning alert. The control shows a red border as
//   the visual hint once the box loses focus.
// - mode='time' shows only the time half (for My Day / My Week / Pets /
//   Settings later in the rollout). Default is the full date + time.

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

const pad2 = (n: number) => String(n).padStart(2, '0');

// Formatting helpers — exported so pages can store the exact same
// padded strings the control shows (To-Do keeps MM/DD/YY + HH:MM).
export const formatDateMMDDYY = (d: Date) =>
    `${pad2(d.getMonth() + 1)}/${pad2(d.getDate())}/${pad2(d.getFullYear() % 100)}`;

export const formatTime24 = (d: Date) => `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;

// Parse typed MM/DD/YY (also accepts single digits and a 4-digit year).
// Returns null unless it is a real calendar date.
const parseDateText = (text: string): { year: number; month: number; day: number } | null => {
    const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (!m) return null;
    const month = parseInt(m[1], 10);
    const day = parseInt(m[2], 10);
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > daysInMonth(year, month - 1)) return null;
    return { year, month: month - 1, day };
};

// Parse typed 24-hour H:MM / HH:MM. Returns null unless it is a real time.
const parseTimeText = (text: string): { hour: number; minute: number } | null => {
    const m = text.trim().match(/^(\d{1,2}):(\d{1,2})$/);
    if (!m) return null;
    const hour = parseInt(m[1], 10);
    const minute = parseInt(m[2], 10);
    if (hour > 23 || minute > 59) return null;
    return { hour, minute };
};

interface Props {
    value: Date;
    onChange: (d: Date) => void;
    mode?: 'datetime' | 'time';
    dateLabel?: string;
    timeLabel?: string;
    // Fires whenever the typed boxes go valid/invalid as a whole. The page
    // uses the latest value to block Save with its warning alert.
    onValidityChange?: (ok: boolean) => void;
}

export default function DateTimeControl({
    value,
    onChange,
    mode = 'datetime',
    dateLabel = 'Due Date',
    timeLabel = 'Due Time',
    onValidityChange,
}: Props) {
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [dateText, setDateText] = useState(formatDateMMDDYY(value));
    const [timeText, setTimeText] = useState(formatTime24(value));
    const [dateBad, setDateBad] = useState(false);
    const [timeBad, setTimeBad] = useState(false);

    // While a box is being typed in, spinner-driven rewrites of that box
    // are held off so we never fight the user's keystrokes.
    const dateFocused = useRef(false);
    const timeFocused = useRef(false);

    const dateOk = mode === 'time' || parseDateText(dateText) !== null;
    const timeOk = parseTimeText(timeText) !== null;
    const lastReported = useRef<boolean | null>(null);
    useEffect(() => {
        const ok = dateOk && timeOk;
        if (lastReported.current !== ok) {
            lastReported.current = ok;
            onValidityChange?.(ok);
        }
    }, [dateOk, timeOk, onValidityChange]);

    // When the page hands in a new value (form opened, item edited, or a
    // spin just happened), repaint any box that isn't being typed in.
    useEffect(() => {
        if (!dateFocused.current) { setDateText(formatDateMMDDYY(value)); setDateBad(false); }
        if (!timeFocused.current) { setTimeText(formatTime24(value)); setTimeBad(false); }
    }, [value]);

    // ---- spinner adjustments (same moves as Look Ahead's) ----

    const spin = (change: (d: Date) => void) => {
        const next = new Date(value);
        change(next);
        onChange(next);
    };

    const adjustMonth = (delta: number) => spin(d => {
        const m = (d.getMonth() + delta + 12) % 12;
        d.setMonth(m, Math.min(d.getDate(), daysInMonth(d.getFullYear(), m)));
    });

    const adjustDay = (delta: number) => spin(d => {
        const max = daysInMonth(d.getFullYear(), d.getMonth());
        d.setDate(((d.getDate() - 1 + delta + max) % max) + 1);
    });

    const adjustYear = (delta: number) => spin(d => {
        const y = d.getFullYear() + delta;
        d.setFullYear(y, d.getMonth(), Math.min(d.getDate(), daysInMonth(y, d.getMonth())));
    });

    const adjustHour = (dir: 'up' | 'down') => spin(d => {
        const h = d.getHours();
        const isPM = h >= 12;
        let h12 = h % 12; if (h12 === 0) h12 = 12;
        h12 = dir === 'up' ? (h12 % 12) + 1 : (h12 + 10) % 12 + 1;
        d.setHours(isPM ? (h12 % 12) + 12 : h12 % 12);
    });

    const adjustMinute = (delta: number) => spin(d => {
        d.setMinutes((d.getMinutes() + delta + 60) % 60);
    });

    const toggleAmPm = () => spin(d => {
        d.setHours((d.getHours() + 12) % 24);
    });

    // ---- typed input ----

    const onDateTyped = (text: string) => {
        setDateText(text);
        const p = parseDateText(text);
        if (p) {
            setDateBad(false);
            const next = new Date(value);
            next.setFullYear(p.year, p.month, p.day);
            onChange(next);
        }
    };

    const onTimeTyped = (text: string) => {
        setTimeText(text);
        const p = parseTimeText(text);
        if (p) {
            setTimeBad(false);
            const next = new Date(value);
            next.setHours(p.hour, p.minute, 0, 0);
            onChange(next);
        }
    };

    const onDateBlur = () => {
        dateFocused.current = false;
        const p = parseDateText(dateText);
        if (p) { setDateText(formatDateMMDDYY(value)); setDateBad(false); }
        else setDateBad(true);
    };

    const onTimeBlur = () => {
        timeFocused.current = false;
        const p = parseTimeText(timeText);
        if (p) { setTimeText(formatTime24(value)); setTimeBad(false); }
        else setTimeBad(true);
    };

    // ---- pieces ----

    const Stepper = ({ display, caption, up, down, displayStyle }: {
        display: string; caption: string; up: () => void; down: () => void; displayStyle: object;
    }) => (
        <View style={{ alignItems: 'center' }}>
            <TouchableOpacity style={styles.adjBtn} onPress={up}>
                <Text style={styles.adjText}>▲</Text>
            </TouchableOpacity>
            <Text style={displayStyle}>{display}</Text>
            <TouchableOpacity style={styles.adjBtn} onPress={down}>
                <Text style={styles.adjText}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.caption}>{caption}</Text>
        </View>
    );

    const h = value.getHours();
    let h12 = h % 12; if (h12 === 0) h12 = 12;

    return (
        <View>
            {mode === 'datetime' && (
                <>
                    <Text style={styles.inputLabel}>{dateLabel}</Text>
                    <View style={styles.stepperRow}>
                        <Stepper display={MONTH_NAMES[value.getMonth()]} caption="Month"
                            up={() => adjustMonth(1)} down={() => adjustMonth(-1)} displayStyle={styles.dateDisplay} />
                        <Stepper display={pad2(value.getDate())} caption="Day"
                            up={() => adjustDay(1)} down={() => adjustDay(-1)} displayStyle={styles.dateDisplay} />
                        <Stepper display={String(value.getFullYear())} caption="Year"
                            up={() => adjustYear(1)} down={() => adjustYear(-1)} displayStyle={styles.dateDisplay} />
                    </View>
                    <TextInput
                        style={[styles.typeBox, dateBad && styles.typeBoxBad]}
                        value={dateText}
                        onChangeText={onDateTyped}
                        onFocus={() => { dateFocused.current = true; }}
                        onBlur={onDateBlur}
                        placeholder="MM/DD/YY"
                        placeholderTextColor={theme.mutedText}
                        keyboardType="numbers-and-punctuation"
                    />
                    <Text style={styles.hint}>Type the date (MM/DD/YY) — zeros added for you</Text>
                </>
            )}

            <Text style={styles.inputLabel}>{timeLabel}</Text>
            <View style={styles.timeRow}>
                <Stepper display={pad2(h12)} caption="Hour"
                    up={() => adjustHour('up')} down={() => adjustHour('down')} displayStyle={styles.timeDisplay} />
                <Text style={styles.timeDisplay}>:</Text>
                <Stepper display={pad2(value.getMinutes())} caption="Minute"
                    up={() => adjustMinute(1)} down={() => adjustMinute(-1)} displayStyle={styles.timeDisplay} />
                <Stepper display={h < 12 ? 'AM' : 'PM'} caption="AM/PM"
                    up={toggleAmPm} down={toggleAmPm} displayStyle={styles.ampmDisplay} />
            </View>
            <TextInput
                style={[styles.typeBox, timeBad && styles.typeBoxBad]}
                value={timeText}
                onChangeText={onTimeTyped}
                onFocus={() => { timeFocused.current = true; }}
                onBlur={onTimeBlur}
                placeholder="HH:MM"
                placeholderTextColor={theme.mutedText}
                keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.hint}>Type the time (24-hour clock)</Text>
        </View>
    );
}

const makeStyles = (t: Theme) => StyleSheet.create({
    inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4, marginTop: 8 },
    stepperRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
    timeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 6 },
    // Look Ahead's circles are 50 with 22pt arrows; #58 sizes them down so
    // the whole form stays visible (mockup-approved).
    adjBtn: {
        backgroundColor: t.buttonPrimary,
        width: 34, height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    adjText: { color: t.buttonPrimaryText, fontSize: 15, fontWeight: '600' },
    dateDisplay: { fontSize: 20, fontWeight: '600', color: t.bodyText, marginVertical: 2 },
    timeDisplay: { fontSize: 24, fontWeight: '600', color: t.bodyText, marginVertical: 2 },
    ampmDisplay: { fontSize: 18, fontWeight: '600', color: t.bodyText, marginVertical: 5 },
    caption: { color: t.bodyText, fontSize: 12 },
    typeBox: {
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: t.bodyText,
        marginBottom: 2,
    },
    typeBoxBad: { borderColor: t.buttonDelete, borderWidth: 1.5 },
    hint: { fontSize: 11, color: t.mutedText, marginBottom: 8 },
});
