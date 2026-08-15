import type { VercelRequest, VercelResponse } from "@vercel/node";

import { ensureSchema, getSql } from "../_lib/db.js";
import { logFailure, methodNotAllowed, readRawBody, sendError, sendJson } from "../_lib/http.js";
import { verifyWebhookSignature } from "../_lib/payments.js";

interface RazorpayWebhookPayload {
    event?: string;
    payload?: {
        payment?: {
            entity?: {
                id?: string;
                order_id?: string;
            };
        };
    };
}

/**
 * Razorpay's server calls this directly on payment events — no admin cookie,
 * no matching Origin, so authorization here is the HMAC signature alone, not
 * `requireAdmin`. This is the durable source of truth for payment status: the
 * client's own /verify call can be skipped entirely if the browser closes
 * right after payment, so this webhook is what reconciles it regardless.
 */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    const signatureHeader = req.headers["x-razorpay-signature"];
    const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
    if (!signature) return sendError(res, 400, "Missing webhook signature.");

    try {
        const rawBody = (await readRawBody(req)).toString("utf8");

        if (!verifyWebhookSignature(rawBody, signature)) {
            return sendError(res, 400, "Invalid webhook signature.");
        }

        let event: RazorpayWebhookPayload;
        try {
            event = JSON.parse(rawBody) as RazorpayWebhookPayload;
        } catch {
            return sendError(res, 400, "Malformed webhook payload.");
        }

        const payment = event.payload?.payment?.entity;
        const razorpayOrderId = payment?.order_id;

        if (!razorpayOrderId) {
            // Not a payment event we act on — acknowledge so Razorpay doesn't
            // keep retrying an event we're intentionally ignoring.
            return sendJson(res, 200, { received: true });
        }

        await ensureSchema();
        const sql = getSql();

        if (event.event === "payment.captured") {
            await sql`
                UPDATE orders SET status = 'paid', razorpay_payment_id = ${payment?.id ?? null}, updated_at = NOW()
                WHERE razorpay_order_id = ${razorpayOrderId} AND status <> 'paid'
            `;
        } else if (event.event === "payment.failed") {
            // Only pending -> failed. Never downgrade an order already
            // confirmed paid, since webhook delivery order isn't guaranteed.
            await sql`
                UPDATE orders SET status = 'failed', updated_at = NOW()
                WHERE razorpay_order_id = ${razorpayOrderId} AND status = 'pending'
            `;
        }

        sendJson(res, 200, { received: true });
    } catch (error) {
        logFailure("webhooks/razorpay", error);
        // 5xx so Razorpay retries — this is a processing failure, not a rejected event.
        return sendError(res, 500, "Could not process the webhook.");
    }
};

export default handler;
