import { Outlet, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { useTheme } from "@mui/material/styles";

import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import ScrollToTop from "../../common/ScrollToTop";
import { organizationSchema } from "../../../utils/structuredData";
import { EASE_OUT } from "../../../theme/motion";

/** Thin brand-gradient bar along the top edge that tracks page scroll. */
const ScrollProgress = () => {
    const theme = useTheme();
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

    return (
        <motion.div
            aria-hidden
            style={{
                scaleX,
                transformOrigin: "0% 50%",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                zIndex: theme.zIndex.appBar + 1,
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
        />
    );
};

const MainLayout = () => {
    const location = useLocation();

    return (
        <>
            <Helmet>
                <script type="application/ld+json">{JSON.stringify(organizationSchema())}</script>
            </Helmet>

            <ScrollToTop />
            <ScrollProgress />

            <header>
                <Navbar />
            </header>

            <main>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }}
                        exit={{ opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" } }}
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
