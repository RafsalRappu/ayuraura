import { createHmac, timingSafeEqual } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const COOKIE_NAME = "ayuaura_admin";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

export const isAdminConfigured = () =>
    Boolean(process.env.ADMIN_PASSWORD) && Boolean(process.env.ADMIN_SESSION_SECRET);

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

/** Constant-time comparison that tolerates differing lengths. */
const safeEqual = (a: string, b: string) => {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) {
        // Still burn a comparison so failure timing does not leak the length.
        timingSafeEqual(bufferA, bufferA);
        return false;
    }
    return timingSafeEqual(bufferA, bufferB);
};

export const verifyPassword = (candidate: unknown) =>
    typeof candidate === "string" && safeEqual(candidate, requireEnv("ADMIN_PASSWORD"));

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

export const setSessionCookie = (req: VercelRequest, res: VercelResponse) => {
    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const payload = base64url(JSON.stringify({ exp: expiresAt }));
    res.setHeader("Set-Cookie", buildCookie(req, `${payload}.${sign(payload)}`, SESSION_TTL_SECONDS));
};

export const clearSessionCookie = (req: VercelRequest, res: VercelResponse) => {
    res.setHeader("Set-Cookie", buildCookie(req, "", 0));
};

export const isAuthenticated = (req: VercelRequest) => {
    if (!isAdminConfigured()) return false;

    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return false;

    const separator = token.lastIndexOf(".");
    if (separator <= 0) return false;

    const payload = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!safeEqual(signature, sign(payload))) return false;

    try {
        const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp?: number };
        return typeof exp === "number" && exp > Math.floor(Date.now() / 1000);
    } catch {
        return false;
    }
};

/**
 * Rejects unauthenticated writes. Also checks Origin, so a signed-in admin
 * cannot be tricked into a cross-site request that slips past SameSite.
 */
export const requireAdmin = (req: VercelRequest, res: VercelResponse): boolean => {
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

    if (!isAuthenticated(req)) {
        res.status(401);
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.send(JSON.stringify({ message: "Not signed in." }));
        return false;
    }

    return true;
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
