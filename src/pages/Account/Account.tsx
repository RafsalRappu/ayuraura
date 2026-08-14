import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

import PageContainer from "../../components/common/PageContainer";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";
import { errorMessage } from "../../api/client";
import { fetchMyOrders } from "../../api/customers";
import { useCustomerAuth } from "../../data/useCustomerAuth";
import { orderShortCode } from "../../data/cart";
import type { Order, OrderStatus } from "../../types/order";
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
        <Box sx={{ maxWidth: 640 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 4 }}>
                <Box>
                    <Typography variant="h5">Hi, {customer?.name}</Typography>
                    <Typography color="text.secondary" variant="body2">
                        {customer?.phone}
                    </Typography>
                </Box>
                <Button color="inherit" startIcon={<LogoutIcon />} onClick={() => void logout()}>
                    Sign out
                </Button>
            </Stack>

            <Typography variant="h6" sx={{ mb: 2 }}>
                Order history
            </Typography>

            {loading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                    <CircularProgress size={28} />
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {!loading && !error && orders.length === 0 && (
                <Typography color="text.secondary">
                    No orders yet — orders you place while signed in will show up here.
                </Typography>
            )}

            <Stack spacing={2}>
                {orders.map((order) => (
                    <Box key={order.publicId} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography
                                sx={{ fontWeight: 600, textDecoration: "none" }}
                                component={RouterLink}
                                to={`/order/${order.publicId}`}
                                color="inherit"
                            >
                                Order #{orderShortCode(order.publicId)}
                            </Typography>
                            <Chip label={STATUS_LABEL[order.status]} color={STATUS_COLOR[order.status]} size="small" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                            {new Date(order.createdAt).toLocaleDateString()} · ₹{order.amount}
                        </Typography>
                    </Box>
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
                <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {status === "ready" && (customer ? <AccountDashboard /> : <AccountAuth configured={configured} />)}
        </PageContainer>
    );
};

export default Account;
