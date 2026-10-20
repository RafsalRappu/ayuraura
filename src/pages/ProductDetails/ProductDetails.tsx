import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    Rating,
    Skeleton,
    Stack,
    Tab,
    Tabs,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";

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
import { CSS_EASE_OUT, EASE_OUT, fadeUpItem, staggerContainer } from "../../theme/motion";

type ReviewsState =
    | { status: "loading" }
    | { status: "ready"; reviews: Review[]; summary: ReviewSummary }
    | { status: "error"; message: string };

const mediaPanelSx = {
    position: "relative",
    borderRadius: 7,
    overflow: "hidden",
    height: { xs: 360, sm: 440, md: 560 },
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "background.neutral",
} as const;

/** Same two-column frame as the loaded page, so content doesn't jump in. */
const ProductDetailsSkeleton = () => (
    <Grid container spacing={{ xs: 4, md: 8 }} sx={{ mb: { xs: 8, md: 10 } }}>
        <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" sx={{ ...mediaPanelSx, borderRadius: 7 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rounded" width={96} height={26} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="80%" height={64} />
            <Skeleton variant="text" width={160} sx={{ mb: 2 }} />
            <Skeleton variant="text" width={110} height={48} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="95%" />
            <Skeleton variant="text" width="70%" sx={{ mb: 3 }} />
            <Stack direction="row" spacing={2}>
                <Skeleton variant="rounded" width={180} height={50} sx={{ borderRadius: 999 }} />
                <Skeleton variant="rounded" width={200} height={50} sx={{ borderRadius: 999 }} />
            </Stack>
        </Grid>
    </Grid>
);

