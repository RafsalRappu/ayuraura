import { Box, Grid } from "@mui/material";

import SectionTitle from "../../common/SectionTitle";
import Reveal from "../../common/Reveal";
import ProductCard from "../ProductCard/ProductCard";
import type { Product } from "../../../types/product";

interface RelatedProductsProps {
    products: Product[];
}

const RelatedProducts = ({ products }: RelatedProductsProps) => {
    if (products.length === 0) return null;

    return (
        <Box component="section">
            <SectionTitle title="You May Also Like" align="left" />

            <Grid container spacing={3}>
                {products.map((product, index) => (
                    <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Reveal delay={Math.min(index, 6) * 0.08}>
                            <ProductCard product={product} />
                        </Reveal>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default RelatedProducts;
