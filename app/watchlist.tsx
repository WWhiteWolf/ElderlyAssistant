import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme, useTheme } from '../constants/Themes';

// Ported from the standalone WatchList app (Projects/WatchList) in Rebuild Step 5.
// Behavior unchanged; styling matched to the rest of the app. No notifications.

interface Provider {
    id: string;
    name: string;
}

interface Movie {
    id: string;
    title: string;
    providerId: string;
    status: 'toWatch' | 'watched';
}

interface TvShow {
    id: string;
    title: string;
    providerId: string;
    currentSeason: number;
    currentEpisode: number;
    status: 'watching';
}

const PROVIDERS: Provider[] = [
    { id: '1', name: 'YouTube TV' },
    { id: '2', name: 'Netflix' },
    { id: '3', name: 'Paramount' },
    { id: '4', name: 'HBO' },
];

// Same storage keys as the standalone app — independent of all other app data.
const MOVIES_KEY = 'watchlist_movies';
const SHOWS_KEY = 'watchlist_shows';

type ListItem =
    | (Movie & { type: 'Movie' })
    | (TvShow & { type: 'TV Show' });

export default function WatchListScreen() {
    const router = useRouter();
    const theme = useTheme();
    const styles = makeStyles(theme);

    const [movies, setMovies] = useState<Movie[]>([]);
    const [tvShows, setTvShows] = useState<TvShow[]>([]);
    const [title, setTitle] = useState('');
    const [selectedProviderId, setSelectedProviderId] = useState('1');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const savedMovies = await AsyncStorage.getItem(MOVIES_KEY);
            const savedShows = await AsyncStorage.getItem(SHOWS_KEY);
            if (savedMovies) setMovies(JSON.parse(savedMovies));
            if (savedShows) setTvShows(JSON.parse(savedShows));
        } catch (e) {
            console.error(e);
        }
    };

    const saveMovies = async (m: Movie[]) => {
        setMovies(m);
        await AsyncStorage.setItem(MOVIES_KEY, JSON.stringify(m));
    };

    const saveTvShows = async (t: TvShow[]) => {
        setTvShows(t);
        await AsyncStorage.setItem(SHOWS_KEY, JSON.stringify(t));
    };

    const addMovie = () => {
        if (title.trim() === '') return;
        const newMovie: Movie = {
            id: Date.now().toString(),
            title: title.trim(),
            providerId: selectedProviderId,
            status: 'toWatch',
        };
        saveMovies([...movies, newMovie]);
        setTitle('');
    };

    const addTvShow = () => {
        if (title.trim() === '') return;
        const newShow: TvShow = {
            id: Date.now().toString(),
            title: title.trim(),
            providerId: selectedProviderId,
            currentSeason: 1,
            currentEpisode: 1,
            status: 'watching',
        };
        saveTvShows([...tvShows, newShow]);
        setTitle('');
    };

    const incrementEpisode = (showId: string) => {
        saveTvShows(
            tvShows.map((show) =>
                show.id === showId
                    ? { ...show, currentEpisode: show.currentEpisode + 1 }
                    : show
            )
        );
    };

    const incrementSeason = (showId: string) => {
        saveTvShows(
            tvShows.map((show) =>
                show.id === showId
                    ? { ...show, currentSeason: show.currentSeason + 1, currentEpisode: 1 }
                    : show
            )
        );
    };

    const toggleMovieStatus = (movieId: string) => {
        saveMovies(
            movies.map((movie) =>
                movie.id === movieId
                    ? { ...movie, status: movie.status === 'toWatch' ? 'watched' : 'toWatch' }
                    : movie
            )
        );
    };

    const getProviderName = (id: string) => {
        const provider = PROVIDERS.find(p => p.id === id);
        return provider ? provider.name : 'Unknown';
    };

    const listData: ListItem[] = [
        ...movies.map(m => ({ ...m, type: 'Movie' as const })),
        ...tvShows.map(t => ({ ...t, type: 'TV Show' as const })),
    ];

    return (
        <View style={styles.container}>
            {/* #62: no edges prop (default all edges), matching the seven taller-header
                pages — Patrick standardized on the taller header look. */}
            <SafeAreaView style={{ backgroundColor: theme.header }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => { router.dismissAll(); router.replace('/home'); }} style={styles.headerBtn}>
                        <Text style={styles.headerBtnText}>← Home</Text>
                    </TouchableOpacity>
                    <Text style={styles.title}>Watch List</Text>
                    <View style={{ width: 70 }} />
                </View>
            </SafeAreaView>

            <View style={styles.bridge} />

            {/* Add form */}
            <View style={styles.formContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter Movie or TV Show Title"
                    placeholderTextColor={theme.mutedText}
                    value={title}
                    onChangeText={setTitle}
                />

                <Text style={styles.subLabel}>Select Provider:</Text>
                <View style={styles.providerSelectorRow}>
                    {PROVIDERS.map((provider) => (
                        <TouchableOpacity
                            key={provider.id}
                            style={[
                                styles.providerButton,
                                selectedProviderId === provider.id && styles.providerButtonSelected,
                            ]}
                            onPress={() => setSelectedProviderId(provider.id)}
                        >
                            <Text style={selectedProviderId === provider.id ? styles.textSelected : styles.textUnselected}>
                                {provider.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.addBtn} onPress={addMovie}>
                        <Text style={styles.addBtnText}>Add Movie</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={addTvShow}>
                        <Text style={styles.addBtnText}>Add TV Show</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Combined list */}
            <FlatList
                style={styles.list}
                data={listData}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Nothing tracked yet. Add a movie or show above.</Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.itemRow}>
                        <View style={styles.infoColumn}>
                            <View style={styles.titleRow}>
                                <Text style={styles.itemText}>{item.title}</Text>
                                {item.type === 'Movie' && (
                                    <Text style={styles.statusBadge}>
                                        {item.status === 'toWatch' ? 'To Watch' : 'Watched'}
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.itemSubtext}>
                                {item.type} • {getProviderName(item.providerId)}
                            </Text>
                        </View>

                        <View style={styles.controlRow}>
                            {item.type === 'Movie' ? (
                                <TouchableOpacity
                                    style={styles.movieBtn}
                                    onPress={() => toggleMovieStatus(item.id)}
                                >
                                    <Text style={styles.movieBtnText}>
                                        {item.status === 'toWatch' ? 'Mark Seen' : 'Watch Again'}
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.tvControls}>
                                    <Text style={styles.progressText}>
                                        S{item.currentSeason} E{item.currentEpisode}
                                    </Text>
                                    <View style={styles.actionButtons}>
                                        <TouchableOpacity style={styles.smallButton} onPress={() => incrementEpisode(item.id)}>
                                            <Text style={styles.smallButtonText}>+Ep</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.smallButton} onPress={() => incrementSeason(item.id)}>
                                            <Text style={styles.smallButtonText}>+Seas</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

// Styles are built from the active theme when the page draws — the
// makeStyles(theme) pattern from home.tsx (#45).
const makeStyles = (t: Theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: t.pageBackground },
        header: {
            backgroundColor: t.header,
            paddingTop: 20,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
        },
        headerBtn: {
            borderWidth: 1,
            borderColor: t.headerButton,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 20,
        },
        headerBtnText: { color: t.headerButton, fontSize: 13, fontWeight: '600' },
        title: {
            fontSize: 24,
            fontWeight: '500',
            color: t.titleText,
            fontStyle: 'italic',
            fontFamily: 'Georgia',
            flex: 1,
            textAlign: 'center',
        },
        bridge: { height: 8, backgroundColor: t.bridge },
        formContainer: {
            padding: 12,
            backgroundColor: t.card,
            borderBottomWidth: 0.5,
            borderBottomColor: t.cardBorder,
        },
        input: {
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            borderRadius: 8,
            padding: 10,
            fontSize: 16,
            color: t.bodyText,
            backgroundColor: t.pageBackground,
            marginBottom: 8,
        },
        subLabel: {
            fontSize: 14,
            fontWeight: '600',
            color: t.bodyText,
            marginBottom: 5,
        },
        providerSelectorRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginBottom: 4,
        },
        providerButton: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 15,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            marginRight: 8,
            marginBottom: 8,
            backgroundColor: t.pageBackground,
        },
        providerButtonSelected: {
            backgroundColor: t.buttonPrimary,
            borderColor: t.buttonPrimary,
        },
        textUnselected: { color: t.bodyText },
        textSelected: { color: t.buttonPrimaryText, fontWeight: 'bold' },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            gap: 8,
        },
        addBtn: {
            flex: 1,
            backgroundColor: t.buttonPrimary,
            paddingVertical: 10,
            borderRadius: 8,
            alignItems: 'center',
        },
        addBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 16 },
        list: { flex: 1, padding: 12 },
        emptyText: { textAlign: 'center', color: t.mutedText, marginTop: 40, fontSize: 16 },
        itemRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: t.card,
            borderRadius: 10,
            padding: 12,
            marginBottom: 8,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
        },
        infoColumn: { flex: 1 },
        titleRow: { flexDirection: 'row', alignItems: 'center' },
        itemText: {
            fontSize: 18,
            fontWeight: '500',
            color: t.bodyText,
            flexShrink: 1,
        },
        itemSubtext: { fontSize: 14, color: t.mutedText, marginTop: 2 },
        statusBadge: { fontSize: 12, color: t.mutedText, marginLeft: 8 },
        controlRow: { marginLeft: 10, alignItems: 'flex-end' },
        movieBtn: {
            backgroundColor: t.buttonPrimary,
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
        },
        movieBtnText: { color: t.buttonPrimaryText, fontWeight: '600', fontSize: 14 },
        tvControls: { alignItems: 'center' },
        progressText: {
            fontSize: 14,
            fontWeight: 'bold',
            color: t.cardTitle,
            marginBottom: 4,
        },
        actionButtons: { flexDirection: 'row' },
        smallButton: {
            backgroundColor: t.pageBackground,
            borderWidth: 0.5,
            borderColor: t.cardBorder,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
            marginLeft: 4,
        },
        smallButtonText: {
            fontSize: 13,
            fontWeight: '600',
            color: t.bodyText,
        },
    });
