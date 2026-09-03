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
        const histRaw = await AsyncStorage.getItem('my_history');
        const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
        const newEntry = {
          id: Date.now().toString(),
          date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
          sched: target.label,
          actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
          what: '',
          note: '',
        };
        await AsyncStorage.setItem('my_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));

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

  // Register the My Day snooze category once, so its notifications can show
  // Snooze buttons (15 / 30 / 60 min). Category id has no ':' or '-' per Expo docs.
  useEffect(() => {
    // Register the categories SEQUENTIALLY (await each). Expo registers a
    // category via a read-modify-write of the whole category set; firing all
    // four concurrently can race on a cold first-launch cache and drop some
    // (worked in the Simulator, lost myweekactions on device). Awaiting each
    // call makes every read-modify-write finish before the next begins.
    (async () => {
      await Notifications.setNotificationCategoryAsync('mydaysnooze', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'snooze15', buttonTitle: 'Snooze 15 min' },
        { identifier: 'snooze30', buttonTitle: 'Snooze 30 min' },
        { identifier: 'snooze60', buttonTitle: 'Snooze 60 min' },
      ]);
      // To-Do banners carry ONE button (Patrick, #56 — softens #40's
      // buttonless call after living with it): press-and-hold shows just OK,
      // which closes the banner without opening the app (the 'ok' action is
      // a no-op in the handler below). A To-Do has no need of a snooze
      // (Patrick), so the banner carries that single OK button only.
      // The old 'todosnooze' category (OK + Done) is not registered anywhere,
      // so no To-Do banner can show a Done or a Snooze button. The handler
      // below therefore answers no To-Do button at all: those two branches
      // could never run and have been taken out.
      await Notifications.setNotificationCategoryAsync('todook', [
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
      ]);
      // My Week reminders: mark Done, or push the reminder one day forward.
      await Notifications.setNotificationCategoryAsync('myweekactions', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'postpone1', buttonTitle: '+1 Day' },
      ]);
      // Look Ahead (long-lead) reminders: mark Done, or delay this one reminder by a
      // day / week / month. Delay only pushes this alert out — no log, no date change.
      await Notifications.setNotificationCategoryAsync('lookaheadactions', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'delayday', buttonTitle: 'Delay 1 Day' },
        { identifier: 'delayweek', buttonTitle: 'Delay 1 Week' },
        { identifier: 'delaymonth', buttonTitle: 'Delay 1 Month' },
      ]);
      // A missing day: the last day that exists was used. Then keeps that
      // day; Next Day is a one-day push-back for this occurrence only.
      await Notifications.setNotificationCategoryAsync('shifteddayactions', [
        { identifier: 'then', buttonTitle: 'Then' },
        { identifier: 'nextday', buttonTitle: 'Next Day' },
      ]);
      // Shared ROUTINE popup (Step 4 routine half, #39): ONE button set for
      // My Day / My Week / Pets, replacing their three separate categories.
      // Registered here first; each page starts using it only when its
      // scheduling code switches categoryIdentifier to 'routineactions'.
      // OK = silence just this popup; Skip = this occurrence only (cancels the
      // item's pending one-offs, nothing marked/logged); Delay = snooze this one
      // reminder; Done = check off + log (with a past-day guard).
      // Done FIRST (Patrick, #62): on the Apple Watch the buttons show as a
      // vertical list and he had to scroll to the bottom to reach Done.
      await Notifications.setNotificationCategoryAsync('routineactions', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
        { identifier: 'skip', buttonTitle: 'Skip', options: { opensAppToForeground: false } },
        { identifier: 'snooze15', buttonTitle: 'Delay 15 min' },
        { identifier: 'snooze30', buttonTitle: 'Delay 30 min' },
        { identifier: 'snooze60', buttonTitle: 'Delay 60 min' },
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

    // "Skip" (shared routine popup): skip THIS occurrence only. Cancels the
    // item's still-pending one-off reminders (snoozes / a My Week postpone) so
    // it stops nagging this round — but nothing is marked done and nothing is
    // logged; the base repeat brings the item back next cycle. The base DAILY /
    // WEEKLY reminder is deliberately NOT touched.
    if (action === 'skip') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      (async () => {
        // #10-new, and My Week joins them at #20-new: all three routine screens
        // write their one-off reminder down on the item, so taking it off the
        // phone by hand would not hold — the module would read the stamp on its
        // next run and put the reminder straight back. The stamp is what has to
        // go, and then the module does the taking off.
        //
        // My Day and Pets call theirs a snooze and My Week calls its one a
        // postpone, which is the same thing at a different distance: one moment
        // in the future for this occurrence only. So the only difference here is
        // which field the stamp lives in.
        //
        // Skip is registered on 'routineactions' and on no other category, and
        // that category belongs to these three screens alone, so there is no
        // other source for this to answer for.
        const source = data?.source as string | undefined;
        const isDay = source === 'myday' || source === 'mydaysnooze';
        const isWeek = source === 'myweek' || source === 'myweekpostpone';
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

    // Snooze action buttons: reschedule ONLY this item, N minutes out, and leave
    // every other reminder (To-Do, Timer, other My Day items) untouched.
    if (action === 'snooze15' || action === 'snooze30' || action === 'snooze60') {
      const minutes = action === 'snooze15' ? 15 : action === 'snooze30' ? 30 : 60;
      const source = data?.source as string | undefined;
      const isDay = source === 'myday' || source === 'mydaysnooze';
      const isWeek = source === 'myweek' || source === 'myweekpostpone';

      // #10-new, and My Week joins them at #20-new: the routine screens
      // write the delay down on the item instead of arming it here.
      //
      // Nothing is scheduled. The stamp on the item IS the delay: the module
      // reads it back and puts the reminder on the phone, so a delay made from
      // a banner and one made on the page are the same act written the same
      // way. A prior stamp needs no cancelling — one stamp per item means one
      // wanted reminder under one name, which the module moves rather than
      // duplicates. The item's base repeat is left alone, as it always was;
      // iOS clears the shown banner itself when an action is tapped.
      //
      // My Week's field is called `postponedTo` because that is the word its own
      // page uses on its own button. A snooze and a postpone are the same thing
      // at different distances — one moment in the future for this occurrence
      // only — so they share the one stamp instead of each having its own, and a
      // chore can never be carrying two delays at once.
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

    // Look Ahead "Delay" buttons: push just THIS reminder out by a day / week /
    // month from now. No log, and no change to the item's real due date.
    //
    // Nothing is armed here. The stamp on the item IS the delay: the scheduler
    // reads it back and puts the reminder on the phone, so a delay made from a
    // banner and one made on the page are now the same act written the same way.
    // A prior delay needs no cancelling — one stamp per item means one wanted
    // reminder under one name, which the module moves rather than duplicates.
    if (action === 'delayday' || action === 'delayweek' || action === 'delaymonth') {
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

    // My Week "+1 Day" action: push this chore's reminder to tomorrow at its
    // own time, without opening the app.
    //
    // Nothing is armed here. The stamp on the chore IS the postpone: the
    // scheduler reads it back and puts the reminder on the phone, so a postpone
    // made from a banner and one made on the page are now the same act written
    // the same way. A prior postpone needs no cancelling — one stamp per chore
    // means one wanted reminder under one name, which the module moves rather
    // than duplicates. The chore's base WEEKLY repeat is left alone, as it
    // always was; iOS clears the shown banner itself when an action is tapped.
    if (action === 'postpone1') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      (async () => {
        const items = await loadReminderItems();
        const chore = items.find((c) => c.id === itemId);
        if (!chore) return;
        const target = new Date();
        target.setDate(target.getDate() + 1);
        target.setHours(typeof chore.hour === 'number' ? chore.hour : 12, typeof chore.minute === 'number' ? chore.minute : 0, 0, 0);
        await saveReminderItems(items.map((c) =>
          c.id === itemId ? { ...c, snoozedUntil: target.getTime() } : c
        ));
      })();
      return;
    }

    // "Done" action button: mark this item complete in storage, the banner
    // equivalent of the on-screen Log (✓) button. It does NOT cancel the fired
    // reminder — that was never true of My Week's branch and stopped being true
    // of My Day's and Pets' when the module took the repeats over. iOS clears
    // the shown banner itself on an action tap, and the base repeat is left
    // alone so it fires again next time round.
    if (action === 'done') {
      const source = data?.source as string | undefined;
      const itemId = data?.itemId as string | undefined;

      // A To-Do banner has no Done button, so nothing answers one here. Its
      // branch came out with the snooze above.

      // My Week "Done": mark the chore complete for the week + log it, and clear
      // any pending postpone. We do NOT cancel the fired notification's id — the
      // base reminder is a WEEKLY repeat that must fire again next week; iOS
      // auto-clears the shown banner on an action tap. (The weekly reset clears
      // the ✓ when the chore's day comes around again.)
      if (source === 'myweek' || source === 'myweekpostpone') {
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
          const histRaw = await AsyncStorage.getItem('week_history');
          const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
          const newEntry = {
            id: Date.now().toString(),
            date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: label,
            actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
            what: '',
            note: '',
          };
          await AsyncStorage.setItem('week_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));
        })();
        return;
      }

      // Look Ahead "Done": log the completion (dated from when the reminder fired).
      // The repeat recipe is left unchanged; the engine finds the next occurrence.
      if (source === 'lookahead' || source === 'lookaheaddelay') {
        (async () => {
          const items = await loadReminderItems();
          const item = items.find((i) => i.id === itemId);
          if (!item) return;
          const fired = new Date(response.notification.date * 1000);
          const histRaw = await AsyncStorage.getItem('lookahead_history');
          const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
          const newEntry = {
            id: Date.now().toString(),
            date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
            sched: item.label,
            actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
            what: '',
            note: '',
          };
          await AsyncStorage.setItem('lookahead_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));
          await saveReminderItems(items.map((i) => {
            if (i.id !== itemId) return i;
            const { snoozedUntil, ...rest } = item;
            void snoozedUntil;
            return { ...rest, completed: true };
          }));
        })();
        return;
      }

      if (source === 'pets' || source === 'petssnooze') return;
      if (source !== 'myday' && source !== 'mydaysnooze') return;
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
        const histRaw = await AsyncStorage.getItem('my_history');
        const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
        const newEntry = {
          id: Date.now().toString(),
          date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
          sched: label,
          actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
          what: '',
          note: '',
        };
        await AsyncStorage.setItem('my_history', JSON.stringify([newEntry, ...hist].slice(0, 50)));
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

    if (source === 'todo') {
      router.push({ pathname: '/onetime', params } as Href);
    } else if (source === 'myday' || source === 'mydaysnooze') {
      router.push({ pathname: '/daily', params });
    } else if (source === 'myweek' || source === 'myweekpostpone') {
      router.push({ pathname: '/weekly', params } as Href);
    } else if (source === 'lookahead' || source === 'lookaheaddelay') {
      router.push({ pathname: '/monthly', params } as Href);
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