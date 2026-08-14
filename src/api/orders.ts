import type { AdminOrder, CheckoutCustomer, CheckoutItemInput, Order, OrderStatus } from "../types/order";
import { request } from "./client";

const jsonInit = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const createOrder = async (
    items: CheckoutItemInput[],
    customer: CheckoutCustomer,
    couponCode?: string
) => {
    const { order } = await request<{ order: Order }>(
        "/api/orders",
        jsonInit("POST", { items, customer, ...(couponCode ? { couponCode } : {}) })
    );
    return order;
};

export interface PayResponse {
    razorpayOrderId: string;
    keyId: string;
    amount: number;
    currency: string;
}

export const payOrder = (publicId: string) =>
    request<PayResponse>(`/api/orders/${encodeURIComponent(publicId)}/pay`, { method: "POST" });

export const verifyOrder = async (
    publicId: string,
    payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }
) => {
    const { order } = await request<{ order: Order }>(
        `/api/orders/${encodeURIComponent(publicId)}/verify`,
        jsonInit("POST", payload)
    );
    return order;
};

export const fetchOrder = async (publicId: string) => {
    const { order } = await request<{ order: Order }>(`/api/orders/${encodeURIComponent(publicId)}`, {
        cache: "no-store",
    });
    return order;
};

export const fetchOrders = async () => {
    const { orders } = await request<{ orders: AdminOrder[] }>("/api/orders", { cache: "no-store" });
    return orders;
};

export const updateOrderStatus = async (publicId: string, status: OrderStatus, adminNote?: string) => {
    const { order } = await request<{ order: AdminOrder }>(
        `/api/orders/${encodeURIComponent(publicId)}`,
        jsonInit("PATCH", { status, ...(adminNote ? { adminNote } : {}) })
    );
    return order;
};
