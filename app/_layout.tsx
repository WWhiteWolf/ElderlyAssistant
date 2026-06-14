import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export default function RootLayout() {
  const router = useRouter();
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!response) return;
    // Only act on a plain tap of the notification body, not action buttons.
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const notifId = response.notification.request.identifier;
    if (handledId.current === notifId) return; // don't re-navigate on re-render
    handledId.current = notifId;

    const source = response.notification.request.content.data?.source as string | undefined;
    if (source === 'todo') {
      router.push('/todo');
    } else if (source === 'myday') {
      router.push('/myday');
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