// The iPhone free month and the one-time purchase, as plain facts.
// Apple supplies the day and the payment. This file only decides what
// those facts mean. It does not talk to Apple.

export const FULL_PRODUCT_ID = 'com.molliedog.ElderlyAssistant.full';

export type AppleStanding = {
    originalPurchaseMs: number | null;
    purchased: boolean;
};

/** The same clock time, one calendar month later. A short month ends on its last day. */
export function trialEndsAt(originalPurchaseMs: number): Date {
    const end = new Date(originalPurchaseMs);
    const day = end.getDate();
    end.setMonth(end.getMonth() + 1);
    if (end.getDate() < day) end.setDate(0);
    return end;
}

/**
 * Adding and changing wait only on the iPhone, only after Apple has
 * given a download day, the trial is over, and the account has not paid.
 * No answer from Apple is not a reason to lock the app.
 */
export function addingAndChangingWaitsNow(
    onIphone: boolean,
    standing: AppleStanding | null,
    now: Date,
): boolean {
    if (!onIphone || !standing || standing.purchased) return false;
    if (standing.originalPurchaseMs == null) return false;
    return now.getTime() >= trialEndsAt(standing.originalPurchaseMs).getTime();
}
