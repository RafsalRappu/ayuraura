import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import MainLayout from "../components/layout/MainLayout/MainLayout";

const Home = lazy(() => import("../pages/Home/Home"));
const Products = lazy(() => import("../pages/Products/Products"));
const About = lazy(() => import("../pages/About/About"));
const Contact = lazy(() => import("../pages/Contacts/Contact"));
const ProductDetails = lazy(() => import("../pages/ProductDetails/ProductDetails"));
const NotFound = lazy(() => import("../pages/NotFound/NotFound"));

// Admin lives outside MainLayout and in its own chunk, so none of it ships
// with the storefront bundle.
const Admin = lazy(() => import("../pages/Admin/Admin"));

const PageFallback = () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress color="primary" />
    </Box>
);

const AppRouter = () => {
    return (
        <Suspense fallback={<PageFallback />}>
            <Routes>
                <Route path="/admin" element={<Admin />} />

                <Route element={<MainLayout />}>
                    <Route index element={<Home />} />

                    <Route path="products" element={<Products />} />
                    <Route path="/products/:slug" element={<ProductDetails />} />

                    <Route path="about" element={<About />} />

                    <Route path="contact" element={<Contact />} />

                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </Suspense>
    );
};

export default AppRouter;
