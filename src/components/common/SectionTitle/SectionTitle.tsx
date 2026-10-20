import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";
import SpaIcon from "@mui/icons-material/Spa";
import type { ElementType } from "react";

import { EASE_OUT } from "../../../theme/motion";

interface Props {
    title: string;
    subtitle?: string;
    align?: "left" | "center";
    component?: ElementType;
    /** Set false where the title sits in a toolbar row and spacing comes from the row. */
    gutterBottom?: boolean;
}

/** Hairline that fades in toward the leaf ornament. */
const Rule = ({ flip = false }: { flip?: boolean }) => (
    <Box
        sx={{
            width: 32,
            height: 1.5,
            borderRadius: 2,
            background: (theme) =>
                `linear-gradient(${flip ? 270 : 90}deg, transparent, ${theme.palette.primary.main})`,
        }}
    />
);

const SectionTitle = ({
    title,
    subtitle,
    align = "center",
    component = "h2",
    gutterBottom = true,
}: Props) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, ease: EASE_OUT }}
        >
            <Box sx={{ textAlign: align, mb: gutterBottom ? { xs: 5, md: 7 } : 0 }}>
                <Box
                    aria-hidden
                    sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                        color: "primary.main",
                    }}
                >
                    {align === "center" && <Rule />}
                    <SpaIcon sx={{ fontSize: 18 }} />
                    <Rule flip />
                </Box>

                <Typography variant="h2" component={component} sx={{ color: "text.primary", mb: subtitle ? 2 : 0 }}>
                    {title}
                </Typography>

                {subtitle && (
                    <Typography
                        sx={{
                            maxWidth: 620,
                            mx: align === "center" ? "auto" : 0,
                            color: "text.secondary",
                            fontSize: { md: "1.0625rem" },
                        }}
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </motion.div>
    );
};

export default SectionTitle;
