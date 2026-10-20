import { Box, Card, Skeleton, Stack } from "@mui/material";

import { productCardSx, productMediaWellSx } from "../ProductCard/productCardStyles";

/** Placeholder shaped like ProductCard, shown while the catalogue loads. */
const ProductCardSkeleton = () => (
    <Card sx={productCardSx}>
        <Box sx={productMediaWellSx}>
            <Skeleton variant="rectangular" width="100%" height="100%" />
        </Box>

        <Box sx={{ px: 1.5, pt: 2, pb: 1 }}>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Skeleton variant="text" width={70} />
                <Skeleton variant="text" width={90} />
            </Stack>

            <Skeleton variant="text" width="65%" height={30} />
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />

            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Skeleton variant="text" width={56} height={32} />
                <Skeleton variant="rounded" width={132} height={38} sx={{ borderRadius: 999 }} />
            </Stack>
        </Box>
    </Card>
);

export default ProductCardSkeleton;
