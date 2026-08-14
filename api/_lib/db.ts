import { neon } from "@neondatabase/serverless";

/** Vercel's Neon/Postgres integrations expose the URL under several names. */
const CONNECTION_ENV_KEYS = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL_NON_POOLING",
];

const resolveConnectionString = () => {
    for (const key of CONNECTION_ENV_KEYS) {
        const value = process.env[key];
        if (value) return value;
    }
    throw new Error(
        "No Postgres connection string found. Add a Neon database to the Vercel project " +
            "(Storage tab), or set DATABASE_URL in .env.local for local development."
    );
};

let client: ReturnType<typeof neon> | null = null;

export const getSql = () => {
    if (!client) client = neon(resolveConnectionString());
    return client;
};

const createSchema = async () => {
    const sql = getSql();
    await sql`
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

    // Added after launch — existing databases get these via ALTER, fresh ones
    // already have them from the CREATE TABLE above.
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT TRUE`;
    await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb`;

    await sql`
        CREATE TABLE IF NOT EXISTS categories (
            id         SERIAL PRIMARY KEY,
            slug       TEXT UNIQUE NOT NULL,
            name       TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS orders (
            id                  SERIAL PRIMARY KEY,
            public_id           TEXT UNIQUE NOT NULL,
            items               JSONB NOT NULL,
            amount              INTEGER NOT NULL,
            currency            TEXT NOT NULL DEFAULT 'INR',
            customer_name       TEXT NOT NULL,
            customer_phone      TEXT NOT NULL,
            customer_email      TEXT,
            customer_address    TEXT,
            status              TEXT NOT NULL DEFAULT 'pending',
            razorpay_order_id   TEXT UNIQUE,
            razorpay_payment_id TEXT UNIQUE,
            admin_note          TEXT,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    // Added after launch — existing databases get these via ALTER.
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount INTEGER NOT NULL DEFAULT 0`;

    await sql`
        CREATE TABLE IF NOT EXISTS customers (
            id            SERIAL PRIMARY KEY,
            phone         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name          TEXT NOT NULL,
            email         TEXT,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL`;

    await sql`
        CREATE TABLE IF NOT EXISTS reviews (
            id          SERIAL PRIMARY KEY,
            product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            author_name TEXT NOT NULL,
            rating      INTEGER NOT NULL,
            comment     TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'pending',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS coupons (
            id          SERIAL PRIMARY KEY,
            code        TEXT UNIQUE NOT NULL,
            type        TEXT NOT NULL,
            value       INTEGER NOT NULL,
            starts_at   TIMESTAMPTZ,
            expires_at  TIMESTAMPTZ,
            usage_limit INTEGER,
            times_used  INTEGER NOT NULL DEFAULT 0,
            active      BOOLEAN NOT NULL DEFAULT TRUE,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `;
};

let schemaPromise: Promise<void> | null = null;

/**
 * Creates the products table on first use of a serverless instance, so a fresh
 * database needs no manual migration step. Cheap: one statement per cold start.
 */
export const ensureSchema = (): Promise<void> => {
    if (!schemaPromise) {
        schemaPromise = createSchema().catch((error: unknown) => {
            schemaPromise = null;
            throw error;
        });
    }
    return schemaPromise;
};

/** Postgres unique-violation, raised when a slug is already taken. */
export const isUniqueViolation = (error: unknown) =>
    typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
