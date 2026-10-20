import { IconButton, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import { EASE_OUT } from "../../../theme/motion";

interface QuantityStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

const stepSx = {
    width: 30,
    height: 30,
    color: "text.primary",
    bgcolor: "background.paper",
    boxShadow: (theme: { customShadows: { z1: string } }) => theme.customShadows.z1,
    "&:hover": { bgcolor: "background.paper" },
    "&.Mui-disabled": { bgcolor: "transparent", boxShadow: "none" },
} as const;

const QuantityStepper = ({ value, onChange, min = 1, max = 20 }: QuantityStepperProps) => (
    <Stack
        direction="row"
        spacing={0.75}
        sx={{
            display: "inline-flex",
            alignItems: "center",
            p: 0.5,
            borderRadius: 999,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.1),
        }}
    >
        <motion.div whileTap={{ scale: 0.82 }} style={{ display: "inline-flex" }}>
            <IconButton
                size="small"
                aria-label="Decrease quantity"
                disabled={value <= min}
                onClick={() => onChange(value - 1)}
                sx={stepSx}
            >
                <RemoveIcon sx={{ fontSize: 16 }} />
            </IconButton>
        </motion.div>

        <Typography sx={{ minWidth: 22, textAlign: "center", overflow: "hidden", fontWeight: 700 }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE_OUT }}
                    style={{ display: "inline-block" }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </Typography>

        <motion.div whileTap={{ scale: 0.82 }} style={{ display: "inline-flex" }}>
            <IconButton
                size="small"
                aria-label="Increase quantity"
                disabled={value >= max}
                onClick={() => onChange(value + 1)}
                sx={stepSx}
            >
                <AddIcon sx={{ fontSize: 16 }} />
            </IconButton>
        </motion.div>
    </Stack>
);

export default QuantityStepper;
