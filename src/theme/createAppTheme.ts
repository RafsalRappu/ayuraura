// src/theme/createAppTheme.ts
// Builds the MUI theme for a color preset. The storefront and the admin share
// palette, shadows and motion; they differ in heading type and corner rounding.

import { createTheme } from "@mui/material/styles";

import "./types";
import { createComponents } from "./components";
import type { ThemeVariant } from "./components";
import { greyChannel, sharedPalette } from "./palette";
import { themePresets } from "./presets";
import type { ThemePresetKey } from "./presets";
import { createCustomShadows, createShadows } from "./shadows";
import { adminTypography, storeTypography } from "./typography";

export type { ThemeVariant };

export const createAppTheme = (presetKey: ThemePresetKey, variant: ThemeVariant = "store") => {
    const preset = themePresets[presetKey].palette;

    return createTheme({
        palette: {
            ...sharedPalette,
            primary: preset.primary,
            secondary: preset.secondary,
            background: preset.background,
        },
        typography: variant === "admin" ? adminTypography : storeTypography,
        // Kept at MUI's 4px base: `sx={{ borderRadius: 3 }}` across the app means 12px.
        shape: { borderRadius: 4 },
        shadows: createShadows(greyChannel),
        customShadows: createCustomShadows(greyChannel, {
            primary: preset.primary.main,
            secondary: preset.secondary.main,
        }),
        transitions: {
            easing: { easeOut: "cubic-bezier(0.22, 1, 0.36, 1)" },
        },
        components: createComponents(variant),
    });
};
