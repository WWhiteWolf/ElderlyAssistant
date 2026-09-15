import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { HeaderButton, PageFrame } from '../components/PageFrame';
import { PAGE_LABELS } from '../constants/page-names';
import { Theme, useTheme } from '../constants/Themes';
import { USER_GUIDE_BLOCKS } from '../constants/user-guide';

/** Draw **this** as heavier type. The working Guide and the in-app copy use the same marks. */
function GuideMarkedText({ text, style }: { text: string; style: TextStyle }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
        <Text style={style}>
            {parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                    return (
                        <Text key={index} style={{ fontWeight: '700' }}>
                            {part.slice(2, -2)}
                        </Text>
                    );
                }
                return <Text key={index}>{part}</Text>;
            })}
        </Text>
    );
}

export default function UserGuideScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    return (
        <View style={styles.container}>
            <PageFrame
                headerColor={theme.header}
                header={
                    <View style={styles.header}>
                        <HeaderButton onPress={() => router.back()}>
                            <Text style={styles.headerBtnText}>Back</Text>
                        </HeaderButton>
                        <Text style={styles.title}>{PAGE_LABELS.userGuide}</Text>
                        <View style={styles.headerSpacer} />
                    </View>
                }
            >
                <ScrollView contentContainerStyle={styles.body}>
                    {USER_GUIDE_BLOCKS.map((block, index) => {
                        if (block.type === 'heading') {
                            return (
                                <Text key={index} style={styles.heading}>{block.text}</Text>
                            );
                        }
                        if (block.type === 'paragraph') {
                            return (
                                <GuideMarkedText key={index} text={block.text} style={styles.paragraph} />
                            );
                        }
                        if (block.type === 'lines') {
                            return (
                                <View key={index} style={styles.lines}>
                                    {block.items.map((one) => (
                                        <GuideMarkedText key={one} text={one} style={styles.line} />
                                    ))}
                                </View>
                            );
                        }
                        return (
                            <View key={index} style={styles.bullets}>
                                {block.items.map((one, itemIndex) => (
                                    <View
                                        key={`${one.text}-${itemIndex}`}
                                        style={[
                                            styles.bulletRow,
                                            { paddingLeft: 8 + (one.level ?? 0) * 20 },
                                        ]}
                                    >
                                        <Text style={styles.bulletMark}>•</Text>
                                        <GuideMarkedText text={one.text} style={styles.bulletText} />
                                    </View>
                                ))}
                            </View>
                        );
                    })}
                </ScrollView>
            </PageFrame>
        </View>
    );
}

const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            paddingTop: 20,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            paddingBottom: 8,
        },
        headerSpacer: { width: 54 },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        body: { padding: 20, paddingBottom: 40 },
        heading: {
            fontSize: 20,
            fontWeight: '600',
            color: t.cardTitle,
            marginTop: 8,
            marginBottom: 10,
        },
        paragraph: {
            fontSize: 17,
            color: t.bodyText,
            lineHeight: 24,
            marginBottom: 16,
        },
        lines: { marginBottom: 16, paddingLeft: 12 },
        line: {
            fontSize: 17,
            color: t.bodyText,
            lineHeight: 24,
            marginBottom: 4,
        },
        bullets: { marginBottom: 16 },
        bulletRow: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: 6,
        },
        bulletMark: {
            fontSize: 17,
            color: t.bodyText,
            lineHeight: 24,
            marginRight: 8,
        },
        bulletText: {
            flex: 1,
            fontSize: 17,
            color: t.bodyText,
            lineHeight: 24,
        },
    });
