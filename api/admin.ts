import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
    clearLoginAttempts,
    clearSessionCookie,
    consumeLoginAttempt,
    isAdminConfigured,
    isAuthenticated,
    setSessionCookie,
    verifyPassword,
} from "./_lib/auth.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";

const handleLogin = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    res.setHeader("Cache-Control", "no-store");

    if (!isAdminConfigured()) {
        return sendError(
            res,
            503,
            "Admin access is not configured yet. Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET on the project."
        );
    }

    if (!consumeLoginAttempt(req)) {
        return sendError(res, 429, "Too many attempts. Wait a few minutes and try again.");
    }

    try {
        if (!verifyPassword(asRecord(req.body).password)) {
            return sendError(res, 401, "Incorrect password.");
        }
    } catch (error) {
        logFailure("admin/login", error);
        return sendError(res, 500, "Could not verify the password.");
    }

    clearLoginAttempts(req);
    setSessionCookie(req, res);
    return sendJson(res, 200, { authenticated: true });
};

const handleLogout = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    res.setHeader("Cache-Control", "no-store");
    clearSessionCookie(req, res);
    return sendJson(res, 200, { authenticated: false });
};

const handleSession = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

    res.setHeader("Cache-Control", "no-store");
    return sendJson(res, 200, {
        authenticated: isAuthenticated(req),
        configured: isAdminConfigured(),
    });
};

/**
 * One physical function fanning out /api/admin/{login,logout,session} — see
 * the matching entries in vercel.json's rewrites. Kept as one file (rather
 * than the filesystem's own [slug] routing) to stay under the Hobby plan's
 * 12-serverless-function cap; local `[[...path]]` catch-all routing was
 * tested and found unreliable for non-Next.js API directories.
 */
const handler = (req: VercelRequest, res: VercelResponse) => {
    const action = readQueryParam(req, "action");
    if (action === "login") return handleLogin(req, res);
    if (action === "logout") return handleLogout(req, res);
    if (action === "session") return handleSession(req, res);
    return sendError(res, 404, "Not found.");
};

export default handler;
