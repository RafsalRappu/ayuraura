import type { CartItem } from "../types/cart";
import type { OrderItem } from "../types/order";

export const cartItemKey = (slug: string, variantLabel?: string) => `${slug}::${variantLabel ?? ""}`;

export const cartCount = (items: CartItem[]) => items.reduce((total, item) => total + item.quantity, 0);

/** Works for both cart items (pre-checkout) and server-resolved order items (post-checkout). */
export const cartTotal = (items: OrderItem[]) =>
    items.reduce((total, item) => total + item.price * item.quantity, 0);

/** Builds the itemized message sent through `whatsappLink()` at checkout. */
export const buildWhatsAppMessage = (items: OrderItem[]) => {
    const lines = items.map((item, index) => {
        const variant = item.variantLabel ? ` (${item.variantLabel})` : "";
        return `${index + 1}. ${item.name}${variant} x${item.quantity} — ₹${item.price * item.quantity}`;
    });

    return [
        "Hi AyuAura, I'd like to order:",
        ...lines,
        `Total: ₹${cartTotal(items)}`,
    ].join("\n");
};

/** A short, human-readable reference for an order — not the full UUID. */
export const orderShortCode = (publicId: string) => publicId.slice(0, 8).toUpperCase();

/** Same itemized message, prefixed with the order's short code so an admin can
 *  match a WhatsApp conversation back to the pending order row. */
export const buildOrderWhatsAppMessage = (items: OrderItem[], publicId: string) =>
    `Order #${orderShortCode(publicId)}\n${buildWhatsAppMessage(items)}`;
