import { Outlet } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import ScrollToTop from "../../common/ScrollToTop";
import { organizationSchema } from "../../../utils/structuredData";

const MainLayout = () => {
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
                <Outlet />
            </main>

            <Footer />
        </>
    );
};

export default MainLayout;
