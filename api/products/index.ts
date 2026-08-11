import type { VercelRequest, VercelResponse } from "@vercel/node";

import { requireAdmin } from "../_lib/auth";
import { ensureSchema, getSql, isUniqueViolation } from "../_lib/db";
import { asRecord, logFailure, methodNotAllowed, sendError, sendJson } from "../_lib/http";
import { PRODUCT_COLUMNS, parseProductInput, toProduct } from "../_lib/products";
import type { ProductInput, ProductRow } from "../_lib/products";

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
                featured, bestseller, new_arrival, rating, review_count
            ) VALUES (
                ${input.slug}, ${input.name}, ${input.price}, ${input.category},
                ${input.image}, ${input.icon}, ${input.shortDescription}, ${input.description},
                ${JSON.stringify(input.ingredients)}::jsonb, ${JSON.stringify(input.benefits)}::jsonb,
                ${input.howToUse}, ${input.featured}, ${input.bestseller}, ${input.newArrival},
                ${input.rating}, ${input.reviewCount}
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

const handler = async (req: VercelRequest, res: VercelResponse) => {
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

export default handler;
