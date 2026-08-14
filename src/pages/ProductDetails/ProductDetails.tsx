import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Chip,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Rating,
    Stack,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import StarRating from "../../components/common/StarRating";
import SEO from "../../components/common/SEO";
import QuantityStepper from "../../components/common/QuantityStepper";
import ProductMedia from "../../components/products/ProductMedia";
import RelatedProducts from "../../components/products/RelatedProducts";

import { useProducts } from "../../data/useProducts";
import { useCart } from "../../data/useCart";
import { errorMessage } from "../../api/client";
import { fetchProductReviews, submitReview } from "../../api/reviews";
import type { Review, ReviewSummary } from "../../types/review";
import { whatsappLink } from "../../config/site";
import { breadcrumbSchema, productSchema } from "../../utils/structuredData";

type ReviewsState =
    | { status: "loading" }
    | { status: "ready"; reviews: Review[]; summary: ReviewSummary }
    | { status: "error"; message: string };

const ProductDetails = () => {
    const { slug } = useParams<{ slug: string }>();
    const [tab, setTab] = useState<"ingredients" | "howToUse" | "reviews">("ingredients");
    const [variantIndex, setVariantIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const { status, getBySlug, getRelated } = useProducts();
    const { addItem } = useCart();

    const [reviewsState, setReviewsState] = useState<ReviewsState>({ status: "loading" });
    const [reviewForm, setReviewForm] = useState({ authorName: "", rating: 0, comment: "" });
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState<string | null>(null);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);

    const loadReviews = useCallback(async () => {
        if (!slug) return;
        setReviewsState({ status: "loading" });
        try {
            const { reviews, summary } = await fetchProductReviews(slug);
            setReviewsState({ status: "ready", reviews, summary });
        } catch (error) {
            setReviewsState({ status: "error", message: errorMessage(error, "Could not load reviews.") });
        }
    }, [slug]);

    useEffect(() => {
        void loadReviews();
    }, [loadReviews]);

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
    const selectedVariant = product.variants[variantIndex];
    const effectivePrice = selectedVariant ? selectedVariant.price : product.price;
    const orderLabel = selectedVariant ? ` (${selectedVariant.label})` : "";

    // Prefer the live average from approved reviews once any exist; otherwise
    // fall back to the admin-set rating/reviewCount, exactly as before this
    // feature existed.
    const displayRating =
        reviewsState.status === "ready" && reviewsState.summary.count > 0
            ? { value: reviewsState.summary.averageRating, reviewCount: reviewsState.summary.count }
            : product.rating
              ? { value: product.rating, reviewCount: product.reviewCount }
              : null;

    const handleSubmitReview = async (event: FormEvent) => {
        event.preventDefault();
        setReviewSubmitting(true);
        setReviewError(null);
        try {
            await submitReview({
                productSlug: product.slug,
                authorName: reviewForm.authorName,
                rating: reviewForm.rating,
                comment: reviewForm.comment,
            });
            setReviewSubmitted(true);
            setReviewForm({ authorName: "", rating: 0, comment: "" });
        } catch (error) {
            setReviewError(errorMessage(error, "Could not submit your review."));
        } finally {
            setReviewSubmitting(false);
        }
    };

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

                    {displayRating && (
                        <Box sx={{ mb: 2 }}>
                            <StarRating value={displayRating.value} reviewCount={displayRating.reviewCount} />
                        </Box>
                    )}

                    <Typography variant="h4" color="primary" sx={{ mb: 3, fontWeight: 700 }}>
                        ₹{effectivePrice}
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

                    {product.variants.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                Size
                            </Typography>
                            <ToggleButtonGroup
                                exclusive
                                value={variantIndex}
                                onChange={(_, value) => value !== null && setVariantIndex(value)}
                                size="small"
                            >
                                {product.variants.map((variant, index) => (
                                    <ToggleButton key={variant.label} value={index}>
                                        {variant.label} — ₹{variant.price}
                                    </ToggleButton>
                                ))}
                            </ToggleButtonGroup>
                        </Box>
                    )}

                    {product.inStock ? (
                        <>
                            <Stack direction="row" spacing={2} sx={{ mb: 3, alignItems: "center" }}>
                                <QuantityStepper value={quantity} onChange={setQuantity} />
                            </Stack>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
                                <CustomButton
                                    variant="contained"
                                    size="large"
                                    startIcon={<AddShoppingCartIcon />}
                                    onClick={() =>
                                        addItem(
                                            {
                                                slug: product.slug,
                                                name: product.name,
                                                image: product.image,
                                                price: effectivePrice,
                                                variantLabel: selectedVariant?.label,
                                            },
                                            quantity
                                        )
                                    }
                                >
                                    Add to Cart
                                </CustomButton>

                                <CustomButton
                                    variant="outlined"
                                    size="large"
                                    startIcon={<WhatsAppIcon />}
                                    component="a"
                                    href={whatsappLink(
                                        `Hi AyuAura, I'd like to order the ${product.name}${orderLabel} x${quantity} (₹${effectivePrice * quantity}).`
                                    )}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Order via WhatsApp
                                </CustomButton>
                            </Stack>
                        </>
                    ) : (
                        <Typography color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                            Currently out of stock.
                        </Typography>
                    )}

                    <CustomButton variant="outlined" size="large" component={RouterLink} to="/products" sx={{ mb: 3 }}>
                        Continue Browsing
                    </CustomButton>

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
                    <Tab label="Ingredients" value="ingredients" />
                    {product.howToUse && <Tab label="How to Use" value="howToUse" />}
                    <Tab
                        label={reviewsState.status === "ready" ? `Reviews (${reviewsState.summary.count})` : "Reviews"}
                        value="reviews"
                    />
                </Tabs>

                {tab === "ingredients" && (
                    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                        {product.ingredients.map((ingredient) => (
                            <Chip key={ingredient} label={ingredient} variant="outlined" />
                        ))}
                    </Stack>
                )}

                {tab === "howToUse" && product.howToUse && (
                    <Typography color="text.secondary">{product.howToUse}</Typography>
                )}

                {tab === "reviews" && (
                    <Box sx={{ maxWidth: 640 }}>
                        {reviewsState.status === "loading" && (
                            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                                <CircularProgress size={28} />
                            </Box>
                        )}

                        {reviewsState.status === "error" && <Alert severity="error">{reviewsState.message}</Alert>}

                        {reviewsState.status === "ready" && (
                            <Stack spacing={3} sx={{ mb: 4 }}>
                                {reviewsState.reviews.length === 0 ? (
                                    <Typography color="text.secondary">
                                        No reviews yet — be the first to write one.
                                    </Typography>
                                ) : (
                                    reviewsState.reviews.map((review) => (
                                        <Box key={review.id}>
                                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 0.5 }}>
                                                <Typography sx={{ fontWeight: 600 }}>{review.authorName}</Typography>
                                                <StarRating value={review.rating} size={14} />
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                                                {new Date(review.createdAt).toLocaleDateString()}
                                            </Typography>
                                            <Typography color="text.secondary">{review.comment}</Typography>
                                        </Box>
                                    ))
                                )}
                            </Stack>
                        )}

                        <Divider sx={{ mb: 3 }} />

                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Write a review
                        </Typography>

                        {reviewSubmitted ? (
                            <Alert severity="success">Thanks — your review will appear once it's approved.</Alert>
                        ) : (
                            <Box component="form" onSubmit={(event) => void handleSubmitReview(event)}>
                                {reviewError && (
                                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setReviewError(null)}>
                                        {reviewError}
                                    </Alert>
                                )}

                                <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
                                    <TextField
                                        label="Your name"
                                        value={reviewForm.authorName}
                                        onChange={(event) =>
                                            setReviewForm((form) => ({ ...form, authorName: event.target.value }))
                                        }
                                        required
                                        fullWidth
                                    />

                                    <Box>
                                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                                            Rating
                                        </Typography>
                                        <Rating
                                            value={reviewForm.rating}
                                            onChange={(_, value) =>
                                                setReviewForm((form) => ({ ...form, rating: value ?? 0 }))
                                            }
                                        />
                                    </Box>

                                    <TextField
                                        label="Your review"
                                        value={reviewForm.comment}
                                        onChange={(event) =>
                                            setReviewForm((form) => ({ ...form, comment: event.target.value }))
                                        }
                                        required
                                        fullWidth
                                        multiline
                                        minRows={3}
                                    />

                                    <CustomButton
                                        type="submit"
                                        variant="contained"
                                        disabled={
                                            reviewSubmitting ||
                                            !reviewForm.authorName.trim() ||
                                            !reviewForm.comment.trim() ||
                                            reviewForm.rating === 0
                                        }
                                        startIcon={reviewSubmitting ? <CircularProgress size={16} /> : undefined}
                                    >
                                        Submit review
                                    </CustomButton>
                                </Stack>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>

            <RelatedProducts products={relatedProducts} />
        </PageContainer>
    );
};

export default ProductDetails;
