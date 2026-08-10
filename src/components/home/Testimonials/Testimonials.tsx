import { Box, Card, Typography } from "@mui/material";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import PageContainer from "../../common/PageContainer";
import SectionTitle from "../../common/SectionTitle";
import StarRating from "../../common/StarRating";
import { testimonials } from "../../../data/testimonials";

import styles from "./Testimonials.module.css";

const Testimonials = () => {
    return (
        <Box component="section" sx={{ bgcolor: "#F3F0E8" }}>
            <PageContainer>
                <SectionTitle
                    title="Loved by Our Customers"
                    subtitle="Real feedback from real customers who've made AyuAura part of their routine."
                />

                <Swiper
                    modules={[Autoplay, Pagination]}
                    spaceBetween={24}
                    pagination={{ clickable: true }}
                    autoplay={{ delay: 5000, disableOnInteraction: true }}
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
                                sx={{
                                    p: 4,
                                    height: "100%",
                                    borderRadius: 5,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <FormatQuoteIcon color="primary" sx={{ fontSize: 36, mb: 1, opacity: 0.5 }} />

                                <Typography sx={{ mb: 3, flexGrow: 1, color: "text.secondary" }}>
                                    "{testimonial.quote}"
                                </Typography>

                                <StarRating value={testimonial.rating} size={16} />

                                <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 600 }}>
                                    {testimonial.name}
                                </Typography>

                                <Typography variant="body2" color="text.secondary">
                                    {testimonial.location} • {testimonial.product}
                                </Typography>
                            </Card>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </PageContainer>
        </Box>
    );
};

export default Testimonials;
