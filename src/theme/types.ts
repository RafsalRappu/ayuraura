// src/theme/types.ts
// Theme extensions used across the app: a lighter/darker step on every palette
// color, a "neutral" section background, and named soft shadows.

import "@mui/material/styles";

export interface CustomShadows {
    z1: string;
    z4: string;
    z8: string;
    z12: string;
    z16: string;
    z20: string;
    z24: string;
    /** Resting surface — cards, panels. */
    card: string;
    /** Menus, popovers, temporary drawers. */
    dropdown: string;
    dialog: string;
    /** Colored glow under primary/secondary actions. */
    primary: string;
    secondary: string;
}

declare module "@mui/material/styles" {
    interface Theme {
        customShadows: CustomShadows;
    }

    interface ThemeOptions {
        customShadows?: CustomShadows;
    }

    interface PaletteColor {
        lighter: string;
        darker: string;
    }

    interface SimplePaletteColorOptions {
        lighter?: string;
        darker?: string;
    }

    interface TypeBackground {
        /** Tinted surface for alternating sections, table heads, media wells. */
        neutral: string;
    }
}
