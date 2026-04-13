import { Stack } from 'expo-router';

export default function RootLayout() {
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