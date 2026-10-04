import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { fetchLinkStatus, makePlayerLinkCode, redeemPlayerLinkCode, type LinkStatus } from "@/game/playerLinkApi";

const statusListeners = new Set<(s: LinkStatus | null) => void>();
let lastStatus: { userId: string; status: LinkStatus } | null = null;

function publish(userId: string, status: LinkStatus) {
  lastStatus = { userId, status };
  for (const fn of statusListeners) fn(status);
}

/** 0.0.54b: the walker's standings id — the primary of their linked sign-ins (player_links); their own id otherwise. */
export function usePlayerId(): string | null {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;
  const [status, setStatus] = useState<LinkStatus | null>(lastStatus && lastStatus.userId === userId ? lastStatus.status : null);
  useEffect(() => {
    statusListeners.add(setStatus);
    return () => void statusListeners.delete(setStatus);
  }, []);
  useEffect(() => {
    if (!userId) return;
    let live = true;
    fetchLinkStatus()
      .then((s) => live && publish(userId, s))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [userId]);
  if (!userId) return null;
  return status && lastStatus?.userId === userId ? status.playerId : userId;
}

type View =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "code"; code: string; until: number }
  | { kind: "enter"; text: string; error?: string }
  | { kind: "done"; signIns: number }
  | { kind: "error"; text: string };

const REDEEM_ERROR: Record<string, string> = {
  "bad-code": "That code doesn't match. Check the letters and try again.",
  expired: "That code has run out. Make a new one on your other sign-in.",
  used: "That code was already used. Make a new one on your other sign-in.",
  same: "These sign-ins are already one walker.",
};

/**
 * 0.0.54b, Standings tab: "Same walker, another sign-in?" Signing in a different way (X vs Google, another Google
 * account, the Grok app) makes a new account and a second standings row. Make a code on one sign-in, enter it on
 * the other, and both count as one walker (the oldest account's row).
 */
export function PlayerLinkRow() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const [view, setView] = useState<View>({ kind: "idle" });
  if (isPending || !user) return null;

  const make = async () => {
    setView({ kind: "busy" });
    try {
      const r = await makePlayerLinkCode();
      if ("status" in r) return setView({ kind: "error", text: "Easy there. Try again in a minute." });
      setView({ kind: "code", code: r.code, until: r.expiresAt });
    } catch {
      setView({ kind: "error", text: "The desk is shut. Try again in a moment." });
    }
  };
  const redeem = async (text: string) => {
    setView({ kind: "busy" });
    try {
      const r = await redeemPlayerLinkCode({ data: { code: text } });
      if ("status" in r) return setView({ kind: "enter", text, error: "Easy there. Try again in a minute." });
      if (!r.ok) return setView({ kind: "enter", text, error: REDEEM_ERROR[r.reason] });
      publish(user.id, { playerId: r.primaryId, signIns: r.linked.length });
      setView({ kind: "done", signIns: r.linked.length });
    } catch {
      setView({ kind: "enter", text, error: "The desk is shut. Try again in a moment." });
    }
  };

  return (
    <div className="hq-row min-w-0" data-testid="player-link">
      <Link2 className="size-5 shrink-0 text-accent" strokeWidth={1.75} aria-hidden />
      <div className="hq-row-copy min-w-0">
        <p className="hq-row-title">On the board twice?</p>
        <p className="hq-row-sub">
          Signing in another way (X, another Google account, the Grok app) starts a new row. Make a code here, enter it on
          your other sign-in, and they count as one walker.
        </p>
        {view.kind === "code" ? (
          <p className="mt-2 text-sm" data-testid="player-link-code">
            Your code: <span className="font-mono text-base tracking-widest text-fg">{view.code.slice(0, 4)}-{view.code.slice(4)}</span>
            <span className="text-fg-subtle"> · good for 10 min, once</span>
          </p>
        ) : null}
        {view.kind === "enter" ? (
          <form
            className="mt-2 flex min-w-0 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void redeem(view.text);
            }}
          >
            <label className="sr-only" htmlFor="player-link-input">
              Link code
            </label>
            <input
              id="player-link-input"
              className="ft-link min-w-0 flex-1 font-mono uppercase"
              autoComplete="off"
              autoCapitalize="characters"
              placeholder="ABCD-EFGH"
              maxLength={12}
              value={view.text}
              onChange={(e) => setView({ kind: "enter", text: e.currentTarget.value })}
              data-testid="player-link-input"
            />
            <button type="submit" className="btn btn-primary shrink-0 px-3 text-xs" data-testid="player-link-submit">
              Link
            </button>
          </form>
        ) : null}
        {view.kind === "enter" && view.error ? <p className="mt-1 text-xs text-fg-muted">{view.error}</p> : null}
        {view.kind === "done" ? (
          <p className="mt-2 text-sm text-fg-muted" data-testid="player-link-done">
            Linked. {view.signIns} sign-ins now share one row on the board.
          </p>
        ) : null}
        {view.kind === "error" ? <p className="mt-2 text-xs text-fg-muted">{view.text}</p> : null}
        {view.kind === "idle" || view.kind === "code" || view.kind === "error" || view.kind === "busy" ? (
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className="btn btn-quiet px-3 text-xs" disabled={view.kind === "busy"} onClick={() => void make()} data-testid="player-link-make">
              {view.kind === "code" ? "New code" : "Get a code"}
            </button>
            <button type="button" className="btn btn-quiet px-3 text-xs" disabled={view.kind === "busy"} onClick={() => setView({ kind: "enter", text: "" })} data-testid="player-link-enter">
              Enter a code
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
