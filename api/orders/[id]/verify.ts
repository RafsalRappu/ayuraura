import type { VercelRequest, VercelResponse } from "@vercel/node";

import { ensureSchema, getSql } from "../../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../../_lib/http";
import { ORDER_COLUMNS, toOrder } from "../../_lib/orders";
import type { OrderRow } from "../../_lib/orders";
import { verifyPaymentSignature } from "../../_lib/payments";

const readPublicId = (req: VercelRequest) => {
    const value = req.query.id;
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    const publicId = readPublicId(req);
    if (!publicId) return sendError(res, 400, "Order id is missing.");

    const body = asRecord(req.body);
    const razorpayOrderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";

    if (!razorpayOrderId || !paymentId || !signature) {
        return sendError(res, 400, "Missing payment confirmation details.");
    }

    res.setHeader("Cache-Control", "no-store");

    try {
        await ensureSchema();
        const sql = getSql();

        const rows = (await sql`
            SELECT ${sql.unsafe(ORDER_COLUMNS)} FROM orders WHERE public_id = ${publicId}
        `) as OrderRow[];
        if (!rows.length) return sendError(res, 404, "Order not found.");

        const order = rows[0];

        // Only ever HMAC the order id WE stored for this order, never the one the
        // client sent — otherwise a valid signature from a different, unrelated
        // payment could be replayed onto this order's /verify URL and pass.
        if (order.razorpay_order_id !== razorpayOrderId) {
            return sendError(res, 400, "This payment does not match this order.");
        }

        if (order.status === "paid") {
            // Already confirmed, most likely by the webhook winning the race —
            // treat as success rather than error for a payment that did succeed.
            return sendJson(res, 200, { order: toOrder(order) });
        }

        if (!verifyPaymentSignature({ orderId: razorpayOrderId, paymentId, signature })) {
            return sendError(res, 400, "Payment could not be verified.");
        }

        const updated = (await sql`
            UPDATE orders SET status = 'paid', razorpay_payment_id = ${paymentId}, updated_at = NOW()
            WHERE public_id = ${publicId} AND status <> 'paid'
            RETURNING ${sql.unsafe(ORDER_COLUMNS)}
        `) as OrderRow[];

        if (updated.length) return sendJson(res, 200, { order: toOrder(updated[0]) });

        // 0 rows means something else (the webhook) marked it paid in between —
        // re-read and return success either way.
        const fresh = (await sql`
            SELECT ${sql.unsafe(ORDER_COLUMNS)} FROM orders WHERE public_id = ${publicId}
        `) as OrderRow[];
        sendJson(res, 200, { order: toOrder(fresh[0]) });
    } catch (error) {
        logFailure("orders/[id]/verify", error);
        return sendError(res, 500, "Could not verify the payment. Please try again.");
    }
};

export default handler;
