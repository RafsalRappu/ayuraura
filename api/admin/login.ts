import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
    clearLoginAttempts,
    consumeLoginAttempt,
    isAdminConfigured,
    setSessionCookie,
    verifyPassword,
} from "../_lib/auth";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";

const handler = (req: VercelRequest, res: VercelResponse) => {
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

export default handler;
