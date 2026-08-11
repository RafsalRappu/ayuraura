export class ApiError extends Error {
    status: number;
    details: string[];

    constructor(status: number, message: string, details: string[] = []) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}

/**
 * `npm run dev` starts Vite alone, which has no /api routes and answers them
 * with index.html. `vercel dev` is what serves the functions alongside it.
 */
const API_NOT_SERVED = import.meta.env.DEV
    ? "The API did not respond. Plain `npm run dev` does not serve /api — stop it and run `npm run dev:api` instead."
    : "The API did not respond correctly. Please try again in a moment.";

export const errorMessage = (error: unknown, fallback = "Something went wrong.") => {
    if (error instanceof ApiError) {
        return error.details.length ? `${error.message} ${error.details.join(" ")}` : error.message;
    }
    if (error instanceof Error) return error.message;
    return fallback;
};

export const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let response: Response;
    try {
        response = await fetch(path, { credentials: "same-origin", ...init });
    } catch {
        throw new ApiError(0, "Could not reach the server. Check your connection and try again.");
    }

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
        try {
            payload = JSON.parse(text);
        } catch {
            // A proxy or platform error page — fall through to the status message.
        }
    }

    if (!response.ok) {
        const body = (payload ?? {}) as { message?: string; errors?: string[] };
        throw new ApiError(
            response.status,
            body.message ?? `Request failed with status ${response.status}.`,
            body.errors ?? []
        );
    }

    // A 2xx that is not JSON means something other than the API answered —
    // most often the SPA fallback serving index.html for an unrouted /api path.
    if (payload === null) {
        throw new ApiError(response.status, API_NOT_SERVED);
    }

    return payload as T;
};
