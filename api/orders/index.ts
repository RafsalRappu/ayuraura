import { randomUUID } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { redeemCoupon, validateCoupon } from "../_lib/coupons";
import { getAuthenticatedCustomerId } from "../_lib/customerAuth";
import { ensureSchema, getSql } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { ORDER_COLUMNS, parseOrderInput, resolveOrderItems, toAdminOrder, toOrder } from "../_lib/orders";
import type { OrderRow } from "../_lib/orders";
import { checkRateLimit } from "../_lib/rateLimit";

const ORDER_LIMIT = 200;
const CREATE_WINDOW_MS = 10 * 60 * 1000;
const CREATE_MAX_ATTEMPTS = 20;

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

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

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    // Anyone can place an order; only the shop owner sees the list — the
    // inverse of api/products/index.ts, where GET is public and POST is admin.
    if (method === "GET" && !requireAdmin(req, res)) return;

    try {
        await ensureSchema();
        return method === "GET" ? await listOrders(res) : await createOrder(req, res);
    } catch (error) {
        logFailure("orders", error);
        return sendError(res, 500, "Something went wrong reaching the order database.");
    }
};

export default handler;
