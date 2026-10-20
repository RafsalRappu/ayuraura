import { Accordion, AccordionDetails, AccordionSummary, Box, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import type { Faq } from "../../../data/faqs";
import { CSS_EASE_OUT } from "../../../theme/motion";

interface FAQAccordionProps {
    faqs: Faq[];
}

const FAQAccordion = ({ faqs }: FAQAccordionProps) => {
    return (
        <Stack spacing={1.5}>
            {faqs.map((faq, index) => (
                <Accordion
                    key={faq.question}
                    disableGutters
                    elevation={0}
                    sx={(theme) => ({
                        bgcolor: "background.paper",
                        border: `1px solid ${alpha(theme.palette.grey[500], 0.14)}`,
                        borderRadius: "18px !important",
                        overflow: "hidden",
                        transition: `box-shadow .4s ${CSS_EASE_OUT}, border-color .4s`,
                        "&:before": { display: "none" },
                        "&:hover": { borderColor: alpha(theme.palette.grey[500], 0.32) },
                        "&.Mui-expanded": { boxShadow: theme.customShadows.z12, borderColor: "transparent" },
                    })}
                >
                    <AccordionSummary
                        expandIcon={
                            <Box
                                sx={(theme) => ({
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    display: "grid",
                                    placeItems: "center",
                                    color: "primary.main",
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                })}
                            >
                                <AddRoundedIcon fontSize="small" />
                            </Box>
                        }
                        aria-controls={`faq-panel-${index}-content`}
                        id={`faq-panel-${index}-header`}
                        sx={{
                            px: { xs: 2.5, md: 3 },
                            py: 1.25,
                            "& .MuiAccordionSummary-expandIconWrapper": { transition: `transform .45s ${CSS_EASE_OUT}` },
                            // + turns into × when open.
                            "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": { transform: "rotate(135deg)" },
                        }}
                    >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, pr: 2 }}>
                            {faq.question}
                        </Typography>
                    </AccordionSummary>

                    <AccordionDetails sx={{ px: { xs: 2.5, md: 3 }, pt: 0, pb: 3 }}>
                        <Typography color="text.secondary">{faq.answer}</Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Stack>
    );
};

export default FAQAccordion;
