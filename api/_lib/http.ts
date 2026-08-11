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
 */
export const readRawBody = async (req: VercelRequest): Promise<Buffer> => {
    if (Buffer.isBuffer(req.body)) return req.body;
    if (typeof req.body === "string") return Buffer.from(req.body);

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string));
    }
    return Buffer.concat(chunks);
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
