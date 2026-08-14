export type OrderStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OrderItem {
    slug: string;
    name: string;
    image?: string;
    price: number;
    variantLabel?: string;
    quantity: number;
}

/** Public shape — no customer PII, no Razorpay identifiers. */
export interface Order {
    publicId: string;
    items: OrderItem[];
    amount: number;
    currency: string;
    status: OrderStatus;
    createdAt: string;
    /** Always present — 0 when no coupon was applied. */
    discountAmount: number;
    couponCode?: string;
}

export interface AdminOrder extends Order {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddressLine1?: string;
    customerAddressLine2?: string;
    customerCity?: string;
    customerState?: string;
    customerPincode?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    adminNote?: string;
    /** Present only when this order was placed by a signed-in account. */
    customerId?: number;
    updatedAt: string;
}

export interface CheckoutCustomer {
    name: string;
    phone: string;
    email?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
}

/** What the client sends to create an order — no price/name, just what to buy. */
export interface CheckoutItemInput {
    slug: string;
    variantLabel?: string;
    quantity: number;
}
