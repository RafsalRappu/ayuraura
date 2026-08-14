import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkCustomerOrigin, requireCustomer } from "../_lib/customerAuth";
import { ensureSchema, getSql } from "../_lib/db";
import { logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { ORDER_COLUMNS, toOrder } from "../_lib/orders";
import type { OrderRow } from "../_lib/orders";

const ORDER_LIMIT = 100;

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!checkCustomerOrigin(req, res)) return;

    const customerId = requireCustomer(req, res);
    if (customerId === false) return;

    res.setHeader("Cache-Control", "no-store");

    try {
        await ensureSchema();
        const sql = getSql();

        // customerId comes only from the signed session cookie, never from a
        // query param or body — the only way this could leak another
        // customer's orders is a bug in requireCustomer itself.
        const rows = (await sql`
            SELECT ${sql.unsafe(ORDER_COLUMNS)} FROM orders
            WHERE customer_id = ${customerId}
            ORDER BY id DESC
            LIMIT ${ORDER_LIMIT}
        `) as OrderRow[];

        sendJson(res, 200, { orders: rows.map(toOrder) });
    } catch (error) {
        logFailure("customers/orders", error);
        return sendError(res, 500, "Could not load your orders.");
    }
};

export default handler;
