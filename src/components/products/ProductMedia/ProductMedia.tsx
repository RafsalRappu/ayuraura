import { Box } from "@mui/material";
import ColorizeIcon from "@mui/icons-material/Colorize";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GrassIcon from "@mui/icons-material/Grass";
import SpaIcon from "@mui/icons-material/Spa";

import type { Product } from "../../../types/product";
import { CSS_EASE_OUT } from "../../../theme/motion";

// Fixed per product type (not per theme preset) so a product keeps its look.
const ICON_VARIANTS = {
    lip: { Icon: ColorizeIcon, gradient: "linear-gradient(140deg, #FFF0F3 0%, #FAD4DC 100%)", color: "#C04A64" },
    face: { Icon: WaterDropIcon, gradient: "linear-gradient(140deg, #EAFBF7 0%, #C6EDE4 100%)", color: "#11786C" },
    eye: { Icon: VisibilityIcon, gradient: "linear-gradient(140deg, #F2F0FF 0%, #D9D4F5 100%)", color: "#5146A3" },
    hair: { Icon: GrassIcon, gradient: "linear-gradient(140deg, #FFF7E6 0%, #F7DFAE 100%)", color: "#9A6A12" },
    body: { Icon: SpaIcon, gradient: "linear-gradient(140deg, #FFF3E9 0%, #F8D8BC 100%)", color: "#B0662B" },
} as const;

interface ProductMediaProps {
    product: Product;
    iconSize?: string;
    /** "contain" shows the whole product photo; "cover" fills the frame (thumbnails, tiles). */
    fit?: "contain" | "cover";
}

const ProductMedia = ({ product, iconSize = "4.5rem", fit = "contain" }: ProductMediaProps) => {
    if (product.image) {
        return (
            <Box
                component="img"
                src={product.image}
                alt={product.name}
                loading="lazy"
                data-media-hover
                sx={{
                    transition: `transform .7s ${CSS_EASE_OUT}`,
                    ...(fit === "cover"
                        ? { width: "100%", height: "100%", objectFit: "cover" }
                        : {
                              width: "72%",
                              height: "72%",
                              objectFit: "contain",
                              // Follows the visible pixels, so letterboxed photos still get a soft lift.
                              filter: "drop-shadow(0 18px 24px rgba(30, 42, 42, 0.14))",
                          }),
                }}
            />
        );
    }

    const variant = ICON_VARIANTS[product.icon];
    const Icon = variant.Icon;

    return (
        <Box
            data-media-hover
            role="img"
            aria-label={product.name}
            sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: variant.gradient,
                transition: `transform .7s ${CSS_EASE_OUT}`,
            }}
        >
            <Icon sx={{ fontSize: iconSize, color: variant.color, opacity: 0.85 }} />
        </Box>
    );
};

export default ProductMedia;
