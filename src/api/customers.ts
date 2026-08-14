import type { Customer } from "../types/customer";
import type { Order } from "../types/order";
import { request } from "./client";

const jsonInit = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export interface CustomerSession {
    authenticated: boolean;
    customer?: Customer;
    /** False when CUSTOMER_SESSION_SECRET is missing on the server. */
    configured: boolean;
}

export const fetchCustomerSession = () => request<CustomerSession>("/api/customers/session", { cache: "no-store" });

export interface SignupPayload {
    name: string;
    phone: string;
    password: string;
    email?: string;
}

export const signup = async (payload: SignupPayload) => {
    const { customer } = await request<{ customer: Customer }>("/api/customers/signup", jsonInit("POST", payload));
    return customer;
};

export const login = async (phone: string, password: string) => {
    const { customer } = await request<{ customer: Customer }>(
        "/api/customers/login",
        jsonInit("POST", { phone, password })
    );
    return customer;
};

export const logout = () => request<{ authenticated: boolean }>("/api/customers/logout", { method: "POST" });

export const fetchMyOrders = async () => {
    const { orders } = await request<{ orders: Order[] }>("/api/customers/orders", { cache: "no-store" });
    return orders;
};
