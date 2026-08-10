import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Drawer, Grid, IconButton, Typography, useTheme, useMediaQuery } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import PageContainer from "../../components/common/PageContainer";
import ProductsSidebar from "../../components/products/ProductsSidebar/ProductsSidebar";
import ProductCard from "../../components/products/ProductCard/ProductCard";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";

import { products } from "../../data/products";
import type { Product } from "../../types/product";

const Products = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    const category = searchParams.get("category") ?? "all";
    const tag = searchParams.get("tag") ?? "all";

    const setCategory = (value: string) => {
        setSearchParams((params) => {
            if (value === "all") params.delete("category");
            else params.set("category", value);
            return params;
        });
    };

    const setTag = (value: string) => {
        setSearchParams((params) => {
            if (value === "all") params.delete("tag");
            else params.set("tag", value);
            return params;
        });
    };

    const categories = useMemo(
        () => Array.from(new Set(products.map((product) => product.category))),
        []
    );

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesCategory = category === "all" || product.category === category;
            const matchesTag =
                tag === "all" ||
                (tag === "featured" && product.featured) ||
                (tag === "bestseller" && product.bestseller) ||
                (tag === "newArrival" && product.newArrival);

            return matchesCategory && matchesTag;
        });
    }, [category, tag]);

    return (
        <PageContainer>
            <SEO
                title="Shop Ayurvedic Skincare"
                description="Browse AyuAura's handcrafted Ayurvedic skincare range — herbal lip balms, face oils, kajal, hair oils and body butters made with traditional, chemical-free ingredients."
                path="/products"
            />

            <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Products", path: "/products" }]} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <SectionTitle
                        component="h1"
                        align="left"
                        title="Shop Our Products"
                        subtitle="Browse our Ayurvedic skincare range for naturally glowing skin."
                    />
                </Box>

                {isMobile && (
                    <IconButton onClick={() => setSidebarOpen(true)}>
                        <MenuIcon />
                    </IconButton>
                )}
            </Box>

            <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start", flexWrap: "wrap" }}>
                {!isMobile && (
                    <Box sx={{ width: 280, flexShrink: 0 }}>
                        <ProductsSidebar
                            categories={categories}
                            selectedCategory={category}
                            selectedTag={tag}
                            onCategoryChange={setCategory}
                            onTagChange={setTag}
                        />
                    </Box>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Grid container spacing={4}>
                        {filteredProducts.map((product: Product) => (
                            <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <ProductCard product={product} />
                            </Grid>
                        ))}
                    </Grid>

                    {filteredProducts.length === 0 && (
                        <Typography sx={{ textAlign: "center", color: "text.secondary", py: 8 }}>
                            No products match this filter yet — try another category.
                        </Typography>
                    )}
                </Box>
            </Box>

            <Drawer
                anchor="left"
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            >
                <ProductsSidebar
                    categories={categories}
                    selectedCategory={category}
                    selectedTag={tag}
                    onCategoryChange={setCategory}
                    onTagChange={setTag}
                    onClose={() => setSidebarOpen(false)}
                />
            </Drawer>
        </PageContainer>
    );
};

export default Products;
