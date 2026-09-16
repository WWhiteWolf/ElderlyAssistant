import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
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
    // iOS status bar and the back-to-previous-app link (#80-new).
    statusBarOnHeader: 'light' | 'dark';
    statusBarOnPage: 'light' | 'dark';
}

export const Themes: Record<ThemeName, Theme> = {
    // Light — the polished light-blue look (#45): original typography,
    // icon circles in soft teal 3a, no white cards.
    light: {
        header: '#1a6e8a',
        titleText: '#ffffff',
        subtitleText: '#a8d4e0',
        pageBackground: '#b6c1c5', // #117-new: Middle sits three even steps below the old page so every lighter tap still moves
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
        statusBarOnHeader: 'light',
        statusBarOnPage: 'dark',
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
        bodyText: '#ccc3ac', // #117-new: Middle sits three even steps below the old cream so every lighter tap still moves
        mutedText: '#d8cbaa', // #117-new: Middle sits one even step below the old muted cream so every lighter tap still moves
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
        settingValue: '#ccc3ac', // #117-new: same Letters Middle as bodyText
        settingArrow: '#e9dcba',
        progressTrack: '#5c5044',
        delay: '#FF9500',
        delayText: '#4a1f0c',
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
        statusBarOnHeader: 'dark',
        statusBarOnPage: 'light',
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

export const THEME_STORAGE_KEY = 'app_theme';    // 'light' | 'dark'
export const POPUP_STORAGE_KEY = 'popup_style';  // 'match' | 'phone'

// Each theme keeps its own Letters and Page (#117-new).
const LETTERING_STORAGE_KEYS: Record<ThemeName, string> = {
    light: 'look_lettering_light',
    dark: 'look_lettering_dark',
};
const PAGE_STORAGE_KEYS: Record<ThemeName, string> = {
    light: 'look_page_light',
    dark: 'look_page_dark',
};

/** −3 (much lighter) through 0 (shipped) to +3 (much darker). */
export type LookShift = number;

type LookByTheme = Record<ThemeName, LookShift>;

const MIDDLE_LOOK: LookByTheme = { light: 0, dark: 0 };

function clampLookShift(n: number): LookShift {
    if (!Number.isFinite(n)) return 0;
    return Math.max(-3, Math.min(3, Math.round(n)));
}

function parseLookShift(raw: string | null): LookShift {
    if (raw == null || raw === '') return 0;
    return clampLookShift(Number(raw));
}

async function readLookByTheme(keys: Record<ThemeName, string>): Promise<LookByTheme> {
    return {
        light: parseLookShift(await AsyncStorage.getItem(keys.light)),
        dark: parseLookShift(await AsyncStorage.getItem(keys.dark)),
    };
}

// Each plus or minus step moves perceived lightness by the same amount,
// so a step toward darker and a step toward lighter look even.
const LOOK_STEP_LIGHTNESS = 6;

function srgbChannelToLinear(c: number): number {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function linearChannelToSrgb(c: number): number {
    const s = c <= 0.0031308 ? 12.92 * c : 1.055 * (c ** (1 / 2.4)) - 0.055;
    return Math.max(0, Math.min(255, Math.round(s * 255)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (hex[0] !== '#' || hex.length !== 7) return null;
    const n = parseInt(hex.slice(1), 16);
    if (Number.isNaN(n)) return null;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function labF(t: number): number {
    return t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
}

function labFInv(t: number): number {
    const t3 = t * t * t;
    return t3 > 216 / 24389 ? t3 : (116 * t - 16) / (24389 / 27);
}

function rgbToLab(r: number, g: number, b: number): { L: number; a: number; bLab: number } {
    const R = srgbChannelToLinear(r);
    const G = srgbChannelToLinear(g);
    const B = srgbChannelToLinear(b);
    const x = 0.4124564 * R + 0.3575761 * G + 0.1804375 * B;
    const y = 0.2126729 * R + 0.7151522 * G + 0.0721750 * B;
    const z = 0.0193339 * R + 0.1191920 * G + 0.9503041 * B;
    const fx = labF(x / 0.95047);
    const fy = labF(y);
    const fz = labF(z / 1.08883);
    return { L: 116 * fy - 16, a: 500 * (fx - fy), bLab: 200 * (fy - fz) };
}

function labToRgb(L: number, a: number, bLab: number): { r: number; g: number; b: number } {
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - bLab / 200;
    const x = 0.95047 * labFInv(fx);
    const y = labFInv(fy);
    const z = 1.08883 * labFInv(fz);
    const R = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
    const G = -0.9692660 * x + 1.8760108 * y + 0.0415560 * z;
    const B = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
    return {
        r: linearChannelToSrgb(R),
        g: linearChannelToSrgb(G),
        b: linearChannelToSrgb(B),
    };
}

function shiftHex(hex: string, steps: LookShift): string {
    if (steps === 0) return hex;
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;
    const lab = rgbToLab(rgb.r, rgb.g, rgb.b);
    const nextL = Math.max(0, Math.min(100, lab.L - steps * LOOK_STEP_LIGHTNESS));
    const next = labToRgb(nextL, lab.a, lab.bLab);
    return rgbToHex(next.r, next.g, next.b);
}

function applyLookShifts(theme: Theme, lettering: LookShift, page: LookShift): Theme {
    if (lettering === 0 && page === 0) return theme;
    const next = { ...theme };
    if (page !== 0) {
        next.pageBackground = shiftHex(theme.pageBackground, page);
    }
    if (lettering !== 0) {
        next.bodyText = shiftHex(theme.bodyText, lettering);
        next.mutedText = shiftHex(theme.mutedText, lettering);
        next.tileLabel = shiftHex(theme.tileLabel, lettering);
        next.cardTitle = shiftHex(theme.cardTitle, lettering);
        next.settingValue = shiftHex(theme.settingValue, lettering);
        next.pill = shiftHex(theme.pill, lettering);
    }
    return next;
}

interface ThemeControls {
    themeName: ThemeName;
    setThemeName: (name: ThemeName) => void;
    popupStyle: PopupStyle;
    setPopupStyle: (style: PopupStyle) => void;
    letteringShift: LookShift;
    setLetteringShift: (n: LookShift) => void;
    pageShift: LookShift;
    setPageShift: (n: LookShift) => void;
    /** Read the saved look again after a full restore. */
    reloadPreferences: () => Promise<void>;
    /** False until the saved theme and popup-style choices have been read. */
    preferencesReady: boolean;
}

const ThemeContext = createContext<ThemeControls | null>(null);

// No JSX here on purpose — this is a .ts file, so the provider is built
// with createElement instead.
export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME);
    const [popupStyle, setPopupStyleState] = useState<PopupStyle>('match');
    const [letteringByTheme, setLetteringByTheme] = useState<LookByTheme>(MIDDLE_LOOK);
    const [pageByTheme, setPageByTheme] = useState<LookByTheme>(MIDDLE_LOOK);
    const [preferencesReady, setPreferencesReady] = useState(false);

    const letteringShift = letteringByTheme[themeName];
    const pageShift = pageByTheme[themeName];

    // Load the saved choices once at startup. Until they arrive the app
    // shows DEFAULT_THEME, so a dark-theme user may see a brief light
    // flash on launch.
    useEffect(() => {
        (async () => {
            let loadedTheme: ThemeName = DEFAULT_THEME;
            let loadedPopup: PopupStyle = 'match';
            try {
                const t = await AsyncStorage.getItem(THEME_STORAGE_KEY);
                if (t === 'light' || t === 'dark') loadedTheme = t;
                const p = await AsyncStorage.getItem(POPUP_STORAGE_KEY);
                if (p === 'match' || p === 'phone') loadedPopup = p;
                const letters = await readLookByTheme(LETTERING_STORAGE_KEYS);
                const page = await readLookByTheme(PAGE_STORAGE_KEYS);
                setThemeNameState(loadedTheme);
                setPopupStyleState(loadedPopup);
                setLetteringByTheme(letters);
                setPageByTheme(page);
            } catch (e) {
                console.error(e);
            } finally {
                // Set before the health notice can run, so Alert styling is right.
                Appearance.setColorScheme(loadedPopup === 'match' ? loadedTheme : null);
                setPreferencesReady(true);
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
    const setLetteringShift = (n: LookShift) => {
        const next = clampLookShift(n);
        setLetteringByTheme((prev) => ({ ...prev, [themeName]: next }));
        AsyncStorage.setItem(LETTERING_STORAGE_KEYS[themeName], String(next)).catch(console.error);
    };
    const setPageShift = (n: LookShift) => {
        const next = clampLookShift(n);
        setPageByTheme((prev) => ({ ...prev, [themeName]: next }));
        AsyncStorage.setItem(PAGE_STORAGE_KEYS[themeName], String(next)).catch(console.error);
    };

    const reloadPreferences = async () => {
        let loadedTheme: ThemeName = DEFAULT_THEME;
        let loadedPopup: PopupStyle = 'match';
        try {
            const t = await AsyncStorage.getItem(THEME_STORAGE_KEY);
            if (t === 'light' || t === 'dark') loadedTheme = t;
            const p = await AsyncStorage.getItem(POPUP_STORAGE_KEY);
            if (p === 'match' || p === 'phone') loadedPopup = p;
            const letters = await readLookByTheme(LETTERING_STORAGE_KEYS);
            const page = await readLookByTheme(PAGE_STORAGE_KEYS);
            setThemeNameState(loadedTheme);
            setPopupStyleState(loadedPopup);
            setLetteringByTheme(letters);
            setPageByTheme(page);
        } catch (e) {
            console.error(e);
        }
        Appearance.setColorScheme(loadedPopup === 'match' ? loadedTheme : null);
    };

    return createElement(
        ThemeContext.Provider,
        {
            value: {
                themeName,
                setThemeName,
                popupStyle,
                setPopupStyle,
                letteringShift,
                setLetteringShift,
                pageShift,
                setPageShift,
                reloadPreferences,
                preferencesReady,
            },
        },
        children,
    );
}

// Pages call this to get the active theme; they re-render live when it
// changes. Falls back to DEFAULT_THEME if the provider isn't mounted.
export function useTheme(): Theme {
    const ctx = useContext(ThemeContext);
    const name = ctx ? ctx.themeName : DEFAULT_THEME;
    const lettering = ctx ? ctx.letteringShift : 0;
    const page = ctx ? ctx.pageShift : 0;
    return useMemo(
        () => applyLookShifts(Themes[name], lettering, page),
        [name, lettering, page],
    );
}

// Settings' Appearance section uses this to read AND change the choices.
export function useThemeControls(): ThemeControls {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useThemeControls must be used inside ThemeProvider');
    return ctx;
}
