import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, ReactNode, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

// Shared two-theme foundation (session #45).
// Both themes live here with the same keys, so every page reads the
// same names and gets the right values for whichever theme is active.
//
// Until the Settings theme-toggle is built, the active theme is the
// one word in DEFAULT_THEME below — flip 'dark' to 'light' (or back)
// to switch the whole app for testing. When the toggle session comes,
// useTheme() gets upgraded to read the stored choice; pages using it
// won't need to change.
//
// Keys below cover the Home page. As each page is converted, new keys
// it needs (list rows, buttons, inputs...) get added to BOTH themes.

export type ThemeName = 'light' | 'dark';

export interface Theme {
    // colors
    header: string;
    titleText: string;
    subtitleText: string;
    pageBackground: string;
    bridge: string;
    tileCircle: string;
    tileCircleBorder: string;
    tileCircleBorderWidth: number; // #64: crisp outline — differs per theme (2 light / 3 dark)
    tileLabel: string;
    cartIcon: string;
    settingsGear: string;
    // page furniture (added #46: backup + watchlist conversion)
    card: string;        // card / list-row background
    cardBorder: string;  // card / list-row border
    cardTitle: string;   // main text on a card button
    bodyText: string;    // paragraphs on the page background
    mutedText: string;   // secondary / hint text
    headerButton: string; // header pill button border + text
    buttonPrimary: string;     // solid action buttons + selected chip
    buttonPrimaryText: string; // text on those buttons
    // list & form extras (added #47: shopping + vault conversion)
    buttonNeutral: string;       // quiet button (Cancel) (light: solid grey; dark: outlined gold)
    buttonNeutralBorder: string;
    buttonNeutralText: string;
    chip: string;                // unselected preset-chip background (Vault form)
    buttonDelete: string;       // swipe-delete (red in BOTH themes — red means delete)
    buttonDeleteText: string;
    stockedButton: string;       // Shopping "Stocked" state (light: solid bridge teal; dark: outlined gold)
    stockedButtonBorder: string;
    stockedButtonText: string;
    rowSelected: string;        // selected list-row background (Shopping move-arrows)
    rowSelectedBorder: string;  // selected list-row border
    // #13-new: the outline on the row a tapped reminder was about. It has a
    // name of its own rather than borrowing rowSelectedBorder, because that
    // one sits on Shopping's pale filled row and needs its darkness to stand
    // apart from it — while this outline sits on the plain page and reads
    // better lighter (Patrick, seen on the phone in both themes).
    rowReminderBorder: string;
    // timer & settings (added #48: timer + settings conversion)
    pill: string;             // Timer minute-preset pill border + text, unselected (light: teal; dark: outlined gold)
    pillSelected: string;     // selected pill fill (light: teal; dark: solid orange); text = buttonPrimaryText
    switchTrackOn: string;    // native Switch track when ON
    switchTrackOff: string;   // native Switch track when OFF
    switchThumb: string;      // native Switch thumb (both states)
    buttonDone: string;       // Timer's green Done (green in BOTH themes — green means done)
    buttonDoneText: string;
    countdown: string;        // Timer's big countdown number
    settingValue: string;     // Settings row value (name, times) (light: teal; dark: cream)
    settingArrow: string;     // Settings row "›" chevron
    progressTrack: string;        // bottom-border colour
    // Delay colour. The bright iOS orange stays identical in BOTH themes so a
    // delayed item always jumps out; dark gets dark-brown text on it
    // (bright fill = dark text, same rule as the gold buttons).
    delay: string;                // Delay buttons + "▶ Delayed …" tile line
    delayText: string;            // text on a solid delay button
    // Coffee/Water counters and the time stepper.
    counterMinus: string;         // Coffee/Water "−" circle: #ffcc00 in BOTH themes (dark gets dark-brown text — bright fill rule)
    counterMinusText: string;
    timeStepper: string;          // New/Edit Entry time-spinner ▲▼ circles (light: solid blue; dark: outlined gold —
    timeStepperBorder: string;    // a quiet adjust control, so Save stays the only solid-orange action in that popup)
    timeStepperText: string;
    // typography (the two themes deliberately differ — Patrick's call, #45)
    titleSize: number;
    titleWeight: '500' | '600';
    subtitleSize: number;
    subtitleWeight: '400' | '500';
    tileLabelSize: number;
    tileLabelFont: string | undefined; // 'Georgia' or undefined = system font
    // effects
    iconShadow: boolean; // emoji drop shadow (needed on dark, smudgy on light)
    // home tile halo (added #56): soft glow behind each icon circle, in the
    // theme's HEADER color (Patrick's pick). iOS shadow props on iconCircle;
    // mockup-approved, final strength is a phone judgment.
    tileHalo: string;         // halo color
    tileHaloOpacity: number;  // shadowOpacity
    tileHaloRadius: number;   // shadowRadius
}

