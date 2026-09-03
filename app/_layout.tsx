import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Alert } from 'react-native';
import { ThemeProvider } from '../constants/Themes';
import { AppOrientationProvider } from '../components/AppOrientation';
import { CoverRoot } from '../components/Cover';
import * as AppGroup from '../modules/app-group';
import {
    loadReminderItems,
    saveReminderItems,
} from '../modules/reminder-items';
import { showHealthNotice } from '../scheduler/notice';
import { runScheduler } from '../scheduler/scheduler';

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
  // apply it with My Day's existing done-logic, and clear it. We also republish
  // the current My Day items every time the app becomes active, so Siri's voice
  // list stays fresh even if the My Day screen hasn't been opened this session.
  // Runs on mount (cold launch straight from Siri) and on every foreground.
  useEffect(() => {
    const applyPendingNote = async () => {
      if (applyingNote.current) return;
      applyingNote.current = true;
      try {
        const items = await loadReminderItems();
        const daily = items.filter((one) => one.kind === 'daily');
        // Keep Siri's view of the list current.
        AppGroup.setMyDayItems(daily.map((i) => ({ id: i.id, label: i.label })));

        const note = AppGroup.getPendingNote();
        if (!note || note.action !== 'markDone') return;

        // Find the item: prefer the id Siri handed back, else match the label.
        let item = note.itemId ? items.find((i) => i.id === note.itemId) : undefined;
        if (!item && note.label) {
          const spoken = note.label.trim().toLowerCase();
          item = daily.find((i) => i.label.trim().toLowerCase() === spoken);
        }
        if (!item) {
          AppGroup.clearPendingNote();
          return;
        }
        const target = item;

        const { snoozedUntil: _cleared, ...rest } = target;
        void _cleared;
        await saveReminderItems(items.map((i) =>
          i.id === target.id ? { ...rest, completed: true } : i
        ));

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

  // The scheduler owns every reminder. It runs once on launch and again every
  // time the app comes back to the front, and each time it works the whole set
  // of reminders out afresh from the saved lists and makes the phone match. So
  // a reminder that went missing — for any reason at all — comes back on its
  // own, without the screen that owns it ever being opened.
  //
  // While the screens are still arming their own reminders, this is safe: the
  // scheduler matches by name, so a reminder that is already right is left
  // exactly where it is and nothing is ever created twice.
  //
  // #15-new: the run now writes down how it went, and the pop-up speaks if a
  // reminder is not going to arrive. It waits for the run to finish rather than
  // being hung on a page, because on a cold launch the first page draws long
  // before the run is done — and it is shown from here so it finds Patrick
  // wherever he is, not only on the home page.
  //
  // #51-new: ask to show banners while Memory is on screen, the same way
  // Timer already does, then run the scheduler against that answer.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please enable notifications in settings.');
      }
      await runScheduler();
      if (cancelled) return;
      if (status === 'granted') await showHealthNotice();
    })();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runScheduler().then(showHealthNotice);
    });
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!response) return;

    const action = response.actionIdentifier;
    const notifId = response.notification.request.identifier;
    // Dedupe per (notification, action) so we don't re-handle on every re-render.
    const handledKey = `${notifId}:${action}`;
    if (handledId.current === handledKey) return;
    handledId.current = handledKey;

    const data = response.notification.request.content.data;

    // "OK" action: just acknowledge this one alert. iOS already clears the
    // tapped notification; we do nothing else (no done, no snooze, no routing).
    if (action === 'ok') return;

    // "Skip" on a routine banner skips THIS occurrence only. It clears the
    // item's still-pending snooze so it stops nagging this round, but nothing
    // is marked done or logged; the base reminder brings the item back next
    // cycle. The Daily or Weekly base reminder is deliberately not touched.
    if (action === 'skip') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      (async () => {
        // Both routine kinds write their one-off reminder down on the item, so
        // taking it off the phone by hand would not hold: the next run would
        // read the stamp and put the reminder straight back. The stamp is what
        // has to go, and then the scheduler does the taking off.
        //
        // Daily and Weekly use the same saved `snoozedUntil` stamp: one moment
        // in the future for this occurrence only. Skip is registered on
        // `routineactions` and on no other category.
        const source = data?.source as string | undefined;
        const isDay = source === 'daily' || source === 'dailysnooze';
        const isWeek = source === 'weekly' || source === 'weeklysnooze';
        if (!isDay && !isWeek) return;

        const items = await loadReminderItems();
        await saveReminderItems(items.map((it) => {
          if (it.id !== itemId) return it;
          const { snoozedUntil: _cleared, ...rest } = it;
          void _cleared;
          return rest;
        }));
      })();
      return;
    }

    // Snooze action buttons: reschedule only this item, N minutes out, and
    // leave every other reminder untouched.
    if (action === 'snooze15' || action === 'snooze30' || action === 'snooze60') {
      const minutes = action === 'snooze15' ? 15 : action === 'snooze30' ? 30 : 60;
      const source = data?.source as string | undefined;
      const isDay = source === 'daily' || source === 'dailysnooze';
      const isWeek = source === 'weekly' || source === 'weeklysnooze';

      // Both routine kinds write the delay down on the item instead of arming
      // it here.
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
      // of leaving another reminder behind.
      if (isDay || isWeek) {
        const itemId = data?.itemId as string | undefined;
        if (!itemId) return;
        (async () => {
          const items = await loadReminderItems();
          const target = Date.now() + minutes * 60 * 1000;
          await saveReminderItems(items.map((i) =>
            i.id === itemId ? { ...i, snoozedUntil: target } : i
          ));
        })();
      }
      return;
    }

    // Dated-cadence "Delay" buttons push just THIS reminder out by a day, week
    // or month from now. There is no log and no change to the real due date.
    //
    // Nothing is armed here. The stamp on the item IS the delay: the scheduler
    // reads it back and puts the reminder on the phone, so a delay made from a
    // banner and one made on the page are now the same act written the same way.
    // A prior delay needs no cancelling — one stamp per item means one wanted
    // reminder under one name, which the module moves rather than duplicates.
    if (action === 'delayday' || action === 'delayweek' || action === 'delaymonth') {
      const source = data?.source as string | undefined;
      const isDated =
        source === 'monthly' || source === 'monthlydelay'
        || source === 'quarterly' || source === 'quarterlydelay'
        || source === 'yearly' || source === 'yearlydelay';
      if (!isDated) return;
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      const target = new Date();
      if (action === 'delayday') target.setDate(target.getDate() + 1);
      else if (action === 'delayweek') target.setDate(target.getDate() + 7);
      else target.setMonth(target.getMonth() + 1);
      (async () => {
        // Stamp the item. The page reads the same stamp to show the snooze line
        // under its name.
        const items = await loadReminderItems();
        await saveReminderItems(items.map((i) =>
          i.id === itemId ? { ...i, snoozedUntil: target.getTime() } : i
        ));
      })();
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
        const items = await loadReminderItems();
        const item = items.find((i) => i.id === itemId);
        if (!item) return;
        const target = new Date();
        target.setDate(target.getDate() + 1);
        target.setHours(
          typeof item.hour === 'number' ? item.hour : 12,
          typeof item.minute === 'number' ? item.minute : 0,
          0,
          0,
        );
        await saveReminderItems(items.map((i) =>
          i.id === itemId ? { ...i, snoozedUntil: target.getTime() } : i
        ));
      })();
      return;
    }

    // "Done" action button: mark this item complete in storage, the banner
    // equivalent of the on-screen Log (✓) button. It does not cancel the fired
    // reminder. iOS clears the shown banner itself on an action tap, and the
    // base cadence is left alone so it can fire again next time round.
    if (action === 'done') {
      const source = data?.source as string | undefined;
      const itemId = data?.itemId as string | undefined;

      // Weekly Done marks the item complete for this cycle, logs it under the
      // existing history key, and clears any pending snooze. The weekly reset
      // clears the tick when the item's day comes around again.
      if (source === 'weekly' || source === 'weeklysnooze') {
        (async () => {
          const items = await loadReminderItems();
          const fired = new Date(response.notification.date * 1000);
          await saveReminderItems(items.map((c) => {
            if (c.id !== itemId) return c;
            const { snoozedUntil: _cleared, ...rest } = c;
            void _cleared;
            return { ...rest, completed: true, doneAt: Date.now() };
          }));
          const label = (data?.label as string) || 'Chore';
          const histRaw = await AsyncStorage.getItem('weekly_history');
          const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
          const newEntry = {
            id: Date.now().toString(),
            date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: label,
            actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
            what: '',
            note: '',
          };
          await AsyncStorage.setItem('weekly_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));
        })();
        return;
      }

      // Dated-cadence Done logs the completion from the firing time. The repeat
      // recipe is left unchanged; the engine finds the next occurrence.
      if (
        source === 'monthly' || source === 'monthlydelay'
        || source === 'quarterly' || source === 'quarterlydelay'
        || source === 'yearly' || source === 'yearlydelay'
      ) {
        (async () => {
          const items = await loadReminderItems();
          const item = items.find((i) => i.id === itemId);
          if (!item) return;
          const fired = new Date(response.notification.date * 1000);
          const historyKey =
            source === 'monthly' || source === 'monthlydelay' ? 'monthly_history'
            : source === 'quarterly' || source === 'quarterlydelay' ? 'quarterly_history'
            : 'yearly_history';
          const histRaw = await AsyncStorage.getItem(historyKey);
          const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
          const newEntry = {
            id: Date.now().toString(),
            date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
            what: '',
            note: '',
          };
          await AsyncStorage.setItem(historyKey, JSON.stringify([newEntry, ...hist].slice(0, 50)));
          await saveReminderItems(items.map((i) => {
            if (i.id !== itemId) return i;
            const { snoozedUntil, ...rest } = item;
            void snoozedUntil;
            return { ...rest, completed: true };
          }));
        })();
        return;
      }

      if (source !== 'daily' && source !== 'dailysnooze') return;
      (async () => {
        if (itemId) {
          const items = await loadReminderItems();
          await saveReminderItems(items.map((it) => {
            if (it.id !== itemId) return it;
            const { snoozedUntil, ...rest } = it;
            void snoozedUntil;
            return { ...rest, completed: true };
          }));
        }
        const label = (data?.label as string) || 'Reminder';
        const fired = new Date(response.notification.date * 1000);
        const histRaw = await AsyncStorage.getItem('daily_history');
        const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
        const newEntry = {
          id: Date.now().toString(),
          date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
          sched: label,
          actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
          what: '',
          note: '',
        };
        await AsyncStorage.setItem('daily_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));
      })();
      return;
    }

    // Only navigate on a plain tap of the notification body, not action buttons.
    if (action !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const source = data?.source as string | undefined;

    // #13-new: carry the item's own id along with the page. Every reminder the
    // module makes already holds the id of the thing it is about, and it was
    // being dropped right here — so the tap landed on the right page and left
    // the reader to find their own item on it. It now travels as `highlight`,
    // and a page that knows what to do with it lights that row. A page that
    // does not simply ignores it, so this is safe for all of them at once.
    const highlight = data?.itemId as string | undefined;
    const params = highlight ? { highlight } : undefined;

    if (source === 'daily' || source === 'dailysnooze') {
      router.push({ pathname: '/daily', params });
    } else if (source === 'weekly' || source === 'weeklysnooze') {
      router.push({ pathname: '/weekly', params } as Href);
    } else if (source === 'monthly' || source === 'monthlydelay') {
      router.push({ pathname: '/monthly', params } as Href);
    } else if (source === 'quarterly' || source === 'quarterlydelay') {
      router.push({ pathname: '/quarterly', params } as Href);
    } else if (source === 'yearly' || source === 'yearlydelay') {
      router.push({ pathname: '/yearly', params } as Href);
    } else if (source === 'onetime') {
      router.push({ pathname: '/onetime', params } as Href);
    } else if (source === 'memorytest') {
      // The 5-minute recall banner — land straight on the recall screen. There
      // is only ever one reminder from that page, so it needs no highlight
      // (Patrick, #13-new).
      router.push('/memorytest');
    }
  }, [response]);

  return (
    <AppOrientationProvider>
    <ThemeProvider>
    <CoverRoot>
    <Stack screenOptions={{ orientation: 'default' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="shopping" options={{ headerShown: false }} />
      <Stack.Screen name="timer" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="vault" options={{ headerShown: false }} />
      <Stack.Screen name="backup" options={{ headerShown: false }} />
      <Stack.Screen name="memorytest" options={{ headerShown: false }} />
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
      <Stack.Screen name="onetime" options={{ headerShown: false }} />
      <Stack.Screen name="extended" options={{ headerShown: false }} />
      <Stack.Screen name="options" options={{ headerShown: false }} />
    </Stack>
    </CoverRoot>
    </ThemeProvider>
    </AppOrientationProvider>
  );
}