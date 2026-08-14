import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { errorMessage } from "../../api/client";
import { deleteReview, fetchAllReviews, updateReviewStatus } from "../../api/reviews";
import StarRating from "../../components/common/StarRating";
import type { AdminReview, ReviewStatus } from "../../types/review";

const STATUS_LABEL: Record<ReviewStatus, string> = {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
};

const STATUS_COLOR: Record<ReviewStatus, "warning" | "success" | "error"> = {
    pending: "warning",
    approved: "success",
    rejected: "error",
};

const truncate = (text: string, max = 60) => (text.length > max ? `${text.slice(0, max)}…` : text);

const AdminReviews = () => {
    const [reviews, setReviews] = useState<AdminReview[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [selected, setSelected] = useState<AdminReview | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setReviews(await fetchAllReviews());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load reviews."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const handleSetStatus = async (status: ReviewStatus) => {
        if (!selected) return;

        setSaving(true);
        setSaveError(null);
        try {
            const updated = await updateReviewStatus(selected.id, status);
            setReviews((current) => current.map((review) => (review.id === updated.id ? updated : review)));
            setSelected(null);
        } catch (error) {
            setSaveError(errorMessage(error, "Could not update this review."));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selected) return;

        const confirmed = window.confirm(`Delete this review by ${selected.authorName}?`);
        if (!confirmed) return;

        setSaving(true);
        setSaveError(null);
        try {
            await deleteReview(selected.id);
            setReviews((current) => current.filter((review) => review.id !== selected.id));
            setSelected(null);
        } catch (error) {
            setSaveError(errorMessage(error, "Could not delete this review."));
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
                        Reviews
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? "Loading…" : `${reviews.length} review${reviews.length === 1 ? "" : "s"}`}
                    </Typography>
                </Box>

                <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                    Refresh
                </Button>
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
                            <TableCell>Product</TableCell>
                            <TableCell>Author</TableCell>
                            <TableCell>Rating</TableCell>
                            <TableCell>Comment</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Date</TableCell>
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

                        {!loading && reviews.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    No reviews yet.
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            reviews.map((review) => (
                                <TableRow key={review.id} hover onClick={() => setSelected(review)} sx={{ cursor: "pointer" }}>
                                    <TableCell>{review.productName}</TableCell>
                                    <TableCell>{review.authorName}</TableCell>
                                    <TableCell>
                                        <StarRating value={review.rating} size={14} />
                                    </TableCell>
                                    <TableCell>{truncate(review.comment)}</TableCell>
                                    <TableCell>
                                        <Chip label={STATUS_LABEL[review.status]} color={STATUS_COLOR[review.status]} size="small" />
                                    </TableCell>
                                    <TableCell>{new Date(review.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={selected !== null} onClose={() => (saving ? undefined : setSelected(null))} maxWidth="sm" fullWidth>
                <DialogTitle>{selected && `Review by ${selected.authorName}`}</DialogTitle>

                <DialogContent dividers>
                    {selected && (
                        <Stack spacing={2.5}>
                            {saveError && (
                                <Alert severity="error" onClose={() => setSaveError(null)}>
                                    {saveError}
                                </Alert>
                            )}

                            <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {selected.productName}
                                </Typography>
                                <StarRating value={selected.rating} />
                                <Typography sx={{ mt: 1.5 }}>{selected.comment}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                                    {new Date(selected.createdAt).toLocaleString()}
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
                                <Button
                                    color="error"
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={() => void handleDelete()}
                                    disabled={saving}
                                >
                                    Delete
                                </Button>

                                <Stack direction="row" spacing={1.5}>
                                    {selected.status !== "rejected" && (
                                        <Button
                                            color="error"
                                            variant="outlined"
                                            onClick={() => void handleSetStatus("rejected")}
                                            disabled={saving}
                                        >
                                            Reject
                                        </Button>
                                    )}
                                    {selected.status !== "approved" && (
                                        <Button
                                            variant="contained"
                                            onClick={() => void handleSetStatus("approved")}
                                            disabled={saving}
                                            startIcon={saving ? <CircularProgress size={16} /> : undefined}
                                        >
                                            Approve
                                        </Button>
                                    )}
                                </Stack>
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AdminReviews;
