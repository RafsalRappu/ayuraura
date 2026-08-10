import Hero from "../../components/home/Hero/Hero";
import FeaturedProducts from "../../components/home/FeaturedProducts/FeaturedProducts";
import TrustBand from "../../components/home/TrustBand";
import Testimonials from "../../components/home/Testimonials";
import SocialProof from "../../components/home/SocialProof";
import FAQSection from "../../components/home/FAQSection";
import SEO from "../../components/common/SEO";
import { siteConfig } from "../../config/site";

const Home = () => {
    return (
        <>
            <SEO title={siteConfig.name} description={siteConfig.description} path="/" />

            <Hero />
            <TrustBand />
            <FeaturedProducts />
            <Testimonials />
            <SocialProof />
            <FAQSection />
        </>
    );
};

export default Home;
