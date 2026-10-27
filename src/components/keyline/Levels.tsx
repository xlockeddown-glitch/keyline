import { useEffect, useRef, useState } from "react";
import { fetchLevel, pickLevelLook, sendFriendGift, startLevelBoost } from "@/game/levelApi";
import { useLevel } from "@/game/levelStore";
import { BOOST_LABEL, CAT_LADDERS, NAME_COLORS, nameColorHex, type LevelReward } from "@/game/levels";
import type { LevelView } from "@/game/levelsServer";
import { popMatch, useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import type { Tier, TriviaCat } from "@/game/types";

const TIER_LABEL: Record<Tier, string> = { white: "White", blue: "Blue", green: "Green", amber: "Amber", red: "Red", violet: "Violet" };
const CAT_LABEL: Record<TriviaCat, string> = {
  celebrity: "Celebrities", music: "Music", books: "Books", geography: "Geography", history: "History", science: "Science", math: "Math", games: "Games", local: "Local cards",
  sports: "Sports", political: "Political", food: "Food", arts: "Arts", nature: "Nature",
};

export function rewardLine(r: LevelReward): string {
  const bits = [`+${r.match.n} ${TIER_LABEL[r.match.tier]} match${r.match.n === 1 ? "" : "es"}`];
  if (r.nameColor) bits.push(`${NAME_COLORS.find((c) => c.id === r.nameColor)?.label} name color`);
  if (r.boost) bits.push("a 15-min double streak boost");
  if (r.gift) bits.push("a match to gift a friend");
  return bits.join(" · ");
}

/** Show a level-up pop per newly paid level (the highest last), then adopt the wallet. */
export function celebrate(view: LevelView) {
  if (!view.paid.length) return;
  const top = view.paid[view.paid.length - 1]!;
  sfx.levelUp(`level:${top.level}`);
  popMatch({
    kind: "level",
    big: `Level ${top.level}!`,
    sub: view.paid.length > 1 ? `${view.paid.length} levels · ${rewardLine(top)}` : rewardLine(top),
    tiers: view.paid.map((r) => r.match.tier).slice(-4),
    coin: 0,
  });
}

/** Asks the server for the level on sign-in and a few seconds after play changes the wallet. */
export function LevelSync() {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const userId = !isPending && user ? user.id : null;
  const points = useGame((s) => s.points);
  const nudge = useLevel((s) => s.nudge);
  const last = useRef(0);
  useEffect(() => {
    if (!userId) {
      useLevel.setState({ view: null, userId: null });
      return;
    }
    const wait = Math.max(3000, 20_000 - (Date.now() - last.current));
    const t = window.setTimeout(async () => {
      last.current = Date.now();
      try {
        const view = await fetchLevel();
        useLevel.setState({ view, userId });
        celebrate(view);
        if (view.paid.length) useGame.getState().adoptWallet({ ...view.wallet, cities: useGame.getState().cities });
        for (const g of view.giftsIn) {
          useGame.setState({ toast: g.item === "boost" ? `${g.from} sent you a 15-min boost!` : `${g.from} sent you a ${TIER_LABEL[g.tier ?? "white"]} match!` });
        }
      } catch {
        /* offline: keep the last view */
      }
    }, last.current ? wait : 400);
    return () => window.clearTimeout(t);
  }, [userId, points, nudge]);
  return null;
}

/** Level badge + thin XP bar for the HUD. */
export function LevelHudBadge() {
  const v = useLevel((s) => s.view);
  if (!v) return null;
  const pct = v.need ? Math.round((v.into / v.need) * 100) : 100;
  return (
    <div className="lvl-hud" data-testid="level-hud" title={`Level ${v.level} · ${v.into}/${v.need} XP`}>
      <span className="lvl-badge">{v.level}</span>
      <span className="lvl-bar" aria-hidden>
        <i style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

/** Small level chip for names (boards). */
export function LevelChip({ level, color }: { level?: number; color?: string | null }) {
  if (!level) return null;
  const hex = nameColorHex(color ?? null);
  return (
    <span className="lvl-chip" style={hex ? { background: hex } : undefined}>
      {level}
    </span>
  );
}

/** Journal → Progress: level, title picker, name colours, boosts and gifts. */
export function LevelPanel() {
  const v = useLevel((s) => s.view);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [friend, setFriend] = useState("");
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [line, setLine] = useState("");
  useEffect(() => {
    if (!open) return;
    void import("@/game/rolls").then(async ({ fetchStandings }) => {
      const b = await fetchStandings({ data: { kind: "distance", city: null } });
      const me = useLevel.getState().userId;
      setFriends(b.distance.filter((r) => r.userId !== me).map((r) => ({ id: r.userId, name: r.name })));
    });
  }, [open]);
  if (!v) return <p className="text-xs text-fg-muted">Sign in to earn levels and titles.</p>;
  const pct = v.need ? Math.round((v.into / v.need) * 100) : 100;
  const refresh = () => useLevel.setState((s) => ({ nudge: s.nudge + 1 }));
  const pick = async (p: { title?: string; color?: string }) => {
    setBusy(true);
    const r = await pickLevelLook({ data: p });
    setBusy(false);
    if (r.ok) {
      const view = { ...v, ...(p.title != null ? { title: p.title, titleName: v.rows.find((x) => x.id === p.title)?.name ?? null } : {}), ...(p.color != null ? { color: p.color } : {}) };
      useLevel.setState({ view });
    }
  };
  const boostLeft = Math.max(0, v.boostUntil - Date.now());
  const groups = [...Object.keys(CAT_LADDERS), "bonus"];
  return (
    <div className="lvl-panel" data-testid="level-panel">
      <div className="flex items-center gap-3">
        <span className="lvl-badge is-big">{v.level}</span>
        <div className="min-w-0 flex-1">
          <p className="hq-row-title">
            Level {v.level}
            {v.titleName ? <span className="lvl-title ml-2">“{v.titleName}”</span> : null}
          </p>
          <span className="lvl-bar is-wide" aria-hidden>
            <i style={{ width: `${pct}%` }} />
          </span>
          <p className="hq-row-sub tabular-nums">{v.need ? `${v.into.toLocaleString()} / ${v.need.toLocaleString()} XP to level ${v.level + 1}` : "Top level"}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="lvl-btn" disabled={busy || v.boosts <= 0 || boostLeft > 0} onClick={async () => {
          setBusy(true);
          const r = await startLevelBoost();
          setBusy(false);
          setLine(r.ok ? "Double streak pay for 15 minutes!" : "Boost not available.");
          refresh();
        }}>
          ⚡ {boostLeft > 0 ? `Boost on · ${Math.ceil(boostLeft / 60_000)} min` : `${BOOST_LABEL} ×${v.boosts}`}
        </button>
        <button type="button" className="lvl-btn" disabled={v.gifts <= 0 && v.boosts <= 0} onClick={() => setOpen((o) => !o)}>
          🎁 Gift a friend ({v.gifts} match{v.gifts === 1 ? "" : "es"})
        </button>
      </div>
      {open ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <select className="lvl-select" value={friend} onChange={(e) => setFriend(e.target.value)} aria-label="Friend">
            <option value="">Pick a player…</option>
            {friends.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          {(["match", "boost"] as const).map((item) => (
            <button key={item} type="button" className="lvl-btn" disabled={!friend || busy || (item === "match" ? v.gifts <= 0 : v.boosts <= 0)} onClick={async () => {
              setBusy(true);
              const nonce = `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
              const r = await sendFriendGift({ data: { to: friend, item, nonce } });
              setBusy(false);
              setLine(r.ok ? `Sent ${item === "match" ? "a match" : "a boost"}!` : "Couldn't send that gift.");
              refresh();
            }}>
              Send {item === "match" ? "match" : "boost"}
            </button>
          ))}
        </div>
      ) : null}
      {line ? <p className="mt-1 text-xs text-fg-muted">{line}</p> : null}

      {v.colors.length ? (
        <div className="mt-3">
          <p className="kicker">Name color</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button type="button" className={`lvl-swatch ${!v.color ? "is-on" : ""}`} onClick={() => pick({ color: "" })}>None</button>
            {v.colors.map((c) => (
              <button key={c} type="button" aria-label={c} className={`lvl-swatch ${v.color === c ? "is-on" : ""}`} style={{ background: nameColorHex(c) ?? undefined }} onClick={() => pick({ color: c })} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-3" data-testid="title-picker">
        <p className="kicker">Titles</p>
        {groups.map((g) => {
          const rows = v.rows.filter((r) => r.group === g);
          return (
            <div key={g} className="lvl-ladder">
              <p className="lvl-ladder-name">
                {g === "bonus" ? "Bonus" : CAT_LABEL[g as TriviaCat]}
                {rows[0]?.draft ? <span className="lvl-draft">draft</span> : null}
              </p>
              <div className="lvl-rungs">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    disabled={!r.earned || busy}
                    className={`lvl-rung ${r.earned ? "is-earned" : ""} ${v.title === r.id ? "is-on" : ""}`}
                    onClick={() => pick({ title: v.title === r.id ? "" : r.id })}
                    title={`${Math.min(r.have, r.need).toLocaleString()} / ${r.need.toLocaleString()}`}
                  >
                    <span className="lvl-rung-name">{r.name}</span>
                    <span className="lvl-rung-bar" aria-hidden>
                      <i style={{ width: `${Math.min(100, Math.round((r.have / r.need) * 100))}%` }} />
                    </span>
                    <span className="lvl-rung-n tabular-nums">{r.earned ? "✓" : `${r.have.toLocaleString()}/${r.need.toLocaleString()}`}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
