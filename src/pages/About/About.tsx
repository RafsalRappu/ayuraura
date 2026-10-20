import { Box, Card, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

import PageContainer from "../../components/common/PageContainer";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import CustomButton from "../../components/common/CustomButton";
import SEO from "../../components/common/SEO";
import Reveal from "../../components/common/Reveal";
import { Link as RouterLink } from "react-router-dom";

import { siteConfig } from "../../config/site";
import { breadcrumbSchema } from "../../utils/structuredData";
import { CSS_EASE_OUT } from "../../theme/motion";

const values = [
    "Every formulation is reviewed by a qualified Ayurvedic practitioner before it ships.",
    "We source herbs and oils from trusted small-batch suppliers, never mass-market fillers.",
    "No parabens, sulphates, synthetic fragrance or added preservatives — ever.",
    "Made fresh in small batches so what you receive is never sitting in a warehouse for months.",
];

const About = () => {
    const crumbs = [
        { label: "Home", path: "/" },
        { label: "About", path: "/about" },
    ];

    return (
        <PageContainer>
            <SEO
                title="About Us"
                description="Learn the story behind AyuAura — Ayurvedic skincare formulated by a qualified Ayurvedic practitioner, made in small batches with traditional, chemical-free ingredients."
                path="/about"
                jsonLd={breadcrumbSchema(crumbs)}
            />

            <Breadcrumbs items={crumbs} />

            <SectionTitle
                component="h1"
                title="Rooted in Tradition, Made for Today"
                subtitle="AyuAura began with a simple belief: skincare should be as honest as the ingredients that go into it."
            />

            <Grid container spacing={{ xs: 5, md: 8 }} sx={{ mb: { xs: 10, md: 14 }, alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Reveal>
                        <Typography variant="h3" component="h2" sx={{ mb: 3 }}>
                            Our Story
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.0625rem", lineHeight: 1.8 }}>
                            {siteConfig.name} was founded by a qualified Ayurvedic practitioner who spent
                            years prescribing traditional herbal remedies to patients — and kept hearing the
                            same frustration: modern skincare shelves are full of long ingredient lists
                            nobody can pronounce.
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 2, fontSize: "1.0625rem", lineHeight: 1.8 }}>
                            So we started making our own. Every product is formulated using classical
                            Ayurvedic texts as a starting point, tested for real-world routines, and made in
                            small batches so quality never gets diluted by scale.
                        </Typography>

                        <Typography color="text.secondary" sx={{ fontSize: "1.0625rem", lineHeight: 1.8 }}>
                            Today, AyuAura serves customers across India who want skincare that respects both
                            their skin and their intelligence — no gimmicks, just honest formulations.
                        </Typography>
                    </Reveal>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Reveal delay={0.12}>
                        <Box
                            sx={(theme) => ({
                                position: "relative",
                                overflow: "hidden",
                                borderRadius: 8,
                                p: { xs: 4, md: 7 },
                                textAlign: "center",
                                color: "primary.contrastText",
                                background: `linear-gradient(150deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.darker} 100%)`,
                                boxShadow: theme.customShadows.z24,
                                // Concentric rings — a quiet nod to the leaf mark.
                                "&::before, &::after": {
                                    content: '""',
                                    position: "absolute",
                                    borderRadius: "50%",
                                    border: `1px solid ${alpha("#fff", 0.14)}`,
                                    pointerEvents: "none",
                                },
                                "&::before": { width: 420, height: 420, top: -160, right: -140 },
                                "&::after": { width: 260, height: 260, bottom: -120, left: -90 },
                            })}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    mx: "auto",
                                    mb: 3,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    bgcolor: alpha("#fff", 0.12),
                                    border: `1px solid ${alpha("#fff", 0.24)}`,
                                }}
                            >
                                <VerifiedUserOutlinedIcon sx={{ fontSize: 40 }} />
                            </Box>

                            <Typography variant="h4" component="h3" gutterBottom sx={{ color: "inherit" }}>
                                Formulated by an Ayurvedic Practitioner
                            </Typography>

                            <Typography sx={{ color: alpha("#fff", 0.78), maxWidth: 420, mx: "auto" }}>
                                Every AyuAura recipe is reviewed for safety, skin compatibility and
                                traditional accuracy before it ever reaches production.
                            </Typography>
                        </Box>
                    </Reveal>
                </Grid>
            </Grid>

            <Box sx={{ mb: { xs: 10, md: 14 } }}>
                <SectionTitle title="What We Stand For" />

                <Grid container spacing={3}>
                    {values.map((value, index) => (
                        <Grid key={value} size={{ xs: 12, sm: 6 }}>
                            <Reveal delay={index * 0.08}>
                                <Card
                                    sx={(theme) => ({
                                        height: "100%",
                                        p: 3,
                                        display: "flex",
                                        gap: 2,
                                        alignItems: "flex-start",
                                        transition: `transform .45s ${CSS_EASE_OUT}, box-shadow .45s ${CSS_EASE_OUT}`,
                                        "&:hover": { transform: "translateY(-4px)", boxShadow: theme.customShadows.z16 },
                                    })}
                                >
                                    <Box
                                        sx={(theme) => ({
                                            width: 40,
                                            height: 40,
                                            flexShrink: 0,
                                            borderRadius: 3,
                                            display: "grid",
                                            placeItems: "center",
                                            color: "primary.main",
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        })}
                                    >
                                        <CheckRoundedIcon />
                                    </Box>
                                    <Typography sx={{ fontWeight: 500, pt: 0.75 }}>{value}</Typography>
                                </Card>
                            </Reveal>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Reveal>
                <Box
                    sx={(theme) => ({
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: 8,
                        px: { xs: 3, md: 8 },
                        py: { xs: 6, md: 8 },
                        bgcolor: "background.neutral",
                        backgroundImage: `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.light, 0.22)}, transparent 45%),
                                          radial-gradient(circle at 100% 100%, ${alpha(theme.palette.secondary.light, 0.24)}, transparent 45%)`,
                    })}
                >
                    <Stack
                        direction={{ xs: "column", md: "row" }}
                        spacing={3}
                        sx={{ alignItems: { xs: "flex-start", md: "center" }, justifyContent: "space-between" }}
                    >
                        <Box>
                            <Typography variant="h3" component="h2" gutterBottom>
                                Have a question about your skin type?
                            </Typography>

                            <Typography color="text.secondary">
                                Reach out and we'll help you find the right routine.
                            </Typography>
                        </Box>

                        <CustomButton
                            variant="contained"
                            size="large"
                            component={RouterLink}
                            to="/contact"
                            endIcon={<ArrowForwardRoundedIcon />}
                            sx={(theme) => ({ flexShrink: 0, boxShadow: theme.customShadows.primary })}
                        >
                            Get in Touch
                        </CustomButton>
                    </Stack>
                </Box>
            </Reveal>
        </PageContainer>
    );
};

export default About;
