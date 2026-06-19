import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function RootLayout() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  // Register the My Day snooze category once, so its notifications can show
  // Snooze buttons (15 / 30 / 60 min). Category id has no ':' or '-' per Expo docs.
  useEffect(() => {
    Notifications.setNotificationCategoryAsync('mydaysnooze', [
      { identifier: 'done', buttonTitle: 'Done' },
      { identifier: 'snooze15', buttonTitle: 'Snooze 15 min' },
      { identifier: 'snooze30', buttonTitle: 'Snooze 30 min' },
      { identifier: 'snooze60', buttonTitle: 'Snooze 60 min' },
    ]);
    Notifications.setNotificationCategoryAsync('petssnooze', [
      { identifier: 'done', buttonTitle: 'Done' },
      { identifier: 'snooze15', buttonTitle: 'Snooze 15 min' },
      { identifier: 'snooze30', buttonTitle: 'Snooze 30 min' },
      { identifier: 'snooze60', buttonTitle: 'Snooze 60 min' },
    ]);
    Notifications.setNotificationCategoryAsync('todosnooze', [
      { identifier: 'done', buttonTitle: 'Done' },
      { identifier: 'snooze15', buttonTitle: 'Snooze 15 min' },
      { identifier: 'snooze30', buttonTitle: 'Snooze 30 min' },
      { identifier: 'snooze60', buttonTitle: 'Snooze 60 min' },
      // OK = acknowledge & dismiss just this alert. Doesn't open the app, mark
      // the task done, or touch the task's other scheduled reminders.
      { identifier: 'ok', buttonTitle: 'OK', options: { opensAppToForeground: false } },
    ]);
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

    // "Done" action button: mark this item complete in storage and cancel the
    // fired reminder, the banner equivalent of the on-screen Log (✓) button.
    // The screen's daily reset + reschedule-on-load brings it back tomorrow.
    if (action === 'done') {
      const source = data?.source as string | undefined;
      const itemId = data?.itemId as string | undefined;

      // To-Do "Done": log the completion. A repeating task (weekly/monthly/
      // yearly) fires again on its own, so leave its schedule and the task in
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
            const entry = {
              id: Date.now().toString(),
              taskTitle: task.title,
              completedDate: new Date().toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' }),
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

      const isPets = source === 'pets' || source === 'petssnooze';
      const storageKey = isPets ? 'pets_feeds' : 'my_routine';
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
    } else if (source === 'pets' || source === 'petssnooze') {
      router.push('/mollie');
    }
  }, [response]);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="setup-pin" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="shopping" options={{ headerShown: false }} />
      <Stack.Screen name="timer" options={{ headerShown: false }} />
      <Stack.Screen name="myday" options={{ headerShown: false }} />
      <Stack.Screen name="mollie" options={{ headerShown: false }} />
      <Stack.Screen name="todo" options={{ headerShown: false }} />
      <Stack.Screen name="planner" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="vault" options={{ headerShown: false }} />
      <Stack.Screen name="vaultpin" options={{ headerShown: false }} />
    </Stack>
  );
}