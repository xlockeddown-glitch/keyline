import { useEffect, useState } from "react";
import { authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  browserStorage,
  isDismissed,
  readFirstLogin,
  shouldPromptFirstLogin,
  writeFirstLogin,
} from "@/game/firstLogin";
import { useGame } from "@/game/store";
import type { CityId } from "@/game/types";
import { SignInActions } from "./AuthChip";

export function useEnterGate() {
  const { user, isPending } = useCurrentUserState();
  const pickCity = useGame((s) => s.pickCity);
  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [hold, setHold] = useState<CityId | null>(null);

  useEffect(() => {
    setDismissed(isDismissed(readFirstLogin(browserStorage())));
  }, []);

  useEffect(() => {
    if (!user) return;
    writeFirstLogin({ seen: true }, browserStorage());
    setDismissed(true);
  }, [user]);

  const hydrated = dismissed !== null;
  const waiting = Boolean(authEnabled && hold && (!hydrated || isPending));
  const showPrompt =
    shouldPromptFirstLogin({
      authEnabled,
      isPending,
      hasUser: Boolean(user),
      hydrated,
      dismissed: Boolean(dismissed),
    }) && hold !== null;

  useEffect(() => {
    if (hold == null) return;
    if (!hydrated || isPending) return;
    if (user || dismissed) {
      const id = hold;
      setHold(null);
      pickCity(id);
    }
  }, [hold, hydrated, isPending, user, dismissed, pickCity]);

  function requestEnter(id: CityId) {
    if (!authEnabled) {
      pickCity(id);
      return;
    }
    if (!hydrated || isPending) {
      setHold(id);
      return;
    }
    if (user || dismissed) {
      pickCity(id);
      return;
    }
    setHold(id);
  }

  function continueAsGuest() {
    writeFirstLogin({ guest: true }, browserStorage());
    setDismissed(true);
    const id = hold;
    setHold(null);
    if (id) pickCity(id);
  }

  return { requestEnter, showPrompt, waiting, continueAsGuest };
}

export function FirstLoginOverlay({
  waiting,
  onGuest,
}: {
  waiting: boolean;
  onGuest: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[720] flex items-end justify-center bg-bg/70 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={waiting ? undefined : "first-login-title"}
      aria-busy={waiting || undefined}
    >
      <div className="panel w-full max-w-md rounded-t-xl pb-[env(safe-area-inset-bottom)] sm:rounded-xl">
        <div className="px-5 py-5">
          {waiting ? (
            <div className="space-y-3" aria-hidden>
              <div className="h-3 w-16 animate-pulse rounded-sm bg-bg-subtle" />
              <div className="h-8 w-28 animate-pulse rounded-md bg-bg-subtle" />
              <div className="h-11 animate-pulse rounded-md bg-bg-subtle" />
            </div>
          ) : (
            <>
              <p className="kicker">The desk</p>
              <h2 id="first-login-title" className="font-display text-2xl leading-tight">
                Sign in
              </h2>
              <p className="mt-2 text-sm text-pretty text-fg-muted">
                Post trivia cards under your name. Guests can still walk. Names on the board are first
                name and last initial.
              </p>
              <div className="mt-4">
                <SignInActions />
              </div>
              <button type="button" className="btn btn-quiet mt-3 w-full" onClick={onGuest}>
                Continue as guest
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
