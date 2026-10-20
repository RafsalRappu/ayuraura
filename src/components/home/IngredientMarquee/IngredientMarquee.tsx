import { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/material/styles";
import SpaIcon from "@mui/icons-material/Spa";

import { useProducts } from "../../../data/useProducts";
import { serifFont } from "../../../theme/typography";

const scroll = keyframes`
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
`;

/**
 * An endless, slow ribbon of the herbs and oils actually used across the
 * catalogue. Purely decorative (the same names appear on each product page),
 * so it is hidden from assistive tech and pauses on hover.
 */
const IngredientMarquee = () => {
    const { products } = useProducts();

    const ingredients = useMemo(
        () => Array.from(new Set(products.flatMap((product) => product.ingredients))).slice(0, 18),
        [products]
    );

    if (ingredients.length === 0) return null;

    // Two identical halves, so translating by -50% loops seamlessly.
    const track = [...ingredients, ...ingredients];

    return (
        <Box
            aria-hidden
            sx={{
                overflow: "hidden",
                py: { xs: 5, md: 7 },
                maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
                WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    width: "max-content",
                    animation: `${scroll} ${Math.max(30, ingredients.length * 3.2)}s linear infinite`,
                    "&:hover": { animationPlayState: "paused" },
                }}
            >
                {track.map((name, index) => (
                    <Box key={`${name}-${index}`} sx={{ display: "flex", alignItems: "center", gap: 2.5, px: 2.5 }}>
                        <SpaIcon sx={{ fontSize: 16, color: "primary.main", opacity: 0.55 }} />
                        <Typography
                            component="span"
                            sx={{
                                fontFamily: serifFont,
                                fontStyle: "italic",
                                fontWeight: 500,
                                fontSize: { xs: "1.5rem", md: "2rem" },
                                color: "text.secondary",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {name}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default IngredientMarquee;
