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
    // typography (the two themes deliberately differ — Patrick's call, #45)
    titleSize: number;
    titleWeight: '500' | '600';
    subtitleSize: number;
    subtitleWeight: '400' | '500';
    tileLabelSize: number;
    tileLabelFont: string | undefined; // 'Georgia' or undefined = system font
    // effects
    iconShadow: boolean; // emoji drop shadow (needed on dark, smudgy on light)
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
        tileCircleBorder: '#348f86',
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
        titleSize: 28,
        titleWeight: '500',
        subtitleSize: 22,
        subtitleWeight: '400',
        tileLabelSize: 18,
        tileLabelFont: undefined,
        iconShadow: false,
    },
    // Dark — the warm dark theme exactly as approved #43 / built #44.
    dark: {
        header: '#f0a83a',
        titleText: '#4a1f0c',
        subtitleText: '#6b3418',
        pageBackground: '#3a3024',
        bridge: '#c9622e',
        tileCircle: '#c9622e',
        tileCircleBorder: '#a3481f',
        tileLabel: '#f0d9a8',
        cartIcon: '#d8dde3',
        settingsGear: '#c9622e',
        card: '#4a3e30',
        cardBorder: '#a3481f',
        cardTitle: '#f0a83a',
        bodyText: '#f0d9a8',
        mutedText: '#c9b896',
        headerButton: '#4a1f0c',
        buttonPrimary: '#c9622e',
        buttonPrimaryText: '#f0d9a8',
        titleSize: 28,
        titleWeight: '600',
        subtitleSize: 22,
        subtitleWeight: '500',
        tileLabelSize: 13,
        tileLabelFont: 'Georgia',
        iconShadow: true,
    },
};

// Flip this one word to switch themes until the Settings toggle exists.
export const DEFAULT_THEME: ThemeName = 'dark';

// Pages call this to get the active theme. For now it just returns the
// default; the future Settings toggle upgrades this function's insides
// (stored choice + live switching) without any page needing edits.
export function useTheme(): Theme {
    return Themes[DEFAULT_THEME];
}
