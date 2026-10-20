import { Box, Container, Divider, Grid, IconButton, Link, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";

import BrandLogo from "../../common/BrandLogo";
import { siteConfig, whatsappLink } from "../../../config/site";
import { CSS_EASE_OUT } from "../../../theme/motion";
import { serifFont } from "../../../theme/typography";

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

const muted = "rgba(255, 255, 255, 0.64)";

const linkSx = {
    color: muted,
    width: "fit-content",
    transition: `color .3s, transform .4s ${CSS_EASE_OUT}`,
    "&:hover": { color: "#fff", transform: "translateX(3px)" },
} as const;

const socialSx = {
    color: "#fff",
    bgcolor: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    "&:hover": { bgcolor: "primary.main", borderColor: "primary.main" },
} as const;

const ColumnTitle = ({ children }: { children: string }) => (
    <Typography variant="overline" component="h3" sx={{ display: "block", color: "#fff", mb: 2.5, letterSpacing: "0.14em" }}>
        {children}
    </Typography>
);

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <Box
            component="footer"
            sx={{ position: "relative", overflow: "hidden", bgcolor: "grey.900", color: muted }}
        >
            {/* Soft brand glow bleeding in from the corners */}
            <Box
                aria-hidden
                sx={(theme) => ({
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    background: `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.primary.main, 0.32)}, transparent 42%),
                                 radial-gradient(circle at 92% 100%, ${alpha(theme.palette.primary.light, 0.12)}, transparent 40%)`,
                })}
            />

            <Container maxWidth="xl" sx={{ position: "relative", pt: { xs: 8, md: 11 }, pb: 4 }}>
                <Grid container spacing={{ xs: 5, md: 4 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Box sx={{ mb: 2.5 }}>
                            <BrandLogo tone="light" />
                        </Box>

                        <Typography variant="body2" sx={{ mb: 3, color: muted, maxWidth: 340 }}>
                            Handcrafted Ayurvedic skincare formulated by a qualified Ayurvedic
                            practitioner — natural ingredients, traditional recipes, made in small batches.
                        </Typography>

                        <Stack direction="row" spacing={1}>
                            <IconButton
                                component="a"
                                href={siteConfig.social.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="AyuAura on Instagram"
                                sx={socialSx}
                            >
                                <InstagramIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                                component="a"
                                href={siteConfig.social.facebook}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="AyuAura on Facebook"
                                sx={socialSx}
                            >
                                <FacebookIcon fontSize="small" />
                            </IconButton>

                            <IconButton
                                component="a"
                                href={whatsappLink("Hi AyuAura, I have a question.")}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Chat with AyuAura on WhatsApp"
                                sx={socialSx}
                            >
                                <WhatsAppIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <ColumnTitle>Shop</ColumnTitle>

                        <Stack spacing={1.5}>
                            {productLinks.map((link) => (
                                <Link key={link.path} component={RouterLink} to={link.path} underline="none" variant="body2" sx={linkSx}>
                                    {link.label}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                        <ColumnTitle>Company</ColumnTitle>

                        <Stack spacing={1.5}>
                            {companyLinks.map((link) => (
                                <Link key={link.path} component={RouterLink} to={link.path} underline="none" variant="body2" sx={linkSx}>
                                    {link.label}
                                </Link>
                            ))}
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                        <ColumnTitle>Get in Touch</ColumnTitle>

                        <Stack spacing={1.75}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                                <PlaceOutlinedIcon fontSize="small" sx={{ mt: 0.25, color: "primary.light" }} />
                                <Typography variant="body2" sx={{ color: muted }}>
                                    {siteConfig.contact.address.locality}, {siteConfig.contact.address.region},{" "}
                                    {siteConfig.contact.address.country}
                                </Typography>
                            </Stack>

                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <WhatsAppIcon fontSize="small" sx={{ color: "primary.light" }} />
                                <Link
                                    href={whatsappLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    underline="none"
                                    variant="body2"
                                    sx={linkSx}
                                >
                                    {siteConfig.contact.whatsappDisplay}
                                </Link>
                            </Stack>

                            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                <EmailOutlinedIcon fontSize="small" sx={{ color: "primary.light" }} />
                                <Link
                                    href={`mailto:${siteConfig.contact.email}`}
                                    underline="none"
                                    variant="body2"
                                    sx={{ ...linkSx, wordBreak: "break-all" }}
                                >
                                    {siteConfig.contact.email}
                                </Link>
                            </Stack>
                        </Stack>
                    </Grid>
                </Grid>

                <Divider sx={{ mt: { xs: 7, md: 9 }, mb: 3, borderColor: "rgba(255, 255, 255, 0.1)" }} />

                <Typography variant="body2" sx={{ textAlign: "center", color: "rgba(255, 255, 255, 0.5)" }}>
                    © {year} {siteConfig.name}. All rights reserved.
                </Typography>

                {/* Oversized wordmark fading into the page edge — decoration only */}
                <Typography
                    aria-hidden
                    component="div"
                    sx={{
                        mt: 3,
                        mb: { xs: -2, md: -5 },
                        textAlign: "center",
                        fontFamily: serifFont,
                        fontWeight: 700,
                        fontSize: "clamp(4.5rem, 19vw, 17rem)",
                        lineHeight: 0.82,
                        letterSpacing: "-0.03em",
                        userSelect: "none",
                        backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 85%)",
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                    }}
                >
                    {siteConfig.name}
                </Typography>
            </Container>
        </Box>
    );
};

export default Footer;
