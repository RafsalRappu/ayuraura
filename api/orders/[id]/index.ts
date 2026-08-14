import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../../_lib/auth";
import { ensureSchema, getSql } from "../../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../../_lib/http";
import { ORDER_COLUMNS, STATUSES, toAdminOrder, toOrder } from "../../_lib/orders";
import type { OrderRow } from "../../_lib/orders";

/** Always the opaque public_id (a UUID) — never the internal serial id. */
const readPublicId = (req: VercelRequest) => {
    const value = req.query.id;
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const getOrder = async (publicId: string, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT ${sql.unsafe(ORDER_COLUMNS)} FROM orders WHERE public_id = ${publicId}
    `) as OrderRow[];

    if (!rows.length) return sendError(res, 404, "Order not found.");

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { order: toOrder(rows[0]) });
};

interface PatchInput {
    status: string;
    adminNote: string | null;
}

const patchOrder = async (publicId: string, input: PatchInput, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        UPDATE orders SET
            status     = ${input.status},
            admin_note = COALESCE(${input.adminNote}, admin_note),
            updated_at = NOW()
        WHERE public_id = ${publicId}
        RETURNING ${sql.unsafe(ORDER_COLUMNS)}
    `) as OrderRow[];

    if (!rows.length) return sendError(res, 404, "Order not found.");

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { order: toAdminOrder(rows[0]) });
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "PATCH") return methodNotAllowed(res, ["GET", "PATCH"]);

    const publicId = readPublicId(req);
    if (!publicId) return sendError(res, 400, "Order id is missing.");

    let input: PatchInput | undefined;
    if (method === "PATCH") {
        if (!requireAdmin(req, res)) return;

        const body = asRecord(req.body);
        const status = typeof body.status === "string" ? body.status : "";
        if (!(STATUSES as readonly string[]).includes(status)) {
            return sendError(res, 422, `Status must be one of: ${STATUSES.join(", ")}.`);
        }

        const adminNote = typeof body.adminNote === "string" ? body.adminNote.trim() : "";
        input = { status, adminNote: adminNote || null };
    }

    try {
        await ensureSchema();
        if (method === "GET") return await getOrder(publicId, res);
        if (input) return await patchOrder(publicId, input, res);
        return sendError(res, 400, "Missing order details.");
    } catch (error) {
        logFailure("orders/[id]", error);
        return sendError(res, 500, "Something went wrong reaching the order database.");
    }
};

export default handler;
