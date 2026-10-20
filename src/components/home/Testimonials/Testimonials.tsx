import { Avatar, Box, Card, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import PageContainer from "../../common/PageContainer";
import SectionTitle from "../../common/SectionTitle";
import StarRating from "../../common/StarRating";
import Reveal from "../../common/Reveal";
import { testimonials } from "../../../data/testimonials";
import { CSS_EASE_OUT } from "../../../theme/motion";

import styles from "./Testimonials.module.css";

const initials = (name: string) =>
    name
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .join("")
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 2)
        .toUpperCase();

const Testimonials = () => {
    return (
        <Box component="section" sx={{ bgcolor: "background.neutral", position: "relative", overflow: "hidden" }}>
            <PageContainer>
                <SectionTitle
                    title="Loved by Our Customers"
                    subtitle="Real feedback from real customers who've made AyuAura part of their routine."
                />

                <Reveal>
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={24}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 5000, disableOnInteraction: true }}
                        speed={700}
                        breakpoints={{
                            0: { slidesPerView: 1 },
                            768: { slidesPerView: 2 },
                            1100: { slidesPerView: 3 },
                        }}
                        className={styles.swiper}
                    >
                        {testimonials.map((testimonial) => (
                            <SwiperSlide key={testimonial.id}>
                                <Card
                                    sx={(theme) => ({
                                        p: { xs: 3, md: 4 },
                                        // No explicit height: the slide (a flex row) stretches every card
                                        // to the tallest one, and the slide itself grows to fit.
                                        width: "100%",
                                        display: "flex",
                                        flexDirection: "column",
                                        transition: `transform .5s ${CSS_EASE_OUT}, box-shadow .5s ${CSS_EASE_OUT}`,
                                        "&:hover": { transform: "translateY(-4px)", boxShadow: theme.customShadows.z16 },
                                    })}
                                >
                                    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
                                        <StarRating value={testimonial.rating} size={18} />

                                        <FormatQuoteRoundedIcon
                                            aria-hidden
                                            sx={(theme) => ({ fontSize: 44, color: alpha(theme.palette.primary.main, 0.18) })}
                                        />
                                    </Stack>

                                    <Typography sx={{ mb: 3, flexGrow: 1, color: "text.primary", fontSize: "1.0625rem", lineHeight: 1.7 }}>
                                        "{testimonial.quote}"
                                    </Typography>

                                    <Divider sx={{ mb: 2.5, borderStyle: "dashed" }} />

                                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                                        <Avatar
                                            sx={(theme) => ({
                                                width: 44,
                                                height: 44,
                                                fontSize: "0.9375rem",
                                                color: "primary.dark",
                                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                            })}
                                        >
                                            {initials(testimonial.name)}
                                        </Avatar>

                                        <Box sx={{ minWidth: 0 }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                                {testimonial.name}
                                            </Typography>

                                            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                                {testimonial.location} • {testimonial.product}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Card>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </Reveal>
            </PageContainer>
        </Box>
    );
};

export default Testimonials;
