import { Button } from "@mui/material";
import type { ButtonProps } from "@mui/material";
import type { ElementType } from "react";

type CustomButtonProps<C extends ElementType = "button"> = ButtonProps<C, { component?: C }>;

/** The storefront's roomy pill button; colors and hover come from the theme. */
const CustomButton = <C extends ElementType = "button">({ sx, ...props }: CustomButtonProps<C>) => {
    return (
        <Button
            {...props}
            // An sx array keeps caller styles working whether they pass an
            // object, a theme callback or an array of their own.
            sx={[
                { borderRadius: "999px", px: 3.5, py: 1.35 },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        />
    );
};

export default CustomButton;
