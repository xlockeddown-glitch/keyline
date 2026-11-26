// 0.0.84: email + password accounts. Runs the real Better Auth (memory adapter) with the app's email options, link
// guard and linking config; the mailer, messages and rate-limit storage are tested on their own (storage on PGLite).
import { test } from "node:test";
import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { memoryAdapter } from "better-auth/adapters/memory";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { AUTH_RATE_LIMIT, dropUnprovenPassword, emailPasswordAuthOptions, signUpProblem, trustedOriginsFor } from "./email-password.ts";
import { canonicalAuthLink, mailerFromEnv, resetPasswordEmail, RESEND_ENDPOINT, type AuthEmail, type Mailer } from "./mailer.server.ts";
import { emailAuthMessage } from "./email-messages.ts";
import { authRateLimitStorage } from "./rate-limit.server.ts";
import { sessionUserFromHeaders } from "./session-lookup.ts";
import { DEVICE_COOKIE, DEVICE_TTL_MS, checkDevice, mintDevice } from "./trusted-device.server.ts";

const quiet = () => {};

async function setup(mailer: Mailer | null, extra: Record<string, unknown> = {}, signInLimit?: import("./rate-limit.server.ts").AuthRateLimitStore) {
  const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
  // The hook reads the instance lazily, same as server.ts.
  const holder: { auth?: { $context: Promise<{ internalAdapter: unknown }> } } = {};
  const auth = betterAuth({
    secret: "test-secret-test-secret-test-secret-0123",
    baseURL: "http://localhost:8080",
    database: memoryAdapter(db),
    account: {
      accountLinking: { enabled: true, trustedProviders: ["grok-google", "grok-x", "grok-gate"], requireLocalEmailVerified: false },
    },
    databaseHooks: {
      account: { create: { before: async (account, ctx) => void (await dropUnprovenPassword(account, ctx?.context.internalAdapter ?? ((await holder.auth!.$context).internalAdapter as never))) } },
    },
    ...emailPasswordAuthOptions(mailer, signInLimit ? { signInLimit } : undefined),
    logger: { disabled: true },
    ...extra,
  });
  holder.auth = auth as never;
  const context = await auth.$context;
  const oauth = async (providerId: string, userInfo: { id: string; email: string; emailVerified: boolean; name: string }) => {
    const r = await handleOAuthUserInfo({ context, headers: new Headers() } as never, {
      userInfo,
      account: { providerId, accountId: userInfo.id } as never,
    });
    assert.equal(r.error, null, String(r.error));
    return r.data!.user.id as string;
  };
  return { db, auth, oauth };
}

const errCode = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return (e as { body?: { code?: string } }).body?.code ?? String(e);
  }
  return "no error";
};

function captureMailer() {
  const sent: AuthEmail[] = [];
  const mailer: Mailer = { kind: "dev-log", send: async (m) => void sent.push(m) };
  return { sent, mailer };
}

test("sign up -> signed in as that name; sign in again; wrong password and duplicate email are refused", async () => {
  const { auth, db } = await setup(null);
  const up = await auth.api.signUpEmail({ body: { name: "Mandy Gray", email: "Mandy@Example.com", password: "lantern-walk-1" } });
  assert.equal(up.user.name, "Mandy Gray");
  assert.equal(up.user.email, "mandy@example.com");
  assert.ok(up.token, "auto sign-in returns a session");
  const inn = await auth.api.signInEmail({ body: { email: "mandy@example.com", password: "lantern-walk-1" } });
  assert.equal(inn.user.id, up.user.id);
  assert.equal(await errCode(auth.api.signInEmail({ body: { email: "mandy@example.com", password: "nope-nope-nope" } })), "INVALID_EMAIL_OR_PASSWORD");
  assert.match(await errCode(auth.api.signUpEmail({ body: { name: "X", email: "mandy@example.com", password: "another-pass-2" } })), /USER_ALREADY_EXISTS/);
  assert.equal(await errCode(auth.api.signUpEmail({ body: { name: "Y", email: "short@example.com", password: "short" } })), "PASSWORD_TOO_SHORT");
  assert.equal(db.user!.length, 1);
});

