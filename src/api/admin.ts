import type { AdminOrder } from "../types/order";
import { request } from "./client";

export interface AdminSession {
    authenticated: boolean;
    /** False when ADMIN_PASSWORD / ADMIN_SESSION_SECRET are missing on the server. */
    configured: boolean;
}

export const fetchSession = () =>
    request<AdminSession>("/api/admin/session", { cache: "no-store" });

export const login = (password: string) =>
    request<{ authenticated: boolean }>("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });

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
