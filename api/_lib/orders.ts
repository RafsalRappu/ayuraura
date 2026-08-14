import type {
    AdminOrder,
    CheckoutCustomer,
    CheckoutItemInput,
    Order,
    OrderItem,
    OrderStatus,
} from "../../src/types/order";
import { getSql } from "./db";
import type { Result } from "./http";
import { PRODUCT_COLUMNS, toProduct } from "./products";
import type { ProductRow } from "./products";

export const STATUSES = ["pending", "paid", "failed", "cancelled"] as const;

/** Every column `toOrder`/`toAdminOrder` read, for interpolation via `sql.unsafe`. */
export const ORDER_COLUMNS = `
    id, public_id, items, amount, currency,
    customer_name, customer_phone, customer_email, customer_address,
    customer_address_line2, customer_city, customer_state, customer_pincode,
    status, razorpay_order_id, razorpay_payment_id, admin_note,
    coupon_code, discount_amount, customer_id,
    created_at, updated_at
`;

export interface OrderRow {
    id: number;
    public_id: string;
    items: unknown;
    amount: number;
    currency: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string | null;
    customer_address: string | null;
    customer_address_line2: string | null;
    customer_city: string | null;
    customer_state: string | null;
    customer_pincode: string | null;
    status: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    admin_note: string | null;
    coupon_code: string | null;
    discount_amount: number;
    customer_id: number | null;
    created_at: string;
    updated_at: string;
}

const toOrderItems = (value: unknown): OrderItem[] =>
    Array.isArray(value)
        ? value.filter((item): item is OrderItem => {
              const record = item as Partial<OrderItem>;
              return (
                  typeof record === "object" &&
                  record !== null &&
                  typeof record.slug === "string" &&
                  typeof record.name === "string" &&
                  typeof record.price === "number" &&
                  typeof record.quantity === "number"
              );
          })
        : [];

export const toOrder = (row: OrderRow): Order => ({
    publicId: row.public_id,
    items: toOrderItems(row.items),
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status as OrderStatus,
    createdAt: row.created_at,
    discountAmount: Number(row.discount_amount),
    ...(row.coupon_code ? { couponCode: row.coupon_code } : {}),
});

export const toAdminOrder = (row: OrderRow): AdminOrder => ({
    ...toOrder(row),
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    ...(row.customer_email ? { customerEmail: row.customer_email } : {}),
    ...(row.customer_address ? { customerAddressLine1: row.customer_address } : {}),
    ...(row.customer_address_line2 ? { customerAddressLine2: row.customer_address_line2 } : {}),
    ...(row.customer_city ? { customerCity: row.customer_city } : {}),
    ...(row.customer_state ? { customerState: row.customer_state } : {}),
    ...(row.customer_pincode ? { customerPincode: row.customer_pincode } : {}),
    ...(row.razorpay_order_id ? { razorpayOrderId: row.razorpay_order_id } : {}),
    ...(row.razorpay_payment_id ? { razorpayPaymentId: row.razorpay_payment_id } : {}),
    ...(row.admin_note ? { adminNote: row.admin_note } : {}),
    ...(row.customer_id !== null ? { customerId: row.customer_id } : {}),
    updatedAt: row.updated_at,
});

const MAX = {
    items: 30,
    quantityPerItem: 20,
    name: 120,
    phone: 20,
    email: 200,
    addressLine: 200,
    city: 100,
    state: 100,
};

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PINCODE_PATTERN = /^\d{6}$/;

export interface ParsedOrderInput {
    items: CheckoutItemInput[];
    customer: CheckoutCustomer;
    couponCode?: string;
}

/** Shared by order creation and the coupon preview endpoint, so both apply the
 *  same bounds to what's otherwise identical cart-item input. */
export const parseCheckoutItems = (rawBody: unknown, errors: string[]): CheckoutItemInput[] => {
    const rawItems = Array.isArray(rawBody) ? rawBody : [];
    if (rawItems.length === 0) errors.push("Your cart is empty.");
    if (rawItems.length > MAX.items) errors.push(`Orders cannot have more than ${MAX.items} items.`);

    const items: CheckoutItemInput[] = [];
    for (const raw of rawItems.slice(0, MAX.items)) {
        const record = (raw ?? {}) as Record<string, unknown>;
        const slug = text(record.slug);
        const variantLabel = text(record.variantLabel) || undefined;
        const quantity = typeof record.quantity === "number" ? record.quantity : Number(record.quantity);

        if (!slug) {
            errors.push("Every cart item needs a product.");
            continue;
        }
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX.quantityPerItem) {
            errors.push(`Quantity for "${slug}" must be a whole number between 1 and ${MAX.quantityPerItem}.`);
            continue;
        }

        items.push({ slug, quantity, ...(variantLabel ? { variantLabel } : {}) });
    }

    return items;
};

