import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';
import { runScheduler } from '../scheduler/scheduler';

// Memory Test — a 5-word recall test, built so Patrick can track his scores
// before and after starting the PAP mask. The flow matches what his doctor
// did (agreed 2026-07-07): FIVE learning rounds, the RAVLT pattern, then a
// 5-minute delayed recall, the MoCA pattern. Words are displayed as text
// (his call — no audio; a recognized variant, and consistency day to day is
// what makes the scores comparable).
//   1. The app picks 5 words (Patrick must never choose them).
//   2. Five learning rounds, ALWAYS all five even on a perfect round:
//      words shown → hidden → he types them back → scored → next round.
//      The round scores form the learning curve.
//   3. After round five, "I Got It" schedules a notification for 5 minutes
//      out; real life is the distraction. The banner fires with the phone
//      locked.
//   4. At 5 minutes he types what he remembers (delayed recall) — that
//      score is the headline number, same as at the doctor's office.
// One session per day. All round scores + the delayed score log with the date.

const DELAY_MINUTES = 5;

// Simple concrete nouns, one draw of 5 per day. Big enough that the day's
// words can't be predicted or rehearsed in advance.
const WORD_BANK = [
    'apple', 'chair', 'river', 'pencil', 'garden', 'clock', 'bridge', 'candle',
    'mountain', 'blanket', 'kitchen', 'whistle', 'button', 'forest', 'ladder',
    'pillow', 'engine', 'harbor', 'ribbon', 'thunder', 'cabinet', 'feather',
    'lantern', 'valley', 'mirror', 'basket', 'hammer', 'island', 'pepper', 'anchor',
    'window', 'saddle', 'copper', 'meadow', 'barrel', 'donkey', 'jacket', 'marble',
    'napkin', 'orchard', 'puddle', 'rocket', 'shovel', 'teapot', 'turtle', 'velvet',
    'wagon', 'winter', 'yellow', 'zipper', 'castle', 'daisy', 'church', 'finger',
    'guitar', 'helmet', 'lemon', 'magnet', 'needle', 'ocean',
];

// The session walks through these in order. Persisted, so a closed or
// restarted app comes back to the right screen. 'show' → 'entry' → 'between'
// loops five times (the learning rounds) before 'waiting' begins.
type Phase = 'show' | 'entry' | 'between' | 'waiting' | 'recall' | 'done';

const ROUNDS = 5;

interface Session {
    date: string;            // local YYYY-MM-DD — one session per day
    words: string[];
    startTime: number;       // epoch ms of the word draw
    phase: Phase;
    round: number;           // 1..ROUNDS — the current (or just-scored) round
    roundScores: number[];   // one score per completed round — the learning curve
    recallDue: number | null; // epoch ms the 5-minute check is due
    delayedScore: number | null;
}

interface HistoryEntry {
    id: string;
    date: string;            // YYYY-MM-DD
    roundScores: number[];   // the five learning-round scores
    delayedScore: number;
    words: string[];
}

const SESSION_KEY = 'memtest_session';
const HISTORY_KEY = 'memtest_history';

const localDateKey = (d = new Date()): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// Forgiving match: case, stray characters, and a plural 's' don't cost a
// point — and neither does a one-letter typo (see editDistance below).
// Remembering the word is what's being measured, not spelling or typing.
const normalize = (w: string): string =>
    w.trim().toLowerCase().replace(/[^a-z]/g, '').replace(/s$/, '');

// Edit distance with adjacent swaps counted as ONE mistake, so "candel" →
// candle (swap) scores, as do one wrong, one missing, or one extra letter.
const editDistance = (a: string, b: string): number => {
    const m = a.length, n = b.length;
    const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[m][n];
};

const isMatch = (answer: string, target: string): boolean =>
    answer === target || editDistance(answer, target) <= 1;

// The day's draw keeps the 5 words at least 3 edits apart from each other,
// so a one-letter-forgiving answer can never sit between two of them —
// each typo has exactly one word it could mean.
const pickWords = (): string[] => {
    const pool = [...WORD_BANK];
    const chosen: string[] = [];
    while (chosen.length < 5 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        const candidate = pool.splice(idx, 1)[0];
        if (chosen.every(w => editDistance(normalize(w), normalize(candidate)) >= 3)) {
            chosen.push(candidate);
        }
    }
    return chosen;
};

const scoreAnswers = (targets: string[], answers: string[]): number => {
    const targetNorm = targets.map(normalize);
    const matched = new Set<number>();
    answers.map(normalize).filter(Boolean).forEach(a => {
        // Each answer claims at most one word, and each word one answer.
        const hit = targetNorm.findIndex((t, i) => !matched.has(i) && isMatch(a, t));
        if (hit !== -1) matched.add(hit);
    });
    return matched.size;
};

