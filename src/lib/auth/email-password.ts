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
 *     (or reset to add a password). A Google / X sign-in whose email matches an UNCONFIRMED password account links
 *     into it but removes that password — whoever typed it never proved they own the email (stops a squatter from
 *     pre-registering someone's Gmail and riding the later Google sign-in).
 */
import { APIError, createAuthMiddleware } from "better-auth/api";
import { resetPasswordEmail, verifyEmail, type Mailer } from "./mailer.server.ts";

export const emailAndPasswordEnabled = true;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;
export const NAME_MAX = 40;

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
            sendResetPassword: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
              await mailer.send(resetPasswordEmail(user.email, user.name, url));
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
            sendVerificationEmail: async ({ user, url }: { user: { email: string; name: string }; url: string }) => {
              await mailer.send(verifyEmail(user.email, user.name, url));
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
 * `databaseHooks.account.create.before`: when a Google / X / Grok identity is about to attach to a user whose email
 * was never confirmed but who has a password, delete that password (and its sessions). Returns what it removed.
 */
export async function dropUnprovenPassword(
  account: { providerId: string; userId: string },
  adapter: GuardAdapter | undefined,
): Promise<{ removed: number }> {
  if (!adapter || account.providerId === "credential" || !account.userId) return { removed: 0 };
  const user = await adapter.findUserById(account.userId);
  if (!user || user.emailVerified) return { removed: 0 };
  const creds = (await adapter.findAccounts(account.userId)).filter((a) => a.providerId === "credential");
  if (!creds.length) return { removed: 0 };
  for (const c of creds) await adapter.deleteAccount(c.id);
  await adapter.deleteUserSessions(account.userId);
  console.log(`[auth] removed unconfirmed password on link provider=${account.providerId} user=${account.userId}`);
  return { removed: creds.length };
}
