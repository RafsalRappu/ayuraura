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
    FormControlLabel,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { errorMessage } from "../../api/client";
import { createCoupon, deleteCoupon, fetchCoupons, updateCoupon } from "../../api/coupons";
import type { CouponPayload } from "../../api/coupons";
import type { Coupon, CouponType } from "../../types/coupon";

type Editing = { mode: "create" } | { mode: "edit"; coupon: Coupon } | null;

interface FormState {
    code: string;
    type: CouponType;
    value: string;
    startsAt: string;
    expiresAt: string;
    usageLimit: string;
    active: boolean;
}

const emptyForm: FormState = {
    code: "",
    type: "flat",
    value: "",
    startsAt: "",
    expiresAt: "",
    usageLimit: "",
    active: true,
};

const toDateInput = (iso?: string) => (iso ? iso.slice(0, 10) : "");

const toForm = (coupon: Coupon): FormState => ({
    code: coupon.code,
    type: coupon.type,
    value: String(coupon.value),
    startsAt: toDateInput(coupon.startsAt),
    expiresAt: toDateInput(coupon.expiresAt),
    usageLimit: coupon.usageLimit === undefined ? "" : String(coupon.usageLimit),
    active: coupon.active,
});

const toPayload = (form: FormState): CouponPayload => ({
    code: form.code.trim().toUpperCase(),
    type: form.type,
    value: Number(form.value),
    startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    usageLimit: form.usageLimit.trim() === "" ? null : Number(form.usageLimit),
    active: form.active,
});

const formatValue = (coupon: Coupon) => (coupon.type === "flat" ? `₹${coupon.value} off` : `${coupon.value}% off`);

const formatValidity = (coupon: Coupon) => {
    if (!coupon.startsAt && !coupon.expiresAt) return "Always";
    const from = coupon.startsAt ? new Date(coupon.startsAt).toLocaleDateString() : "now";
    const to = coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "no end";
    return `${from} → ${to}`;
};

const AdminCoupons = () => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [editing, setEditing] = useState<Editing>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setCoupons(await fetchCoupons());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load coupons."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const openCreate = () => {
        setForm(emptyForm);
        setFormError(null);
        setEditing({ mode: "create" });
    };

    const openEdit = (coupon: Coupon) => {
        setForm(toForm(coupon));
        setFormError(null);
        setEditing({ mode: "edit", coupon });
    };

    const missing = useMemo(() => !form.code.trim() || form.value.trim() === "", [form]);

    const handleSubmit = async () => {
        if (!editing) return;

        setSubmitting(true);
        setFormError(null);
        try {
            const payload = toPayload(form);
            const saved = editing.mode === "create" ? await createCoupon(payload) : await updateCoupon(editing.coupon.code, payload);

            setCoupons((current) => {
                if (editing.mode === "create") return [saved, ...current];
                return current.map((coupon) => (coupon.id === saved.id ? saved : coupon));
            });
            setEditing(null);
        } catch (error) {
            setFormError(errorMessage(error, "Could not save this coupon."));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (coupon: Coupon) => {
        const confirmed = window.confirm(`Delete the coupon "${coupon.code}"?`);
        if (!confirmed) return;

        setDeleting(true);
        try {
            await deleteCoupon(coupon.code);
            setCoupons((current) => current.filter((c) => c.id !== coupon.id));
            setEditing(null);
        } catch (error) {
            setFormError(errorMessage(error, "Could not delete this coupon."));
        } finally {
            setDeleting(false);
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
                        Coupons
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? "Loading…" : `${coupons.length} coupon${coupons.length === 1 ? "" : "s"}`}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                        Refresh
                    </Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
                        Add coupon
                    </Button>
                </Stack>
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
                            <TableCell>Code</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Validity</TableCell>
                            <TableCell align="right">Usage</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Actions</TableCell>
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

                        {!loading && coupons.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    <LocalOfferOutlinedIcon sx={{ fontSize: 32, mb: 1, opacity: 0.4 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        No coupons yet — add one to offer a discount at checkout.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            coupons.map((coupon) => (
                                <TableRow key={coupon.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{coupon.code}</TableCell>
                                    <TableCell>{formatValue(coupon)}</TableCell>
                                    <TableCell>{formatValidity(coupon)}</TableCell>
                                    <TableCell align="right">
                                        {coupon.timesUsed}
                                        {coupon.usageLimit === undefined ? "" : ` / ${coupon.usageLimit}`}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={coupon.active ? "Active" : "Disabled"}
                                            color={coupon.active ? "success" : "default"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Edit or delete">
                                            <IconButton size="small" onClick={() => openEdit(coupon)}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={editing !== null} onClose={() => (submitting ? undefined : setEditing(null))} maxWidth="sm" fullWidth>
                <DialogTitle>{editing?.mode === "edit" ? `Edit ${editing.coupon.code}` : "Add a coupon"}</DialogTitle>

                <DialogContent dividers>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormError(null)}>
                            {formError}
                        </Alert>
                    )}

                    <Grid container spacing={2.5}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                label="Code"
                                value={form.code}
                                onChange={(event) => set("code", event.target.value.toUpperCase())}
                                required
                                fullWidth
                                autoFocus
                                helperText="Letters, numbers, hyphens and underscores."
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                                select
                                label="Type"
                                value={form.type}
                                onChange={(event) => set("type", event.target.value as CouponType)}
                                fullWidth
                            >
                                <MenuItem value="flat">Flat (₹)</MenuItem>
                                <MenuItem value="percentage">Percentage (%)</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3 }}>
                            <TextField
                                label="Value"
                                value={form.value}
                                onChange={(event) => set("value", event.target.value)}
                                required
                                fullWidth
                                type="number"
                                slotProps={{ htmlInput: { min: 1, max: form.type === "percentage" ? 100 : undefined } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                label="Starts"
                                value={form.startsAt}
                                onChange={(event) => set("startsAt", event.target.value)}
                                fullWidth
                                type="date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                helperText="Optional"
                            />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 4 }}>
                            <TextField
                                label="Expires"
                                value={form.expiresAt}
                                onChange={(event) => set("expiresAt", event.target.value)}
                                fullWidth
                                type="date"
                                slotProps={{ inputLabel: { shrink: true } }}
                                helperText="Optional"
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Usage limit"
                                value={form.usageLimit}
                                onChange={(event) => set("usageLimit", event.target.value)}
                                fullWidth
                                type="number"
                                slotProps={{ htmlInput: { min: 1 } }}
                                helperText="Optional — blank means unlimited"
                            />
                        </Grid>

                        <Grid size={12}>
                            <FormControlLabel
                                control={<Switch checked={form.active} onChange={(event) => set("active", event.target.checked)} />}
                                label="Active"
                            />
                        </Grid>

                        <Grid size={12}>
                            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                                {editing?.mode === "edit" ? (
                                    <Button
                                        color="error"
                                        startIcon={deleting ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
                                        onClick={() => void handleDelete(editing.coupon)}
                                        disabled={submitting || deleting}
                                    >
                                        Delete
                                    </Button>
                                ) : (
                                    <span />
                                )}

                                <Stack direction="row" spacing={2}>
                                    <Button onClick={() => setEditing(null)} color="inherit" disabled={submitting || deleting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => void handleSubmit()}
                                        disabled={submitting || deleting || missing}
                                        startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                                    >
                                        Save
                                    </Button>
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AdminCoupons;
