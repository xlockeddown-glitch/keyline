/**
 * 0.0.55 — map the auth broker's userinfo to the Better Auth user for the genericOAuth providers (server.ts).
 *
 * Better Auth finds a returning walker by (providerId, accountId = broker `sub`) first and only then by email, so
 * a stable `sub` always lands on the same user. This mapping keeps the email deterministic too: the broker's X
 * email is synthetic and may be missing, and a missing email aborts sign-in (`email_is_missing`) while a changing
 * one can't be used for linking. When there's no email we use `<providerId>.<sub>@broker.keyline.invalid`, built
 * only from the provider and account id — the same X account always gets the same placeholder, never a random one.
 */
export const PLACEHOLDER_DOMAIN = "broker.keyline.invalid";

type BrokerProfile = {
  sub?: unknown;
  id?: unknown;
  email?: unknown;
  email_verified?: unknown;
  emailVerified?: unknown;
  name?: unknown;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : typeof v === "number" ? String(v) : "");

export function brokerProfileToUser(providerId: string, profile: BrokerProfile) {
  const id = str(profile.sub) || str(profile.id);
  const raw = str(profile.email).toLowerCase();
  const email = raw || (id ? `${providerId}.${id}@${PLACEHOLDER_DOMAIN}`.toLowerCase() : "");
  const verified = raw ? profile.email_verified === true || profile.emailVerified === true : false;
  return { id, email, emailVerified: verified, name: str(profile.name) || "Walker" };
}
