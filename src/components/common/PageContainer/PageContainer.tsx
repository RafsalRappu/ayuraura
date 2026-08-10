import { Container } from "@mui/material";
import type { ElementType, ReactNode } from "react";

interface PageContainerProps {
    children: ReactNode;
    component?: ElementType;
    disableGutters?: boolean;
}

const PageContainer = ({ children, component = "div", disableGutters = false }: PageContainerProps) => {
    return (
        <Container
            component={component}
            maxWidth="xl"
            sx={{
                py: disableGutters ? 0 : { xs: 6, md: 10 },
            }}
        >
            {children}
        </Container>
    );
};

export default PageContainer;