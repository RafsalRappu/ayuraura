import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scryptCallback) as (
    password: string,
    salt: Buffer,
    keylen: number,
    options: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

// OWASP's recommended row (~128 MiB working set) — Node's scrypt() default of
// N=16384 is the documented bare-minimum floor, not a real recommendation.
// Raising N requires raising maxmem too (Node needs ~128*N*r*p bytes), or
// every call throws ERR_CRYPTO_INVALID_SCRYPT_PARAMS.
const N = 2 ** 17;
const R = 8;
const P = 1;
const MAXMEM = 256 * 1024 * 1024;
const KEY_LENGTH = 64;
const VERSION = "scrypt1";

const deriveKey = (password: string, salt: Buffer, params: { N: number; r: number; p: number }) =>
    scryptAsync(password, salt, KEY_LENGTH, { ...params, maxmem: MAXMEM });

/** Versioned so cost params can be raised later without invalidating existing rows. */
export const hashPassword = async (password: string): Promise<string> => {
    const salt = randomBytes(16);
    const derived = await deriveKey(password, salt, { N, r: R, p: P });
    return `${VERSION}:${N}:${R}:${P}:${salt.toString("hex")}:${derived.toString("hex")}`;
};

export const verifyPasswordHash = async (password: string, stored: string): Promise<boolean> => {
    const [version, nStr, rStr, pStr, saltHex, hashHex] = stored.split(":");
    if (version !== VERSION || !saltHex || !hashHex) return false;

    const params = { N: Number(nStr), r: Number(rStr), p: Number(pStr) };
    if (!Number.isInteger(params.N) || !Number.isInteger(params.r) || !Number.isInteger(params.p)) return false;

    const salt = Buffer.from(saltHex, "hex");
    const expected = Buffer.from(hashHex, "hex");
    const derived = await deriveKey(password, salt, params);

    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
};

const DUMMY_HASH = `${VERSION}:${N}:${R}:${P}:${"00".repeat(16)}:${"00".repeat(KEY_LENGTH)}`;

/**
 * Verifies against a fixed dummy hash of the same cost, so a login attempt
 * against a nonexistent phone takes the same wall-clock time as one against a
 * real phone — otherwise scrypt's own cost becomes a timing oracle for
 * "is this phone registered," independent of the response text.
 */
export const verifyAgainstDummyHash = (password: string) => verifyPasswordHash(password, DUMMY_HASH);
