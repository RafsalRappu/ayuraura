import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export interface BreadcrumbItem {
    label: string;
    path: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
    return (
        <MuiBreadcrumbs
            aria-label="breadcrumb"
            separator={<NavigateNextIcon fontSize="small" />}
            sx={{ mb: 4, "& .MuiBreadcrumbs-li": { display: "flex" } }}
        >
            {items.map((item, index) =>
                index === items.length - 1 ? (
                    <Typography key={item.path} color="text.primary" aria-current="page">
                        {item.label}
                    </Typography>
                ) : (
                    <Link
                        key={item.path}
                        component={RouterLink}
                        to={item.path}
                        underline="hover"
                        color="inherit"
                    >
                        {item.label}
                    </Link>
                )
            )}
        </MuiBreadcrumbs>
    );
};

export default Breadcrumbs;
