import { useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { EmailAuth } from "./EmailAuth";

export function SignInActions({ callbackURL = "/" }: { callbackURL?: string }) {
  if (!authEnabled) {
    return <p className="text-sm text-fg-muted">Sign-in is dark tonight.</p>;
  }
  return (
    <div className="flex w-full flex-col gap-2">
      {GROK_PROVIDERS.map((p) => (
        <button
          key={p.providerId}
          type="button"
          className="btn btn-ghost w-full"
          onClick={() => signIn(p.providerId, { callbackURL })}
        >
          Continue with {p.label}
        </button>
      ))}
      <div className="acct-or" aria-hidden>
        <span>or</span>
      </div>
      <EmailAuth />
    </div>
  );
}

export function AuthChip() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="h-11 w-28 animate-pulse rounded-md bg-bg-subtle" aria-hidden />;
  }
  if (!user) return null;
  return (
    <div className="keyline-user">
      <UserButton />
    </div>
  );
}

/** 0.1.67: Journal boards: one "Sign in" row; the provider buttons open under it. */
export function SignInCollapsed({ line = "" }: { line?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="grid gap-2" data-testid="signin-collapsed">
      <button type="button" className="jr-tap" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="jr-main">
          <span className="jr-sub">{line}</span>
        </span>
        <span className="jr-go">{open ? "Hide ▴" : "Sign in ›"}</span>
      </button>
      {open ? <SignInActions /> : null}
    </div>
  );
}
