import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import { useState } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import StarRating from "../../components/common/StarRating";
import SEO from "../../components/common/SEO";
import ProductMedia from "../../components/products/ProductMedia";
import RelatedProducts from "../../components/products/RelatedProducts";

import { useProducts } from "../../data/useProducts";
import { whatsappLink } from "../../config/site";
import { breadcrumbSchema, productSchema } from "../../utils/structuredData";

const ProductDetails = () => {
    const { slug } = useParams<{ slug: string }>();
    const [tab, setTab] = useState(0);
    const { status, getBySlug, getRelated } = useProducts();

    const product = slug ? getBySlug(slug) : undefined;

    // The catalogue arrives asynchronously — wait for it before deciding a
    // product does not exist, or every direct link would bounce to 404.
    if (!product) {
        if (status === "loading") {
            return (
                <PageContainer>
                    <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
                        <CircularProgress color="primary" />
                    </Box>
                </PageContainer>
            );
        }
        return <Navigate to="/404" replace />;
    }

    const relatedProducts = getRelated(product);

    const crumbs = [
        { label: "Home", path: "/" },
        { label: "Products", path: "/products" },
        { label: product.name, path: `/products/${product.slug}` },
    ];

    return (
        <PageContainer>
            <SEO
                title={product.name}
                description={product.shortDescription}
                path={`/products/${product.slug}`}
                image={product.image}
                type="product"
                jsonLd={[productSchema(product), breadcrumbSchema(crumbs)]}
            />

            <Breadcrumbs items={crumbs} />

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: { xs: 4, md: 8 },
                    mb: { xs: 8, md: 10 },
                }}
            >
                <Box
                    sx={{
                        width: { xs: "100%", md: "45%" },
                        position: "relative",
                        borderRadius: 6,
                        overflow: "hidden",
                        height: { xs: 340, md: 480 },
                    }}
                >
                    <ProductMedia product={product} iconSize="7rem" />

                    {(product.bestseller || product.newArrival) && (
                        <Chip
                            label={product.bestseller ? "Bestseller" : "New Arrival"}
                            color={product.bestseller ? "secondary" : "success"}
                            sx={{ position: "absolute", top: 20, left: 20 }}
                        />
                    )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 280 }}>
                    <Chip label={product.category} color="success" variant="outlined" sx={{ mb: 2 }} />

                    <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "2.4rem", md: "3rem" }, mb: 1 }}>
                        {product.name}
                    </Typography>

                    {product.rating && (
                        <Box sx={{ mb: 2 }}>
                            <StarRating value={product.rating} reviewCount={product.reviewCount} />
                        </Box>
                    )}

                    <Typography variant="h4" color="primary" sx={{ mb: 3, fontWeight: 700 }}>
                        ₹{product.price}
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 4, fontSize: "1.05rem" }}>
                        {product.description}
                    </Typography>

                    {product.benefits.length > 0 && (
                        <List dense sx={{ mb: 3 }}>
                            {product.benefits.map((benefit) => (
                                <ListItem key={benefit} disableGutters sx={{ py: 0.5 }}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <CheckCircleOutlineIcon color="success" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={benefit} />
                                </ListItem>
                            ))}
                        </List>
                    )}

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                        <CustomButton
                            variant="contained"
                            size="large"
                            startIcon={<WhatsAppIcon />}
                            component="a"
                            href={whatsappLink(`Hi AyuAura, I'd like to order the ${product.name} (₹${product.price}).`)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Order via WhatsApp
                        </CustomButton>

                        <CustomButton variant="outlined" size="large" component={RouterLink} to="/products">
                            Continue Browsing
                        </CustomButton>
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                        Free consultation on skin type &amp; usage included with every order.
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box sx={{ mb: { xs: 8, md: 10 } }}>
                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{ mb: 3 }}
                    textColor="primary"
                    indicatorColor="primary"
                >
                    <Tab label="Ingredients" />
                    {product.howToUse && <Tab label="How to Use" />}
                </Tabs>

                {tab === 0 && (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                        {product.ingredients.map((ingredient) => (
                            <Chip key={ingredient} label={ingredient} variant="outlined" />
                        ))}
                    </Stack>
                )}

                {tab === 1 && product.howToUse && (
                    <Typography color="text.secondary">{product.howToUse}</Typography>
                )}
            </Box>

            <RelatedProducts products={relatedProducts} />
        </PageContainer>
    );
};

export default ProductDetails;
