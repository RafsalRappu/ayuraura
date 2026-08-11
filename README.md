# AyuAura

Storefront for a handcrafted Ayurvedic skincare brand — React 19 + Vite + MUI,
deployed on Vercel. Products are stored in Postgres, served by serverless
functions under `/api`, and managed from an admin panel at `/admin`.

## Running locally

```bash
npm install
npm run dev:api    # everything: storefront + /api on http://localhost:3010
```

That single command is the full stack. `vercel dev` runs the Vite dev server
(HMR and all) and the serverless functions behind one origin, so the frontend
calls `/api/...` with no proxy or second terminal.

```bash
npm run dev        # storefront alone on :5173 — /api returns 501
```

Use this only when you are working on the storefront and don't need the API. It
still renders products, from the bundled fallback catalogue; `/admin` will show
an error telling you to switch to `npm run dev:api`.

The port is pinned to **3010** because `vercel dev` otherwise defaults to 3000,
which frequently collides with another dev server. Change it in the `dev:api`
script if 3010 is taken. Secrets come from `.env` (see
[Environment](#environment)).

Other scripts:

| Script | Purpose |
| --- | --- |
| `npm run dev:api` | Storefront + API together on :3010 (the normal way to develop) |
| `npm run dev` | Storefront only, on :5173 |
| `npm run build` | Typechecks `src`, `api` and `scripts`, then builds to `dist` |
| `npm run lint` | Oxlint |
| `npm run db:seed` | Loads the catalogue from `src/data/products.ts` into the database |

## Architecture

Products used to live in `src/data/products.ts`. They now come from Postgres:

```
Browser ──▶ ProductsProvider ──▶ GET /api/products ──▶ Neon Postgres
                   │
                   └── on failure, renders seedProducts from src/data/products.ts
```

- **`src/data/ProductsProvider.tsx`** fetches the catalogue once at app start and
  shares it through `useProducts()`. Every page reads from that hook — nothing
  imports the product array directly any more.
- **`src/data/products.ts`** keeps the original eight products as `seedProducts`.
  It is the offline fallback when the API is unreachable, and the payload
  `npm run db:seed` writes into an empty database. The storefront therefore still
  renders if the database is asleep or misconfigured.
- **`api/_lib/`** holds the shared database client, session auth and validation.
  Files prefixed with `_` are not exposed as endpoints.

### Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/products` | public | List all products (add `?fresh=1` to bypass the CDN cache) |
| `POST` | `/api/products` | admin | Create a product |
| `GET` | `/api/products/:slug` | public | Fetch one product |
| `PUT` | `/api/products/:slug` | admin | Replace a product |
| `DELETE` | `/api/products/:slug` | admin | Delete a product |
| `POST` | `/api/upload` | admin | Store an image in Vercel Blob, returns its URL |
| `GET` | `/api/admin/session` | public | Whether the caller is signed in, and whether admin is configured |
| `POST` | `/api/admin/login` | public | Exchange the password for a session cookie |
| `POST` | `/api/admin/logout` | public | Clear the session cookie |
| `GET` | `/sitemap.xml` | public | Sitemap, generated from the live product list |

Public reads are cached at the edge for 60 seconds, so a newly added product can
take up to a minute to appear for visitors. The admin panel always requests
uncached data.

### Admin panel

`/admin` is a lazy-loaded route outside the storefront layout, so none of it
ships in the public bundle. It is excluded from `robots.txt`, sends
`X-Robots-Tag: noindex`, and is protected by a single password.

Sign-in exchanges `ADMIN_PASSWORD` for an HMAC-signed, HttpOnly, `SameSite=Strict`
session cookie that lasts seven days. Every write endpoint verifies that cookie
and rejects cross-origin requests. Failed sign-ins are rate limited per IP.

Images picked in the form are resized to at most 1400px and re-encoded before
upload, which keeps them inside the serverless body limit and off the critical
path of page loads.

## Environment

Copy `.env.example` to **`.env`** and fill it in.

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Vercel → Storage → Create Database → Neon |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Create Store → Blob |
| `ADMIN_PASSWORD` | Choose one; set it in Vercel → Settings → Environment Variables |
| `ADMIN_SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` |

> **`.env`, not `.env.local`.** `vercel dev` reads `.env`; it ignores
> `.env.local`. `vercel env pull` writes `.env.local`, which `npm run db:seed`
> also reads. Both files are gitignored; only `.env.example` is committed.

Variables set in the Vercel dashboard for the *Development* environment are
downloaded by `vercel dev` automatically, so the storage variables need no local
copy to run the app — you only need them in a file for scripts like
`npm run db:seed`. `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` are never created
for you; set them yourself in both places.

## First deploy

1. **Attach a database.** Vercel dashboard → Storage → Create Database → Neon,
   and connect it to this project. That sets `DATABASE_URL` automatically.
2. **Attach a blob store** the same way, for product images. That sets
   `BLOB_READ_WRITE_TOKEN`.
3. **Add the admin secrets** under Settings → Environment Variables:
   `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
4. **Deploy.** The `products` table is created automatically on first use.
5. **Load the existing catalogue:**
   ```bash
   vercel env pull .env.local   # brings DATABASE_URL down for the script
   npm run db:seed
   ```
   Re-running the seed skips products that already exist; pass
   `npm run db:seed -- --force` to overwrite them with the file's values.
6. **Sign in** at `/admin` and add products.

Everything — storefront, API and admin — runs as one Vercel project on one
domain. No separate hosting is required.
