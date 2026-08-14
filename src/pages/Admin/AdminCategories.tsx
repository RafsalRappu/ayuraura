import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { errorMessage } from "../../api/client";
import { deleteCategory, fetchCategories, renameCategory } from "../../api/categories";
import type { Category } from "../../types/category";

const AdminCategories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [editing, setEditing] = useState<Category | null>(null);
    const [nameDraft, setNameDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setCategories(await fetchCategories());
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load categories."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const openCategory = (category: Category) => {
        setEditing(category);
        setNameDraft(category.name);
        setSaveError(null);
    };

    const handleRename = async () => {
        if (!editing) return;
        const name = nameDraft.trim();
        if (!name || name === editing.name) return setEditing(null);

        setSaving(true);
        setSaveError(null);
        try {
            const updated = await renameCategory(editing.slug, name);
            setCategories((current) => current.map((c) => (c.id === updated.id ? updated : c)));
            setEditing(null);
        } catch (error) {
            setSaveError(errorMessage(error, "Could not rename this category."));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!editing) return;

        if (editing.productCount > 0) {
            setSaveError(
                `${editing.productCount} product${editing.productCount === 1 ? "" : "s"} still use this category — reassign them first.`
            );
            return;
        }

        const confirmed = window.confirm(`Delete the category "${editing.name}"?`);
        if (!confirmed) return;

        setDeleting(true);
        setSaveError(null);
        try {
            await deleteCategory(editing.slug);
            setCategories((current) => current.filter((c) => c.id !== editing.id));
            setEditing(null);
        } catch (error) {
            setSaveError(errorMessage(error, "Could not delete this category."));
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
                        Categories
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? "Loading…" : `${categories.length} categor${categories.length === 1 ? "y" : "ies"}`}
                    </Typography>
                </Box>

                <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                    Refresh
                </Button>
            </Stack>

            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                Categories are discovered automatically from product data — renaming one here updates every product
                using it; a category still in use can't be deleted.
            </Typography>

            {loadError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
                    {loadError}
                </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Products</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {loading && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                    <CircularProgress size={28} />
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading && categories.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    No categories yet — add a product with a category to get started.
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            categories.map((category) => (
                                <TableRow key={category.id} hover>
                                    <TableCell sx={{ fontWeight: 600 }}>{category.name}</TableCell>
                                    <TableCell align="right">{category.productCount}</TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Rename or delete">
                                            <IconButton size="small" onClick={() => openCategory(category)}>
                                                <EditOutlinedIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={editing !== null} onClose={() => (saving || deleting ? undefined : setEditing(null))} maxWidth="sm" fullWidth>
                <DialogTitle>{editing && `Edit "${editing.name}"`}</DialogTitle>

                <DialogContent dividers>
                    {editing && (
                        <Stack spacing={2.5}>
                            {saveError && (
                                <Alert severity="error" onClose={() => setSaveError(null)}>
                                    {saveError}
                                </Alert>
                            )}

                            <TextField
                                label="Name"
                                value={nameDraft}
                                onChange={(event) => setNameDraft(event.target.value)}
                                required
                                fullWidth
                                autoFocus
                            />

                            <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                                <Button
                                    color="error"
                                    startIcon={deleting ? <CircularProgress size={16} /> : <DeleteOutlineIcon />}
                                    onClick={() => void handleDelete()}
                                    disabled={saving || deleting}
                                >
                                    Delete
                                </Button>

                                <Stack direction="row" spacing={2}>
                                    <Button onClick={() => setEditing(null)} color="inherit" disabled={saving || deleting}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={() => void handleRename()}
                                        disabled={saving || deleting || !nameDraft.trim()}
                                        startIcon={saving ? <CircularProgress size={16} /> : undefined}
                                    >
                                        Save
                                    </Button>
                                </Stack>
                            </Stack>
                        </Stack>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default AdminCategories;
