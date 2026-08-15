import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
    checkCustomerOrigin,
    clearCustomerSessionCookie,
    getAuthenticatedCustomerId,
    isCustomerAuthConfigured,
    requireCustomer,
    setCustomerSessionCookie,
} from "./_lib/customerAuth.js";
import { CUSTOMER_COLUMNS, parseLoginInput, parseSignupInput, toCustomer } from "./_lib/customers.js";
import type { CustomerRow } from "./_lib/customers.js";
import { ensureSchema, getSql, isUniqueViolation } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { ORDER_COLUMNS, toOrder } from "./_lib/orders.js";
import type { OrderRow } from "./_lib/orders.js";
import { hashPassword, verifyAgainstDummyHash, verifyPasswordHash } from "./_lib/password.js";
import { checkRateLimit } from "./_lib/rateLimit.js";

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

const handleLogin = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    const parsed = parseLoginInput(asRecord(req.body));
    if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

    const { phone, password } = parsed.value;

    // Rate-limited by BOTH IP and phone — IP-only throttling doesn't stop a
    // distributed, low-and-slow run against one target phone from many IPs.
    if (
        !checkRateLimit(`customer-login-ip:${clientKey(req)}`, { windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX_ATTEMPTS }) ||
        !checkRateLimit(`customer-login-phone:${phone}`, { windowMs: LOGIN_WINDOW_MS, max: LOGIN_MAX_ATTEMPTS })
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

const handleLogout = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");
    clearCustomerSessionCookie(req, res);
    return sendJson(res, 200, { authenticated: false });
};

const ORDER_LIMIT = 100;

const handleOrders = async (req: VercelRequest, res: VercelResponse) => {
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

const handleSession = async (req: VercelRequest, res: VercelResponse) => {
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

const SIGNUP_WINDOW_MS = 10 * 60 * 1000;
const SIGNUP_MAX_ATTEMPTS = 5;

const handleSignup = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");

    if (
        !checkRateLimit(`customer-signup:${clientKey(req)}`, { windowMs: SIGNUP_WINDOW_MS, max: SIGNUP_MAX_ATTEMPTS })
    ) {
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

/** One physical function fanning out /api/customers/{login,logout,orders,session,signup} — see vercel.json's rewrites. */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    const action = readQueryParam(req, "action");
    if (action === "login") return handleLogin(req, res);
    if (action === "logout") return handleLogout(req, res);
    if (action === "orders") return handleOrders(req, res);
    if (action === "session") return handleSession(req, res);
    if (action === "signup") return handleSignup(req, res);
    return sendError(res, 404, "Not found.");
};

export default handler;
