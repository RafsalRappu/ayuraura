import { Box, Divider, IconButton, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import SpaIcon from "@mui/icons-material/Spa";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import PageContainer from "../../common/PageContainer";
import { siteConfig, whatsappLink } from "../../../config/site";

const productLinks = [
    { label: "All Products", path: "/products" },
    { label: "Face Care", path: "/products?category=Face%20Care" },
    { label: "Lip Care", path: "/products?category=Lip%20Care" },
    { label: "Hair Care", path: "/products?category=Hair%20Care" },
];

const companyLinks = [
    { label: "About Us", path: "/about" },
    { label: "Contact", path: "/contact" },
    { label: "FAQs", path: "/#faq" },
];

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <Box component="footer" sx={{ bgcolor: "primary.dark", color: "rgba(255,255,255,0.85)" }}>
            <PageContainer disableGutters>
                <Box sx={{ py: { xs: 6, md: 8 }, px: { xs: 3, md: 0 } }}>
                    <Box
                        sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: { xs: 5, md: 4 },
                            justifyContent: "space-between",
                        }}
                    >
                        <Box sx={{ maxWidth: 320 }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
                                <SpaIcon sx={{ color: "#fff" }} />
                                <Typography variant="h5" sx={{ color: "#fff" }}>
                                    {siteConfig.name}
                                </Typography>
                            </Stack>

                            <Typography variant="body2" sx={{ mb: 3, color: "rgba(255,255,255,0.7)" }}>
                                Handcrafted Ayurvedic skincare formulated by a qualified BAMS doctor —
                                natural ingredients, traditional recipes, made in small batches.
                            </Typography>

                            <Stack direction="row" spacing={1}>
                                <IconButton
                                    component="a"
                                    href={siteConfig.social.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="AyuAura on Instagram"
                                    sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                >
                                    <InstagramIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                    component="a"
                                    href={siteConfig.social.facebook}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="AyuAura on Facebook"
                                    sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                >
                                    <FacebookIcon fontSize="small" />
                                </IconButton>

                                <IconButton
                                    component="a"
                                    href={whatsappLink("Hi AyuAura, I have a question.")}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Chat with AyuAura on WhatsApp"
                                    sx={{ color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                                >
                                    <WhatsAppIcon fontSize="small" />
                                </IconButton>
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" sx={{ color: "#fff", mb: 2, fontWeight: 600 }}>
                                Shop
                            </Typography>

                            <Stack spacing={1.2}>
                                {productLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        component={RouterLink}
                                        to={link.path}
                                        underline="hover"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </Stack>
                        </Box>

                        <Box>
                            <Typography variant="subtitle1" sx={{ color: "#fff", mb: 2, fontWeight: 600 }}>
                                Company
                            </Typography>

                            <Stack spacing={1.2}>
                                {companyLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        component={RouterLink}
                                        to={link.path}
                                        underline="hover"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </Stack>
                        </Box>

                        <Box sx={{ minWidth: 240 }}>
                            <Typography variant="subtitle1" sx={{ color: "#fff", mb: 2, fontWeight: 600 }}>
                                Get in Touch
                            </Typography>

                            <Stack spacing={1.5}>
                                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                                    <PlaceOutlinedIcon fontSize="small" sx={{ mt: 0.3 }} />
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                        {siteConfig.contact.address.locality}, {siteConfig.contact.address.region},{" "}
                                        {siteConfig.contact.address.country}
                                    </Typography>
                                </Stack>

                                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                    <WhatsAppIcon fontSize="small" />
                                    <Link
                                        href={whatsappLink()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        underline="hover"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {siteConfig.contact.whatsappDisplay}
                                    </Link>
                                </Stack>

                                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                    <EmailOutlinedIcon fontSize="small" />
                                    <Link
                                        href={`mailto:${siteConfig.contact.email}`}
                                        underline="hover"
                                        sx={{ color: "rgba(255,255,255,0.7)" }}
                                    >
                                        {siteConfig.contact.email}
                                    </Link>
                                </Stack>
                            </Stack>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 5, borderColor: "rgba(255,255,255,0.15)" }} />

                    <Typography variant="body2" sx={{ textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                        © {year} {siteConfig.name}. All rights reserved.
                    </Typography>
                </Box>
            </PageContainer>
        </Box>
    );
};

export default Footer;
