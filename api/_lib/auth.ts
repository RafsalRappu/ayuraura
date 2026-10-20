import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

import { ADMIN_COLUMNS, toAdminAccount } from "./admins.js";
import type { AdminAccount, AdminRow } from "./admins.js";
import { safeEqual } from "./crypto.js";
import { ensureSchema, getSql } from "./db.js";

const COOKIE_NAME = "ayuaura_admin";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

/** Only the signing secret is required — ADMIN_PASSWORD is just for the first sign-in, before any admin exists. */
export const isAdminConfigured = () => Boolean(process.env.ADMIN_SESSION_SECRET);

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

const base64url = (value: Buffer | string) =>
    Buffer.from(value).toString("base64url");

const sign = (payload: string) =>
    base64url(createHmac("sha256", requireEnv("ADMIN_SESSION_SECRET")).update(payload).digest());

/** Checks the one-time setup password from the environment; false when it isn't set. */
export const verifyBootstrapPassword = (candidate: unknown) => {
    const expected = process.env.ADMIN_PASSWORD;
    return Boolean(expected) && typeof candidate === "string" && safeEqual(candidate, expected as string);
};

const isLocalRequest = (req: VercelRequest) => {
    const host = req.headers.host ?? "";
    return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
};

const buildCookie = (req: VercelRequest, value: string, maxAge: number) => {
    const parts = [
        `${COOKIE_NAME}=${value}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Strict",
        `Max-Age=${maxAge}`,
    ];
    if (!isLocalRequest(req)) parts.push("Secure");
    return parts.join("; ");
};

export const setSessionCookie = (
    req: VercelRequest,
    res: VercelResponse,
    admin: Pick<AdminRow, "id" | "token_version">
) => {
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const payload = base64url(
        JSON.stringify({ typ: "admin", sub: admin.id, ver: admin.token_version, exp: expiresAt })
    );
    res.setHeader("Set-Cookie", buildCookie(req, `${payload}.${sign(payload)}`, SESSION_TTL_SECONDS));
};

export const clearSessionCookie = (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Set-Cookie", buildCookie(req, "", 0));
};

interface SessionClaims {
    id: number;
    version: number;
}

/** Signature + expiry only; whether the admin still exists is checked against the database. */
const readSessionClaims = (req: VercelRequest): SessionClaims | null => {
    if (!isAdminConfigured()) return null;

    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return null;

    const separator = token.lastIndexOf(".");
    if (separator <= 0) return null;

    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, sign(payload))) return null;

    try {
        // `typ` guards against a cross-auth escalation if ADMIN_SESSION_SECRET
        // and CUSTOMER_SESSION_SECRET were ever accidentally set to the same
        // value — a customer's own validly-signed cookie would otherwise also
        // verify here, since only the signature was checked above.
        const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
            typ?: string;
            sub?: number;
            ver?: number;
            exp?: number;
        };
        if (parsed.typ !== "admin") return null;
        if (typeof parsed.exp !== "number" || parsed.exp <= Math.floor(Date.now() / 1000)) return null;
        // Cookies from before per-admin accounts carry no `sub` and must sign in again.
        if (!Number.isInteger(parsed.sub) || !Number.isInteger(parsed.ver)) return null;
        return { id: parsed.sub as number, version: parsed.ver as number };
    } catch {
        return null;
    }
};

/**
 * The signed-in admin, or null. A deleted admin, or one whose password changed
 * since the cookie was issued, no longer matches and is treated as signed out.
 */
export const getAuthenticatedAdmin = async (req: VercelRequest): Promise<AdminAccount | null> => {
    const claims = readSessionClaims(req);
    if (!claims) return null;

    await ensureSchema();
    const sql = getSql();
    const rows = (await sql`
        SELECT ${sql.unsafe(ADMIN_COLUMNS)} FROM admins
        WHERE id = ${claims.id} AND token_version = ${claims.version}
    `) as AdminRow[];
    return rows.length ? toAdminAccount(rows[0]) : null;
};

/**
 * Rejects unauthenticated writes. Also checks Origin, so a signed-in admin
 * cannot be tricked into a cross-site request that slips past SameSite.
 */
export const requireAdmin = async (req: VercelRequest, res: VercelResponse): Promise<AdminAccount | false> => {
    const origin = req.headers.origin;
    if (origin) {
        const host = req.headers.host;
        let originHost: string;
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
    }

    let admin: AdminAccount | null;
    try {
        admin = await getAuthenticatedAdmin(req);
    } catch (error) {
        console.error("[admin/auth]", error);
        res.status(500);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(JSON.stringify({ message: "Could not check your session." }));
        return false;
    }

    if (!admin) {
        res.status(401);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(JSON.stringify({ message: "Not signed in." }));
        return false;
    }

    return admin;
};

/**
 * Per-instance throttle on password guesses. Serverless instances are not
 * shared, so this slows a burst rather than enforcing a global limit.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

const clientKey = (req: VercelRequest) => {
    const forwarded = req.headers["x-forwarded-for"];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first?.split(",")[0]?.trim() || "unknown";
};

export const consumeLoginAttempt = (req: VercelRequest): boolean => {
    const key = clientKey(req);
    const now = Date.now();

    const existing = attempts.get(key);
    if (!existing || existing.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
        return true;
    }

    existing.count += 1;
    return existing.count <= LOGIN_MAX_ATTEMPTS;
};

export const clearLoginAttempts = (req: VercelRequest) => {
    attempts.delete(clientKey(req));
};
