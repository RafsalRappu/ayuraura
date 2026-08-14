import type { VercelRequest, VercelResponse } from "@vercel/node";

import { ensureSchema, getSql } from "../../_lib/db";
import { logFailure, methodNotAllowed, sendError, sendJson } from "../../_lib/http";
import { ORDER_COLUMNS } from "../../_lib/orders";
import type { OrderRow } from "../../_lib/orders";
import { createRazorpayOrder, isPaymentsConfigured } from "../../_lib/payments";

const readPublicId = (req: VercelRequest) => {
    const value = req.query.id;
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const respondWithOrder = (res: VercelResponse, razorpayOrderId: string, order: OrderRow) =>
    sendJson(res, 200, {
        razorpayOrderId,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
    });

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    const publicId = readPublicId(req);
    if (!publicId) return sendError(res, 400, "Order id is missing.");

    res.setHeader("Cache-Control", "no-store");

    try {
        await ensureSchema();
        const sql = getSql();

        const rows = (await sql`
            SELECT ${sql.unsafe(ORDER_COLUMNS)} FROM orders WHERE public_id = ${publicId}
        `) as OrderRow[];
        if (!rows.length) return sendError(res, 404, "Order not found.");

        const order = rows[0];

        if (order.status === "paid" || order.status === "cancelled") {
            return sendError(res, 409, `This order is already ${order.status}.`);
        }

        // Idempotent retry — a previous call already created one, nothing new to do.
        if (order.status === "pending" && order.razorpay_order_id) {
            return respondWithOrder(res, order.razorpay_order_id, order);
        }

        if (!isPaymentsConfigured()) {
            return sendError(
                res,
                503,
                "Online payment isn't set up yet. We'll reach out to confirm your order and arrange payment."
            );
        }

        const created = await createRazorpayOrder(order.amount, `order_${order.public_id}`);

        const updated =
            order.status === "failed"
                ? // A fresh attempt after a failure — replace the stale id outright.
                  ((await sql`
                    UPDATE orders SET razorpay_order_id = ${created.id}, status = 'pending', updated_at = NOW()
                    WHERE public_id = ${publicId} AND status = 'failed'
                    RETURNING razorpay_order_id
                `) as { razorpay_order_id: string }[])
                : // status = 'pending', no id yet. Race-safe: if a concurrent call
                  // already stored one, keep that instead of ours.
                  ((await sql`
                    UPDATE orders SET razorpay_order_id = COALESCE(razorpay_order_id, ${created.id}), updated_at = NOW()
                    WHERE public_id = ${publicId} AND status = 'pending'
                    RETURNING razorpay_order_id
                `) as { razorpay_order_id: string }[]);

        // The order's status changed under us (e.g. an admin cancelled it) between
        // the SELECT above and this UPDATE — the Razorpay order we just created is
        // simply abandoned, uncaptured, harmless.
        if (!updated.length) {
            return sendError(res, 409, "This order changed while payment was starting — please refresh and retry.");
        }

        respondWithOrder(res, updated[0].razorpay_order_id, order);
    } catch (error) {
        logFailure("orders/[id]/pay", error);
        return sendError(res, 500, "Could not start the payment. Please try again.");
    }
};

export default handler;
