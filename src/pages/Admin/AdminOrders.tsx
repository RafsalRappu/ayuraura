import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    InputAdornment,
    MenuItem,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";

import { errorMessage } from "../../api/client";
import { fetchOrders, updateOrderStatus } from "../../api/orders";
import { orderShortCode } from "../../data/cart";
import type { AdminOrder, OrderStatus } from "../../types/order";

const STATUS_OPTIONS: OrderStatus[] = ["pending", "paid", "failed", "cancelled"];
const STATUS_FILTER_OPTIONS: Array<OrderStatus | "all"> = ["all", ...STATUS_OPTIONS];

const STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    cancelled: "Cancelled",
};

const STATUS_COLOR: Record<OrderStatus, "warning" | "success" | "error" | "default"> = {
    pending: "warning",
    paid: "success",
    failed: "error",
    cancelled: "default",
};

interface AdminOrdersProps {
    initialStatusFilter?: string;
}

const AdminOrders = ({ initialStatusFilter }: AdminOrdersProps) => {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">(
        (initialStatusFilter as OrderStatus | undefined) ?? "all"
    );

    const [selected, setSelected] = useState<AdminOrder | null>(null);
    const [statusDraft, setStatusDraft] = useState<OrderStatus>("pending");
    const [noteDraft, setNoteDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setOrders(await fetchOrders());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load orders."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const filteredOrders = useMemo(() => {
        const q = query.trim().toLowerCase();
        return orders.filter((order) => {
            const matchesStatus = statusFilter === "all" || order.status === statusFilter;
            const matchesQuery =
                q === "" ||
                order.customerName.toLowerCase().includes(q) ||
                order.customerPhone.toLowerCase().includes(q) ||
                orderShortCode(order.publicId).toLowerCase().includes(q);
            return matchesStatus && matchesQuery;
        });
    }, [orders, query, statusFilter]);

    const openOrder = (order: AdminOrder) => {
        setSelected(order);
        setStatusDraft(order.status);
        setNoteDraft("");
        setSaveError(null);
    };

    const handleSave = async () => {
        if (!selected) return;

        if (selected.status === "paid" && statusDraft !== "paid") {
            const confirmed = window.confirm(
                `Change order #${orderShortCode(selected.publicId)} from Paid to ${STATUS_LABEL[statusDraft]}? ` +
                    "This order was verified as paid — only do this to correct a mistake."
            );
            if (!confirmed) return;
        }

        setSaving(true);
        setSaveError(null);
        try {
            const updated = await updateOrderStatus(selected.publicId, statusDraft, noteDraft.trim() || undefined);
            setOrders((current) => current.map((order) => (order.publicId === updated.publicId ? updated : order)));
            setSelected(null);
        } catch (error) {
            setSaveError(errorMessage(error, "Could not update this order."));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box>
            <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}
            >
                <Box>
                    <Typography variant="h5" component="h1">
                        Orders
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? "Loading…" : `${orders.length} order${orders.length === 1 ? "" : "s"}`}
                    </Typography>
                </Box>

                <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                    Refresh
                </Button>
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: "wrap" }}>
                <TextField
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by customer, phone or order #…"
                    size="small"
                    sx={{ minWidth: { xs: "100%", sm: 300 } }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <TextField
                    select
                    label="Status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as OrderStatus | "all")}
                    size="small"
                    sx={{ minWidth: 160 }}
                >
                    {STATUS_FILTER_OPTIONS.map((status) => (
                        <MenuItem key={status} value={status}>
                            {status === "all" ? "All statuses" : STATUS_LABEL[status]}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>

            {loadError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
                    {loadError}
                </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Order</TableCell>
                            <TableCell>Customer</TableCell>
                            <TableCell align="right">Items</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Placed</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={28} />
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading && orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    <ReceiptLongOutlinedIcon sx={{ fontSize: 32, mb: 1, opacity: 0.4 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        No orders yet.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading && orders.length > 0 && filteredOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    <Typography variant="body2" color="text.secondary">
                                        No orders match this search or filter.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            filteredOrders.map((order) => (
                                <TableRow key={order.publicId} hover onClick={() => openOrder(order)} sx={{ cursor: "pointer" }}>
                                    <TableCell>#{orderShortCode(order.publicId)}</TableCell>

                                    <TableCell>
                                        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                                            <Typography sx={{ fontWeight: 600 }}>{order.customerName}</Typography>
                                            {order.customerId !== undefined && (
                                                <Chip label="Account" size="small" variant="outlined" />
                                            )}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            {order.customerPhone}
                                        </Typography>
                                    </TableCell>

                                    <TableCell align="right">
                                        {order.items.reduce((total, item) => total + item.quantity, 0)}
                                    </TableCell>

                                    <TableCell align="right">₹{order.amount}</TableCell>

                                    <TableCell>
                                        <Chip label={STATUS_LABEL[order.status]} color={STATUS_COLOR[order.status]} size="small" />
                                    </TableCell>

                                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={selected !== null} onClose={() => (saving ? undefined : setSelected(null))} maxWidth="sm" fullWidth>
                <DialogTitle>{selected && `Order #${orderShortCode(selected.publicId)}`}</DialogTitle>

                <DialogContent dividers>
                    {selected && (
                        <Stack spacing={2.5}>
                            {saveError && (
                                <Alert severity="error" onClose={() => setSaveError(null)}>
                                    {saveError}
                                </Alert>
                            )}

                            <Box>
                                <Typography sx={{ fontWeight: 600 }}>{selected.customerName}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {selected.customerPhone}
                                </Typography>
                                {selected.customerEmail && (
                                    <Typography variant="body2" color="text.secondary">
                                        {selected.customerEmail}
                                    </Typography>
                                )}
                                {selected.customerAddressLine1 && (
                                    <Typography variant="body2" color="text.secondary">
                                        {selected.customerAddressLine1}
                                    </Typography>
                                )}
                                {selected.customerAddressLine2 && (
                                    <Typography variant="body2" color="text.secondary">
                                        {selected.customerAddressLine2}
                                    </Typography>
                                )}
                                {(selected.customerCity || selected.customerState || selected.customerPincode) && (
                                    <Typography variant="body2" color="text.secondary">
                                        {[selected.customerCity, selected.customerState].filter(Boolean).join(", ")}
                                        {selected.customerPincode ? ` – ${selected.customerPincode}` : ""}
                                    </Typography>
                                )}
                            </Box>

                            <Stack spacing={1}>
                                {selected.items.map((item) => (
                                    <Stack
                                        key={`${item.slug}::${item.variantLabel ?? ""}`}
                                        direction="row"
                                        sx={{ justifyContent: "space-between" }}
                                    >
                                        <Typography variant="body2">
                                            {item.name}
                                            {item.variantLabel ? ` (${item.variantLabel})` : ""} × {item.quantity}
                                        </Typography>
                                        <Typography variant="body2">₹{item.price * item.quantity}</Typography>
                                    </Stack>
                                ))}
                                {selected.discountAmount > 0 && (
                                    <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                                        <Typography variant="body2" color="success.main">
                                            Discount{selected.couponCode ? ` (${selected.couponCode})` : ""}
                                        </Typography>
                                        <Typography variant="body2" color="success.main">
                                            −₹{selected.discountAmount}
                                        </Typography>
                                    </Stack>
                                )}
                                <Stack
                                    direction="row"
                                    sx={{ justifyContent: "space-between", pt: 1, borderTop: 1, borderColor: "divider" }}
                                >
                                    <Typography sx={{ fontWeight: 600 }}>Total</Typography>
                                    <Typography sx={{ fontWeight: 700 }} color="primary">
                                        ₹{selected.amount}
                                    </Typography>
                                </Stack>
                            </Stack>

                            <TextField
                                select
                                label="Status"
                                value={statusDraft}
                                onChange={(event) => setStatusDraft(event.target.value as OrderStatus)}
                                fullWidth
                            >
                                {STATUS_OPTIONS.map((status) => (
                                    <MenuItem key={status} value={status}>
                                        {STATUS_LABEL[status]}
                                    </MenuItem>
                                ))}
                            </TextField>

                            <TextField
                                label="Note"
                                value={noteDraft}
                                onChange={(event) => setNoteDraft(event.target.value)}
                                fullWidth
                                multiline
                                minRows={2}
                                placeholder={selected.adminNote || "e.g. confirmed via WhatsApp, UPI screenshot"}
                                helperText="Leave blank to keep the existing note."
                            />

                            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                                <Button onClick={() => setSelected(null)} color="inherit" disabled={saving}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => void handleSave()}
                                    disabled={saving}
                                    startIcon={saving ? <CircularProgress size={16} /> : undefined}
                                >
                                    Save
                                </Button>
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AdminOrders;
