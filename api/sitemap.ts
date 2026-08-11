import type { VercelRequest, VercelResponse } from "@vercel/node";

import { ensureSchema, getSql } from "./_lib/db";
import { logFailure, methodNotAllowed } from "./_lib/http";
import { siteConfig } from "../src/config/site";

interface Entry {
    path: string;
    changefreq: string;
    priority: string;
}

const STATIC_PAGES: Entry[] = [
    { path: "/", changefreq: "weekly", priority: "1.0" },
    { path: "/products", changefreq: "weekly", priority: "0.9" },
    { path: "/about", changefreq: "monthly", priority: "0.6" },
    { path: "/contact", changefreq: "monthly", priority: "0.6" },
];

const escapeXml = (value: string) =>
    value.replace(/[<>&'"]/g, (char) => {
        switch (char) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            default:
                return "&quot;";
        }
    });

const toXml = (entries: Entry[]) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
        .map(
            (entry) =>
                `  <url>\n` +
                `    <loc>${escapeXml(siteConfig.url + entry.path)}</loc>\n` +
                `    <changefreq>${entry.changefreq}</changefreq>\n` +
                `    <priority>${entry.priority}</priority>\n` +
                `  </url>`
        )
        .join("\n") +
    `\n</urlset>\n`;

const handler = async (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

    const entries = [...STATIC_PAGES];

    try {
        await ensureSchema();
        const rows = (await getSql()`SELECT slug FROM products ORDER BY id ASC`) as { slug: string }[];

        for (const row of rows) {
            entries.push({ path: `/products/${row.slug}`, changefreq: "monthly", priority: "0.7" });
        }
    } catch (error) {
        // Still serve the static pages rather than a 500 — a partial sitemap
        // beats none at all when the database is unreachable.
        logFailure("sitemap", error);
    }

    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
    res.send(toXml(entries));
};

export default handler;
