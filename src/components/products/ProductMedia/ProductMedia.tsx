import { Box } from "@mui/material";
import ColorizeIcon from "@mui/icons-material/Colorize";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GrassIcon from "@mui/icons-material/Grass";
import SpaIcon from "@mui/icons-material/Spa";

import type { Product } from "../../../types/product";

const ICON_VARIANTS = {
    lip: { Icon: ColorizeIcon, gradient: "linear-gradient(135deg, #FCEEF0, #F3CDD3)", color: "#B85763" },
    face: { Icon: WaterDropIcon, gradient: "linear-gradient(135deg, #EEF5EC, #D3E6D5)", color: "#355E3B" },
    eye: { Icon: VisibilityIcon, gradient: "linear-gradient(135deg, #EFEDF6, #D8D4E9)", color: "#4A4468" },
    hair: { Icon: GrassIcon, gradient: "linear-gradient(135deg, #FBF1E1, #EFD8AC)", color: "#8A6321" },
    body: { Icon: SpaIcon, gradient: "linear-gradient(135deg, #FDF1E4, #F1D6B4)", color: "#B38B59" },
} as const;

interface ProductMediaProps {
    product: Product;
    iconSize?: string;
}

const ProductMedia = ({ product, iconSize = "4.5rem" }: ProductMediaProps) => {
    if (product.image) {
        return (
            <Box
                component="img"
                src={product.image}
                alt={product.name}
                loading="lazy"
                data-media-hover
                sx={{
                    width: "70%",
                    height: "70%",
                    objectFit: "contain",
                    transition: "transform .5s",
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
                transition: "transform .5s",
            }}
        >
            <Icon sx={{ fontSize: iconSize, color: variant.color, opacity: 0.85 }} />
        </Box>
    );
};

export default ProductMedia;
