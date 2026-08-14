import type { VercelRequest, VercelResponse } from "@vercel/node";

import { ensureSchema, getSql } from "../../_lib/db";
import { logFailure, methodNotAllowed, sendError, sendJson } from "../../_lib/http";
import { computeSummary, toReview } from "../../_lib/reviews";
import type { ReviewRow } from "../../_lib/reviews";

const REVIEW_LIMIT = 50;

const readSlug = (req: VercelRequest) => {
    const value = req.query.slug;
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

    const slug = readSlug(req);
    if (!slug) return sendError(res, 400, "Product slug is missing.");

    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");

    try {
        await ensureSchema();
        const sql = getSql();

        const productRows = (await sql`SELECT id FROM products WHERE slug = ${slug}`) as { id: number }[];
        if (!productRows.length) return sendError(res, 404, "Product not found.");

        const rows = (await sql`
            SELECT id, product_id, author_name, rating, comment, status, created_at
            FROM reviews
            WHERE product_id = ${productRows[0].id} AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT ${REVIEW_LIMIT}
        `) as ReviewRow[];

        sendJson(res, 200, { reviews: rows.map(toReview), summary: computeSummary(rows) });
    } catch (error) {
        logFailure("products/[slug]/reviews", error);
        return sendError(res, 500, "Something went wrong reaching the review database.");
    }
};

export default handler;
