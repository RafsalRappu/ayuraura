import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Button, Card, CircularProgress, Grid, Stack, Typography } from "@mui/material";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";

import { errorMessage } from "../../api/client";
import { fetchOrders } from "../../api/orders";
import { fetchAllReviews } from "../../api/reviews";
import { fetchCoupons } from "../../api/coupons";
import { orderShortCode } from "../../data/cart";
import { useProducts } from "../../data/useProducts";
import type { AdminOrder } from "../../types/order";
import type { AdminReview } from "../../types/review";
import type { AdminTab } from "./adminTypes";

interface AdminOverviewProps {
    onSummary: (summary: { pendingOrders: number; pendingReviews: number }) => void;
    onNavigate: (tab: AdminTab, options?: { statusFilter?: string }) => void;
}

interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string;
    tone?: "default" | "warning";
}

const StatCard = ({ icon, label, value, tone = "default" }: StatCardProps) => (
    <Card
        variant="outlined"
        sx={{
            p: 2.5,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            gap: 2,
            borderColor: tone === "warning" ? "warning.main" : "divider",
        }}
    >
        <Box
            sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: tone === "warning" ? "warning.main" : "primary.main",
                color: tone === "warning" ? "warning.contrastText" : "primary.contrastText",
                flexShrink: 0,
            }}
        >
            {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
                {label}
            </Typography>
        </Box>
    </Card>
);

const AdminOverview = ({ onSummary, onNavigate }: AdminOverviewProps) => {
    const { products } = useProducts();

    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [couponsActive, setCouponsActive] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const [ordersResult, reviewsResult, couponsResult] = await Promise.all([
                fetchOrders(),
                fetchAllReviews(),
                fetchCoupons(),
            ]);
            setOrders(ordersResult);
            setReviews(reviewsResult);
            setCouponsActive(couponsResult.filter((coupon) => coupon.active).length);

            onSummary({
                pendingOrders: ordersResult.filter((order) => order.status === "pending").length,
                pendingReviews: reviewsResult.filter((review) => review.status === "pending").length,
            });
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load the overview."));
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const pendingOrders = orders.filter((order) => order.status === "pending");
    const pendingReviews = reviews.filter((review) => review.status === "pending");
    const revenue = orders.filter((order) => order.status === "paid").reduce((total, order) => total + order.amount, 0);

    if (loading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box>
            <Typography variant="h5" component="h1" sx={{ mb: 3 }}>
                Overview
            </Typography>

            {loadError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
                    {loadError}
                </Alert>
            )}

            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        icon={<PendingActionsIcon />}
                        label={`Pending order${pendingOrders.length === 1 ? "" : "s"}`}
                        value={String(pendingOrders.length)}
                        tone={pendingOrders.length > 0 ? "warning" : "default"}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard
                        icon={<RateReviewOutlinedIcon />}
                        label={`Review${pendingReviews.length === 1 ? "" : "s"} to moderate`}
                        value={String(pendingReviews.length)}
                        tone={pendingReviews.length > 0 ? "warning" : "default"}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard icon={<Inventory2OutlinedIcon />} label="Products live" value={String(products.length)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <StatCard icon={<PaymentsOutlinedIcon />} label="Revenue (paid orders)" value={`₹${revenue}`} />
                </Grid>
            </Grid>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {couponsActive} active coupon{couponsActive === 1 ? "" : "s"} right now.
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Needs attention — orders
                            </Typography>
                            {pendingOrders.length > 0 && (
                                <Button
                                    size="small"
                                    sx={{ whiteSpace: "nowrap" }}
                                    onClick={() => onNavigate("orders", { statusFilter: "pending" })}
                                >
                                    View all
                                </Button>
                            )}
                        </Stack>

                        {pendingOrders.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No pending orders right now.
                            </Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {pendingOrders.slice(0, 5).map((order) => (
                                    <Stack
                                        key={order.publicId}
                                        direction="row"
                                        sx={{ justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                                        onClick={() => onNavigate("orders", { statusFilter: "pending" })}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                #{orderShortCode(order.publicId)} · {order.customerName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2">₹{order.amount}</Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined" sx={{ borderRadius: 3, p: 3 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                Needs attention — reviews
                            </Typography>
                            {pendingReviews.length > 0 && (
                                <Button size="small" sx={{ whiteSpace: "nowrap" }} onClick={() => onNavigate("reviews")}>
                                    View all
                                </Button>
                            )}
                        </Stack>

                        {pendingReviews.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                                No reviews waiting for moderation.
                            </Typography>
                        ) : (
                            <Stack spacing={1.5}>
                                {pendingReviews.slice(0, 5).map((review) => (
                                    <Stack
                                        key={review.id}
                                        direction="row"
                                        sx={{ justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                                        onClick={() => onNavigate("reviews")}
                                    >
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {review.authorName} · {review.productName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {review.rating}★
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        )}
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminOverview;
