import { IconButton, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface QuantityStepperProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

const QuantityStepper = ({ value, onChange, min = 1, max = 20 }: QuantityStepperProps) => (
    <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", border: "1px solid", borderColor: "divider", borderRadius: 100, px: 0.5 }}
    >
        <motion.div whileTap={{ scale: 0.8 }} style={{ display: "inline-flex" }}>
            <IconButton
                size="small"
                aria-label="Decrease quantity"
                disabled={value <= min}
                onClick={() => onChange(value - 1)}
            >
                <RemoveIcon fontSize="small" />
            </IconButton>
        </motion.div>

        <Typography sx={{ minWidth: 20, textAlign: "center", overflow: "hidden" }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={value}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: "inline-block" }}
                >
                    {value}
                </motion.span>
            </AnimatePresence>
        </Typography>

        <motion.div whileTap={{ scale: 0.8 }} style={{ display: "inline-flex" }}>
            <IconButton
                size="small"
                aria-label="Increase quantity"
                disabled={value >= max}
                onClick={() => onChange(value + 1)}
            >
                <AddIcon fontSize="small" />
            </IconButton>
        </motion.div>
    </Stack>
);

export default QuantityStepper;
