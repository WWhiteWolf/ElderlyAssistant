import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import { ThemeProvider, useThemeControls } from '../constants/Themes';
import { AppOrientationProvider } from '../components/AppOrientation';
import { CoverRoot } from '../components/Cover';
import * as AppGroup from '../modules/app-group';
import {
    applyReminderChange,
    historyKeyFor,
    loadReminderItems,
    markReminderDone,
    thisCycleDueStamp,
    type ReminderKind,
} from '../modules/reminder-items';
import { showHealthNotice } from '../scheduler/notice';
import { runScheduler } from '../scheduler/scheduler';

const LAST_BANNER_TAP_KEY = 'last_banner_tap';

function pageForKind(kind: ReminderKind): string | null {
  if (kind === 'daily' || kind === 'oneTime') return '/daily';
  if (kind === 'weekly') return '/weekly';
  if (kind === 'monthly') return '/monthly';
  if (kind === 'quarterly') return '/quarterly';
  if (kind === 'yearly') return '/yearly';
  if (kind === 'appointments') return '/appointments';
  if (kind === 'birthdays') return '/birthdays';
  if (kind === 'bucketlist') return '/bucketlist';
  return null;
}

const LEFT_PAGE_KEYS = [
  'shopping_items',
  'memtest_session',
  'memtest_history',
  'vault_items',
  'vault_categories',
  'vault_pin_enabled',
];

async function dropLeftPages() {
  await AsyncStorage.multiRemove(LEFT_PAGE_KEYS);
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => {
        const data = (n.content.data ?? {}) as Record<string, unknown>;
        return (
          data.source === 'memorytest' ||
          data.timerId != null ||
          n.content.categoryIdentifier === 'timer'
        );
      })
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** Runs the scheduler and health notice once preferences are loaded. */
function SchedulerHost() {
  const { preferencesReady } = useThemeControls();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    if (!preferencesReady) return;

    let cancelled = false;
    (async () => {
      try {
        await dropLeftPages();
      } catch {
        // The four pages' keys may linger; reminders still need to arm.
      }
      if (cancelled) return;
      const { status } = await Notifications.requestPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please enable notifications in settings.');
      }
      await runScheduler();
      if (cancelled) return;
      if (status === 'granted') await showHealthNotice();
    })();

    const sub = AppState.addEventListener('change', (next) => {
      if (
        appStateRef.current.match(/inactive|background/)
        && next === 'active'
      ) {
        runScheduler().then(showHealthNotice);
      }
      appStateRef.current = next;
    });

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [preferencesReady]);

  return null;
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

