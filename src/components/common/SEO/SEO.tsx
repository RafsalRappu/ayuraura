import { Helmet } from "react-helmet-async";
import { siteConfig } from "../../../config/site";

interface SEOProps {
    title: string;
    description: string;
    path?: string;
    image?: string;
    type?: "website" | "product" | "article";
    noindex?: boolean;
    jsonLd?: object | object[];
}

const SEO = ({
    title,
    description,
    path = "",
    image = siteConfig.ogImage,
    type = "website",
    noindex = false,
    jsonLd,
}: SEOProps) => {
    const url = `${siteConfig.url}${path}`;
    const fullTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`;
    const absoluteImage = image.startsWith("http") ? image : `${siteConfig.url}${image}`;
    const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={url} />
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteConfig.name} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={absoluteImage} />
            <meta property="og:locale" content={siteConfig.locale} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={absoluteImage} />

            {schemas.map((schema, index) => (
                <script key={index} type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            ))}
        </Helmet>
    );
};

export default SEO;
