import { Card, CardContent, Typography, Chip, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

import CustomButton from "../../common/CustomButton";
import StarRating from "../../common/StarRating";
import ProductMedia from "../ProductMedia";
import type { Product } from "../../../types/product";

import styles from "./ProductCard.module.css";

interface Props {
    product: Product;
}

const ProductCard = ({ product }: Props) => {
    const navigate = useNavigate();

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

                <CustomButton
                    variant="contained"
                    fullWidth
                    onClick={() => navigate(`/products/${product.slug}`)}
                >
                    View Details
                </CustomButton>
            </CardContent>
        </Card>
    );
};

export default ProductCard;
