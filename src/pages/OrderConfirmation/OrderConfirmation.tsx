import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Avatar, Box, Card, Chip, Divider, Skeleton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";

import { fetchOrder } from "../../api/orders";
import { errorMessage } from "../../api/client";
import { buildOrderWhatsAppMessage, orderShortCode } from "../../data/cart";
import { whatsappLink } from "../../config/site";
import type { Order, OrderStatus } from "../../types/order";
import { EASE_OUT } from "../../theme/motion";

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

const STATUS_ICON: Record<OrderStatus, typeof CheckRoundedIcon> = {
    pending: ScheduleRoundedIcon,
    paid: CheckRoundedIcon,
    failed: ErrorOutlineRoundedIcon,
    cancelled: BlockRoundedIcon,
};

interface OrderDetailsProps {
    order: Order;
    onRefresh: () => void;
}

const OrderDetails = ({ order, onRefresh }: OrderDetailsProps) => {
    const StatusIcon = STATUS_ICON[order.status];
    const tone = STATUS_COLOR[order.status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT }}
        >
            <Card sx={{ maxWidth: 640, mx: "auto", p: { xs: 3, md: 5 } }}>
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <motion.div
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.15 }}
                        style={{ display: "inline-block" }}
                    >
                        <Avatar
                            sx={(theme) => {
                                const color =
                                    tone === "default" ? theme.palette.grey[600] : theme.palette[tone].main;
                                return {
                                    width: 72,
                                    height: 72,
                                    mx: "auto",
                                    mb: 2.5,
                                    color,
                                    bgcolor: alpha(color, 0.14),
                                    boxShadow: `0 0 0 10px ${alpha(color, 0.06)}`,
                                };
                            }}
                        >
                            <StatusIcon sx={{ fontSize: 36 }} />
                        </Avatar>
                    </motion.div>

                    <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "2.2rem", md: "2.75rem" }, mb: 1.5 }}>
                        Order #{orderShortCode(order.publicId)}
                    </Typography>

                    <Chip label={STATUS_LABEL[order.status]} color={tone} />
                </Box>

                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                    {order.items.map((item) => (
                        <Stack
                            key={`${item.slug}::${item.variantLabel ?? ""}`}
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: "center" }}
                        >
                            <Avatar
                                src={item.image}
                                variant="rounded"
                                alt=""
                                sx={{ width: 44, height: 44, bgcolor: "background.neutral", color: "primary.main" }}
                            >
                                {item.name.charAt(0)}
                            </Avatar>
                            <Typography color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
                                <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>
                                    {item.name}
                                </Box>
                                {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                            </Typography>
                            <Typography sx={{ fontWeight: 600 }}>₹{item.price * item.quantity}</Typography>
                        </Stack>
                    ))}
                </Stack>

                <Divider sx={{ mb: 2, borderStyle: "dashed" }} />

                {order.discountAmount > 0 && (
                    <Stack spacing={0.75} sx={{ mb: 2 }}>
                        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                            <Typography variant="body2" color="text.secondary">
                                Subtotal
                            </Typography>
                            <Typography variant="body2">₹{order.amount + order.discountAmount}</Typography>
                        </Stack>
                        <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                            <Typography variant="body2" color="success.dark">
                                Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                            </Typography>
                            <Typography variant="body2" color="success.dark">
                                −₹{order.discountAmount}
                            </Typography>
                        </Stack>
                    </Stack>
                )}

                <Stack
                    direction="row"
                    sx={(theme) => ({
                        justifyContent: "space-between",
                        alignItems: "center",
                        p: 2,
                        mb: order.status !== "paid" ? 4 : 0,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.06),
                    })}
                >
                    <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.25rem" }} color="primary">
                        ₹{order.amount}
                    </Typography>
                </Stack>

                {order.status !== "paid" && (
                    <>
                        <Typography color="text.secondary" sx={{ mb: 2, textAlign: "center" }}>
                            {order.status === "pending"
                                ? "We haven't received payment for this order yet."
                                : "This order needs attention."}
                        </Typography>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "center" }}>
                            <CustomButton
                                variant="outlined"
                                startIcon={<WhatsAppIcon />}
                                component="a"
                                href={whatsappLink(buildOrderWhatsAppMessage(order.items, order.publicId))}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Contact us via WhatsApp
                            </CustomButton>

                            <CustomButton variant="text" startIcon={<RefreshIcon />} onClick={onRefresh}>
                                Refresh status
                            </CustomButton>
                        </Stack>
                    </>
                )}
            </Card>
        </motion.div>
    );
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
                <Card sx={{ maxWidth: 640, mx: "auto", p: { xs: 3, md: 5 } }}>
                    <Skeleton variant="circular" width={72} height={72} sx={{ mx: "auto", mb: 2.5 }} />
                    <Skeleton variant="text" width="55%" height={52} sx={{ mx: "auto" }} />
                    <Skeleton variant="rounded" width={120} height={26} sx={{ mx: "auto", mb: 4 }} />
                    {Array.from({ length: 3 }, (_, index) => (
                        <Stack key={index} direction="row" sx={{ justifyContent: "space-between", mb: 1.5 }}>
                            <Skeleton variant="text" width="50%" />
                            <Skeleton variant="text" width={60} />
                        </Stack>
                    ))}
                </Card>
            )}

            {state.status === "error" && (
                <Alert
                    severity="error"
                    sx={{ maxWidth: 640, mx: "auto" }}
                    action={
                        <CustomButton size="small" startIcon={<RefreshIcon />} onClick={() => void load()}>
                            Retry
                        </CustomButton>
                    }
                >
                    {state.message}
                </Alert>
            )}

            {state.status === "ready" && <OrderDetails order={state.order} onRefresh={() => void load()} />}
        </PageContainer>
    );
};

export default OrderConfirmation;
