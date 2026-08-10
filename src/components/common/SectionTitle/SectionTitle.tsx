import { Box, Typography } from "@mui/material";
import type { ElementType } from "react";

interface Props {
    title: string;
    subtitle?: string;
    align?: "left" | "center";
    component?: ElementType;
}

const SectionTitle = ({
    title,
    subtitle,
    align = "center",
    component = "h2",
}: Props) => {
    return (
        <Box sx={{ textAlign: align, mb: 6 }}>
            <Typography variant="h2" component={component} color="primary" gutterBottom>
                {title}
            </Typography>

            {subtitle && (
                <Typography
                    sx={{
                        maxWidth: 650,
                        mx: align === "center" ? "auto" : 0,
                        color: "text.secondary",
                    }}
                >
                    {subtitle}
                </Typography>
            )}
        </Box>
    );
};

export default SectionTitle;