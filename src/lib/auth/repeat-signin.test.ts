// 0.0.55: repeat sign-ins map to one user. Runs the real Better Auth account lookup (handleOAuthUserInfo — what the
// broker OAuth callback and the Grok gate both call) against Better Auth's memory adapter with the app's linking config.
import { test } from "node:test";
import assert from "node:assert/strict";
import { betterAuth } from "better-auth";
import { handleOAuthUserInfo } from "better-auth/oauth2";
import { memoryAdapter } from "better-auth/adapters/memory";
import { brokerProfileToUser } from "./broker-profile.ts";

async function setup() {
  const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
  const auth = betterAuth({
    secret: "test-secret-test-secret-test-secret-0123",
    baseURL: "http://localhost:8080",
    database: memoryAdapter(db),
    account: {
      accountLinking: { enabled: true, trustedProviders: ["grok-google", "grok-x", "grok-gate"], requireLocalEmailVerified: false },
    },
    logger: { disabled: true },
  });
  const context = await auth.$context;
  const signIn = async (providerId: string, userInfo: { id: string; email: string; emailVerified: boolean; name: string }) => {
    const r = await handleOAuthUserInfo({ context, headers: new Headers() } as never, {
      userInfo,
      account: { providerId, accountId: userInfo.id } as never,
    });
    assert.equal(r.error, null, String(r.error));
    return r.data!.user.id;
  };
  const users = async () => db.user!.length;
  return { db, signIn, users };
}

/** What the broker hands back for an X sign-in (X has no real email: the broker's is synthetic, or absent). */
const xProfile = (sub: string, email?: string) => brokerProfileToUser("grok-x", { sub, id: sub, email, name: "Ryan Gray", emailVerified: false });

test("two X sign-ins with the same X (broker) id → one user, even if the synthetic email changes or is missing", async () => {
  const { signIn, users } = await setup();
  const a = await signIn("grok-x", xProfile("x-sub-1", "x-sub-1@x.example"));
  const b = await signIn("grok-x", xProfile("x-sub-1", "x-sub-1@x.example"));
  const c = await signIn("grok-x", xProfile("x-sub-1", "changed-every-time-7f3@x.example"));
  const d = await signIn("grok-x", xProfile("x-sub-1"));
  assert.equal(new Set([a, b, c, d]).size, 1);
  assert.equal(await users(), 1);
});

test("an X sign-in without an email gets a deterministic placeholder from the X id (no email_is_missing, no new user)", () => {
  const p1 = xProfile("x-sub-9");
  const p2 = xProfile("x-sub-9");
  assert.equal(p1.email, p2.email);
  assert.match(p1.email, /^grok-x\.x-sub-9@broker\.keyline\.invalid$/);
  assert.equal(p1.emailVerified, false);
  // A real Google email passes straight through.
  assert.equal(brokerProfileToUser("grok-google", { sub: "g1", email: "Ryan@Gmail.Example", email_verified: true, name: "R" }).email, "ryan@gmail.example");
});

test("Grok gate identity without an email: same sub → same user", async () => {
  const { signIn, users } = await setup();
  const info = { id: "grok-user-1", email: "grok-user-1@viewer.grok.invalid", emailVerified: false, name: "Ryan Gray" };
  assert.equal(await signIn("grok-gate", info), await signIn("grok-gate", info));
  assert.equal(await users(), 1);
});

test("a different X id AND a different email is a different identity → new user (the live duplicate shape)", async () => {
  const { signIn, users } = await setup();
  const a = await signIn("grok-x", xProfile("x-sub-1", "one@x.example"));
  const b = await signIn("grok-x", xProfile("x-sub-2", "two@x.example"));
  assert.notEqual(a, b);
  assert.equal(await users(), 2);
});
