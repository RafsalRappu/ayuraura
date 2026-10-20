import { Box, Card, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import CustomButton from "../../common/CustomButton";
import StarRating from "../../common/StarRating";
import ProductMedia from "../ProductMedia";
import type { Product } from "../../../types/product";
import { useCart } from "../../../data/useCart";
import { CSS_EASE_OUT } from "../../../theme/motion";
import { productCardSx, productMediaWellSx } from "./productCardStyles";

interface Props {
    product: Product;
}

const Label = ({ dot, children }: { dot: string; children: string }) => (
    <Box
        sx={(theme) => ({
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.25,
            py: 0.5,
            borderRadius: 999,
            fontSize: "0.75rem",
            fontWeight: 700,
            lineHeight: 1.4,
            color: "text.primary",
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: "blur(6px)",
            boxShadow: theme.customShadows.z1,
        })}
    >
        <Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: dot }} />
        {children}
    </Box>
);

const ProductCard = ({ product }: Props) => {
    const navigate = useNavigate();
    const { addItem } = useCart();

    const badge = product.bestseller ? "Bestseller" : product.newArrival ? "New" : null;

    return (
        <Card
            sx={(theme) => ({
                ...productCardSx(theme),
                transition: `transform .5s ${CSS_EASE_OUT}, box-shadow .5s ${CSS_EASE_OUT}, border-color .5s`,
                "&:hover": {
                    transform: "translateY(-6px)",
                    boxShadow: theme.customShadows.z20,
                    borderColor: "transparent",
                },
                "&:hover [data-media-hover]": { transform: "scale(1.07)" },
                "&:hover .quick-add, &:focus-within .quick-add": { opacity: 1, transform: "none" },
            })}
        >
            <Box sx={productMediaWellSx}>
                <ProductMedia product={product} />

                {badge && (
                    <Box sx={{ position: "absolute", top: 12, left: 12, zIndex: 2 }}>
                        <Label dot={badge === "Bestseller" ? "secondary.main" : "primary.main"}>{badge}</Label>
                    </Box>
                )}

                {!product.inStock && (
                    <Box sx={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
                        <Label dot="text.disabled">Out of stock</Label>
                    </Box>
                )}

                <Box
                    className="quick-add"
                    sx={{
                        position: "absolute",
                        right: 12,
                        bottom: 12,
                        zIndex: 2,
                        opacity: { xs: 1, md: 0 },
                        transform: { md: "translateY(10px)" },
                        transition: `opacity .35s, transform .5s ${CSS_EASE_OUT}`,
                        "@media (hover: none)": { opacity: 1, transform: "none" },
                    }}
                >
                    <Tooltip title={product.inStock ? "Add to cart" : "Out of stock"}>
                        <motion.span
                            whileTap={product.inStock ? { scale: 0.85 } : undefined}
                            style={{ display: "inline-block" }}
                        >
                            <IconButton
                                color="primary"
                                disabled={!product.inStock}
                                aria-label={`Add ${product.name} to cart`}
                                onClick={() =>
                                    addItem({
                                        slug: product.slug,
                                        name: product.name,
                                        price: product.price,
                                        image: product.image,
                                    })
                                }
                                sx={(theme) => ({
                                    width: 44,
                                    height: 44,
                                    bgcolor: "primary.main",
                                    color: "primary.contrastText",
                                    boxShadow: theme.customShadows.primary,
                                    "&:hover": { bgcolor: "primary.dark" },
                                    "&.Mui-disabled": {
                                        bgcolor: alpha(theme.palette.grey[500], 0.24),
                                        color: "text.disabled",
                                        boxShadow: "none",
                                    },
                                })}
                            >
                                <AddShoppingCartIcon fontSize="small" />
                            </IconButton>
                        </motion.span>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ px: 1.5, pt: 2, pb: 1, display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1, mb: 1 }}>
                    <Typography variant="overline" noWrap sx={{ color: "text.secondary", fontSize: "0.6875rem", lineHeight: 1.6 }}>
                        {product.category}
                    </Typography>

                    {product.rating && <StarRating value={product.rating} reviewCount={product.reviewCount} size={14} />}
                </Stack>

                <Typography variant="h6" component="h3" sx={{ fontSize: "1.125rem", mb: 0.75 }}>
                    {product.name}
                </Typography>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        mb: 2.5,
                        flexGrow: 1,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                    }}
                >
                    {product.shortDescription}
                </Typography>

                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    <Typography component="span" sx={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.01em" }}>
                        ₹{product.price}
                    </Typography>

                    <CustomButton
                        variant="contained"
                        endIcon={<ArrowForwardRoundedIcon />}
                        onClick={() => navigate(`/products/${product.slug}`)}
                        sx={{
                            px: 2.25,
                            py: 0.9,
                            "& .MuiButton-endIcon": { transition: `transform .4s ${CSS_EASE_OUT}` },
                            "&:hover .MuiButton-endIcon": { transform: "translateX(3px)" },
                        }}
                    >
                        View Details
                    </CustomButton>
                </Stack>
            </Box>
        </Card>
    );
};

export default ProductCard;
