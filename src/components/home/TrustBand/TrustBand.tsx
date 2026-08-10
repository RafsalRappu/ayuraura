import { Box, Grid, Typography } from "@mui/material";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";

import PageContainer from "../../common/PageContainer";

const stats = [
    {
        icon: VerifiedUserOutlinedIcon,
        title: "BAMS Doctor Formulated",
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
        <PageContainer component="section">
            <Grid container spacing={4}>
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Grid key={stat.title} size={{ xs: 12, sm: 6, md: 3 }}>
                            <Box sx={{ textAlign: "center", px: 2 }}>
                                <Box
                                    sx={{
                                        width: 64,
                                        height: 64,
                                        borderRadius: "50%",
                                        bgcolor: "success.main",
                                        opacity: 0.9,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        mx: "auto",
                                        mb: 2,
                                    }}
                                >
                                    <Icon sx={{ color: "#fff", fontSize: 30 }} />
                                </Box>

                                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    {stat.title}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    {stat.description}
                                </Typography>
                            </Box>
                        </Grid>
                    );
                })}
            </Grid>
        </PageContainer>
    );
};

export default TrustBand;
