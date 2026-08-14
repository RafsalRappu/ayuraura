import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    FormControlLabel,
    Grid,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
} from "@mui/material";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

import { errorMessage } from "../../api/client";
import { uploadImage } from "../../api/admin";
import type { ProductPayload } from "../../api/products";
import { resizeImage } from "../../utils/resizeImage";
import type { Product, ProductVariant } from "../../types/product";

const ICON_OPTIONS: { value: Product["icon"]; label: string }[] = [
    { value: "lip", label: "Lip care" },
    { value: "face", label: "Face care" },
    { value: "eye", label: "Eye care" },
    { value: "hair", label: "Hair care" },
    { value: "body", label: "Body care" },
];

interface FormState {
    slug: string;
    name: string;
    price: string;
    category: string;
    image: string;
    icon: Product["icon"];
    shortDescription: string;
    description: string;
    ingredients: string;
    benefits: string;
    howToUse: string;
    featured: boolean;
    bestseller: boolean;
    newArrival: boolean;
    rating: string;
    reviewCount: string;
    inStock: boolean;
    variants: string;
}

const emptyForm: FormState = {
    slug: "",
    name: "",
    price: "",
    category: "",
    image: "",
    icon: "face",
    shortDescription: "",
    description: "",
    ingredients: "",
    benefits: "",
    howToUse: "",
    featured: false,
    bestseller: false,
    newArrival: false,
    rating: "",
    reviewCount: "",
    inStock: true,
    variants: "",
};

const variantsToLines = (variants: ProductVariant[]) =>
    variants.map((variant) => `${variant.label} | ${variant.price}`).join("\n");

const linesToVariants = (value: string): ProductVariant[] =>
    value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [label, price] = line.split("|");
            return { label: (label ?? "").trim(), price: Number((price ?? "").trim()) };
        })
        .filter((variant) => variant.label && Number.isFinite(variant.price));

const toForm = (product: Product): FormState => ({
    slug: product.slug,
    name: product.name,
    price: String(product.price),
    category: product.category,
    image: product.image ?? "",
    icon: product.icon,
    shortDescription: product.shortDescription,
    description: product.description,
    ingredients: product.ingredients.join("\n"),
    benefits: product.benefits.join("\n"),
    howToUse: product.howToUse ?? "",
    featured: product.featured,
    bestseller: product.bestseller,
    newArrival: product.newArrival,
    rating: product.rating === undefined ? "" : String(product.rating),
    reviewCount: product.reviewCount === undefined ? "" : String(product.reviewCount),
    inStock: product.inStock,
    variants: variantsToLines(product.variants),
});

const toLines = (value: string) =>
    value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

const toPayload = (form: FormState): ProductPayload => ({
    slug: form.slug.trim() || undefined,
    name: form.name.trim(),
    price: Number(form.price),
    category: form.category.trim(),
    image: form.image.trim() || null,
    icon: form.icon,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    ingredients: toLines(form.ingredients),
    benefits: toLines(form.benefits),
    howToUse: form.howToUse.trim() || null,
    featured: form.featured,
    bestseller: form.bestseller,
    newArrival: form.newArrival,
    rating: form.rating.trim() === "" ? null : Number(form.rating),
    reviewCount: form.reviewCount.trim() === "" ? null : Number(form.reviewCount),
    inStock: form.inStock,
    variants: linesToVariants(form.variants),
});

interface ProductFormProps {
    /** Absent when creating a new product. */
    product?: Product;
    categories: string[];
    submitting: boolean;
    onSubmit: (payload: ProductPayload) => void;
    onCancel: () => void;
}

