import type { Product } from "../../src/types/product.js";
import type { Result } from "./http.js";

export const PRODUCT_ICONS = ["lip", "face", "eye", "hair", "body"] as const;

/** Every column `toProduct` reads, for interpolation via `sql.unsafe`. */
export const PRODUCT_COLUMNS = `
    id, slug, name, price, category, image, icon,
    short_description, description, ingredients, benefits, how_to_use,
    featured, bestseller, new_arrival, rating, review_count
`;

export interface ProductRow {
    id: number;
    slug: string;
    name: string;
    price: number;
    category: string;
    image: string | null;
    icon: string;
    short_description: string;
    description: string;
    ingredients: unknown;
    benefits: unknown;
    how_to_use: string | null;
    featured: boolean;
    bestseller: boolean;
    new_arrival: boolean;
    rating: number | string | null;
    review_count: number | null;
}

const toStringArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export const toProduct = (row: ProductRow): Product => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: Number(row.price),
    category: row.category,
    ...(row.image ? { image: row.image } : {}),
    icon: (PRODUCT_ICONS as readonly string[]).includes(row.icon)
        ? (row.icon as Product["icon"])
        : "face",
    shortDescription: row.short_description,
    description: row.description,
    ingredients: toStringArray(row.ingredients),
    benefits: toStringArray(row.benefits),
    ...(row.how_to_use ? { howToUse: row.how_to_use } : {}),
    featured: row.featured,
    bestseller: row.bestseller,
    newArrival: row.new_arrival,
    ...(row.rating === null ? {} : { rating: Number(row.rating) }),
    ...(row.review_count === null ? {} : { reviewCount: row.review_count }),
});

export const slugify = (value: string) =>
    value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120);

/** Shape written to the database — every column is explicit, so updates are total. */
export interface ProductInput {
    slug: string;
    name: string;
    price: number;
    category: string;
    image: string | null;
    icon: string;
    shortDescription: string;
    description: string;
    ingredients: string[];
    benefits: string[];
    howToUse: string | null;
    featured: boolean;
    bestseller: boolean;
    newArrival: boolean;
    rating: number | null;
    reviewCount: number | null;
}

const MAX = {
    name: 120,
    slug: 120,
    category: 60,
    shortDescription: 220,
    description: 5000,
    howToUse: 2000,
    image: 2048,
    listItems: 30,
    listItemLength: 80,
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const parseList = (value: unknown, field: string, errors: string[]): string[] => {
    const raw = Array.isArray(value)
        ? value
        : typeof value === "string"
          ? value.split(/\r?\n|,/)
          : [];

    const items = raw
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);

    if (items.length > MAX.listItems) {
        errors.push(`${field} cannot have more than ${MAX.listItems} entries.`);
    }
    if (items.some((item) => item.length > MAX.listItemLength)) {
        errors.push(`Each ${field} entry must be ${MAX.listItemLength} characters or fewer.`);
    }

    return items.slice(0, MAX.listItems).map((item) => item.slice(0, MAX.listItemLength));
};

const parseOptionalNumber = (
    value: unknown,
    field: string,
    min: number,
    max: number,
    errors: string[]
): number | null => {
    if (value === undefined || value === null || value === "") return null;

    const parsed = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
        errors.push(`${field} must be a number between ${min} and ${max}.`);
        return null;
    }
    return parsed;
};

const parseImage = (value: unknown, errors: string[]): string | null => {
    const image = text(value);
    if (!image) return null;

    if (image.length > MAX.image) {
        errors.push("Image URL is too long.");
        return null;
    }
    if (!/^https?:\/\//i.test(image) && !image.startsWith("/")) {
        errors.push("Image must be an https URL or a path starting with '/'.");
        return null;
    }
    return image;
};

/** Validates and normalises an admin-submitted product payload. */
export const parseProductInput = (body: Record<string, unknown>): Result<ProductInput> => {
    const errors: string[] = [];

    const name = text(body.name);
    if (!name) errors.push("Name is required.");
    else if (name.length > MAX.name) errors.push(`Name must be ${MAX.name} characters or fewer.`);

    const slug = slugify(text(body.slug) || name);
    if (!slug) errors.push("Slug could not be derived — add letters or numbers to the name.");
    else if (slug.length > MAX.slug) errors.push(`Slug must be ${MAX.slug} characters or fewer.`);

    const priceRaw = typeof body.price === "number" ? body.price : Number(text(body.price));
    if (!Number.isFinite(priceRaw) || !Number.isInteger(priceRaw) || priceRaw < 0 || priceRaw > 10_000_000) {
        errors.push("Price must be a whole number of rupees between 0 and 10,000,000.");
    }

    const category = text(body.category);
    if (!category) errors.push("Category is required.");
    else if (category.length > MAX.category) {
        errors.push(`Category must be ${MAX.category} characters or fewer.`);
    }

    const icon = text(body.icon) || "face";
    if (!(PRODUCT_ICONS as readonly string[]).includes(icon)) {
        errors.push(`Icon must be one of: ${PRODUCT_ICONS.join(", ")}.`);
    }

    const shortDescription = text(body.shortDescription);
    if (!shortDescription) errors.push("Short description is required.");
    else if (shortDescription.length > MAX.shortDescription) {
        errors.push(`Short description must be ${MAX.shortDescription} characters or fewer.`);
    }

    const description = text(body.description);
    if (!description) errors.push("Description is required.");
    else if (description.length > MAX.description) {
        errors.push(`Description must be ${MAX.description} characters or fewer.`);
    }

    const howToUse = text(body.howToUse);
    if (howToUse.length > MAX.howToUse) {
        errors.push(`How to use must be ${MAX.howToUse} characters or fewer.`);
    }

    const image = parseImage(body.image, errors);
    const ingredients = parseList(body.ingredients, "Ingredients", errors);
    const benefits = parseList(body.benefits, "Benefits", errors);
    const rating = parseOptionalNumber(body.rating, "Rating", 0, 5, errors);
    const reviewCount = parseOptionalNumber(body.reviewCount, "Review count", 0, 1_000_000, errors);

    if (reviewCount !== null && !Number.isInteger(reviewCount)) {
        errors.push("Review count must be a whole number.");
    }

    if (errors.length) return { ok: false, errors };

    return {
        ok: true,
        value: {
            slug,
            name,
            price: priceRaw,
            category,
            image,
            icon,
            shortDescription,
            description,
            ingredients,
            benefits,
            howToUse: howToUse || null,
            featured: body.featured === true || body.featured === "true",
            bestseller: body.bestseller === true || body.bestseller === "true",
            newArrival: body.newArrival === true || body.newArrival === "true",
            rating,
            reviewCount: reviewCount === null ? null : Math.round(reviewCount),
        },
    };
};
