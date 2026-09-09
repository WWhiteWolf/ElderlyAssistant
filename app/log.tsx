import { useLocalSearchParams } from 'expo-router';
import ReminderLogPage from '../components/ReminderLogPage';
import type { ReminderKind } from '../modules/reminder-items';

const KINDS: ReminderKind[] = [
    'daily', 'oneTime', 'weekly', 'monthly', 'quarterly', 'yearly',
    'appointments', 'birthdays', 'bucketlist',
];

function asParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
}

export default function LogScreen() {
    const { kind, returnTo } = useLocalSearchParams<{
        kind?: string | string[];
        returnTo?: string | string[];
    }>();
    const page = asParam(kind);
    const named = page && KINDS.includes(page as ReminderKind) ? (page as ReminderKind) : 'daily';
    const back = asParam(returnTo) || (named === 'oneTime' ? 'daily' : named);
    return <ReminderLogPage kind={named} returnTo={back} />;
}
