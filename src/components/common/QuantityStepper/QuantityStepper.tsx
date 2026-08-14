import { IconButton, Stack, Typography } from "@mui/material";
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
        <IconButton
            size="small"
            aria-label="Decrease quantity"
            disabled={value <= min}
            onClick={() => onChange(value - 1)}
        >
            <RemoveIcon fontSize="small" />
        </IconButton>

        <Typography sx={{ minWidth: 20, textAlign: "center" }}>{value}</Typography>

        <IconButton
            size="small"
            aria-label="Increase quantity"
            disabled={value >= max}
            onClick={() => onChange(value + 1)}
        >
            <AddIcon fontSize="small" />
        </IconButton>
    </Stack>
);

export default QuantityStepper;
