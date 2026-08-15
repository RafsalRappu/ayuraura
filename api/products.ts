import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "./_lib/auth.js";
import { ensureSchema, getSql, isUniqueViolation } from "./_lib/db.js";
import { asRecord, logFailure, methodNotAllowed, readQueryParam, sendError, sendJson } from "./_lib/http.js";
import { PRODUCT_COLUMNS, parseProductInput, toProduct } from "./_lib/products.js";
import type { ProductInput, ProductRow } from "./_lib/products.js";
import { computeSummary, toReview } from "./_lib/reviews.js";
import type { ReviewRow } from "./_lib/reviews.js";

const listProducts = async (req: VercelRequest, res: VercelResponse) => {
    const sql = getSql();
    const rows = (await sql`
        SELECT ${sql.unsafe(PRODUCT_COLUMNS)}
        FROM products
        ORDER BY id ASC
    `) as ProductRow[];

    // Admin views ask for uncached data so edits show up immediately; public
    // visitors are served from the CDN and see changes within a minute.
    if (req.query.fresh) res.setHeader("Cache-Control", "no-store");
    else res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");

    sendJson(res, 200, { products: rows.map(toProduct) });
};

const createProduct = async (input: ProductInput, res: VercelResponse) => {
    const sql = getSql();

    try {
        const rows = (await sql`
            INSERT INTO products (
                slug, name, price, category, image, icon,
                short_description, description, ingredients, benefits, how_to_use,
                featured, bestseller, new_arrival, rating, review_count, in_stock, variants
            ) VALUES (
                ${input.slug}, ${input.name}, ${input.price}, ${input.category},
                ${input.image}, ${input.icon}, ${input.shortDescription}, ${input.description},
                ${JSON.stringify(input.ingredients)}::jsonb, ${JSON.stringify(input.benefits)}::jsonb,
                ${input.howToUse}, ${input.featured}, ${input.bestseller}, ${input.newArrival},
                ${input.rating}, ${input.reviewCount}, ${input.inStock}, ${JSON.stringify(input.variants)}::jsonb
            )
            RETURNING ${sql.unsafe(PRODUCT_COLUMNS)}
        `) as ProductRow[];

        res.setHeader("Cache-Control", "no-store");
        sendJson(res, 201, { product: toProduct(rows[0]) });
    } catch (error) {
        if (isUniqueViolation(error)) {
            sendError(res, 409, `A product with the URL "${input.slug}" already exists.`);
            return;
        }
        throw error;
    }
};

const handleList = async (req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    // Authorise and validate before touching the database, so callers get a
    // 401/422 rather than a storage error that tells them nothing.
    let input: ProductInput | undefined;
    if (method === "POST") {
        if (!requireAdmin(req, res)) return;

        const parsed = parseProductInput(asRecord(req.body));
        if (!parsed.ok) return sendError(res, 422, "Please fix the highlighted fields.", parsed.errors);
        input = parsed.value;
    }

    try {
        await ensureSchema();
        return input ? await createProduct(input, res) : await listProducts(req, res);
    } catch (error) {
        logFailure("products", error);
        return sendError(res, 500, "Something went wrong reaching the product database.");
    }
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

const handleOne = async (slug: string, req: VercelRequest, res: VercelResponse) => {
    const method = req.method ?? "GET";
    if (method !== "GET" && !WRITE_METHODS.includes(method)) {
        return methodNotAllowed(res, ["GET", "PUT", "DELETE"]);
    }

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

const REVIEW_LIMIT = 50;

const handleReviews = async (slug: string, req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=60, stale-while-revalidate=300");

    try {
        await ensureSchema();
        const sql = getSql();

        const productRows = (await sql`SELECT id FROM products WHERE slug = ${slug}`) as { id: number }[];
        if (!productRows.length) return sendError(res, 404, "Product not found.");

        const rows = (await sql`
            SELECT id, product_id, author_name, rating, comment, status, created_at
            FROM reviews
            WHERE product_id = ${productRows[0].id} AND status = 'approved'
            ORDER BY created_at DESC
            LIMIT ${REVIEW_LIMIT}
        `) as ReviewRow[];

        sendJson(res, 200, { reviews: rows.map(toReview), summary: computeSummary(rows) });
    } catch (error) {
        logFailure("products/[slug]/reviews", error);
        return sendError(res, 500, "Something went wrong reaching the review database.");
    }
};

/**
 * One physical function serving /api/products, /api/products/:slug and
 * /api/products/:slug/reviews — see vercel.json's rewrites.
 */
const handler = async (req: VercelRequest, res: VercelResponse) => {
    const slug = readQueryParam(req, "slug");
    if (!slug) return handleList(req, res);
    if (readQueryParam(req, "sub") === "reviews") return handleReviews(slug, req, res);
    return handleOne(slug, req, res);
};

export default handler;
