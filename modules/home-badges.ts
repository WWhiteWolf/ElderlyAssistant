// Home badges: which pages sit on Home, and the remembered order.
// Options is not on this grid. The gear is not a badge.

import { PAGE_LABELS } from '../constants/page-names';

export const HOME_BADGE_ORDER_KEY = 'home_badge_order';

export type HomeBadge = {
    id: string;
    label: string;
    icon: string;
};

export const HOME_BADGES: HomeBadge[] = [
    { id: 'appointments', label: PAGE_LABELS.appointments, icon: '✅' },
    { id: 'birthdays', label: PAGE_LABELS.birthdays, icon: '🎂' },
    { id: 'bucketlist', label: PAGE_LABELS.bucketlist, icon: '🌈' },
    { id: 'yearly', label: PAGE_LABELS.yearly, icon: '🔭' },
    { id: 'quarterly', label: PAGE_LABELS.quarterly, icon: '🍂' },
    { id: 'monthly', label: PAGE_LABELS.monthly, icon: '🌓' },
    { id: 'weekly', label: PAGE_LABELS.weekly, icon: '🗓️' },
    { id: 'calendar', label: PAGE_LABELS.calendar, icon: '📅' },
    { id: 'daily', label: PAGE_LABELS.daily, icon: '☀️' },
    { id: 'where', label: PAGE_LABELS.where, icon: '🤔' },
];

export function parseSavedHomeOrder(raw: string | null): string[] | null {
    if (raw == null || raw === '') return null;
    try {
        const value = JSON.parse(raw) as unknown;
        if (!Array.isArray(value) || value.some((one) => typeof one !== 'string')) {
            return null;
        }
        return value as string[];
    } catch {
        return null;
    }
}

export function applySavedHomeOrder(saved: string[] | null): HomeBadge[] {
    const byId = new Map(HOME_BADGES.map((one) => [one.id, one]));
    const seen = new Set<string>();
    const out: HomeBadge[] = [];
    if (saved) {
        for (const id of saved) {
            const one = byId.get(id);
            if (!one || seen.has(id)) continue;
            out.push(one);
            seen.add(id);
        }
    }
    for (const one of HOME_BADGES) {
        if (!seen.has(one.id)) out.push(one);
    }
    return out;
}

export function moveHomeBadge(list: HomeBadge[], id: string, toIndex: number): HomeBadge[] {
    const from = list.findIndex((one) => one.id === id);
    if (from < 0) return list;
    const next = list.slice();
    const [item] = next.splice(from, 1);
    const to = Math.max(0, Math.min(next.length, toIndex));
    next.splice(to, 0, item);
    return next;
}
