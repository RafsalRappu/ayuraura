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
