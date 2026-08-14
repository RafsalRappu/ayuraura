import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { COUPON_COLUMNS, parseCouponInput, toCoupon } from "../_lib/coupons";
import type { CouponInput, CouponRow } from "../_lib/coupons";
import { ensureSchema, getSql, isUniqueViolation } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";

const readCode = (req: VercelRequest) => {
    const value = req.query.code;
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const updateCoupon = async (code: string, input: CouponInput, res: VercelResponse) => {
    const sql = getSql();

    try {
        const rows = (await sql`
            UPDATE coupons SET
                code        = ${input.code},
                type        = ${input.type},
                value       = ${input.value},
                starts_at   = ${input.startsAt ? input.startsAt.toISOString() : null},
                expires_at  = ${input.expiresAt ? input.expiresAt.toISOString() : null},
                usage_limit = ${input.usageLimit},
                active      = ${input.active}
            WHERE code = ${code}
            RETURNING ${sql.unsafe(COUPON_COLUMNS)}
        `) as CouponRow[];

        if (!rows.length) return sendError(res, 404, "Coupon not found.");

        res.setHeader("Cache-Control", "no-store");
        sendJson(res, 200, { coupon: toCoupon(rows[0]) });
    } catch (error) {
        if (isUniqueViolation(error)) {
            return sendError(res, 409, `A coupon with the code "${input.code}" already exists.`);
        }
        throw error;
    }
};

const deleteCoupon = async (code: string, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`DELETE FROM coupons WHERE code = ${code} RETURNING id`) as { id: number }[];

    if (!rows.length) return sendError(res, 404, "Coupon not found.");

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { deleted: code });
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "PUT" && method !== "DELETE") return methodNotAllowed(res, ["PUT", "DELETE"]);
    if (!requireAdmin(req, res)) return;

    const code = readCode(req).toUpperCase();
    if (!code) return sendError(res, 400, "Coupon code is missing.");

    let input: CouponInput | undefined;
    if (method === "PUT") {
        const parsed = parseCouponInput(asRecord(req.body));
        if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);
        input = parsed.value;
    }

    try {
        await ensureSchema();
        if (method === "DELETE") return await deleteCoupon(code, res);
        if (input) return await updateCoupon(code, input, res);
        return sendError(res, 400, "Missing coupon details.");
    } catch (error) {
        logFailure("coupons/[code]", error);
        return sendError(res, 500, "Something went wrong reaching the coupon database.");
    }
};

export default handler;
