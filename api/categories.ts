import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "./_lib/auth.js";
import { CATEGORY_COLUMNS, parseCategoryName, syncCategoriesFromProducts, toCategory } from "./_lib/categories.js";
import type { CategoryRow } from "./_lib/categories.js";
import { ensureSchema, getSql, isUniqueViolation } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { slugify } from "./_lib/products.js";

const listCategories = async (res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT c.id, c.slug, c.name, c.created_at, COUNT(p.id) AS product_count
        FROM categories c
        LEFT JOIN products p ON p.category = c.name
        GROUP BY c.id
        ORDER BY c.name
    `) as (CategoryRow & { product_count: string })[];

    sendJson(res, 200, { categories: rows.map((row) => toCategory(row, Number(row.product_count))) });
};

const handleList = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!requireAdmin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    try {
        await ensureSchema();
        await syncCategoriesFromProducts();
        await listCategories(res);
    } catch (error) {
        logFailure("categories", error);
        return sendError(res, 500, "Something went wrong reaching the category database.");
    }
};

const renameCategory = async (slug: string, name: string, res: VercelResponse) => {
    const sql = getSql();

    try {
        const existing = (await sql`
            SELECT ${sql.unsafe(CATEGORY_COLUMNS)} FROM categories WHERE slug = ${slug}
        `) as CategoryRow[];
        if (!existing.length) return sendError(res, 404, "Category not found.");

        const oldName = existing[0].name;

        const rows = (await sql`
            UPDATE categories SET slug = ${slugify(name)}, name = ${name}
            WHERE slug = ${slug}
            RETURNING ${sql.unsafe(CATEGORY_COLUMNS)}
        `) as CategoryRow[];

        // Cascade: products are matched to categories by exact text, not a
        // foreign key, so this UPDATE *is* the cascade — every product using
        // the old name follows the rename.
        await sql`UPDATE products SET category = ${name}, updated_at = NOW() WHERE category = ${oldName}`;

        const countRows = (await sql`
            SELECT COUNT(*) AS count FROM products WHERE category = ${name}
        `) as { count: string }[];

        res.setHeader("Cache-Control", "no-store");
        sendJson(res, 200, { category: toCategory(rows[0], Number(countRows[0].count)) });
    } catch (error) {
        if (isUniqueViolation(error)) {
            return sendError(res, 409, `A category named "${name}" already exists.`);
        }
        throw error;
    }
};

const deleteCategory = async (slug: string, res: VercelResponse) => {
    const sql = getSql();

    const existing = (await sql`
        SELECT ${sql.unsafe(CATEGORY_COLUMNS)} FROM categories WHERE slug = ${slug}
    `) as CategoryRow[];
    if (!existing.length) return sendError(res, 404, "Category not found.");

    const inUse = (await sql`
        SELECT COUNT(*) AS count FROM products WHERE category = ${existing[0].name}
    `) as { count: string }[];
    const count = Number(inUse[0].count);

    if (count > 0) {
        return sendError(
            res,
            409,
            `${count} product${count === 1 ? "" : "s"} still use this category — reassign them first.`
        );
    }

    await sql`DELETE FROM categories WHERE slug = ${slug}`;

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { deleted: slug });
};

const handleOne = async (slug: string, req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "PUT" && method !== "DELETE") return methodNotAllowed(res, ["PUT", "DELETE"]);
    if (!requireAdmin(req, res)) return;

    let name: string | undefined;
    if (method === "PUT") {
        const parsed = parseCategoryName(asRecord(req.body).name);
        if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);
        name = parsed.value;
    }

    try {
        await ensureSchema();
        if (method === "DELETE") return await deleteCategory(slug, res);
        if (name) return await renameCategory(slug, name, res);
        return sendError(res, 400, "Missing category details.");
    } catch (error) {
        logFailure("categories/[slug]", error);
        return sendError(res, 500, "Something went wrong reaching the category database.");
    }
};

/** One physical function serving /api/categories and /api/categories/:slug — see vercel.json's rewrites. */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    const slug = readQueryParam(req, "slug");
    if (!slug) return handleList(req, res);
    return handleOne(slug, req, res);
};

export default handler;
