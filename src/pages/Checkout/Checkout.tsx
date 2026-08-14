import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert, Box, CircularProgress, Divider, Stack, TextField, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import SEO from "../../components/common/SEO";

import { useCart } from "../../data/useCart";
import { useCustomerAuth } from "../../data/useCustomerAuth";
import { buildOrderWhatsAppMessage, cartTotal, orderShortCode } from "../../data/cart";
import { createOrder, payOrder, verifyOrder } from "../../api/orders";
import { validateCouponCode } from "../../api/coupons";
import { ApiError, errorMessage } from "../../api/client";
import { loadRazorpayCheckout } from "../../utils/loadRazorpayCheckout";
import { siteConfig, whatsappLink } from "../../config/site";
import type { CheckoutItemInput, Order } from "../../types/order";

type Stage = "form" | "awaiting-payment" | "payment-unavailable" | "payment-cancelled";

const Checkout = () => {
    const navigate = useNavigate();
    const { items, clear } = useCart();
    const { customer } = useCustomerAuth();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [address, setAddress] = useState("");

    // Prefill from a signed-in account — still editable, and only overwrites
    // fields the shopper hasn't already started typing into.
    useEffect(() => {
        if (!customer) return;
        setName((current) => current || customer.name);
        setPhone((current) => current || customer.phone);
        setEmail((current) => current || customer.email || "");
    }, [customer]);

    const [stage, setStage] = useState<Stage>("form");
    const [order, setOrder] = useState<Order | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [couponInput, setCouponInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
    const [couponChecking, setCouponChecking] = useState(false);
    const [couponError, setCouponError] = useState<string | null>(null);

    const toItemInputs = (): CheckoutItemInput[] =>
        items.map((item) => ({
            slug: item.slug,
            quantity: item.quantity,
            ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
        }));

    // Guards against landing on /checkout directly with nothing in the cart —
    // not against an in-progress/placed order, whose own clear() empties the
    // cart as a side effect. `order` is set in the same tick as that clear(),
    // so it's what keeps this from redirecting away mid-submission.
    if (items.length === 0 && stage === "form" && !order) {
        return <Navigate to="/products" replace />;
    }

    const startPayment = async (placedOrder: Order) => {
        try {
            const pay = await payOrder(placedOrder.publicId);
            await loadRazorpayCheckout();

            if (!window.Razorpay) {
                throw new Error("The payment widget did not load. Check your connection and try again.");
            }

            const razorpay = new window.Razorpay({
                key: pay.keyId,
                amount: Math.round(pay.amount * 100),
                currency: pay.currency,
                order_id: pay.razorpayOrderId,
                name: siteConfig.name,
                prefill: { name, contact: phone, ...(email ? { email } : {}) },
                theme: { color: siteConfig.themeColor },
                handler: (response) => {
                    void (async () => {
                        try {
                            await verifyOrder(placedOrder.publicId, response);
                            navigate(`/order/${placedOrder.publicId}`);
                        } catch (err) {
                            setError(
                                errorMessage(
                                    err,
                                    "Payment went through but could not be confirmed — please contact us with your order number."
                                )
                            );
                        }
                    })();
                },
                modal: {
                    ondismiss: () => setStage("payment-cancelled"),
                },
            });

            razorpay.open();
            setStage("awaiting-payment");
        } catch (err) {
            // Expected when Razorpay isn't configured yet — anything else is a
            // genuine failure worth surfacing alongside the same WhatsApp fallback.
            if (!(err instanceof ApiError && err.status === 503)) {
                setError(errorMessage(err, "Online payment isn't available right now."));
            }
            setStage("payment-unavailable");
        }
    };

    const handleApplyCoupon = async () => {
        const code = couponInput.trim();
        if (!code) return;

        setCouponChecking(true);
        setCouponError(null);
        try {
            const result = await validateCouponCode(code, toItemInputs());
            if (!result.valid) {
                setCouponError(result.message ?? "That code isn't valid.");
                setAppliedCoupon(null);
                return;
            }
            setAppliedCoupon({ code, discountAmount: result.discountAmount });
        } catch (err) {
            setCouponError(errorMessage(err, "Could not check that code."));
            setAppliedCoupon(null);
        } finally {
            setCouponChecking(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput("");
        setCouponError(null);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const placedOrder = await createOrder(
                toItemInputs(),
                { name, phone, ...(email ? { email } : {}), ...(address ? { address } : {}) },
                appliedCoupon?.code
            );
            // Set together: `order` is what keeps the empty-cart redirect guard
            // above from firing once clear() empties the cart as a side effect.
            setOrder(placedOrder);
            clear();
            await startPayment(placedOrder);
        } catch (err) {
            setError(errorMessage(err, "Could not place your order."));
        } finally {
            setSubmitting(false);
        }
    };

    const missing = !name.trim() || !phone.trim();

    const summarySubtotal = order ? order.amount + order.discountAmount : cartTotal(items);
    const summaryDiscount = order ? order.discountAmount : (appliedCoupon?.discountAmount ?? 0);
    const summaryCode = order ? order.couponCode : appliedCoupon?.code;

    return (
        <PageContainer>
            <SEO title="Checkout" description="Complete your AyuAura order." path="/checkout" noindex />

            <Breadcrumbs items={[{ label: "Home", path: "/" }, { label: "Checkout", path: "/checkout" }]} />

            <Typography variant="h1" component="h1" sx={{ fontSize: { xs: "2.2rem", md: "2.6rem" }, mb: 4 }}>
                Checkout
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 900 }}>
                <Box sx={{ flex: "1 1 320px" }}>
                    {stage === "form" && (
                        <Box component="form" onSubmit={(event) => void handleSubmit(event)}>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                                    {error}
                                </Alert>
                            )}

                            <Stack spacing={2.5}>
                                <TextField
                                    label="Full name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    required
                                    fullWidth
                                    autoFocus
                                />
                                <TextField
                                    label="Phone number"
                                    value={phone}
                                    onChange={(event) => setPhone(event.target.value)}
                                    required
                                    fullWidth
                                />
                                <TextField
                                    label="Email (optional)"
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    fullWidth
                                />
                                <TextField
                                    label="Delivery address (optional)"
                                    value={address}
                                    onChange={(event) => setAddress(event.target.value)}
                                    fullWidth
                                    multiline
                                    minRows={2}
                                    helperText="You can also arrange delivery details over WhatsApp after ordering."
                                />

                                {appliedCoupon ? (
                                    <Alert
                                        severity="success"
                                        onClose={removeCoupon}
                                        sx={{ "& .MuiAlert-message": { flex: 1 } }}
                                    >
                                        Code <strong>{appliedCoupon.code}</strong> applied — ₹
                                        {appliedCoupon.discountAmount} off.
                                    </Alert>
                                ) : (
                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                                        <TextField
                                            label="Coupon code (optional)"
                                            value={couponInput}
                                            onChange={(event) => {
                                                setCouponInput(event.target.value);
                                                setCouponError(null);
                                            }}
                                            error={Boolean(couponError)}
                                            helperText={couponError ?? " "}
                                            fullWidth
                                        />
                                        <CustomButton
                                            variant="outlined"
                                            onClick={() => void handleApplyCoupon()}
                                            disabled={couponChecking || !couponInput.trim()}
                                            startIcon={couponChecking ? <CircularProgress size={16} /> : undefined}
                                            sx={{ mt: 0.5, whiteSpace: "nowrap" }}
                                        >
                                            Apply
                                        </CustomButton>
                                    </Stack>
                                )}

                                <CustomButton
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    disabled={submitting || missing}
                                    startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                                >
                                    {submitting ? "Placing order…" : "Place order"}
                                </CustomButton>
                            </Stack>
                        </Box>
                    )}

                    {stage === "awaiting-payment" && (
                        <Box sx={{ py: 6, textAlign: "center" }}>
                            <CircularProgress color="primary" sx={{ mb: 2 }} />
                            <Typography color="text.secondary">
                                Complete your payment in the window that opened.
                            </Typography>
                        </Box>
                    )}

                    {(stage === "payment-unavailable" || stage === "payment-cancelled") && order && (
                        <Box>
                            {error && (
                                <Alert severity="warning" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            <Alert severity="success" sx={{ mb: 3 }}>
                                Order #{orderShortCode(order.publicId)} placed
                                {stage === "payment-cancelled" ? " — payment was cancelled." : "."}
                            </Alert>

                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                {stage === "payment-unavailable"
                                    ? "Online payment isn't set up yet — send us the order over WhatsApp and we'll confirm payment with you directly."
                                    : "You can try paying again, or confirm the order over WhatsApp instead."}
                            </Typography>

                            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                                {stage === "payment-cancelled" && (
                                    <CustomButton
                                        variant="contained"
                                        size="large"
                                        onClick={() => void startPayment(order)}
                                    >
                                        Retry payment
                                    </CustomButton>
                                )}

                                <CustomButton
                                    variant="outlined"
                                    size="large"
                                    startIcon={<WhatsAppIcon />}
                                    component="a"
                                    href={whatsappLink(buildOrderWhatsAppMessage(order.items, order.publicId))}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Confirm via WhatsApp
                                </CustomButton>
                            </Stack>
                        </Box>
                    )}
                </Box>

                <Box sx={{ flex: "1 1 280px", maxWidth: 360 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Order summary
                    </Typography>

                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {(order?.items ?? items).map((item) => (
                            <Stack
                                key={`${item.slug}::${item.variantLabel ?? ""}`}
                                direction="row"
                                sx={{ justifyContent: "space-between" }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    {item.name}
                                    {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                                </Typography>
                                <Typography variant="body2">₹{item.price * item.quantity}</Typography>
                            </Stack>
                        ))}
                    </Stack>

                    <Divider sx={{ mb: 2 }} />

                    {summaryDiscount > 0 && (
                        <Stack spacing={0.5} sx={{ mb: 2 }}>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                <Typography variant="body2" color="text.secondary">
                                    Subtotal
                                </Typography>
                                <Typography variant="body2">₹{summarySubtotal}</Typography>
                            </Stack>
                            <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                <Typography variant="body2" color="success.main">
                                    Discount{summaryCode ? ` (${summaryCode})` : ""}
                                </Typography>
                                <Typography variant="body2" color="success.main">
                                    −₹{summaryDiscount}
                                </Typography>
                            </Stack>
                        </Stack>
                    )}

                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: 600 }}>Total</Typography>
                        <Typography sx={{ fontWeight: 700 }} color="primary">
                            ₹{summarySubtotal - summaryDiscount}
                        </Typography>
                    </Stack>
                </Box>
            </Box>
        </PageContainer>
    );
};

export default Checkout;
