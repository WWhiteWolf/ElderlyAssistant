import { useState, type ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../constants/Themes';
import { useLandscapeHeaderSide, type LandscapeHeaderSide } from './AppOrientation';
import Bridge from './Bridge';

export function useLandscape(): boolean {
    const { width, height } = useWindowDimensions();
    return width > height;
}

export function uprightInLandscape(
    landscape: boolean,
    headerSide: LandscapeHeaderSide | null = 'left',
) {
    if (!landscape) return null;
    return {
        transform: [{ rotate: headerSide === 'right' ? ('-90deg' as const) : ('90deg' as const) }],
    };
}

/** Round header control. In landscape it turns in place so the words sit the right way up. */
export function HeaderButton({
    onPress,
    children,
    invisible = false,
}: {
    onPress?: () => void;
    children?: ReactNode;
    invisible?: boolean;
}) {
    const landscape = useLandscape();
    const headerSide = useLandscapeHeaderSide();
    const theme = useTheme();
    const style = [
        styles.headerBtn,
        { borderColor: theme.headerButton },
        uprightInLandscape(landscape, headerSide),
        invisible ? { opacity: 0 } : null,
    ];
    if (!onPress) {
        return <View style={style}>{children}</View>;
    }
    return (
        <TouchableOpacity onPress={onPress} style={style} activeOpacity={0.7}>
            {children}
        </TouchableOpacity>
    );
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
    const headerSide = useLandscapeHeaderSide();
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
    if (headerSide === 'right') {
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

    return (
        <View style={styles.frameLandscape}>
            <SafeAreaView style={{ backgroundColor: headerColor }} edges={['left']}>
                <View style={{ width: band, flex: 1, overflow: 'hidden' }}>
                    <View
                        style={{
                            width: shortSide,
                            transform: [
                                { translateX: (band - shortSide) / 2 },
                                { translateY: (shortSide - band) / 2 },
                                { rotate: '-90deg' },
                            ],
                        }}
                    >
                        {chrome}
                    </View>
                </View>
            </SafeAreaView>
            <View style={styles.body}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    frame: { flex: 1 },
    frameLandscape: { flex: 1, flexDirection: 'row' },
    body: { flex: 1 },
    headerBtn: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
