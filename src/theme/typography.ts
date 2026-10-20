// src/theme/typography.ts
// The storefront pairs an editorial serif for headings with a crisp sans for
// everything else; the admin uses the sans throughout, dashboard-style.

import type { TypographyVariantsOptions } from "@mui/material/styles";

export const serifFont = "'Cormorant Garamond', 'Times New Roman', serif";
export const sansFont = "'Public Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const shared: TypographyVariantsOptions = {
    fontFamily: sansFont,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,

    subtitle1: { fontWeight: 600, fontSize: "1rem", lineHeight: 1.5 },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem", lineHeight: 1.57 },
    body1: { fontSize: "1rem", lineHeight: 1.65 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
    caption: { fontSize: "0.75rem", lineHeight: 1.5 },
    overline: { fontWeight: 700, fontSize: "0.75rem", lineHeight: 1.5, letterSpacing: "0.12em", textTransform: "uppercase" },
    button: { fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.7, textTransform: "none", letterSpacing: 0 },
};

export const storeTypography: TypographyVariantsOptions = {
    ...shared,

    h1: {
        fontFamily: serifFont,
        fontWeight: 600,
        fontSize: "clamp(2.6rem, 1.6rem + 4vw, 5rem)",
        lineHeight: 1.04,
        letterSpacing: "-0.02em",
    },
    h2: {
        fontFamily: serifFont,
        fontWeight: 600,
        fontSize: "clamp(2.1rem, 1.5rem + 2.2vw, 3.25rem)",
        lineHeight: 1.1,
        letterSpacing: "-0.015em",
    },
    h3: {
        fontFamily: serifFont,
        fontWeight: 600,
        fontSize: "clamp(1.75rem, 1.35rem + 1.4vw, 2.5rem)",
        lineHeight: 1.15,
        letterSpacing: "-0.01em",
    },
    h4: {
        fontFamily: serifFont,
        fontWeight: 600,
        fontSize: "clamp(1.5rem, 1.25rem + 0.8vw, 2rem)",
        lineHeight: 1.2,
    },
    h5: { fontWeight: 700, fontSize: "1.25rem", lineHeight: 1.4, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.45 },
};

export const adminTypography: TypographyVariantsOptions = {
    ...shared,

    h1: { fontWeight: 800, fontSize: "2.5rem", lineHeight: 1.25, letterSpacing: "-0.02em" },
    h2: { fontWeight: 800, fontSize: "2rem", lineHeight: 1.3, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, fontSize: "1.75rem", lineHeight: 1.35 },
    h4: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.4 },
    // Page titles and stat values in the admin are h5.
    h5: { fontWeight: 700, fontSize: "1.5rem", lineHeight: 1.35, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700, fontSize: "1.0625rem", lineHeight: 1.5 },
};
