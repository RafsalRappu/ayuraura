import { alpha } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";

/** Shared frame for the card and its loading skeleton, so nothing jumps when data lands. */
export const productCardSx = (theme: Theme) => ({
    height: "100%",
    display: "flex",
    flexDirection: "column" as const,
    p: 1,
    border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
    boxShadow: "none",
});

export const productMediaWellSx = {
    position: "relative",
    overflow: "hidden",
    borderRadius: 4,
    height: { xs: 240, sm: 250, lg: 270 },
    bgcolor: "background.neutral",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
} as const;
