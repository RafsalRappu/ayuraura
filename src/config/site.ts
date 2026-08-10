export const siteConfig = {
    name: "AyuAura",
    title: "AyuAura | Handcrafted Ayurvedic Skincare",
    description:
        "AyuAura crafts handmade Ayurvedic skincare — herbal lip balms, face oils, kajal and more — formulated by a qualified BAMS doctor using traditional, chemical-free ingredients.",
    url: "https://ayuaura.example.com",
    ogImage: "/og-image.jpg",
    locale: "en_IN",
    themeColor: "#355E3B",

    contact: {
        whatsappNumber: "919745659702",
        whatsappDisplay: "+91 97456 59702",
        email: "hello@ayuaura.example.com",
        address: {
            street: "Ayurveda Wellness Studio",
            locality: "Kochi",
            region: "Kerala",
            postalCode: "682001",
            country: "IN",
        },
        hours: "Mon – Sat, 10:00 AM – 6:00 PM IST",
    },

    social: {
        instagram: "https://instagram.com/ayuaura",
        facebook: "https://facebook.com/ayuaura",
    },
} as const;

export const whatsappLink = (message?: string) => {
    const base = `https://wa.me/${siteConfig.contact.whatsappNumber}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
