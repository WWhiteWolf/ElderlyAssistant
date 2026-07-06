import { View } from 'react-native';
import { useTheme } from '../constants/Themes';

// The header "bridge" — the strip between every page's header and its
// content. Four-band design (#62, Patrick's, iterated in the Simulator):
// page-color (3px), bridge-color (4px), page-color (3px), bridge-color
// (4px) — the light bands read wider than they are, so the colored bands
// are a touch taller. Colors ride the existing theme keys; no new ones.
// Built as ONE shared component in the #63 rollout so any future bridge
// change is a single edit here, not fourteen.
export default function Bridge() {
    const theme = useTheme();
    return (
        <>
            <View style={{ height: 3, backgroundColor: theme.pageBackground }} />
            <View style={{ height: 4, backgroundColor: theme.bridge }} />
            <View style={{ height: 3, backgroundColor: theme.pageBackground }} />
            <View style={{ height: 4, backgroundColor: theme.bridge }} />
        </>
    );
}
