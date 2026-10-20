import { useMemo } from "react";
import { Box, Grid, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import InstagramIcon from "@mui/icons-material/Instagram";

import PageContainer from "../../common/PageContainer";
import CustomButton from "../../common/CustomButton";
import ProductMedia from "../../products/ProductMedia";
import SectionTitle from "../../common/SectionTitle";
import Reveal from "../../common/Reveal";
import { useProducts } from "../../../data/useProducts";
import { siteConfig } from "../../../config/site";
import { CSS_EASE_OUT } from "../../../theme/motion";

const SocialProof = () => {
    const { products, status } = useProducts();

    const galleryProducts = useMemo(() => products.slice(0, 6), [products]);

    return (
        <PageContainer component="section">
            <SectionTitle
                title="Follow Our Journey"
                subtitle="Real routines, fresh batches and behind-the-scenes moments — join our community on Instagram."
            />

            <Grid container spacing={2} sx={{ mb: 6 }}>
                {status === "loading" &&
                    Array.from({ length: 6 }, (_, index) => (
                        <Grid key={index} size={{ xs: 6, sm: 4, md: 2 }}>
                            <Skeleton
                                variant="rounded"
                                sx={{ width: "100%", height: "auto", aspectRatio: "1 / 1", borderRadius: 5 }}
                            />
                        </Grid>
                    ))}

                {status !== "loading" &&
                    galleryProducts.map((product, index) => (
                        <Grid key={product.id} size={{ xs: 6, sm: 4, md: 2 }}>
                            <Reveal delay={index * 0.06} y={16}>
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
                                        borderRadius: 5,
                                        overflow: "hidden",
                                        bgcolor: "background.neutral",
                                        // Hairline frame drawn above the photo, so white-background shots keep an edge.
                                        "&::after": {
                                            content: '""',
                                            position: "absolute",
                                            inset: 0,
                                            borderRadius: "inherit",
                                            boxShadow: (theme) => `inset 0 0 0 1px ${alpha(theme.palette.grey[500], 0.16)}`,
                                            pointerEvents: "none",
                                        },
                                        // Every other tile sits a little lower — a loose, collage rhythm.
                                        transform: { md: index % 2 ? "translateY(18px)" : "none" },
                                        "&:hover [data-media-hover]": { transform: "scale(1.1)" },
                                        "&:hover .overlay, &:focus-visible .overlay": { opacity: 1 },
                                        "&:hover .overlay svg, &:focus-visible .overlay svg": { transform: "scale(1)" },
                                    }}
                                >
                                    <ProductMedia product={product} iconSize="2.5rem" fit="cover" />

                                    <Box
                                        className="overlay"
                                        sx={(theme) => ({
                                            position: "absolute",
                                            inset: 0,
                                            background: `linear-gradient(160deg, ${alpha(theme.palette.primary.main, 0.55)}, ${alpha(theme.palette.primary.darker, 0.75)})`,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity: 0,
                                            transition: `opacity .4s ${CSS_EASE_OUT}`,
                                        })}
                                    >
                                        <InstagramIcon
                                            sx={{
                                                color: "#fff",
                                                fontSize: 30,
                                                transform: "scale(0.6)",
                                                transition: `transform .5s ${CSS_EASE_OUT}`,
                                            }}
                                        />
                                    </Box>
                                </Box>
                            </Reveal>
                        </Grid>
                    ))}
            </Grid>

            <Box sx={{ textAlign: "center" }}>
                <Typography color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
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
