import { Card, CardContent, Skeleton, Stack } from "@mui/material";

import styles from "../ProductCard/ProductCard.module.css";

/** Placeholder shaped like ProductCard, shown while the catalogue loads. */
const ProductCardSkeleton = () => (
    <Card className={styles.card} sx={{ height: "100%" }}>
        <div className={styles.imageContainer}>
            <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
        </div>

        <CardContent>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                <Skeleton variant="rounded" width={90} height={24} />
                <Skeleton variant="text" width={60} />
            </Stack>

            <Skeleton variant="text" width="75%" height={34} />
            <Skeleton variant="text" width="100%" sx={{ my: 2 }} />
            <Skeleton variant="rounded" width="100%" height={42} />
        </CardContent>
    </Card>
);

export default ProductCardSkeleton;
