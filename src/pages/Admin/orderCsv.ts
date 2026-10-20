import type { AdminOrder } from "../../types/order";

/**
 * Orders backup as a plain CSV: opens directly in Excel / Google Sheets, and
 * `parseBackupCsv` reads it back for the in-app viewer. `items_json` keeps the
 * exact cart so nothing is lost to the human-readable `items` summary.
 */
const COLUMNS: Array<{ header: string; value: (order: AdminOrder) => string | number | undefined }> = [
    { header: "order_id", value: (order) => order.publicId },
    { header: "placed_at", value: (order) => order.createdAt },
    { header: "status", value: (order) => order.status },
    { header: "customer_name", value: (order) => order.customerName },
    { header: "customer_phone", value: (order) => order.customerPhone },
    { header: "customer_email", value: (order) => order.customerEmail },
    { header: "address_line1", value: (order) => order.customerAddressLine1 },
    { header: "address_line2", value: (order) => order.customerAddressLine2 },
    { header: "city", value: (order) => order.customerCity },
    { header: "state", value: (order) => order.customerState },
    { header: "pincode", value: (order) => order.customerPincode },
    {
        header: "items",
        value: (order) =>
            order.items
                .map((item) => `${item.name}${item.variantLabel ? ` (${item.variantLabel})` : ""} x${item.quantity}`)
                .join("; "),
    },
    { header: "amount", value: (order) => order.amount },
    { header: "discount", value: (order) => order.discountAmount },
    { header: "coupon", value: (order) => order.couponCode },
    { header: "currency", value: (order) => order.currency },
    { header: "razorpay_order_id", value: (order) => order.razorpayOrderId },
    { header: "razorpay_payment_id", value: (order) => order.razorpayPaymentId },
    { header: "admin_note", value: (order) => order.adminNote },
    { header: "updated_at", value: (order) => order.updatedAt },
    { header: "items_json", value: (order) => JSON.stringify(order.items) },
];

/** Columns the viewer needs to recognise a file as one of these backups. */
const REQUIRED_HEADERS = ["order_id", "placed_at", "status", "customer_name", "amount"];

// Checkout fields are typed by the public, so a cell like `=HYPERLINK(...)`
// would run as a formula when the admin opens the file in Excel. A leading
// apostrophe makes Excel treat it as text; the viewer strips it back off.
const FORMULA_START = /^[=+\-@\t\r]/;
const ESCAPED_FORMULA = /^'[=+\-@\t\r]/;

const escapeCell = (raw: string | number | undefined) => {
    const text = raw === undefined ? "" : String(raw);
    const safe = FORMULA_START.test(text) ? `'${text}` : text;
    return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export const ordersToCsv = (orders: AdminOrder[]) => {
    const lines = [COLUMNS.map((column) => column.header).join(",")];
    for (const order of orders) {
        lines.push(COLUMNS.map((column) => escapeCell(column.value(order))).join(","));
    }
    return lines.join("\r\n");
};

/** RFC 4180 parser: quoted fields, doubled quotes, and newlines inside quotes. */
const parseCsv = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];

        if (quoted) {
            if (char === '"' && text[index + 1] === '"') {
                cell += '"';
                index += 1;
            } else if (char === '"') {
                quoted = false;
            } else {
                cell += char;
            }
        } else if (char === '"') {
            quoted = true;
        } else if (char === ",") {
            row.push(cell);
            cell = "";
        } else if (char === "\n" || char === "\r") {
            if (char === "\r" && text[index + 1] === "\n") index += 1;
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
        } else {
            cell += char;
        }
    }

    if (cell !== "" || row.length > 0) {
        row.push(cell);
        rows.push(row);
    }

    return rows;
};

export type BackupRow = Record<string, string>;

/** Reads a backup CSV into header-keyed rows; throws a readable error for any other file. */
export const parseBackupCsv = (text: string): BackupRow[] => {
    const [header, ...body] = parseCsv(text.replace(/^﻿/, "")).filter((row) => row.some((cell) => cell !== ""));

    if (!header || REQUIRED_HEADERS.some((required) => !header.includes(required))) {
        throw new Error("This doesn't look like an AyuAura orders backup file.");
    }

    return body.map((cells) =>
        Object.fromEntries(
            header.map((name, index) => {
                const cell = cells[index] ?? "";
                return [name, ESCAPED_FORMULA.test(cell) ? cell.slice(1) : cell];
            })
        )
    );
};
