import { Box, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import PageContainer from "../../components/common/PageContainer";
import CustomButton from "../../components/common/CustomButton";
import SEO from "../../components/common/SEO";

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
                <Typography variant="h1" color="primary" sx={{ fontSize: { xs: "3.5rem", md: "5rem" }, mb: 2 }}>
                    404
                </Typography>

                <Typography variant="h4" component="h2" gutterBottom>
                    This page has wandered off the path.
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: "auto" }}>
                    The page you're looking for doesn't exist or may have been moved. Let's get you
                    back to something soothing.
                </Typography>

                <CustomButton component={RouterLink} to="/" variant="contained">
                    Back to Home
                </CustomButton>
            </Box>
        </PageContainer>
    );
};

export default NotFound;
