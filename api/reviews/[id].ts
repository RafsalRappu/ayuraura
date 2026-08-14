import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { ensureSchema, getSql } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { STATUSES, toAdminReview } from "../_lib/reviews";
import type { AdminReviewRow } from "../_lib/reviews";

const readId = (req: VercelRequest) => {
    const value = req.query.id;
    const raw = (Array.isArray(value) ? value[0] : value) ?? "";
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
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

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "PATCH" && method !== "DELETE") return methodNotAllowed(res, ["PATCH", "DELETE"]);
    if (!requireAdmin(req, res)) return;

    const id = readId(req);
    if (id === null) return sendError(res, 400, "Review id is missing.");

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

export default handler;
