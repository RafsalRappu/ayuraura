import { useMemo } from "react";
import { Grid } from "@mui/material";

import { useProducts } from "../../../data/useProducts";

import ProductCard from "../../products/ProductCard/ProductCard";

import ProductCardSkeleton from "../../products/ProductCardSkeleton";

import SectionTitle from "../../common/SectionTitle";

import PageContainer from "../../common/PageContainer";

const FeaturedProducts = () => {
    const { products, status } = useProducts();

    const featured = useMemo(() => products.filter((p) => p.featured), [products]);

    return (
        <PageContainer>
            <SectionTitle
                title="Featured Products"
                subtitle="Crafted with authentic Ayurvedic ingredients for everyday skincare."
            />

            <Grid container spacing={4}>
                {status === "loading"
                    ? Array.from({ length: 3 }, (_, index) => (
                          <Grid key={index} size={{ xs: 12, md: 4 }}>
                              <ProductCardSkeleton />
                          </Grid>
                      ))
                    : featured.map((product) => (
                          <Grid key={product.id} size={{ xs: 12, md: 4 }}>
                              <ProductCard product={product} />
                          </Grid>
                      ))}
            </Grid>
        </PageContainer>
    );
};

export default FeaturedProducts;