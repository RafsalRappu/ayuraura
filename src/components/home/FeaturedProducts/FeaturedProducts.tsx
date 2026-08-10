import { Grid } from "@mui/material";

import { products } from "../../../data/products";

import ProductCard from "../../products/ProductCard/ProductCard";

import SectionTitle from "../../common/SectionTitle";

import PageContainer from "../../common/PageContainer";

const FeaturedProducts = () => {
    return (
        <PageContainer>
            <SectionTitle
                title="Featured Products"
                subtitle="Crafted with authentic Ayurvedic ingredients for everyday skincare."
            />

            <Grid container spacing={4}>
                {products
                    .filter((p) => p.featured)
                    .map((product) => (
                        <Grid
                            key={product.id}
                            size={{ xs: 12, md: 4 }}
                        >
                            <ProductCard product={product} />
                        </Grid>
                    ))}
            </Grid>
        </PageContainer>
    );
};

export default FeaturedProducts;