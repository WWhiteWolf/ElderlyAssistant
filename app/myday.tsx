import { Redirect } from 'expo-router';

// The My Day page came out at #33-new. Daily holds the list and the log.
// This file stays only so an old /myday link still lands somewhere.
export default function MyDayRedirect() {
    return <Redirect href="/daily" />;
}
