import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { COUPON_COLUMNS, parseCouponInput, toCoupon } from "../_lib/coupons";
import type { CouponInput, CouponRow } from "../_lib/coupons";
import { ensureSchema, getSql, isUniqueViolation } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";

const listCoupons = async (res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT ${sql.unsafe(COUPON_COLUMNS)} FROM coupons ORDER BY created_at DESC
    `) as CouponRow[];

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { coupons: rows.map(toCoupon) });
};

const createCoupon = async (input: CouponInput, res: VercelResponse) => {
    const sql = getSql();

    try {
        const rows = (await sql`
            INSERT INTO coupons (code, type, value, starts_at, expires_at, usage_limit, active)
            VALUES (
                ${input.code}, ${input.type}, ${input.value},
                ${input.startsAt ? input.startsAt.toISOString() : null},
                ${input.expiresAt ? input.expiresAt.toISOString() : null},
                ${input.usageLimit}, ${input.active}
            )
            RETURNING ${sql.unsafe(COUPON_COLUMNS)}
        `) as CouponRow[];

        res.setHeader("Cache-Control", "no-store");
        sendJson(res, 201, { coupon: toCoupon(rows[0]) });
    } catch (error) {
        if (isUniqueViolation(error)) {
            return sendError(res, 409, `A coupon with the code "${input.code}" already exists.`);
        }
        throw error;
    }
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);
    if (!requireAdmin(req, res)) return;

    let input: CouponInput | undefined;
    if (method === "POST") {
        const parsed = parseCouponInput(asRecord(req.body));
        if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);
        input = parsed.value;
    }

    try {
        await ensureSchema();
        return input ? await createCoupon(input, res) : await listCoupons(res);
    } catch (error) {
        logFailure("coupons", error);
        return sendError(res, 500, "Something went wrong reaching the coupon database.");
    }
};

export default handler;
