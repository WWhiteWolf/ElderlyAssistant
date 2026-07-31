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
// - mode='date' shows only the date half (#63, built for the Orders
//   page's "by" date). The Orders form's start/end window is two
//   mode='time' controls side by side — no pair machinery in here.
// - #3-new: optionalTime — a page may declare the time optional. While no
//   time is set (timeSet=false) the spinners sit dulled at 12:00 PM and
//   the box sits empty with a "No time set" hint; tapping any arrow or
//   typing a time wakes it (onChange fires as usual), and emptying the
//   box clears it (onClearTime fires). Meant for mode='time' pages; the
//   #59 empty-box rule (empty repaints from the spinners) applies only
//   when optionalTime is off.

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
    mode?: 'datetime' | 'time' | 'date';
    dateLabel?: string;
    timeLabel?: string;
    // Fires whenever the typed boxes go valid/invalid as a whole. The page
    // uses the latest value to block Save with its warning alert.
    onValidityChange?: (ok: boolean) => void;
    // #3-new: the time is optional on this page. value stays a real Date
    // (the sleeping display dulls it at whatever the page passes — 12:00
    // by convention); timeSet says whether the item actually has a time;
    // onClearTime fires when the typed box is emptied.
    optionalTime?: boolean;
    timeSet?: boolean;
    onClearTime?: () => void;
}

export default function DateTimeControl({
    value,
    onChange,
    mode = 'datetime',
    dateLabel = 'Due Date',
    timeLabel = 'Due Time',
    onValidityChange,
    optionalTime = false,
    timeSet = true,
    onClearTime,
}: Props) {
    const theme = useTheme();
    const styles = makeStyles(theme);

    // Asleep = the page says time is optional and none is set right now.
    const asleep = optionalTime && !timeSet;

    const [dateText, setDateText] = useState(formatDateMMDDYY(value));
    const [timeText, setTimeText] = useState(asleep ? '' : formatTime24(value));
    const [dateBad, setDateBad] = useState(false);
    const [timeBad, setTimeBad] = useState(false);

    // While a box is being typed in, spinner-driven rewrites of that box
    // are held off so we never fight the user's keystrokes.
    const dateFocused = useRef(false);
    const timeFocused = useRef(false);

    // An EMPTY box means "never mind what I typed" (#59, Patrick's call): it
    // counts as valid — the spinners always hold a real value, and blur
    // repaints the box from them — so clearing a bad entry can never leave
    // the red border stuck or Save blocked.
    const dateOk = mode === 'time' || dateText.trim() === '' || parseDateText(dateText) !== null;
    const timeOk = mode === 'date' || timeText.trim() === '' || parseTimeText(timeText) !== null;
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
        if (!timeFocused.current) { setTimeText(asleep ? '' : formatTime24(value)); setTimeBad(false); }
    }, [value, asleep]);

    // ---- spinner adjustments (same moves as Look Ahead's) ----

    const spin = (change: (d: Date) => void) => {
        const next = new Date(value);
        // Asleep: the first tap only wakes the control at the shown
        // 12:00 PM — the adjustment itself starts with the next tap.
        if (!asleep) change(next);
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
        if (text.trim() === '') { setDateBad(false); return; }
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
        if (text.trim() === '') {
            setTimeBad(false);
            // Optional time: an emptied box means "no time" — tell the page.
            if (optionalTime) onClearTime?.();
            return;
        }
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
        // Empty or valid: repaint from the spinners' value, no red. Only a
        // non-empty value that isn't a real date goes red.
        if (p || dateText.trim() === '') { setDateText(formatDateMMDDYY(value)); setDateBad(false); }
        else setDateBad(true);
    };

    const onTimeBlur = () => {
        timeFocused.current = false;
        const p = parseTimeText(timeText);
        // Optional time + empty box: stay empty — empty MEANS "no time"
        // here, so blur must not repaint it from the spinners (#3-new).
        if (optionalTime && timeText.trim() === '') { setTimeBad(false); }
        else if (p || timeText.trim() === '') { setTimeText(formatTime24(value)); setTimeBad(false); }
        else setTimeBad(true);
    };

    // ---- pieces ----

    const Stepper = ({ display, caption, up, down, displayStyle }: {
        display: string; caption: string; up: () => void; down: () => void; displayStyle: object;
    }) => (
        <View style={{ alignItems: 'center' }}>
            {/* #62: hitSlop widens the TAP area ~5px each side beyond the drawn
                circle (40px drawn ≈ 50px tappable) — Patrick found the #58
                circles hard to tap on the phone. */}
            <TouchableOpacity style={styles.adjBtn} onPress={up} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                <Text style={styles.adjText}>▲</Text>
            </TouchableOpacity>
            <Text style={displayStyle}>{display}</Text>
            <TouchableOpacity style={styles.adjBtn} onPress={down} hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}>
                <Text style={styles.adjText}>▼</Text>
            </TouchableOpacity>
            <Text style={styles.caption}>{caption}</Text>
        </View>
    );

    const h = value.getHours();
    let h12 = h % 12; if (h12 === 0) h12 = 12;

    return (
        <View>
            {mode !== 'time' && (
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

            {mode !== 'date' && (
                <>
                    <Text style={styles.inputLabel}>{timeLabel}</Text>
                    <View style={[styles.timeRow, asleep && styles.timeRowAsleep]}>
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
                    <Text style={styles.hint}>
                        {asleep
                            ? 'No time set — tap the arrows or type a time to set one'
                            : 'Type the time (24-hour clock)'}
                    </Text>
                </>
            )}
        </View>
    );
}

const makeStyles = (t: Theme) => StyleSheet.create({
    inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4, marginTop: 8 },
    stepperRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
    timeRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 14, marginBottom: 6 },
    // #3-new: the whole spinner row dulled while no time is set.
    timeRowAsleep: { opacity: 0.4 },
    // Look Ahead's circles were 50 with 22pt arrows; #58 sized them down to 34
    // to keep the whole form visible, but Patrick found 34 hard to tap on the
    // phone (#62) — now 40 with 18pt arrows, plus hitSlop above for ~50px of
    // tappable area.
    adjBtn: {
        backgroundColor: t.buttonPrimary,
        width: 40, height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    adjText: { color: t.buttonPrimaryText, fontSize: 18, fontWeight: '600' },
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
