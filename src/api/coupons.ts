import type { Coupon } from "../types/coupon";
import type { CheckoutItemInput } from "../types/order";
import { request } from "./client";

const jsonInit = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export interface CouponPayload {
    code: string;
    type: Coupon["type"];
    value: number;
    startsAt?: string | null;
    expiresAt?: string | null;
    usageLimit?: number | null;
    active: boolean;
}

export interface ValidateCouponResult {
    valid: boolean;
    discountAmount: number;
    message?: string;
}

/** Preview only — no redemption, no DB write. */
export const validateCouponCode = (code: string, items: CheckoutItemInput[]) =>
    request<ValidateCouponResult>("/api/coupons/validate", jsonInit("POST", { code, items }));

export const fetchCoupons = async () => {
    const { coupons } = await request<{ coupons: Coupon[] }>("/api/coupons", { cache: "no-store" });
    return coupons;
};

export const createCoupon = async (payload: CouponPayload) => {
    const { coupon } = await request<{ coupon: Coupon }>("/api/coupons", jsonInit("POST", payload));
    return coupon;
};

export const updateCoupon = async (code: string, payload: CouponPayload) => {
    const { coupon } = await request<{ coupon: Coupon }>(
        `/api/coupons/${encodeURIComponent(code)}`,
        jsonInit("PUT", payload)
    );
    return coupon;
};

export const deleteCoupon = (code: string) =>
    request<{ deleted: string }>(`/api/coupons/${encodeURIComponent(code)}`, { method: "DELETE" });
