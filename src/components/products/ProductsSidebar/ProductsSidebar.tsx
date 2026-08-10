import { Box, Chip, Divider, Stack, Typography } from "@mui/material";

interface ProductsSidebarProps {
    categories: string[];
    selectedCategory: string;
    selectedTag: string;
    onCategoryChange: (category: string) => void;
    onTagChange: (tag: string) => void;
    onClose?: () => void;
}

const tags = [
    { label: "All Products", value: "all" },
    { label: "Featured", value: "featured" },
    { label: "Best Seller", value: "bestseller" },
    { label: "New Arrival", value: "newArrival" },
];

const ProductsSidebar = ({
    categories,
    selectedCategory,
    selectedTag,
    onCategoryChange,
    onTagChange,
    onClose,
}: ProductsSidebarProps) => {
    const handleCategory = (category: string) => {
        onCategoryChange(category);
        onClose?.();
    };

    const handleTag = (tag: string) => {
        onTagChange(tag);
        onClose?.();
    };

    return (
        <Box sx={{ p: { xs: 3, md: 4 }, width: { xs: "100%", md: 280 } }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
                Filter Products
            </Typography>

            <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                Category
            </Typography>

            <Stack spacing={1}>
                <Chip
                    label="All"
                    clickable
                    size="small"
                    color={selectedCategory === "all" ? "primary" : "default"}
                    onClick={() => handleCategory("all")}
                />
                {categories.map((category) => (
                    <Chip
                        key={category}
                        label={category}
                        clickable
                        size="small"
                        color={selectedCategory === category ? "primary" : "default"}
                        onClick={() => handleCategory(category)}
                    />
                ))}
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle2" sx={{ mb: 1, color: "text.secondary" }}>
                Product Type
            </Typography>

            <Stack spacing={1}>
                {tags.map((tag) => (
                    <Chip
                        key={tag.value}
                        label={tag.label}
                        clickable
                        size="small"
                        color={selectedTag === tag.value ? "primary" : "default"}
                        onClick={() => handleTag(tag.value)}
                    />
                ))}
            </Stack>
        </Box>
    );
};

export default ProductsSidebar;
