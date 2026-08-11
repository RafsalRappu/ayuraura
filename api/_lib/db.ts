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
            created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
