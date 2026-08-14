import type { Product, ProductVariant } from "../types/product";
import { request } from "./client";

/** Payload accepted by the create/update endpoints. */
export interface ProductPayload {
    slug?: string;
    name: string;
    price: number;
    category: string;
    image?: string | null;
    icon: Product["icon"];
    shortDescription: string;
    description: string;
    ingredients: string[];
    benefits: string[];
    howToUse?: string | null;
    featured: boolean;
    bestseller: boolean;
    newArrival: boolean;
    rating?: number | null;
    reviewCount?: number | null;
    inStock: boolean;
    variants: ProductVariant[];
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

/** `fresh` skips the CDN cache — used by the admin so edits appear at once. */
export const fetchProducts = async (options?: { fresh?: boolean; signal?: AbortSignal }) => {
    const path = options?.fresh ? "/api/products?fresh=1" : "/api/products";
    const init: RequestInit = { signal: options?.signal ?? null };
    if (options?.fresh) init.cache = "no-store";

    const { products } = await request<{ products: Product[] }>(path, init);
    return products;
};

export const createProduct = async (payload: ProductPayload) => {
    const { product } = await request<{ product: Product }>("/api/products", jsonInit("POST", payload));
    return product;
};

export const updateProduct = async (slug: string, payload: ProductPayload) => {
    const { product } = await request<{ product: Product }>(
        `/api/products/${encodeURIComponent(slug)}`,
        jsonInit("PUT", payload)
    );
    return product;
};

export const deleteProduct = (slug: string) =>
    request<{ deleted: number }>(`/api/products/${encodeURIComponent(slug)}`, { method: "DELETE" });
