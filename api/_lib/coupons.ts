import type { Coupon, CouponType } from "../../src/types/coupon.js";
import { getSql } from "./db.js";
import type { Result } from "./http.js";

export const COUPON_COLUMNS = `
    id, code, type, value, starts_at, expires_at, usage_limit, times_used, active, created_at
`;

export interface CouponRow {
    id: number;
    code: string;
    type: string;
    value: number;
    starts_at: string | null;
    expires_at: string | null;
    usage_limit: number | null;
    times_used: number;
    active: boolean;
    created_at: string;
}

export const toCoupon = (row: CouponRow): Coupon => ({
    id: row.id,
    code: row.code,
    type: row.type as CouponType,
    value: Number(row.value),
    ...(row.starts_at ? { startsAt: row.starts_at } : {}),
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    ...(row.usage_limit === null ? {} : { usageLimit: row.usage_limit }),
    timesUsed: row.times_used,
    active: row.active,
});

const MAX = {
    code: 30,
    flatValue: 10_000_000,
    percentageValue: 100,
};

const CODE_PATTERN = /^[A-Z0-9_-]+$/;

export interface CouponInput {
    code: string;
    type: CouponType;
    value: number;
    startsAt: Date | null;
    expiresAt: Date | null;
    usageLimit: number | null;
    active: boolean;
}

const parseOptionalDate = (value: unknown, field: string, errors: string[]): Date | null => {
    if (value === undefined || value === null || value === "") return null;

    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
        errors.push(`${field} is not a valid date.`);
        return null;
    }
    return date;
};

/** Admin create/edit validation — shape/bounds only, no DB access. */
export const parseCouponInput = (body: Record<string, unknown>): Result<CouponInput> => {
    const errors: string[] = [];

    const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!code) errors.push("Code is required.");
    else if (code.length > MAX.code) errors.push(`Code must be ${MAX.code} characters or fewer.`);
    else if (!CODE_PATTERN.test(code)) {
        errors.push("Code can only contain letters, numbers, hyphens and underscores.");
    }

    const type: CouponType | "" = body.type === "flat" || body.type === "percentage" ? body.type : "";
    if (!type) errors.push("Type must be flat or percentage.");

    const rawValue = typeof body.value === "number" ? body.value : Number(body.value);
    if (!Number.isFinite(rawValue) || !Number.isInteger(rawValue)) {
        errors.push("Value must be a whole number.");
    } else if (type === "flat" && (rawValue <= 0 || rawValue > MAX.flatValue)) {
        errors.push(`Flat value must be between 1 and ${MAX.flatValue}.`);
    } else if (type === "percentage" && (rawValue <= 0 || rawValue > MAX.percentageValue)) {
        errors.push(`Percentage value must be between 1 and ${MAX.percentageValue}.`);
    }

    const startsAt = parseOptionalDate(body.startsAt, "Start date", errors);
    const expiresAt = parseOptionalDate(body.expiresAt, "Expiry date", errors);
    if (startsAt && expiresAt && startsAt >= expiresAt) {
        errors.push("Start date must be before the expiry date.");
    }

    let usageLimit: number | null = null;
    if (body.usageLimit !== undefined && body.usageLimit !== null && body.usageLimit !== "") {
        const rawLimit = typeof body.usageLimit === "number" ? body.usageLimit : Number(body.usageLimit);
        if (!Number.isInteger(rawLimit) || rawLimit < 1) {
            errors.push("Usage limit must be a whole number of 1 or more.");
        } else {
            usageLimit = rawLimit;
        }
    }

    const active = body.active !== false;

    if (errors.length) return { ok: false, errors };

    // `type` is guaranteed non-empty here — the `!type` check above already
    // pushed an error (and triggered the early return) otherwise.
    return {
        ok: true,
        value: { code, type: type as CouponType, value: rawValue, startsAt, expiresAt, usageLimit, active },
    };
};

/** Flat never discounts past zero; percentage rounds to the nearest rupee. */
export const computeDiscount = (coupon: { type: string; value: number }, subtotal: number) =>
    coupon.type === "flat" ? Math.min(coupon.value, subtotal) : Math.round((subtotal * coupon.value) / 100);

/** Read-only — used for both the no-side-effect preview and as the first
 *  check before the guarded redemption in order creation. */
export const validateCoupon = async (
    code: string,
    subtotal: number
): Promise<Result<{ coupon: CouponRow; discountAmount: number }>> => {
    const sql = getSql();
    const normalized = code.trim().toUpperCase();

    const rows = (await sql`
        SELECT ${sql.unsafe(COUPON_COLUMNS)} FROM coupons WHERE code = ${normalized}
    `) as CouponRow[];
    if (!rows.length) return { ok: false, errors: ["That code doesn't exist."] };

    const coupon = rows[0];
    if (!coupon.active) return { ok: false, errors: ["That code is no longer active."] };

    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return { ok: false, errors: ["That code isn't active yet."] };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return { ok: false, errors: ["That code has expired."] };
    }
    if (coupon.usage_limit !== null && coupon.times_used >= coupon.usage_limit) {
        return { ok: false, errors: ["That code has already been fully redeemed."] };
    }

    return { ok: true, value: { coupon, discountAmount: computeDiscount(coupon, subtotal) } };
};

/**
 * The one write that matters — a guarded increment, race-safe the same way
 * Phase 2's razorpay_order_id write is. Returns false if the code became
 * invalid (e.g. someone else just used the last slot) between a preview
 * validation and this call.
 */
export const redeemCoupon = async (code: string): Promise<boolean> => {
    const sql = getSql();
    const normalized = code.trim().toUpperCase();

    const rows = (await sql`
        UPDATE coupons SET times_used = times_used + 1
        WHERE code = ${normalized} AND active
          AND (usage_limit IS NULL OR times_used < usage_limit)
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (expires_at IS NULL OR expires_at >= NOW())
        RETURNING id
    `) as { id: number }[];

    return rows.length > 0;
};
