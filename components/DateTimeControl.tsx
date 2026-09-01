import { useEffect, useRef, useState } from 'react';
import { Cover } from './Cover';
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
// - #27-new: optionalDate — the same again for the date half, and it
//   behaves identically: dulled spinners, an empty box with a "No date
//   set" hint, waking on any arrow or a typed date, and onClearDate when
//   the box is emptied. The two halves sleep independently, so a task can
//   have a date and no time, or neither. Built for To-Do, where a task
//   left blank on purpose was having today's date written onto it.

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
    // #27-new: `half` says which side the person actually touched, so a page
    // with both halves optional can wake the date without also claiming a time
    // was set. Callers that do not care simply ignore the second argument.
    onChange: (d: Date, half?: 'date' | 'time') => void;
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
    // #27-new: the date is optional on this page, built to match optionalTime
    // above and behaving the same way. To-Do needed it because a task may be
    // saved with no date at all; before this the empty box repainted itself
    // from the spinners on blur, so today's date was written onto a task the
    // person had deliberately left blank.
    optionalDate?: boolean;
    dateSet?: boolean;
    onClearDate?: () => void;
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
    optionalDate = false,
    dateSet = true,
    onClearDate,
}: Props) {
    const theme = useTheme();
    const styles = makeStyles(theme);

    // Asleep = the page says this half is optional and none is set right now.
    // The two halves sleep independently: a task may have a date and no time,
    // or neither, so one flag could not have covered both.
    const timeAsleep = optionalTime && !timeSet;
    const dateAsleep = optionalDate && !dateSet;

    const [dateText, setDateText] = useState(dateAsleep ? '' : formatDateMMDDYY(value));
    const [timeText, setTimeText] = useState(timeAsleep ? '' : formatTime24(value));
    const [dateBad, setDateBad] = useState(false);
    const [timeBad, setTimeBad] = useState(false);
    const [showTimeSpinner, setShowTimeSpinner] = useState(false);

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
        if (!dateFocused.current) { setDateText(dateAsleep ? '' : formatDateMMDDYY(value)); setDateBad(false); }
        if (!timeFocused.current) { setTimeText(timeAsleep ? '' : formatTime24(value)); setTimeBad(false); }
    }, [value, dateAsleep, timeAsleep]);

    // ---- spinner adjustments (same moves as Look Ahead's) ----

    // `half` says which side of the control is being spun, because only that
    // side's sleep matters. Asleep: the first tap only wakes that half at the
    // value already shown — the adjustment itself starts with the next tap.
    const spin = (half: 'date' | 'time', change: (d: Date) => void) => {
        const next = new Date(value);
        const halfAsleep = half === 'date' ? dateAsleep : timeAsleep;
        if (!halfAsleep) change(next);
        onChange(next, half);
    };

    const adjustMonth = (delta: number) => spin('date', d => {
        const m = (d.getMonth() + delta + 12) % 12;
        d.setMonth(m, Math.min(d.getDate(), daysInMonth(d.getFullYear(), m)));
    });

    const adjustDay = (delta: number) => spin('date', d => {
        const max = daysInMonth(d.getFullYear(), d.getMonth());
        d.setDate(((d.getDate() - 1 + delta + max) % max) + 1);
    });

    const adjustYear = (delta: number) => spin('date', d => {
        const y = d.getFullYear() + delta;
        d.setFullYear(y, d.getMonth(), Math.min(d.getDate(), daysInMonth(y, d.getMonth())));
    });

    // Step the hour on the 24-hour clock, which is the only place the true
    // hour lives. This used to read AM or PM first, hold it fixed, and spin
    // only the 1-to-12 digit — but crossing between 11 and 12 is exactly the
    // moment AM and PM must swap, so stepping down from 12:00 PM gave 11:00 PM
    // instead of 11:00 AM. The display turns 24-hour into 12-hour on its own,
    // so nothing here needs to know about AM and PM at all. Adding 23 is
    // stepping back one without going negative.
    const adjustHour = (dir: 'up' | 'down') => spin('time', d => {
        d.setHours((d.getHours() + (dir === 'up' ? 1 : 23)) % 24);
    });

    const adjustMinute = (delta: number) => spin('time', d => {
        d.setMinutes((d.getMinutes() + delta + 60) % 60);
    });

    const toggleAmPm = () => spin('time', d => {
        d.setHours((d.getHours() + 12) % 24);
    });

    const applyTime = (hour: number, minute: number) => {
        const next = new Date(value);
        next.setHours(hour, minute, 0, 0);
        onChange(next, 'time');
    };

    const hourNow = value.getHours();
    const minuteNow = value.getMinutes();
    const hTens = Math.floor(hourNow / 10);
    const hOnes = hourNow % 10;
    const mTens = Math.floor(minuteNow / 10);
    const mOnes = minuteNow % 10;

    const spinHTens = (dir: 1 | -1) => {
        const nextTens = (hTens + dir + 3) % 3;
        const nextOnes = nextTens === 2 && hOnes > 3 ? 3 : hOnes;
        applyTime(nextTens * 10 + nextOnes, minuteNow);
    };

    const spinHOnes = (dir: 1 | -1) => {
        const max = hTens === 2 ? 3 : 9;
        applyTime(hTens * 10 + ((hOnes + dir + max + 1) % (max + 1)), minuteNow);
    };

    const spinMTens = (dir: 1 | -1) => {
        applyTime(hourNow, ((mTens + dir + 6) % 6) * 10 + mOnes);
    };

    const spinMOnes = (dir: 1 | -1) => {
        applyTime(hourNow, mTens * 10 + ((mOnes + dir + 10) % 10));
    };

    const openTimeSpinner = () => {
        if (timeAsleep) onChange(new Date(value), 'time');
        setShowTimeSpinner(true);
    };

    // ---- typed input ----

    const onDateTyped = (text: string) => {
        setDateText(text);
        if (text.trim() === '') {
            setDateBad(false);
            // Optional date: an emptied box means "no date" — tell the page.
            if (optionalDate) onClearDate?.();
            return;
        }
        const p = parseDateText(text);
        if (p) {
            setDateBad(false);
            const next = new Date(value);
            next.setFullYear(p.year, p.month, p.day);
            onChange(next, 'date');
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
            onChange(next, 'time');
        }
    };

    const onDateBlur = () => {
        dateFocused.current = false;
        const p = parseDateText(dateText);
        // Optional date + empty box: stay empty — empty MEANS "no date" here,
        // so blur must not repaint it from the spinners (#27-new). This is the
        // whole of the fault it was built to cure.
        if (optionalDate && dateText.trim() === '') { setDateBad(false); }
        // Empty or valid: repaint from the spinners' value, no red. Only a
        // non-empty value that isn't a real date goes red.
        else if (p || dateText.trim() === '') { setDateText(formatDateMMDDYY(value)); setDateBad(false); }
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
            {caption !== '' && <Text style={styles.caption}>{caption}</Text>}
        </View>
    );

    const h = value.getHours();
    let h12 = h % 12; if (h12 === 0) h12 = 12;

    return (
        <View>
            {mode !== 'time' && (
                <>
                    <Text style={styles.inputLabel}>{dateLabel}</Text>
                    <View style={[styles.stepperRow, dateAsleep && styles.rowAsleep]}>
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
                    <Text style={styles.hint}>
                        {dateAsleep
                            ? 'No date set — tap the arrows or type a date to set one'
                            : 'Type the date (MM/DD/YY) — zeros added for you'}
                    </Text>
                </>
            )}

            {mode !== 'date' && (
                <>
                    <Text style={styles.inputLabel}>{timeLabel}</Text>
                    <View style={[styles.timeRow, timeAsleep && styles.rowAsleep]}>
                        <Stepper display={pad2(h12)} caption="Hour"
                            up={() => adjustHour('up')} down={() => adjustHour('down')} displayStyle={styles.timeDisplay} />
                        <Text style={styles.timeDisplay}>:</Text>
                        <Stepper display={pad2(value.getMinutes())} caption="Minute"
                            up={() => adjustMinute(1)} down={() => adjustMinute(-1)} displayStyle={styles.timeDisplay} />
                        <Stepper display={h < 12 ? 'AM' : 'PM'} caption="AM/PM"
                            up={toggleAmPm} down={toggleAmPm} displayStyle={styles.ampmDisplay} />
                    </View>
                    <TouchableOpacity
                        style={[styles.typeBox, timeBad && styles.typeBoxBad]}
                        onPress={openTimeSpinner}
                    >
                        <Text style={[styles.typeBoxText, timeText === '' && styles.typeBoxPlaceholder]}>
                            {timeText === '' ? 'HH:MM' : timeText}
                        </Text>
                    </TouchableOpacity>
                    <Text style={styles.hint}>
                        {timeAsleep
                            ? 'No time set — tap the arrows or the box to set one'
                            : 'Tap the box to set the time (24-hour clock)'}
                    </Text>
                    {showTimeSpinner && (
                        <Cover visible={showTimeSpinner}>
                            <View style={styles.modalOverlay}>
                                <View style={styles.pickerModal}>
                                    <Text style={styles.modalTitle}>{timeLabel}</Text>
                                    <View style={styles.digitRow}>
                                        <Stepper
                                            display={String(hTens)}
                                            caption=""
                                            up={() => spinHTens(1)}
                                            down={() => spinHTens(-1)}
                                            displayStyle={styles.timeDisplay}
                                        />
                                        <Stepper
                                            display={String(hOnes)}
                                            caption=""
                                            up={() => spinHOnes(1)}
                                            down={() => spinHOnes(-1)}
                                            displayStyle={styles.timeDisplay}
                                        />
                                        <Text style={styles.timeDisplay}>:</Text>
                                        <Stepper
                                            display={String(mTens)}
                                            caption=""
                                            up={() => spinMTens(1)}
                                            down={() => spinMTens(-1)}
                                            displayStyle={styles.timeDisplay}
                                        />
                                        <Stepper
                                            display={String(mOnes)}
                                            caption=""
                                            up={() => spinMOnes(1)}
                                            down={() => spinMOnes(-1)}
                                            displayStyle={styles.timeDisplay}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.doneBtn}
                                        onPress={() => setShowTimeSpinner(false)}
                                    >
                                        <Text style={styles.doneBtnText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Cover>
                    )}
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
    // Dulls whichever half is asleep. Named for the job rather than for the
    // time row, since #27-new gave the date half the same treatment.
    rowAsleep: { opacity: 0.4 },
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
    typeBoxText: { fontSize: 16, color: t.bodyText },
    typeBoxPlaceholder: { color: t.mutedText },
    typeBoxBad: { borderColor: t.buttonDelete, borderWidth: 1.5 },
    hint: { fontSize: 11, color: t.mutedText, marginBottom: 8 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerModal: {
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        width: '100%',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10 },
    digitRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        marginVertical: 8,
    },
    doneBtn: {
        backgroundColor: t.buttonPrimary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    doneBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
});
