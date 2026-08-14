const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

let loadPromise: Promise<void> | null = null;

/** Loads Razorpay's hosted Checkout widget once — repeat calls reuse the same promise. */
export const loadRazorpayCheckout = (): Promise<void> => {
    if (window.Razorpay) return Promise.resolve();

    if (!loadPromise) {
        loadPromise = new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = SCRIPT_SRC;
            script.onload = () => resolve();
            script.onerror = () => {
                loadPromise = null;
                reject(new Error("Could not load the payment widget. Check your connection and try again."));
            };
            document.head.appendChild(script);
        });
    }

    return loadPromise;
};
