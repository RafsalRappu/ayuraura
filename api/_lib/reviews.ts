import type { AdminReview, Review, ReviewStatus, ReviewSummary } from "../../src/types/review.js";
import type { Result } from "./http.js";

export const STATUSES = ["pending", "approved", "rejected"] as const;

export const REVIEW_COLUMNS = `id, product_id, author_name, rating, comment, status, created_at`;

export interface ReviewRow {
    id: number;
    product_id: number;
    author_name: string;
    rating: number;
    comment: string;
    status: string;
    created_at: string;
}

export interface AdminReviewRow extends ReviewRow {
    product_name: string;
    product_slug: string;
}

export const toReview = (row: ReviewRow): Review => ({
    id: row.id,
    authorName: row.author_name,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
});

export const toAdminReview = (row: AdminReviewRow): AdminReview => ({
    ...toReview(row),
    status: row.status as ReviewStatus,
    productId: row.product_id,
    productName: row.product_name,
    productSlug: row.product_slug,
});

export const computeSummary = (rows: { rating: number }[]): ReviewSummary => {
    if (rows.length === 0) return { averageRating: 0, count: 0 };
    const total = rows.reduce((sum, row) => sum + row.rating, 0);
    return { averageRating: Math.round((total / rows.length) * 10) / 10, count: rows.length };
};

const MAX = {
    authorName: 80,
    comment: 1000,
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export interface ReviewInput {
    productSlug: string;
    authorName: string;
    rating: number;
    comment: string;
}

/** Shape/bounds validation only — no DB access. */
export const parseReviewInput = (body: Record<string, unknown>): Result<ReviewInput> => {
    const errors: string[] = [];

    const productSlug = text(body.productSlug);
    if (!productSlug) errors.push("Product is required.");

    const authorName = text(body.authorName);
    if (!authorName) errors.push("Name is required.");
    else if (authorName.length > MAX.authorName) {
        errors.push(`Name must be ${MAX.authorName} characters or fewer.`);
    }

    const rating = typeof body.rating === "number" ? body.rating : Number(body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        errors.push("Rating must be a whole number between 1 and 5.");
    }

    const comment = text(body.comment);
    if (!comment) errors.push("A comment is required.");
    else if (comment.length > MAX.comment) errors.push(`Comment must be ${MAX.comment} characters or fewer.`);

    if (errors.length) return { ok: false, errors };

    return { ok: true, value: { productSlug, authorName, rating, comment } };
};
