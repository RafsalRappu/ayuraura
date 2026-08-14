import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Box, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import RefreshIcon from "@mui/icons-material/Refresh";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";

import { fetchOrder } from "../../api/orders";
import { errorMessage } from "../../api/client";
import { buildOrderWhatsAppMessage, orderShortCode } from "../../data/cart";
import { whatsappLink } from "../../config/site";
import type { Order, OrderStatus } from "../../types/order";

type State = { status: "loading" } | { status: "ready"; order: Order } | { status: "error"; message: string };

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "Awaiting payment",
    paid: "Paid",
    failed: "Payment failed",
    cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, "success" | "error" | "warning" | "default"> = {
    pending: "warning",
    paid: "success",
    failed: "error",
    cancelled: "default",
};

const OrderConfirmation = () => {
    const { publicId } = useParams<{ publicId: string }>();
    const [state, setState] = useState<State>({ status: "loading" });

    const load = useCallback(async () => {
        if (!publicId) return;
        setState({ status: "loading" });
        try {
            setState({ status: "ready", order: await fetchOrder(publicId) });
        } catch (error) {
            setState({ status: "error", message: errorMessage(error, "Could not load this order.") });
        }
    }, [publicId]);

    useEffect(() => {
        void load();
    }, [load]);

    return (
        <PageContainer>
            <SEO title="Order confirmation" description="Your AyuAura order." path="/order" noindex />

            <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Order", path: "/order" }]} />

            {state.status === "loading" && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 12 }}>
                    <CircularProgress color="primary" />
                </Box>
            )}

            {state.status === "error" && (
                <Alert
                    severity="error"
                    sx={{ maxWidth: 640 }}
                    action={
                        <CustomButton size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>
                            Retry
                        </CustomButton>
                    }
                >
                    {state.message}
                </Alert>
            )}

            {state.status === "ready" && (
                <Box sx={{ maxWidth: 560 }}>
                    <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "2rem", md: "2.4rem" }, mb: 1 }}>
                        Order #{orderShortCode(state.order.publicId)}
                    </Typography>

                    <Chip label={STATUS_LABEL[state.order.status]} color={STATUS_COLOR[state.order.status]} sx={{ mb: 3 }} />

                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {state.order.items.map((item) => (
                            <Stack
                                key={`${item.slug}::${item.variantLabel ?? ""}`}
                                direction="row"
                                sx={{ justifyContent: "space-between" }}
                            >
                                <Typography color="text.secondary">
                                    {item.name}
                                    {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                                </Typography>
                                <Typography>₹{item.price * item.quantity}</Typography>
                            </Stack>
                        ))}
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {state.order.discountAmount > 0 && (
                        <Stack spacing={0.5} sx={{ mb: 2 }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Subtotal
                                </Typography>
                                <Typography variant="body2">
                                    ₹{state.order.amount + state.order.discountAmount}
                                </Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                <Typography variant="body2" color="success.main">
                                    Discount{state.order.couponCode ? ` (${state.order.couponCode})` : ""}
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    −₹{state.order.discountAmount}
                                </Typography>
                            </Stack>
                        </Stack>
                    )}

                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: 4 }}>
                        <Typography sx={{ fontWeight: 600 }}>Total</Typography>
                        <Typography sx={{ fontWeight: 700 }} color="primary">
                            ₹{state.order.amount}
                        </Typography>
                    </Stack>

                    {state.order.status !== "paid" && (
                        <>
                            <Typography color="text.secondary" sx={{ mb: 2 }}>
                                {state.order.status === "pending"
                                    ? "We haven't received payment for this order yet."
                                    : "This order needs attention."}
                            </Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                <CustomButton
                                    variant="outlined"
                                    startIcon={<WhatsAppIcon />}
                                    component="a"
                                    href={whatsappLink(buildOrderWhatsAppMessage(state.order.items, state.order.publicId))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Contact us via WhatsApp
                                </CustomButton>

                                <CustomButton variant="text" startIcon={<RefreshIcon />} onClick={() => void load()}>
                                    Refresh status
                                </CustomButton>
                            </Stack>
                        </>
                    )}
                </Box>
            )}
        </PageContainer>
    );
};

export default OrderConfirmation;
