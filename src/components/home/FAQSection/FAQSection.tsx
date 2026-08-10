import { Box } from "@mui/material";
import { Helmet } from "react-helmet-async";

import PageContainer from "../../common/PageContainer";
import SectionTitle from "../../common/SectionTitle";
import FAQAccordion from "../../common/FAQAccordion";
import { faqs } from "../../../data/faqs";
import { faqSchema } from "../../../utils/structuredData";

const FAQSection = () => {
    return (
        <Box component="section" id="faq" sx={{ bgcolor: "#F3F0E8" }}>
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(faqSchema(faqs))}</script>
            </Helmet>

            <PageContainer>
                <SectionTitle
                    title="Frequently Asked Questions"
                    subtitle="Everything you need to know before you order."
                />

                <Box sx={{ maxWidth: 760, mx: "auto" }}>
                    <FAQAccordion faqs={faqs} />
                </Box>
            </PageContainer>
        </Box>
    );
};

export default FAQSection;