const initials = (name: string) =>
    name
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join("")
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 2)
        .toUpperCase() || "★";

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
                    <Skeleton variant="text" width={220} sx={{ mb: { xs: 3, md: 4 } }} />
                    <ProductDetailsSkeleton />
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

            <Grid container spacing={{ xs: 4, md: 8 }} sx={{ mb: { xs: 8, md: 10 } }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.9, ease: EASE_OUT }}
                        style={{ position: "sticky", top: 96 }}
                    >
                        <Box
                            sx={(theme) => ({
                                ...mediaPanelSx,
                                backgroundImage: `radial-gradient(circle at 50% 40%, ${alpha(theme.palette.primary.light, 0.2)}, transparent 65%)`,
                                "&:hover [data-media-hover]": { transform: "scale(1.06)" },
                            })}
                        >
                            <ProductMedia product={product} iconSize="7rem" />

                            {(product.bestseller || product.newArrival) && (
                                <Chip
                                    label={product.bestseller ? "Bestseller" : "New Arrival"}
                                    color={product.bestseller ? "secondary" : "primary"}
                                    sx={{ position: "absolute", top: 20, left: 20, bgcolor: "background.paper" }}
                                />
                            )}
                        </Box>
                    </motion.div>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <motion.div variants={staggerContainer(0.07)} initial="hidden" animate="show">
                        <motion.div variants={fadeUpItem}>
                            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
                                <Chip label={product.category} color="primary" size="small" />
                                <Chip
                                    label={product.inStock ? "In stock" : "Out of stock"}
                                    color={product.inStock ? "success" : "default"}
                                    size="small"
                                    variant="outlined"
                                />
                            </Stack>

                            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "2.6rem", md: "3.5rem" }, mb: 1.5 }}>
                                {product.name}
                            </Typography>

                            {displayRating && (
                                <Box sx={{ mb: 2.5 }}>
                                    <StarRating value={displayRating.value} reviewCount={displayRating.reviewCount} />
                                </Box>
                            )}

                            <Typography
                                component="p"
                                sx={{ mb: 3, fontWeight: 800, fontSize: { xs: "2rem", md: "2.25rem" }, letterSpacing: "-0.02em", lineHeight: 1.2 }}
                            >
                                ₹{effectivePrice}
                            </Typography>
                        </motion.div>

                        <motion.div variants={fadeUpItem}>
                            <Typography color="text.secondary" sx={{ mb: 3.5, fontSize: "1.0625rem", lineHeight: 1.75 }}>
                                {product.description}
                            </Typography>
                        </motion.div>

                        {product.benefits.length > 0 && (
                            <motion.div variants={fadeUpItem}>
                                <Box
                                    component="ul"
                                    sx={{
                                        listStyle: "none",
                                        p: 0,
                                        m: 0,
                                        mb: 3.5,
                                        display: "grid",
                                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                                        gap: 1.5,
                                    }}
                                >
                                    {product.benefits.map((benefit) => (
                                        <Box component="li" key={benefit} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                                            <Box
                                                sx={(theme) => ({
                                                    width: 24,
                                                    height: 24,
                                                    flexShrink: 0,
                                                    borderRadius: "50%",
                                                    display: "grid",
                                                    placeItems: "center",
                                                    color: "success.dark",
                                                    bgcolor: alpha(theme.palette.success.main, 0.14),
                                                })}
                                            >
                                                <CheckRoundedIcon sx={{ fontSize: 15 }} />
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {benefit}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </motion.div>
                        )}

                        <motion.div variants={fadeUpItem}>
                            {product.variants.length > 0 && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="overline" component="div" sx={{ mb: 1, color: "text.secondary" }}>
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
                                    <Stack
                                        direction={{ xs: "column", sm: "row" }}
                                        spacing={2}
                                        sx={{ mb: 2, alignItems: { xs: "stretch", sm: "center" } }}
                                    >
                                        <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
                                            <QuantityStepper value={quantity} onChange={setQuantity} />
                                        </Box>

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
                                            sx={(theme) => ({ flex: 1, boxShadow: theme.customShadows.primary })}
                                        >
                                            Add to Cart
                                        </CustomButton>
                                    </Stack>

                                    <CustomButton
                                        variant="outlined"
                                        size="large"
                                        fullWidth
                                        startIcon={<WhatsAppIcon />}
                                        component="a"
                                        href={whatsappLink(
                                            `Hi AyuAura, I'd like to order the ${product.name}${orderLabel} x${quantity} (₹${effectivePrice * quantity}).`
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={{ mb: 2 }}
                                    >
                                        Order via WhatsApp
                                    </CustomButton>
                                </>
                            ) : (
                                <Typography color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                                    Currently out of stock.
                                </Typography>
                            )}

                            <Button
                                component={RouterLink}
                                to="/products"
                                color="inherit"
                                startIcon={<ArrowBackRoundedIcon />}
                                sx={{
                                    mb: 3,
                                    color: "text.secondary",
                                    "& .MuiButton-startIcon": { transition: `transform .4s ${CSS_EASE_OUT}` },
                                    "&:hover .MuiButton-startIcon": { transform: "translateX(-3px)" },
                                }}
                            >
                                Continue Browsing
                            </Button>

                            <Box
                                sx={(theme) => ({
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1.5,
                                    p: 2,
                                    borderRadius: 4,
                                    bgcolor: alpha(theme.palette.primary.main, 0.06),
                                    border: `1px dashed ${alpha(theme.palette.primary.main, 0.24)}`,
                                })}
                            >
                                <SpaOutlinedIcon color="primary" />
                                <Typography variant="body2" color="text.secondary">
                                    Free consultation on skin type &amp; usage included with every order.
                                </Typography>
                            </Box>
                        </motion.div>
                    </motion.div>
                </Grid>
            </Grid>

            <Card sx={{ mb: { xs: 8, md: 10 }, p: { xs: 2.5, md: 4 } }}>
                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
                    textColor="primary"
                    indicatorColor="primary"
                    variant="scrollable"
                    allowScrollButtonsMobile
                >
                    <Tab label="Ingredients" value="ingredients" />
                    {product.howToUse && <Tab label="How to Use" value="howToUse" />}
                    <Tab
                        label={reviewsState.status === "ready" ? `Reviews (${reviewsState.summary.count})` : "Reviews"}
                        value="reviews"
                    />
                </Tabs>

                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={tab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.3, ease: EASE_OUT }}
                    >
                        {tab === "ingredients" && (
                            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                                {product.ingredients.map((ingredient) => (
                                    <Chip
                                        key={ingredient}
                                        label={ingredient}
                                        icon={<SpaOutlinedIcon />}
                                        sx={{ height: 36, px: 0.5, fontSize: "0.875rem" }}
                                    />
                                ))}
                            </Stack>
                        )}

                        {tab === "howToUse" && product.howToUse && (
                            <Typography color="text.secondary" sx={{ maxWidth: 760, lineHeight: 1.8 }}>
                                {product.howToUse}
                            </Typography>
                        )}

                        {tab === "reviews" && (
                            <Box sx={{ maxWidth: 720 }}>
                                {reviewsState.status === "loading" && (
                                    <Stack spacing={3} sx={{ mb: 4 }}>
                                        {Array.from({ length: 2 }, (_, index) => (
                                            <Stack key={index} direction="row" spacing={2}>
                                                <Skeleton variant="circular" width={40} height={40} />
                                                <Box sx={{ flex: 1 }}>
                                                    <Skeleton variant="text" width="30%" />
                                                    <Skeleton variant="text" width="90%" />
                                                    <Skeleton variant="text" width="60%" />
                                                </Box>
                                            </Stack>
                                        ))}
                                    </Stack>
                                )}

                                {reviewsState.status === "error" && (
                                    <Alert severity="error" sx={{ mb: 3 }}>
                                        {reviewsState.message}
                                    </Alert>
                                )}

                                {reviewsState.status === "ready" && (
                                    <Stack spacing={3} sx={{ mb: 4 }}>
                                        {reviewsState.reviews.length === 0 ? (
                                            <Typography color="text.secondary">
                                                No reviews yet — be the first to write one.
                                            </Typography>
                                        ) : (
                                            reviewsState.reviews.map((review) => (
                                                <Stack key={review.id} direction="row" spacing={2}>
                                                    <Avatar
                                                        sx={(theme) => ({
                                                            width: 40,
                                                            height: 40,
                                                            fontSize: "0.875rem",
                                                            color: "primary.dark",
                                                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                                                        })}
                                                    >
                                                        {initials(review.authorName)}
                                                    </Avatar>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1.5}
                                                            sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.25 }}
                                                        >
                                                            <Typography sx={{ fontWeight: 700 }}>{review.authorName}</Typography>
                                                            <StarRating value={review.rating} size={14} />
                                                        </Stack>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.disabled"
                                                            sx={{ display: "block", mb: 1 }}
                                                        >
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </Typography>
                                                        <Typography color="text.secondary">{review.comment}</Typography>
                                                    </Box>
                                                </Stack>
                                            ))
                                        )}
                                    </Stack>
                                )}

                                <Divider sx={{ mb: 3, borderStyle: "dashed" }} />

                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Write a review
                                </Typography>

                                {reviewSubmitted ? (
                                    <Alert severity="success">Thanks — your review will appear once it's approved.</Alert>
                                ) : (
                                    <Box
                                        component="form"
                                        onSubmit={(event) => void handleSubmitReview(event)}
                                        sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 4, bgcolor: "background.neutral" }}
                                    >
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
                                                <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 600 }}>
                                                    Rating
                                                </Typography>
                                                <Rating
                                                    value={reviewForm.rating}
                                                    onChange={(_, value) =>
                                                        setReviewForm((form) => ({ ...form, rating: value ?? 0 }))
                                                    }
                                                    size="large"
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
                                                startIcon={reviewSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                                            >
                                                Submit review
                                            </CustomButton>
                                        </Stack>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Card>

            <RelatedProducts products={relatedProducts} />
        </PageContainer>
    );
};

export default ProductDetails;
