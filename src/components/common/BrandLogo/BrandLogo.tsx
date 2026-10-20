import { Box, Typography } from "@mui/material";
import SpaIcon from "@mui/icons-material/Spa";

import { siteConfig } from "../../../config/site";
import { serifFont } from "../../../theme/typography";

interface BrandMarkProps {
    size?: number;
}

/** The leaf in a gradient squircle — used alone where space is tight. */
export const BrandMark = ({ size = 38 }: BrandMarkProps) => (
    <Box
        aria-hidden
        sx={{
            width: size,
            height: size,
            flexShrink: 0,
            borderRadius: `${Math.round(size * 0.32)}px`,
            display: "grid",
            placeItems: "center",
            color: "primary.contrastText",
            background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 48%, ${theme.palette.primary.dark} 100%)`,
            boxShadow: (theme) => theme.customShadows.primary,
        }}
    >
        <SpaIcon sx={{ fontSize: size * 0.56 }} />
    </Box>
);

interface BrandLogoProps {
    tone?: "dark" | "light";
    size?: "md" | "lg";
}

const BrandLogo = ({ tone = "dark", size = "md" }: BrandLogoProps) => (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25 }}>
        <BrandMark size={size === "lg" ? 44 : 38} />
        <Typography
            component="span"
            sx={{
                fontFamily: serifFont,
                fontWeight: 700,
                fontSize: size === "lg" ? "2rem" : "1.75rem",
                lineHeight: 1,
                letterSpacing: "-0.01em",
                color: tone === "light" ? "common.white" : "text.primary",
            }}
        >
            {siteConfig.name}
        </Typography>
    </Box>
);

export default BrandLogo;
