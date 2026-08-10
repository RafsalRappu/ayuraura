import { useState } from "react";
import type { FormEvent } from "react";
import { Box, Grid, Link, Stack, TextField, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import PageContainer from "../../components/common/PageContainer";
import SectionTitle from "../../components/common/SectionTitle";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import CustomButton from "../../components/common/CustomButton";
import SEO from "../../components/common/SEO";

import { siteConfig, whatsappLink } from "../../config/site";
import { breadcrumbSchema } from "../../utils/structuredData";

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

            <Grid container spacing={6}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={4}>
                        {infoItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Stack key={item.title} direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                                    <Box
                                        sx={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: "50%",
                                            bgcolor: "success.main",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Icon sx={{ color: "#fff", fontSize: 22 }} />
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {item.title}
                                        </Typography>

                                        {item.href ? (
                                            <Link
                                                href={item.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                underline="hover"
                                                color="text.secondary"
                                            >
                                                {item.detail}
                                            </Link>
                                        ) : (
                                            <Typography color="text.secondary">{item.detail}</Typography>
                                        )}
                                    </Box>
                                </Stack>
                            );
                        })}
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        noValidate
                        sx={{ bgcolor: "#F9F7F2", borderRadius: 6, p: { xs: 3, md: 5 } }}
                    >
                        <Typography variant="h5" gutterBottom>
                            Send a Message
                        </Typography>

                        <Typography color="text.secondary" sx={{ mb: 3 }}>
                            We'll open WhatsApp with your message pre-filled so you can send it directly.
                        </Typography>

                        <Stack spacing={3}>
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
                                minRows={4}
                            />

                            {error && (
                                <Typography color="error" variant="body2">
                                    {error}
                                </Typography>
                            )}

                            <CustomButton type="submit" variant="contained" size="large" startIcon={<WhatsAppIcon />}>
                                Send via WhatsApp
                            </CustomButton>
                        </Stack>
                    </Box>
                </Grid>
            </Grid>
        </PageContainer>
    );
};

export default Contact;
