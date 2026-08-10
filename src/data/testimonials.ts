export interface Testimonial {
    id: number;
    name: string;
    location: string;
    rating: number;
    quote: string;
    product: string;
}

export const testimonials: Testimonial[] = [
    {
        id: 1,
        name: "Ananya S.",
        location: "Kochi",
        rating: 5,
        quote:
            "The lip balm is the first one that's actually healed my cracked lips instead of just masking it. A little goes a long way.",
        product: "Herbal Lip Balm",
    },
    {
        id: 2,
        name: "Priya R.",
        location: "Bengaluru",
        rating: 5,
        quote:
            "Been using the Kumkumadi oil for six weeks now — my skin looks noticeably more even and I've gotten so many compliments.",
        product: "Kumkumadi Face Oil",
    },
    {
        id: 3,
        name: "Meera K.",
        location: "Chennai",
        rating: 5,
        quote:
            "Finally a kajal that doesn't irritate my eyes. Stays put all day and washes off easily at night.",
        product: "Natural Kajal",
    },
    {
        id: 4,
        name: "Rahul M.",
        location: "Kozhikode",
        rating: 4,
        quote:
            "Ordered the hair oil for my mother after her recommendation — my hair fall has genuinely reduced in a month.",
        product: "Bhringraj Hair Oil",
    },
    {
        id: 5,
        name: "Divya N.",
        location: "Coimbatore",
        rating: 5,
        quote:
            "Love that I can WhatsApp the doctor directly with questions about my skin type before ordering. Feels personal, not like a random online store.",
        product: "Turmeric Radiance Face Pack",
    },
];
