import { Box, Divider, List, ListItemButton, ListItemText, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";

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

interface FilterGroupProps {
    title: string;
    options: { label: string; value: string }[];
    selected: string;
    onSelect: (value: string) => void;
}

const FilterGroup = ({ title, options, selected, onSelect }: FilterGroupProps) => (
    <Box>
        <Typography variant="overline" component="h3" sx={{ display: "block", mb: 1, color: "text.secondary" }}>
            {title}
        </Typography>

        <List disablePadding sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {options.map((option) => {
                const active = selected === option.value;

                return (
                    <ListItemButton
                        key={option.value}
                        selected={active}
                        aria-pressed={active}
                        onClick={() => onSelect(option.value)}
                        sx={(theme) => ({
                            py: 0.75,
                            px: 1.5,
                            borderRadius: 2.5,
                            color: active ? "primary.dark" : "text.secondary",
                            "&:hover": { color: "text.primary" },
                            "&.Mui-selected": {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.16) },
                            },
                        })}
                    >
                        <ListItemText
                            primary={option.label}
                            slotProps={{ primary: { sx: { fontSize: "0.9rem", fontWeight: active ? 700 : 500 } } }}
                        />
                        {active && <CheckRoundedIcon sx={{ fontSize: 18 }} />}
                    </ListItemButton>
                );
            })}
        </List>
    </Box>
);

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
        <Box sx={{ p: { xs: 3, md: 3 }, width: { xs: 300, md: "100%" } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 3 }}>
                <TuneRoundedIcon fontSize="small" color="primary" />
                <Typography variant="h6">Filter Products</Typography>
            </Stack>

            <FilterGroup
                title="Category"
                options={[{ label: "All", value: "all" }, ...categories.map((category) => ({ label: category, value: category }))]}
                selected={selectedCategory}
                onSelect={handleCategory}
            />

            <Divider sx={{ my: 3, borderStyle: "dashed" }} />

            <FilterGroup title="Product Type" options={tags} selected={selectedTag} onSelect={handleTag} />
        </Box>
    );
};

export default ProductsSidebar;
