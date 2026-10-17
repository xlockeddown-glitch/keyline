/**
 * 0.0.84: browser side of email + password accounts. Thin wrappers over Better Auth's email endpoints that
 *   - capture the session bearer in the live preview (partitioned iframe cookies, same as `signIn` in ./client), and
 *   - turn Better Auth's error codes into short Keyline copy (`./email-messages`, unit-tested).
 */
import { authClient, getBearerToken, inLivePreview, setBearerToken } from "./client";
import { emailAuthMessage } from "./email-messages";

export type EmailAuthResult = { ok: true } | { ok: false; message: string };

/** Same as the broker flow: in the preview iframe the session rides a bearer token, not the cookie. */
function adoptBearer(response: Response | undefined) {
  const token = response?.headers.get("set-auth-token");
  if (token && inLivePreview()) setBearerToken(token);
}

async function settle() {
  if (!inLivePreview() || !getBearerToken()) return;
  try {
    await authClient.getSession();
  } catch {
    /* session store recovers on the next useSession fetch */
  }
}

export async function signUpWithEmail(input: { name: string; email: string; password: string }): Promise<EmailAuthResult> {
  if (inLivePreview()) setBearerToken(null);
  const { error } = await authClient.signUp.email(
    { name: input.name.trim(), email: input.email.trim(), password: input.password, callbackURL: "/" },
    { onSuccess: (ctx) => adoptBearer(ctx.response) },
  );
  if (error) return { ok: false, message: emailAuthMessage(error, "sign-up") };
  await settle();
  return { ok: true };
}

export async function signInWithEmail(input: { email: string; password: string }): Promise<EmailAuthResult> {
  if (inLivePreview()) setBearerToken(null);
  const { error } = await authClient.signIn.email(
    { email: input.email.trim(), password: input.password, rememberMe: true },
    { onSuccess: (ctx) => adoptBearer(ctx.response) },
  );
  if (error) return { ok: false, message: emailAuthMessage(error, "sign-in") };
  await settle();
  return { ok: true };
}

/** Always "sent" for a well-formed email (Better Auth never says whether the address exists). */
export async function requestPasswordReset(email: string): Promise<EmailAuthResult> {
  const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
  if (error) return { ok: false, message: emailAuthMessage(error, "reset-request") };
  return { ok: true };
}

export async function resetPassword(token: string, newPassword: string): Promise<EmailAuthResult> {
  const { error } = await authClient.resetPassword({ token, newPassword });
  if (error) return { ok: false, message: emailAuthMessage(error, "reset") };
  return { ok: true };
}
