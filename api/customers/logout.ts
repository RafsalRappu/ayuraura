import type { VercelRequest, VercelResponse } from "@vercel/node";

import { checkCustomerOrigin, clearCustomerSessionCookie } from "../_lib/customerAuth";
import { methodNotAllowed, sendJson } from "../_lib/http";

const handler = (req: VercelRequest, res: VercelResponse) => {
    if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
    if (!checkCustomerOrigin(req, res)) return;

    res.setHeader("Cache-Control", "no-store");
    clearCustomerSessionCookie(req, res);
    return sendJson(res, 200, { authenticated: false });
};

export default handler;
