import { Box, Grid, Typography } from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";

import PageContainer from "../../common/PageContainer";
import CustomButton from "../../common/CustomButton";
import ProductMedia from "../../products/ProductMedia";
import SectionTitle from "../../common/SectionTitle";
import { products } from "../../../data/products";
import { siteConfig } from "../../../config/site";

const galleryProducts = products.slice(0, 6);

const SocialProof = () => {
    return (
        <PageContainer component="section">
            <SectionTitle
                title="Follow Our Journey"
                subtitle="Real routines, fresh batches and behind-the-scenes moments — join our community on Instagram."
            />

            <Grid container spacing={2} sx={{ mb: 5 }}>
                {galleryProducts.map((product) => (
                    <Grid key={product.id} size={{ xs: 6, sm: 4, md: 2 }}>
                        <Box
                            component="a"
                            href={siteConfig.social.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`View ${product.name} on Instagram`}
                            sx={{
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "100%",
                                aspectRatio: "1 / 1",
                                borderRadius: 4,
                                overflow: "hidden",
                                background: "#f8f8f6",
                                "&:hover .overlay": { opacity: 1 },
                            }}
                        >
                            <ProductMedia product={product} iconSize="2.5rem" />

                            <Box
                                className="overlay"
                                sx={{
                                    position: "absolute",
                                    inset: 0,
                                    bgcolor: "rgba(53, 94, 59, 0.55)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: 0,
                                    transition: "opacity .3s",
                                }}
                            >
                                <InstagramIcon sx={{ color: "#fff", fontSize: 28 }} />
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                    @ayuaura
                </Typography>

                <CustomButton
                    variant="outlined"
                    startIcon={<InstagramIcon />}
                    component="a"
                    href={siteConfig.social.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Follow on Instagram
                </CustomButton>
            </Box>
        </PageContainer>
    );
};

export default SocialProof;
