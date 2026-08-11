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
    IconButton,
    Paper,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RefreshIcon from "@mui/icons-material/Refresh";

import { errorMessage } from "../../api/client";
import { createProduct, deleteProduct, fetchProducts, updateProduct } from "../../api/products";
import type { ProductPayload } from "../../api/products";
import { useProducts } from "../../data/useProducts";
import type { Product } from "../../types/product";
import ProductForm from "./ProductForm";

type Editing = { mode: "create" } | { mode: "edit"; product: Product } | null;

const AdminDashboard = () => {
    const { reload: reloadPublicCatalogue } = useProducts();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [editing, setEditing] = useState<Editing>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            setProducts(await fetchProducts({ fresh: true }));
        } catch (error) {
            setLoadError(errorMessage(error, "Could not load products."));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const categories = useMemo(
        () => Array.from(new Set(products.map((product) => product.category))).sort(),
        [products]
    );

    const handleSubmit = async (payload: ProductPayload) => {
        if (!editing) return;

        setSubmitting(true);
        setFormError(null);
        try {
            if (editing.mode === "create") {
                await createProduct(payload);
                setToast(`Added "${payload.name}".`);
            } else {
                await updateProduct(editing.product.slug, payload);
                setToast(`Saved "${payload.name}".`);
            }

            setEditing(null);
            await load();
            // Refresh the catalogue the public pages are holding, too.
            reloadPublicCatalogue();
        } catch (error) {
            setFormError(errorMessage(error, "Could not save the product."));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (product: Product) => {
        const confirmed = window.confirm(
            `Delete "${product.name}"? This removes it from the site immediately.`
        );
        if (!confirmed) return;

        setDeletingSlug(product.slug);
        try {
            await deleteProduct(product.slug);
            setToast(`Deleted "${product.name}".`);
            await load();
            reloadPublicCatalogue();
        } catch (error) {
            setLoadError(errorMessage(error, "Could not delete the product."));
        } finally {
            setDeletingSlug(null);
        }
    };

    const tags = (product: Product) =>
        [
            product.featured ? "Featured" : null,
            product.bestseller ? "Bestseller" : null,
            product.newArrival ? "New" : null,
        ].filter(Boolean) as string[];

    return (
        <Box>
            <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}
            >
                <Box>
                    <Typography variant="h5" component="h1">
                        Products
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                        {loading ? "Loading…" : `${products.length} product${products.length === 1 ? "" : "s"} live on the site`}
                    </Typography>
                </Box>

                <Stack direction="row" spacing={1}>
                    <Button startIcon={<RefreshIcon />} onClick={() => void load()} disabled={loading}>
                        Refresh
                    </Button>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                            setFormError(null);
                            setEditing({ mode: "create" });
                        }}
                    >
                        Add product
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
                            <TableCell sx={{ width: 72 }} />
                            <TableCell>Product</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell>Tags</TableCell>
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

                        {!loading && products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                                    No products yet — add the first one, or run{" "}
                                    <code>npm run db:seed</code> to import the original catalogue.
                                </TableCell>
                            </TableRow>
                        )}

                        {!loading &&
                            products.map((product) => (
                                <TableRow key={product.id} hover>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                width: 48,
                                                height: 48,
                                                borderRadius: 2,
                                                overflow: "hidden",
                                                bgcolor: "#f8f8f6",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            {product.image ? (
                                                <Box
                                                    component="img"
                                                    src={product.image}
                                                    alt=""
                                                    sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">
                                                    {product.icon}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>

                                    <TableCell>
                                        <Typography sx={{ fontWeight: 600 }}>{product.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            /products/{product.slug}
                                        </Typography>
                                    </TableCell>

                                    <TableCell>{product.category}</TableCell>

                                    <TableCell align="right">₹{product.price}</TableCell>

                                    <TableCell>
                                        <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                                            {tags(product).map((tag) => (
                                                <Chip key={tag} label={tag} size="small" variant="outlined" />
                                            ))}
                                        </Stack>
                                    </TableCell>

                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                                            <Tooltip title="View on site">
                                                <IconButton
                                                    size="small"
                                                    component="a"
                                                    href={`/products/${product.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Edit">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => {
                                                        setFormError(null);
                                                        setEditing({ mode: "edit", product });
                                                    }}
                                                >
                                                    <EditOutlinedIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>

                                            <Tooltip title="Delete">
                                                <span>
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        disabled={deletingSlug === product.slug}
                                                        onClick={() => void handleDelete(product)}
                                                    >
                                                        {deletingSlug === product.slug ? (
                                                            <CircularProgress size={16} />
                                                        ) : (
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </span>
                                            </Tooltip>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={editing !== null}
                onClose={() => (submitting ? undefined : setEditing(null))}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    {editing?.mode === "edit" ? `Edit ${editing.product.name}` : "Add a product"}
                </DialogTitle>

                <DialogContent dividers>
                    {formError && (
                        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setFormError(null)}>
                            {formError}
                        </Alert>
                    )}

                    {editing && (
                        <ProductForm
                            {...(editing.mode === "edit" ? { product: editing.product } : {})}
                            categories={categories}
                            submitting={submitting}
                            onSubmit={(payload) => void handleSubmit(payload)}
                            onCancel={() => setEditing(null)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Snackbar
                open={toast !== null}
                autoHideDuration={4000}
                onClose={() => setToast(null)}
                message={toast ?? ""}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            />
        </Box>
    );
};

export default AdminDashboard;
