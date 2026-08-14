import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { safeEqual } from "./crypto";

/**
 * Deliberately separate from api/_lib/auth.ts (admin) — its own cookie, its
 * own secret, its own file. Touching the already-shipped admin auth for a
 * new, self-service, many-users feature is exactly the kind of change to
 * avoid; a shared session abstraction can happen later once this has shipped
 * and stabilized, not preemptively.
 */
const COOKIE_NAME = "ayuaura_customer";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export const isCustomerAuthConfigured = () => Boolean(process.env.CUSTOMER_SESSION_SECRET);

const requireEnv = (key: string) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(
            `${key} is not set. Add it under Vercel → Project → Settings → Environment Variables ` +
                "(and to .env.local for local development)."
        );
    }
    return value;
};

const base64url = (value: Buffer | string) => Buffer.from(value).toString("base64url");

const sign = (payload: string) =>
    base64url(createHmac("sha256", requireEnv("CUSTOMER_SESSION_SECRET")).update(payload).digest());

const isLocalRequest = (req: VercelRequest) => {
    const host = req.headers.host ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
};

const buildCookie = (req: VercelRequest, value: string, maxAge: number) => {
    const parts = [`${COOKIE_NAME}=${value}`, "Path=/", "HttpOnly", "SameSite=Strict", `Max-Age=${maxAge}`];
    if (!isLocalRequest(req)) parts.push("Secure");
    return parts.join("; ");
};

export const setCustomerSessionCookie = (req: VercelRequest, res: VercelResponse, customerId: number) => {
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const payload = base64url(JSON.stringify({ typ: "customer", customerId, exp: expiresAt }));
    res.setHeader("Set-Cookie", buildCookie(req, `${payload}.${sign(payload)}`, SESSION_TTL_SECONDS));
};

export const clearCustomerSessionCookie = (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Set-Cookie", buildCookie(req, "", 0));
};

/**
 * Verifies the signature BEFORE trusting anything parsed out of the payload —
 * same order as admin's isAuthenticated. Returns null on any failure
 * (missing cookie, bad signature, wrong typ, expired, malformed customerId),
 * never throws.
 */
export const getAuthenticatedCustomerId = (req: VercelRequest): number | null => {
    if (!isCustomerAuthConfigured()) return null;

    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return null;

    const separator = token.lastIndexOf(".");
    if (separator <= 0) return null;

    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, sign(payload))) return null;

    try {
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
            typ?: unknown;
            customerId?: unknown;
            exp?: unknown;
        };
        if (parsed.typ !== "customer") return null;
        if (typeof parsed.exp !== "number" || parsed.exp <= Math.floor(Date.now() / 1000)) return null;
        if (typeof parsed.customerId !== "number" || !Number.isInteger(parsed.customerId)) return null;
        return parsed.customerId;
    } catch {
        return null;
    }
};

/**
 * Writes a 401 and returns false if there's no valid customer session —
 * callers do `const id = requireCustomer(req, res); if (id === false) return;`.
 */
export const requireCustomer = (req: VercelRequest, res: VercelResponse): number | false => {
    const id = getAuthenticatedCustomerId(req);
    if (id === null) {
        res.status(401);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(JSON.stringify({ message: "Not signed in." }));
        return false;
    }
    return id;
};

/**
 * SameSite=Strict only protects a cookie that already exists — it does
 * nothing against a cross-site form POST whose entire point is to
 * *establish* a new one ("login CSRF": no preflight blocks a form POST, and
 * even though the attacker's page can't read the JSON response, the
 * Set-Cookie side effect still lands in the victim's browser). Call this
 * unconditionally, before any auth check, on every customer endpoint —
 * including signup/login, which have no session yet to gate on.
 */
export const checkCustomerOrigin = (req: VercelRequest, res: VercelResponse): boolean => {
    const origin = req.headers.origin;
    if (!origin) return true;

    const host = req.headers.host;
    let originHost = "";
    try {
        originHost = new URL(origin).host;
    } catch {
        originHost = "";
    }

    if (!host || originHost !== host) {
        res.status(403);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(JSON.stringify({ message: "Cross-origin request rejected." }));
        return false;
    }
    return true;
};
