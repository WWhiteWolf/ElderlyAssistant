import * as ScreenOrientation from 'expo-screen-orientation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type LandscapeHeaderSide = 'left' | 'right';

const LandscapeHeaderSideContext = createContext<LandscapeHeaderSide | null>(null);

function headerSideFor(
    orientation: ScreenOrientation.Orientation,
): LandscapeHeaderSide | null | undefined {
    // These names are Apple's interface orientations. In the app's physical
    // terms, LandscapeRight is the established 90° CCW turn.
    if (orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT) return 'left';
    if (orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT) return 'right';
    if (
        orientation === ScreenOrientation.Orientation.PORTRAIT_UP
        || orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
    ) {
        return null;
    }
    return undefined;
}

/** One orientation reading shared by every page and header button. */
export function AppOrientationProvider({ children }: { children: ReactNode }) {
    const [headerSide, setHeaderSide] = useState<LandscapeHeaderSide | null>(null);

    useEffect(() => {
        let mounted = true;
        const apply = (orientation: ScreenOrientation.Orientation) => {
            const side = headerSideFor(orientation);
            if (mounted && side !== undefined) setHeaderSide(side);
        };

        void ScreenOrientation.getOrientationAsync().then(apply);
        const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
            apply(event.orientationInfo.orientation);
        });

        return () => {
            mounted = false;
            ScreenOrientation.removeOrientationChangeListener(subscription);
        };
    }, []);

    return (
        <LandscapeHeaderSideContext.Provider value={headerSide}>
            {children}
        </LandscapeHeaderSideContext.Provider>
    );
}

export function useLandscapeHeaderSide(): LandscapeHeaderSide | null {
    return useContext(LandscapeHeaderSideContext);
}
