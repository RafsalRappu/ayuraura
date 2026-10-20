import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Avatar, Box, Button, Card, Grid, Skeleton, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";

import { errorMessage } from "../../api/client";
import { fetchOrders } from "../../api/orders";
import { fetchAllReviews } from "../../api/reviews";
import { fetchCoupons } from "../../api/coupons";
import { orderShortCode } from "../../data/cart";
import { useProducts } from "../../data/useProducts";
import type { AdminOrder } from "../../types/order";
import type { AdminReview } from "../../types/review";
import { CSS_EASE_OUT } from "../../theme/motion";
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

const ping = keyframes`
  0%   { transform: scale(1); opacity: 0.7; }
  80%, 100% { transform: scale(2.6); opacity: 0; }
`;

const toneColor = (theme: Theme, tone: "default" | "warning") =>
    tone === "warning" ? theme.palette.warning : theme.palette.primary;

const StatCard = ({ icon, label, value, tone = "default" }: StatCardProps) => (
    <Card
        sx={(theme) => ({
            p: 3,
            height: "100%",
            overflow: "hidden",
            transition: `transform .45s ${CSS_EASE_OUT}, box-shadow .45s ${CSS_EASE_OUT}`,
            "&:hover": { transform: "translateY(-3px)", boxShadow: theme.customShadows.z16 },
        })}
    >
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1.25 }}>
                    {tone === "warning" && (
                        <Box sx={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
                            <Box
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    bgcolor: "warning.main",
                                    animation: `${ping} 1.8s cubic-bezier(0, 0, 0.2, 1) infinite`,
                                }}
                            />
                            <Box sx={{ position: "absolute", inset: 0, borderRadius: "50%", bgcolor: "warning.main" }} />
                        </Box>
                    )}
                    <Typography variant="subtitle2" color="text.secondary">
                        {label}
                    </Typography>
                </Stack>
                <Typography sx={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                    {value}
                </Typography>
            </Box>

            <Box
                sx={(theme) => {
                    const color = toneColor(theme, tone);
                    return {
                        width: 48,
                        height: 48,
                        borderRadius: 3.5,
                        flexShrink: 0,
                        display: "grid",
                        placeItems: "center",
                        color: tone === "warning" ? color.darker : color.dark,
                        bgcolor: alpha(color.main, 0.14),
                    };
                }}
            >
                {icon}
            </Box>
        </Stack>
    </Card>
);

const StatCardSkeleton = () => (
    <Card sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="70%" sx={{ mb: 1 }} />
                <Skeleton variant="text" width={64} height={40} />
            </Box>
            <Skeleton variant="rounded" width={48} height={48} sx={{ flexShrink: 0, borderRadius: 3.5 }} />
        </Stack>
    </Card>
);

