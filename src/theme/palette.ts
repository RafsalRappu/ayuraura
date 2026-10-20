// src/theme/palette.ts
// Colors shared across every theme preset — neutrals and semantic colors, not
// brand-specific, so meaning (e.g. "paid", "out of stock") never changes with the look.

import { alpha } from "@mui/material/styles";

/** Cool neutrals with a faint teal cast, so greys sit comfortably beside any preset. */
export const grey = {
    50: "#FCFDFD",
    100: "#F7F9F9",
    200: "#F0F3F3",
    300: "#E1E7E7",
    400: "#C5CFCF",
    500: "#919F9F",
    600: "#637272",
    700: "#414E4E",
    800: "#1E2A2A",
    900: "#131C1C",
};

/** "r, g, b" of grey[500] — the base every soft shadow and hairline is mixed from. */
export const greyChannel = "145, 159, 159";

const semantic = {
    info: {
        lighter: "#CAFDF5",
        light: "#61F3F3",
        main: "#00B8D9",
        dark: "#006C9C",
        darker: "#003768",
        contrastText: "#FFFFFF",
    },
    success: {
        lighter: "#D3FCD2",
        light: "#77ED8B",
        main: "#22C55E",
        dark: "#118D57",
        darker: "#065E49",
        contrastText: "#FFFFFF",
    },
    warning: {
        lighter: "#FFF5CC",
        light: "#FFD666",
        main: "#FFAB00",
        dark: "#B76E00",
        darker: "#7A4100",
        contrastText: grey[800],
    },
    error: {
        lighter: "#FFE9D5",
        light: "#FFAC82",
        main: "#FF5630",
        dark: "#B71D18",
        darker: "#7A0916",
        contrastText: "#FFFFFF",
    },
};

export const sharedPalette = {
    grey,
    ...semantic,
    common: { black: "#000000", white: "#FFFFFF" },
    text: {
        primary: grey[800],
        secondary: grey[600],
        disabled: grey[500],
    },
    divider: alpha(grey[500], 0.2),
    action: {
        hover: alpha(grey[500], 0.08),
        selected: alpha(grey[500], 0.16),
        focus: alpha(grey[500], 0.24),
        disabled: alpha(grey[500], 0.8),
        disabledBackground: alpha(grey[500], 0.24),
        hoverOpacity: 0.08,
        disabledOpacity: 0.48,
    },
};
