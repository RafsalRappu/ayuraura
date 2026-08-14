import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Alert,
    Box,
    Drawer,
    Grid,
    IconButton,
    InputAdornment,
    TextField,
    Typography,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";

import PageContainer from "../../components/common/PageContainer";
import ProductsSidebar from "../../components/products/ProductsSidebar/ProductsSidebar";
import ProductCard from "../../components/products/ProductCard/ProductCard";
import ProductCardSkeleton from "../../components/products/ProductCardSkeleton";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";

import { useProducts } from "../../data/useProducts";
import type { Product } from "../../types/product";

const Products = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { products, status } = useProducts();

    const category = searchParams.get("category") ?? "all";
    const tag = searchParams.get("tag") ?? "all";
    const query = searchParams.get("q") ?? "";

    const setQuery = (value: string) => {
        setSearchParams((params) => {
            if (value.trim() === "") params.delete("q");
            else params.set("q", value);
            return params;
        });
    };

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
        [products]
    );

    const filteredProducts = useMemo(() => {
        const q = query.trim().toLowerCase();

        return products.filter((product) => {
            const matchesCategory = category === "all" || product.category === category;
            const matchesTag =
                tag === "all" ||
                (tag === "featured" && product.featured) ||
                (tag === "bestseller" && product.bestseller) ||
                (tag === "newArrival" && product.newArrival);
            const matchesQuery =
                q === "" ||
                product.name.toLowerCase().includes(q) ||
                product.shortDescription.toLowerCase().includes(q) ||
                product.description.toLowerCase().includes(q) ||
                product.ingredients.some((ingredient) => ingredient.toLowerCase().includes(q));

            return matchesCategory && matchesTag && matchesQuery;
        });
    }, [products, category, tag, query]);

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

                <TextField
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products…"
                    size="small"
                    sx={{ minWidth: { xs: "100%", sm: 260 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

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
                    {status === "fallback" && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Showing our saved catalogue — we couldn't reach the live product list just now.
                        </Alert>
                    )}

                    <Grid container spacing={4}>
                        {status === "loading"
                            ? Array.from({ length: 6 }, (_, index) => (
                                  <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                                      <ProductCardSkeleton />
                                  </Grid>
                              ))
                            : filteredProducts.map((product: Product) => (
                                  <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                      <ProductCard product={product} />
                                  </Grid>
                              ))}
                    </Grid>

                    {status !== "loading" && filteredProducts.length === 0 && (
                        <Typography sx={{ textAlign: "center", color: "text.secondary", py: 8 }}>
                            {query.trim()
                                ? `No products match "${query.trim()}" — try a different search or filter.`
                                : "No products match this filter yet — try another category."}
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