test("an existing Google walker can't be duplicated by an email sign-up with the same email", async () => {
  const { auth, oauth, db } = await setup(null);
  await oauth("grok-google", { id: "g-1", email: "ryan@gmail.example", emailVerified: true, name: "Ryan Gray" });
  assert.match(await errCode(auth.api.signUpEmail({ body: { name: "R", email: "ryan@gmail.example", password: "pass-word-99" } })), /USER_ALREADY_EXISTS/);
  assert.equal(db.user!.length, 1);
});

test("placeholder emails (X / Grok viewer) and bad names are refused at sign-up", async () => {
  const { auth } = await setup(null);
  for (const email of ["grok-x.123@broker.keyline.invalid", "abc@viewer.grok.invalid"]) {
    assert.equal(await errCode(auth.api.signUpEmail({ body: { name: "Squat", email, password: "pass-word-99" } })), "SIGN_UP_REFUSED");
  }
  assert.equal(await errCode(auth.api.signUpEmail({ body: { name: "   ", email: "ok@example.com", password: "pass-word-99" } })), "SIGN_UP_REFUSED");
  assert.equal(signUpProblem({ email: "a@b.co", name: "x".repeat(41) }), "Keep the name under 40 characters.");
  assert.equal(signUpProblem({ email: "a@b.co", name: "Ryan" }), null);
});

test("forgot password: mails a one-time link; the token sets a new password and signs other devices out", async () => {
  const { sent, mailer } = captureMailer();
  const { auth, db } = await setup(mailer);
  await auth.api.signUpEmail({ body: { name: "Ryan Gray", email: "ryan@example.com", password: "old-password-1" } });
  sent.length = 0; // drop the sign-up confirmation mail
  await auth.api.requestPasswordReset({ body: { email: "ryan@example.com", redirectTo: "/reset-password" } });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.subject, "Reset your Keyline password");
  const url = /(http:\/\/localhost:8080\/api\/auth\/reset-password\/[^\s?]+)/.exec(sent[0]!.text)?.[1];
  assert.ok(url, sent[0]!.text);
  const token = url.split("/").pop()!;
  assert.equal(token.length, 24, "reset token is 24 chars from Better Auth's generator");
  assert.ok(db.session!.length >= 1);
  await auth.api.resetPassword({ body: { token, newPassword: "new-password-2" } });
  assert.equal(db.session!.length, 0, "sessions revoked on reset");
  assert.equal(await errCode(auth.api.signInEmail({ body: { email: "ryan@example.com", password: "old-password-1" } })), "INVALID_EMAIL_OR_PASSWORD");
  assert.ok((await auth.api.signInEmail({ body: { email: "ryan@example.com", password: "new-password-2" } })).token);
  assert.equal(await errCode(auth.api.resetPassword({ body: { token, newPassword: "third-password-3" } })), "INVALID_TOKEN");
  sent.length = 0;
  await auth.api.requestPasswordReset({ body: { email: "ryan@example.com", redirectTo: "/reset-password" } });
  const expired = /reset-password\/([^?\s]+)/.exec(sent.at(-1)!.text)![1]!;
  const row = db.verification!.find((v) => String(v.identifier).endsWith(expired));
  assert.ok(row);
  row.expiresAt = new Date(Date.now() - 1000);
  assert.equal(await errCode(auth.api.resetPassword({ body: { token: expired, newPassword: "third-password-3" } })), "INVALID_TOKEN");
  // Unknown email: same answer, nothing sent.
  sent.length = 0;
  await auth.api.requestPasswordReset({ body: { email: "nobody@example.com", redirectTo: "/reset-password" } });
  assert.equal(sent.length, 0);
});

test("a Google walker without a password can add one through reset (same user, same wallet)", async () => {
  const { sent, mailer } = captureMailer();
  const { auth, oauth } = await setup(mailer);
  const id = await oauth("grok-google", { id: "g-7", email: "walker@gmail.example", emailVerified: true, name: "Walker" });
  await auth.api.requestPasswordReset({ body: { email: "walker@gmail.example", redirectTo: "/reset-password" } });
  const token = /reset-password\/([^\s?]+)/.exec(sent.at(-1)!.text)![1]!;
  await auth.api.resetPassword({ body: { token, newPassword: "added-password-1" } });
  assert.equal((await auth.api.signInEmail({ body: { email: "walker@gmail.example", password: "added-password-1" } })).user.id, id);
});

