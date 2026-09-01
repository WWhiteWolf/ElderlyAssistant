// Scheduled Reminders — the screen that shows what the phone is actually
// holding (step 8 of the scheduler plan).
//
// Its whole point: a missing reminder is invisible until the moment it fails to
// arrive, and by then it is too late to matter. Every other page in the app
// shows the things you have to do. This one shows the reminders themselves, so
// that one which has quietly gone can be found on a quiet afternoon.
//
// The reading and the arithmetic live in `scheduler/queueview.ts`, which Node
// can test. This file only draws.

import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    AppState,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Cover } from '../components/Cover';
import { PageFrame } from '../components/PageFrame';
import { Theme, useTheme } from '../constants/Themes';
import { CEILING } from '../scheduler/reconcile';
import {
    describeTrigger,
    describeWhatIsNotShown,
    describeWhenNext,
    formatMoment,
    groupByWhen,
    repeats,
    toPending,
} from '../scheduler/queueview';
import type { Group, PendingReminder } from '../scheduler/queueview';
import { readQueue } from '../scheduler/scheduler';

export default function RemindersScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [groups, setGroups] = useState<Group[]>([]);
    // Everything the phone is holding, and how much of it this list leaves out
    // — the Timer's alerts, which take up room but are not shown.
    const [held, setHeld] = useState(0);
    const [hidden, setHidden] = useState(0);
    const [loaded, setLoaded] = useState(false);
    // The banner buttons, asked of the phone rather than written down a second
    // time here, so this can never drift from what the housing registers.
    const [buttons, setButtons] = useState<Record<string, string[]>>({});
    // The row whose detail pop-up is open, or nothing.
    const [chosen, setChosen] = useState<PendingReminder | null>(null);

    const refresh = useCallback(async () => {
        try {
            const queue = await readQueue();
            const now = Date.now();
            const rows = queue
                .map((entry) => toPending(entry, now))
                .filter((row): row is PendingReminder => row !== null);

            setGroups(groupByWhen(rows, now));
            setHeld(queue.length);
            setHidden(queue.length - rows.length);

            const categories = await Notifications.getNotificationCategoriesAsync();
            const titles: Record<string, string[]> = {};
            for (const category of categories) {
                titles[category.identifier] = category.actions.map((action) => action.buttonTitle);
            }
            setButtons(titles);
        } catch {
            // A phone that will not answer leaves the list as it was rather
            // than emptying it, which would read as "everything has gone".
        } finally {
            setLoaded(true);
        }
    }, []);

    // Read again on arriving here, and again whenever the app comes back to the
    // front — the module runs then too, so what is on screen would otherwise be
    // one step behind what the phone is holding.
    useFocusEffect(
        useCallback(() => {
            refresh();
            const sub = AppState.addEventListener('change', (state) => {
                if (state === 'active') refresh();
            });
            return () => sub.remove();
        }, [refresh])
    );

    const notShown = describeWhatIsNotShown(hidden);
    const now = Date.now();

    return (
        <View style={styles.container}>
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
                            <Text style={styles.headerBtnText}>Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Scheduled Reminders</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                }
            >

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 16 }}>
                {/* The count sits directly under the header because the number is
                    the thing being looked for. It used to be at the foot of the
                    scroll, where it had to be hunted for (Patrick, #15-new). The
                    ceiling stays quiet on the line beneath — it is reassurance
                    rather than news. */}
                {loaded && (
                    <View style={styles.countBand}>
                        <Text style={styles.countBig}>
                            {held} {held === 1 ? 'reminder' : 'reminders'} set
                        </Text>
                        <Text style={styles.countSmall}>
                            Your phone has room for {CEILING}.
                        </Text>
                    </View>
                )}

                <Text style={styles.intro}>
                    Everything your phone is set to remind you about. If something you
                    expect is not here, that is the reminder to look at. Tap any one for
                    its details.
                </Text>

                {loaded && groups.length === 0 && (
                    <Text style={styles.empty}>
                        Your phone is not holding any reminders from this app right now.
                    </Text>
                )}

                {groups.map((group) => (
                    <View key={group.name}>
                        <Text style={styles.sectionHeader}>{group.name}</Text>
                        <View style={styles.card}>
                            {group.reminders.map((reminder, index) => (
                                <TouchableOpacity
                                    key={reminder.identifier}
                                    style={[styles.row, index > 0 && styles.rowBorder]}
                                    onPress={() => setChosen(reminder)}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.rowLabel}>{reminder.label}</Text>
                                        <Text style={styles.rowSub}>
                                            {reminder.page} — {describeWhenNext(reminder, now)}
                                        </Text>
                                    </View>
                                    <Text style={styles.rowArrow}>›</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {loaded && (
                    <View style={styles.footer}>
                        {/* How full the phone is now lives under the header. What
                            stays here is what the list is not showing, which
                            explains the list rather than the count. */}
                        {notShown && <Text style={styles.footerText}>{notShown}</Text>}
                    </View>
                )}
            </ScrollView>
            </PageFrame>

            <Cover visible={chosen !== null}>
                <View style={styles.modalOverlay}>
                    <View style={styles.detailModal}>
                        <ScrollView>
                            <Text style={styles.modalTitle}>{chosen?.label}</Text>

                            <Text style={styles.detailLabel}>Where it comes from</Text>
                            <Text style={styles.detailValue}>{chosen?.page}</Text>

                            <Text style={styles.detailLabel}>When it fires</Text>
                            <Text style={styles.detailValue}>
                                {describeTrigger(chosen?.trigger ?? null)}
                                {chosen && !repeats(chosen.trigger) && chosen.trigger
                                    ? '\nIt does not repeat — once it fires, it is finished.'
                                    : ''}
                            </Text>

                            <Text style={styles.detailLabel}>Last due</Text>
                            <Text style={styles.detailValue}>
                                {chosen?.lastDue != null
                                    ? formatMoment(chosen.lastDue)
                                    : 'It has not come due yet.'}
                            </Text>

                            <Text style={styles.detailLabel}>Next due</Text>
                            <Text style={styles.detailValue}>
                                {chosen?.nextDue != null
                                    ? formatMoment(chosen.nextDue)
                                    : 'The app has no record of when this one fires.'}
                            </Text>

                            <Text style={styles.detailLabel}>What the banner will say</Text>
                            <Text style={styles.detailValue}>
                                {chosen?.title || '(no heading)'}
                                {'\n'}
                                {chosen?.body || '(no message)'}
                            </Text>

                            <Text style={styles.detailLabel}>Its buttons</Text>
                            <Text style={styles.detailValue}>
                                {chosen?.categoryIdentifier && buttons[chosen.categoryIdentifier]?.length
                                    ? buttons[chosen.categoryIdentifier].join(', ')
                                    : 'None. Press and hold shows nothing to tap.'}
                            </Text>
                        </ScrollView>

                        <TouchableOpacity style={styles.closeBtn} onPress={() => setChosen(null)}>
                            <Text style={styles.closeBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Cover>
        </View>
    );
}

// makeStyles(theme) pattern from home.tsx (#45).
const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            paddingTop: 20,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        headerSpacer: { width: 54 },
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

        // The count, directly under the header. The number is read at a glance,
        // so it is large and on its own line; the ceiling is small and grey.
        countBand: {
            paddingHorizontal: 16,
            paddingTop: 14,
            paddingBottom: 2,
        },
        countBig: {
            fontSize: 22,
            fontWeight: '700',
            color: t.cardTitle,
        },
        countSmall: {
            fontSize: 13,
            color: t.mutedText,
            paddingTop: 2,
        },

        intro: {
            fontSize: 15,
            color: t.bodyText,
            paddingHorizontal: 16,
            paddingTop: 12,
            lineHeight: 21,
        },
        empty: {
            fontSize: 16,
            color: t.mutedText,
            textAlign: 'center',
            paddingHorizontal: 24,
            paddingTop: 28,
            lineHeight: 22,
        },

        // Apple's grouped-list shape: a heading giving the rows beneath it their
        // context, then the rows on one card.
        sectionHeader: {
            fontSize: 13,
            fontWeight: '600',
            color: t.pill,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 4,
            textTransform: 'uppercase',
            letterSpacing: 1,
        },
        card: {
            backgroundColor: t.card,
            borderRadius: 12,
            marginHorizontal: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        // A row is deliberately tall. The whole row is the target, which clears
        // Apple's 44-point minimum several times over.
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 12,
            paddingHorizontal: 12,
        },
        rowBorder: { borderTopWidth: 0.5, borderTopColor: t.cardBorder },
        rowLabel: { fontSize: 17, color: t.cardTitle, fontWeight: '500' },
        // mutedText, not delayText — the "Snoozed till:" line on My Day and Pets
        // used the colour meant for text on a solid button and came out white on
        // white (#11-new). This is the colour for secondary text on a row.
        rowSub: { fontSize: 13, color: t.mutedText, marginTop: 3 },
        rowArrow: { fontSize: 22, color: t.settingArrow, paddingLeft: 8 },

        footer: { paddingHorizontal: 16, paddingTop: 20 },
        footerText: {
            fontSize: 13,
            color: t.mutedText,
            lineHeight: 19,
            textAlign: 'center',
        },

        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        detailModal: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 16,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            width: '100%',
            maxHeight: '80%',
        },
        modalTitle: {
            fontSize: 19,
            fontWeight: '600',
            color: t.cardTitle,
            marginBottom: 12,
            textAlign: 'center',
        },
        detailLabel: {
            fontSize: 12,
            fontWeight: '600',
            color: t.pill,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginTop: 12,
        },
        detailValue: { fontSize: 15, color: t.bodyText, marginTop: 3, lineHeight: 21 },
        closeBtn: {
            backgroundColor: t.buttonPrimary,
            borderWidth: 1.5,
            borderColor: t.buttonPrimary,
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 18,
        },
        closeBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 16 },
    });
