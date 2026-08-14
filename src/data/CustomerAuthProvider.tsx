import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { fetchCustomerSession, login as loginRequest, logout as logoutRequest, signup as signupRequest } from "../api/customers";
import type { SignupPayload } from "../api/customers";
import type { Customer } from "../types/customer";
import { CustomerAuthContext } from "./useCustomerAuth";
import type { CustomerAuthStatus } from "./useCustomerAuth";

interface CustomerAuthProviderProps {
    children: ReactNode;
}

export const CustomerAuthProvider = ({ children }: CustomerAuthProviderProps) => {
    const [status, setStatus] = useState<CustomerAuthStatus>("loading");
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [configured, setConfigured] = useState(true);

    const refreshAsync = useCallback(async () => {
        setStatus("loading");
        try {
            const session = await fetchCustomerSession();
            setCustomer(session.authenticated ? (session.customer ?? null) : null);
            setConfigured(session.configured);
        } catch {
            // Keep the storefront usable if the session check fails — just
            // treat the visitor as logged out rather than blocking anything.
            setCustomer(null);
        } finally {
            setStatus("ready");
        }
    }, []);

    useEffect(() => {
        void refreshAsync();
    }, [refreshAsync]);

    const login = useCallback(async (phone: string, password: string) => {
        const loggedIn = await loginRequest(phone, password);
        setCustomer(loggedIn);
        return loggedIn;
    }, []);

    const signup = useCallback(async (payload: SignupPayload) => {
        const created = await signupRequest(payload);
        setCustomer(created);
        return created;
    }, []);

    const logout = useCallback(async () => {
        await logoutRequest();
        setCustomer(null);
    }, []);

    const value = useMemo(
        () => ({
            status,
            customer,
            configured,
            refresh: () => void refreshAsync(),
            login,
            signup,
            logout,
        }),
        [status, customer, configured, refreshAsync, login, signup, logout]
    );

    return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
};
