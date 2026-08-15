import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "./_lib/auth.js";
import { redeemCoupon, validateCoupon } from "./_lib/coupons.js";
import { getAuthenticatedCustomerId } from "./_lib/customerAuth.js";
import { ensureSchema, getSql } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { ORDER_COLUMNS, STATUSES, parseOrderInput, resolveOrderItems, toAdminOrder, toOrder } from "./_lib/orders.js";
import type { OrderRow } from "./_lib/orders.js";
import { createRazorpayOrder, isPaymentsConfigured, verifyPaymentSignature } from "./_lib/payments.js";
import { checkRateLimit } from "./_lib/rateLimit.js";

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

const ORDER_LIMIT = 200;
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const CREATE_MAX_ATTEMPTS = 20;

const listOrders = async (res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT ${sql.unsafe(ORDER_COLUMNS)}
        FROM orders
        ORDER BY id DESC
        LIMIT ${ORDER_LIMIT}
    `) as OrderRow[];

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { orders: rows.map(toAdminOrder) });
};

const createOrder = async (req: VercelRequest, res: VercelResponse) => {
    if (!checkRateLimit(`order:${clientKey(req)}`, { windowMs: CREATE_WINDOW_MS, max: CREATE_MAX_ATTEMPTS })) {
        return sendError(res, 429, "Too many orders placed — please try again in a few minutes.");
    }

    const parsed = parseOrderInput(asRecord(req.body));
    if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

    const errors: string[] = [];
    const { items, amount: subtotal } = await resolveOrderItems(parsed.value.items, errors);
    if (errors.length) return sendError(res, 422, "Some items in your cart changed.", errors);

    let discountAmount = 0;
    let couponCode: string | null = null;
    if (parsed.value.couponCode) {
        const validated = await validateCoupon(parsed.value.couponCode, subtotal);
        if (!validated.ok) return sendError(res, 422, validated.errors[0]);

        // Re-checks the same conditions atomically; 0 rows means the code
        // became invalid (e.g. its last use) between the check above and now.
        if (!(await redeemCoupon(parsed.value.couponCode))) {
            return sendError(res, 422, "That code was just used up — please remove it and try again.");
        }

        discountAmount = validated.value.discountAmount;
        couponCode = validated.value.coupon.code;
    }

    const amount = subtotal - discountAmount;

    const sql = getSql();
    const { customer } = parsed.value;

    // Links the order to a signed-in account, if any — derived only from the
    // session cookie, never sent by the client. Guest checkout (no/invalid
    // cookie) leaves this null, unchanged from before accounts existed.
    const customerId = getAuthenticatedCustomerId(req);

    const rows = (await sql`
        INSERT INTO orders (
            public_id, items, amount, currency,
            customer_name, customer_phone, customer_email, customer_address,
            customer_address_line2, customer_city, customer_state, customer_pincode,
            coupon_code, discount_amount, customer_id
        ) VALUES (
            ${randomUUID()}, ${JSON.stringify(items)}::jsonb, ${amount}, 'INR',
            ${customer.name}, ${customer.phone}, ${customer.email ?? null}, ${customer.addressLine1 ?? null},
            ${customer.addressLine2 ?? null}, ${customer.city ?? null}, ${customer.state ?? null}, ${customer.pincode ?? null},
            ${couponCode}, ${discountAmount}, ${customerId}
        )
        RETURNING ${sql.unsafe(ORDER_COLUMNS)}
    `) as OrderRow[];

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 201, { order: toOrder(rows[0]) });
};

const handleList = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    // Anyone can place an order; only the shop owner sees the list — the
    // inverse of api/products.ts, where GET is public and POST is admin.
    if (method === "GET" && !requireAdmin(req, res)) return;

    try {
        await ensureSchema();
        return method === "GET" ? await listOrders(res) : await createOrder(req, res);
    } catch (error) {
        logFailure("orders", error);
        return sendError(res, 500, "Something went wrong reaching the order database.");
    }
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

const handleOne = async (publicId: string, req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "PATCH") return methodNotAllowed(res, ["GET", "PATCH"]);

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

const respondWithOrder = (res: VercelResponse, razorpayOrderId: string, order: OrderRow) =>
    sendJson(res, 200, {
        razorpayOrderId,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
    });

const handlePay = async (publicId: string, req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

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

const handleVerify = async (publicId: string, req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

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

/**
 * One physical function serving /api/orders, /api/orders/:id,
 * /api/orders/:id/pay and /api/orders/:id/verify — see vercel.json's rewrites.
 */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    const id = readQueryParam(req, "id");
    if (!id) return handleList(req, res);

    const action = readQueryParam(req, "action");
    if (action === "pay") return handlePay(id, req, res);
    if (action === "verify") return handleVerify(id, req, res);
    return handleOne(id, req, res);
};

export default handler;
