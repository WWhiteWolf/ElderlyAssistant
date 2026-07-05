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
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimeControl from '../components/DateTimeControl';
import { Theme, useTheme } from '../constants/Themes';

// Orders page (#63) — track expected deliveries, one entry PER ITEM
// (a multi-item order = several entries). Spec: docs/handoff.md (#62).
// Built in steps: skeleton (step 2), New/Edit form + list (step 3),
// HERE button + arrival log (step 4, this). Still to come: reminders
// (step 5), banner category (step 6).

interface OrderItem {
    id: string;
    name: string;        // required
    price: string;       // free text, reference only
    store: string;
    address: string;     // delivery address
    orderNumber: string; // optional, reference only
    // Expected "by" date — stored as numbers (app-wide standard).
    year: number;
    month: number; // 0-11
    day: number;   // 1-31
    // Optional delivery window, added by hand later when the store narrows
    // it. All four present together or all absent (checked via startHour).
    startHour?: number;
    startMinute?: number;
    endHour?: number;
    endMinute?: number;
}

// Same HistoryEntry shape as the other pages' logs (My Day, Look Ahead...):
// date + actual = when the package ARRIVED (HERE tapped), sched = item name.
interface HistoryEntry {
    id: string;
    date: string;
    actual: string;
    sched: string;
    what?: string;
    note?: string;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ITEMS_KEY = 'orders_items';
const HISTORY_KEY = 'orders_history';

const format12Hour = (h: number, m: number) => {
    const period = h < 12 ? 'AM' : 'PM';
    let hr = h % 12;
    if (hr === 0) hr = 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${period}`;
};

const formatByDate = (it: OrderItem) => `${MONTH_NAMES[it.month]} ${it.day}, ${it.year}`;

export default function OrdersScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [items, setItems] = useState<OrderItem[]>([]);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // Arrivals-log note editing (tap an entry — Look Ahead's pattern).
    const [editEntry, setEditEntry] = useState<HistoryEntry | null>(null);
    const [editWhat, setEditWhat] = useState('');

    // ----- New/Edit form state -----
    const [showEditModal, setShowEditModal] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [tempPrice, setTempPrice] = useState('');
    const [tempStore, setTempStore] = useState('');
    const [tempAddress, setTempAddress] = useState('');
    const [tempOrderNumber, setTempOrderNumber] = useState('');
    const [pendingBy, setPendingBy] = useState<Date | null>(null);
    const [pendingByValid, setPendingByValid] = useState(true);
    // The window: OFF until "Add Time Window" is tapped (orders usually
    // start with just a "by" date; the store narrows it later).
    const [windowOn, setWindowOn] = useState(false);
    const [pendingStart, setPendingStart] = useState<Date>(new Date());
    const [pendingEnd, setPendingEnd] = useState<Date>(new Date());
    const [pendingStartValid, setPendingStartValid] = useState(true);
    const [pendingEndValid, setPendingEndValid] = useState(true);

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
            const raw = await AsyncStorage.getItem(ITEMS_KEY);
            const parsed: OrderItem[] = raw ? JSON.parse(raw) : [];
            setItems(parsed);
            const rawHist = await AsyncStorage.getItem(HISTORY_KEY);
            if (rawHist) setHistory(JSON.parse(rawHist));
            // Self-heal: re-arm this page's reminders from the saved items
            // every open (Look Ahead's pattern).
            await scheduleAll(parsed);
        } catch (e) {
            console.error(e);
        }
    };

    // ----- Reminders (#62 spec) -----
    // Per entry, re-armed whenever the entry is edited:
    //   1. day-before, at the Settings MIDDAY time
    //   2. morning-of, at the Settings MORNING time
    //   3. window-open  (only when a window is set)
    //   4. window-close (only when a window is set) — "only if HERE not yet
    //      tapped" is handled by cancellation: HERE cancels the entry's
    //      pending reminders, so a tapped package never gets the close nag.
    // Date-only entries get just the first two.
    // All one-shot dated triggers, source 'orders'. categoryIdentifier
    // 'orderactions' is registered in _layout.tsx (step 6).

    // Cancel only THIS page's base reminders, then re-schedule one per kind
    // per item for every date still in the future. Leaves banner-delay
    // snoozes (source 'orderssnooze') and other screens untouched.
    const scheduleAll = async (its: OrderItem[]) => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            if (n.content.data?.source === 'orders') {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        }
        // Global times from Settings — "HH:MM" strings (To-Do's read pattern).
        const morning = ((await AsyncStorage.getItem('reminder_morning_time')) || '08:00').split(':').map(Number);
        const midday = ((await AsyncStorage.getItem('reminder_midday_time')) || '12:00').split(':').map(Number);
        const now = new Date();
        const arm = async (item: OrderItem, when: Date, body: string, kind: string) => {
            if (when <= now) return;
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '📦 Orders',
                    body,
                    data: { source: 'orders', itemId: item.id, label: item.name, kind },
                    categoryIdentifier: 'orderactions',
                    sound: 'default',
                },
                trigger: {
                    type: SchedulableTriggerInputTypes.DATE,
                    date: when,
                } as Notifications.DateTriggerInput,
            });
        };
        for (const item of its) {
            await arm(item, new Date(item.year, item.month, item.day - 1, midday[0], midday[1], 0, 0),
                `${item.name} is expected tomorrow.`, 'daybefore');
            await arm(item, new Date(item.year, item.month, item.day, morning[0], morning[1], 0, 0),
                `${item.name} is expected today.`, 'morningof');
            if (item.startHour != null) {
                await arm(item, new Date(item.year, item.month, item.day, item.startHour, item.startMinute!, 0, 0),
                    `Delivery window is opening for ${item.name}.`, 'windowopen');
                await arm(item, new Date(item.year, item.month, item.day, item.endHour!, item.endMinute!, 0, 0),
                    `Window closed — has ${item.name} arrived? Tap HERE when it has.`, 'windowclose');
            }
        }
    };

    // Drop EVERYTHING pending for one entry — its base reminders AND any
    // banner-delay snoozes — used by HERE and delete so a gone entry can
    // never fire again.
    const cancelForItem = async (itemId: string) => {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
            const src = n.content.data?.source as string | undefined;
            if ((src === 'orders' || src === 'orderssnooze') && n.content.data?.itemId === itemId) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
        }
    };

    const saveItems = async (i: OrderItem[]) => {
        setItems(i);
        await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(i));
    };

    const saveHistory = async (h: HistoryEntry[]) => {
        setHistory(h);
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    };

    // ----- HERE: the package arrived -----
    // Logs the arrival (dated now) and removes the entry from the list.
    // Confirmed first — an accidental tap would silently drop the order.
    const markHere = (item: OrderItem) => {
        Alert.alert('It’s Here?', `Log ${item.name} as arrived and remove it from the list?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'HERE',
                onPress: () => {
                    const now = new Date();
                    const entry: HistoryEntry = {
                        id: Date.now().toString(),
                        date: now.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
                        actual: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
                        sched: item.name,
                        what: item.store !== '' ? item.store : undefined,
                        note: '',
                    };
                    saveHistory([entry, ...history].slice(0, 50));
                    saveItems(items.filter(it => it.id !== item.id));
                    // Arrived — nothing further should fire for this entry
                    // (this is what makes window-close "only if HERE not yet
                    // tapped" true).
                    cancelForItem(item.id);
                },
            },
        ]);
    };

    const deleteHistoryEntry = (id: string) => {
        saveHistory(history.filter(h => h.id !== id));
    };

    const clearAllHistory = () => {
        Alert.alert('Clear All', 'Remove every entry from the arrivals log?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Clear All', style: 'destructive', onPress: () => saveHistory([]) },
        ]);
    };

    // Soonest "by" date first — the delivery you should watch for next
    // sits at the top.
    const sorted = [...items].sort(
        (a, b) =>
            new Date(a.year, a.month, a.day).getTime() -
            new Date(b.year, b.month, b.day).getTime()
    );

    // ----- Add / Edit -----

    const defaultWindow = () => {
        const s = new Date(); s.setHours(12, 0, 0, 0);   // noon
        const e = new Date(); e.setHours(17, 0, 0, 0);   // 5 PM
        return { s, e };
    };

    const openNew = () => {
        setActiveId(null);
        setTempName('');
        setTempPrice('');
        setTempStore('');
        setTempAddress('');
        setTempOrderNumber('');
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        setPendingBy(d);
        setPendingByValid(true);
        setWindowOn(false);
        const { s, e } = defaultWindow();
        setPendingStart(s);
        setPendingEnd(e);
        setPendingStartValid(true);
        setPendingEndValid(true);
        setShowEditModal(true);
    };

    const openEdit = (item: OrderItem) => {
        setActiveId(item.id);
        setTempName(item.name);
        setTempPrice(item.price);
        setTempStore(item.store);
        setTempAddress(item.address);
        setTempOrderNumber(item.orderNumber);
        setPendingBy(new Date(item.year, item.month, item.day, 12, 0, 0, 0));
        setPendingByValid(true);
        const hasWindow = item.startHour != null;
        setWindowOn(hasWindow);
        if (hasWindow) {
            const s = new Date(); s.setHours(item.startHour!, item.startMinute!, 0, 0);
            const e = new Date(); e.setHours(item.endHour!, item.endMinute!, 0, 0);
            setPendingStart(s);
            setPendingEnd(e);
        } else {
            const { s, e } = defaultWindow();
            setPendingStart(s);
            setPendingEnd(e);
        }
        setPendingStartValid(true);
        setPendingEndValid(true);
        setShowEditModal(true);
    };

    const closeEdit = () => {
        setShowEditModal(false);
        setActiveId(null);
    };

    const saveEdit = () => {
        const name = tempName.trim();
        if (!name) {
            Alert.alert('Missing Name', 'Please enter the item name.');
            return;
        }
        if (!pendingByValid) {
            Alert.alert('Check Date', 'The typed date is not a real one. Fix the box outlined in red, then save.');
            return;
        }
        if (windowOn) {
            if (!pendingStartValid || !pendingEndValid) {
                Alert.alert('Check Time', 'A typed window time is not a real one. Fix the box outlined in red, then save.');
                return;
            }
            const startMin = pendingStart.getHours() * 60 + pendingStart.getMinutes();
            const endMin = pendingEnd.getHours() * 60 + pendingEnd.getMinutes();
            if (endMin <= startMin) {
                Alert.alert('Check Window', 'The window end time must be after its start time.');
                return;
            }
        }
        const d = pendingBy || new Date();
        const fields = {
            name,
            price: tempPrice.trim(),
            store: tempStore.trim(),
            address: tempAddress.trim(),
            orderNumber: tempOrderNumber.trim(),
            year: d.getFullYear(),
            month: d.getMonth(),
            day: d.getDate(),
            startHour: windowOn ? pendingStart.getHours() : undefined,
            startMinute: windowOn ? pendingStart.getMinutes() : undefined,
            endHour: windowOn ? pendingEnd.getHours() : undefined,
            endMinute: windowOn ? pendingEnd.getMinutes() : undefined,
        };
        if (activeId) {
            const editedId = activeId;
            const updated = items.map(it => (it.id === editedId ? { ...it, ...fields } : it));
            saveItems(updated);
            // Edited = re-arm (the spec's rule). Also drop any pending
            // banner-delay snooze — the date/window may have moved.
            cancelForItem(editedId).then(() => scheduleAll(updated));
        } else {
            const updated = [...items, { id: Date.now().toString(), ...fields }];
            saveItems(updated);
            scheduleAll(updated);
        }
        closeEdit();
    };

    const deleteEntry = (id: string) => {
        Alert.alert('Delete', 'Remove this order?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    saveItems(items.filter(it => it.id !== id));
                    cancelForItem(id);
                },
            },
        ]);
    };

    return (
        <GestureHandlerRootView style={styles.container}>
            {/* No edges prop (default all edges) — the taller header Patrick
                standardized on in #62. */}
            <SafeAreaView style={{ backgroundColor: theme.header }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Orders</Text>
                    <TouchableOpacity onPress={openNew} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>+ Add Order</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            <ScrollView contentContainerStyle={styles.listArea}>
                <View style={styles.section}>
                    {sorted.length === 0 && (
                        <Text style={styles.emptyText}>
                            No orders yet.{'\n'}Tap “+ Add Order” to add one.
                        </Text>
                    )}
                    {sorted.length > 0 && (
                        <Text style={styles.hintText}>Edit to change · Swipe to delete</Text>
                    )}
                    {sorted.map(item => (
                        <Swipeable
                            key={item.id}
                            renderRightActions={() => (
                                <TouchableOpacity style={styles.swipeDelete} onPress={() => deleteEntry(item.id)}>
                                    <Text style={styles.swipeDeleteText}>Delete</Text>
                                </TouchableOpacity>
                            )}
                        >
                            <View style={styles.row}>
                                <View style={styles.labelArea}>
                                    <Text style={styles.itemLabel}>{item.name}</Text>
                                    {(item.store !== '' || item.price !== '') && (
                                        <Text style={styles.itemSub}>
                                            {item.store}{item.store !== '' && item.price !== '' ? ' · ' : ''}{item.price}
                                        </Text>
                                    )}
                                    <Text style={styles.itemBy}>
                                        By {formatByDate(item)}
                                        {item.startHour != null
                                            ? ` · ${format12Hour(item.startHour, item.startMinute!)} – ${format12Hour(item.endHour!, item.endMinute!)}`
                                            : ''}
                                    </Text>
                                    {item.address !== '' && (
                                        <Text style={styles.itemSub}>{item.address}</Text>
                                    )}
                                    {item.orderNumber !== '' && (
                                        <Text style={styles.itemSub}>Order # {item.orderNumber}</Text>
                                    )}
                                </View>
                                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                                    <Text style={styles.editBtnText}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.hereBtn} onPress={() => markHere(item)}>
                                    <Text style={styles.hereBtnText}>HERE</Text>
                                </TouchableOpacity>
                            </View>
                        </Swipeable>
                    ))}
                </View>

                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Text style={styles.sectionTitle}>Arrivals Log</Text>
                        {history.length > 0 && (
                            <TouchableOpacity style={styles.clearAllBtn} onPress={clearAllHistory}>
                                <Text style={styles.clearAllBtnText}>Clear All</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <ScrollView style={styles.historyScroll} nestedScrollEnabled={true}>
                        {history.length === 0 && (
                            <Text style={styles.emptyText}>Arrived packages will be listed here.</Text>
                        )}
                        {history.map(l => (
                            <Swipeable
                                key={l.id}
                                renderRightActions={() => (
                                    <TouchableOpacity style={styles.swipeDeleteLog} onPress={() => deleteHistoryEntry(l.id)}>
                                        <Text style={styles.swipeDeleteText}>Delete</Text>
                                    </TouchableOpacity>
                                )}
                            >
                                <TouchableOpacity style={styles.historyItem} onPress={() => { setEditEntry(l); setEditWhat(l.note || ''); }}>
                                    <Text style={styles.historyText}>
                                        {l.date} | {l.actual} | {l.sched}{l.what ? ` (${l.what})` : ''}{l.note ? ` | ${l.note}` : ''}
                                    </Text>
                                </TouchableOpacity>
                            </Swipeable>
                        ))}
                    </ScrollView>
                </View>
            </ScrollView>

            {editEntry && (
                <View style={styles.noteModal}>
                    <Text style={styles.modalTitle}>Edit Log Entry</Text>
                    <Text style={styles.inputLabel}>Notes (optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={editWhat}
                        onChangeText={setEditWhat}
                        placeholder="e.g. Left at the back door"
                        placeholderTextColor={theme.mutedText}
                    />
                    <View style={styles.modalBtns}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditEntry(null)}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.confirmBtn} onPress={() => {
                            saveHistory(history.map(h => (h.id === editEntry.id ? { ...h, note: editWhat } : h)));
                            setEditEntry(null);
                        }}>
                            <Text style={styles.confirmBtnText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {showEditModal && (
                <Modal transparent={true} animationType="fade" visible={showEditModal}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        {/* paddingVertical 40 keeps the popup top clear of the
                            clock/notch zone (#62's To-Do / Look Ahead fix). */}
                        <ScrollView contentContainerStyle={[styles.modalOverlay, { paddingVertical: 40 }]} keyboardShouldPersistTaps="handled">
                            <View style={styles.pickerModal}>
                                <Text style={styles.modalTitle}>{activeId ? 'Edit Order' : 'New Order'}</Text>

                                {/* Cancel/Save up top, matching To-Do / Look Ahead (Patrick, #42) */}
                                <View style={styles.modalBtns}>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={closeEdit}>
                                        <Text style={styles.cancelBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmBtn} onPress={saveEdit}>
                                        <Text style={styles.confirmBtnText}>Save</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={styles.inputLabel}>Item Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempName}
                                    onChangeText={setTempName}
                                    placeholder="e.g. Garden hose"
                                    placeholderTextColor={theme.mutedText}
                                    autoFocus={!activeId}
                                />

                                <Text style={styles.inputLabel}>Price</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempPrice}
                                    onChangeText={setTempPrice}
                                    placeholder="e.g. $24.99"
                                    placeholderTextColor={theme.mutedText}
                                />

                                <Text style={styles.inputLabel}>Store</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempStore}
                                    onChangeText={setTempStore}
                                    placeholder="e.g. Amazon"
                                    placeholderTextColor={theme.mutedText}
                                />

                                <Text style={styles.inputLabel}>Delivery Address</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempAddress}
                                    onChangeText={setTempAddress}
                                    placeholder="Where it's being delivered"
                                    placeholderTextColor={theme.mutedText}
                                />

                                <Text style={styles.inputLabel}>Order # (optional)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempOrderNumber}
                                    onChangeText={setTempOrderNumber}
                                    placeholder="For reference only"
                                    placeholderTextColor={theme.mutedText}
                                />

                                {/* Date-only face of the shared control (#63) */}
                                <DateTimeControl
                                    value={pendingBy || new Date()}
                                    onChange={setPendingBy}
                                    mode="date"
                                    dateLabel="Expected By"
                                    onValidityChange={setPendingByValid}
                                />

                                {/* The delivery window — off until the store narrows
                                    the day down; added by hand via Edit. Two time-only
                                    faces of the shared control (#63 decision). */}
                                {!windowOn && (
                                    <TouchableOpacity style={styles.windowToggle} onPress={() => setWindowOn(true)}>
                                        <Text style={styles.windowToggleText}>+ Add Time Window</Text>
                                    </TouchableOpacity>
                                )}
                                {windowOn && (
                                    <>
                                        <DateTimeControl
                                            value={pendingStart}
                                            onChange={setPendingStart}
                                            mode="time"
                                            timeLabel="Window Start"
                                            onValidityChange={setPendingStartValid}
                                        />
                                        <DateTimeControl
                                            value={pendingEnd}
                                            onChange={setPendingEnd}
                                            mode="time"
                                            timeLabel="Window End"
                                            onValidityChange={setPendingEndValid}
                                        />
                                        <TouchableOpacity style={styles.windowToggle} onPress={() => setWindowOn(false)}>
                                            <Text style={styles.windowToggleText}>Remove Time Window</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
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
            backgroundColor: t.header,
            paddingTop: 20,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerBtn: {
            borderWidth: 1,
            borderColor: t.headerButton,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        bridge: { height: 8, backgroundColor: t.bridge },
        listArea: { paddingBottom: 40 },
        section: {
            backgroundColor: t.card,
            borderRadius: 12,
            padding: 15,
            margin: 12,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        hintText: { fontSize: 11, color: t.mutedText, marginTop: 2, marginBottom: 8 },
        emptyText: {
            fontSize: 15,
            color: t.mutedText,
            fontStyle: 'italic',
            paddingVertical: 12,
            textAlign: 'center',
            lineHeight: 22,
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
        itemBy: { fontSize: 14, color: t.bodyText, fontWeight: '600', marginTop: 2 },
        editBtn: {
            backgroundColor: t.pageBackground,
            borderWidth: 0.5,
            borderColor: t.pill,
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 8,
        },
        editBtnText: { color: t.pill, fontSize: 13, fontWeight: '600' },
        // HERE = the page's mark-done action → solid orange in dark (the #51
        // rule), buttonPrimary in light — same treatment as Look Ahead's Log.
        hereBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 8,
            marginLeft: 8,
        },
        hereBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
        sectionTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle },
        historySection: { marginHorizontal: 12, marginBottom: 12 },
        historyHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        historyScroll: {
            height: 220,
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
        noteModal: {
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
        swipeDeleteLog: {
            backgroundColor: t.buttonDelete,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: 10,
        },
        swipeDelete: {
            backgroundColor: t.buttonDelete,
            justifyContent: 'center',
            alignItems: 'center',
            width: 80,
            borderRadius: 10,
            marginBottom: 12,
        },
        swipeDeleteText: { color: t.buttonDeleteText, fontWeight: '600', fontSize: 15 },
        modalOverlay: {
            flexGrow: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
        },
        pickerModal: { backgroundColor: t.card, borderRadius: 12, padding: 16, width: '100%' },
        modalTitle: { fontSize: 18, fontWeight: '600', color: t.cardTitle, marginBottom: 10 },
        modalBtns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
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
        confirmBtn: {
            backgroundColor: t.buttonPrimary,
            borderWidth: 1.5,
            borderColor: t.buttonPrimary,
            padding: 10,
            borderRadius: 8,
            flex: 1,
            alignItems: 'center',
        },
        confirmBtnText: { color: t.buttonPrimaryText, fontWeight: '600' },
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
        windowToggle: {
            backgroundColor: t.pageBackground,
            borderWidth: 0.5,
            borderColor: t.pill,
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 10,
        },
        windowToggleText: { color: t.pill, fontSize: 14, fontWeight: '600' },
    });