const ProductForm = ({ product, categories, submitting, onSubmit, onCancel }: ProductFormProps) => {
    const [form, setForm] = useState<FormState>(() => (product ? toForm(product) : emptyForm));
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setForm(product ? toForm(product) : emptyForm);
        setUploadError(null);
    }, [product]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
        setForm((current) => ({ ...current, [key]: value }));

    const missing = useMemo(
        () =>
            !form.name.trim() ||
            !form.category.trim() ||
            !form.shortDescription.trim() ||
            !form.description.trim() ||
            form.price.trim() === "" ||
            !Number.isFinite(Number(form.price)),
        [form]
    );

    const handleFile = async (file: File | undefined) => {
        if (!file) return;

        setUploading(true);
        setUploadError(null);
        try {
            const resized = await resizeImage(file);
            const url = await uploadImage(resized, file.name);
            set("image", url);
        } catch (error) {
            setUploadError(errorMessage(error, "Could not upload the image."));
        } finally {
            setUploading(false);
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    return (
        <Box
            component="form"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit(toPayload(form));
            }}
        >
            <Grid container spacing={2.5}>
                <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                        label="Product name"
                        value={form.name}
                        onChange={(event) => set("name", event.target.value)}
                        required
                        fullWidth
                        autoFocus
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        label="Price (₹)"
                        value={form.price}
                        onChange={(event) => set("price", event.target.value)}
                        required
                        fullWidth
                        type="number"
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                        freeSolo
                        options={categories}
                        value={form.category}
                        onInputChange={(_, value) => set("category", value)}
                        renderInput={(params) => (
                            <TextField {...params} label="Category" required fullWidth />
                        )}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Page URL"
                        value={form.slug}
                        onChange={(event) => set("slug", event.target.value)}
                        fullWidth
                        helperText="Leave blank to build it from the name."
                    />
                </Grid>

                <Grid size={12}>
                    <TextField
                        label="Short description"
                        value={form.shortDescription}
                        onChange={(event) => set("shortDescription", event.target.value)}
                        required
                        fullWidth
                        helperText="One line, shown on product cards and search results."
                    />
                </Grid>

                <Grid size={12}>
                    <TextField
                        label="Full description"
                        value={form.description}
                        onChange={(event) => set("description", event.target.value)}
                        required
                        fullWidth
                        multiline
                        minRows={4}
                    />
                </Grid>

                <Grid size={12}>
                    <Divider>
                        <Chip label="Image" size="small" />
                    </Divider>
                </Grid>

                <Grid size={{ xs: 12, sm: 4 }}>
                    <Box
                        sx={{
                            height: 160,
                            borderRadius: 3,
                            border: "1px dashed",
                            borderColor: "divider",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            bgcolor: "#f8f8f6",
                        }}
                    >
                        {form.image ? (
                            <Box
                                component="img"
                                src={form.image}
                                alt=""
                                sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                            />
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No image — an icon is used instead
                            </Typography>
                        )}
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, sm: 8 }}>
                    <Stack spacing={2}>
                        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={
                                    uploading ? <CircularProgress size={16} /> : <PhotoCameraOutlinedIcon />
                                }
                                disabled={uploading}
                            >
                                {uploading ? "Uploading…" : "Upload image"}
                                <input
                                    ref={fileInput}
                                    hidden
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => void handleFile(event.target.files?.[0])}
                                />
                            </Button>

                            {form.image && (
                                <Button
                                    color="inherit"
                                    startIcon={<DeleteOutlineIcon />}
                                    onClick={() => set("image", "")}
                                >
                                    Remove
                                </Button>
                            )}
                        </Stack>

                        <TextField
                            label="Image URL"
                            value={form.image}
                            onChange={(event) => set("image", event.target.value)}
                            fullWidth
                            size="small"
                            helperText="Filled in automatically after an upload. Large photos are resized before sending."
                        />

                        <TextField
                            select
                            label="Fallback icon"
                            value={form.icon}
                            onChange={(event) => set("icon", event.target.value as Product["icon"])}
                            fullWidth
                            size="small"
                            helperText="Shown when there is no image."
                        >
                            {ICON_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                </Grid>

                {uploadError && (
                    <Grid size={12}>
                        <Alert severity="error" onClose={() => setUploadError(null)}>
                            {uploadError}
                        </Alert>
                    </Grid>
                )}

                <Grid size={12}>
                    <Divider>
                        <Chip label="Details" size="small" />
                    </Divider>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Ingredients"
                        value={form.ingredients}
                        onChange={(event) => set("ingredients", event.target.value)}
                        fullWidth
                        multiline
                        minRows={4}
                        helperText="One per line."
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Benefits"
                        value={form.benefits}
                        onChange={(event) => set("benefits", event.target.value)}
                        fullWidth
                        multiline
                        minRows={4}
                        helperText="One per line."
                    />
                </Grid>

                <Grid size={12}>
                    <TextField
                        label="Variants"
                        value={form.variants}
                        onChange={(event) => set("variants", event.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        helperText="One per line: Label | Price — e.g. 30ml | 499. Leave blank if this product has no size/pack options."
                    />
                </Grid>

                <Grid size={12}>
                    <TextField
                        label="How to use"
                        value={form.howToUse}
                        onChange={(event) => set("howToUse", event.target.value)}
                        fullWidth
                        multiline
                        minRows={2}
                    />
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                        label="Rating"
                        value={form.rating}
                        onChange={(event) => set("rating", event.target.value)}
                        fullWidth
                        type="number"
                        slotProps={{ htmlInput: { min: 0, max: 5, step: 0.1 } }}
                    />
                </Grid>

                <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField
                        label="Review count"
                        value={form.reviewCount}
                        onChange={(event) => set("reviewCount", event.target.value)}
                        fullWidth
                        type="number"
                        slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap" }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.inStock}
                                    onChange={(event) => set("inStock", event.target.checked)}
                                />
                            }
                            label="In stock"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.featured}
                                    onChange={(event) => set("featured", event.target.checked)}
                                />
                            }
                            label="Featured"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.bestseller}
                                    onChange={(event) => set("bestseller", event.target.checked)}
                                />
                            }
                            label="Bestseller"
                        />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.newArrival}
                                    onChange={(event) => set("newArrival", event.target.checked)}
                                />
                            }
                            label="New arrival"
                        />
                    </Stack>
                </Grid>

                <Grid size={12}>
                    <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                        <Button onClick={onCancel} color="inherit" disabled={submitting}>
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            disabled={submitting || uploading || missing}
                            startIcon={submitting ? <CircularProgress size={16} /> : undefined}
                        >
                            {product ? "Save changes" : "Add product"}
                        </Button>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default ProductForm;
