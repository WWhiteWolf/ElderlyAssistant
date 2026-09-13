import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Stack, useRootNavigationState, useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
    type ReminderItem,
    type ReminderKind,
} from '../modules/reminder-items';
import {
  bannerActionOf,
  bannerActionsOf,
  bannerButtonsCodeOf,
  bannerButtonsCodes,
  pushBackStampOf,
} from '../scheduler/banneractions';
import type { BannerButtonsCode } from '../scheduler/inputshape';
import { showHealthNotice } from '../scheduler/notice';
import {
  persistedResponseChecker,
  responseWaitsForOpening,
  rootOpeningCycle,
} from '../scheduler/opening';
import { runScheduler } from '../scheduler/scheduler';
import { translateReminderItems } from '../scheduler/translators/translate';

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

/** True when this item can currently carry this notification category. */
function itemCarriesBannerCategory(
  item: ReminderItem,
  categoryCode: BannerButtonsCode,
): boolean {
  const shaped = translateReminderItems([item], Date.now())[0];
  return shaped?.bannerButtonsCode === categoryCode
    || shaped?.shiftedBannerButtonsCode === categoryCode;
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

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootHousing() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const { preferencesReady } = useThemeControls();
  const housingReady = preferencesReady && rootNavigationState?.key != null;
  const [openingReady, setOpeningReady] = useState(false);
  const response = Notifications.useLastNotificationResponse();
  const appStateRef = useRef(AppState.currentState);
  const applyingNote = useRef(false);
  const firstNoticeEnabledRef = useRef(true);
  const initialOpeningStartedRef = useRef(false);
  const openingCycleRef = useRef<ReturnType<typeof rootOpeningCycle> | null>(null);
  const responseCheckerRef = useRef<((key: string) => Promise<boolean>) | null>(null);
  if (!openingCycleRef.current) {
    openingCycleRef.current = rootOpeningCycle();
  }
  if (!responseCheckerRef.current) {
    responseCheckerRef.current = persistedResponseChecker(
      () => AsyncStorage.getItem(LAST_BANNER_TAP_KEY),
      (key) => AsyncStorage.setItem(LAST_BANNER_TAP_KEY, key),
    );
  }
  const openingCycle = openingCycleRef.current;
  const shouldHandleResponse = responseCheckerRef.current;

  // Finish the one-time launch preparation before either the ordinary opening
  // or a banner body tap can begin the shared sequence.
  useEffect(() => {
    if (!housingReady) return;

    let cancelled = false;

    void (async () => {
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
      firstNoticeEnabledRef.current = status === 'granted';
      setOpeningReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [housingReady]);

  // The root housing owns one ordered opening path. It starts only after the
  // saved appearance, root navigator and launch preparation are ready, and it
  // runs again on every genuine return from the background.
  useEffect(() => {
    if (!openingReady) return;

    appStateRef.current = AppState.currentState;
    const sub = AppState.addEventListener('change', (next) => {
      if (next.match(/inactive|background/)) {
        openingCycle.prepareForNext();
      }
      if (
        appStateRef.current.match(/inactive|background/)
        && next === 'active'
      ) {
        void openingCycle.begin({ runScheduler, showHealthNotice });
      }
      appStateRef.current = next;
    });

    if (!initialOpeningStartedRef.current) {
      initialOpeningStartedRef.current = true;
      void openingCycle.begin({
        runScheduler,
        // The existing permission alert already speaks on a denied first launch.
        showHealthNotice: firstNoticeEnabledRef.current ? showHealthNotice : async () => {},
      });
    }

    return () => {
      sub.remove();
    };
  }, [openingCycle, openingReady]);

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

  // Register the banner categories once. Category ids have no
  // ':' or '-' per Expo's rules.
  useEffect(() => {
    // Register the categories SEQUENTIALLY (await each). Expo registers a
    // category via a read-modify-write of the whole category set; firing them
    // concurrently can race on a cold first-launch cache and drop some
    // on the device. Awaiting each call makes every read-modify-write finish
    // before the next begins.
    (async () => {
      for (const categoryCode of bannerButtonsCodes()) {
        const actions = bannerActionsOf(categoryCode).map((actionDefinition) => ({
          identifier: actionDefinition.actionCode,
          buttonTitle: actionDefinition.buttonTitle,
          ...(actionDefinition.leavesAppClosedBit
            ? { options: { opensAppToForeground: false } }
            : {}),
        }));
        await Notifications.setNotificationCategoryAsync(categoryCode, actions);
      }
    })();
  }, []);

  useEffect(() => {
    if (!response) return;

    const action = response.actionIdentifier;
    const bodyTap = action === Notifications.DEFAULT_ACTION_IDENTIFIER;
    const categoryCode = bodyTap
      ? undefined
      : bannerButtonsCodeOf(response.notification.request.content.categoryIdentifier);
    const actionDefinition = categoryCode
      ? bannerActionOf(categoryCode, action)
      : undefined;
    if (!bodyTap && !actionDefinition) return;

    // A body tap and every action that opens Memory wait until the root can
    // safely house them. OK and Skip keep their closed-app behavior.
    const opensMemory = responseWaitsForOpening(
      bodyTap,
      actionDefinition?.leavesAppClosedBit,
    );
    if (opensMemory && !openingReady) return;

    const notifId = response.notification.request.identifier;
    // Dedupe per (notification, action) so we don't re-handle on every re-render.
    // Expo can still hand back the last tap after the app has died, so the last
    // tap is also written down.
    const handledKey = `${notifId}:${action}`;

    void (async () => {
      if (!(await shouldHandleResponse(handledKey))) return;

      const data = response.notification.request.content.data;

      // A plain body tap joins the root opening sequence. Its item is not read
      // or shown until rollover, scheduling and the notice have all finished.
      if (bodyTap) {
        const itemId = data?.itemId as string | undefined;
        if (!itemId) return;
        await openingCycle.releaseAfterCurrent(async () => {
          const items = await loadReminderItems();
          const item = items.find((one) => one.id === itemId);
          if (!item) return;
          const pathname = pageForKind(item.kind);
          if (!pathname) return;
          router.push({ pathname, params: { highlight: itemId } } as Href);
        });
        return;
      }

      if (!categoryCode || !actionDefinition) return;

      // OK only acknowledges. Then accepts the shifted last day. Neither
      // action changes the saved item.
      if (
        actionDefinition.effectCode === 'acknowledge'
        || actionDefinition.effectCode === 'keepShiftedDay'
      ) {
        return;
      }

      // A changing action first proves that its item still exists and still
      // carries the notification's actual category. An old or impossible
      // category/action pair therefore changes nothing.
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      const items = await loadReminderItems();
      const item = items.find((one) => one.id === itemId);
      if (!item || !itemCarriesBannerCategory(item, categoryCode)) return;

      if (actionDefinition.effectCode === 'done') {
        const fired = new Date(response.notification.date * 1000);
        const clockTime = fired.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        });
        await markReminderDone(itemId, historyKeyFor(item.kind), clockTime);
        return;
      }

      if (actionDefinition.effectCode === 'skip') {
        await applyReminderChange((currentItems) => currentItems.map((current) => {
          if (
            current.id !== itemId
            || !itemCarriesBannerCategory(current, categoryCode)
          ) {
            return current;
          }
          const stamp = thisCycleDueStamp(current);
          if (stamp === undefined) return current;
          const { snoozedUntil: _cleared, ...rest } = current;
          void _cleared;
          return { ...rest, skippedCycleStamp: stamp };
        }));
        return;
      }

      const calculationCode = actionDefinition.pushBackCalculationCode;
      if (!calculationCode) return;
      const startedAt = Date.now();
      await applyReminderChange((currentItems) => {
        const current = currentItems.find((one) => one.id === itemId);
        if (!current || !itemCarriesBannerCategory(current, categoryCode)) {
          return currentItems;
        }
        const target = pushBackStampOf(
          calculationCode,
          startedAt,
          current,
        );
        return currentItems.map((one) =>
          one.id === itemId ? { ...one, snoozedUntil: target } : one
        );
      });
    })().catch(() => {
      // A response failure must not take down the root housing.
    });
  }, [openingCycle, openingReady, response, router, shouldHandleResponse]);

  return (
    <CoverRoot>
    <Stack screenOptions={{ orientation: 'default' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="backup" options={{ headerShown: false }} />
      <Stack.Screen name="user-guide" options={{ headerShown: false }} />
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
      <Stack.Screen name="log" options={{ headerShown: false }} />
    </Stack>
    </CoverRoot>
  );
}

export default function RootLayout() {
  return (
    <AppOrientationProvider>
    <ThemeProvider>
    <RootHousing />
    </ThemeProvider>
    </AppOrientationProvider>
  );
}