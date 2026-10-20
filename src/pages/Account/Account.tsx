import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Avatar, Box, Button, Card, Chip, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";

import PageContainer from "../../components/common/PageContainer";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";
import Reveal from "../../components/common/Reveal";
import { errorMessage } from "../../api/client";
import { fetchMyOrders } from "../../api/customers";
import { useCustomerAuth } from "../../data/useCustomerAuth";
import { orderShortCode } from "../../data/cart";
import type { Order, OrderStatus } from "../../types/order";
import { CSS_EASE_OUT } from "../../theme/motion";
import AccountAuth from "./AccountAuth";

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "Awaiting payment",
    paid: "Paid",
    failed: "Payment failed",
    cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, "warning" | "success" | "error" | "default"> = {
    pending: "warning",
    paid: "success",
    failed: "error",
    cancelled: "default",
};

const initials = (name = "") =>
    name
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase();

const AccountDashboard = () => {
    const { customer, logout } = useCustomerAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setOrders(await fetchMyOrders());
        } catch (cause) {
            setError(errorMessage(cause, "Could not load your orders."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <Box sx={{ maxWidth: 760, mx: "auto" }}>
            <Card
                sx={(theme) => ({
                    p: { xs: 2.5, md: 3.5 },
                    mb: 4,
                    overflow: "hidden",
                    backgroundImage: `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.light, 0.22)}, transparent 55%)`,
                })}
            >
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
                >
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Avatar
                            sx={(theme) => ({
                                width: 56,
                                height: 56,
                                fontSize: "1.125rem",
                                color: "primary.contrastText",
                                background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.dark})`,
                                boxShadow: theme.customShadows.primary,
                            })}
                        >
                            {initials(customer?.name)}
                        </Avatar>
                        <Box>
                            <Typography variant="h5">Hi, {customer?.name}</Typography>
                            <Typography color="text.secondary" variant="body2">
                                {customer?.phone}
                            </Typography>
                        </Box>
                    </Stack>
                    <Button variant="outlined" color="inherit" startIcon={<LogoutIcon />} onClick={() => void logout()}>
                        Sign out
                    </Button>
                </Stack>
            </Card>

            <Typography variant="h6" sx={{ mb: 2 }}>
                Order history
            </Typography>

            {loading && (
                <Stack spacing={1.5}>
                    {Array.from({ length: 3 }, (_, index) => (
                        <Card key={index} sx={{ p: 2.5 }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                <Box sx={{ flex: 1 }}>
                                    <Skeleton variant="text" width="35%" />
                                    <Skeleton variant="text" width="25%" />
                                </Box>
                                <Skeleton variant="rounded" width={96} height={24} />
                            </Stack>
                        </Card>
                    ))}
                </Stack>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!loading && !error && orders.length === 0 && (
                <Card sx={{ p: 5, textAlign: "center" }}>
                    <ReceiptLongOutlinedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1.5 }} />
                    <Typography color="text.secondary">
                        No orders yet — orders you place while signed in will show up here.
                    </Typography>
                </Card>
            )}

            <Stack spacing={1.5}>
                {orders.map((order, index) => (
                    <Reveal key={order.publicId} delay={Math.min(index, 6) * 0.05} y={14}>
                        <Card
                            component={RouterLink}
                            to={`/order/${order.publicId}`}
                            sx={(theme) => ({
                                p: 2.5,
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                                textDecoration: "none",
                                color: "inherit",
                                transition: `transform .4s ${CSS_EASE_OUT}, box-shadow .4s ${CSS_EASE_OUT}`,
                                "&:hover": { transform: "translateY(-2px)", boxShadow: theme.customShadows.z16 },
                                "&:hover .order-chevron": { transform: "translateX(3px)", color: "primary.main" },
                            })}
                        >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700 }}>Order #{orderShortCode(order.publicId)}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(order.createdAt).toLocaleDateString()} · ₹{order.amount}
                                </Typography>
                            </Box>
                            <Chip label={STATUS_LABEL[order.status]} color={STATUS_COLOR[order.status]} size="small" />
                            <ChevronRightRoundedIcon
                                className="order-chevron"
                                sx={{ color: "text.disabled", transition: `transform .4s ${CSS_EASE_OUT}, color .3s` }}
                            />
                        </Card>
                    </Reveal>
                ))}
            </Stack>
        </Box>
    );
};

const Account = () => {
    const { status, customer, configured } = useCustomerAuth();

    return (
        <PageContainer>
            <SEO title="My Account" description="Sign in to AyuAura to view your order history." path="/account" noindex />

            <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Account", path: "/account" }]} />

            {status === "loading" && (
                <Box sx={{ maxWidth: 760, mx: "auto" }}>
                    <Card sx={{ p: 3.5, mb: 4 }}>
                        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                            <Skeleton variant="circular" width={56} height={56} />
                            <Box sx={{ flex: 1 }}>
                                <Skeleton variant="text" width="40%" height={32} />
                                <Skeleton variant="text" width="25%" />
                            </Box>
                        </Stack>
                    </Card>
                    <Skeleton variant="rounded" height={84} sx={{ mb: 1.5 }} />
                    <Skeleton variant="rounded" height={84} />
                </Box>
            )}

            {status === "ready" && (customer ? <AccountDashboard /> : <AccountAuth configured={configured} />)}
        </PageContainer>
    );
};

export default Account;
