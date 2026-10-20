// src/theme/motion.ts
// One motion vocabulary for the whole app, so every entrance and hover moves alike.

/** Fast start, long gentle settle — used for nearly every entrance. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** For things that move both ways (drawers, toggles). */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

/** CSS twin of EASE_OUT for hover transitions written in sx. */
export const CSS_EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

export const SPRING_SNAPPY = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 } as const;

/** Parent/child pair for staggered entrances (`initial="hidden" animate="show"`). */
export const staggerContainer = (stagger = 0.08, delayChildren = 0) => ({
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren } },
});

export const fadeUpItem = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT } },
};
