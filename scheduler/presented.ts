// Which banners already delivered by the phone should be taken down.
//
// A banner from before today is stale. A banner for an item that is now Done
// has also finished its work, even when another copy of that banner was already
// delivered before Done reached the saved list.
//
// This file only selects identifiers. The scheduler remains the one place that
// touches the phone.

/** The part of a delivered banner needed to decide whether it stays. */
export interface PresentedReminder {
    identifier: string;
    deliveredAt: number;
    itemId?: string;
}

/** Item identities whose saved state says Done right now. */
export function doneItemIdsOf(
    items: { id: string; completed?: boolean }[],
): string[] {
    return items.filter((item) => item.completed === true).map((item) => item.id);
}

/** Delivered banners that are stale or belong to an item now marked Done. */
export function presentedIdentifiersToDismiss(
    presented: PresentedReminder[],
    startOfToday: number,
    doneItemIds: string[],
): string[] {
    const done = new Set(doneItemIds);
    const identifiers = new Set<string>();
    for (const banner of presented) {
        const belongsToDoneItem =
            banner.itemId !== undefined && done.has(banner.itemId);
        if (banner.deliveredAt < startOfToday || belongsToDoneItem) {
            identifiers.add(banner.identifier);
        }
    }
    return [...identifiers];
}
