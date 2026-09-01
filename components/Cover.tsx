import { createContext, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

type Register = (id: number, node: ReactNode | null) => void;

const CoverDispatch = createContext<Register>(() => {});

let nextId = 1;

export function CoverRoot({ children }: { children: ReactNode }) {
    const [slots, setSlots] = useState<{ id: number; node: ReactNode }[]>([]);
    const register = useMemo<Register>(
        () => (id, node) => {
            setSlots((prev) => {
                const rest = prev.filter((one) => one.id !== id);
                if (node == null) return rest;
                return [...rest, { id, node }];
            });
        },
        [],
    );
    return (
        <CoverDispatch.Provider value={register}>
            <View style={styles.root}>
                {children}
                {slots.map((one) => (
                    <View key={one.id} style={styles.slot} pointerEvents="box-none">
                        {one.node}
                    </View>
                ))}
            </View>
        </CoverDispatch.Provider>
    );
}

/** Draws in the app window, so it turns with the page. Native Modal does not. */
export function Cover({ visible, children }: { visible: boolean; children: ReactNode }) {
    const register = useContext(CoverDispatch);
    const id = useMemo(() => nextId++, []);
    useLayoutEffect(() => {
        register(id, visible ? children : null);
        return () => register(id, null);
    }, [visible, children, id, register]);
    return null;
}

const styles = StyleSheet.create({
    root: { flex: 1 },
    slot: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
        elevation: 100,
    },
});