export const Themes: Record<ThemeName, Theme> = {
    // Light — the polished light-blue look (#45): original typography,
    // icon circles in soft teal 3a, no white cards.
    light: {
        header: '#1a6e8a',
        titleText: '#ffffff',
        subtitleText: '#a8d4e0',
        pageBackground: '#e8f4f8',
        bridge: '#2d9e8f',
        tileCircle: '#4caba1',
        tileCircleBorder: '#1a6e8a', // #64: crisp header-teal outline (was #43a297 — near-identical to the fill)
        tileCircleBorderWidth: 2,    // #64: Patrick's pick — thinner than dark's 3
        tileLabel: '#1a6e8a',
        cartIcon: '#d8dde3',
        settingsGear: '#4caba1',
        card: '#ffffff',
        cardBorder: '#a8d4e0',
        cardTitle: '#1a6e8a',
        bodyText: '#1a6e8a',
        mutedText: '#888888',
        headerButton: '#ffffff',
        buttonPrimary: '#1a6e8a',
        buttonPrimaryText: '#ffffff',
        buttonNeutral: '#cccccc',
        buttonNeutralBorder: '#cccccc',
        buttonNeutralText: '#333333',
        chip: '#ffffff',
        buttonDelete: '#e74c3c',
        buttonDeleteText: '#ffffff',
        stockedButton: '#2d9e8f',
        stockedButtonBorder: '#2d9e8f',
        stockedButtonText: '#ffffff',
        rowSelected: '#d6eef8',
        rowSelectedBorder: '#1a6e8a',
        // The same teal at its own hue and strength, with the darkness halved.
        rowReminderBorder: '#6dc6e3',
        pill: '#2d9e8f',
        pillSelected: '#2d9e8f',
        switchTrackOn: '#1a6e8a',
        switchTrackOff: '#cccccc',
        switchThumb: '#ffffff',
        buttonDone: '#27ae60',
        buttonDoneText: '#ffffff',
        countdown: '#2d9e8f',
        settingValue: '#2d9e8f',
        settingArrow: '#a8d4e0',
        progressTrack: '#e0e0e0',
        delay: '#FF9500',
        delayText: '#ffffff',
        counterMinus: '#ffcc00',
        counterMinusText: '#ffffff',
        timeStepper: '#1a6e8a',
        timeStepperBorder: '#1a6e8a',
        timeStepperText: '#ffffff',
        titleSize: 28,
        titleWeight: '500',
        subtitleSize: 21,
        subtitleWeight: '400',
        tileLabelSize: 20, // #62: was 18 — Home tiles ~10% bigger (Patrick's phone call)
        tileLabelFont: 'Georgia', // #56: matches dark — both themes read Georgia
        iconShadow: false,
        tileHalo: '#1a6e8a',      // #56: header teal-blue
        tileHaloOpacity: 0,       // #64: halo OFF (Patrick trying no-halo; was 0.75 pre-#64 — restore both numbers to bring it back)
        tileHaloRadius: 8,
    },
    // Dark — the warm dark theme exactly as approved #43 / built #44.
    dark: {
        header: '#f0a83a',
        titleText: '#4a1f0c',
        subtitleText: '#6b3418',
        pageBackground: '#3a3024',
        bridge: '#c9622e',
        tileCircle: '#c9622e',
        tileCircleBorder: '#f0a83a', // #64: crisp gold outline (was #a3481f) — matches the outlined-gold convention
        tileCircleBorderWidth: 3,    // #64: Patrick's pick — heavier than light's 2
        tileLabel: '#f0a83a', // #56: gold (was pale cream #f0d9a8) — Patrick's pick
        cartIcon: '#d8dde3',
        settingsGear: '#c9622e',
        card: '#4a3e30',
        cardBorder: '#a3481f',
        cardTitle: '#f0a83a',
        bodyText: '#fff6de',
        mutedText: '#e9dcba',
        headerButton: '#4a1f0c',
        buttonPrimary: '#c9622e',
        buttonPrimaryText: '#fff6de',
        buttonNeutral: '#4a3e30',
        buttonNeutralBorder: '#f0a83a',
        buttonNeutralText: '#f0a83a',
        chip: '#3a3024',
        buttonDelete: '#e74c3c',
        buttonDeleteText: '#ffffff',
        stockedButton: '#3a3024',
        stockedButtonBorder: '#f0a83a',
        stockedButtonText: '#f0a83a',
        rowSelected: '#5c5044',
        rowSelectedBorder: '#f0a83a',
        // Unchanged from rowSelectedBorder: the dark theme's orange was right
        // on the phone as it stood, so only the light theme was lightened.
        rowReminderBorder: '#f0a83a',
        pill: '#f0a83a',
        pillSelected: '#c9622e',
        switchTrackOn: '#c9622e',
        switchTrackOff: '#5c5044',
        switchThumb: '#fff6de',
        buttonDone: '#27ae60',
        buttonDoneText: '#ffffff',
        countdown: '#fff6de',
        settingValue: '#fff6de',
        settingArrow: '#e9dcba',
        progressTrack: '#5c5044',
        delay: '#FF9500',
        delayText: '#4a1f0c',
        counterMinus: '#ffcc00',
        counterMinusText: '#4a1f0c',
        timeStepper: '#4a3e30',
        timeStepperBorder: '#f0a83a',
        timeStepperText: '#f0a83a',
        titleSize: 28,
        titleWeight: '600',
        subtitleSize: 21,
        subtitleWeight: '400',
        tileLabelSize: 20, // #62: was 18 — Home tiles ~10% bigger (Patrick's phone call)
        tileLabelFont: 'Georgia',
        iconShadow: true,
        tileHalo: '#f0a83a',      // #56: header gold
        tileHaloOpacity: 0,       // #64: halo OFF (Patrick trying no-halo; was 0.55 pre-#64 — restore both numbers to bring it back)
        tileHaloRadius: 7,
    },
};

