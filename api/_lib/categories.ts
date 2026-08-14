import type { Category } from "../../src/types/category";
import type { Result } from "./http";
import { getSql } from "./db";
import { slugify } from "./products";

const MAX_NAME = 60;

export const CATEGORY_COLUMNS = `id, slug, name, created_at`;

export interface CategoryRow {
    id: number;
    slug: string;
    name: string;
    created_at: string;
}

export const toCategory = (row: CategoryRow, productCount: number): Category => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    productCount,
});

export const parseCategoryName = (value: unknown): Result<string> => {
    const name = typeof value === "string" ? value.trim() : "";

    if (!name) return { ok: false, errors: ["Name is required."] };
    if (name.length > MAX_NAME) return { ok: false, errors: [`Name must be ${MAX_NAME} characters or fewer.`] };

    return { ok: true, value: name };
};

/**
 * Keeps `categories` in sync with whatever category text products actually
 * have — idempotent (ON CONFLICT DO NOTHING), so it's safe and cheap to run
 * before every listing rather than requiring a one-off migration/backfill.
 */
export const syncCategoriesFromProducts = async () => {
    const sql = getSql();
    const rows = (await sql`SELECT DISTINCT category FROM products`) as { category: string }[];

    for (const row of rows) {
        const name = row.category.trim();
        if (!name) continue;
        await sql`INSERT INTO categories (slug, name) VALUES (${slugify(name)}, ${name}) ON CONFLICT (name) DO NOTHING`;
    }
};
