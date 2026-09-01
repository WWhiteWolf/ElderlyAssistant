import { useState, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Bridge from './Bridge';

export function useLandscape(): boolean {
    const { width, height } = useWindowDimensions();
    return width > height;
}

export function PageFrame({
    header,
    headerColor,
    children,
    bridge = true,
}: {
    header: ReactNode;
    headerColor: string;
    children: ReactNode;
    bridge?: boolean;
}) {
    const landscape = useLandscape();
    const { height } = useWindowDimensions();
    const [thickness, setThickness] = useState(0);

    const chrome = (
        <View
            onLayout={(e) => {
                const h = e.nativeEvent.layout.height;
                setThickness((prev) => (prev === h ? prev : h));
            }}
        >
            {header}
            {bridge ? <Bridge /> : null}
        </View>
    );

    if (!landscape) {
        return (
            <View style={styles.frame}>
                <SafeAreaView style={{ backgroundColor: headerColor }} edges={['top']}>
                    {header}
                </SafeAreaView>
                {bridge ? <Bridge /> : null}
                {children}
            </View>
        );
    }

    const band = thickness > 0 ? thickness : 88;
    const shortSide = height;
    return (
        <View style={styles.frameLandscape}>
            <View style={styles.body}>{children}</View>
            <SafeAreaView style={{ backgroundColor: headerColor }} edges={['right']}>
                <View style={{ width: band, flex: 1, overflow: 'hidden' }}>
                    <View
                        style={{
                            width: shortSide,
                            transform: [
                                { translateX: (band - shortSide) / 2 },
                                { translateY: (shortSide - band) / 2 },
                                { rotate: '90deg' },
                            ],
                        }}
                    >
                        {chrome}
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { flex: 1 },
    frameLandscape: { flex: 1, flexDirection: 'row' },
    body: { flex: 1 },
});
