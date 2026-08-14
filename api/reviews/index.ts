import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { ensureSchema, getSql } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { REVIEW_COLUMNS, parseReviewInput, toAdminReview, toReview } from "../_lib/reviews";
import type { AdminReviewRow, ReviewRow } from "../_lib/reviews";
import { checkRateLimit } from "../_lib/rateLimit";

const REVIEW_LIMIT = 200;
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const CREATE_MAX_ATTEMPTS = 5;

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

const listReviews = async (res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT r.id, r.product_id, r.author_name, r.rating, r.comment, r.status, r.created_at,
               p.name AS product_name, p.slug AS product_slug
        FROM reviews r
        JOIN products p ON p.id = r.product_id
        ORDER BY r.created_at DESC
        LIMIT ${REVIEW_LIMIT}
    `) as AdminReviewRow[];

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { reviews: rows.map(toAdminReview) });
};

const createReview = async (req: VercelRequest, res: VercelResponse) => {
    if (!checkRateLimit(`review:${clientKey(req)}`, { windowMs: CREATE_WINDOW_MS, max: CREATE_MAX_ATTEMPTS })) {
        return sendError(res, 429, "Too many reviews submitted — please try again later.");
    }

    const parsed = parseReviewInput(asRecord(req.body));
    if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

    const sql = getSql();
    const { productSlug, authorName, rating, comment } = parsed.value;

    const productRows = (await sql`SELECT id FROM products WHERE slug = ${productSlug}`) as { id: number }[];
    if (!productRows.length) return sendError(res, 404, "Product not found.");

    const rows = (await sql`
        INSERT INTO reviews (product_id, author_name, rating, comment)
        VALUES (${productRows[0].id}, ${authorName}, ${rating}, ${comment})
        RETURNING ${sql.unsafe(REVIEW_COLUMNS)}
    `) as ReviewRow[];

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 201, { review: toReview(rows[0]) });
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    // Anyone can submit a review; only the shop owner sees the moderation
    // queue — same inverse-of-products/index.ts shape as api/orders/index.ts.
    if (method === "GET" && !requireAdmin(req, res)) return;

    try {
        await ensureSchema();
        return method === "GET" ? await listReviews(res) : await createReview(req, res);
    } catch (error) {
        logFailure("reviews", error);
        return sendError(res, 500, "Something went wrong reaching the review database.");
    }
};

export default handler;
