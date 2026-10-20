import type { OrderStatus } from "../../types/order";

export type AdminTab = "overview" | "products" | "orders" | "categories" | "coupons" | "reviews" | "customers" | "admins";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
    pending: "Pending",
    paid: "Paid",
    failed: "Failed",
    cancelled: "Cancelled",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, "warning" | "success" | "error" | "default"> = {
    pending: "warning",
    paid: "success",
    failed: "error",
    cancelled: "default",
};
