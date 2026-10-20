import type { AdminOrder } from "../types/order";
import { request } from "./client";

export interface AdminAccount {
    id: number;
    username: string;
    name: string;
    createdAt: string;
}

export interface AdminSession {
    authenticated: boolean;
    /** False when ADMIN_SESSION_SECRET is missing on the server. */
    configured: boolean;
    /** True until the first admin account exists (first sign-in uses ADMIN_PASSWORD). */
    needsSetup: boolean;
    admin?: AdminAccount;
}

export const fetchSession = () =>
    request<AdminSession>("/api/admin/session", { cache: "no-store" });

const jsonInit = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const login = (username: string, password: string) =>
    request<{ authenticated: boolean; admin: AdminAccount }>("/api/admin/login", jsonInit("POST", { username, password }));

export const fetchAdmins = async () => {
    const { admins } = await request<{ admins: AdminAccount[] }>("/api/admin/admins", { cache: "no-store" });
    return admins;
};

export const createAdmin = async (input: { username: string; name: string; password: string }) => {
    const { admin } = await request<{ admin: AdminAccount }>("/api/admin/admins", jsonInit("POST", input));
    return admin;
};

export const updateAdmin = async (id: number, input: { username: string; name: string }) => {
    const { admin } = await request<{ admin: AdminAccount }>(`/api/admin/admins?id=${id}`, jsonInit("PATCH", input));
    return admin;
};

/** `currentPassword` is required only when changing your own password. */
export const changeAdminPassword = async (id: number, password: string, currentPassword?: string) => {
    const { admin } = await request<{ admin: AdminAccount }>(
        `/api/admin/admins?id=${id}`,
        jsonInit("PATCH", { password, ...(currentPassword !== undefined ? { currentPassword } : {}) })
    );
    return admin;
};

export const deleteAdmin = (id: number) =>
    request<{ deleted: boolean }>(`/api/admin/admins?id=${id}`, { method: "DELETE" });

export interface StorageStatus {
    usedBytes: number;
    limitBytes: number;
    percent: number;
    thresholdPercent: number;
    /** True once usage reaches the threshold — the only time a backup may be taken. */
    backupEnabled: boolean;
}

export const fetchStorage = () => request<StorageStatus>("/api/admin/storage", { cache: "no-store" });

export interface BackupPage {
    orders: AdminOrder[];
    /** Pass as `after` to get the next page; null on the last one. */
    nextAfter: number | null;
}

export const fetchBackupPage = (after: number) =>
    request<BackupPage>(`/api/admin/backup?after=${after}`, { cache: "no-store" });

export interface AdminCustomer {
    id: number;
    name: string;
    phone: string;
    email: string | null;
    createdAt: string;
    orderCount: number;
    /** Sum of paid orders, in rupees. */
    paidTotal: number;
    lastOrderAt: string | null;
}

export const fetchCustomers = async () => {
    const { customers } = await request<{ customers: AdminCustomer[] }>("/api/admin/customers", { cache: "no-store" });
    return customers;
};

export const logout = () => request<{ authenticated: boolean }>("/api/admin/logout", { method: "POST" });

/** Uploads to Vercel Blob and returns the public URL of the stored image. */
export const uploadImage = async (file: Blob, filename: string) => {
    const params = new URLSearchParams({ filename, type: file.type });

    const { url } = await request<{ url: string }>(`/api/upload?${params.toString()}`, {
        method: "POST",
        // The Node runtime only surfaces a raw body for octet-stream, so the
        // real image type travels in the query string instead.
        headers: { "Content-Type": "application/octet-stream" },
        body: file,
    });

    return url;
};
