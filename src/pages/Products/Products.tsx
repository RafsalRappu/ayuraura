import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    Drawer,
    Grid,
    InputAdornment,
    TextField,
    Typography,
    useTheme,
    useMediaQuery,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import SearchIcon from "@mui/icons-material/Search";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";

import PageContainer from "../../components/common/PageContainer";
import ProductsSidebar from "../../components/products/ProductsSidebar/ProductsSidebar";
import ProductCard from "../../components/products/ProductCard/ProductCard";
import ProductCardSkeleton from "../../components/products/ProductCardSkeleton";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";
import Reveal from "../../components/common/Reveal";

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

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", md: "flex-end" },
                    flexDirection: { xs: "column", md: "row" },
                    gap: 2,
                    mb: { xs: 4, md: 5 },
                }}
            >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <SectionTitle
                        component="h1"
                        align="left"
                        gutterBottom={false}
                        title="Shop Our Products"
                        subtitle="Browse our Ayurvedic skincare range for naturally glowing skin."
                    />
                </Box>

                <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <TextField
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search products…"
                        sx={{ flex: 1, minWidth: { sm: 300 } }}
                        slotProps={{
                            input: {
                                sx: { borderRadius: 999, pl: 0.75 },
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon fontSize="small" />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />

                    {isMobile && (
                        <Button
                            variant="outlined"
                            onClick={() => setSidebarOpen(true)}
                            startIcon={<TuneRoundedIcon />}
                            sx={{ minHeight: 56, px: 2.5, flexShrink: 0 }}
                        >
                            Filters
                        </Button>
                    )}
                </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
                {!isMobile && (
                    <Card sx={{ width: 280, flexShrink: 0, position: "sticky", top: 92 }}>
                        <ProductsSidebar
                            categories={categories}
                            selectedCategory={category}
                            selectedTag={tag}
                            onCategoryChange={setCategory}
                            onTagChange={setTag}
                        />
                    </Card>
                )}

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {status === "fallback" && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            Showing our saved catalogue — we couldn't reach the live product list just now.
                        </Alert>
                    )}

                    {status !== "loading" && filteredProducts.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <Box component="strong" sx={{ color: "text.primary" }}>
                                {filteredProducts.length}
                            </Box>{" "}
                            product{filteredProducts.length === 1 ? "" : "s"}
                        </Typography>
                    )}

                    <Grid container spacing={3}>
                        {status === "loading"
                            ? Array.from({ length: 6 }, (_, index) => (
                                  <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
                                      <ProductCardSkeleton />
                                  </Grid>
                              ))
                            : filteredProducts.map((product: Product, index) => (
                                  <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                                      <Reveal delay={Math.min(index, 6) * 0.06}>
                                          <ProductCard product={product} />
                                      </Reveal>
                                  </Grid>
                              ))}
                    </Grid>

                    {status !== "loading" && filteredProducts.length === 0 && (
                        <Box sx={{ textAlign: "center", py: { xs: 8, md: 10 } }}>
                            <Box
                                sx={{
                                    width: 72,
                                    height: 72,
                                    mx: "auto",
                                    mb: 2.5,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    color: "primary.main",
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                }}
                            >
                                <SearchOffRoundedIcon sx={{ fontSize: 34 }} />
                            </Box>

                            <Typography sx={{ color: "text.secondary", maxWidth: 420, mx: "auto" }}>
                                {query.trim()
                                    ? `No products match "${query.trim()}" — try a different search or filter.`
                                    : "No products match this filter yet — try another category."}
                            </Typography>
                        </Box>
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
