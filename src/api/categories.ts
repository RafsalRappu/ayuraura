import type { Category } from "../types/category";
import { request } from "./client";

export const fetchCategories = async () => {
    const { categories } = await request<{ categories: Category[] }>("/api/categories", { cache: "no-store" });
    return categories;
};

export const renameCategory = async (slug: string, name: string) => {
    const { category } = await request<{ category: Category }>(`/api/categories/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });
    return category;
};

export const deleteCategory = (slug: string) =>
    request<{ deleted: string }>(`/api/categories/${encodeURIComponent(slug)}`, { method: "DELETE" });
