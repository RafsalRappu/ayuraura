import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkCustomerOrigin, getAuthenticatedCustomerId, isCustomerAuthConfigured } from "../_lib/customerAuth";
import { CUSTOMER_COLUMNS, toCustomer } from "../_lib/customers";
import type { CustomerRow } from "../_lib/customers";
import { ensureSchema, getSql } from "../_lib/db";
import { logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    const customerId = getAuthenticatedCustomerId(req);
    if (customerId === null) {
        return sendJson(res, 200, { authenticated: false, configured: isCustomerAuthConfigured() });
    }

    try {
        await ensureSchema();
        const sql = getSql();
        const rows = (await sql`
            SELECT ${sql.unsafe(CUSTOMER_COLUMNS)} FROM customers WHERE id = ${customerId}
        `) as CustomerRow[];

        if (!rows.length) {
            return sendJson(res, 200, { authenticated: false, configured: isCustomerAuthConfigured() });
        }

        sendJson(res, 200, { authenticated: true, customer: toCustomer(rows[0]), configured: true });
    } catch (error) {
        logFailure("customers/session", error);
        return sendError(res, 500, "Could not check your session.");
    }
};

export default handler;
