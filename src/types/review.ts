export type ReviewStatus = "pending" | "approved" | "rejected";

/** Public shape — only ever shown for approved reviews. */
export interface Review {
    id: number;
    authorName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface AdminReview extends Review {
    status: ReviewStatus;
    productId: number;
    productName: string;
    productSlug: string;
}

export interface ReviewSummary {
    averageRating: number;
    count: number;
}
