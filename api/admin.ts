import type { VercelRequest, VercelResponse } from "@vercel/node";

import {
    clearLoginAttempts,
    clearSessionCookie,
    consumeLoginAttempt,
    getAuthenticatedAdmin,
    isAdminConfigured,
    requireAdmin,
    setSessionCookie,
    verifyBootstrapPassword,
} from "./_lib/auth.js";
import {
    ADMIN_COLUMNS,
    BOOTSTRAP_USERNAME,
    normalizeUsername,
    parseAdminProfile,
    parseNewAdmin,
    passwordError,
    toAdminAccount,
} from "./_lib/admins.js";
import type { AdminRow } from "./_lib/admins.js";
import { ensureSchema, getSql, isUniqueViolation } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { ORDER_COLUMNS, toAdminOrder } from "./_lib/orders.js";
import type { OrderRow } from "./_lib/orders.js";
import { hashPassword, verifyAgainstDummyHash, verifyPasswordHash } from "./_lib/password.js";
import { getStorageStatus } from "./_lib/storage.js";

/** Orders per backup page — small enough to stay far below the platform's response-size cap. */
const BACKUP_PAGE_SIZE = 500;

const countAdmins = async () => {
    const sql = getSql();
    const [{ count }] = (await sql`SELECT COUNT(*)::int AS count FROM admins`) as { count: number }[];
    return Number(count);
};

/**
 * First sign-in on an empty admins table: "admin" + ADMIN_PASSWORD creates the
 * first account (password hashed into the table). After that the environment
 * password is never accepted again.
 */
const bootstrapFirstAdmin = async (username: string, password: string) => {
    if (username !== BOOTSTRAP_USERNAME || !verifyBootstrapPassword(password)) return null;

    const sql = getSql();
    const passwordHash = await hashPassword(password);
    // WHERE NOT EXISTS / ON CONFLICT cover two first sign-ins racing each other.
    await sql`
        INSERT INTO admins (username, name, password_hash)
        SELECT ${BOOTSTRAP_USERNAME}, 'Admin', ${passwordHash}
        WHERE NOT EXISTS (SELECT 1 FROM admins)
        ON CONFLICT (username) DO NOTHING
    `;
    const rows = (await sql`
        SELECT ${sql.unsafe(ADMIN_COLUMNS)} FROM admins WHERE username = ${BOOTSTRAP_USERNAME}
    `) as AdminRow[];
    return rows[0] ?? null;
};

const handleLogin = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    res.setHeader("Cache-Control", "no-store");

    if (!isAdminConfigured()) {
        return sendError(res, 503, "Admin access is not configured yet. Set ADMIN_SESSION_SECRET on the project.");
    }

    if (!consumeLoginAttempt(req)) {
        return sendError(res, 429, "Too many attempts. Wait a few minutes and try again.");
    }

    const body = asRecord(req.body);
    const username = normalizeUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";

    try {
        await ensureSchema();

        let admin: AdminRow | null = null;
        if ((await countAdmins()) === 0) {
            if (!process.env.ADMIN_PASSWORD) {
                return sendError(
                    res,
                    503,
                    "No admin accounts exist yet. Set ADMIN_PASSWORD on the project for the first sign-in."
                );
            }
            admin = await bootstrapFirstAdmin(username, password);
        } else {
            const sql = getSql();
            const rows = (await sql`
                SELECT ${sql.unsafe(ADMIN_COLUMNS)} FROM admins WHERE username = ${username}
            `) as AdminRow[];
            // Same scrypt cost whether or not the username exists, so timing
            // doesn't reveal which usernames are real.
            const valid = rows.length
                ? await verifyPasswordHash(password, rows[0].password_hash)
                : await verifyAgainstDummyHash(password);
            if (rows.length && valid) admin = rows[0];
        }

        if (!admin) return sendError(res, 401, "Incorrect username or password.");

        clearLoginAttempts(req);
        setSessionCookie(req, res, admin);
        return sendJson(res, 200, { authenticated: true, admin: toAdminAccount(admin) });
    } catch (error) {
        logFailure("admin/login", error);
        return sendError(res, 500, "Could not sign you in.");
    }
};

const handleLogout = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    res.setHeader("Cache-Control", "no-store");
    clearSessionCookie(req, res);
    return sendJson(res, 200, { authenticated: false });
};

const handleSession = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

    res.setHeader("Cache-Control", "no-store");
    const configured = isAdminConfigured();
    if (!configured) return sendJson(res, 200, { authenticated: false, configured, needsSetup: false });

    try {
        await ensureSchema();
        const admin = await getAuthenticatedAdmin(req);
        if (admin) return sendJson(res, 200, { authenticated: true, configured, needsSetup: false, admin });
        return sendJson(res, 200, { authenticated: false, configured, needsSetup: (await countAdmins()) === 0 });
    } catch (error) {
        logFailure("admin/session", error);
        return sendError(res, 500, "Could not check your session.");
    }
};

const parseId = (raw: string) => {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
};

