import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison that tolerates differing lengths. */
export const safeEqual = (a: string, b: string) => {
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);
    if (bufferA.length !== bufferB.length) {
        // Still burn a comparison so failure timing does not leak the length.
        timingSafeEqual(bufferA, bufferA);
        return false;
    }
    return timingSafeEqual(bufferA, bufferB);
};
