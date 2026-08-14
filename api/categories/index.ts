import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { syncCategoriesFromProducts, toCategory } from "../_lib/categories";
import type { CategoryRow } from "../_lib/categories";
import { ensureSchema, getSql } from "../_lib/db";
import { logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!requireAdmin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    try {
        await ensureSchema();
        await syncCategoriesFromProducts();

        const sql = getSql();
        const rows = (await sql`
            SELECT c.id, c.slug, c.name, c.created_at, COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON p.category = c.name
            GROUP BY c.id
            ORDER BY c.name
        `) as (CategoryRow & { product_count: string })[];

        sendJson(res, 200, { categories: rows.map((row) => toCategory(row, Number(row.product_count))) });
    } catch (error) {
        logFailure("categories", error);
        return sendError(res, 500, "Something went wrong reaching the category database.");
    }
};

export default handler;