test("with no mailer (production, no key) reset is switched off and no confirmation is sent", async () => {
  const { auth } = await setup(null);
  await auth.api.signUpEmail({ body: { name: "A", email: "a@example.com", password: "pass-word-99" } });
  assert.equal(await errCode(auth.api.requestPasswordReset({ body: { email: "a@example.com", redirectTo: "/reset-password" } })), "RESET_PASSWORD_DISABLED");
});

test("sign-up sends a confirmation mail when a mailer exists", async () => {
  const { sent, mailer } = captureMailer();
  const { auth } = await setup(mailer);
  await auth.api.signUpEmail({ body: { name: "Conf", email: "conf@example.com", password: "pass-word-99" } });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]!.subject, "Confirm your Keyline email");
});

test("squatter guard: Google sign-in onto an UNCONFIRMED password account links but removes that password", async () => {
  const { auth, oauth, db } = await setup(null);
  const squat = await auth.api.signUpEmail({ body: { name: "Squatter", email: "victim@gmail.example", password: "squat-pass-1" } });
  const id = await oauth("grok-google", { id: "g-v", email: "victim@gmail.example", emailVerified: true, name: "Victim" });
  assert.equal(id, squat.user.id, "same user: no duplicate row on the board");
  assert.equal(db.account!.filter((a) => a.providerId === "credential").length, 0);
  assert.equal(await errCode(auth.api.signInEmail({ body: { email: "victim@gmail.example", password: "squat-pass-1" } })), "INVALID_EMAIL_OR_PASSWORD");
});

test("squatter guard: an unverified X sign-in cannot take over a password account", async () => {
  const { auth, db } = await setup(null);
  const context = await auth.$context;
  const me = await auth.api.signUpEmail({ body: { name: "Owner", email: "owner@gmail.example", password: "owner-pass-1" } });
  const attack = async (emailVerified: boolean) =>
    handleOAuthUserInfo({ context, headers: new Headers() } as never, {
      userInfo: { id: "x-attacker", email: "owner@gmail.example", emailVerified, name: "Attacker" },
      account: { providerId: "grok-x", accountId: "x-attacker" } as never,
    });
  const unverified = await attack(false);
  assert.ok(unverified.error, "unverified X must not link");
  assert.equal(unverified.data, null);
  assert.equal(db.account!.filter((a) => a.providerId === "credential").length, 1);
  assert.equal((await auth.api.signInEmail({ body: { email: "owner@gmail.example", password: "owner-pass-1" } })).user.id, me.user.id);
  const verifiedFlag = await attack(true);
  assert.ok(verifiedFlag.error, "X is not treated as mailbox proof even if the profile says verified");
  assert.equal(db.account!.filter((a) => a.providerId === "credential").length, 1);
  assert.equal(db.account!.filter((a) => a.providerId === "grok-x").length, 0);
});

test("an X sign-in still joins a Google account that has no password", async () => {
  const { auth, oauth, db } = await setup(null);
  const id = await oauth("grok-google", { id: "g-only", email: "both@gmail.example", emailVerified: true, name: "Both" });
  const x = await oauth("grok-x", { id: "x-both", email: "both@gmail.example", emailVerified: false, name: "Both" });
  assert.equal(x, id);
  assert.equal(db.user!.length, 1);
});

test("squatter guard leaves a CONFIRMED password alone", async () => {
  const { auth, oauth, db } = await setup(null);
  const me = await auth.api.signUpEmail({ body: { name: "Me", email: "me@gmail.example", password: "my-pass-word-1" } });
  db.user!.find((u) => u.id === me.user.id)!.emailVerified = true;
  await oauth("grok-google", { id: "g-me", email: "me@gmail.example", emailVerified: true, name: "Me" });
  assert.ok((await auth.api.signInEmail({ body: { email: "me@gmail.example", password: "my-pass-word-1" } })).token);
});

