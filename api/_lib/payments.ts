import { createHmac } from "node:crypto";

import { safeEqual } from "./crypto";
import { logFailure } from "./http";

export const isPaymentsConfigured = () =>
    Boolean(process.env.RAZORPAY_KEY_ID) && Boolean(process.env.RAZORPAY_KEY_SECRET);

const requireEnv = (key: string) => {
    const value = process.env[key];
    if (!value) throw new Error(`${key} is not set.`);
    return value;
};

interface RazorpayOrder {
    id: string;
    amount: number;
    currency: string;
}

/** Creates a Razorpay Order. `amountRupees` matches this codebase's whole-rupee
 *  convention everywhere else — conversion to paise happens only here, at the
 *  API boundary. */
export const createRazorpayOrder = async (amountRupees: number, receipt: string): Promise<RazorpayOrder> => {
    const keyId = requireEnv("RAZORPAY_KEY_ID");
    const keySecret = requireEnv("RAZORPAY_KEY_SECRET");
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

    const response = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            amount: Math.round(amountRupees * 100),
            currency: "INR",
            receipt,
        }),
    });

    if (!response.ok) {
        logFailure("payments:createOrder", new Error(`Razorpay responded ${response.status}: ${await response.text()}`));
        throw new Error("Could not reach Razorpay to start the payment.");
    }

    return (await response.json()) as RazorpayOrder;
};

/** HMAC-SHA256 of `orderId|paymentId`, keyed by the checkout secret — Razorpay's documented scheme. */
export const verifyPaymentSignature = (params: { orderId: string; paymentId: string; signature: string }) => {
    const expected = createHmac("sha256", requireEnv("RAZORPAY_KEY_SECRET"))
        .update(`${params.orderId}|${params.paymentId}`)
        .digest("hex");
    return safeEqual(expected, params.signature);
};

/** HMAC-SHA256 of the raw webhook body, keyed by a SEPARATE webhook secret. */
export const verifyWebhookSignature = (rawBody: string, signature: string) => {
    const expected = createHmac("sha256", requireEnv("RAZORPAY_WEBHOOK_SECRET")).update(rawBody).digest("hex");
    return safeEqual(expected, signature);
};