export default function RootLayout() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);
  const applyingNote = useRef(false);

  // Siri "mark item done" (Approach B). The Swift App Intent drops a tiny note
  // into the shared App Group box and wakes the app; here we read that note,
  // apply it with Daily's existing done-logic, and clear it. We also republish
  // the current Daily items every time the app becomes active, so Siri's voice
  // list stays fresh even if the Daily screen hasn't been opened this session.
  // Runs on mount (cold launch straight from Siri) and on every foreground.
  useEffect(() => {
    const applyPendingNote = async () => {
      if (applyingNote.current) return;
      applyingNote.current = true;
      try {
        const note = AppGroup.getPendingNote();
        if (!note || note.action !== 'markDone') {
          const items = await loadReminderItems();
          const daily = items.filter((one) => one.kind === 'daily');
          // Keep Siri's view of the list current.
          AppGroup.setDailyItems(daily.map((i) => ({ id: i.id, label: i.label })));
          return;
        }

        // Find the item: prefer the id Siri handed back, else match the label.
        let target: { id: string; label: string } | undefined;
        await applyReminderChange((items) => {
          const daily = items.filter((one) => one.kind === 'daily');
          let item = note.itemId ? items.find((i) => i.id === note.itemId) : undefined;
          if (!item && note.label) {
            const spoken = note.label.trim().toLowerCase();
            item = daily.find((i) => i.label.trim().toLowerCase() === spoken);
          }
          if (!item) return items;
          target = item;
          const found = item;
          const { snoozedUntil: _cleared, ...rest } = found;
          void _cleared;
          return items.map((i) =>
            i.id === found.id ? { ...rest, completed: true } : i
          );
        });
        if (!target) {
          AppGroup.clearPendingNote();
          return;
        }

        // Durable history entry, dated from when Siri ran (firedAt) — same shape,
        // 50-cap, and fire-time dating as the banner-Done path, so an after-
        // midnight "mark done" still files under the right day.
        const fired = note.firedAt ? new Date(note.firedAt) : new Date();
        const histRaw = await AsyncStorage.getItem('daily_history');
        const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
        const newEntry = {
          id: Date.now().toString(),
          date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
          sched: target.label,
          actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
          what: '',
          note: '',
        };
        await AsyncStorage.setItem('daily_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));

        AppGroup.clearPendingNote();
        // Land on Daily so the checked tile is visible (same as a banner tap).
        router.push('/daily');
      } finally {
        applyingNote.current = false;
      }
    };

    applyPendingNote();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') applyPendingNote();
    });
    return () => sub.remove();
  }, []);

  // Register the four current banner categories once. Category ids have no
  // ':' or '-' per Expo's rules.
  useEffect(() => {
    // Register the categories SEQUENTIALLY (await each). Expo registers a
    // category via a read-modify-write of the whole category set; firing all
    // four concurrently can race on a cold first-launch cache and drop some
    // on the device. Awaiting each call makes every read-modify-write finish
    // before the next begins.
    (async () => {
      // Daily and Weekly share one set: Done, OK, Skip, then the three delays.
      await Notifications.setNotificationCategoryAsync('routineactions', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
        { identifier: 'skip', buttonTitle: 'Skip', options: { opensAppToForeground: false } },
        { identifier: 'snooze15', buttonTitle: 'Delay 15 min' },
        { identifier: 'snooze30', buttonTitle: 'Delay 30 min' },
        { identifier: 'snooze60', buttonTitle: 'Delay 60 min' },
      ]);
      // Monthly, Quarterly and Yearly share the dated-cadence actions.
      await Notifications.setNotificationCategoryAsync('cadenceactions', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'delayday', buttonTitle: 'Delay 1 Day' },
        { identifier: 'delayweek', buttonTitle: 'Delay 1 Week' },
        { identifier: 'delaymonth', buttonTitle: 'Delay 1 Month' },
      ]);
      // Appointments have only OK, which closes the banner without opening.
      await Notifications.setNotificationCategoryAsync('appointmentsok', [
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
      ]);
      // A missing day: the last day that exists was used. Then keeps that
      // day; Next Day is a one-day push-back for this occurrence only.
      await Notifications.setNotificationCategoryAsync('shifteddayactions', [
        { identifier: 'then', buttonTitle: 'Then' },
        { identifier: 'nextday', buttonTitle: 'Next Day' },
      ]);
    })();
  }, []);

  useEffect(() => {
    if (!response) return;

    const action = response.actionIdentifier;
    const notifId = response.notification.request.identifier;
    // Dedupe per (notification, action) so we don't re-handle on every re-render.
    // Expo can still hand back the last tap after the app has died; the in-memory
    // mark is gone then, so the last tap is also written down.
    const handledKey = `${notifId}:${action}`;
    if (handledId.current === handledKey) return;

    let cancelled = false;
    (async () => {
      const previous = await AsyncStorage.getItem(LAST_BANNER_TAP_KEY);
      if (cancelled) return;
      if (previous === handledKey) {
        handledId.current = handledKey;
        return;
      }
      handledId.current = handledKey;
      await AsyncStorage.setItem(LAST_BANNER_TAP_KEY, handledKey);
      if (cancelled) return;

      const data = response.notification.request.content.data;

    // "OK" action: just acknowledge this one alert. iOS already clears the
    // tapped notification; we do nothing else (no done, no snooze, no routing).
    if (action === 'ok') return;

    // Skip drops this cycle and arms the next. It is not Done, and it is not
    // only clearing a snooze. The stamp is this cycle's due moment; the engine
    // reads it and finds the next event. A standing snooze goes with the cycle
    // it belonged to. Skip is registered on `routineactions` and on no other
    // category. The item is found by id, not by the source tag.
    if (action === 'skip') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      await applyReminderChange((items) => items.map((it) => {
        if (it.id !== itemId) return it;
        const { snoozedUntil: _cleared, ...rest } = it;
        void _cleared;
        const stamp = thisCycleDueStamp(it);
        return stamp !== undefined ? { ...rest, skippedCycleStamp: stamp } : rest;
      }));
      return;
    }

    // Delay buttons write the delay on the item instead of arming it here.
    //
    // Nothing is scheduled. The stamp on the item IS the delay: the module
    // reads it back and puts the reminder on the phone, so a delay made from
    // a banner and one made on the page are the same act written the same
    // way. A prior stamp needs no cancelling — one stamp per item means one
    // wanted reminder under one name, which the module moves rather than
    // duplicates. The item's base repeat is left alone, as it always was;
    // iOS clears the shown banner itself when an action is tapped.
    //
    // One `snoozedUntil` stamp means a second delay moves the first instead
    // of leaving another reminder behind. The item is found by id, not by
    // the source tag.
    if (action === 'snooze15' || action === 'snooze30' || action === 'snooze60') {
      const minutes = action === 'snooze15' ? 15 : action === 'snooze30' ? 30 : 60;
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      const target = Date.now() + minutes * 60 * 1000;
      await applyReminderChange((items) => items.map((i) =>
        i.id === itemId ? { ...i, snoozedUntil: target } : i
      ));
      return;
    }

    // Dated-cadence "Delay" buttons push just THIS reminder out by a day, week
    // or month from now. There is no log and no change to the real due date.
    if (action === 'delayday' || action === 'delayweek' || action === 'delaymonth') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      const target = new Date();
      if (action === 'delayday') target.setDate(target.getDate() + 1);
      else if (action === 'delayweek') target.setDate(target.getDate() + 7);
      else target.setMonth(target.getMonth() + 1);
      await applyReminderChange((items) => items.map((i) =>
        i.id === itemId ? { ...i, snoozedUntil: target.getTime() } : i
      ));
      return;
    }

    // Then: this is the day. The last existing day stands. The series does not
    // move. iOS clears the banner; nothing is written.
    if (action === 'then') {
      return;
    }

    // Next Day: one-day push-back for this occurrence only. The recipe stays.
    if (action === 'nextday') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      (async () => {
        await applyReminderChange((items) => {
          const item = items.find((i) => i.id === itemId);
          if (!item) return items;
          const target = new Date();
          target.setDate(target.getDate() + 1);
          target.setHours(
            typeof item.hour === 'number' ? item.hour : 12,
            typeof item.minute === 'number' ? item.minute : 0,
            0,
            0,
          );
          return items.map((i) =>
            i.id === itemId ? { ...i, snoozedUntil: target.getTime() } : i
          );
        });
      })();
      return;
    }

    // Done calls the same door the list uses. The history key is the item's
    // kind. The clock time is the fire time. Dated Done therefore moves the
    // date, as the list already does.
    if (action === 'done') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      const items = await loadReminderItems();
      const item = items.find((one) => one.id === itemId);
      if (!item) return;
      const fired = new Date(response.notification.date * 1000);
      const clockTime = fired.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      });
      await markReminderDone(itemId, historyKeyFor(item.kind), clockTime);
      return;
    }

    // Only navigate on a plain tap of the notification body, not action buttons.
    if (action !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    // The tap opens the item's own page from the saved kind. One Time opens
    // Daily. If there is no item, do nothing. The source tag is not used.
    const itemId = data?.itemId as string | undefined;
    if (!itemId) return;
    const items = await loadReminderItems();
    const item = items.find((one) => one.id === itemId);
    if (!item) return;
    const params = { highlight: itemId };
    const pathname = pageForKind(item.kind);
    if (!pathname) return;
    router.push({ pathname, params } as Href);
    })();
    return () => { cancelled = true; };
  }, [response]);

  return (
    <AppOrientationProvider>
    <ThemeProvider>
    <SchedulerHost />
    <CoverRoot>
    <Stack screenOptions={{ orientation: 'default' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="backup" options={{ headerShown: false }} />
      <Stack.Screen name="reminders" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ headerShown: false }} />
      <Stack.Screen
        name="where"
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      />
      <Stack.Screen name="daily" options={{ headerShown: false }} />
      <Stack.Screen name="item-edit" options={{ headerShown: false }} />
      <Stack.Screen name="weekly" options={{ headerShown: false }} />
      <Stack.Screen name="monthly" options={{ headerShown: false }} />
      <Stack.Screen name="quarterly" options={{ headerShown: false }} />
      <Stack.Screen name="yearly" options={{ headerShown: false }} />
      <Stack.Screen name="appointments" options={{ headerShown: false }} />
      <Stack.Screen name="birthdays" options={{ headerShown: false }} />
      <Stack.Screen name="bucketlist" options={{ headerShown: false }} />
      <Stack.Screen name="options" options={{ headerShown: false }} />
    </Stack>
    </CoverRoot>
    </ThemeProvider>
    </AppOrientationProvider>
  );
}