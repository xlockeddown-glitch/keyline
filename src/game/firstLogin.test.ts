import assert from "node:assert/strict";
import { test } from "node:test";
import {
  FIRST_LOGIN_KEY,
  isDismissed,
  readFirstLogin,
  shouldPromptFirstLogin,
  writeFirstLogin,
} from "./firstLogin.ts";

function mem(seed?: string) {
  const bag = new Map<string, string>();
  if (seed) bag.set(FIRST_LOGIN_KEY, seed);
  return {
    getItem: (k: string) => bag.get(k) ?? null,
    setItem: (k: string, v: string) => {
      bag.set(k, v);
    },
  };
}

test("first-time anonymous session should prompt", () => {
  assert.equal(
    shouldPromptFirstLogin({
      authEnabled: true,
      isPending: false,
      hasUser: false,
      hydrated: true,
      dismissed: false,
    }),
    true,
  );
});

test("never prompt while session is pending or storage unread", () => {
  const base = { authEnabled: true, hasUser: false, dismissed: false };
  assert.equal(shouldPromptFirstLogin({ ...base, isPending: true, hydrated: true }), false);
  assert.equal(shouldPromptFirstLogin({ ...base, isPending: false, hydrated: false }), false);
});

test("signed-in and guest dismissal never prompt", () => {
  assert.equal(
    shouldPromptFirstLogin({
      authEnabled: true,
      isPending: false,
      hasUser: true,
      hydrated: true,
      dismissed: false,
    }),
    false,
  );
  assert.equal(
    shouldPromptFirstLogin({
      authEnabled: true,
      isPending: false,
      hasUser: false,
      hydrated: true,
      dismissed: true,
    }),
    false,
  );
});

test("auth-off does not prompt", () => {
  assert.equal(
    shouldPromptFirstLogin({
      authEnabled: false,
      isPending: false,
      hasUser: false,
      hydrated: true,
      dismissed: false,
    }),
    false,
  );
});

test("guest and seen persist and count as dismissed", () => {
  const s = mem();
  assert.equal(readFirstLogin(s), null);
  assert.equal(isDismissed(readFirstLogin(s)), false);
  writeFirstLogin({ guest: true }, s);
  assert.deepEqual(readFirstLogin(s), { guest: true });
  assert.equal(isDismissed(readFirstLogin(s)), true);
  const s2 = mem();
  writeFirstLogin({ seen: true }, s2);
  assert.equal(isDismissed(readFirstLogin(s2)), true);
});

test("writeFirstLogin merges patches so later sign-in does not drop guest", () => {
  const s = mem();
  writeFirstLogin({ guest: true }, s);
  writeFirstLogin({ seen: true }, s);
  assert.deepEqual(readFirstLogin(s), { guest: true, seen: true });
  assert.equal(isDismissed(readFirstLogin(s)), true);
});

test("corrupt storage reads as unread, not dismissed", () => {
  const s = mem("not-json");
  assert.equal(readFirstLogin(s), null);
  assert.equal(isDismissed(readFirstLogin(s)), false);
});
