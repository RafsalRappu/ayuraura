import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface RevealProps {
    children: ReactNode;
    delay?: number;
    y?: number;
    className?: string;
}

/** Fades/slides content up as it scrolls into view. Animates once per mount. */
const Reveal = ({ children, delay = 0, y = 24, className }: RevealProps) => (
    <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

export default Reveal;
