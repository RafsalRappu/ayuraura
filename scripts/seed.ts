/**
 * Seeds the products table with the catalogue in `src/data/products.ts`.
 *
 *   npm run db:seed
 *
 * Safe to re-run: rows are matched on slug, and existing rows are left alone
 * unless `--force` is passed, which overwrites them with the seed values.
 */
import { neon } from "@neondatabase/serverless";

import { seedProducts } from "../src/data/products";

const CONNECTION_ENV_KEYS = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
];

const connectionString = CONNECTION_ENV_KEYS.map((key) => process.env[key]).find(Boolean);

if (!connectionString) {
    console.error(
        "No Postgres connection string found.\n" +
            "Run `vercel env pull .env.local` after adding a Neon database to the project, " +
            "or set DATABASE_URL yourself."
    );
    process.exit(1);
}

const force = process.argv.includes("--force");
const sql = neon(connectionString);

const createSchema = () => sql`
    CREATE TABLE IF NOT EXISTS products (
        id                SERIAL PRIMARY KEY,
        slug              TEXT UNIQUE NOT NULL,
        name              TEXT NOT NULL,
        price             INTEGER NOT NULL,
        category          TEXT NOT NULL,
        image             TEXT,
        icon              TEXT NOT NULL DEFAULT 'face',
        short_description TEXT NOT NULL DEFAULT '',
        description       TEXT NOT NULL DEFAULT '',
        ingredients       JSONB NOT NULL DEFAULT '[]'::jsonb,
        benefits          JSONB NOT NULL DEFAULT '[]'::jsonb,
        how_to_use        TEXT,
        featured          BOOLEAN NOT NULL DEFAULT FALSE,
        bestseller        BOOLEAN NOT NULL DEFAULT FALSE,
        new_arrival       BOOLEAN NOT NULL DEFAULT FALSE,
        rating            REAL,
        review_count      INTEGER,
        in_stock          BOOLEAN NOT NULL DEFAULT TRUE,
        variants          JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
`;

const addNewColumns = async () => {
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT TRUE`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb`;
};

const main = async () => {
    await createSchema();
    await addNewColumns();
    console.log("Schema ready.");

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of seedProducts) {
        const values = [
            product.slug,
            product.name,
            product.price,
            product.category,
            product.image ?? null,
            product.icon,
            product.shortDescription,
            product.description,
            JSON.stringify(product.ingredients),
            JSON.stringify(product.benefits),
            product.howToUse ?? null,
            product.featured,
            product.bestseller,
            product.newArrival,
            product.rating ?? null,
            product.reviewCount ?? null,
            product.inStock ?? true,
            JSON.stringify(product.variants ?? []),
        ];

        const conflictAction = force
            ? `DO UPDATE SET
                   name = EXCLUDED.name,
                   price = EXCLUDED.price,
                   category = EXCLUDED.category,
                   image = EXCLUDED.image,
                   icon = EXCLUDED.icon,
                   short_description = EXCLUDED.short_description,
                   description = EXCLUDED.description,
                   ingredients = EXCLUDED.ingredients,
                   benefits = EXCLUDED.benefits,
                   how_to_use = EXCLUDED.how_to_use,
                   featured = EXCLUDED.featured,
                   bestseller = EXCLUDED.bestseller,
                   new_arrival = EXCLUDED.new_arrival,
                   rating = EXCLUDED.rating,
                   review_count = EXCLUDED.review_count,
                   in_stock = EXCLUDED.in_stock,
                   variants = EXCLUDED.variants,
                   updated_at = NOW()`
            : "DO NOTHING";

        const rows = (await sql.query(
            `INSERT INTO products (
                 slug, name, price, category, image, icon,
                 short_description, description, ingredients, benefits, how_to_use,
                 featured, bestseller, new_arrival, rating, review_count, in_stock, variants
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13, $14, $15, $16, $17, $18::jsonb)
             ON CONFLICT (slug) ${conflictAction}
             RETURNING (xmax = 0) AS was_inserted`,
            values
        )) as { was_inserted: boolean }[];

        if (!rows.length) skipped += 1;
        else if (rows[0].was_inserted) inserted += 1;
        else updated += 1;

        console.log(
            `  ${!rows.length ? "skip  " : rows[0].was_inserted ? "insert" : "update"}  ${product.slug}`
        );
    }

    console.log(`\nDone — ${inserted} inserted, ${updated} updated, ${skipped} already present.`);
    if (skipped && !force) {
        console.log("Re-run with `npm run db:seed -- --force` to overwrite existing rows.");
    }
};

main().catch((error: unknown) => {
    console.error("\nSeed failed:", error instanceof Error ? error.message : error);
    process.exit(1);
});
