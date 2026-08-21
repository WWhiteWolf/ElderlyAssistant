import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { ThemeProvider } from '../constants/Themes';
import * as AppGroup from '../modules/app-group';
import { runScheduler } from '../scheduler/scheduler';

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
        const routineRaw = await AsyncStorage.getItem('my_routine');
        const routine = routineRaw ? (JSON.parse(routineRaw) as { id: string; label: string; completed: boolean }[]) : [];
        // Keep Siri's view of the list current.
        AppGroup.setMyDayItems(routine.map((i) => ({ id: i.id, label: i.label })));

        const note = AppGroup.getPendingNote();
        if (!note || note.action !== 'markDone') return;

        // Find the item: prefer the id Siri handed back, else match the label.
        let item = note.itemId ? routine.find((i) => i.id === note.itemId) : undefined;
        if (!item && note.label) {
          const spoken = note.label.trim().toLowerCase();
          item = routine.find((i) => i.label.trim().toLowerCase() === spoken);
        }
        if (!item) {
          AppGroup.clearPendingNote();
          return;
        }
        const target = item;

        // Mark complete in my_routine.
        const updatedRoutine = routine.map((i) =>
          i.id === target.id ? { ...i, completed: true } : i
        );
        await AsyncStorage.setItem('my_routine', JSON.stringify(updatedRoutine));

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
        // Land on My Day so the checked tile is visible (same as a banner tap).
        router.push('/myday');
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
      await Notifications.setNotificationCategoryAsync('petssnooze', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'snooze15', buttonTitle: 'Snooze 15 min' },
        { identifier: 'snooze30', buttonTitle: 'Snooze 30 min' },
        { identifier: 'snooze60', buttonTitle: 'Snooze 60 min' },
      ]);
      // To-Do banners carry ONE button (Patrick, #56 — softens #40's
      // buttonless call after living with it): press-and-hold shows just OK,
      // which closes the banner without opening the app (the 'ok' action is
      // a no-op in the handler below). Still no Done/Snooze — a To-Do is a
      // one-time appointment; Done happens in-app after the appointment.
      // The old 'todosnooze' category (OK + Done) stays unregistered; its
      // banner Done handler code below remains harmlessly for any banners
      // scheduled before #40.
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
      // Orders banners (#63): the routineactions set with Done→HERE and no
      // Skip (orders don't recur — Patrick's #62 spec). HERE first, the
      // #62 watch rule. HERE logs the arrival and removes the entry.
      await Notifications.setNotificationCategoryAsync('orderactions', [
        { identifier: 'here', buttonTitle: 'HERE' },
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
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
  useEffect(() => {
    runScheduler();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') runScheduler();
    });
    return () => sub.remove();
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
        // #10-new: a My Day or Pets snooze is written down on the item now, so
        // taking it off the phone by hand would not hold — the module would
        // read the stamp on its next run and put the reminder straight back.
        // The stamp is what has to go, and then the module does the taking off.
        const source = data?.source as string | undefined;
        const storageKey =
          source === 'myday' || source === 'mydaysnooze' ? 'my_routine'
            : source === 'pets' || source === 'petssnooze' ? 'pets_feeds'
              : null;
        if (storageKey) {
          const raw = await AsyncStorage.getItem(storageKey);
          if (raw) {
            const items = JSON.parse(raw) as { id: string; snoozedUntil?: number }[];
            const updated = items.map((it) => {
              if (it.id !== itemId) return it;
              const { snoozedUntil, ...rest } = it;
              return rest;
            });
            await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
          }
          await runScheduler();
          return;
        }

        // My Week's snooze and postpone still go by hand. The snooze is written
        // down nowhere, so the queue is the only place to find it; the postpone
        // IS written down, so cancelling it here does not hold either — that is
        // a My Week fault, recorded and left for the session that fixes it.
        const oneOffSources = ['myweeksnooze', 'myweekpostpone'];
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
          if (oneOffSources.includes(n.content.data?.source as string) && n.content.data?.itemId === itemId) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
          }
        }
      })();
      return;
    }

    // Snooze action buttons: reschedule ONLY this item, N minutes out, and leave
    // every other reminder (To-Do, Timer, other My Day items) untouched.
    if (action === 'snooze15' || action === 'snooze30' || action === 'snooze60') {
      const minutes = action === 'snooze15' ? 15 : action === 'snooze30' ? 30 : 60;
      const label = (data?.label as string) || 'your reminder';
      const source = data?.source as string | undefined;
      const isTodo = source === 'todo';
      const isDay = source === 'myday' || source === 'mydaysnooze';
      const isPets = source === 'pets' || source === 'petssnooze';
      const isWeek = source === 'myweek' || source === 'myweekpostpone' || source === 'myweeksnooze';
      const isOrders = source === 'orders' || source === 'orderssnooze';

      // #10-new: My Day and Pets write the snooze down on the item instead of
      // arming it here.
      //
      // Nothing is scheduled. The stamp on the item IS the snooze: the module
      // reads it back and puts the reminder on the phone, so a snooze made from
      // a banner and one made on the page are the same act written the same
      // way. A prior snooze needs no cancelling — one stamp per item means one
      // wanted reminder under one name, which the module moves rather than
      // duplicates. The item's base DAILY repeat is left alone, as it always
      // was; iOS clears the shown banner itself when an action is tapped.
      //
      // The other pages still arm their own snoozes below, because those are
      // not written down anywhere and the module cannot see them yet.
      if (isDay || isPets) {
        const itemId = data?.itemId as string | undefined;
        if (!itemId) return;
        (async () => {
          const storageKey = isPets ? 'pets_feeds' : 'my_routine';
          const raw = await AsyncStorage.getItem(storageKey);
          const items = raw ? (JSON.parse(raw) as any[]) : [];
          const target = Date.now() + minutes * 60 * 1000;
          const updated = items.map((i) =>
            i.id === itemId ? { ...i, snoozedUntil: target } : i
          );
          await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
          await runScheduler();
        })();
        return;
      }

      // Everything below is To-Do, My Week and Orders only. The My Day and Pets
      // wordings still stand in the choices as the last fallback, but neither
      // page can reach this any more.
      Notifications.scheduleNotificationAsync({
        content: {
          title: isTodo ? `📋 Reminder: ${label}` : isPets ? 'Pets Routine' : isWeek ? 'Weekly Chore' : isOrders ? '📦 Orders' : 'Daily Routine',
          body: isTodo ? label : isOrders ? `Delivery reminder: ${label}` : `Time for ${label}!`,
          // Tag with the snooze source (not 'myday'/'pets'/'myweek') so each
          // screen's reschedule-on-load, which only cancels its own base source,
          // won't wipe this snooze. To-Do has no reschedule-on-load, keeps 'todo'.
          data: isTodo
            ? { source: 'todo', taskId: data?.itemId, itemId: data?.itemId, label }
            : { source: isPets ? 'petssnooze' : isWeek ? 'myweeksnooze' : isOrders ? 'orderssnooze' : 'mydaysnooze', itemId: data?.itemId, label },
          // Keep whatever button set the fired popup had, so a delayed popup
          // re-appears with the same buttons (old per-page category before a
          // page is switched over, 'routineactions' after).
          categoryIdentifier:
            response.notification.request.content.categoryIdentifier ||
            (isTodo ? 'todosnooze' : isPets ? 'petssnooze' : isWeek ? 'routineactions' : isOrders ? 'orderactions' : 'mydaysnooze'),
          // Same sound rule as the on-page Snooze buttons — a banner-tapped
          // snooze was silently rescheduled without this (audit item #1).
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
        } as Notifications.TimeIntervalTriggerInput,
      });
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
      let delayedLabel = '1 day';
      if (action === 'delayday') { target.setDate(target.getDate() + 1); delayedLabel = '1 day'; }
      else if (action === 'delayweek') { target.setDate(target.getDate() + 7); delayedLabel = '1 week'; }
      else { target.setMonth(target.getMonth() + 1); delayedLabel = '1 month'; }
      (async () => {
        // Stamp the item. The page reads the same stamp to show "▶ Delayed
        // <amount>" under its name.
        const raw = await AsyncStorage.getItem('lookahead_items');
        const its = raw ? (JSON.parse(raw) as any[]) : [];
        const updated = its.map((i) =>
          i.id === itemId ? { ...i, delayedUntil: target.getTime(), delayedLabel } : i
        );
        await AsyncStorage.setItem('lookahead_items', JSON.stringify(updated));
        await runScheduler();
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
        const raw = await AsyncStorage.getItem('week_routine');
        const chores = raw ? (JSON.parse(raw) as any[]) : [];
        const chore = chores.find((c) => c.id === itemId);
        if (!chore) return;
        const target = new Date();
        target.setDate(target.getDate() + 1);
        target.setHours(chore.hour, chore.minute, 0, 0);
        // The tile reads the same stamp to show "moved to <day>" next open.
        const updated = chores.map((c) =>
          c.id === itemId ? { ...c, postponedTo: target.getTime() } : c
        );
        await AsyncStorage.setItem('week_routine', JSON.stringify(updated));
        await runScheduler();
      })();
      return;
    }

    // Orders "HERE" (#63): the package arrived. Log the arrival (dated from
    // when HERE was TAPPED — that's when it's in hand, unlike the routine
    // pages' fire-time dating), remove the entry from the list, and cancel
    // everything still pending for it (base reminders + snoozes) so a
    // window-close can never nag about a logged package. Banner equivalent
    // of the page's HERE button — same log shape, same 50-cap.
    if (action === 'here') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      (async () => {
        const raw = await AsyncStorage.getItem('orders_items');
        const orderItems = raw ? (JSON.parse(raw) as any[]) : [];
        const item = orderItems.find((i) => i.id === itemId);
        if (!item) return;
        const now = new Date();
        const histRaw = await AsyncStorage.getItem('orders_history');
        const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
        const entry = {
          id: Date.now().toString(),
          date: now.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
          actual: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
          sched: item.name,
          what: item.store !== '' ? item.store : undefined,
          note: '',
        };
        await AsyncStorage.setItem('orders_history', JSON.stringify([entry, ...hist].slice(0, 50)));
        await AsyncStorage.setItem('orders_items', JSON.stringify(orderItems.filter((i) => i.id !== itemId)));
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
          const src = n.content.data?.source as string | undefined;
          if ((src === 'orders' || src === 'orderssnooze') && n.content.data?.itemId === itemId) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
          }
        }
      })();
      return;
    }

    // "Done" action button: mark this item complete in storage and cancel the
    // fired reminder, the banner equivalent of the on-screen Log (✓) button.
    // The screen's daily reset + reschedule-on-load brings it back tomorrow.
    if (action === 'done') {
      const source = data?.source as string | undefined;
      const itemId = data?.itemId as string | undefined;

      // To-Do "Done": log the completion, then remove the task and cancel all of
      // its alerts. Every To-Do is a one-time task now (recurrence removed, #35),
      // so a Done always finishes the task for good. Mirrors completeTask.
      if (source === 'todo') {
        (async () => {
          const raw = await AsyncStorage.getItem('todo_tasks');
          const tasks = raw ? (JSON.parse(raw) as any[]) : [];
          const task = tasks.find((t) => t.id === itemId);
          if (task) {
            const logRaw = await AsyncStorage.getItem('todo_log');
            const log = logRaw ? (JSON.parse(logRaw) as any[]) : [];
            // To-Do log records the task's ORIGINAL set date/time plus when
            // Done was TAPPED (Patrick, #27). The reminder's fire time is not
            // recorded here.
            let scheduledFor = task.dueDate || '';
            if (task.dueTime) scheduledFor += (scheduledFor ? ' at ' : '') + task.dueTime;
            const entry = {
              id: Date.now().toString(),
              taskTitle: task.title,
              completedDate: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' }),
              scheduledFor,
              notes: task.notes,
            };
            await AsyncStorage.setItem('todo_log', JSON.stringify([entry, ...log].slice(0, 50)));
            await AsyncStorage.setItem('todo_tasks', JSON.stringify(tasks.filter((t) => t.id !== itemId)));
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const n of scheduled) {
              if (n.content.data?.taskId === itemId) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
              }
            }
          }
        })();
        return;
      }

      // My Week "Done": mark the chore complete for the week + log it, and clear
      // any pending postpone. We do NOT cancel the fired notification's id — the
      // base reminder is a WEEKLY repeat that must fire again next week; iOS
      // auto-clears the shown banner on an action tap. (The weekly reset clears
      // the ✓ when the chore's day comes around again.)
      if (source === 'myweek' || source === 'myweekpostpone' || source === 'myweeksnooze') {
        (async () => {
          const raw = await AsyncStorage.getItem('week_routine');
          const chores = raw ? (JSON.parse(raw) as any[]) : [];
          const fired = new Date(response.notification.date * 1000);
          // PAST-CYCLE GUARD (spec #34): if this banner fired BEFORE the chore's
          // most recent scheduled occurrence, it's left over from a previous
          // cycle — log that past completion below, but do NOT check off the
          // current cycle's occurrence.
          const chore = chores.find((c) => c.id === itemId);
          let stale = false;
          if (chore) {
            const now = new Date();
            const d = new Date(now);
            d.setHours(chore.hour, chore.minute, 0, 0);
            let diff = (now.getDay() - chore.day + 7) % 7;
            if (diff === 0 && d.getTime() > now.getTime()) diff = 7;
            d.setDate(d.getDate() - diff);
            stale = fired.getTime() < d.getTime();
          }
          if (!stale) {
            const updated = chores.map((c) =>
              c.id === itemId ? { ...c, completed: true, doneAt: Date.now(), postponedTo: undefined } : c
            );
            await AsyncStorage.setItem('week_routine', JSON.stringify(updated));
          }
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
          // A Done that checked off the current cycle also clears the postpone
          // stamp above, so asking the module to run takes the postponed
          // reminder off the phone. A snooze still has to be hunted down by
          // hand: snoozes are not written down yet and the module cannot see
          // them. A stale banner's Done leaves both alone, having changed
          // nothing about this cycle.
          if (!stale) {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const n of scheduled) {
              if (n.content.data?.source === 'myweeksnooze' && n.content.data?.itemId === itemId) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
              }
            }
            await runScheduler();
          }
        })();
        return;
      }

      // Look Ahead "Done": log the completion (dated from when the reminder fired),
      // roll the item forward to its next future date, cancel this item's base +
      // delayed reminders, and arm the next one. The item stays on the list.
      if (source === 'lookahead' || source === 'lookaheaddelay') {
        (async () => {
          const raw = await AsyncStorage.getItem('lookahead_items');
          const its = raw ? (JSON.parse(raw) as any[]) : [];
          const item = its.find((i) => i.id === itemId);
          if (!item) return;
          // Durable, fire-time-dated history entry (same shape/cap as the on-screen Log).
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
          // Advance to the next occurrence that lands in the future (mirrors the
          // page's advanceItem): add the interval's months, clamping to the anchor day.
          const months = item.interval === 'monthly' ? 1 : item.interval === '3month' ? 3 : item.interval === '6month' ? 6 : 12;
          const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
          let d = new Date(item.year, item.month, item.day, item.hour, item.minute, 0, 0);
          const now = new Date();
          do {
            const tmi = d.getMonth() + months;
            const y = d.getFullYear() + Math.floor(tmi / 12);
            const m = ((tmi % 12) + 12) % 12;
            d = new Date(y, m, Math.min(item.day, dim(y, m)), item.hour, item.minute, 0, 0);
          } while (d <= now);
          const advanced = { ...item, year: d.getFullYear(), month: d.getMonth(), day: d.getDate(), delayedUntil: undefined, delayedLabel: undefined };
          await AsyncStorage.setItem('lookahead_items', JSON.stringify(its.map((i) => (i.id === itemId ? advanced : i))));
          // The new date is written down and the delay stamp is gone, so asking
          // the module to run takes the old reminder and the delayed one off the
          // phone and arms the next date. Nothing is cancelled or armed here.
          await runScheduler();
        })();
        return;
      }

      const isPets = source === 'pets' || source === 'petssnooze';
      const storageKey = isPets ? 'pets_feeds' : 'my_routine';
      const historyKey = isPets ? 'pets_history' : 'my_history';
      (async () => {
        // PAST-DAY GUARD (spec #34): if this banner fired on a PAST day, log
        // that past completion below, but do NOT check off TODAY's occurrence —
        // yesterday's leftover popup mustn't silence today's routine.
        const firedAt = new Date(response.notification.date * 1000);
        const firedOnPastDay = firedAt.toLocaleDateString() !== new Date().toLocaleDateString();
        if (itemId && !firedOnPastDay) {
          const raw = await AsyncStorage.getItem(storageKey);
          if (raw) {
            const items = JSON.parse(raw) as { id: string; completed: boolean; snoozedUntil?: number }[];
            // #10-new: the same write drops any snooze on the item. It is done,
            // so nothing should nag about it again today, and taking the stamp
            // off is all that takes — the module reads the item afresh and
            // takes the reminder back off the phone.
            const updated = items.map((it) => {
              if (it.id !== itemId) return it;
              const { snoozedUntil, ...rest } = it;
              return { ...rest, completed: true };
            });
            await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
          }
        }
        // Write a dated history entry so the item leaves a durable record. The
        // daily reset clears the `completed` flag overnight, so without this an
        // item marked from the banner would vanish. Applies to both My Day
        // (my_history) and Pets Day (pets_history) — same HistoryEntry shape and
        // 50-entry cap their on-screen Log uses. Date + time come from when the
        // reminder FIRED (notification.date), not when Done was tapped — so an
        // item marked just after midnight is filed under the day the reminder
        // was issued, not the next day. iOS reports notification.date in SECONDS
        // (timeIntervalSince1970), so multiply by 1000 to build a JS Date.
        const label = (data?.label as string) || 'Reminder';
        const fired = new Date(response.notification.date * 1000);
        const histRaw = await AsyncStorage.getItem(historyKey);
        const hist = histRaw ? (JSON.parse(histRaw) as any[]) : [];
        const newEntry = {
          id: Date.now().toString(),
          date: fired.toLocaleDateString([], { month: '2-digit', day: '2-digit' }),
          sched: label,
          actual: fired.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false }),
          what: '',
          note: '',
        };
        await AsyncStorage.setItem(historyKey, JSON.stringify([newEntry, ...hist].slice(0, 50)));
        // We do NOT cancel the fired notification's id — the base reminder is a
        // DAILY repeat that must fire again tomorrow; iOS auto-clears the shown
        // banner on an action tap. (Same rule My Week's Done follows above.)
        //
        // #10-new: the snooze needs no hunting through the phone's queue any
        // more. The stamp came off with the checkmark above, so asking the
        // module to run takes the snooze reminder off the phone and leaves the
        // daily repeat where it is. A stale banner's Done changed nothing, so
        // the run finds nothing to do and today's reminders stand.
        await runScheduler();
      })();
      return;
    }

    // Only navigate on a plain tap of the notification body, not action buttons.
    if (action !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const source = data?.source as string | undefined;
    if (source === 'todo') {
      router.push('/todo');
    } else if (source === 'myday' || source === 'mydaysnooze') {
      router.push('/myday');
    } else if (source === 'myweek' || source === 'myweekpostpone' || source === 'myweeksnooze') {
      router.push('/myweek');
    } else if (source === 'pets' || source === 'petssnooze') {
      router.push('/mollie');
    } else if (source === 'lookahead' || source === 'lookaheaddelay') {
      router.push('/lookahead');
    } else if (source === 'orders' || source === 'orderssnooze') {
      router.push('/orders');
    } else if (source === 'memorytest') {
      // The 5-minute recall banner — land straight on the recall screen.
      router.push('/memorytest');
    }
  }, [response]);

  return (
    <ThemeProvider>
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="shopping" options={{ headerShown: false }} />
      <Stack.Screen name="timer" options={{ headerShown: false }} />
      <Stack.Screen name="myday" options={{ headerShown: false }} />
      <Stack.Screen name="myweek" options={{ headerShown: false }} />
      <Stack.Screen name="mollie" options={{ headerShown: false }} />
      <Stack.Screen name="lookahead" options={{ headerShown: false }} />
      <Stack.Screen name="todo" options={{ headerShown: false }} />
      <Stack.Screen name="planner" options={{ headerShown: false }} />
      <Stack.Screen name="watchlist" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="vault" options={{ headerShown: false }} />
      <Stack.Screen name="backup" options={{ headerShown: false }} />
      <Stack.Screen name="memorytest" options={{ headerShown: false }} />
    </Stack>
    </ThemeProvider>
  );
}