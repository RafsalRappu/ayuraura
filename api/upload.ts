import type { VercelRequest, VercelResponse } from "@vercel/node";
import { put } from "@vercel/blob";

import { requireAdmin } from "./_lib/auth.js";
import { logFailure, methodNotAllowed, readRawBody, sendError, sendJson } from "./_lib/http.js";
import { slugify } from "./_lib/products.js";

/** Serverless request bodies cap out around 4.5 MB; the admin downsizes first. */
const MAX_BYTES = 4 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
};

const readQuery = (req: VercelRequest, key: string) => {
    const value = req.query[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const buildFilename = (req: VercelRequest, extension: string) => {
    const base = slugify(readQuery(req, "filename").replace(/\.[^.]+$/, "")) || "product";
    return `products/${base}-${Date.now()}.${extension}`;
};

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    res.setHeader("Cache-Control", "no-store");
    if (!requireAdmin(req, res)) return;

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
        return sendError(
            res,
            503,
            "Image storage is not configured. Create a Blob store under Vercel → Storage and redeploy."
        );
    }

    // The body arrives as application/octet-stream — that is the only content
    // type Vercel's Node runtime hands back as a raw Buffer. The real image
    // type travels in the `type` query parameter.
    const contentType = readQuery(req, "type").toLowerCase();
    const extension = ALLOWED_TYPES[contentType];
    if (!extension) {
        return sendError(res, 415, "Upload a JPEG, PNG, WebP or AVIF image.");
    }

    try {
        const body = await readRawBody(req);

        if (!body.length) return sendError(res, 400, "The uploaded file was empty.");
        if (body.length > MAX_BYTES) {
            return sendError(res, 413, "Image is larger than 4 MB — please use a smaller file.");
        }

        const blob = await put(buildFilename(req, extension), body, {
            access: "public",
            contentType,
        });

        return sendJson(res, 201, { url: blob.url });
    } catch (error) {
        logFailure("upload", error);
        return sendError(res, 500, "Could not upload the image.");
    }
};

export default handler;
