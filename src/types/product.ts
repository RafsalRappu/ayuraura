export interface Product {
    id: number;
    name: string;
    slug: string;
    price: number;
    category: string;
    image?: string;
    icon: "lip" | "face" | "eye" | "hair" | "body";
    shortDescription: string;
    description: string;
    ingredients: string[];
    benefits: string[];
    howToUse?: string;
    featured: boolean;
    bestseller: boolean;
    newArrival: boolean;
    rating?: number;
    reviewCount?: number;
}