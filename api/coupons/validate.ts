import type { VercelRequest, VercelResponse } from "@vercel/node";

import { validateCoupon } from "../_lib/coupons";
import { ensureSchema } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { parseCheckoutItems, resolveOrderItems } from "../_lib/orders";

/**
 * Preview only — lets the checkout page show the discount before the customer
 * commits. No redemption, no DB write; order creation re-validates from
 * scratch and performs the one write that matters.
 */
const handler = async (req: VercelRequest, res: VercelResponse) => {
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

export default handler;
