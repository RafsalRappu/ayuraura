import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkCustomerOrigin, setCustomerSessionCookie } from "../_lib/customerAuth";
import { CUSTOMER_COLUMNS, parseLoginInput, toCustomer } from "../_lib/customers";
import type { CustomerRow } from "../_lib/customers";
import { ensureSchema, getSql } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { verifyAgainstDummyHash, verifyPasswordHash } from "../_lib/password";
import { checkRateLimit } from "../_lib/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    const parsed = parseLoginInput(asRecord(req.body));
    if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

    const { phone, password } = parsed.value;

    // Rate-limited by BOTH IP and phone — IP-only throttling doesn't stop a
    // distributed, low-and-slow run against one target phone from many IPs.
    if (
        !checkRateLimit(`customer-login-ip:${clientKey(req)}`, { windowMs: WINDOW_MS, max: MAX_ATTEMPTS }) ||
        !checkRateLimit(`customer-login-phone:${phone}`, { windowMs: WINDOW_MS, max: MAX_ATTEMPTS })
    ) {
        return sendError(res, 429, "Too many attempts. Wait a few minutes and try again.");
    }

    try {
        await ensureSchema();
        const sql = getSql();

        const rows = (await sql`
            SELECT ${sql.unsafe(CUSTOMER_COLUMNS)} FROM customers WHERE phone = ${phone}
        `) as CustomerRow[];

        // Always run a scrypt verification of equal cost, whether or not the
        // phone matched, so response timing can't reveal which phone numbers
        // are registered.
        const valid = rows.length
            ? await verifyPasswordHash(password, rows[0].password_hash)
            : await verifyAgainstDummyHash(password);

        if (!rows.length || !valid) {
            return sendError(res, 401, "Incorrect phone or password.");
        }

        setCustomerSessionCookie(req, res, rows[0].id);
        sendJson(res, 200, { customer: toCustomer(rows[0]) });
    } catch (error) {
        logFailure("customers/login", error);
        return sendError(res, 500, "Could not sign you in.");
    }
};

export default handler;