test("mailer: Resend when key + from are set (key only in the header), dev log otherwise, none in production", async () => {
  const calls: { url: string; init: { headers: Record<string, string>; body: string } }[] = [];
  const fakeFetch = async (url: string, init: { method: string; headers: Record<string, string>; body: string }) => {
    calls.push({ url, init });
    return { ok: true, status: 200, text: async () => "" };
  };
  const resend = mailerFromEnv({ RESEND_API_KEY: "re_test", AUTH_EMAIL_FROM: "Keyline <hello@mail.example>", NODE_ENV: "production" }, fakeFetch);
  assert.equal(resend?.kind, "resend");
  await resend!.send(resetPasswordEmail("a@example.com", "Ann", "https://keyline.example/r/1"));
  assert.equal(calls[0]!.url, RESEND_ENDPOINT);
  assert.equal(calls[0]!.init.headers.Authorization, "Bearer re_test");
  const body = JSON.parse(calls[0]!.init.body);
  assert.deepEqual(body.to, ["a@example.com"]);
  assert.equal(body.from, "Keyline <hello@mail.example>");
  assert.ok(!calls[0]!.init.body.includes("re_test"));

  const failing = mailerFromEnv({ RESEND_API_KEY: "k", AUTH_EMAIL_FROM: "f@x.example" }, async () => ({ ok: false, status: 403, text: async () => "domain not verified" }));
  await assert.rejects(failing!.send(resetPasswordEmail("a@b.co", "", "u")), /status=403 domain not verified/);

  const lines: string[] = [];
  const dev = mailerFromEnv({ NODE_ENV: "development" }, fakeFetch, (l) => lines.push(l));
  assert.equal(dev?.kind, "dev-log");
  await dev!.send(resetPasswordEmail("a@example.com", "Ann", "http://localhost:8080/api/auth/reset-password/tok"));
  assert.match(lines[0]!, /reset-password\/tok/);
  assert.equal(mailerFromEnv({ NODE_ENV: "production" }), null);
  assert.equal(mailerFromEnv({ NODE_ENV: "production", RESEND_API_KEY: "k" }), null, "a key without a from address is not enough");
  assert.match(resetPasswordEmail("a@b.co", "<b>", "https://x.example/?a=1&b=2").html, /&lt;b&gt;.*a=1&amp;b=2/s);
  assert.doesNotMatch(resetPasswordEmail("a@b.co", "Ann\r\nBcc: x@evil.example", "https://x.example/r").text, /\r|\nBcc/);
  const longName = resetPasswordEmail("a@b.co", `  Ann\tBob ${"Z".repeat(200)}`, "https://x.example/r");
  assert.match(longName.text, /^Hi Ann Bob /);
  assert.ok(!longName.text.includes("Z".repeat(80)), "display names in mail are collapsed and capped");
  assert.throws(() => resetPasswordEmail("a@b.co\r\nBcc: x@evil.example", "Ann", "https://x.example/r"), /malformed address/);
});

