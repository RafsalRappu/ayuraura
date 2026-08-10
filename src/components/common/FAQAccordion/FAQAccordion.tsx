import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import type { Faq } from "../../../data/faqs";

interface FAQAccordionProps {
    faqs: Faq[];
}

const FAQAccordion = ({ faqs }: FAQAccordionProps) => {
    return (
        <Box>
            {faqs.map((faq, index) => (
                <Accordion
                    key={faq.question}
                    disableGutters
                    elevation={0}
                    sx={{
                        border: "1px solid #ececec",
                        borderRadius: "16px !important",
                        mb: 2,
                        overflow: "hidden",
                        "&:before": { display: "none" },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon color="primary" />}
                        aria-controls={`faq-panel-${index}-content`}
                        id={`faq-panel-${index}-header`}
                        sx={{ px: 3, py: 1 }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {faq.question}
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: 3, pb: 3 }}>
                        <Typography color="text.secondary">{faq.answer}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};

export default FAQAccordion;
