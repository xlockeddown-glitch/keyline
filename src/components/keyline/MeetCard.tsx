import { useEffect, useState } from "react";
import { MEET_COIN, MEET_KEY_N, MEET_KEY_TIER, meetExpiresIn, meetIncomingLine, meetLamp, meetWhat, type MeetKind } from "@/game/meetDrop";
import { collectMeet, leaveMeet, refreshMeet, useMeet } from "@/game/meetClient";
import { useGame } from "@/game/store";
import { walletLive } from "@/game/walletClient";

/**
 * 0.1.186 Meet you there at a street lamp: plain text and buttons only (no art, nothing on a sprite, no map pin).
 * Shown to a signed-in server-wallet player in reach of a street lamp a drop can sit at. A drop waiting here for
 * this player shows first; otherwise the leave row. Every rule is the server's: this card only asks.
 */
export function MeetCard({ cityId, lampId, inReach }: { cityId: string; lampId: string | null; inReach: boolean }) {
  const status = useMeet((s) => s.status);
  const line = useMeet((s) => s.line);
  const busy = useMeet((s) => s.busy);
  const coins = useGame((s) => s.points);
  const whites = useGame((s) => s.keys[MEET_KEY_TIER] ?? 0);
  const [friend, setFriend] = useState("");
  const lamp = inReach && lampId && walletLive() ? meetLamp(cityId, lampId) : null;
  const at = lamp?.id ?? null;
  useEffect(() => {
    if (!at) return;
    useMeet.setState({ line: null });
    void refreshMeet();
    // Standing at a lamp waiting for a friend's drop: look again (refreshMeet itself allows one fetch per 30 s).
    const id = window.setInterval(() => void refreshMeet(), 15_000);
    return () => window.clearInterval(id);
  }, [at]);
  if (!lamp || !status?.ready) return null;
  const incoming = status.incoming.find((d) => d.city === cityId && d.lamp === lamp.id);
  const mine = status.mine.find((d) => d.city === cityId && d.lamp === lamp.id);
  const to = status.friends.some((f) => f.id === friend) ? friend : (status.friends[0]?.id ?? "");
  const none = status.friends.length === 0;
  const short: Record<MeetKind, string | null> = {
    wave: null,
    key: whites >= MEET_KEY_N ? null : `You need ${MEET_KEY_N} ${MEET_KEY_TIER} key to leave one.`,
    coin: coins >= MEET_COIN ? null : `You need ${MEET_COIN} coin to leave it.`,
  };
  const hint = none ? "Open a friend ticket with someone first" : (short.coin ?? short.key);
  const leave = (kind: MeetKind) => void leaveMeet(cityId, lamp, to, kind);
  const btn = (kind: MeetKind, label: string) => (
    <button type="button" className="btn btn-quiet min-w-0 flex-1 px-2 text-xs" data-testid={`meet-${kind}`} disabled={busy || none || Boolean(short[kind])} title={short[kind] ?? undefined} onClick={() => leave(kind)}>
      {label}
    </button>
  );
  return (
    <div className="hud-plate pointer-events-auto mt-auto mb-2 w-full max-w-[22rem] gap-2 self-center text-xs" data-testid="meet-card">
      {incoming ? (
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0">{meetIncomingLine(incoming.kind, incoming.name)}</p>
          <button type="button" className="btn btn-primary px-3 text-xs" data-testid="meet-collect" disabled={busy} onClick={() => void collectMeet(incoming, lamp)}>
            Collect
          </button>
        </div>
      ) : mine ? (
        <p className="text-fg-muted">
          <span className="kicker">Meet you there</span> You left {mine.name} {meetWhat(mine.kind)} here ({meetExpiresIn(mine.expiresAt, Date.now())}).
        </p>
      ) : (
        <>
          <label className="flex min-w-0 items-center gap-2">
            <span className="kicker shrink-0">Meet you there</span>
            <select className="min-h-11 min-w-0 flex-1 rounded border border-border bg-bg px-2" value={to} onChange={(e) => setFriend(e.target.value)} disabled={none || busy} aria-label="Friend" data-testid="meet-friend">
              {none ? <option value="">No friends yet</option> : null}
              {status.friends.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            {btn("wave", "Wave")}
            {btn("key", `Leave ${meetWhat("key")}`)}
            {btn("coin", `Leave ${meetWhat("coin")}`)}
          </div>
        </>
      )}
      {line || (!incoming && !mine && hint) ? (
        <p className="text-fg-muted" data-testid="meet-line" role="status">
          {line ?? hint}
        </p>
      ) : null}
    </div>
  );
}