const timeLabel = (ts: number): string =>
    new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function MemoryTestScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [session, setSession] = useState<Session | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [answers, setAnswers] = useState<string[]>(['', '', '', '', '']);
    const [loaded, setLoaded] = useState(false);
    // While 'waiting' with the page open, a light tick flips to 'recall' the
    // moment the 5 minutes are up (the notification covers the phone-locked /
    // app-closed case; this covers sitting on the page).
    const tick = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const setup = async () => {
            // The page owns its own notification setup (house rule from To-Do:
            // never depend on another page having been opened first).
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Needed', 'Please enable notifications in settings.');
            }
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
            await loadData();
            setLoaded(true);
        };
        setup();
        return () => { if (tick.current) clearInterval(tick.current); };
    }, []);

    // Keep the waiting→recall flip live while the page is open.
    useEffect(() => {
        if (tick.current) clearInterval(tick.current);
        if (session?.phase === 'waiting' && session.recallDue != null) {
            tick.current = setInterval(() => {
                setSession(s => {
                    if (s && s.phase === 'waiting' && s.recallDue != null && Date.now() >= s.recallDue) {
                        const moved: Session = { ...s, phase: 'recall' };
                        AsyncStorage.setItem(SESSION_KEY, JSON.stringify(moved)).catch(console.error);
                        return moved;
                    }
                    return s;
                });
            }, 5000);
        }
        return () => { if (tick.current) clearInterval(tick.current); };
    }, [session?.phase, session?.recallDue]);

    const loadData = async () => {
        try {
            const savedHist = await AsyncStorage.getItem(HISTORY_KEY);
            if (savedHist) setHistory(JSON.parse(savedHist));
            const raw = await AsyncStorage.getItem(SESSION_KEY);
            if (!raw) return;
            let s: Session = JSON.parse(raw);
            if (s.date !== localDateKey()) {
                // A leftover unfinished session from another day is meaningless
                // to score late — drop it so today starts clean. (A finished
                // one was already logged; the session copy is just stale.)
                await AsyncStorage.removeItem(SESSION_KEY);
                // With the session gone there is nothing to recall, so the
                // module takes any waiting reminder off the phone.
                await runScheduler();
                return;
            }
            // If the 5 minutes passed while the app was closed, come back
            // straight to the recall screen.
            if (s.phase === 'waiting' && s.recallDue != null && Date.now() >= s.recallDue) {
                s = { ...s, phase: 'recall' };
                await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
            }
            setSession(s);
        } catch (e) {
            console.error(e);
        }
    };

    const saveSession = async (s: Session) => {
        setSession(s);
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(s));
        // The saved session has changed, so let the module work the whole
        // answer out again. It reads the session itself and decides whether the
        // five-minute recall reminder should exist (plan step 5).
        await runScheduler();
    };

    // This page neither arms nor cancels anything. The module owns the one
    // reminder the test ever sets — the five-minute recall — and reads the
    // moment it falls due straight from the saved session, so every save above
    // is all it takes to put that reminder on the phone or take it off again.

    const startSession = async () => {
        const s: Session = {
            date: localDateKey(),
            words: pickWords(),
            startTime: Date.now(),
            phase: 'show',
            round: 1,
            roundScores: [],
            recallDue: null,
            delayedScore: null,
        };
        setAnswers(['', '', '', '', '']);
        await saveSession(s);
    };

    // "I Got It" under the words → hide them, ask for them right back.
    const wordsRead = async () => {
        if (!session) return;
        setAnswers(['', '', '', '', '']);
        await saveSession({ ...session, phase: 'entry' });
    };

    // Score the round just typed. All five rounds always happen — a perfect
    // round doesn't skip ahead (the RAVLT rule, and what the doctor did).
    const checkRound = async () => {
        if (!session) return;
        const score = scoreAnswers(session.words, answers);
        await saveSession({
            ...session,
            roundScores: [...session.roundScores, score],
            phase: 'between',
        });
    };

    // "Next Round" between rounds → show the words again.
    const nextRound = async () => {
        if (!session) return;
        setAnswers(['', '', '', '', '']);
        await saveSession({ ...session, round: session.round + 1, phase: 'show' });
    };

    // "I Got It" after round five → write down when the recall falls due and
    // let him get on with his day. Saving it is what puts the banner on the
    // phone: the module reads the waiting session and arms the five minutes.
    const beginWait = async () => {
        if (!session) return;
        const due = Date.now() + DELAY_MINUTES * 60000;
        setAnswers(['', '', '', '', '']);
        await saveSession({ ...session, phase: 'waiting', recallDue: due });
    };

    const checkDelayed = async () => {
        if (!session) return;
        const score = scoreAnswers(session.words, answers);
        await saveSession({ ...session, delayedScore: score, phase: 'done' });
    };

    // Final "I Got It" → the day's entry joins the log.
    const finishSession = async () => {
        if (!session || session.delayedScore == null) return;
        const entry: HistoryEntry = {
            id: Date.now().toString(),
            date: session.date,
            roundScores: session.roundScores,
            delayedScore: session.delayedScore,
            words: session.words,
        };
        const updated = [entry, ...history.filter(h => h.date !== session.date)];
        setHistory(updated);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        await AsyncStorage.removeItem(SESSION_KEY);
        setSession(null);
    };

    const deleteHistoryEntry = async (id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    };

    const clearAllHistory = () => {
        Alert.alert('Clear All', 'Delete all memory test scores? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All', style: 'destructive', onPress: async () => {
                    setHistory([]);
                    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify([]));
                },
            },
        ]);
    };

    const niceDate = (key: string): string => {
        const d = new Date(`${key}T00:00:00`);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const todayEntry = history.find(h => h.date === localDateKey());

    // ---- the five answer boxes (shared by immediate + delayed recall) ----
    const answerBoxes = (
        <View style={{ marginVertical: 8 }}>
            {answers.map((a, i) => (
                <TextInput
                    key={i}
                    style={styles.answerInput}
                    value={a}
                    onChangeText={text => {
                        const next = [...answers];
                        next[i] = text;
                        setAnswers(next);
                    }}
                    placeholder={`Word ${i + 1}`}
                    placeholderTextColor={theme.mutedText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                />
            ))}
        </View>
    );

    const renderBody = () => {
        if (!loaded) return null;

        // No session running: today's result if done, else the start card.
        if (!session) {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Today's Test</Text>
                    {todayEntry ? (
                        <>
                            <Text style={styles.bigScore}>{todayEntry.delayedScore} / 5</Text>
                            <Text style={styles.hintCenter}>
                                Done for today — recall after {DELAY_MINUTES} minutes
                                (rounds: {todayEntry.roundScores.join(' · ')}). Come back tomorrow.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.bodyText}>
                                You'll be shown 5 words to remember and asked to type them
                                back — {ROUNDS} rounds in a row, then once more {DELAY_MINUTES}{' '}
                                minutes later. A notification will tell you when. The app
                                picks the words.
                            </Text>
                            <TouchableOpacity style={styles.primaryBtn} onPress={startSession}>
                                <Text style={styles.primaryBtnText}>Show Today's Words</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            );
        }

        if (session.phase === 'show') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Round {session.round} of {ROUNDS} — Remember These Words
                    </Text>
                    <Text style={styles.bodyText}>Read them carefully — say each one to yourself.</Text>
                    <View style={styles.wordList}>
                        {session.words.map(w => (
                            <Text key={w} style={styles.wordText}>{w}</Text>
                        ))}
                    </View>
                    <TouchableOpacity style={styles.primaryBtn} onPress={wordsRead}>
                        <Text style={styles.primaryBtnText}>I Got It</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (session.phase === 'entry') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Round {session.round} of {ROUNDS} — Type Them Back
                    </Text>
                    <Text style={styles.bodyText}>Any order is fine.</Text>
                    {answerBoxes}
                    <TouchableOpacity style={styles.primaryBtn} onPress={checkRound}>
                        <Text style={styles.primaryBtnText}>Check My Answer</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (session.phase === 'between') {
            const lastScore = session.roundScores[session.roundScores.length - 1];
            const lastRound = session.round >= ROUNDS;
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>
                        Round {session.round}: {lastScore} / 5
                    </Text>
                    {session.roundScores.length > 1 && (
                        <Text style={styles.hintCenter}>
                            Rounds so far: {session.roundScores.join(' · ')}
                        </Text>
                    )}
                    {lastRound ? (
                        <>
                            <Text style={styles.bodyText}>
                                That's all {ROUNDS} rounds. When you tap the button, a
                                notification will come in {DELAY_MINUTES} minutes for the
                                real test. Go about your business — no rehearsing!
                            </Text>
                            <TouchableOpacity style={styles.primaryBtn} onPress={beginWait}>
                                <Text style={styles.primaryBtnText}>I Got It</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.bodyText}>
                                On to round {session.round + 1} — the words will show again.
                            </Text>
                            <TouchableOpacity style={styles.primaryBtn} onPress={nextRound}>
                                <Text style={styles.primaryBtnText}>Next Round</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            );
        }

        if (session.phase === 'waiting') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Waiting…</Text>
                    <Text style={styles.bodyText}>
                        Your recall check comes at{' '}
                        <Text style={styles.strongText}>
                            {session.recallDue != null ? timeLabel(session.recallDue) : ''}
                        </Text>
                        . A notification will let you know — you can lock the phone or
                        use other apps. Tapping the banner brings you back here.
                    </Text>
                </View>
            );
        }

        if (session.phase === 'recall') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What Were the 5 Words?</Text>
                    <Text style={styles.bodyText}>Type as many as you remember. Any order.</Text>
                    {answerBoxes}
                    <TouchableOpacity style={styles.primaryBtn} onPress={checkDelayed}>
                        <Text style={styles.primaryBtnText}>Check My Answer</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // phase === 'done' — today's result, waiting for the final I Got It.
        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Today's Result</Text>
                <Text style={styles.bigScore}>{session.delayedScore} / 5</Text>
                <Text style={styles.hintCenter}>
                    Recall after {DELAY_MINUTES} minutes (rounds: {session.roundScores.join(' · ')}).
                </Text>
                <Text style={styles.bodyText}>The words were:</Text>
                <View style={styles.wordList}>
                    {session.words.map(w => (
                        <Text key={w} style={styles.wordText}>{w}</Text>
                    ))}
                </View>
                <TouchableOpacity style={styles.primaryBtn} onPress={finishSession}>
                    <Text style={styles.primaryBtnText}>I Got It</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Memory Test</Text>
                    {/* spacer keeps the title centered — matches the ← Home pill */}
                    <View style={[styles.headerBtn, { opacity: 0 }]}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </View>
                </View>
            </SafeAreaView>

            <Bridge />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
                    {renderBody()}

                    <View style={styles.historySection}>
                        <View style={styles.historyHeader}>
                            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>My Scores</Text>
                            {history.length > 0 && (
                                <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllHistory}>
                                    <Text style={styles.clearAllBtnText}>Clear All</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.historyCard}>
                            {history.length === 0 ? (
                                <Text style={styles.emptyText}>
                                    No tests yet — your scores will build up here day by day.
                                </Text>
                            ) : (
                                history.map(h => (
                                    <Swipeable
                                        key={h.id}
                                        renderRightActions={() => (
                                            <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteHistoryEntry(h.id)}>
                                                <Text style={styles.swipeDeleteText}>Delete</Text>
                                            </TouchableOpacity>
                                        )}
                                    >
                                        <View style={styles.historyItem}>
                                            <Text style={styles.historyText}>
                                                {niceDate(h.date)}  ·  recall {h.delayedScore}/5  ·  rounds {h.roundScores.join('-')}
                                            </Text>
                                        </View>
                                    </Swipeable>
                                ))
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </GestureHandlerRootView>
    );
}

// makeStyles(theme) pattern from home.tsx (#45).
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
        scroll: { flex: 1 },
        section: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 15,
            margin: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: t.cardTitle,
            marginBottom: 10,
        },
        bodyText: { fontSize: 16, color: t.bodyText, lineHeight: 22, marginBottom: 8 },
        strongText: { fontWeight: '700' },
        hintCenter: {
            fontSize: 14,
            color: t.mutedText,
            textAlign: 'center',
            marginBottom: 8,
        },
        wordList: {
            backgroundColor: t.pageBackground,
            borderRadius: 8,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            paddingVertical: 12,
            marginVertical: 8,
        },
        wordText: {
            fontSize: 26,
            fontWeight: '600',
            fontFamily: 'Georgia',
            color: t.bodyText,
            textAlign: 'center',
            paddingVertical: 6,
        },
        answerInput: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 12,
            fontSize: 20,
            backgroundColor: t.pageBackground,
            marginBottom: 8,
            color: t.bodyText,
        },
        primaryBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 6,
        },
        primaryBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 17 },
        bigScore: {
            fontSize: 44,
            fontWeight: '700',
            fontFamily: 'Georgia',
            color: t.cardTitle,
            textAlign: 'center',
            marginVertical: 6,
        },
        historySection: { marginHorizontal: 12, marginBottom: 12 },
        historyHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        historyCard: {
            backgroundColor: t.card,
            borderRadius: 8,
            padding: 8,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        historyItem: {
            borderBottomWidth: 0.5,
            borderBottomColor: t.progressTrack,
            paddingVertical: 8,
        },
        historyText: { fontSize: 15, color: t.bodyText },
        emptyText: { fontSize: 15, color: t.mutedText, fontStyle: 'italic', padding: 6 },
        clearAllBtn: {
            paddingVertical: 4,
            paddingHorizontal: 10,
            borderRadius: 6,
            borderWidth: 0.5,
            borderColor: t.mutedText,
        },
        clearAllBtnText: { color: t.mutedText, fontSize: 13, fontWeight: '600' },
        swipeDelete: {
            backgroundColor: t.buttonDelete,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: 10,
        },
        swipeDeleteText: { color: t.buttonDeleteText, fontWeight: '600', fontSize: 15 },
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
    });
