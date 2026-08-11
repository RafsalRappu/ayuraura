import { createContext, useContext } from "react";
import type { Product } from "../types/product";

export type ProductsStatus = "loading" | "ready" | "fallback";

export interface ProductsContextValue {
    products: Product[];
    /** `fallback` means the API was unreachable and the bundled catalogue is showing. */
    status: ProductsStatus;
    error: string | null;
    reload: () => void;
    getBySlug: (slug: string) => Product | undefined;
    getRelated: (product: Product, limit?: number) => Product[];
}

export const ProductsContext = createContext<ProductsContextValue | null>(null);

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error("useProducts must be used within a ProductsProvider");
    }
    return context;
};
