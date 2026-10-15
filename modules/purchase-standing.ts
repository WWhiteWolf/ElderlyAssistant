// The iPhone free month and the one-time purchase, as plain facts.
// Apple supplies the day and the payment. This file only decides what
// those facts mean. It does not talk to Apple.

export const FULL_PRODUCT_ID = 'com.molliedog.ElderlyAssistant.full';

/**
 * On for the picture build. A missing day uses 1 August 2013 so the
 * notice can be saved. Off for the real build. Buyers are not locked
 * when Apple gives no day.
 */
export const PICTURE_BUILD = true;

/** 1 August 2013. Apple's practice store always reports this download day. */
export const PRACTICE_DOWNLOAD_MS = new Date(2013, 7, 1, 0, 0, 0).getTime();

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
 * Adding and changing wait only on the iPhone, only after the trial
 * is over, and only when the account has not paid.
 * With PICTURE_BUILD off, no answer from Apple is not a reason to lock the app.
 * With it on, a missing day uses 1 August 2013 so the notice can be saved.
 */
export function addingAndChangingWaitsNow(
    onIphone: boolean,
    standing: AppleStanding | null,
    now: Date,
): boolean {
    if (!onIphone) return false;
    if (standing?.purchased) return false;
    let downloadMs = standing?.originalPurchaseMs ?? null;
    if (downloadMs == null && PICTURE_BUILD) downloadMs = PRACTICE_DOWNLOAD_MS;
    if (downloadMs == null) return false;
    return now.getTime() >= trialEndsAt(downloadMs).getTime();
}
