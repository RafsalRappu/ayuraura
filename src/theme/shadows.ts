// src/theme/shadows.ts
// Soft, low-contrast shadows mixed from the neutral grey instead of black.

import { alpha } from "@mui/material/styles";
import type { Shadows } from "@mui/material/styles";

import type { CustomShadows } from "./types";

/** MUI's own elevation geometry, recolored and softened. */
export const createShadows = (channel: string): Shadows => {
    const umbra = `rgba(${channel}, 0.2)`;
    const penumbra = `rgba(${channel}, 0.14)`;
    const ambient = `rgba(${channel}, 0.12)`;

    const shadow = (...px: number[]) =>
        [
            `${px[0]}px ${px[1]}px ${px[2]}px ${px[3]}px ${umbra}`,
            `${px[4]}px ${px[5]}px ${px[6]}px ${px[7]}px ${penumbra}`,
            `${px[8]}px ${px[9]}px ${px[10]}px ${px[11]}px ${ambient}`,
        ].join(",");

    return [
        "none",
        shadow(0, 2, 1, -1, 0, 1, 1, 0, 0, 1, 3, 0),
        shadow(0, 3, 1, -2, 0, 2, 2, 0, 0, 1, 5, 0),
        shadow(0, 3, 3, -2, 0, 3, 4, 0, 0, 1, 8, 0),
        shadow(0, 2, 4, -1, 0, 4, 5, 0, 0, 1, 10, 0),
        shadow(0, 3, 5, -1, 0, 5, 8, 0, 0, 1, 14, 0),
        shadow(0, 3, 5, -1, 0, 6, 10, 0, 0, 1, 18, 0),
        shadow(0, 4, 5, -2, 0, 7, 10, 1, 0, 2, 16, 1),
        shadow(0, 5, 5, -3, 0, 8, 10, 1, 0, 3, 14, 2),
        shadow(0, 5, 6, -3, 0, 9, 12, 1, 0, 3, 16, 2),
        shadow(0, 6, 6, -3, 0, 10, 14, 1, 0, 4, 18, 3),
        shadow(0, 6, 7, -4, 0, 11, 15, 1, 0, 4, 20, 3),
        shadow(0, 7, 8, -4, 0, 12, 17, 2, 0, 5, 22, 4),
        shadow(0, 7, 8, -4, 0, 13, 19, 2, 0, 5, 24, 4),
        shadow(0, 7, 9, -4, 0, 14, 21, 2, 0, 5, 26, 4),
        shadow(0, 8, 9, -5, 0, 15, 22, 2, 0, 6, 28, 5),
        shadow(0, 8, 10, -5, 0, 16, 24, 2, 0, 6, 30, 5),
        shadow(0, 8, 11, -5, 0, 17, 26, 2, 0, 6, 32, 5),
        shadow(0, 9, 11, -5, 0, 18, 28, 2, 0, 7, 34, 6),
        shadow(0, 9, 12, -6, 0, 19, 29, 2, 0, 7, 36, 6),
        shadow(0, 10, 13, -6, 0, 20, 31, 3, 0, 8, 38, 7),
        shadow(0, 10, 13, -6, 0, 21, 33, 3, 0, 8, 40, 7),
        shadow(0, 10, 14, -6, 0, 22, 35, 3, 0, 8, 42, 7),
        shadow(0, 11, 14, -7, 0, 23, 36, 3, 0, 9, 44, 8),
        shadow(0, 11, 15, -7, 0, 24, 38, 3, 0, 9, 46, 8),
    ] as Shadows;
};

export const createCustomShadows = (
    channel: string,
    colors: { primary: string; secondary: string }
): CustomShadows => {
    const tint = (opacity: number) => `rgba(${channel}, ${opacity})`;

    return {
        z1: `0 1px 2px 0 ${tint(0.16)}`,
        z4: `0 4px 8px 0 ${tint(0.16)}`,
        z8: `0 8px 16px 0 ${tint(0.16)}`,
        z12: `0 12px 24px -4px ${tint(0.16)}`,
        z16: `0 16px 32px -4px ${tint(0.16)}`,
        z20: `0 20px 40px -4px ${tint(0.16)}`,
        z24: `0 24px 48px 0 ${tint(0.16)}`,
        card: `0 0 2px 0 ${tint(0.2)}, 0 12px 24px -4px ${tint(0.12)}`,
        dropdown: `0 0 2px 0 ${tint(0.24)}, -20px 20px 40px -4px ${tint(0.24)}`,
        dialog: `-40px 40px 80px -8px rgba(0, 0, 0, 0.24)`,
        primary: `0 8px 16px 0 ${alpha(colors.primary, 0.24)}`,
        secondary: `0 8px 16px 0 ${alpha(colors.secondary, 0.24)}`,
    };
};
