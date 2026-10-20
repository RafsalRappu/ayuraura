import { Box, Breadcrumbs as MuiBreadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export interface BreadcrumbItem {
    label: string;
    path: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

const Separator = () => (
    <Box
        component="span"
        sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: "text.disabled", display: "inline-block" }}
    />
);

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
    return (
        <MuiBreadcrumbs
            aria-label="breadcrumb"
            separator={<Separator />}
            sx={{ mb: { xs: 3, md: 4 }, fontSize: "0.875rem", "& .MuiBreadcrumbs-li": { display: "flex" } }}
        >
            {items.map((item, index) =>
                index === items.length - 1 ? (
                    <Typography
                        key={item.path}
                        variant="body2"
                        color="text.disabled"
                        aria-current="page"
                        sx={{ fontWeight: 500, maxWidth: { xs: 180, sm: "none" } }}
                        noWrap
                    >
                        {item.label}
                    </Typography>
                ) : (
                    <Link
                        key={item.path}
                        component={RouterLink}
                        to={item.path}
                        underline="hover"
                        variant="body2"
                        sx={{ color: "text.primary", fontWeight: 500 }}
                    >
                        {item.label}
                    </Link>
                )
            )}
        </MuiBreadcrumbs>
    );
};

export default Breadcrumbs;
