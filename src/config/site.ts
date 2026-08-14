export const siteConfig = {
    name: "AyuAura",
    title: "AyuAura | Handcrafted Ayurvedic Skincare",
    description:
        "AyuAura crafts handmade Ayurvedic skincare — herbal lip balms, face oils, kajal and more — formulated by a qualified Ayurvedic practitioner using traditional, chemical-free ingredients.",
    url: "https://ayuaura.example.com",
    ogImage: "/og-image.jpg",
    locale: "en_IN",
    themeColor: "#355E3B",

    contact: {
        whatsappNumber: "918943380593",
        whatsappDisplay: "+91 89433 80593",
        email: "riswanacs2000@gmail.com",
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
        instagram: "https://www.instagram.com/_ris_wana_cs?utm_source=qr",
        facebook: "https://facebook.com/ayuaura",
    },
} as const;

export const whatsappLink = (message?: string) => {
    const base = `https://wa.me/${siteConfig.contact.whatsappNumber}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
