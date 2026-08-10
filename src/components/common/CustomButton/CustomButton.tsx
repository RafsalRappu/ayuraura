import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";
import type { ElementType } from "react";

type CustomButtonProps<C extends ElementType = "button"> = ButtonProps<C, { component?: C }>;

const CustomButton = <C extends ElementType = "button">(props: CustomButtonProps<C>) => {
    return (
        <Button
            {...props}
            sx={{
                borderRadius: "40px",
                px: 4,
                py: 1.4,
                fontWeight: 600,
                textTransform: "none",
                ...props.sx,
            }}
        />
    );
};

export default CustomButton;
