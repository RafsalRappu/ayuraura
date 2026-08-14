export type CouponType = "flat" | "percentage";

export interface Coupon {
    id: number;
    code: string;
    type: CouponType;
    value: number;
    startsAt?: string;
    expiresAt?: string;
    usageLimit?: number;
    timesUsed: number;
    active: boolean;
}
