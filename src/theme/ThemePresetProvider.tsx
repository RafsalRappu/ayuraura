import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";

import { themePresets, defaultThemePreset } from "./presets";
import type { ThemePresetKey } from "./presets";
import { createAppTheme } from "./createAppTheme";
import { hexToRgbString } from "./colorUtils";
import { ThemePresetContext } from "./useThemePreset";

const STORAGE_KEY = "ayuaura-theme-preset";

const readStoredPreset = (): ThemePresetKey => {
    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored && stored in themePresets ? (stored as ThemePresetKey) : defaultThemePreset;
    } catch {
        return defaultThemePreset;
    }
};

interface ThemePresetProviderProps {
    children: ReactNode;
}

export const ThemePresetProvider = ({ children }: ThemePresetProviderProps) => {
    const [preset, setPresetState] = useState<ThemePresetKey>(readStoredPreset);

    const setPreset = (next: ThemePresetKey) => {
        setPresetState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Storage blocked (private mode) — the choice still applies for this visit.
        }
    };

    useEffect(() => {
        const { primary, secondary } = themePresets[preset].palette;
        const root = document.documentElement.style;
        root.setProperty("--brand-primary", primary.main);
        root.setProperty("--brand-primary-rgb", hexToRgbString(primary.main));
        root.setProperty("--brand-secondary", secondary.main);
    }, [preset]);

    const theme = useMemo(() => createAppTheme(preset), [preset]);

    return (
        <ThemePresetContext.Provider value={{ preset, setPreset }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemePresetContext.Provider>
    );
};
