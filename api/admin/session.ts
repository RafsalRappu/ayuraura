import type { VercelRequest, VercelResponse } from "@vercel/node";

import { isAdminConfigured, isAuthenticated } from "../_lib/auth.js";
import { methodNotAllowed, sendJson } from "../_lib/http.js";

const handler = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

    res.setHeader("Cache-Control", "no-store");
    return sendJson(res, 200, {
        authenticated: isAuthenticated(req),
        // Lets the sign-in screen explain missing env vars instead of just failing.
        configured: isAdminConfigured(),
    });
};

export default handler;
