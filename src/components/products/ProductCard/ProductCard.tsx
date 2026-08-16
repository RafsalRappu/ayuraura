import { Card, CardContent, Typography, Chip, Stack, IconButton, Tooltip } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";

import CustomButton from "../../common/CustomButton";
import StarRating from "../../common/StarRating";
import ProductMedia from "../ProductMedia";
import type { Product } from "../../../types/product";
import { useCart } from "../../../data/useCart";

import styles from "./ProductCard.module.css";

interface Props {
    product: Product;
}

const ProductCard = ({ product }: Props) => {
    const navigate = useNavigate();
    const { addItem } = useCart();

    const badge = product.bestseller ? "Bestseller" : product.newArrival ? "New" : null;

    return (
        <Card className={styles.card} sx={{ height: "100%" }}>
            <div className={styles.imageContainer}>
                <ProductMedia product={product} />

                {badge && (
                    <Chip
                        className={styles.badge}
                        label={badge}
                        color={badge === "Bestseller" ? "secondary" : "success"}
                        size="small"
                    />
                )}

                {!product.inStock && (
                    <Chip className={styles.stockBadge} label="Out of stock" size="small" />
                )}
            </div>

            <CardContent>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                    <Chip label={product.category} color="success" size="small" variant="outlined" />

                    <Typography variant="h6" color="primary" component="span">
                        ₹{product.price}
                    </Typography>
                </Stack>

                <Typography variant="h5" gutterBottom component="h3" sx={{ fontSize: "1.4rem" }}>
                    {product.name}
                </Typography>

                {product.rating && (
                    <StarRating value={product.rating} reviewCount={product.reviewCount} size={16} />
                )}

                <Typography color="text.secondary" sx={{ my: 2 }}>
                    {product.shortDescription}
                </Typography>

                <Stack direction="row" spacing={1}>
                    <CustomButton
                        variant="contained"
                        fullWidth
                        onClick={() => navigate(`/products/${product.slug}`)}
                    >
                        View Details
                    </CustomButton>

                    <Tooltip title={product.inStock ? "Add to cart" : "Out of stock"}>
                        <motion.span
                            whileTap={product.inStock ? { scale: 0.8 } : undefined}
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
                                sx={{ border: "1px solid", borderColor: "divider" }}
                            >
                                <AddShoppingCartIcon fontSize="small" />
                            </IconButton>
                        </motion.span>
                    </Tooltip>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ProductCard;
