/** 0.0.84: Better Auth email/password error codes -> what a walker reads. Dependency-free so tests can load it. */
type BaError = { code?: string; message?: string; status?: number } | null | undefined;

export function emailAuthMessage(error: BaError, mode: "sign-in" | "sign-up" | "reset-request" | "reset"): string {
  const code = error?.code ?? "";
  if (error?.status === 429 || code === "TOO_MANY_REQUESTS") return "Too many tries. Wait a minute and try again.";
  switch (code) {
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "CREDENTIAL_ACCOUNT_NOT_FOUND":
      return "That email and password don't match. If you usually use Google or X, use that button instead.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "That email already has a Keyline account. Sign in instead, or use Google or X if that's how you joined.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters.";
    case "PASSWORD_TOO_LONG":
      return "Use 128 characters or fewer.";
    case "INVALID_EMAIL":
      return "That doesn't look like an email address.";
    case "INVALID_TOKEN":
      return "That reset link has expired or was already used. Ask for a new one.";
    case "RESET_PASSWORD_DISABLED":
      return "Password reset isn't switched on yet.";
    case "SIGN_UP_REFUSED":
      return error?.message ?? "That sign-up couldn't be accepted.";
  }
  if (mode === "reset-request" && /reset password isn't enabled/i.test(error?.message ?? ""))
    return "Password reset isn't switched on yet.";
  return mode === "sign-up" ? "Couldn't create the account. Try again." : "Something went wrong. Try again.";
}

