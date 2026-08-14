export interface CartItem {
    /** `${slug}::${variantLabel ?? ""}` — distinguishes variants of the same product. */
    key: string;
    slug: string;
    name: string;
    image?: string;
    price: number;
    variantLabel?: string;
    quantity: number;
}
