import type { Customer } from "../../src/types/customer.js";
import type { Result } from "./http.js";

export interface CustomerRow {
    id: number;
    phone: string;
    password_hash: string;
    name: string;
    email: string | null;
    created_at: string;
    updated_at: string;
}

export const CUSTOMER_COLUMNS = `id, phone, password_hash, name, email, created_at, updated_at`;

export const toCustomer = (row: CustomerRow): Customer => ({
    id: row.id,
    phone: row.phone,
    name: row.name,
    ...(row.email ? { email: row.email } : {}),
});

/** Strips to digits only — used identically at signup and every login lookup,
 *  so "98765 43210" and "+91 98765-43210" collide the way a phone number
 *  actually should, instead of defeating the UNIQUE constraint. */
export const normalizePhone = (raw: string) => raw.replace(/\D/g, "");

const MAX = {
    name: 120,
    email: 200,
    password: 200,
};

const MIN_PASSWORD = 8;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface SignupInput {
    phone: string;
    password: string;
    name: string;
    email?: string;
}

export const parseSignupInput = (body: Record<string, unknown>): Result<SignupInput> => {
    const errors: string[] = [];

    const name = text(body.name);
    if (!name) errors.push("Name is required.");
    else if (name.length > MAX.name) errors.push(`Name must be ${MAX.name} characters or fewer.`);

    const phone = normalizePhone(text(body.phone));
    if (phone.length < 7 || phone.length > 15) errors.push("Enter a valid phone number.");

    // Never trim a password — that silently changes it without the user knowing.
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < MIN_PASSWORD) errors.push(`Password must be at least ${MIN_PASSWORD} characters.`);
    else if (password.length > MAX.password) errors.push(`Password must be ${MAX.password} characters or fewer.`);

    const email = text(body.email);
    if (email && (!EMAIL_PATTERN.test(email) || email.length > MAX.email)) {
        errors.push("Enter a valid email address.");
    }

    if (errors.length) return { ok: false, errors };

    return { ok: true, value: { phone, password, name, ...(email ? { email } : {}) } };
};

export interface LoginInput {
    phone: string;
    password: string;
}

export const parseLoginInput = (body: Record<string, unknown>): Result<LoginInput> => {
    const errors: string[] = [];

    const phone = normalizePhone(text(body.phone));
    if (!phone) errors.push("Phone number is required.");

    const password = typeof body.password === "string" ? body.password : "";
    if (!password) errors.push("Password is required.");

    if (errors.length) return { ok: false, errors };

    return { ok: true, value: { phone, password } };
};
