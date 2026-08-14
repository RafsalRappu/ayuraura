import { createContext, useContext } from "react";
import type { SignupPayload } from "../api/customers";
import type { Customer } from "../types/customer";

export type CustomerAuthStatus = "loading" | "ready";

export interface CustomerAuthContextValue {
    status: CustomerAuthStatus;
    customer: Customer | null;
    /** False when CUSTOMER_SESSION_SECRET is missing on the server. */
    configured: boolean;
    refresh: () => void;
    login: (phone: string, password: string) => Promise<Customer>;
    signup: (payload: SignupPayload) => Promise<Customer>;
    logout: () => Promise<void>;
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export const useCustomerAuth = () => {
    const context = useContext(CustomerAuthContext);
    if (!context) {
        throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
    }
    return context;
};
