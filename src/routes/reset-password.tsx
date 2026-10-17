import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { resetPassword } from "@/lib/auth/email-client";

/** 0.0.84: landing page for the emailed reset link (Better Auth redirects here with `?token=` or `?error=`). */
export const Route = createFileRoute("/reset-password")({
  // The reset token arrives in the query string. Don't hand it to fonts or the branding script via Referer.
  head: () => ({ meta: [{ name: "referrer", content: "no-referrer" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token, error: linkError } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const usable = Boolean(token) && !linkError;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!token || busy) return;
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError(null);
    const r = await resetPassword(token, password);
    setBusy(false);
    if (r.ok) setDone(true);
    else setError(r.message);
  }

  return (
    <div className="title-night">
      <div className="title-pave" aria-hidden />
      <main className="title-folio">
        <div className="street-blade" aria-label="Keyline">
          <span>Account</span>
          <strong>KEYLINE</strong>
        </div>
        {done ? (
          <div className="acct-card" data-testid="reset-done">
            <p className="acct-title">Password changed</p>
            <p className="acct-note">Sign in with your email and new password. Other devices were signed out.</p>
            <Link to="/login" className="btn btn-primary w-full">
              Sign in
            </Link>
          </div>
        ) : usable ? (
          <form className="acct-card w-full" onSubmit={submit} data-testid="reset-form">
            <p className="acct-title">Choose a new password</p>
            <label className="acct-field" htmlFor="reset-new">
              <span>New password</span>
              <input id="reset-new" className="acct-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
              <small>At least 8 characters.</small>
            </label>
            <label className="acct-field" htmlFor="reset-confirm">
              <span>Type it again</span>
              <input id="reset-confirm" className="acct-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirm} onChange={(e) => setConfirm(e.currentTarget.value)} />
            </label>
            {error ? <p className="acct-error" role="alert">{error}</p> : null}
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? "One moment…" : "Save password"}
            </button>
          </form>
        ) : (
          <div className="acct-card" data-testid="reset-bad-link">
            <p className="acct-title">This link has expired</p>
            <p className="acct-note">Reset links work once, for an hour. Ask for a new one from the sign-in sheet.</p>
            <Link to="/login" className="btn btn-quiet w-full">
              Back to sign in
            </Link>
          </div>
        )}
        <Link to="/" className="title-more">
          Back to the street
        </Link>
      </main>
    </div>
  );
}
