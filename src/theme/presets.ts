// src/theme/presets.ts
// Brand color presets offered by the theme switcher. Each swaps primary,
// secondary and the page backgrounds — text and semantic colors stay in
// sharedPalette. Every `main` keeps white (or dark, where noted) button text
// at WCAG AA contrast.

export type ThemePresetKey = "peacock" | "jade" | "saffron" | "rose" | "indigo";

interface ColorScale {
    lighter: string;
    light: string;
    main: string;
    dark: string;
    darker: string;
    contrastText: string;
}

interface PresetPalette {
    primary: ColorScale;
    secondary: ColorScale;
    background: { default: string; paper: string; neutral: string };
}

interface ThemePreset {
    label: string;
    palette: PresetPalette;
}

const INK = "#1E2A2A";

const teal: ColorScale = {
    lighter: "#CCF2EE",
    light: "#5EC2B8",
    main: "#0F766E",
    dark: "#0A5A54",
    darker: "#053A36",
    contrastText: "#FFFFFF",
};

const saffronAccent: ColorScale = {
    lighter: "#FFF1D6",
    light: "#FFC870",
    main: "#F5A524",
    dark: "#B97409",
    darker: "#7B4A04",
    contrastText: INK,
};

export const themePresets: Record<ThemePresetKey, ThemePreset> = {
    peacock: {
        label: "Peacock",
        palette: {
            primary: teal,
            secondary: saffronAccent,
            background: { default: "#FFFFFF", paper: "#FFFFFF", neutral: "#F3F7F6" },
        },
    },

    jade: {
        label: "Jade",
        palette: {
            primary: {
                lighter: "#D3F4E6",
                light: "#5CC79B",
                main: "#0C7F59",
                dark: "#08603F",
                darker: "#043D29",
                contrastText: "#FFFFFF",
            },
            secondary: {
                lighter: "#FFE9E1",
                light: "#FFA98A",
                main: "#F2724B",
                dark: "#B5492A",
                darker: "#782B16",
                contrastText: INK,
            },
            background: { default: "#FFFFFF", paper: "#FFFFFF", neutral: "#F3F8F5" },
        },
    },

    saffron: {
        label: "Saffron",
        palette: {
            primary: {
                lighter: "#FFEBD6",
                light: "#F39A55",
                main: "#B9520C",
                dark: "#8C3D08",
                darker: "#5C2704",
                contrastText: "#FFFFFF",
            },
            secondary: teal,
            background: { default: "#FFFFFF", paper: "#FFFFFF", neutral: "#FBF6F1" },
        },
    },

    rose: {
        label: "Rose",
        palette: {
            primary: {
                lighter: "#FCE1EA",
                light: "#E77C9E",
                main: "#B83A63",
                dark: "#8C2649",
                darker: "#5A142E",
                contrastText: "#FFFFFF",
            },
            secondary: {
                lighter: "#FFF1D6",
                light: "#F7CB6E",
                main: "#E0A526",
                dark: "#A3740F",
                darker: "#6B4A07",
                contrastText: INK,
            },
            background: { default: "#FFFFFF", paper: "#FFFFFF", neutral: "#FBF4F6" },
        },
    },

    indigo: {
        label: "Indigo",
        palette: {
            primary: {
                lighter: "#E0E3FF",
                light: "#8E95F5",
                main: "#4B45D6",
                dark: "#3430A2",
                darker: "#1E1B66",
                contrastText: "#FFFFFF",
            },
            secondary: {
                lighter: "#FFE6DC",
                light: "#FFAD8E",
                main: "#FF7A50",
                dark: "#C2502C",
                darker: "#80301A",
                contrastText: INK,
            },
            background: { default: "#FFFFFF", paper: "#FFFFFF", neutral: "#F5F5FC" },
        },
    },
};

export const defaultThemePreset: ThemePresetKey = "peacock";
