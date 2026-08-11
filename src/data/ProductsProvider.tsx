import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { errorMessage } from "../api/client";
import { fetchProducts } from "../api/products";
import type { Product } from "../types/product";
import { findBySlug, findRelated, seedProducts } from "./products";
import { ProductsContext } from "./useProducts";
import type { ProductsStatus } from "./useProducts";

interface ProductsProviderProps {
    children: ReactNode;
}

export const ProductsProvider = ({ children }: ProductsProviderProps) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [status, setStatus] = useState<ProductsStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const [reloadToken, setReloadToken] = useState(0);

    const reload = useCallback(() => setReloadToken((token) => token + 1), []);

    useEffect(() => {
        const controller = new AbortController();

        setStatus("loading");
        setError(null);

        fetchProducts({ signal: controller.signal })
            .then((loaded) => {
                if (controller.signal.aborted) return;
                setProducts(loaded);
                setStatus("ready");
            })
            .catch((cause: unknown) => {
                if (controller.signal.aborted) return;
                // Keep the shop usable if the database or API is unavailable.
                setProducts(seedProducts);
                setStatus("fallback");
                setError(errorMessage(cause, "Could not load the latest products."));
            });

        return () => controller.abort();
    }, [reloadToken]);

    const value = useMemo(
        () => ({
            products,
            status,
            error,
            reload,
            getBySlug: (slug: string) => findBySlug(products, slug),
            getRelated: (product: Product, limit?: number) => findRelated(products, product, limit),
        }),
        [products, status, error, reload]
    );

    return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
};
