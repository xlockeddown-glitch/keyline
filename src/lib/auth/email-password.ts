/**
 * Local email/password sign-in (this app's Better Auth DB — not the broker). Server-only; `server.ts` spreads
 * `emailPasswordAuthOptions(...)` into its config and wires `dropUnprovenPassword` into `databaseHooks`.
 *
 * 0.0.84 (Keyline): email + password accounts next to Google / X.
 *   - Sign up with email, password (8–128 chars) and a display name; signed in straight away.
 *   - Forgot password + email confirmation need a mailer (`./mailer.server`): Resend once `RESEND_API_KEY` and
 *     `AUTH_EMAIL_FROM` are set, a console log of the link in dev, and switched off in production until then.
 *   - Rate limits live in Postgres (`rateLimit`, migration 0017, `./rate-limit.server`) so every serverless instance
 *     shares one count; a missing table falls back to per-instance memory instead of breaking sign-in.
 *   - Linking: an existing Google / X walker who signs up with the same email is told to sign in with Google / X
 *     (or reset to add a password). A Google or gate sign-in whose email matches an UNCONFIRMED password account
 *     links into it but removes that password — whoever typed it never proved they own the email. An X sign-in
 *     (unverified / synthetic email) is refused instead of linked, so it cannot take the password account over.
 */
import { APIError, createAuthMiddleware } from "better-auth/api";
import { canonicalAuthLink, resetPasswordEmail, verifyEmail, type Mailer } from "./mailer.server.ts";

export const emailAndPasswordEnabled = true;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 40;

/**
 * OAuth providers whose email is proof they own the mailbox.
 * Google verifies the address. The Grok gate puts an email in a signed token only when the platform has one.
 * X is intentionally absent: the broker email is unverified (often a synthetic placeholder). Trusting it would let
 * that sign-in attach to a password account that happens to share the string.
 */
export const EMAIL_PROVING_PROVIDERS = new Set(["grok-google", "grok-gate"]);

/**
 * Origins allowed to call credential endpoints and to receive auth redirects.
 * A public deployed origin does not also trust loopback: a reset `redirectTo` of
 * `http://127.0.0.1:8080/...` would otherwise 302 the reset token onto the victim's machine.
 * Loopback stays trusted when there is no pinned origin (local dev, live preview) or when the
 * pinned origin is itself loopback.
 */
export function trustedOriginsFor(
  explicitBase: string | undefined,
  previewHosts: readonly string[],
  localOrigins: readonly string[],
): string[] {
  if (explicitBase) {
    let host = "";
    try {
      host = new URL(explicitBase).hostname;
    } catch {
      host = "";
    }
    const loopback = host === "localhost" || host === "127.0.0.1" || host === "::1";
    return loopback ? [explicitBase, ...localOrigins] : [explicitBase];
  }
  return [
    ...previewHosts,
    ...previewHosts.flatMap((host) => [`https://${host}`, `http://${host}`]),
    ...localOrigins,
  ];
}

/** Placeholder identities the app mints for sign-ins without a real email (X via the broker, the Grok gate). */
const RESERVED_EMAIL = /\.invalid$/i;

/** Why a sign-up body is refused before Better Auth sees it, or null when fine. */
export function signUpProblem(body: { email?: unknown; name?: unknown } | null | undefined): string | null {
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!email) return "Enter your email.";
  const domain = email.split("@")[1] ?? "";
  if (RESERVED_EMAIL.test(domain)) return "That email can't be used for an account.";
  if (!name) return "Enter a name for the board.";
  if (name.length > NAME_MAX) return `Keep the name under ${NAME_MAX} characters.`;
  return null;
}

/** Per-IP limits (Better Auth keys by IP + path). `false` = don't count it (session reads would cost a DB write). */
export const AUTH_RATE_LIMIT = {
  window: 60,
  max: 100,
  customRules: {
    "/get-session": false as const,
    "/sign-in/email": { window: 60, max: 5 },
    "/sign-up/email": { window: 600, max: 5 },
    "/request-password-reset": { window: 3600, max: 3 },
    "/reset-password": { window: 600, max: 5 },
    "/send-verification-email": { window: 3600, max: 3 },
  },
};

export function emailPasswordAuthOptions(mailer: Mailer | null) {
  return {
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN,
      maxPasswordLength: PASSWORD_MAX,
      autoSignIn: true,
      // Never block sign-in on a confirmation email while email may not be set up.
      requireEmailVerification: false,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: 3600,
      ...(mailer
        ? {
            sendResetPassword: async (
              { user, url }: { user: { email: string; name: string }; url: string },
              request?: Request,
            ) => {
              await mailer.send(
                resetPasswordEmail(user.email, user.name, canonicalAuthLink(url, process.env, request, mailer.kind === "resend")),
              );
            },
          }
        : {}),
    },
    ...(mailer
      ? {
          emailVerification: {
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            expiresIn: 60 * 60 * 24,
            sendVerificationEmail: async (
              { user, url }: { user: { email: string; name: string }; url: string },
              request?: Request,
            ) => {
              await mailer.send(
                verifyEmail(user.email, user.name, canonicalAuthLink(url, process.env, request, mailer.kind === "resend")),
              );
            },
          },
        }
      : {}),
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== "/sign-up/email") return;
        const problem = signUpProblem(ctx.body as { email?: unknown; name?: unknown });
        if (problem) throw new APIError("BAD_REQUEST", { message: problem, code: "SIGN_UP_REFUSED" });
      }),
    },
  };
}

type AccountRow = { id: string; providerId: string; userId: string };
type GuardAdapter = {
  findUserById(id: string): Promise<{ emailVerified: boolean } | null>;
  findAccounts(userId: string): Promise<AccountRow[]>;
  deleteAccount(id: string): Promise<unknown>;
  deleteUserSessions(userId: string): Promise<unknown>;
};

/**
 * `databaseHooks.account.create.before`, before a Google / X / Grok identity is stored on a user.
 *
 * A password account is proof of nothing until the mailbox is confirmed. A provider that *has* proved the
 * mailbox (Google, the gate) may take the row: the password and its sessions are deleted so a squatter who
 * pre-registered the address is locked out. A provider that has not proved it (X) must not attach at all —
 * linking would hand the squatter, or anyone who can present that unverified string, the real account, and
 * deleting the password would lock the owner out.
 */
export async function dropUnprovenPassword(
  account: { providerId: string; userId: string },
  adapter: GuardAdapter | undefined,
): Promise<{ removed: number }> {
  if (!adapter || account.providerId === "credential" || !account.userId) return { removed: 0 };
  const user = await adapter.findUserById(account.userId);
  if (!user) return { removed: 0 };
  const creds = (await adapter.findAccounts(account.userId)).filter((a) => a.providerId === "credential");
  if (!creds.length) return { removed: 0 };
  if (!EMAIL_PROVING_PROVIDERS.has(account.providerId)) {
    console.log(`[auth] refused unproven link provider=${account.providerId} user=${account.userId}`);
    throw new APIError("UNAUTHORIZED", {
      message: "This sign-in can't be linked to that email account.",
      code: "ACCOUNT_NOT_LINKED",
    });
  }
  if (user.emailVerified) return { removed: 0 };
  for (const c of creds) await adapter.deleteAccount(c.id);
  await adapter.deleteUserSessions(account.userId);
  console.log(`[auth] removed unconfirmed password on link provider=${account.providerId} user=${account.userId}`);
  return { removed: creds.length };
}
