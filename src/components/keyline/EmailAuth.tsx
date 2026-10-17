import { useEffect, useId, useState, type FormEvent } from "react";
import { getEmailAuthFeatures, type EmailAuthFeatures } from "@/lib/auth/email-features";
import { requestPasswordReset, signInWithEmail, signUpWithEmail } from "@/lib/auth/email-client";

type Mode = "closed" | "sign-in" | "sign-up" | "forgot" | "sent";

/** Sheet-level cache so every sign-in sheet doesn't refetch the same two booleans. */
let featuresOnce: Promise<EmailAuthFeatures> | null = null;
function useEmailFeatures(): EmailAuthFeatures | null {
  const [features, setFeatures] = useState<EmailAuthFeatures | null>(null);
  useEffect(() => {
    let live = true;
    featuresOnce ??= getEmailAuthFeatures().catch(() => {
      featuresOnce = null;
      return { resetEnabled: false, devLog: false };
    });
    void featuresOnce.then((f) => live && setFeatures(f));
    return () => {
      live = false;
    };
  }, []);
  return features;
}

/** 0.0.84: email + password, under the Google / X buttons in every sign-in sheet. */
export function EmailAuth({ initialMode = "closed" }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const features = useEmailFeatures();
  const id = useId();

  if (mode === "closed") {
    return (
      <button type="button" className="btn btn-quiet w-full" onClick={() => setMode("sign-in")} data-testid="email-open">
        Use email and password
      </button>
    );
  }

  const go = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (mode === "sign-up") {
        const r = await signUpWithEmail({ name, email, password });
        if (!r.ok) setError(r.message);
      } else if (mode === "sign-in") {
        const r = await signInWithEmail({ email, password });
        if (!r.ok) setError(r.message);
      } else if (mode === "forgot") {
        const r = await requestPasswordReset(email);
        if (r.ok) setMode("sent");
        else setError(r.message);
      }
    } finally {
      setBusy(false);
    }
  }

  if (mode === "sent") {
    return (
      <div className="acct-card" data-testid="email-sent">
        <p className="text-sm text-pretty">
          If <strong>{email.trim()}</strong> has a Keyline account, a reset link is on its way. It works once, for an
          hour.
        </p>
        {features?.devLog ? <p className="acct-note">Test build: the link is printed in the server log, not emailed.</p> : null}
        <button type="button" className="btn btn-quiet mt-3 w-full" onClick={() => go("sign-in")}>
          Back to sign in
        </button>
      </div>
    );
  }

  const title = mode === "sign-up" ? "Create an account" : mode === "forgot" ? "Reset your password" : "Sign in with email";
  const resetOff = features !== null && !features.resetEnabled;

  return (
    <form className="acct-card" onSubmit={submit} noValidate={false} data-testid={`email-${mode}`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="acct-title">{title}</p>
        <button type="button" className="acct-link" onClick={() => go("closed")}>
          Close
        </button>
      </div>

      {mode === "forgot" && resetOff ? (
        <p className="acct-note" data-testid="reset-off">
          Password reset by email isn't switched on yet. If you joined with Google or X, sign in with that button.
          Otherwise, check back soon.
        </p>
      ) : (
        <>
          {mode === "sign-up" ? (
            <label className="acct-field" htmlFor={`${id}-name`}>
              <span>Name on the board</span>
              <input
                id={`${id}-name`}
                className="acct-input"
                autoComplete="name"
                maxLength={40}
                required
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Ryan Gray"
              />
              <small>Shown as first name and last initial.</small>
            </label>
          ) : null}
          <label className="acct-field" htmlFor={`${id}-email`}>
            <span>Email</span>
            <input
              id={`${id}-email`}
              className="acct-input"
              type="email"
              inputMode="email"
              autoComplete={mode === "sign-up" ? "email" : "username"}
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="you@example.com"
            />
          </label>
          {mode !== "forgot" ? (
            <label className="acct-field" htmlFor={`${id}-password`}>
              <span>Password</span>
              <input
                id={`${id}-password`}
                className="acct-input"
                type="password"
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
              {mode === "sign-up" ? <small>At least 8 characters.</small> : null}
            </label>
          ) : null}

          {error ? (
            <p className="acct-error" role="alert" data-testid="email-error">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn-primary mt-1 w-full" disabled={busy} data-testid="email-submit">
            {busy ? "One moment…" : mode === "sign-up" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </button>
        </>
      )}

      <div className="acct-foot">
        {mode === "sign-in" ? (
          <>
            <button type="button" className="acct-link" onClick={() => go("sign-up")} data-testid="email-to-sign-up">
              New here? Create an account
            </button>
            <button type="button" className="acct-link" onClick={() => go("forgot")} data-testid="email-to-forgot">
              Forgot password?
            </button>
          </>
        ) : (
          <button type="button" className="acct-link" onClick={() => go("sign-in")} data-testid="email-to-sign-in">
            {mode === "sign-up" ? "Have an account? Sign in" : "Back to sign in"}
          </button>
        )}
      </div>
    </form>
  );
}
