import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
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
      await Notifications.setNotificationCategoryAsync('todosnooze', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'snooze15', buttonTitle: 'Snooze 15 min' },
        { identifier: 'snooze30', buttonTitle: 'Snooze 30 min' },
        { identifier: 'snooze60', buttonTitle: 'Snooze 60 min' },
        // OK = acknowledge & dismiss just this alert. Doesn't open the app, mark
        // the task done, or touch the task's other scheduled reminders.
        { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
      ]);
      // My Week reminders: mark Done, or push the reminder one day forward.
      await Notifications.setNotificationCategoryAsync('myweekactions', [
        { identifier: 'done', buttonTitle: 'Done' },
        { identifier: 'postpone1', buttonTitle: '+1 Day' },
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

    // Snooze action buttons: reschedule ONLY this item, N minutes out, and leave
    // every other reminder (To-Do, Timer, other My Day items) untouched.
    if (action === 'snooze15' || action === 'snooze30' || action === 'snooze60') {
      const minutes = action === 'snooze15' ? 15 : action === 'snooze30' ? 30 : 60;
      const label = (data?.label as string) || 'your reminder';
      const source = data?.source as string | undefined;
      const isTodo = source === 'todo';
      const isPets = source === 'pets' || source === 'petssnooze';
      Notifications.scheduleNotificationAsync({
        content: {
          title: isTodo ? `📋 Reminder: ${label}` : isPets ? 'Pets Routine' : 'Daily Routine',
          body: isTodo ? label : `Time for ${label}!`,
          // Tag with the snooze source (not 'myday'/'pets') so each screen's
          // reschedule-on-load, which only cancels its own base source, won't
          // wipe this snooze. To-Do has no reschedule-on-load, so it keeps 'todo'.
          data: isTodo
            ? { source: 'todo', taskId: data?.itemId, itemId: data?.itemId, label }
            : { source: isPets ? 'petssnooze' : 'mydaysnooze', itemId: data?.itemId, label },
          categoryIdentifier: isTodo ? 'todosnooze' : isPets ? 'petssnooze' : 'mydaysnooze',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: minutes * 60,
        } as Notifications.TimeIntervalTriggerInput,
      });
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

      // To-Do "Done": log the completion. A repeating task (monthly/yearly)
      // fires again on its own, so leave its schedule and the task in
      // place — just record it as handled this time. A one-time task is finished
      // for good: remove it and cancel all of its alerts. Mirrors completeTask.
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
            // recorded here. scheduledFor = the due date/time, falling back to
            // the recurring pattern (monthly day / yearly month).
            const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            let scheduledFor = '';
            if (task.dueDate) scheduledFor = task.dueDate;
            else if (task.recurring === 'monthly') scheduledFor = `Day ${task.recurDay}`;
            else if (task.recurring === 'yearly') scheduledFor = `${MONTHS[(task.recurMonth || 1) - 1]} ${task.recurDay}`;
            if (task.dueTime) scheduledFor += (scheduledFor ? ' at ' : '') + task.dueTime;
            const entry = {
              id: Date.now().toString(),
              taskTitle: task.title,
              completedDate: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' }),
              scheduledFor,
              notes: task.notes,
            };
            await AsyncStorage.setItem('todo_log', JSON.stringify([entry, ...log].slice(0, 100)));
            if (!task.recurring || task.recurring === 'none') {
              await AsyncStorage.setItem('todo_tasks', JSON.stringify(tasks.filter((t) => t.id !== itemId)));
              const scheduled = await Notifications.getAllScheduledNotificationsAsync();
              for (const n of scheduled) {
                if (n.content.data?.taskId === itemId) {
                  await Notifications.cancelScheduledNotificationAsync(n.identifier);
                }
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
      if (source === 'myweek' || source === 'myweekpostpone') {
        (async () => {
          const raw = await AsyncStorage.getItem('week_routine');
          const chores = raw ? (JSON.parse(raw) as any[]) : [];
          const updated = chores.map((c) =>
            c.id === itemId ? { ...c, completed: true, doneAt: Date.now(), postponedTo: undefined } : c
          );
          await AsyncStorage.setItem('week_routine', JSON.stringify(updated));
          const label = (data?.label as string) || 'Chore';
          const fired = new Date(response.notification.date * 1000);
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
          // Clear any pending postpone one-off for this chore.
          const scheduled = await Notifications.getAllScheduledNotificationsAsync();
          for (const n of scheduled) {
            if (n.content.data?.source === 'myweekpostpone' && n.content.data?.itemId === itemId) {
              await Notifications.cancelScheduledNotificationAsync(n.identifier);
            }
          }
        })();
        return;
      }

      const isPets = source === 'pets' || source === 'petssnooze';
      const storageKey = isPets ? 'pets_feeds' : 'my_routine';
      const historyKey = isPets ? 'pets_history' : 'my_history';
      (async () => {
        if (itemId) {
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
    } else if (source === 'myweek' || source === 'myweekpostpone') {
      router.push('/myweek');
    } else if (source === 'pets' || source === 'petssnooze') {
      router.push('/mollie');
    }
  }, [response]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="shopping" options={{ headerShown: false }} />
      <Stack.Screen name="timer" options={{ headerShown: false }} />
      <Stack.Screen name="myday" options={{ headerShown: false }} />
      <Stack.Screen name="myweek" options={{ headerShown: false }} />
      <Stack.Screen name="mollie" options={{ headerShown: false }} />
      <Stack.Screen name="todo" options={{ headerShown: false }} />
      <Stack.Screen name="planner" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="vault" options={{ headerShown: false }} />
      <Stack.Screen name="backup" options={{ headerShown: false }} />
    </Stack>
  );
}