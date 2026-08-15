import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "./_lib/auth.js";
import { COUPON_COLUMNS, parseCouponInput, toCoupon, validateCoupon } from "./_lib/coupons.js";
import type { CouponInput, CouponRow } from "./_lib/coupons.js";
import { ensureSchema, getSql, isUniqueViolation } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { parseCheckoutItems, resolveOrderItems } from "./_lib/orders.js";

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

const handleList = async (req: VercelRequest, res: VercelResponse) => {
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

const handleOne = async (rawCode: string, req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "PUT" && method !== "DELETE") return methodNotAllowed(res, ["PUT", "DELETE"]);
    if (!requireAdmin(req, res)) return;

    const code = rawCode.toUpperCase();

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

/**
 * Preview only — lets the checkout page show the discount before the customer
 * commits. No redemption, no DB write; order creation re-validates from
 * scratch and performs the one write that matters.
 */
const handleValidate = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    const body = asRecord(req.body);
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!code) return sendError(res, 400, "A coupon code is required.");

    res.setHeader("Cache-Control", "no-store");

    try {
        await ensureSchema();

        const ignoredErrors: string[] = [];
        const items = parseCheckoutItems(body.items, ignoredErrors);
        const { amount: subtotal } = await resolveOrderItems(items, ignoredErrors);

        const result = await validateCoupon(code, subtotal);
        if (!result.ok) {
            return sendJson(res, 200, { valid: false, discountAmount: 0, message: result.errors[0] });
        }

        sendJson(res, 200, { valid: true, discountAmount: result.value.discountAmount });
    } catch (error) {
        logFailure("coupons/validate", error);
        return sendError(res, 500, "Could not check that code right now.");
    }
};

/**
 * One physical function serving /api/coupons, /api/coupons/:code and
 * /api/coupons/validate — see vercel.json's rewrites (the validate rule is
 * listed there ahead of the :code rule so it wins the match).
 */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (readQueryParam(req, "action") === "validate") return handleValidate(req, res);

    const code = readQueryParam(req, "code");
    if (!code) return handleList(req, res);
    return handleOne(code, req, res);
};

export default handler;
