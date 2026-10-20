import { useMemo } from "react";
import { Box, Container, Skeleton, Stack, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import SpaIcon from "@mui/icons-material/Spa";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

import { motion } from "framer-motion";

import CustomButton from "../../common/CustomButton";
import ProductMedia from "../../products/ProductMedia";
import { whatsappLink } from "../../../config/site";
import { useProducts } from "../../../data/useProducts";
import { CSS_EASE_OUT, EASE_OUT, fadeUpItem, staggerContainer } from "../../../theme/motion";
import { greyChannel } from "../../../theme/palette";

const drift = keyframes`
  0%   { transform: translate3d(0, 0, 0) scale(1); }
  50%  { transform: translate3d(-4%, 6%, 0) scale(1.08); }
  100% { transform: translate3d(3%, -3%, 0) scale(0.96); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/** Slow-drifting color fields and a dotted grid that fades out from the showcase. */
const Backdrop = () => (
    <Box aria-hidden sx={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <Box
            sx={(theme) => ({
                position: "absolute",
                width: { xs: 420, md: 720 },
                height: { xs: 420, md: 720 },
                top: { xs: -160, md: -260 },
                right: { xs: -180, md: -200 },
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${alpha(theme.palette.primary.light, 0.42)}, transparent 62%)`,
                filter: "blur(10px)",
                animation: `${drift} 18s ease-in-out infinite alternate`,
            })}
        />
        <Box
            sx={(theme) => ({
                position: "absolute",
                width: { xs: 360, md: 560 },
                height: { xs: 360, md: 560 },
                bottom: { xs: -200, md: -260 },
                left: { xs: -180, md: -160 },
                borderRadius: "50%",
                background: `radial-gradient(circle at center, ${alpha(theme.palette.secondary.light, 0.36)}, transparent 62%)`,
                filter: "blur(10px)",
                animation: `${drift} 22s ease-in-out infinite alternate-reverse`,
            })}
        />
        <Box
            sx={(theme) => ({
                position: "absolute",
                inset: 0,
                backgroundImage: `radial-gradient(${alpha(theme.palette.grey[500], 0.32)} 1px, transparent 1px)`,
                backgroundSize: "22px 22px",
                maskImage: "radial-gradient(ellipse 60% 70% at 72% 45%, #000 10%, transparent 70%)",
                WebkitMaskImage: "radial-gradient(ellipse 60% 70% at 72% 45%, #000 10%, transparent 70%)",
            })}
        />
    </Box>
);

const cardSx = {
    position: "relative",
    display: "flex",
    flexDirection: { xs: "row", sm: "column" },
    alignItems: "center",
    textAlign: { xs: "left", sm: "center" },
    gap: { xs: 2, sm: 1.25 },
    p: { xs: 2.5, md: 3 },
    height: "100%",
    borderRadius: 6,
    textDecoration: "none",
    color: "inherit",
    bgcolor: (theme: { palette: { background: { paper: string } } }) => alpha(theme.palette.background.paper, 0.78),
    backdropFilter: "blur(16px) saturate(160%)",
    WebkitBackdropFilter: "blur(16px) saturate(160%)",
    border: "1px solid",
    borderColor: "rgba(255, 255, 255, 0.7)",
    boxShadow: (theme: { customShadows: { z16: string } }) => theme.customShadows.z16,
    transition: `transform .6s ${CSS_EASE_OUT}, box-shadow .6s ${CSS_EASE_OUT}`,
} as const;

const mediaSx = {
    position: "relative",
    width: 88,
    height: 88,
    borderRadius: 5,
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bgcolor: "background.neutral",
    flexShrink: 0,
    "&::after": {
        content: '""',
        position: "absolute",
        inset: 0,
        borderRadius: "inherit",
        boxShadow: `inset 0 0 0 1px rgba(${greyChannel}, 0.16)`,
        pointerEvents: "none",
    },
} as const;

