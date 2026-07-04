import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { ThemeProvider } from '../constants/Themes';
import * as AppGroup from '../modules/app-group';

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
      await Notifications.setNotificationCategoryAsync('routineactions', [
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
        { identifier: 'skip', buttonTitle: 'Skip', options: { opensAppToForeground: false } },
        { identifier: 'snooze15', buttonTitle: 'Delay 15 min' },
        { identifier: 'snooze30', buttonTitle: 'Delay 30 min' },
        { identifier: 'snooze60', buttonTitle: 'Delay 60 min' },
        { identifier: 'done', buttonTitle: 'Done' },
      ]);
    })();
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
        const oneOffSources = ['mydaysnooze', 'petssnooze', 'myweeksnooze', 'myweekpostpone'];
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
      const isPets = source === 'pets' || source === 'petssnooze';
      const isWeek = source === 'myweek' || source === 'myweekpostpone' || source === 'myweeksnooze';
      Notifications.scheduleNotificationAsync({
        content: {
          title: isTodo ? `📋 Reminder: ${label}` : isPets ? 'Pets Routine' : isWeek ? 'Weekly Chore' : 'Daily Routine',
          body: isTodo ? label : `Time for ${label}!`,
          // Tag with the snooze source (not 'myday'/'pets'/'myweek') so each
          // screen's reschedule-on-load, which only cancels its own base source,
          // won't wipe this snooze. To-Do has no reschedule-on-load, keeps 'todo'.
          data: isTodo
            ? { source: 'todo', taskId: data?.itemId, itemId: data?.itemId, label }
            : { source: isPets ? 'petssnooze' : isWeek ? 'myweeksnooze' : 'mydaysnooze', itemId: data?.itemId, label },
          // Keep whatever button set the fired popup had, so a delayed popup
          // re-appears with the same buttons (old per-page category before a
          // page is switched over, 'routineactions' after).
          categoryIdentifier:
            response.notification.request.content.categoryIdentifier ||
            (isTodo ? 'todosnooze' : isPets ? 'petssnooze' : isWeek ? 'routineactions' : 'mydaysnooze'),
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
    // month from now. No log, no change to the item's real due date — tagged
    // 'lookaheaddelay' so the page's reschedule-on-load (which only clears the base
    // 'lookahead' source) leaves it alone.
    if (action === 'delayday' || action === 'delayweek' || action === 'delaymonth') {
      const label = (data?.label as string) || 'your reminder';
      const itemId = data?.itemId as string | undefined;
      const target = new Date();
      let delayedLabel = '1 day';
      if (action === 'delayday') { target.setDate(target.getDate() + 1); delayedLabel = '1 day'; }
      else if (action === 'delayweek') { target.setDate(target.getDate() + 7); delayedLabel = '1 week'; }
      else { target.setMonth(target.getMonth() + 1); delayedLabel = '1 month'; }
      (async () => {
        // One pending delay per item: drop any prior delayed reminder first.
        if (itemId) {
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          for (const n of scheduled) {
            if (n.content.data?.source === 'lookaheaddelay' && n.content.data?.itemId === itemId) {
              await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
          }
        }
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔭 Look Ahead',
            body: `Time for ${label}!`,
            data: { source: 'lookaheaddelay', itemId, label },
            categoryIdentifier: 'lookaheadactions',
            sound: 'default',
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: target,
          } as Notifications.DateTriggerInput,
        });
        // Stamp the item so the page shows "▶ Delayed <amount>" under its name.
        if (itemId) {
          const raw = await AsyncStorage.getItem('lookahead_items');
          const its = raw ? (JSON.parse(raw) as any[]) : [];
          const updated = its.map((i) =>
            i.id === itemId ? { ...i, delayedUntil: target.getTime(), delayedLabel } : i
          );
          await AsyncStorage.setItem('lookahead_items', JSON.stringify(updated));
        }
      })();
      return;
    }

    // My Week "+1 Day" action: push this chore's reminder to tomorrow at its
    // own time, without opening the app. Replaces any pending postpone for the
    // chore and stamps postponedTo so the tile shows "moved to <day>" next open.
    // We do NOT cancel the fired notification's identifier — for the base WEEKLY
    // reminder that would kill the repeat; iOS auto-clears the shown banner when
    // an action is tapped.
    if (action === 'postpone1') {
      const itemId = data?.itemId as string | undefined;
      if (!itemId) return;
      (async () => {
        const raw = await AsyncStorage.getItem('week_routine');
        const chores = raw ? (JSON.parse(raw) as any[]) : [];
        const chore = chores.find((c) => c.id === itemId);
        if (!chore) return;
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const n of scheduled) {
          if (n.content.data?.source === 'myweekpostpone' && n.content.data?.itemId === itemId) {
            await Notifications.cancelScheduledNotificationAsync(n.identifier);
          }
        }
        const target = new Date();
        target.setDate(target.getDate() + 1);
        target.setHours(chore.hour, chore.minute, 0, 0);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Weekly Chore',
            body: `Time for ${chore.label}!`,
            data: { source: 'myweekpostpone', itemId, label: chore.label },
            categoryIdentifier: 'myweekactions',
            sound: 'default',
          },
          trigger: {
            type: SchedulableTriggerInputTypes.DATE,
            date: target,
          } as Notifications.DateTriggerInput,
        });
        const updated = chores.map((c) =>
          c.id === itemId ? { ...c, postponedTo: target.getTime() } : c
        );
        await AsyncStorage.setItem('week_routine', JSON.stringify(updated));
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
            await AsyncStorage.setItem('todo_log', JSON.stringify([entry, ...log].slice(0, 100)));
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
          // Clear any pending postpone/delay one-offs for this chore — but only
          // when the Done actually checked off the current cycle; a stale
          // banner's Done must leave this cycle's pending reminders alone.
          if (!stale) {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            for (const n of scheduled) {
              if ((n.content.data?.source === 'myweekpostpone' || n.content.data?.source === 'myweeksnooze') && n.content.data?.itemId === itemId) {
                await Notifications.cancelScheduledNotificationAsync(n.identifier);
              }
            }
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
          // Clear this item's base + delayed reminders, then arm the next one.
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          for (const n of scheduled) {
            if ((n.content.data?.source === 'lookahead' || n.content.data?.source === 'lookaheaddelay') && n.content.data?.itemId === itemId) {
              await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
          }
          const due = new Date(advanced.year, advanced.month, advanced.day, advanced.hour, advanced.minute, 0, 0);
          if (due > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🔭 Look Ahead',
                body: `Time for ${advanced.label}!`,
                data: { source: 'lookahead', itemId, label: advanced.label },
                categoryIdentifier: 'lookaheadactions',
                sound: 'default',
              },
              trigger: {
                type: SchedulableTriggerInputTypes.DATE,
                date: due,
              } as Notifications.DateTriggerInput,
            });
          }
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
            const items = JSON.parse(raw) as { id: string; completed: boolean }[];
            const updated = items.map((it) =>
              it.id === itemId ? { ...it, completed: true } : it
            );
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
        await Notifications.cancelScheduledNotificationAsync(notifId);
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
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="vault" options={{ headerShown: false }} />
      <Stack.Screen name="backup" options={{ headerShown: false }} />
    </Stack>
    </ThemeProvider>
  );
}