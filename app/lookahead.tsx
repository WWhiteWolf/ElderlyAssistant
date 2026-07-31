import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
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
import DateTimeControl from '../components/DateTimeControl';
import Bridge from '../components/Bridge';
import { Theme, useTheme } from '../constants/Themes';

// Look Ahead — long-lead reminders grouped by repeat interval.
// STEP 2 (#36): page + add/edit + subheadings + history ONLY.
// No notification code here — reminders + re-arm are STEP 3.

type Interval = 'monthly' | '3month' | '6month' | 'yearly';

const INTERVALS: { key: Interval; label: string }[] = [
    { key: 'monthly', label: 'Monthly' },
    { key: '3month', label: '3 Months' },
    { key: '6month', label: '6 Months' },
    { key: 'yearly', label: 'Yearly' },
];

interface LookAheadItem {
    id: string;
    label: string;
    year: number;
    month: number; // 0-11
    day: number;   // 1-31
    hour: number;
    minute: number;
    interval: Interval;
    // Set when a reminder is delayed (banner button, or the on-tile button later).
    // delayedUntil = epoch ms the delayed reminder will fire (used to auto-clear the
    // line once it's passed); delayedLabel = "1 day" | "1 week" | "1 month" shown on
    // the tile. Both clear when the item is marked done or the delay time passes.
    delayedUntil?: number;
    delayedLabel?: string;
}

interface HistoryEntry {
    id: string;
    date: string;
    actual: string;
    sched: string;
    what?: string;
    note?: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// How many months each repeat interval advances by.
const INTERVAL_MONTHS: Record<Interval, number> = { monthly: 1, '3month': 3, '6month': 6, yearly: 12 };

// Roll an item forward to its NEXT occurrence that lands in the future. Adds the
// interval (in months) repeatedly so a long-overdue item still ends up future-dated.
// Clamps to the original anchor day when a target month is shorter (e.g. day 31 → 30).
const advanceItem = (item: LookAheadItem): LookAheadItem => {
    const step = INTERVAL_MONTHS[item.interval];
    let d = new Date(item.year, item.month, item.day, item.hour, item.minute, 0, 0);
    const now = new Date();
    do {
        const tmi = d.getMonth() + step;
        const y = d.getFullYear() + Math.floor(tmi / 12);
        const m = ((tmi % 12) + 12) % 12;
        d = new Date(y, m, Math.min(item.day, daysInMonth(y, m)), item.hour, item.minute, 0, 0);
    } while (d <= now);
    // Rolling forward = this occurrence is done, so any pending delay no longer applies.
    return { ...item, year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), delayedUntil: undefined, delayedLabel: undefined };
};

