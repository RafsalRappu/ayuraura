/**
 * Per-instance sliding-window throttle. Serverless instances are not shared,
 * so this slows a burst rather than enforcing a global limit — same caveat as
 * the login throttle in `auth.ts`, which this mirrors but does not replace.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export const checkRateLimit = (key: string, options: { windowMs: number; max: number }): boolean => {
    const now = Date.now();

    const existing = buckets.get(key);
    if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + options.windowMs });
        return true;
    }

    existing.count += 1;
    return existing.count <= options.max;
};
