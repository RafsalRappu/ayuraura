// src/theme/components.ts
// Component-level look: soft tonal chips, pill buttons in the shop, hairline
// inputs with a focus halo, dashed table rules and blurred backdrops.

import { alpha } from "@mui/material/styles";
import type { Components, Theme } from "@mui/material/styles";

export type ThemeVariant = "store" | "admin";

type PaletteKey = "primary" | "secondary" | "info" | "success" | "warning" | "error";

const PALETTE_KEYS: readonly PaletteKey[] = ["primary", "secondary", "info", "success", "warning", "error"];

const isPaletteKey = (value: unknown): value is PaletteKey => PALETTE_KEYS.includes(value as PaletteKey);

/** Text color on a soft tint of `key` — `dark`, or `darker` when `main` is light enough to need dark text. */
const softText = (theme: Theme, key: PaletteKey) => {
    const color = theme.palette[key];
    return color.contrastText.toUpperCase() === "#FFFFFF" ? color.dark : color.darker;
};

export const createComponents = (variant: ThemeVariant): Components<Omit<Theme, "components">> => {
    const isStore = variant === "store";
    const buttonRadius = isStore ? 999 : 10;
    const inputRadius = isStore ? 14 : 10;

    return {
        MuiCssBaseline: {
            styleOverrides: (theme: Theme) => ({
                html: { scrollBehavior: "smooth" },
                body: { backgroundColor: theme.palette.background.default },
                "::selection": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.18),
                    color: theme.palette.text.primary,
                },
                "*": { scrollbarWidth: "thin", scrollbarColor: `${alpha(theme.palette.grey[500], 0.45)} transparent` },
                "@media (prefers-reduced-motion: reduce)": {
                    html: { scrollBehavior: "auto" },
                    "*, *::before, *::after": {
                        animationDuration: "0.01ms !important",
                        animationIterationCount: "1 !important",
                        transitionDuration: "0.01ms !important",
                    },
                },
            }),
        },

        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: buttonRadius,
                    fontWeight: 700,
                    transition: theme.transitions.create(
                        ["background-color", "box-shadow", "border-color", "color", "transform"],
                        { duration: theme.transitions.duration.short }
                    ),
                    "&:active": { transform: "scale(0.98)" },
                }),
                sizeSmall: { minHeight: 32, padding: "4px 12px", fontSize: "0.8125rem" },
                sizeMedium: { minHeight: 40, padding: "7px 18px" },
                sizeLarge: { minHeight: 50, padding: "11px 26px", fontSize: "0.9375rem" },
                contained: ({ theme, ownerState }) => {
                    if (!isPaletteKey(ownerState.color)) return {};
                    const color = theme.palette[ownerState.color];
                    return {
                        "&:hover": {
                            backgroundColor: color.dark,
                            boxShadow: `0 8px 20px -6px ${alpha(color.main, 0.55)}`,
                        },
                    };
                },
                outlined: ({ theme, ownerState }) => {
                    // Primary/inherit outlines read as a quiet "ghost" next to the
                    // filled primary action; other colors keep a tinted outline.
                    if (ownerState.color === "primary" || ownerState.color === "inherit") {
                        return {
                            ...(ownerState.color === "primary" && { color: theme.palette.text.primary }),
                            borderColor: alpha(theme.palette.grey[500], 0.32),
                            "&:hover": {
                                borderColor: theme.palette.text.primary,
                                backgroundColor: theme.palette.action.hover,
                            },
                        };
                    }
                    if (!isPaletteKey(ownerState.color)) return {};
                    const color = theme.palette[ownerState.color];
                    return {
                        borderColor: alpha(color.main, 0.48),
                        "&:hover": { borderColor: color.main, backgroundColor: alpha(color.main, 0.08) },
                    };
                },
            },
        },

        MuiIconButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    transition: theme.transitions.create(["background-color", "color", "transform"], {
                        duration: theme.transitions.duration.shorter,
                    }),
                    "&:active": { transform: "scale(0.94)" },
                }),
            },
        },

        MuiPaper: {
            styleOverrides: {
                root: { backgroundImage: "none" },
                rounded: { borderRadius: 12 },
                outlined: ({ theme }) => ({
                    borderColor: alpha(theme.palette.grey[500], isStore ? 0.16 : 0.12),
                    // The admin follows the dashboard convention: surfaces lift
                    // off the page with a soft shadow rather than a hard outline.
                    ...(!isStore && { boxShadow: theme.customShadows.card }),
                }),
            },
        },

        MuiCard: {
            styleOverrides: {
                root: ({ theme, ownerState }) => {
                    const outlined = (ownerState as { variant?: string }).variant === "outlined";
                    return {
                        position: "relative",
                        zIndex: 0,
                        borderRadius: isStore ? 20 : 16,
                        boxShadow: outlined && isStore ? "none" : theme.customShadows.card,
                    };
                },
            },
        },

        MuiPopover: {
            styleOverrides: {
                paper: ({ theme }) => ({
                    borderRadius: 14,
                    boxShadow: theme.customShadows.dropdown,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                }),
            },
        },

        MuiMenu: {
            styleOverrides: {
                list: { padding: 6 },
            },
        },

        MuiMenuItem: {
            styleOverrides: {
                root: ({ theme }) => ({
                    ...theme.typography.body2,
                    borderRadius: 8,
                    padding: "8px 10px",
                    "&:not(:last-of-type)": { marginBottom: 2 },
                    "&.Mui-selected": {
                        fontWeight: 600,
                        backgroundColor: theme.palette.action.selected,
                        "&:hover": { backgroundColor: theme.palette.action.focus },
                    },
                }),
            },
        },

        MuiTooltip: {
            defaultProps: { arrow: true },
            styleOverrides: {
                tooltip: ({ theme }) => ({
                    backgroundColor: theme.palette.grey[800],
                    borderRadius: 8,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "6px 10px",
                }),
                arrow: ({ theme }) => ({ color: theme.palette.grey[800] }),
            },
        },

        MuiDialog: {
            styleOverrides: {
                paper: ({ theme }) => ({ borderRadius: 20, boxShadow: theme.customShadows.dialog }),
                paperFullScreen: { borderRadius: 0 },
            },
        },

        MuiDialogTitle: {
            styleOverrides: {
                root: ({ theme }) => ({ ...theme.typography.h6, padding: "24px 24px 16px" }),
            },
        },

        MuiDialogActions: {
            styleOverrides: {
                root: { padding: "16px 24px 24px", gap: 12, "& > :not(style) ~ :not(style)": { marginLeft: 0 } },
            },
        },

        MuiBackdrop: {
            styleOverrides: {
                root: ({ theme, ownerState }) => ({
                    ...(!ownerState.invisible && {
                        backgroundColor: alpha(theme.palette.grey[900], 0.48),
                        backdropFilter: "blur(3px)",
                    }),
                }),
            },
        },

        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme, ownerState }) => ({
                    ...(ownerState.variant === "temporary" && { boxShadow: theme.customShadows.dropdown }),
                }),
            },
        },

        MuiOutlinedInput: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: inputRadius,
                    backgroundColor: theme.palette.background.paper,
                    transition: theme.transitions.create(["box-shadow", "background-color"], { duration: 200 }),
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: alpha(theme.palette.grey[500], 0.28),
                        transition: theme.transitions.create("border-color", { duration: 200 }),
                    },
                    "&:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused) .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.grey[500],
                    },
                    "&.Mui-focused:not(.Mui-error)": {
                        boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.12)}`,
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 1.5 },
                }),
            },
        },

        MuiInputBase: {
            styleOverrides: {
                input: ({ theme }) => ({
                    "&::placeholder": { opacity: 1, color: theme.palette.text.disabled },
                }),
            },
        },

        MuiInputAdornment: {
            styleOverrides: {
                root: ({ theme }) => ({ color: theme.palette.text.disabled }),
            },
        },

        MuiFormControlLabel: {
            styleOverrides: {
                label: ({ theme }) => ({ ...theme.typography.body2, fontWeight: 500 }),
            },
        },

        MuiChip: {
            styleOverrides: {
                root: ({ theme, ownerState }) => {
                    const base = { borderRadius: 8, fontWeight: 600 };
                    const outlined = ownerState.variant === "outlined";
                    const grey = theme.palette.grey[500];

                    if (!isPaletteKey(ownerState.color)) {
                        return outlined
                            ? { ...base, borderColor: alpha(grey, 0.32) }
                            : {
                                  ...base,
                                  color: theme.palette.text.primary,
                                  backgroundColor: alpha(grey, 0.12),
                                  ...(ownerState.clickable && { "&:hover": { backgroundColor: alpha(grey, 0.24) } }),
                              };
                    }

                    const palette = theme.palette[ownerState.color];
                    const text = softText(theme, ownerState.color);

                    if (outlined) return { ...base, color: text, borderColor: alpha(palette.main, 0.48) };

                    // Filled colored chips become soft "labels": tinted, never solid.
                    return {
                        ...base,
                        color: text,
                        backgroundColor: alpha(palette.main, 0.16),
                        "& .MuiChip-icon": { color: "inherit" },
                        "& .MuiChip-deleteIcon": { color: alpha(text, 0.48), "&:hover": { color: text } },
                        "&.Mui-focusVisible": { backgroundColor: alpha(palette.main, 0.32) },
                        ...(ownerState.clickable && { "&:hover": { backgroundColor: alpha(palette.main, 0.28) } }),
                    };
                },
                sizeSmall: { height: 24, fontSize: "0.75rem" },
            },
        },

        MuiAlert: {
            styleOverrides: {
                root: { borderRadius: 12 },
            },
        },

        MuiTableHead: {
            styleOverrides: {
                root: ({ theme }) => ({
                    "& .MuiTableCell-head": {
                        backgroundColor: theme.palette.background.neutral,
                        color: theme.palette.text.secondary,
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        borderBottom: "none",
                        whiteSpace: "nowrap",
                    },
                }),
            },
        },

        MuiTableCell: {
            styleOverrides: {
                root: ({ theme }) => ({ borderBottom: `1px dashed ${alpha(theme.palette.grey[500], 0.2)}` }),
                stickyHeader: ({ theme }) => ({ backgroundColor: theme.palette.background.neutral }),
            },
        },

        MuiTableRow: {
            styleOverrides: {
                root: ({ theme }) => ({
                    transition: theme.transitions.create("background-color", { duration: 150 }),
                    "&.MuiTableRow-hover:hover": { backgroundColor: alpha(theme.palette.grey[500], 0.06) },
                    "&:last-of-type > .MuiTableCell-body": { borderBottom: 0 },
                }),
            },
        },

        MuiTabs: {
            styleOverrides: {
                root: { minHeight: 44 },
                indicator: { height: 2, borderRadius: 2 },
            },
        },

        MuiTab: {
            styleOverrides: {
                root: ({ theme }) => ({
                    minWidth: 0,
                    minHeight: 44,
                    padding: "8px 2px",
                    fontWeight: 600,
                    fontSize: "0.9375rem",
                    "&:not(:last-of-type)": { marginRight: theme.spacing(3.5) },
                }),
            },
        },

        MuiLinearProgress: {
            styleOverrides: {
                root: { borderRadius: 999, overflow: "hidden" },
                bar: { borderRadius: 999 },
            },
        },

        MuiSkeleton: {
            defaultProps: { animation: "wave" },
            styleOverrides: {
                root: ({ theme }) => ({ backgroundColor: alpha(theme.palette.grey[500], 0.12) }),
                rounded: { borderRadius: 12 },
            },
        },

        MuiBadge: {
            styleOverrides: {
                badge: { fontWeight: 700 },
            },
        },

        MuiAvatar: {
            styleOverrides: {
                root: { fontWeight: 600 },
                rounded: { borderRadius: 12 },
            },
        },

        MuiToggleButtonGroup: {
            styleOverrides: {
                root: ({ theme }) => ({
                    gap: 4,
                    padding: 4,
                    flexWrap: "wrap",
                    borderRadius: 14,
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                }),
                grouped: {
                    border: "0 !important",
                    borderRadius: "10px !important",
                    margin: "0 !important",
                },
            },
        },

        MuiToggleButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    textTransform: "none",
                    fontWeight: 600,
                    padding: "6px 14px",
                    color: theme.palette.text.secondary,
                    transition: theme.transitions.create(["background-color", "color"], { duration: 200 }),
                    "&.Mui-selected": {
                        color: theme.palette.primary.dark,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        "&:hover": { backgroundColor: alpha(theme.palette.primary.main, 0.16) },
                    },
                }),
            },
        },

        MuiSnackbarContent: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 12,
                    backgroundColor: theme.palette.grey[800],
                    color: theme.palette.common.white,
                    fontWeight: 500,
                }),
            },
        },

        MuiListItemButton: {
            styleOverrides: {
                root: { borderRadius: 10 },
            },
        },

        MuiLink: {
            defaultProps: { underline: "hover" },
        },

        MuiBreadcrumbs: {
            styleOverrides: {
                separator: { marginLeft: 10, marginRight: 10 },
            },
        },

        MuiAppBar: {
            styleOverrides: {
                root: { backgroundImage: "none" },
            },
        },

        MuiRating: {
            styleOverrides: {
                iconEmpty: ({ theme }) => ({ color: alpha(theme.palette.grey[500], 0.48) }),
            },
        },
    };
};
