import { Box, Chip, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SpaIcon from "@mui/icons-material/Spa";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";

import { motion } from "framer-motion";

import CustomButton from "../../common/CustomButton";
import PageContainer from "../../common/PageContainer";
import ProductMedia from "../../products/ProductMedia";
import { whatsappLink } from "../../../config/site";
import { products } from "../../../data/products";

import styles from "./Hero.module.css";

const heroProducts = products.filter((product) => product.featured).slice(0, 3);

const Hero = () => {
    return (
        <Box className={styles.hero}>
            <PageContainer>
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: { xs: 4, md: 6 } }}>
                    {/* Left */}

                    <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                        <motion.div
                            initial={{ opacity: 0, y: 60 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: .8 }}
                        >
                            <Chip
                                icon={<SpaIcon />}
                                label="Handcrafted Ayurvedic Skincare"
                                color="success"
                                sx={{ mb: 3 }}
                            />

                            <Typography
                                variant="h1"
                                sx={{
                                    mb: 3,
                                    lineHeight: 1.1,
                                    color: "primary.main",
                                }}
                            >
                                Nature's Beauty
                                <br />
                                Rooted in Ayurveda
                            </Typography>

                            <Typography
                                variant="h6"
                                color="text.secondary"
                                sx={{
                                    mb: 4,
                                    fontWeight: 400,
                                }}
                            >
                                Crafted by a qualified BAMS Ayurvedic Doctor using
                                traditional herbal ingredients that nourish your skin
                                naturally.
                            </Typography>

                            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
                                <CustomButton
                                    variant="contained"
                                    startIcon={<LocalMallOutlinedIcon />}
                                    component={RouterLink}
                                    to="/products"
                                >
                                    Explore Products
                                </CustomButton>

                                <CustomButton
                                    variant="outlined"
                                    startIcon={<WhatsAppIcon />}
                                    component="a"
                                    href={whatsappLink("Hi AyuAura, I'd like a skincare consultation.")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    WhatsApp Consultation
                                </CustomButton>
                            </Stack>
                        </motion.div>
                    </Box>

                    {/* Right */}

                    <Box sx={{ width: { xs: "100%", md: "50%" } }}>
                        <motion.div
                            initial={{ opacity: 0, scale: .9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: .4 }}
                        >
                            <Box className={styles.productArea}>
                                {heroProducts.map((product) => (
                                    <Box
                                        key={product.id}
                                        className={styles.card}
                                        component={RouterLink}
                                        to={`/products/${product.slug}`}
                                    >
                                        <Box className={styles.cardMedia}>
                                            <ProductMedia product={product} iconSize="1.8rem" />
                                        </Box>

                                        <Typography variant="h6">{product.name}</Typography>

                                        <Typography color="primary">₹{product.price}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </motion.div>
                    </Box>
                </Box>
            </PageContainer>
        </Box>
    );
};

export default Hero;