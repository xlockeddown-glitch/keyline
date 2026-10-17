// 0.0.84: email + password accounts. Runs the real Better Auth (memory adapter) with the app's email options, link
// guard and linking config; the mailer, messages and rate-limit storage are tested on their own (storage on PGLite).
import { test } from "node:test";
import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { memoryAdapter } from "better-auth/adapters/memory";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { dropUnprovenPassword, emailPasswordAuthOptions, signUpProblem, trustedOriginsFor } from "./email-password.ts";
import { canonicalAuthLink, mailerFromEnv, resetPasswordEmail, RESEND_ENDPOINT, type AuthEmail, type Mailer } from "./mailer.server.ts";
import { emailAuthMessage } from "./email-messages.ts";
import { authRateLimitStorage } from "./rate-limit.server.ts";
import { sessionUserFromHeaders } from "./session-lookup.ts";

const quiet = () => {};

async function setup(mailer: Mailer | null, extra: Record<string, unknown> = {}) {
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
    ...emailPasswordAuthOptions(mailer),
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