const AttentionCardSkeleton = () => (
    <Card sx={{ p: 3 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Skeleton variant="text" width="50%" height={28} />
            <Skeleton variant="rounded" width={72} height={30} />
        </Stack>
        <Stack spacing={2}>
            {[0, 1, 2].map((row) => (
                <Stack key={row} direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width={row % 2 ? "55%" : "70%"} />
                        <Skeleton variant="text" width={80} />
                    </Box>
                    <Skeleton variant="text" width={48} />
                </Stack>
            ))}
        </Stack>
    </Card>
);

const OverviewSkeleton = () => (
    <Box aria-busy="true" aria-label="Loading overview">
        <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
            Overview
        </Typography>
        <Skeleton variant="text" width={200} sx={{ mb: 4 }} />

        <Grid container spacing={3} sx={{ mb: 3 }}>
            {[0, 1, 2, 3].map((card) => (
                <Grid key={card} size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCardSkeleton />
                </Grid>
            ))}
        </Grid>

        <Grid container spacing={3}>
            {[0, 1].map((card) => (
                <Grid key={card} size={{ xs: 12, md: 6 }}>
                    <AttentionCardSkeleton />
                </Grid>
            ))}
        </Grid>
    </Box>
);

const initials = (name: string) =>
    name
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

const rowSx = {
    alignItems: "center",
    cursor: "pointer",
    mx: -1.5,
    px: 1.5,
    py: 1,
    borderRadius: 2,
    transition: "background-color .2s",
    "&:hover": { bgcolor: "action.hover" },
} as const;

interface AttentionCardProps {
    title: string;
    empty: string;
    onViewAll?: () => void;
    children: ReactNode;
}

const AttentionCard = ({ title, empty, onViewAll, children }: AttentionCardProps) => (
    <Card sx={{ p: 3, height: "100%" }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h6">{title}</Typography>
            {onViewAll && (
                <Button
                    size="small"
                    color="inherit"
                    endIcon={<ArrowForwardRoundedIcon fontSize="small" />}
                    sx={{ whiteSpace: "nowrap", color: "text.secondary" }}
                    onClick={onViewAll}
                >
                    View all
                </Button>
            )}
        </Stack>

        {children ?? (
            <Stack spacing={1.5} sx={{ alignItems: "center", textAlign: "center", py: 4 }}>
                <TaskAltRoundedIcon sx={{ fontSize: 40, color: "success.main", opacity: 0.8 }} />
                <Typography variant="body2" color="text.secondary">
                    {empty}
                </Typography>
            </Stack>
        )}
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

    if (loading) return <OverviewSkeleton />;

    return (
        <Box>
            <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
                Overview
            </Typography>

            <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", mb: 4, color: "text.secondary" }}>
                <LocalOfferOutlinedIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                    {couponsActive} active coupon{couponsActive === 1 ? "" : "s"} right now.
                </Typography>
            </Stack>

            {loadError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
                    {loadError}
                </Alert>
            )}

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        icon={<PendingActionsIcon />}
                        label={`Pending order${pendingOrders.length === 1 ? "" : "s"}`}
                        value={String(pendingOrders.length)}
                        tone={pendingOrders.length > 0 ? "warning" : "default"}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard
                        icon={<RateReviewOutlinedIcon />}
                        label={`Review${pendingReviews.length === 1 ? "" : "s"} to moderate`}
                        value={String(pendingReviews.length)}
                        tone={pendingReviews.length > 0 ? "warning" : "default"}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard icon={<Inventory2OutlinedIcon />} label="Products live" value={String(products.length)} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                    <StatCard icon={<PaymentsOutlinedIcon />} label="Revenue (paid orders)" value={`₹${revenue}`} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <AttentionCard
                        title="Needs attention — orders"
                        empty="No pending orders right now."
                        onViewAll={
                            pendingOrders.length > 0 ? () => onNavigate("orders", { statusFilter: "pending" }) : undefined
                        }
                    >
                        {pendingOrders.length > 0 ? (
                            <Stack spacing={0.5}>
                                {pendingOrders.slice(0, 5).map((order) => (
                                    <Stack
                                        key={order.publicId}
                                        direction="row"
                                        spacing={1.5}
                                        sx={rowSx}
                                        onClick={() => onNavigate("orders", { statusFilter: "pending" })}
                                    >
                                        <Avatar
                                            sx={(theme) => ({
                                                width: 40,
                                                height: 40,
                                                fontSize: "0.875rem",
                                                color: "warning.darker",
                                                bgcolor: alpha(theme.palette.warning.main, 0.16),
                                            })}
                                        >
                                            {initials(order.customerName)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                                                #{orderShortCode(order.publicId)} · {order.customerName}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                            ₹{order.amount}
                                        </Typography>
                                    </Stack>
                                ))}
                            </Stack>
                        ) : null}
                    </AttentionCard>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <AttentionCard
                        title="Needs attention — reviews"
                        empty="No reviews waiting for moderation."
                        onViewAll={pendingReviews.length > 0 ? () => onNavigate("reviews") : undefined}
                    >
                        {pendingReviews.length > 0 ? (
                            <Stack spacing={0.5}>
                                {pendingReviews.slice(0, 5).map((review) => (
                                    <Stack
                                        key={review.id}
                                        direction="row"
                                        spacing={1.5}
                                        sx={rowSx}
                                        onClick={() => onNavigate("reviews")}
                                    >
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
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
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
                        ) : null}
                    </AttentionCard>
                </Grid>
            </Grid>
        </Box>
    );
};

export default AdminOverview;
