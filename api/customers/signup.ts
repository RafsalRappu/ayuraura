import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkCustomerOrigin, setCustomerSessionCookie } from "../_lib/customerAuth";
import { CUSTOMER_COLUMNS, parseSignupInput, toCustomer } from "../_lib/customers";
import type { CustomerRow } from "../_lib/customers";
import { ensureSchema, getSql, isUniqueViolation } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { hashPassword } from "../_lib/password";
import { checkRateLimit } from "../_lib/rateLimit";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    if (!checkRateLimit(`customer-signup:${clientKey(req)}`, { windowMs: WINDOW_MS, max: MAX_ATTEMPTS })) {
        return sendError(res, 429, "Too many attempts. Wait a few minutes and try again.");
    }

    const parsed = parseSignupInput(asRecord(req.body));
    if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

    try {
        await ensureSchema();
        const sql = getSql();
        const { phone, password, name, email } = parsed.value;
        const passwordHash = await hashPassword(password);

        // A single INSERT relying on the UNIQUE constraint, not check-then-insert
        // — the latter is a TOCTOU race letting two concurrent signups for the
        // same phone both pass a pre-check.
        const rows = (await sql`
            INSERT INTO customers (phone, password_hash, name, email)
            VALUES (${phone}, ${passwordHash}, ${name}, ${email ?? null})
            RETURNING ${sql.unsafe(CUSTOMER_COLUMNS)}
        `) as CustomerRow[];

        setCustomerSessionCookie(req, res, rows[0].id);
        sendJson(res, 201, { customer: toCustomer(rows[0]) });
    } catch (error) {
        if (isUniqueViolation(error)) {
            return sendError(res, 409, "This phone number is already registered — try signing in instead.");
        }
        logFailure("customers/signup", error);
        return sendError(res, 500, "Could not create your account.");
    }
};

export default handler;
