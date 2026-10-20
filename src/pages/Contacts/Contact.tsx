import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Card, Grid, Link, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import PageContainer from "../../components/common/PageContainer";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import CustomButton from "../../components/common/CustomButton";
import SEO from "../../components/common/SEO";
import Reveal from "../../components/common/Reveal";

import { siteConfig, whatsappLink } from "../../config/site";
import { breadcrumbSchema } from "../../utils/structuredData";
import { CSS_EASE_OUT } from "../../theme/motion";

const infoItems = [
    {
        icon: PlaceOutlinedIcon,
        title: "Studio",
        detail: `${siteConfig.contact.address.locality}, ${siteConfig.contact.address.region}, India`,
    },
    {
        icon: AccessTimeOutlinedIcon,
        title: "Hours",
        detail: siteConfig.contact.hours,
    },
    {
        icon: EmailOutlinedIcon,
        title: "Email",
        detail: siteConfig.contact.email,
        href: `mailto:${siteConfig.contact.email}`,
    },
    {
        icon: WhatsAppIcon,
        title: "WhatsApp",
        detail: siteConfig.contact.whatsappDisplay,
        href: whatsappLink(),
    },
];

const Contact = () => {
    const [name, setName] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const crumbs = [
        { label: "Home", path: "/" },
        { label: "Contact", path: "/contact" },
    ];

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name.trim() || !message.trim()) {
            setError("Please fill in your name and message before sending.");
            return;
        }

        setError("");

        const text = `Hi AyuAura, my name is ${name}.\n\n${message}`;
        window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    };

    return (
        <PageContainer>
            <SEO
                title="Contact Us"
                description="Get in touch with AyuAura for product recommendations, order support or wholesale enquiries — reach us by WhatsApp, email or message."
                path="/contact"
                jsonLd={breadcrumbSchema(crumbs)}
            />

            <Breadcrumbs items={crumbs} />

            <SectionTitle
                component="h1"
                title="We'd Love to Hear From You"
                subtitle="Questions about a product, your skin type, or a bulk order? Send us a message and we'll reply personally."
            />

            <Grid container spacing={{ xs: 4, md: 5 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={2}>
                        {infoItems.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Reveal key={item.title} delay={index * 0.07} y={16}>
                                    <Card
                                        sx={(theme) => ({
                                            p: 2.5,
                                            display: "flex",
                                            gap: 2,
                                            alignItems: "center",
                                            transition: `transform .45s ${CSS_EASE_OUT}, box-shadow .45s ${CSS_EASE_OUT}`,
                                            "&:hover": { transform: "translateX(4px)", boxShadow: theme.customShadows.z12 },
                                        })}
                                    >
                                        <Box
                                            sx={(theme) => ({
                                                width: 48,
                                                height: 48,
                                                borderRadius: 3.5,
                                                display: "grid",
                                                placeItems: "center",
                                                flexShrink: 0,
                                                color: "primary.main",
                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            })}
                                        >
                                            <Icon sx={{ fontSize: 22 }} />
                                        </Box>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="overline" component="div" sx={{ color: "text.secondary", lineHeight: 1.6 }}>
                                                {item.title}
                                            </Typography>

                                            {item.href ? (
                                                <Link
                                                    href={item.href}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    underline="hover"
                                                    sx={{ color: "text.primary", fontWeight: 600, wordBreak: "break-word" }}
                                                >
                                                    {item.detail}
                                                </Link>
                                            ) : (
                                                <Typography sx={{ fontWeight: 600 }}>{item.detail}</Typography>
                                            )}
                                        </Box>
                                    </Card>
                                </Reveal>
                            );
                        })}
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Reveal delay={0.1}>
                        <Card
                            component="form"
                            onSubmit={handleSubmit}
                            noValidate
                            sx={(theme) => ({
                                p: { xs: 3, md: 5 },
                                boxShadow: theme.customShadows.z20,
                                backgroundImage: `radial-gradient(circle at 100% 0%, ${alpha(theme.palette.primary.light, 0.14)}, transparent 50%)`,
                            })}
                        >
                            <Typography variant="h4" component="h2" gutterBottom>
                                Send a Message
                            </Typography>

                            <Typography color="text.secondary" sx={{ mb: 3 }}>
                                We'll open WhatsApp with your message pre-filled so you can send it directly.
                            </Typography>

                            <Stack spacing={2.5}>
                                <TextField
                                    label="Your Name"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    fullWidth
                                    required
                                />

                                <TextField
                                    label="Your Message"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    fullWidth
                                    required
                                    multiline
                                    minRows={5}
                                />

                                {error && (
                                    <Typography color="error" variant="body2">
                                        {error}
                                    </Typography>
                                )}

                                <CustomButton
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    startIcon={<WhatsAppIcon />}
                                    sx={(theme) => ({ alignSelf: { sm: "flex-start" }, boxShadow: theme.customShadows.primary })}
                                >
                                    Send via WhatsApp
                                </CustomButton>
                            </Stack>
                        </Card>
                    </Reveal>
                </Grid>
            </Grid>
        </PageContainer>
    );
};

export default Contact;
