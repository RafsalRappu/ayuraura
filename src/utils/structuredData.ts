import { siteConfig } from "../config/site";
import type { Product } from "../types/product";

export const organizationSchema = () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/favicon.svg`,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.contact.address.street,
        addressLocality: siteConfig.contact.address.locality,
        addressRegion: siteConfig.contact.address.region,
        postalCode: siteConfig.contact.address.postalCode,
        addressCountry: siteConfig.contact.address.country,
    },
    sameAs: Object.values(siteConfig.social),
});

export const productSchema = (product: Product) => ({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image
        ? `${siteConfig.url}${product.image.startsWith("/") ? product.image : `/${product.image}`}`
        : `${siteConfig.url}${siteConfig.ogImage}`,
    sku: `AYU-${product.id}`,
    category: product.category,
    brand: {
        "@type": "Brand",
        name: siteConfig.name,
    },
    ...(product.rating
        ? {
              aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: product.rating,
                  reviewCount: product.reviewCount ?? 1,
              },
          }
        : {}),
    offers: {
        "@type": "Offer",
        url: `${siteConfig.url}/products/${product.slug}`,
        priceCurrency: "INR",
        price: product.price,
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
    },
});

export interface Crumb {
    label: string;
    path: string;
}

export const breadcrumbSchema = (crumbs: Crumb[]) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: `${siteConfig.url}${crumb.path}`,
    })),
});

export interface FaqItem {
    question: string;
    answer: string;
}

export const faqSchema = (faqs: FaqItem[]) => ({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
        },
    })),
});
