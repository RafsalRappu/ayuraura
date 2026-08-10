import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { createTheme } from "@mui/material/styles";

import { themePresets, defaultThemePreset } from "./presets";
import type { ThemePresetKey } from "./presets";
import { sharedPalette } from "./palette";
import { typography } from "./typography";
import { components } from "./components";
import { hexToRgbString } from "./colorUtils";
import { ThemePresetContext } from "./useThemePreset";

const STORAGE_KEY = "ayuaura-theme-preset";

const readStoredPreset = (): ThemePresetKey => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && stored in themePresets ? (stored as ThemePresetKey) : defaultThemePreset;
};

interface ThemePresetProviderProps {
    children: ReactNode;
}

export const ThemePresetProvider = ({ children }: ThemePresetProviderProps) => {
    const [preset, setPresetState] = useState<ThemePresetKey>(readStoredPreset);

    const setPreset = (next: ThemePresetKey) => {
        setPresetState(next);
        window.localStorage.setItem(STORAGE_KEY, next);
    };

    useEffect(() => {
        const { primary } = themePresets[preset].palette;
        const root = document.documentElement.style;
        root.setProperty("--brand-primary", primary.main);
        root.setProperty("--brand-primary-rgb", hexToRgbString(primary.main));
    }, [preset]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    ...sharedPalette,
                    ...themePresets[preset].palette,
                },
                typography,
                components,
            }),
        [preset]
    );

    return (
        <ThemePresetContext.Provider value={{ preset, setPreset }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemePresetContext.Provider>
    );
};