test("reset revocation is real only when the session cookie cache is ignored", async () => {
  const { sent, mailer } = captureMailer();
  const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
  const holder: { auth?: { $context: Promise<{ internalAdapter: unknown }> } } = {};
  const auth = betterAuth({
    secret: "test-secret-test-secret-test-secret-0123",
    baseURL: "http://localhost:8080",
    database: memoryAdapter(db),
    session: { cookieCache: { enabled: true, maxAge: 300 } },
    advanced: {
      useSecureCookies: false,
      defaultCookieAttributes: { secure: true, sameSite: "lax" as const, path: "/" },
      cookies: { session_token: { name: "__Host-grok-auth.session_token" }, session_data: { name: "__Host-grok-auth.session_data" } },
    },
    databaseHooks: {
      account: { create: { before: async (account, ctx) => void (await dropUnprovenPassword(account, ctx?.context.internalAdapter ?? ((await holder.auth!.$context).internalAdapter as never))) } },
    },
    ...emailPasswordAuthOptions(mailer),
    logger: { disabled: true },
  });
  holder.auth = auth as never;
  const up = await auth.handler(
    new Request("http://localhost:8080/api/auth/sign-up/email", {
      method: "POST",
      headers: { origin: "http://localhost:8080", "content-type": "application/json" },
      body: JSON.stringify({ name: "C", email: "cache@example.com", password: "old-password-1" }),
    }),
  );
  const cookies = (up.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  assert.match(up.headers.getSetCookie?.().join("\n") ?? "", /__Host-grok-auth\.session_token=.*HttpOnly.*Secure.*SameSite=Lax/s);
  sent.length = 0;
  await auth.api.requestPasswordReset({
    body: { email: "cache@example.com", redirectTo: "/reset-password" },
    headers: new Headers({ origin: "http://localhost:8080" }),
  });
  const token = /reset-password\/([^?\s]+)/.exec(sent.at(-1)!.text)![1]!;
  await auth.api.resetPassword({ body: { token, newPassword: "new-password-2" } });
  assert.equal(db.session!.length, 0);
  const headers = new Headers({ cookie: cookies, origin: "http://localhost:8080" });
  assert.ok((await auth.api.getSession({ headers }))?.user, "cookie cache still answers");
  assert.equal((await auth.api.getSession({ headers, query: { disableCookieCache: true } }))?.user, undefined);
});

test("auth links are pinned to this app and absolute callbacks are folded back", () => {
  const poisoned = "https://evil.grok-sandbox.com/api/auth/reset-password/tok?callbackURL=http%3A%2F%2F127.0.0.1%3A8080%2Fsteal";
  const pinned = canonicalAuthLink(poisoned, { BETTER_AUTH_URL: "https://keyline.example" });
  const u = new URL(pinned);
  assert.equal(u.origin, "https://keyline.example");
  assert.equal(u.searchParams.get("callbackURL"), "/reset-password");
  assert.match(u.pathname, /\/tok$/);
  const hostOf = (host: string) => ({ headers: { get: (name: string) => (name === "host" ? host : null) } });
  const same = canonicalAuthLink(
    "https://preview.grok-sandbox.com/api/auth/reset-password/tok?callbackURL=%2Freset-password",
    {},
    hostOf("preview.grok-sandbox.com"),
    true,
  );
  assert.equal(new URL(same).host, "preview.grok-sandbox.com");
  assert.throws(
    () => canonicalAuthLink(poisoned, {}, hostOf("preview.grok-sandbox.com"), true),
    /not this app/,
  );
  assert.equal(
    new URL(canonicalAuthLink("http://localhost:8080/api/auth/verify-email?token=t&callbackURL=https%3A%2F%2Fevil.example", {})).searchParams.get("callbackURL"),
    "/",
  );
});

test("a public origin does not trust loopback for auth redirects", () => {
  assert.deepEqual(trustedOriginsFor("https://keyline.example", ["*.grok-sandbox.com"], ["http://localhost:8080"]), ["https://keyline.example"]);
  assert.ok(trustedOriginsFor("http://localhost:8080", [], ["http://localhost:8080", "http://127.0.0.1:8080"]).includes("http://127.0.0.1:8080"));
  assert.ok(trustedOriginsFor(undefined, ["*.grok-sandbox.com"], ["http://localhost:8080"]).includes("*.grok-sandbox.com"));
});

test("error copy", () => {
  assert.match(emailAuthMessage({ code: "INVALID_EMAIL_OR_PASSWORD" }, "sign-in"), /don't match/);
  assert.match(emailAuthMessage({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" }, "sign-up"), /already has a Keyline account/);
  assert.match(emailAuthMessage({ status: 429 }, "sign-in"), /Too many tries/);
  assert.match(emailAuthMessage({ code: "RESET_PASSWORD_DISABLED" }, "reset-request"), /isn't switched on/);
  assert.equal(emailAuthMessage({ code: "SIGN_UP_REFUSED", message: "Enter your email." }, "sign-up"), "Enter your email.");
  assert.match(emailAuthMessage({ code: "WHATEVER" }, "sign-up"), /Couldn't create/);
});

test("rate limit storage on Postgres (PGLite): counts per key, blocks past max, reopens after the window", async () => {
  const pg = await PGlite.create();
  await pg.exec(readFileSync(new URL("../../../migrations/0017_auth_rate_limit.sql", import.meta.url), "utf8"));
  let t = 1_000_000;
  const store = authRateLimitStorage(async () => async (text, params) => (await pg.query(text, params)).rows as Record<string, unknown>[], () => t);
  const rule = { window: 60, max: 3 };
  for (let i = 0; i < 3; i++) assert.deepEqual(await store.consume("1.2.3.4|/sign-in/email", rule), { allowed: true, retryAfter: null });
  const blocked = await store.consume("1.2.3.4|/sign-in/email", rule);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfter, 60);
  assert.equal((await store.consume("5.6.7.8|/sign-in/email", rule)).allowed, true, "other IPs unaffected");
  t += 61_000;
  assert.equal((await store.consume("1.2.3.4|/sign-in/email", rule)).allowed, true, "window elapsed");
  await pg.close();
});

test("rate limit storage falls back to memory (and never throws) when the table is missing", async () => {
  const warn = console.warn;
  console.warn = quiet;
  try {
    const store = authRateLimitStorage(async () => async () => {
      throw new Error('relation "rateLimit" does not exist');
    });
    const rule = { window: 60, max: 2 };
    assert.equal((await store.consume("k", rule)).allowed, true);
    assert.equal((await store.consume("k", rule)).allowed, true);
    assert.equal((await store.consume("k", rule)).allowed, false);
  } finally {
    console.warn = warn;
  }
});

test("after a password reset the old session cookie no longer resolves a walker (wallet / profile lookup)", async () => {
  const { sent, mailer } = captureMailer();
  // Same session config as server.ts: the signed session-data cookie is cached for five minutes.
  const { auth } = await setup(mailer, { session: { cookieCache: { enabled: true, maxAge: 300 } } });
  const up = await auth.api.signUpEmail({ body: { name: "Ryan Gray", email: "ryan@example.com", password: "old-password-1" }, returnHeaders: true });
  const cookie = up.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  assert.match(cookie, /session_data=/, "cookie cache is on, so the signed session-data cookie is set");
  const headers = new Headers({ cookie });
  assert.equal((await sessionUserFromHeaders(auth.api as never, headers))?.email, "ryan@example.com");
  sent.length = 0;
  await auth.api.requestPasswordReset({ body: { email: "ryan@example.com", redirectTo: "/reset-password" } });
  const token = /reset-password\/([^\s?]+)/.exec(sent[0]!.text)![1]!;
  await auth.api.resetPassword({ body: { token, newPassword: "new-password-2" } });
  assert.equal(await sessionUserFromHeaders(auth.api as never, headers), null, "old cookie must not reach wallet or profile");
});

test("0.1.191: five failed sign-ins on one email block a sixth from a new IP / session", async () => {
  const pg = await PGlite.create();
  await pg.exec(readFileSync(new URL("../../../migrations/0017_auth_rate_limit.sql", import.meta.url), "utf8"));
  const store = authRateLimitStorage(async () => async (text, params) => (await pg.query(text, params)).rows as Record<string, unknown>[]);
  const { auth } = await setup(null, {
    rateLimit: { enabled: true, ...AUTH_RATE_LIMIT, customStorage: store },
  }, store);
  await auth.api.signUpEmail({ body: { name: "Ryan Gray", email: "ryan@example.com", password: "lantern-walk-1" } });
  const tryFrom = (ip: string, email = "ryan@example.com") =>
    auth.api.signInEmail({
      body: { email, password: "wrong-password-1" },
      headers: new Headers({ "x-forwarded-for": ip }),
    });
  for (let i = 0; i < 5; i++) {
    assert.equal(await errCode(tryFrom("1.2.3.4")), "INVALID_EMAIL_OR_PASSWORD", `try ${i + 1} from the first IP`);
  }
  // On main the cap is only IP + path, so a sixth try from a new IP is allowed. After the fix it stays locked.
  assert.equal(await errCode(tryFrom("5.6.7.8")), "TOO_MANY_REQUESTS", "a new session / IP does not reset the account cap");
  assert.equal(
    await errCode(tryFrom("5.6.7.8", "other@example.com")),
    "INVALID_EMAIL_OR_PASSWORD",
    "a different email from the new IP is not locked",
  );
  await pg.close();
});

test("0.1.191: the changelog line", () => {
  // 0.1.192: the live version moved on; the current-version pins live in the newest slice's test (below).
  const root = new URL("../../../", import.meta.url);
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /\n\/\/ 0\.1\.191: Sign-in lockout is per account, not per session — [^\n]*\(k1191a\)\.\n/);
});

// ---- 0.1.192: the account cap no longer locks out the real player on a device they already signed in from ----

const ORIGIN = "http://localhost:8080";
const SECRET = "test-secret-test-secret-test-secret-0123";

/** A real HTTP request through the router (same path as /api/auth/*), so both rate limits and the hooks run. */
async function http(auth: { handler: (r: Request) => Promise<Response> }, path: string, body: unknown, ip: string, cookie?: string) {
  const headers: Record<string, string> = { "content-type": "application/json", origin: ORIGIN, "x-forwarded-for": ip };
  if (cookie) headers.cookie = cookie;
  const res = await auth.handler(new Request(`${ORIGIN}/api/auth/${path}`, { method: "POST", headers, body: JSON.stringify(body) }));
  const json = (await res.json().catch(() => ({}))) as { code?: string; message?: string };
  return { status: res.status, code: json.code, message: json.message, res };
}
const signIn = (auth: Parameters<typeof http>[0], email: string, password: string, ip: string, cookie?: string) =>
  http(auth, "sign-in/email", { email, password }, ip, cookie);
const cookieOf = (res: Response, name: string) => {
  const c = res.headers.getSetCookie().find((x) => x.startsWith(`${name}=`));
  return c ? c.split(";")[0]! : undefined;
};

async function limited(opts: { clock?: { t: number } } = {}) {
  const pg = await PGlite.create();
  await pg.exec(readFileSync(new URL("../../../migrations/0017_auth_rate_limit.sql", import.meta.url), "utf8"));
  const now = opts.clock ? () => opts.clock!.t : undefined;
  const store = authRateLimitStorage(async () => async (text, params) => (await pg.query(text, params)).rows as Record<string, unknown>[], now);
  const made = await setup(null, { rateLimit: { enabled: true, ...AUTH_RATE_LIMIT, customStorage: store } }, store);
  return { ...made, pg, store };
}

test("0.1.192 routes: the per-IP cap and the per-account cap both answer 429 over HTTP", async () => {
  const { auth, pg } = await limited();
  // Per IP: five tries, a sixth from the same IP is refused by Better Auth's own limiter (a different email each time).
  for (let i = 0; i < 5; i++) assert.equal((await signIn(auth, `ip${i}@example.com`, "wrong-password-1", "9.9.9.9")).status, 401);
  const byIp = await signIn(auth, "ip5@example.com", "wrong-password-1", "9.9.9.9");
  assert.equal(byIp.status, 429);
  assert.equal(byIp.res.headers.get("x-retry-after") !== null, true, "the IP limiter says when to retry");
  // Per account: six different IPs, one email. The sixth is refused by our hook.
  for (let i = 0; i < 5; i++) assert.equal((await signIn(auth, "victim@example.com", "wrong-password-1", `10.0.0.${i + 1}`)).status, 401);
  const byAccount = await signIn(auth, "victim@example.com", "wrong-password-1", "10.0.0.99");
  assert.equal(byAccount.status, 429);
  assert.equal(byAccount.code, "TOO_MANY_REQUESTS");
  assert.equal((await signIn(auth, "bystander@example.com", "wrong-password-1", "10.0.0.99")).status, 401, "another email from that IP is not locked");
  await pg.close();
});

test("0.1.192 expiry: the per-account lock ends when its window does", async () => {
  const clock = { t: Date.now() };
  const { auth, pg } = await limited({ clock });
  for (let i = 0; i < 5; i++) await signIn(auth, "ryan@example.com", "wrong-password-1", `10.1.0.${i + 1}`);
  assert.equal((await signIn(auth, "ryan@example.com", "wrong-password-1", "10.1.0.50")).status, 429);
  clock.t += 61_000;
  assert.equal((await signIn(auth, "ryan@example.com", "wrong-password-1", "10.1.0.51")).status, 401, "window elapsed: counted again, not locked");
  await pg.close();
});

test("0.1.192 a device the player already signed in from is not locked out by someone else's bad passwords", async () => {
  const { auth, pg } = await limited();
  const up = await http(auth, "sign-up/email", { name: "Ryan Gray", email: "ryan@example.com", password: "lantern-walk-1" }, "1.1.1.1");
  assert.equal(up.status, 200);
  const device = cookieOf(up.res, DEVICE_COOKIE);
  assert.ok(device, "sign-up leaves a trusted-device cookie");
  // Someone who knows only the email spams wrong passwords from many IPs until the account is locked for strangers.
  for (let i = 0; i < 5; i++) assert.equal((await signIn(auth, "ryan@example.com", "guess-guess-1", `10.2.0.${i + 1}`)).status, 401);
  assert.equal((await signIn(auth, "ryan@example.com", "guess-guess-1", "10.2.0.60")).status, 429, "a stranger is locked");
  assert.equal((await signIn(auth, "ryan@example.com", "lantern-walk-1", "10.2.0.61")).status, 429, "even a right password from a new device waits, so cross-IP guessing stays capped");
  // The real player on the known device still gets in, from a new IP, with the account locked.
  const ok = await signIn(auth, "ryan@example.com", "lantern-walk-1", "7.7.7.7", device);
  assert.equal(ok.status, 200, "known device signs in");
  assert.ok(cookieOf(ok.res, DEVICE_COOKIE), "and the cookie is refreshed");
  // A known device does not skip the password: a wrong one is just wrong, and the stranger-lock is not what answered.
  const wrong = await signIn(auth, "ryan@example.com", "guess-guess-1", "7.7.7.8", device);
  assert.equal(wrong.status, 401);
  assert.equal(wrong.code, "INVALID_EMAIL_OR_PASSWORD");
  await pg.close();
});

test("0.1.192 trusted-device cookie: bound to the user, signed, and it expires", () => {
  const t0 = 1_800_000_000_000;
  const good = mintDevice(SECRET, "user-1", t0);
  assert.equal(checkDevice(SECRET, good, "user-1", t0 + 1000), true);
  assert.equal(checkDevice(SECRET, good, "user-2", t0 + 1000), false, "another account's cookie does not unlock this one");
  assert.equal(checkDevice("other-secret-other-secret-other-0000", good, "user-1", t0 + 1000), false, "signed with the server secret");
  assert.equal(checkDevice(SECRET, good.slice(0, -1) + (good.endsWith("0") ? "1" : "0"), "user-1", t0 + 1000), false, "tampered mac");
  assert.equal(checkDevice(SECRET, good, "user-1", t0 + DEVICE_TTL_MS + 1), false, "expired");
  for (const junk of ["", "x", "v1.a.b.c", undefined, null]) assert.equal(checkDevice(SECRET, junk as never, "user-1", t0), false);
});

test("0.1.192 cleanup: stale rate-limit rows (including keys for emails that never existed) are pruned, and keys hold no email", async () => {
  const pg = await PGlite.create();
  await pg.exec(readFileSync(new URL("../../../migrations/0017_auth_rate_limit.sql", import.meta.url), "utf8"));
  const clock = { t: 5_000_000_000 };
  const store = authRateLimitStorage(async () => async (text, params) => (await pg.query(text, params)).rows as Record<string, unknown>[], () => clock.t);
  const { accountSignInKey } = await import("./email-password.ts");
  const key = accountSignInKey("nobody-here@example.com")!;
  assert.ok(!key.includes("nobody-here") && !key.includes("@"), "the email is hashed, never stored");
  assert.equal(accountSignInKey("x".repeat(5000) + "@example.com")!.length, key.length, "any email gives a bounded key");
  assert.equal(accountSignInKey("  NoBody-Here@Example.com ")!, key, "case and spaces fold");
  await store.consume(key, { window: 60, max: 5 });
  await store.consume("1.2.3.4|/sign-in/email", { window: 60, max: 5 });
  const count = async () => Number(((await pg.query(`select count(*)::int as n from "rateLimit"`)).rows[0] as { n: number }).n);
  assert.equal(await count(), 2);
  clock.t += 3 * 3600_000; // far past every window (the longest is one hour)
  await store.consume("fresh|/sign-in/email", { window: 60, max: 5 });
  assert.equal(await count(), 1, "only the fresh row is left");
  await pg.close();
});

test("0.1.192: the changelog line", () => {
  // 0.1.193: the live version moved on; the current-version pins live in the newest slice's test (below).
  const root = new URL("../../../", import.meta.url);
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /\n\/\/ 0\.1\.192: Sign-in lockout step-up — [^\n]*\(k1192a\)\.\n/);
});

test("0.1.193: version 0.1.193 / k1193a everywhere", () => {
  const root = new URL("../../../", import.meta.url);
  const v = readFileSync(new URL("src/version.ts", root), "utf8");
  assert.match(v, /APP_VERSION = "0\.1\.193"/);
  assert.match(v, /PUBLISH_STAMP = "k1193a"/);
  assert.match(v, /\n\/\/ 0\.1\.193: Performance pass — [^\n]*\(k1193a\)\.\n$/);
  const pkg = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as { version: string };
  assert.equal(pkg.version, "0.1.193");
  const lock = JSON.parse(readFileSync(new URL("package-lock.json", root), "utf8")) as { version: string; packages: Record<string, { version?: string }> };
  assert.equal(lock.version, "0.1.193");
  assert.equal(lock.packages[""]!.version, "0.1.193");
});
