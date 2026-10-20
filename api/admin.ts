import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
    clearLoginAttempts,
    clearSessionCookie,
    consumeLoginAttempt,
    isAdminConfigured,
    isAuthenticated,
    requireAdmin,
    setSessionCookie,
    verifyPassword,
} from "./_lib/auth.js";
import { ensureSchema, getSql } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { ORDER_COLUMNS, toAdminOrder } from "./_lib/orders.js";
import type { OrderRow } from "./_lib/orders.js";
import { getStorageStatus } from "./_lib/storage.js";

/** Orders per backup page — small enough to stay far below the platform's response-size cap. */
const BACKUP_PAGE_SIZE = 500;

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

const handleStorage = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!requireAdmin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");
    try {
        sendJson(res, 200, await getStorageStatus());
    } catch (error) {
        logFailure("admin/storage", error);
        sendError(res, 500, "Could not read database storage.");
    }
};

/**
 * One page of every order, oldest first, for the admin's backup download. The
 * browser walks the pages (`after` = the previous page's `nextAfter`) and builds
 * the file itself, so no single response grows with the table. Refuses until
 * storage reaches the threshold, matching the disabled button in the UI.
 */
const handleBackup = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!requireAdmin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");
    try {
        const storage = await getStorageStatus();
        if (!storage.backupEnabled) {
            return sendError(
                res,
                403,
                `Backups unlock when storage reaches ${storage.thresholdPercent}% — it is at ${storage.percent}%.`
            );
        }

        await ensureSchema();
        const after = Math.max(0, Math.trunc(Number(readQueryParam(req, "after"))) || 0);

        const sql = getSql();
        const rows = (await sql`
            SELECT ${sql.unsafe(ORDER_COLUMNS)}
            FROM orders
            WHERE id > ${after}
            ORDER BY id ASC
            LIMIT ${BACKUP_PAGE_SIZE}
        `) as OrderRow[];

        const nextAfter = rows.length === BACKUP_PAGE_SIZE ? rows[rows.length - 1].id : null;
        sendJson(res, 200, { orders: rows.map(toAdminOrder), nextAfter });
    } catch (error) {
        logFailure("admin/backup", error);
        sendError(res, 500, "Could not read the orders for backup.");
    }
};

/**
 * One physical function fanning out /api/admin/{login,logout,session,storage,backup} — see
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
    if (action === "storage") return handleStorage(req, res);
    if (action === "backup") return handleBackup(req, res);
    return sendError(res, 404, "Not found.");
};

export default handler;