// First-launch default and fallback when no stored choice exists (#48:
// the Settings "App Colors" buttons are now the way to switch themes).
export const DEFAULT_THEME: ThemeName = 'light';

// ---- Live theme switching (built #48) ----------------------------------
// ThemeProvider (wrapped around the app in app/_layout.tsx) holds the
// active choices, saves them on the phone, and re-renders every page when
// they change. (All 13 pages converted as of #53; Colors.ts retired #57.)

export type PopupStyle = 'match' | 'phone';

const THEME_STORAGE_KEY = 'app_theme';    // 'light' | 'dark'
const POPUP_STORAGE_KEY = 'popup_style';  // 'match' | 'phone'

interface ThemeControls {
    themeName: ThemeName;
    setThemeName: (name: ThemeName) => void;
    popupStyle: PopupStyle;
    setPopupStyle: (style: PopupStyle) => void;
}

const ThemeContext = createContext<ThemeControls | null>(null);

// No JSX here on purpose — this is a .ts file, so the provider is built
// with createElement instead.
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME);
    const [popupStyle, setPopupStyleState] = useState<PopupStyle>('match');

    // Load the saved choices once at startup. Until they arrive the app
    // shows DEFAULT_THEME, so a dark-theme user may see a brief light
    // flash on launch.
    useEffect(() => {
        (async () => {
            try {
                const t = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (t === 'light' || t === 'dark') setThemeNameState(t);
                const p = await AsyncStorage.getItem(POPUP_STORAGE_KEY);
                if (p === 'match' || p === 'phone') setPopupStyleState(p);
            } catch (e) {
                console.error(e);
            }
        })();
    }, []);

    // Tell iOS which style its own pieces (Alert popups, share sheet,
    // file picker) should use: the app's theme, or the phone's setting
    // (null = follow the phone, the pre-#48 behavior).
    useEffect(() => {
        Appearance.setColorScheme(popupStyle === 'match' ? themeName : null);
    }, [themeName, popupStyle]);

    const setThemeName = (name: ThemeName) => {
        setThemeNameState(name);
        AsyncStorage.setItem(THEME_STORAGE_KEY, name).catch(console.error);
    };
    const setPopupStyle = (style: PopupStyle) => {
        setPopupStyleState(style);
        AsyncStorage.setItem(POPUP_STORAGE_KEY, style).catch(console.error);
    };

    return createElement(
        ThemeContext.Provider,
        { value: { themeName, setThemeName, popupStyle, setPopupStyle } },
        children,
    );
}

// Pages call this to get the active theme; they re-render live when it
// changes. Falls back to DEFAULT_THEME if the provider isn't mounted.
export function useTheme(): Theme {
    const ctx = useContext(ThemeContext);
    return Themes[ctx ? ctx.themeName : DEFAULT_THEME];
}

// Settings' Appearance section uses this to read AND change the choices.
export function useThemeControls(): ThemeControls {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useThemeControls must be used inside ThemeProvider');
    return ctx;
}
