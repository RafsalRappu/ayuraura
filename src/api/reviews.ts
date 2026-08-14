import type { AdminReview, Review, ReviewStatus, ReviewSummary } from "../types/review";
import { request } from "./client";

const jsonInit = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const fetchProductReviews = (slug: string) =>
    request<{ reviews: Review[]; summary: ReviewSummary }>(`/api/products/${encodeURIComponent(slug)}/reviews`);

export interface SubmitReviewPayload {
    productSlug: string;
    authorName: string;
    rating: number;
    comment: string;
}

export const submitReview = async (payload: SubmitReviewPayload) => {
    const { review } = await request<{ review: Review }>("/api/reviews", jsonInit("POST", payload));
    return review;
};

export const fetchAllReviews = async () => {
    const { reviews } = await request<{ reviews: AdminReview[] }>("/api/reviews", { cache: "no-store" });
    return reviews;
};

export const updateReviewStatus = async (id: number, status: ReviewStatus) => {
    const { review } = await request<{ review: AdminReview }>(
        `/api/reviews/${id}`,
        jsonInit("PATCH", { status })
    );
    return review;
};

export const deleteReview = (id: number) => request<{ deleted: number }>(`/api/reviews/${id}`, { method: "DELETE" });
