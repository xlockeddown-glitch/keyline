/**
 * 0.1.192: "a device this player already signed in from", with no third party and no new table.
 *
 * The per-account sign-in cap (0.1.191) stops cross-IP password guessing, but it counts tries before the password is
 * checked, so anyone who knows an email could spend the cap and lock the real player out. The fix is a second thing
 * only the real player has: a signed cookie the server set the last time they signed in or up on this device. The
 * cap applies to requests without it. A request with a valid cookie for that account skips the per-account cap (the
 * per-IP cap, the password check and everything else still apply), so an attacker spamming bad passwords can no longer
 * keep the owner out of their own phone, while a stranger guessing from many IPs is still held to the cap.
 *
 * The cookie is `v1.<userId>.<expiresAtMs>.<mac>`, mac = HMAC-SHA256 over the user id and expiry with the app's
 * Better Auth secret. It is bound to one user (another account's cookie unlocks nothing), is HttpOnly, and expires.
 * Server-only (node:crypto).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const DEVICE_COOKIE = "__Host-keyline-device";
export const DEVICE_TTL_MS = 90 * 86_400_000;

const mac = (secret: string, userId: string, exp: number) =>
  createHmac("sha256", secret).update(`keyline-device|v1|${userId}|${exp}`).digest("hex").slice(0, 32);

export function mintDevice(secret: string, userId: string, now: number = Date.now()): string {
  const exp = now + DEVICE_TTL_MS;
  return `v1.${userId}.${exp}.${mac(secret, userId, exp)}`;
}

/** True only for an unexpired cookie, signed by this server, for exactly this user id. */
export function checkDevice(secret: string, token: unknown, userId: string, now: number = Date.now()): boolean {
  if (typeof token !== "string" || !userId || token.length > 300) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1" || parts[1] !== userId) return false;
  const exp = Number(parts[2]);
  if (!Number.isFinite(exp) || exp <= now) return false;
  const want = Buffer.from(mac(secret, userId, exp));
  const got = Buffer.from(parts[3]!);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** The cookie named `name` in a Cookie header, or undefined. */
export function cookieFrom(header: string | null | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return undefined;
}
