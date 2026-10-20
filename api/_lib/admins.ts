import type { Result } from "./http.js";

export interface AdminRow {
    id: number;
    username: string;
    name: string;
    password_hash: string;
    token_version: number;
    created_at: string;
}

export const ADMIN_COLUMNS = `id, username, name, password_hash, token_version, created_at`;

/** What the browser sees — never the hash or the token version. */
export interface AdminAccount {
    id: number;
    username: string;
    name: string;
    createdAt: string;
}

export const toAdminAccount = (row: AdminRow): AdminAccount => ({
    id: row.id,
    username: row.username,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
});

/** The username the first sign-in must use while the admins table is still empty. */
export const BOOTSTRAP_USERNAME = "admin";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,40}$/;
const NAME_MAX = 80;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 200;

export const normalizeUsername = (value: unknown) => (typeof value === "string" ? value.trim().toLowerCase() : "");

const usernameError = (username: string) =>
    USERNAME_PATTERN.test(username)
        ? null
        : "Username must be 3–40 characters: lowercase letters, numbers, dots, dashes or underscores.";

const nameError = (name: string) => {
    if (!name) return "Name is required.";
    if (name.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
    return null;
};

/** Never trimmed — that would silently change the password. */
export const passwordError = (password: unknown) => {
    if (typeof password !== "string" || password.length < PASSWORD_MIN)
        return `Password must be at least ${PASSWORD_MIN} characters.`;
    if (password.length > PASSWORD_MAX) return `Password must be ${PASSWORD_MAX} characters or fewer.`;
    return null;
};

const collect = (...errors: (string | null)[]) => errors.filter((e): e is string => e !== null);

export interface NewAdminInput {
    username: string;
    name: string;
    password: string;
}

export const parseNewAdmin = (body: Record<string, unknown>): Result<NewAdminInput> => {
    const username = normalizeUsername(body.username);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const errors = collect(usernameError(username), nameError(name), passwordError(body.password));
    return errors.length ? { ok: false, errors } : { ok: true, value: { username, name, password: body.password as string } };
};

export interface AdminProfileInput {
    username: string;
    name: string;
}

export const parseAdminProfile = (body: Record<string, unknown>): Result<AdminProfileInput> => {
    const username = normalizeUsername(body.username);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const errors = collect(usernameError(username), nameError(name));
    return errors.length ? { ok: false, errors } : { ok: true, value: { username, name } };
};
