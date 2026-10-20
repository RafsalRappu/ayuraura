import { Box, Typography } from "@mui/material";
import { alpha, keyframes } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import SpaIcon from "@mui/icons-material/Spa";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import SEO from "../../components/common/SEO";
import { serifFont } from "../../theme/typography";

const sway = keyframes`
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50%      { transform: translateY(-14px) rotate(6deg); }
`;

const NotFound = () => {
    return (
        <PageContainer>
            <SEO
                title="Page Not Found"
                description="The page you're looking for doesn't exist or may have moved."
                path="/404"
                noindex
            />

            <Box sx={{ textAlign: "center", py: { xs: 6, md: 10 } }}>
                <Box
                    sx={(theme) => ({
                        width: 72,
                        height: 72,
                        mx: "auto",
                        mb: 1,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        color: "primary.main",
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        animation: `${sway} 5s ease-in-out infinite`,
                    })}
                >
                    <SpaIcon sx={{ fontSize: 36 }} />
                </Box>

                <Typography
                    variant="h1"
                    sx={(theme) => ({
                        fontFamily: serifFont,
                        fontSize: { xs: "6rem", md: "10rem" },
                        lineHeight: 1,
                        mb: 2,
                        backgroundImage: `linear-gradient(110deg, ${theme.palette.primary.main} 15%, ${theme.palette.primary.light} 55%, ${theme.palette.secondary.main} 90%)`,
                        backgroundClip: "text",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                    })}
                >
                    404
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom>
                    This page has wandered off the path.
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: "auto" }}>
                    The page you're looking for doesn't exist or may have been moved. Let's get you
                    back to something soothing.
                </Typography>

                <CustomButton component={RouterLink} to="/" variant="contained" size="large" startIcon={<ArrowBackRoundedIcon />}>
                    Back to Home
                </CustomButton>
            </Box>
        </PageContainer>
    );
};

export default NotFound;
