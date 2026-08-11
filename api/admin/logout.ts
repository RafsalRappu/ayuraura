import type { VercelRequest, VercelResponse } from "@vercel/node";

import { clearSessionCookie } from "../_lib/auth";
import { methodNotAllowed, sendJson } from "../_lib/http";

const handler = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

    res.setHeader("Cache-Control", "no-store");
    clearSessionCookie(req, res);
    return sendJson(res, 200, { authenticated: false });
};

export default handler;
