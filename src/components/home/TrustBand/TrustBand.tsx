import { Box, Container, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import Reveal from "../../common/Reveal";
import { CSS_EASE_OUT } from "../../../theme/motion";

const stats = [
    {
        icon: VerifiedUserOutlinedIcon,
        title: "Ayurvedic Practitioner Formulated",
        description: "Every product is developed by a qualified Ayurvedic physician.",
    },
    {
        icon: SpaOutlinedIcon,
        title: "100% Natural Ingredients",
        description: "No synthetic fragrances, parabens or harsh preservatives.",
    },
    {
        icon: FavoriteBorderIcon,
        title: "Handmade in Small Batches",
        description: "Crafted fresh, never mass-produced, for consistent quality.",
    },
    {
        icon: LocalShippingOutlinedIcon,
        title: "Shipped Across India",
        description: "Order over WhatsApp — we'll handle the rest, doorstep to doorstep.",
    },
];

const TrustBand = () => {
    return (
        // Pulled up over the hero's lower edge so the band reads as one floating panel.
        <Container component="section" maxWidth="xl" sx={{ position: "relative", zIndex: 2, mt: { xs: -5, md: -8 } }}>
            <Box
                sx={(theme) => ({
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
                    gap: { xs: 1, lg: 0 },
                    p: { xs: 1.5, md: 2 },
                    borderRadius: 6,
                    bgcolor: alpha(theme.palette.background.paper, 0.86),
                    backdropFilter: "blur(16px)",
                    border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                    boxShadow: theme.customShadows.z20,
                })}
            >
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <Reveal key={stat.title} delay={index * 0.08} y={16}>
                            <Box
                                sx={(theme) => ({
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 2,
                                    p: { xs: 2, md: 2.5 },
                                    borderRadius: 4,
                                    transition: `background-color .4s ${CSS_EASE_OUT}`,
                                    "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                                    "&:hover .trust-icon": { transform: "rotate(-8deg) scale(1.06)" },
                                })}
                            >
                                <Box
                                    className="trust-icon"
                                    sx={(theme) => ({
                                        width: 48,
                                        height: 48,
                                        flexShrink: 0,
                                        borderRadius: 3.5,
                                        display: "grid",
                                        placeItems: "center",
                                        color: "primary.main",
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        transition: `transform .5s ${CSS_EASE_OUT}`,
                                    })}
                                >
                                    <Icon sx={{ fontSize: 24 }} />
                                </Box>

                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.35 }}>
                                        {stat.title}
                                    </Typography>

                                    <Typography variant="body2" color="text.secondary">
                                        {stat.description}
                                    </Typography>
                                </Box>
                            </Box>
                        </Reveal>
                    );
                })}
            </Box>
        </Container>
    );
};

export default TrustBand;