export default function LookAheadScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);
    const [items, setItems] = useState<LookAheadItem[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [pendingDate, setPendingDate] = useState<Date | null>(null);
    // True while the shared control's typed boxes hold a real date + time;
    // Save is blocked with a warning while false (#59, To-Do's pattern).
    const [pendingDateValid, setPendingDateValid] = useState(true);
    const [pendingInterval, setPendingInterval] = useState<Interval>('monthly');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const [showLogModal, setShowLogModal] = useState(false);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [tempWhat, setTempWhat] = useState('');

    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');
    const [delayItemId, setDelayItemId] = useState<string | null>(null);

    useEffect(() => {
        const setup = async () => {
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
        };
        setup();
    }, []);

    const loadData = async () => {
        try {
            const savedItems = await AsyncStorage.getItem('lookahead_items');
            const parsedItems: LookAheadItem[] = savedItems ? JSON.parse(savedItems) : [];
            // Drop a delay stamp once its reminder time has passed, so the tile line
            // doesn't linger after the delayed reminder has already fired.
            const nowMs = Date.now();
            const cleaned = parsedItems.map(it =>
                it.delayedUntil != null && it.delayedUntil < nowMs
                    ? { ...it, delayedUntil: undefined, delayedLabel: undefined }
                    : it
            );
            setItems(cleaned);
            const savedHist = await AsyncStorage.getItem('lookahead_history');
            if (savedHist) setHistory(JSON.parse(savedHist));
            if (JSON.stringify(cleaned) !== JSON.stringify(parsedItems)) {
                await AsyncStorage.setItem('lookahead_items', JSON.stringify(cleaned));
            }
            // Self-heal: re-arm this page's reminders from the saved items every open.
            await scheduleAll(cleaned);
        } catch (e) {
            console.error(e);
        }
    };

    const saveData = async (i: LookAheadItem[], h: HistoryEntry[]) => {
        await AsyncStorage.setItem('lookahead_items', JSON.stringify(i));
        await AsyncStorage.setItem('lookahead_history', JSON.stringify(h));
    };

    // Cancel only THIS page's base reminders (source 'lookahead'), then schedule one
    // dated reminder per item whose due date/time is still in the future. Leaves
    // delayed reminders (source 'lookaheaddelay') and every other screen untouched.
    const scheduleAll = async (its: LookAheadItem[]) => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            if (n.content.data?.source === 'lookahead') {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        }
        const now = new Date();
        for (const item of its) {
            const due = new Date(item.year, item.month, item.day, item.hour, item.minute, 0, 0);
            if (due > now) {
                await Notifications.scheduleNotificationAsync({
                    content: {
                        title: '🔭 Look Ahead',
                        body: `Time for ${item.label}!`,
                        data: { source: 'lookahead', itemId: item.id, label: item.label },
                        categoryIdentifier: 'lookaheadactions',
                        sound: 'default',
                    },
                    trigger: {
                        type: SchedulableTriggerInputTypes.DATE,
                        date: due,
                    } as Notifications.DateTriggerInput,
                });
            }
        }
    };

    // Drop any pending delayed reminder for one item (used when it's logged, edited,
    // or deleted, so a stale delay can't fire after the item has moved on).
    const cancelDelays = async (itemId: string) => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            if (n.content.data?.source === 'lookaheaddelay' && n.content.data?.itemId === itemId) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        }
    };

    // On-tile Delay: schedule a one-off reminder for this item a day / week / month
    // from now (tagged 'lookaheaddelay' so reschedule-on-load leaves it alone), replace
    // any prior delay, and stamp the item so the "▶ Delayed <amount>" line shows. Same
    // mechanism the notification banner's Delay buttons use.
    const delayItem = async (unit: '1 day' | '1 week' | '1 month') => {
        if (!delayItemId) return;
        const item = items.find(it => it.id === delayItemId);
        if (!item) { setDelayItemId(null); return; }
        const target = new Date();
        if (unit === '1 day') target.setDate(target.getDate() + 1);
        else if (unit === '1 week') target.setDate(target.getDate() + 7);
        else target.setMonth(target.getMonth() + 1);
        await cancelDelays(item.id);
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🔭 Look Ahead',
                body: `Time for ${item.label}!`,
                data: { source: 'lookaheaddelay', itemId: item.id, label: item.label },
                categoryIdentifier: 'lookaheadactions',
                sound: 'default',
            },
            trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: target,
            } as Notifications.DateTriggerInput,
        });
        const updated = items.map(it =>
            it.id === item.id ? { ...it, delayedUntil: target.getTime(), delayedLabel: unit } : it
        );
        setItems(updated);
        saveData(updated, history);
        setDelayItemId(null);
        Alert.alert('Delayed', `${item.label} reminder set for ${unit} from now.`);
    };

    const format12Hour = (h: number, m: number) => {
        const period = h < 12 ? 'AM' : 'PM';
        let hr = h % 12;
        if (hr === 0) hr = 12;
        return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const formatDate = (item: LookAheadItem) =>
        `${MONTH_NAMES[item.month]} ${item.day}, ${item.year}`;

    // ----- Add / Edit -----
    const addEntry = () => {
        setActiveId(null);
        setTempName('');
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        setPendingDate(d);
        setPendingDateValid(true);
        setPendingInterval('monthly');
        setShowEditModal(true);
    };

    const openEdit = (item: LookAheadItem) => {
        setActiveId(item.id);
        setTempName(item.label);
        const d = new Date(item.year, item.month, item.day, item.hour, item.minute, 0, 0);
        setPendingDate(d);
        setPendingDateValid(true);
        setPendingInterval(item.interval);
        setShowEditModal(true);
    };

    const closeEdit = () => {
        setShowEditModal(false);
        setActiveId(null);
        setTempName('');
        setPendingDate(null);
    };

    const saveEdit = () => {
        const name = tempName.trim();
        if (!name) {
            Alert.alert('Missing Name', 'Please enter a name.');
            return;
        }
        if (!pendingDateValid) {
            Alert.alert('Check Date & Time', 'The typed date or time is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        const d = pendingDate || new Date(new Date().setHours(12, 0, 0, 0));
        const fields = {
            label: name,
            year: d.getFullYear(),
            month: d.getMonth(),
            day: d.getDate(),
            hour: d.getHours(),
            minute: d.getMinutes(),
            interval: pendingInterval,
        };
        if (activeId) {
            const editedId = activeId;
            const updated = items.map(it => (it.id === editedId ? { ...it, ...fields, delayedUntil: undefined, delayedLabel: undefined } : it));
            setItems(updated);
            saveData(updated, history);
            // The date may have changed; drop any stale delay and re-arm from the new date.
            cancelDelays(editedId).then(() => scheduleAll(updated));
        } else {
            const newItem: LookAheadItem = { id: Date.now().toString(), ...fields };
            const updated = [...items, newItem];
            setItems(updated);
            saveData(updated, history);
            scheduleAll(updated);
        }
        closeEdit();
    };

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    const updated = items.filter(it => it.id !== id);
                    setItems(updated);
                    saveData(updated, history);
                    // Remove this item's reminders so a deleted item can't still fire.
                    cancelDelays(id).then(() => scheduleAll(updated));
                },
            },
        ]);
    };

    const toggleSelect = (id: string) => {
        setSelectedItemId(prev => (prev === id ? null : id));
    };

    // Reorder swaps the selected item with the nearest item OF THE SAME INTERVAL.
    const moveItem = (direction: 'up' | 'down') => {
        if (!selectedItemId) return;
        const sel = items.find(it => it.id === selectedItemId);
        if (!sel) return;
        const index = items.findIndex(it => it.id === selectedItemId);
        const step = direction === 'up' ? -1 : 1;
        let swap = -1;
        for (let j = index + step; j >= 0 && j < items.length; j += step) {
            if (items[j].interval === sel.interval) { swap = j; break; }
        }
        if (swap === -1) return;
        const updated = [...items];
        [updated[index], updated[swap]] = [updated[swap], updated[index]];
        setItems(updated);
        saveData(updated, history);
    };

    // ----- Log -----
    const openLogModal = (id: string) => {
        setPendingLogId(id);
        setTempWhat('');
        setShowLogModal(true);
    };

    const confirmLog = () => {
        if (!pendingLogId) return;
        const item = items.find(it => it.id === pendingLogId);
        if (!item) return;
        const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
        const newEntry: HistoryEntry = {
            id: Date.now().toString(),
            date: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: now,
            what: tempWhat || '',
            note: '',
        };
        const updatedHist = [newEntry, ...history].slice(0, 50);
        // Mark-done = log it AND roll this item forward to its next future date, then
        // re-arm. Nothing else on the list moves; the item is never removed.
        const advanced = advanceItem(item);
        const updatedItems = items.map(it => (it.id === item.id ? advanced : it));
        setHistory(updatedHist);
        setItems(updatedItems);
        saveData(updatedItems, updatedHist);
        cancelDelays(item.id).then(() => scheduleAll(updatedItems));
        setShowLogModal(false);
        setPendingLogId(null);
    };

    const deleteHistoryEntry = (id: string) => {
        const updated = history.filter(h => h.id !== id);
        setHistory(updated);
        saveData(items, updated);
    };

    const clearAllHistory = () => {
        Alert.alert('Clear All', 'Delete all log entries? This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear All', style: 'destructive', onPress: () => {
                    setHistory([]);
                    saveData(items, []);
                },
            },
        ]);
    };

    // The date/time spinners + type-in boxes live in the shared
    // DateTimeControl (#59) — the old inline stepper helpers are gone.
    const pd = pendingDate || new Date(new Date().setHours(12, 0, 0, 0));

    return (
        <GestureHandlerRootView style={styles.container}>
            <SafeAreaView style={{ backgroundColor: theme.header }} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>Home</Text>
                    </TouchableOpacity>
                    <View style={styles.titleWrap}>
                        <Text style={styles.title}>Look Ahead</Text>
                        <Text style={styles.titleIcon}>🔭</Text>
                    </View>
                    <TouchableOpacity onPress={addEntry} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <Bridge />

            <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }} scrollEventThrottle={16} directionalLockEnabled={true}>

                <View style={styles.section}>
                    <Text style={styles.hintText}>Tap to select for reorder · Edit to change · Swipe to delete</Text>
                    {items.length === 0 && (
                        <Text style={styles.emptyText}>No items yet. Tap “+ Add Entry” to add one.</Text>
                    )}
                    {INTERVALS.map(group => {
                        const groupItems = items.filter(it => it.interval === group.key);
                        if (groupItems.length === 0) return null;
                        return (
                            <View key={group.key} style={styles.group}>
                                <Text style={styles.groupTitle}>{group.label}</Text>
                                {groupItems.map(item => (
                                    <Swipeable
                                        key={item.id}
                                        renderRightActions={() => (
                                            <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteEntry(item.id)}>
                                                <Text style={styles.swipeDeleteText}>Delete</Text>
                                            </TouchableOpacity>
                                        )}
                                    >
                                        <View style={[styles.row, selectedItemId === item.id && styles.rowSelected]}>
                                            <TouchableOpacity style={styles.labelArea} onPress={() => toggleSelect(item.id)}>
                                                <Text style={styles.itemLabel}>{item.label}</Text>
                                                <Text style={styles.itemSub}>{formatDate(item)} · {format12Hour(item.hour, item.minute)}</Text>
                                                {item.delayedUntil != null && (
                                                    <Text style={styles.delayedLabel}>▶ Delayed {item.delayedLabel}</Text>
                                                )}
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)} hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}>
                                                <Text style={styles.editBtnText}>Edit</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.delayRowBtn} onPress={() => setDelayItemId(item.id)}>
                                                <Text style={styles.delayRowBtnText}>Delay</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={styles.logBtn} onPress={() => openLogModal(item.id)}>
                                                <Text style={styles.logBtnText}>Log</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Swipeable>
                                ))}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Look Ahead Log</Text>
                        {history.length > 0 && (
                            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllHistory}>
                                <Text style={styles.clearAllBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView style={styles.historyScroll} nestedScrollEnabled={true}>
                        {history.map(l => (
                            <Swipeable
                                key={l.id}
                                renderRightActions={() => (
                                    <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteHistoryEntry(l.id)}>
                                        <Text style={styles.swipeDeleteText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            >
                                <TouchableOpacity style={styles.historyItem} onPress={() => { setEditEntry(l); setEditWhat(l.what || ''); }}>
                                    <Text style={styles.historyText}>
                                        {l.date} | {l.actual} | {l.sched}{l.what ? ` | ${l.what}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </ScrollView>
                </View>

            </ScrollView>

            {showLogModal && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={tempWhat} onChangeText={setTempWhat} placeholder="Add a note about this entry..." placeholderTextColor={theme.mutedText} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowLogModal(false)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={confirmLog}>
                            <Text style={styles.confirmBtnText}>Log</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {editEntry && (
                <View style={styles.modal}>
                    <Text style={styles.modalTitle}>Edit Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput style={styles.input} value={editWhat} onChangeText={setEditWhat} placeholder="Add a note about this entry..." placeholderTextColor={theme.mutedText} />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            const updated = history.map(h => (h.id === editEntry.id ? { ...h, what: editWhat } : h));
                            setHistory(updated);
                            saveData(items, updated);
                            setEditEntry(null);
                        }}>
                            <Text style={styles.confirmBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {delayItemId && (
                <Modal transparent={true} animationType="fade" visible={!!delayItemId}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>Delay Reminder</Text>
                            <Text style={styles.inputLabel}>
                                {items.find(it => it.id === delayItemId)?.label} — remind me again in:
                            </Text>
                            <View style={styles.delayOptionRow}>
                                <TouchableOpacity style={styles.delayOption} onPress={() => delayItem('1 day')}>
                                    <Text style={styles.delayOptionText}>1 Day</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.delayOption} onPress={() => delayItem('1 week')}>
                                    <Text style={styles.delayOptionText}>1 Week</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.delayOption} onPress={() => delayItem('1 month')}>
                                    <Text style={styles.delayOptionText}>1 Month</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setDelayItemId(null)}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {selectedItemId && (
                <View style={styles.arrowOverlay}>
                    <TouchableOpacity style={styles.arrowBtn} onPress={() => moveItem('up')}>
                        <Text style={styles.arrowText}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.arrowBtn} onPress={() => moveItem('down')}>
                        <Text style={styles.arrowText}>▼</Text>
                    </TouchableOpacity>
                </View>
            )}

            {showEditModal && (
                <Modal transparent={true} animationType="fade" visible={showEditModal}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    {/* #62: paddingVertical 20 → 40 (this popup only) — with the bigger
                        spinner circles the top edge crowded the clock/notch zone, same
                        as To-Do's. Content scrolls if it no longer fits. */}
                    <ScrollView contentContainerStyle={[styles.modalOverlay, { paddingVertical: 40 }]} keyboardShouldPersistTaps="handled">
                        <View style={styles.pickerModal}>
                            <Text style={styles.modalTitle}>{activeId ? 'Edit Entry' : 'New Entry'}</Text>

                            {/* Cancel/Save sit up top near the input, matching To-Do's form (Patrick, #42) */}
                            <View style={styles.modalBtns}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit}>
                                    <Text style={styles.cancelBtnText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.confirmBtn} onPress={saveEdit}>
                                    <Text style={styles.confirmBtnText}>Save</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={tempName}
                                onChangeText={setTempName}
                                placeholder="e.g. Replace smoke alarm battery"
                                placeholderTextColor={theme.mutedText}
                                autoFocus={!activeId}
                            />

                            {/* Shared date/time control (#59) — spinners + type-in
                                boxes, auto-padding, red-border bad-value hint. */}
                            <DateTimeControl
                                value={pd}
                                onChange={setPendingDate}
                                dateLabel="First Due Date"
                                timeLabel="Time"
                                onValidityChange={setPendingDateValid}
                            />

                            <Text style={styles.inputLabel}>Repeat Every</Text>
                            <View style={styles.intervalRow}>
                                {INTERVALS.map(opt => (
                                    <TouchableOpacity
                                        key={opt.key}
                                        style={[styles.intervalOption, pendingInterval === opt.key && styles.intervalOptionActive]}
                                        onPress={() => setPendingInterval(opt.key)}
                                    >
                                        <Text style={[styles.intervalOptionText, pendingInterval === opt.key && styles.intervalOptionTextActive]}>
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    </KeyboardAvoidingView>
                </Modal>
            )}

        </GestureHandlerRootView>
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
    titleWrap: { flex: 1, alignItems: 'center' },
    title: {
        fontSize: 24,
        fontWeight: '500',
        color: t.titleText,
        fontStyle: 'italic',
        fontFamily: 'Georgia',
        textAlign: 'center',
    },
    titleIcon: { fontSize: 24 },
    scroll: { flex: 1 },
    section: {
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 15,
        margin: 12,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10 },
    hintText: { fontSize: 11, color: t.mutedText, marginTop: 2, marginBottom: 8 },
    emptyText: { fontSize: 15, color: t.mutedText, fontStyle: 'italic', paddingVertical: 12, textAlign: 'center' },
    group: { marginBottom: 6 },
    groupTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: t.pill,
        marginTop: 8,
        marginBottom: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: t.cardBorder,
        paddingBottom: 4,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelArea: { flex: 1, marginRight: 10 },
    itemLabel: { fontSize: 17, color: t.bodyText, fontWeight: '500' },
    itemSub: { fontSize: 13, color: t.mutedText, marginTop: 2 },
    delayedLabel: { fontSize: 13, color: t.delay, fontWeight: '600', marginTop: 2 },
    editBtn: {
        backgroundColor: t.pageBackground,
        borderWidth: 0.5,
        borderColor: t.pill,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    editBtnText: { color: t.pill, fontSize: 13, fontWeight: '600' },
    delayRowBtn: {
        backgroundColor: t.delay,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginRight: 8,
    },
    delayRowBtnText: { color: t.delayText, fontSize: 13, fontWeight: '600' },
    delayOptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 12,
    },
    delayOption: {
        flex: 1,
        backgroundColor: t.delay,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 4,
    },
    delayOptionText: { color: t.delayText, fontWeight: '600', fontSize: 16 },
    logBtn: {
        backgroundColor: t.buttonPrimary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    logBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    historySection: { marginHorizontal: 12, marginBottom: 12 },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    historyScroll: {
        height: 300,
        backgroundColor: t.card,
        borderRadius: 8,
        padding: 8,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
    },
    historyItem: { borderBottomWidth: 0.5, borderBottomColor: t.progressTrack, paddingVertical: 6 },
    historyText: { fontSize: 13, color: t.bodyText, lineHeight: 18 },
    clearAllBtn: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 0.5,
        borderColor: t.mutedText,
    },
    clearAllBtnText: { color: t.mutedText, fontSize: 13, fontWeight: '600' },
    modal: {
        position: 'absolute',
        top: 100,
        left: 20,
        right: 20,
        backgroundColor: t.card,
        borderRadius: 12,
        padding: 16,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        zIndex: 999,
    },
    modalOverlay: {
        flexGrow: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pickerModal: { backgroundColor: t.card, borderRadius: 12, padding: 16, width: '100%' },
    modalTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10 },
    inputLabel: { fontSize: 14, color: t.mutedText, marginBottom: 4, marginTop: 6 },
    input: {
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: t.pageBackground,
        marginBottom: 10,
        color: t.bodyText,
    },
    modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
    cancelBtn: {
        backgroundColor: t.buttonNeutral,
        borderWidth: 1.5,
        borderColor: t.buttonNeutralBorder,
        padding: 10,
        borderRadius: 8,
        flex: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    cancelBtnText: { color: t.buttonNeutralText, fontWeight: '600' },
    confirmBtn: { backgroundColor: t.buttonPrimary, borderWidth: 1.5, borderColor: t.buttonPrimary, padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
    confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
    swipeDelete: {
        backgroundColor: t.buttonDelete,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 10,
        marginBottom: 12,
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
    rowSelected: { backgroundColor: t.rowSelected, borderRadius: 8 },
    arrowOverlay: {
        position: 'absolute',
        right: 16,
        bottom: 140,
        backgroundColor: t.buttonPrimary,
        borderRadius: 12,
        padding: 8,
        gap: 8,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        zIndex: 1000,
    },
    arrowBtn: { padding: 10, alignItems: 'center' },
    arrowText: { color: t.buttonPrimaryText, fontSize: 22, fontWeight: '600' },
    intervalRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 4,
    },
    intervalOption: {
        flexGrow: 1,
        flexBasis: '47%',
        backgroundColor: t.pageBackground,
        borderWidth: 0.5,
        borderColor: t.cardBorder,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    intervalOptionActive: { backgroundColor: t.buttonPrimary, borderColor: t.buttonPrimary },
    intervalOptionText: { color: t.bodyText, fontWeight: '600', fontSize: 15 },
    intervalOptionTextActive: { color: t.buttonPrimaryText },
});
