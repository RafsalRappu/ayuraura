import { Box, Grid, List, ListItem, ListItemIcon, ListItemText, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import PageContainer from "../../components/common/PageContainer";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import CustomButton from "../../components/common/CustomButton";
import SEO from "../../components/common/SEO";
import { Link as RouterLink } from "react-router-dom";

import { siteConfig } from "../../config/site";
import { breadcrumbSchema } from "../../utils/structuredData";

const values = [
    "Every formulation is reviewed by a qualified BAMS Ayurvedic doctor before it ships.",
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
                description="Learn the story behind AyuAura — Ayurvedic skincare formulated by a qualified BAMS doctor, made in small batches with traditional, chemical-free ingredients."
                path="/about"
                jsonLd={breadcrumbSchema(crumbs)}
            />

            <Breadcrumbs items={crumbs} />

            <SectionTitle
                component="h1"
                title="Rooted in Tradition, Made for Today"
                subtitle="AyuAura began with a simple belief: skincare should be as honest as the ingredients that go into it."
            />

            <Grid container spacing={6} sx={{ mb: { xs: 8, md: 10 }, alignItems: "center" }}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h4" component="h2" gutterBottom>
                        Our Story
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        {siteConfig.name} was founded by a qualified BAMS (Bachelor of Ayurvedic Medicine
                        and Surgery) practitioner who spent years prescribing traditional herbal remedies
                        to patients — and kept hearing the same frustration: modern skincare shelves are
                        full of long ingredient lists nobody can pronounce.
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                        So we started making our own. Every product is formulated using classical
                        Ayurvedic texts as a starting point, tested for real-world routines, and made in
                        small batches so quality never gets diluted by scale.
                    </Typography>

                    <Typography color="text.secondary">
                        Today, AyuAura serves customers across India who want skincare that respects both
                        their skin and their intelligence — no gimmicks, just honest formulations.
                    </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Box
                        sx={{
                            borderRadius: 6,
                            p: { xs: 4, md: 6 },
                            bgcolor: "#F3F0E8",
                            textAlign: "center",
                        }}
                    >
                        <VerifiedUserOutlinedIcon color="primary" sx={{ fontSize: 56, mb: 2 }} />

                        <Typography variant="h5" gutterBottom>
                            Formulated by a BAMS Doctor
                        </Typography>

                        <Typography color="text.secondary">
                            Every AyuAura recipe is reviewed for safety, skin compatibility and
                            traditional accuracy before it ever reaches production.
                        </Typography>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ mb: { xs: 8, md: 10 } }}>
                <Typography variant="h4" component="h2" gutterBottom sx={{ textAlign: "center", mb: 4 }}>
                    What We Stand For
                </Typography>

                <List sx={{ maxWidth: 720, mx: "auto" }}>
                    {values.map((value) => (
                        <ListItem key={value} sx={{ py: 1 }}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                                <CheckCircleOutlineIcon color="success" />
                            </ListItemIcon>
                            <ListItemText primary={value} />
                        </ListItem>
                    ))}
                </List>
            </Box>

            <Box sx={{ textAlign: "center" }}>
                <Typography variant="h5" gutterBottom>
                    Have a question about your skin type?
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Reach out and we'll help you find the right routine.
                </Typography>

                <CustomButton variant="contained" component={RouterLink} to="/contact">
                    Get in Touch
                </CustomButton>
            </Box>
        </PageContainer>
    );
};

export default About;