/** /api/admin/admins — list + create; with ?id= edit profile, change password, or delete. */
const handleAdmins = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) {
        return methodNotAllowed(res, ["GET", "POST", "PATCH", "DELETE"]);
    }

    const me = await requireAdmin(req, res);
    if (!me) return;

    res.setHeader("Cache-Control", "no-store");
    const sql = getSql();
    const rawId = readQueryParam(req, "id");

    try {
        await ensureSchema();

        if (!rawId) {
            if (method === "GET") {
                const rows = (await sql`
                    SELECT ${sql.unsafe(ADMIN_COLUMNS)} FROM admins ORDER BY created_at ASC, id ASC
                `) as AdminRow[];
                return sendJson(res, 200, { admins: rows.map(toAdminAccount) });
            }

            if (method === "POST") {
                const parsed = parseNewAdmin(asRecord(req.body));
                if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

                const { username, name, password } = parsed.value;
                const rows = (await sql`
                    INSERT INTO admins (username, name, password_hash)
                    VALUES (${username}, ${name}, ${await hashPassword(password)})
                    RETURNING ${sql.unsafe(ADMIN_COLUMNS)}
                `) as AdminRow[];
                return sendJson(res, 201, { admin: toAdminAccount(rows[0]) });
            }

            return methodNotAllowed(res, ["GET", "POST"]);
        }

        const id = parseId(rawId);
        if (id === null) return sendError(res, 404, "Admin not found.");

        if (method === "PATCH") {
            const body = asRecord(req.body);

            // A body carrying `password` is a password change; anything else edits the profile.
            if ("password" in body) {
                const error = passwordError(body.password);
                if (error) return sendError(res, 422, "Please fix the highlighted fields.", [error]);

                // Changing your own password needs the current one, so an
                // unattended signed-in browser can't be used to lock you out.
                if (id === me.id) {
                    const [current] = (await sql`
                        SELECT password_hash FROM admins WHERE id = ${id}
                    `) as Pick<AdminRow, "password_hash">[];
                    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
                    if (!current || !(await verifyPasswordHash(currentPassword, current.password_hash))) {
                        return sendError(res, 422, "Your current password is incorrect.");
                    }
                }

                // Bumping token_version signs that admin out everywhere.
                const rows = (await sql`
                    UPDATE admins
                    SET password_hash = ${await hashPassword(body.password as string)},
                        token_version = token_version + 1,
                        updated_at = NOW()
                    WHERE id = ${id}
                    RETURNING ${sql.unsafe(ADMIN_COLUMNS)}
                `) as AdminRow[];
                if (!rows.length) return sendError(res, 404, "Admin not found.");

                // Keep this browser signed in after changing your own password.
                if (id === me.id) setSessionCookie(req, res, rows[0]);
                return sendJson(res, 200, { admin: toAdminAccount(rows[0]) });
            }

            const parsed = parseAdminProfile(body);
            if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);

            const rows = (await sql`
                UPDATE admins
                SET username = ${parsed.value.username}, name = ${parsed.value.name}, updated_at = NOW()
                WHERE id = ${id}
                RETURNING ${sql.unsafe(ADMIN_COLUMNS)}
            `) as AdminRow[];
            if (!rows.length) return sendError(res, 404, "Admin not found.");
            return sendJson(res, 200, { admin: toAdminAccount(rows[0]) });
        }

        if (method === "DELETE") {
            if (id === me.id) {
                return sendError(res, 409, "You can't delete your own account — ask another admin to do it.");
            }

            // The advisory lock serialises deletes, so two admins removing each
            // other at the same moment can't leave the table empty.
            const [, deleted] = (await sql.transaction([
                sql`SELECT pg_advisory_xact_lock(7426001)`,
                sql`
                    DELETE FROM admins
                    WHERE id = ${id} AND (SELECT COUNT(*) FROM admins) > 1
                    RETURNING id
                `,
            ])) as [unknown, { id: number }[]];

            if (!deleted.length) {
                const exists = (await sql`SELECT 1 FROM admins WHERE id = ${id}`) as unknown[];
                if (!exists.length) return sendError(res, 404, "Admin not found.");
                return sendError(res, 409, "The last admin can't be deleted.");
            }
            return sendJson(res, 200, { deleted: true });
        }

        return methodNotAllowed(res, ["PATCH", "DELETE"]);
    } catch (error) {
        if (isUniqueViolation(error)) return sendError(res, 409, "That username is already taken.");
        logFailure("admin/admins", error);
        return sendError(res, 500, "Could not update admins.");
    }
};

const handleStorage = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!(await requireAdmin(req, res))) return;

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
const CUSTOMER_LIST_LIMIT = 1000;

/** Registered shop customers with their order totals — never the password hash. */
const handleCustomers = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!(await requireAdmin(req, res))) return;

    res.setHeader("Cache-Control", "no-store");
    try {
        await ensureSchema();
        const sql = getSql();
        const rows = (await sql`
            SELECT c.id, c.name, c.phone, c.email, c.created_at,
                   COUNT(o.id)::int AS order_count,
                   COALESCE(SUM(o.amount) FILTER (WHERE o.status = 'paid'), 0)::int AS paid_total,
                   MAX(o.created_at) AS last_order_at
            FROM customers c
            LEFT JOIN orders o ON o.customer_id = c.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ${CUSTOMER_LIST_LIMIT}
        `) as {
            id: number;
            name: string;
            phone: string;
            email: string | null;
            created_at: string;
            order_count: number;
            paid_total: number;
            last_order_at: string | null;
        }[];

        sendJson(res, 200, {
            customers: rows.map((row) => ({
                id: row.id,
                name: row.name,
                phone: row.phone,
                email: row.email,
                createdAt: new Date(row.created_at).toISOString(),
                orderCount: Number(row.order_count),
                paidTotal: Number(row.paid_total),
                lastOrderAt: row.last_order_at ? new Date(row.last_order_at).toISOString() : null,
            })),
        });
    } catch (error) {
        logFailure("admin/customers", error);
        sendError(res, 500, "Could not load customers.");
    }
};

const handleBackup = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
    if (!(await requireAdmin(req, res))) return;

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
    if (action === "customers") return handleCustomers(req, res);
    if (action === "admins") return handleAdmins(req, res);
    return sendError(res, 404, "Not found.");
};

export default handler;
