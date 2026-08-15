import type { VercelRequest, VercelResponse } from "@vercel/node";

export type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

export const sendJson = (res: VercelResponse, status: number, body: unknown) => {
    res.status(status);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.send(JSON.stringify(body));
};

export const sendError = (res: VercelResponse, status: number, message: string, errors?: string[]) =>
    sendJson(res, status, errors?.length ? { message, errors } : { message });

export const methodNotAllowed = (res: VercelResponse, allowed: string[]) => {
    res.setHeader("Allow", allowed.join(", "));
    sendError(res, 405, `Method not allowed. Try one of: ${allowed.join(", ")}.`);
};

/**
 * Vercel's Node helper leaves non-JSON payloads as a Buffer, but that is not
 * guaranteed across runtimes — fall back to draining the request stream.
 *
 * Uses the `'data'`/`'end'` event API rather than `for await...of req`: the
 * local dev server (`vercel dev`) replays an already-parsed body (e.g. JSON)
 * back onto `req` by overriding `req.on('data'|'end', ...)` specifically —
 * async iteration goes through the stream's `'readable'` event instead, which
 * isn't part of that replay, and silently yields an empty body.
 */
export const readRawBody = (req: VercelRequest): Promise<Buffer> => {
    if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
    if (typeof req.body === "string") return Promise.resolve(Buffer.from(req.body));

    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on("end", () => resolve(Buffer.concat(chunks)));
        req.on("error", reject);
    });
};

/** Reads a single-value query param populated by a vercel.json rewrite (e.g. `?slug=:slug`). */
export const readQueryParam = (req: VercelRequest, key: string): string => {
    const value = req.query[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

export const asRecord = (body: unknown): Record<string, unknown> => {
    if (typeof body === "string") {
        try {
            const parsed: unknown = JSON.parse(body);
            return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
        } catch {
            return {};
        }
    }
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
};

export const logFailure = (scope: string, error: unknown) => {
    console.error(`[api:${scope}]`, error instanceof Error ? error.stack ?? error.message : error);
};
