// The daily reset, as plain arithmetic.
//
// Clearing yesterday's checkmarks is part of the same clean slate as sweeping
// yesterday's banners. Until now it happened only when My Day or Pets was
// opened, which is the same screen-bound fault the reminders had: if neither
// screen was visited, the day never rolled over. The deciding is done here,
// where Node can check it; the reading and writing is done by the module.
//
// Nothing in this file touches storage, the phone, React Native or Expo.

/** What the reset needs of an item. Both screens' items have this much. */
export interface ResettableItem {
    id: string;
    completed: boolean;
    // A snooze belongs to the day it was made, so a new day clears it.
    snoozedUntil?: number;
}

/**
 * Is the saved day different from today?
 *
 * The saved day is whatever the screens have always written — the phone's own
 * short date for the day the list was last reset. A key that has never been
 * written counts as a new day, which is right: the reset is harmless when
 * there is nothing to clear.
 */
export function isNewDay(savedDate: string | null, today: string): boolean {
    return savedDate !== today;
}

/**
 * Yesterday's list, made ready for today.
 *
 * Every checkmark comes off and every snooze goes with it. A snooze was made
 * about yesterday, and the item's own daily reminder already carries today.
 * Nothing else about an item is touched — its name, its time and its order all
 * belong to the item rather than to the day.
 */
export function resetForNewDay<T extends ResettableItem>(items: T[]): T[] {
    return items.map((item) => {
        const { snoozedUntil, ...rest } = item;
        return { ...rest, completed: false } as T;
    });
}
