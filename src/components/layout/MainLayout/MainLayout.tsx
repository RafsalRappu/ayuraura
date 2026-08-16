import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import ScrollToTop from "../../common/ScrollToTop";
import { organizationSchema } from "../../../utils/structuredData";

const MainLayout = () => {
    const location = useLocation();

    return (
        <>
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(organizationSchema())}</script>
            </Helmet>

            <ScrollToTop />

            <header>
                <Navbar />
            </header>

            <main>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                        <Outlet />
                    </motion.div>
                </AnimatePresence>
            </main>

            <Footer />
        </>
    );
};

export default MainLayout;