/** Shape/bounds validation only — no DB access. Never trusts a client-sent price. */
export const parseOrderInput = (body: Record<string, unknown>): Result<ParsedOrderInput> => {
    const errors: string[] = [];

    const items = parseCheckoutItems(body.items, errors);

    const couponCode = text(body.couponCode) || undefined;

    const customerRecord = (body.customer ?? {}) as Record<string, unknown>;

    const name = text(customerRecord.name);
    if (!name) errors.push("Name is required.");
    else if (name.length > MAX.name) errors.push(`Name must be ${MAX.name} characters or fewer.`);

    const phone = text(customerRecord.phone);
    if (!phone) errors.push("Phone number is required.");
    else if (!PHONE_PATTERN.test(phone)) errors.push("Enter a valid phone number.");

    const email = text(customerRecord.email);
    if (email && (!EMAIL_PATTERN.test(email) || email.length > MAX.email)) {
        errors.push("Enter a valid email address.");
    }

    const addressLine1 = text(customerRecord.addressLine1);
    if (addressLine1.length > MAX.addressLine) {
        errors.push(`Address line 1 must be ${MAX.addressLine} characters or fewer.`);
    }

    const addressLine2 = text(customerRecord.addressLine2);
    if (addressLine2.length > MAX.addressLine) {
        errors.push(`Address line 2 must be ${MAX.addressLine} characters or fewer.`);
    }

    const city = text(customerRecord.city);
    if (city.length > MAX.city) errors.push(`City must be ${MAX.city} characters or fewer.`);

    const state = text(customerRecord.state);
    if (state.length > MAX.state) errors.push(`State must be ${MAX.state} characters or fewer.`);

    const pincode = text(customerRecord.pincode);
    if (pincode && !PINCODE_PATTERN.test(pincode)) {
        errors.push("PIN code must be exactly 6 digits.");
    }

    if (errors.length) return { ok: false, errors };

    return {
        ok: true,
        value: {
            items,
            customer: {
                name,
                phone,
                ...(email ? { email } : {}),
                ...(addressLine1 ? { addressLine1 } : {}),
                ...(addressLine2 ? { addressLine2 } : {}),
                ...(city ? { city } : {}),
                ...(state ? { state } : {}),
                ...(pincode ? { pincode } : {}),
            },
            ...(couponCode ? { couponCode } : {}),
        },
    };
};

/**
 * Resolves each requested line against the live product table — price, name and
 * image always come from the database, never from the client, since cart data
 * lives in localStorage and is trivially editable before checkout.
 */
export const resolveOrderItems = async (
    items: CheckoutItemInput[],
    errors: string[]
): Promise<{ items: OrderItem[]; amount: number }> => {
    const sql = getSql();
    const slugs = Array.from(new Set(items.map((item) => item.slug)));

    const rows = (await sql`
        SELECT ${sql.unsafe(PRODUCT_COLUMNS)} FROM products WHERE slug = ANY(${slugs})
    `) as ProductRow[];
    const bySlug = new Map(rows.map(toProduct).map((product) => [product.slug, product]));

    const resolved: OrderItem[] = [];

    for (const item of items) {
        const product = bySlug.get(item.slug);
        if (!product) {
            errors.push(`"${item.slug}" is no longer available.`);
            continue;
        }
        if (!product.inStock) {
            errors.push(`"${product.name}" is currently out of stock.`);
            continue;
        }

        let price = product.price;
        if (item.variantLabel) {
            const variant = product.variants.find((candidate) => candidate.label === item.variantLabel);
            if (!variant) {
                errors.push(`"${product.name}" does not have a "${item.variantLabel}" option.`);
                continue;
            }
            price = variant.price;
        }

        resolved.push({
            slug: product.slug,
            name: product.name,
            ...(product.image ? { image: product.image } : {}),
            price,
            ...(item.variantLabel ? { variantLabel: item.variantLabel } : {}),
            quantity: item.quantity,
        });
    }

    const amount = resolved.reduce((total, item) => total + item.price * item.quantity, 0);
    return { items: resolved, amount };
};
