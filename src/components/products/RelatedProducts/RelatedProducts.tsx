import { Box, Grid } from "@mui/material";

import SectionTitle from "../../common/SectionTitle";
import ProductCard from "../ProductCard/ProductCard";
import type { Product } from "../../../types/product";

interface RelatedProductsProps {
    products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
    if (products.length === 0) return null;

    return (
        <Box component="section" sx={{ mt: { xs: 8, md: 12 } }}>
            <SectionTitle title="You May Also Like" align="left" />

            <Grid container spacing={4}>
                {products.map((product) => (
                    <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <ProductCard product={product} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default RelatedProducts;
