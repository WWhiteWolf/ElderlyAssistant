import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HeaderButton, PageFrame } from '../components/PageFrame';
import { PAGE_LABELS } from '../constants/page-names';
import { Theme, useTheme } from '../constants/Themes';
import { USER_GUIDE_PARAGRAPHS } from '../constants/user-guide';

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
                    {USER_GUIDE_PARAGRAPHS.map((one) => (
                        <Text key={one} style={styles.paragraph}>{one}</Text>
                    ))}
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
        body: { padding: 20 },
        paragraph: {
            fontSize: 17,
            color: t.bodyText,
            lineHeight: 24,
            marginBottom: 16,
        },
    });
