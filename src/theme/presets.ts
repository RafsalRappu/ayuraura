// src/theme/presets.ts
// Alternate brand color presets. Each swaps primary/secondary/background —
// text and semantic colors (success, error, ...) stay in sharedPalette so
// meaning (e.g. "in stock") never changes with the look.

export type ThemePresetKey = "forest" | "rosewood" | "lavender" | "terracotta";

interface PresetPalette {
    primary: { main: string; light: string; dark: string; contrastText: string };
    secondary: { main: string; contrastText: string };
    background: { default: string; paper: string };
}

interface ThemePreset {
    label: string;
    palette: PresetPalette;
}

export const themePresets: Record<ThemePresetKey, ThemePreset> = {
    forest: {
        label: "Forest",
        palette: {
            primary: { main: "#355E3B", light: "#4F7A55", dark: "#234228", contrastText: "#ffffff" },
            secondary: { main: "#B38B59", contrastText: "#ffffff" },
            background: { default: "#F9F7F2", paper: "#FFFFFF" },
        },
    },

    rosewood: {
        label: "Rosewood",
        palette: {
            primary: { main: "#8C3B4A", light: "#A85C6A", dark: "#652832", contrastText: "#ffffff" },
            secondary: { main: "#C9A227", contrastText: "#ffffff" },
            background: { default: "#FBF1EF", paper: "#FFFFFF" },
        },
    },

    lavender: {
        label: "Lavender",
        palette: {
            primary: { main: "#5B4B8A", light: "#7A6BA6", dark: "#3F3362", contrastText: "#ffffff" },
            secondary: { main: "#D18F6A", contrastText: "#ffffff" },
            background: { default: "#F7F4FA", paper: "#FFFFFF" },
        },
    },

    terracotta: {
        label: "Terracotta",
        palette: {
            primary: { main: "#B5502D", light: "#C97650", dark: "#84391F", contrastText: "#ffffff" },
            secondary: { main: "#7A8B5B", contrastText: "#ffffff" },
            background: { default: "#FDF4EC", paper: "#FFFFFF" },
        },
    },
};

export const defaultThemePreset: ThemePresetKey = "forest";
