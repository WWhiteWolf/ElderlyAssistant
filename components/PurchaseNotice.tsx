import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../constants/Themes';
import {
    buyFullApp,
    closePurchaseNotice,
    isPurchaseNoticeOpen,
    refreshApplePurchase,
    watchPurchase,
} from '../modules/apple-purchase';
import { Cover } from './Cover';

const NOTICE = 'Your free one month trial is over. This is when you pay. Pay $9.99 once, here in Memory, to keep adding and changing. Your lists stay on this phone. Reminders you already set keep going. You can back up what you already have. If you install Memory again, or put it on another iPhone, you can restore those lists after the purchase is on that phone.';

/** The notice the buyer sees when adding or changing has to wait. */
export function PurchaseNotice() {
    const theme = useTheme();
    const router = useRouter();
    const [, redraw] = useState(0);
    const [paying, setPaying] = useState(false);

    useEffect(() => watchPurchase(() => redraw((n) => n + 1)), []);

    useEffect(() => {
        void refreshApplePurchase();
        const sub = AppState.addEventListener('change', (state) => {
            if (state === 'active') void refreshApplePurchase();
        });
        return () => sub.remove();
    }, []);

    const pay = async () => {
        if (paying) return;
        setPaying(true);
        const result = await buyFullApp();
        setPaying(false);
        if (result === 'failed') {
            Alert.alert('Payment', 'The payment did not go through. Nothing was changed.');
        }
    };

    if (!isPurchaseNoticeOpen()) return null;

    return (
        <Cover visible>
            <View style={styles.overlay}>
                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
                    <Text style={[styles.body, { color: theme.bodyText }]}>{NOTICE}</Text>
                    <TouchableOpacity
                        style={[styles.pay, { backgroundColor: theme.buttonPrimary }]}
                        onPress={() => { void pay(); }}
                        disabled={paying}
                    >
                        <Text style={[styles.payText, { color: theme.buttonPrimaryText }]}>
                            {paying ? 'Please wait' : 'Pay $9.99'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.other, { backgroundColor: theme.buttonNeutral, borderColor: theme.buttonNeutralBorder }]}
                        onPress={() => {
                            closePurchaseNotice();
                            router.push('/backup');
                        }}
                    >
                        <Text style={[styles.otherText, { color: theme.buttonNeutralText }]}>Back up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.other, { backgroundColor: theme.buttonNeutral, borderColor: theme.buttonNeutralBorder }]}
                        onPress={closePurchaseNotice}
                    >
                        <Text style={[styles.otherText, { color: theme.buttonNeutralText }]}>Not now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Cover>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 12,
        borderWidth: 0.5,
        padding: 16,
        width: '100%',
    },
    body: {
        fontSize: 16,
        lineHeight: 22,
    },
    pay: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    payText: {
        fontSize: 16,
        fontWeight: '600',
    },
    other: {
        marginTop: 8,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    otherText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
