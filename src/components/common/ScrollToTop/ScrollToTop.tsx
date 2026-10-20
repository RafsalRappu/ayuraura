import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        // "instant" so a route change jumps to the top instead of animating
        // through the old page (the page itself fades in).
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
