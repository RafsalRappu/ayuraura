import type { Product } from "../types/product";
import lipBalmImage from "../assets/images/lipbalm.jpg";
import faceoil from "../assets/images/faceoil.jpg";
import kajal from "../assets/images/kajal.jpg";

export const products: Product[] = [
    {
        id: 1,
        slug: "herbal-lip-balm",
        name: "Herbal Lip Balm",
        price: 249,
        category: "Lip Care",
        image: lipBalmImage,
        icon: "lip",
        shortDescription: "Deep nourishment for dry lips.",
        description:
            "Handcrafted Ayurvedic lip balm enriched with beeswax, almond oil and vitamin E. Melts in on contact and forms a light, breathable seal that keeps lips soft through the day.",

        ingredients: ["Beeswax", "Almond Oil", "Vitamin E", "Shea Butter"],

        benefits: ["Repairs cracked lips", "Natural glow", "Long-lasting moisture"],

        howToUse:
            "Apply a small amount to lips as needed, ideally before bed and after sun exposure.",

        featured: true,
        bestseller: true,
        newArrival: false,
        rating: 4.8,
        reviewCount: 126,
    },

    {
        id: 2,
        slug: "kumkumadi-face-oil",
        name: "Kumkumadi Face Oil",
        price: 499,
        category: "Face Care",
        image: faceoil,
        icon: "face",

        shortDescription: "Glow naturally.",

        description:
            "Cold-pressed herbal face oil built on the classic Kumkumadi formulation for healthy, radiant skin. A few drops at night restore softness and an even-toned glow.",

        ingredients: ["Kumkumadi", "Rose", "Saffron", "Sandalwood"],

        benefits: ["Brightens skin", "Hydrates", "Improves texture"],

        howToUse: "Massage 3-4 drops onto cleansed face and neck every night before bed.",

        featured: true,
        bestseller: false,
        newArrival: true,
        rating: 4.6,
        reviewCount: 84,
    },

    {
        id: 3,
        slug: "natural-kajal",
        name: "Natural Kajal",
        price: 199,
        category: "Eye Care",
        image: kajal,
        icon: "eye",

        shortDescription: "Chemical free kajal.",

        description:
            "Traditional Ayurvedic kajal suitable for everyday use, slow-cooked the old way with castor oil, ghee and camphor for a cooling, soothing wear.",

        ingredients: ["Castor Oil", "Ghee", "Camphor", "Almond Shell Ash"],

        benefits: ["Cooling", "Long lasting", "Smudge resistant"],

        howToUse: "Line the inner and outer eyelids with a clean applicator.",

        featured: true,
        bestseller: true,
        newArrival: true,
        rating: 4.9,
        reviewCount: 203,
    },

    {
        id: 4,
        slug: "tinted-lip-balm-rose",
        name: "Tinted Lip Balm — Rose",
        price: 279,
        category: "Lip Care",
        icon: "lip",

        shortDescription: "A wash of natural rose tint with the same nourishing base.",

        description:
            "All the moisture of our original lip balm with a sheer wash of rose tint from beetroot extract — buildable colour with zero synthetic dyes.",

        ingredients: ["Beeswax", "Beetroot Extract", "Almond Oil", "Vitamin E"],

        benefits: ["Sheer natural tint", "Nourishes as it colours", "Buildable coverage"],

        howToUse: "Swipe directly from the tin and pat with a fingertip, layer for more colour.",

        featured: false,
        bestseller: false,
        newArrival: true,
        rating: 4.5,
        reviewCount: 37,
    },

    {
        id: 5,
        slug: "turmeric-radiance-face-pack",
        name: "Turmeric Radiance Face Pack",
        price: 349,
        category: "Face Care",
        icon: "face",

        shortDescription: "A weekly ritual for brighter, even-toned skin.",

        description:
            "A fine clay and turmeric powder blend that lifts dullness and calms the skin. Mix with rose water or milk for a mask that leaves skin visibly brighter within minutes.",

        ingredients: ["Turmeric", "Multani Mitti", "Sandalwood Powder", "Orange Peel"],

        benefits: ["Reduces dullness", "Evens skin tone", "Gently exfoliates"],

        howToUse:
            "Mix a spoonful with rose water into a paste, apply for 15 minutes, then rinse. Use twice a week.",

        featured: true,
        bestseller: false,
        newArrival: false,
        rating: 4.7,
        reviewCount: 61,
    },

    {
        id: 6,
        slug: "herbal-neem-soap",
        name: "Herbal Neem Soap",
        price: 149,
        category: "Face Care",
        icon: "face",

        shortDescription: "A gentle daily cleanse for clear, calm skin.",

        description:
            "Cold-processed neem and tulsi soap that cleanses without stripping the skin's natural moisture — a good everyday bar for acne-prone and sensitive skin.",

        ingredients: ["Neem", "Tulsi", "Coconut Oil", "Aloe Vera"],

        benefits: ["Clears blemishes", "Antibacterial", "Non-drying"],

        howToUse: "Lather onto damp skin, massage gently and rinse. Suitable for face and body.",

        featured: false,
        bestseller: true,
        newArrival: false,
        rating: 4.4,
        reviewCount: 52,
    },

    {
        id: 7,
        slug: "bhringraj-hair-oil",
        name: "Bhringraj Hair Oil",
        price: 399,
        category: "Hair Care",
        icon: "hair",

        shortDescription: "Strengthens roots and reduces hair fall.",

        description:
            "A slow-infused blend of bhringraj, amla and curry leaf in a coconut oil base — the classic Ayurvedic trio for stronger roots and healthier growth.",

        ingredients: ["Bhringraj", "Amla", "Curry Leaf", "Coconut Oil"],

        benefits: ["Reduces hair fall", "Strengthens roots", "Adds natural shine"],

        howToUse:
            "Warm slightly and massage into the scalp 2-3 times a week. Leave for at least an hour, or overnight, before washing out.",

        featured: true,
        bestseller: false,
        newArrival: true,
        rating: 4.6,
        reviewCount: 45,
    },

    {
        id: 8,
        slug: "rose-body-butter",
        name: "Rose Body Butter",
        price: 449,
        category: "Body Care",
        icon: "body",

        shortDescription: "Whipped shea butter for soft, hydrated skin.",

        description:
            "A whipped shea and cocoa butter blend scented with real rose, absorbs quickly without a greasy after-feel and keeps skin soft for hours.",

        ingredients: ["Shea Butter", "Cocoa Butter", "Rose Oil", "Sweet Almond Oil"],

        benefits: ["Deep hydration", "Softens skin", "Light natural fragrance"],

        howToUse: "Massage onto clean skin after a shower while it's still slightly damp.",

        featured: false,
        bestseller: false,
        newArrival: true,
        rating: 4.7,
        reviewCount: 29,
    },
];

export const getProductBySlug = (slug: string) =>
    products.find((product) => product.slug === slug);

export const getRelatedProducts = (product: Product, limit = 3) =>
    products
        .filter((p) => p.id !== product.id && p.category === product.category)
        .slice(0, limit);
