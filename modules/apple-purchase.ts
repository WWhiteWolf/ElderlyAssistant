import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
    FULL_PRODUCT_ID,
    addingAndChangingWaitsNow,
    type AppleStanding,
} from './purchase-standing';

const STANDING_KEY = 'apple_full_purchase';

let standing: AppleStanding | null = null;
let standingLoaded = false;
let noticeOpen = false;
const watchers = new Set<() => void>();

function notify() {
    watchers.forEach((one) => one());
}

export function watchPurchase(fn: () => void): () => void {
    watchers.add(fn);
    return () => {
        watchers.delete(fn);
    };
}

export function isPurchaseNoticeOpen(): boolean {
    return noticeOpen;
}

export function closePurchaseNotice(): void {
    if (!noticeOpen) return;
    noticeOpen = false;
    notify();
}

function openPurchaseNotice(): void {
    if (noticeOpen) return;
    noticeOpen = true;
    notify();
}

async function readStanding(): Promise<AppleStanding | null> {
    try {
        const raw = await AsyncStorage.getItem(STANDING_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<AppleStanding>;
        if (typeof parsed.purchased !== 'boolean') return null;
        const originalPurchaseMs =
            typeof parsed.originalPurchaseMs === 'number' ? parsed.originalPurchaseMs : null;
        return { originalPurchaseMs, purchased: parsed.purchased };
    } catch {
        return null;
    }
}

async function writeStanding(next: AppleStanding): Promise<void> {
    standing = next;
    standingLoaded = true;
    if (next.purchased) noticeOpen = false;
    await AsyncStorage.setItem(STANDING_KEY, JSON.stringify(next));
    notify();
}

type IosStore = typeof import('expo-iap');

async function iosStore(): Promise<IosStore | null> {
    if (Platform.OS !== 'ios') return null;
    try {
        return await import('expo-iap');
    } catch {
        return null;
    }
}

/** Ask Apple again. A failed ask leaves the last answer in place. */
export async function refreshApplePurchase(): Promise<AppleStanding | null> {
    if (Platform.OS !== 'ios') return null;
    if (!standingLoaded) {
        standing = await readStanding();
        standingLoaded = true;
    }
    const store = await iosStore();
    if (!store) return standing;
    try {
        await store.initConnection();
    } catch {
        return standing;
    }

    let heardDate = false;
    let originalPurchaseMs: number | null = null;
    try {
        const transaction = await store.getAppTransactionIOS();
        if (transaction && typeof transaction.originalPurchaseDate === 'number') {
            heardDate = true;
            originalPurchaseMs = transaction.originalPurchaseDate;
        }
    } catch {
        heardDate = false;
    }

    let heardPurchase = false;
    let purchased = false;
    try {
        const owned = await store.currentEntitlementIOS(FULL_PRODUCT_ID);
        heardPurchase = true;
        purchased = owned != null && owned.purchaseState !== 'pending';
    } catch {
        heardPurchase = false;
    }

    if (!heardDate && !heardPurchase) return standing;
    const next: AppleStanding = {
        originalPurchaseMs: heardDate
            ? originalPurchaseMs
            : (standing?.originalPurchaseMs ?? null),
        purchased: heardPurchase ? purchased : (standing?.purchased ?? false),
    };
    await writeStanding(next);
    return next;
}

async function standingNow(): Promise<AppleStanding | null> {
    if (Platform.OS !== 'ios') return null;
    if (!standingLoaded) {
        standing = await readStanding();
        standingLoaded = true;
    }
    if (!standing) standing = await refreshApplePurchase();
    return standing;
}

/** True when this add or change must stop. Opens the notice. */
export async function addingAndChangingWaits(): Promise<boolean> {
    const current = await standingNow();
    const waits = addingAndChangingWaitsNow(Platform.OS === 'ios', current, new Date());
    if (!waits) return false;
    openPurchaseNotice();
    void refreshApplePurchase();
    return true;
}

export type BuyResult = 'purchased' | 'cancelled' | 'failed';

/** The $9.99 button. Talks to Apple and nowhere else. */
export async function buyFullApp(): Promise<BuyResult> {
    if (Platform.OS !== 'ios') return 'failed';
    const store = await iosStore();
    if (!store) return 'failed';
    try {
        await store.initConnection();
    } catch {
        return 'failed';
    }

    return new Promise((resolve) => {
        let settled = false;
        let updated: { remove: () => void } | null = null;
        let errors: { remove: () => void } | null = null;
        const finish = (result: BuyResult) => {
            if (settled) return;
            settled = true;
            updated?.remove();
            errors?.remove();
            resolve(result);
        };
        const accept = async (productId: string | undefined) => {
            if (productId && productId !== FULL_PRODUCT_ID) return;
            const next = await refreshApplePurchase();
            finish(next?.purchased ? 'purchased' : 'failed');
        };
        updated = store.purchaseUpdatedListener(async (purchase) => {
            if (purchase.productId !== FULL_PRODUCT_ID) return;
            try {
                await store.finishTransaction({ purchase, isConsumable: false });
            } catch {
                // The payment can still be read from Apple on the next ask.
            }
            await accept(purchase.productId);
        });
        errors = store.purchaseErrorListener((error) => {
            finish(store.isUserCancelledError(error) ? 'cancelled' : 'failed');
        });
        void store.requestPurchase({
            request: { apple: { sku: FULL_PRODUCT_ID } },
            type: 'in-app',
        }).then((returned) => {
            const purchase = Array.isArray(returned) ? returned[0] : returned;
            if (purchase && purchase.productId === FULL_PRODUCT_ID) {
                void accept(purchase.productId);
            }
        }).catch((error: unknown) => {
            finish(store.isUserCancelledError(error) ? 'cancelled' : 'failed');
        });
    });
}