const Hero = () => {
    const { products, status } = useProducts();

    const heroProducts = useMemo(
        () => products.filter((product) => product.featured).slice(0, 3),
        [products]
    );

    return (
        <Box
            component="section"
            sx={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                minHeight: { md: "calc(100vh - 84px)" },
                pt: { xs: 5, md: 6 },
                pb: { xs: 10, md: 14 },
            }}
        >
            <Backdrop />

            <Container maxWidth="xl" sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 7, md: 0 } }}>
                    {/* Left */}

                    <Box sx={{ width: { xs: "100%", md: "52%" }, pr: { md: 6 } }}>
                        <motion.div variants={staggerContainer(0.1, 0.05)} initial="hidden" animate="show">
                            <motion.div variants={fadeUpItem}>
                                <Box
                                    sx={(theme) => ({
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 1,
                                        pl: 0.75,
                                        pr: 1.75,
                                        py: 0.6,
                                        mb: 3.5,
                                        borderRadius: 999,
                                        fontSize: "0.8125rem",
                                        fontWeight: 700,
                                        color: "primary.dark",
                                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                                        border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                                    })}
                                >
                                    <Box
                                        component="span"
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            display: "grid",
                                            placeItems: "center",
                                            bgcolor: "primary.main",
                                            color: "primary.contrastText",
                                        }}
                                    >
                                        <SpaIcon sx={{ fontSize: 14 }} />
                                    </Box>
                                    Handcrafted Ayurvedic Skincare
                                </Box>
                            </motion.div>

                            <motion.div variants={fadeUpItem}>
                                <Typography variant="h1" sx={{ mb: 3, color: "text.primary" }}>
                                    Nature's Beauty
                                    <br />
                                    Rooted in{" "}
                                    <Box
                                        component="em"
                                        sx={(theme) => ({
                                            fontStyle: "italic",
                                            pr: "0.08em",
                                            backgroundImage: `linear-gradient(100deg, ${theme.palette.primary.main} 10%, ${theme.palette.primary.light} 55%, ${theme.palette.secondary.main} 95%)`,
                                            backgroundClip: "text",
                                            WebkitBackgroundClip: "text",
                                            color: "transparent",
                                        })}
                                    >
                                        Ayurveda
                                    </Box>
                                </Typography>
                            </motion.div>

                            <motion.div variants={fadeUpItem}>
                                <Typography
                                    color="text.secondary"
                                    sx={{ mb: 5, maxWidth: 540, fontSize: { xs: "1.0625rem", md: "1.1875rem" }, lineHeight: 1.7 }}
                                >
                                    Crafted by a qualified Ayurvedic practitioner using
                                    traditional herbal ingredients that nourish your skin
                                    naturally.
                                </Typography>
                            </motion.div>

                            <motion.div variants={fadeUpItem}>
                                <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                                    <CustomButton
                                        variant="contained"
                                        size="large"
                                        startIcon={<LocalMallOutlinedIcon />}
                                        component={RouterLink}
                                        to="/products"
                                        sx={(theme) => ({ boxShadow: theme.customShadows.primary })}
                                    >
                                        Explore Products
                                    </CustomButton>

                                    <CustomButton
                                        variant="outlined"
                                        size="large"
                                        startIcon={<WhatsAppIcon />}
                                        component="a"
                                        href={whatsappLink("Hi AyuAura, I'd like a skincare consultation.")}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        sx={(theme) => ({ bgcolor: alpha(theme.palette.background.paper, 0.6) })}
                                    >
                                        WhatsApp Consultation
                                    </CustomButton>
                                </Stack>
                            </motion.div>
                        </motion.div>
                    </Box>

                    {/* Right */}

                    <Box sx={{ width: { xs: "100%", md: "48%" }, position: "relative" }}>
                        {/* Slowly turning dashed orbit behind the cards */}
                        <Box
                            aria-hidden
                            sx={(theme) => ({
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: { xs: 340, md: 520 },
                                height: { xs: 340, md: 520 },
                                ml: { xs: "-170px", md: "-260px" },
                                mt: { xs: "-170px", md: "-260px" },
                                borderRadius: "50%",
                                border: `1.5px dashed ${alpha(theme.palette.primary.main, 0.22)}`,
                                animation: `${spin} 60s linear infinite`,
                                "&::after": {
                                    content: '""',
                                    position: "absolute",
                                    top: 34,
                                    left: "50%",
                                    width: 12,
                                    height: 12,
                                    borderRadius: "50%",
                                    bgcolor: "secondary.main",
                                    boxShadow: `0 0 0 6px ${alpha(theme.palette.secondary.main, 0.18)}`,
                                },
                            })}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ delay: 0.35, duration: 0.9, ease: EASE_OUT }}
                        >
                            <Box
                                sx={{
                                    position: "relative",
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                                    gap: { xs: 2, md: 3 },
                                    // Two cards stacked on the left, the third centred on the right.
                                    "& > :nth-of-type(2)": {
                                        gridColumn: { sm: 2 },
                                        gridRow: { sm: "1 / span 2" },
                                        alignSelf: "center",
                                    },
                                }}
                            >
                                {status === "loading"
                                    ? Array.from({ length: 3 }, (_, index) => (
                                          <Box key={index} sx={cardSx}>
                                              <Skeleton variant="rounded" width={88} height={88} sx={{ borderRadius: 5 }} />
                                              <Skeleton variant="text" sx={{ mx: "auto", width: "70%" }} />
                                              <Skeleton variant="text" sx={{ mx: "auto", width: "40%" }} />
                                          </Box>
                                      ))
                                    : heroProducts.map((product, index) => (
                                              // Outer box floats; the card inside lifts on hover — two
                                              // elements so the two transforms never fight.
                                              <Box
                                                  key={product.id}
                                                  sx={{
                                                      animation: `${float} ${7 + index}s ease-in-out ${index * 0.9}s infinite`,
                                                  }}
                                              >
                                                  <Box
                                                      component={RouterLink}
                                                      to={`/products/${product.slug}`}
                                                      sx={{
                                                          ...cardSx,
                                                          "&:hover": {
                                                              transform: "translateY(-8px)",
                                                              boxShadow: (theme) => theme.customShadows.z24,
                                                          },
                                                          "&:hover [data-media-hover]": { transform: "scale(1.08)" },
                                                          "&:hover .hero-arrow": {
                                                              transform: "rotate(45deg)",
                                                              bgcolor: "primary.main",
                                                              color: "primary.contrastText",
                                                          },
                                                      }}
                                                  >
                                                      <Box sx={mediaSx}>
                                                          <ProductMedia product={product} iconSize="1.9rem" fit="cover" />
                                                      </Box>

                                                      <Box sx={{ flex: { xs: 1, sm: "none" }, minWidth: 0, pr: { xs: 4, sm: 0 } }}>
                                                          <Typography variant="h6" component="span" sx={{ display: "block", mb: 0.5 }}>
                                                              {product.name}
                                                          </Typography>

                                                          <Typography color="primary" sx={{ fontWeight: 800 }}>
                                                              ₹{product.price}
                                                          </Typography>
                                                      </Box>

                                                      <Box
                                                          className="hero-arrow"
                                                          aria-hidden
                                                          sx={(theme) => ({
                                                              position: "absolute",
                                                              top: 14,
                                                              right: 14,
                                                              width: 32,
                                                              height: 32,
                                                              flexShrink: 0,
                                                              borderRadius: "50%",
                                                              display: "grid",
                                                              placeItems: "center",
                                                              color: "text.secondary",
                                                              bgcolor: alpha(theme.palette.grey[500], 0.12),
                                                              transition: `transform .5s ${CSS_EASE_OUT}, background-color .3s, color .3s`,
                                                          })}
                                                      >
                                                          <ArrowOutwardRoundedIcon sx={{ fontSize: 18 }} />
                                                      </Box>
                                                  </Box>
                                              </Box>
                                      ))}
                            </Box>
                        </motion.div>
                    </Box>
                </Box>
            </Container>
        </Box>
    );
};

export default Hero;
