import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth.js";
import { ensureSchema, getSql, isUniqueViolation } from "../_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http.js";
import { PRODUCT_COLUMNS, parseProductInput, toProduct } from "../_lib/products.js";
import type { ProductInput, ProductRow } from "../_lib/products.js";

const readSlug = (req: VercelRequest) => {
    const value = req.query.slug;
    return (Array.isArray(value) ? value[0] : value) ?? "";
};

const getProduct = async (slug: string, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT ${sql.unsafe(PRODUCT_COLUMNS)} FROM products WHERE slug = ${slug}
    `) as ProductRow[];

    if (!rows.length) {
        sendError(res, 404, "Product not found.");
        return;
    }

    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");
    sendJson(res, 200, { product: toProduct(rows[0]) });
};

const updateProduct = async (slug: string, input: ProductInput, res: VercelResponse) => {
    const sql = getSql();

    try {
        const rows = (await sql`
            UPDATE products SET
                slug              = ${input.slug},
                name              = ${input.name},
                price             = ${input.price},
                category          = ${input.category},
                image             = ${input.image},
                icon              = ${input.icon},
                short_description = ${input.shortDescription},
                description       = ${input.description},
                ingredients       = ${JSON.stringify(input.ingredients)}::jsonb,
                benefits          = ${JSON.stringify(input.benefits)}::jsonb,
                how_to_use        = ${input.howToUse},
                featured          = ${input.featured},
                bestseller        = ${input.bestseller},
                new_arrival       = ${input.newArrival},
                rating            = ${input.rating},
                review_count      = ${input.reviewCount},
                in_stock          = ${input.inStock},
                variants          = ${JSON.stringify(input.variants)}::jsonb,
                updated_at        = NOW()
            WHERE slug = ${slug}
            RETURNING ${sql.unsafe(PRODUCT_COLUMNS)}
        `) as ProductRow[];

        if (!rows.length) {
            sendError(res, 404, "Product not found.");
            return;
        }

        res.setHeader("Cache-Control", "no-store");
        sendJson(res, 200, { product: toProduct(rows[0]) });
    } catch (error) {
        if (isUniqueViolation(error)) {
            sendError(res, 409, `A product with the URL "${input.slug}" already exists.`);
            return;
        }
        throw error;
    }
};

const deleteProduct = async (slug: string, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`DELETE FROM products WHERE slug = ${slug} RETURNING id`) as { id: number }[];

    if (!rows.length) {
        sendError(res, 404, "Product not found.");
        return;
    }

    res.setHeader("Cache-Control", "no-store");
    sendJson(res, 200, { deleted: rows[0].id });
};

const WRITE_METHODS = ["PUT", "PATCH", "DELETE"];

const handler = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && !WRITE_METHODS.includes(method)) {
        return methodNotAllowed(res, ["GET", "PUT", "DELETE"]);
    }

    const slug = readSlug(req);
    if (!slug) return sendError(res, 400, "Product URL is missing.");

    // Authorise and validate before touching the database, so callers get a
    // 401/422 rather than a storage error that tells them nothing.
    let input: ProductInput | undefined;
    if (WRITE_METHODS.includes(method)) {
        if (!requireAdmin(req, res)) return;

        if (method !== "DELETE") {
            const parsed = parseProductInput(asRecord(req.body));
            if (!parsed.ok) {
                return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);
            }
            input = parsed.value;
        }
    }

    try {
        await ensureSchema();

        if (method === "GET") return await getProduct(slug, res);
        if (method === "DELETE") return await deleteProduct(slug, res);
        if (input) return await updateProduct(slug, input, res);

        return sendError(res, 400, "Missing product details.");
    } catch (error) {
        logFailure("products/[slug]", error);
        return sendError(res, 500, "Something went wrong reaching the product database.");
    }
};

export default handler;
