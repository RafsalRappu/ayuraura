import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "./_lib/auth.js";
import { ensureSchema, getSql } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { checkRateLimit } from "./_lib/rateLimit.js";
import { REVIEW_COLUMNS, STATUSES, parseReviewInput, toAdminReview, toReview } from "./_lib/reviews.js";
import type { AdminReviewRow, ReviewRow } from "./_lib/reviews.js";

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

const REVIEW_LIMIT = 200;
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const CREATE_MAX_ATTEMPTS = 5;

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

const handleList = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    // Anyone can submit a review; only the shop owner sees the moderation
    // queue — same inverse-of-products shape as orders.
    if (method === "GET" && !requireAdmin(req, res)) return;

    try {
        await ensureSchema();
        return method === "GET" ? await listReviews(res) : await createReview(req, res);
    } catch (error) {
        logFailure("reviews", error);
        return sendError(res, 500, "Something went wrong reaching the review database.");
    }
};

const updateStatus = async (id: number, status: string, res: VercelResponse) => {
    const sql = getSql();

    const rows = (await sql`
        UPDATE reviews r SET status = ${status}
        FROM products p
        WHERE r.id = ${id} AND p.id = r.product_id
        RETURNING r.id, r.product_id, r.author_name, r.rating, r.comment, r.status, r.created_at,
                  p.name AS product_name, p.slug AS product_slug
    `) as AdminReviewRow[];

    if (!rows.length) return sendError(res, 404, "Review not found.");

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { review: toAdminReview(rows[0]) });
};

const deleteReview = async (id: number, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`DELETE FROM reviews WHERE id = ${id} RETURNING id`) as { id: number }[];

    if (!rows.length) return sendError(res, 404, "Review not found.");

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { deleted: id });
};

const handleOne = async (rawId: string, req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "PATCH" && method !== "DELETE") return methodNotAllowed(res, ["PATCH", "DELETE"]);
    if (!requireAdmin(req, res)) return;

    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) return sendError(res, 400, "Review id is missing.");

    let status: string | undefined;
    if (method === "PATCH") {
        const body = asRecord(req.body);
        status = typeof body.status === "string" ? body.status : "";
        if (!(STATUSES as readonly string[]).includes(status)) {
            return sendError(res, 422, `Status must be one of: ${STATUSES.join(", ")}.`);
        }
    }

    try {
        await ensureSchema();
        if (method === "DELETE") return await deleteReview(id, res);
        if (status) return await updateStatus(id, status, res);
        return sendError(res, 400, "Missing review details.");
    } catch (error) {
        logFailure("reviews/[id]", error);
        return sendError(res, 500, "Something went wrong reaching the review database.");
    }
};

/** One physical function serving /api/reviews and /api/reviews/:id — see vercel.json's rewrites. */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    const id = readQueryParam(req, "id");
    if (!id) return handleList(req, res);
    return handleOne(id, req, res);
};

export default handler;
