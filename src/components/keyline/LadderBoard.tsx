/** 0.1.69: Journal · Leaderboard · Ladders: one category at a time, single-line rows in the Progress style. */
/** 0.1.156: All time | This week, and Everyone | city | Friends pills (RollsBoard style); first-to-title chips. */
import { useEffect, useState } from "react";
import { sfx } from "@/game/audio";
import { CAT_LABEL } from "@/game/carPerks";
import { CITIES } from "@/game/data";
import { fetchLadder, fetchMyLadder } from "@/game/ladderApi";
import type { LadderBoard, LadderScope, LadderSpan } from "@/game/ladderBoard";
import { CAT_LADDERS } from "@/game/levels";
import { useGame } from "@/game/store";
import type { TriviaCat } from "@/game/types";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { usePlayerId } from "./PlayerLink";

const CATS = Object.keys(CAT_LADDERS) as TriviaCat[];

/** 0.1.90: percent right in this category; "—" with no tries or an older cached board without the field. */
const pctLabel = (p: number | null | undefined) => (typeof p === "number" && Number.isFinite(p) ? `${p}%` : "—");
const dayLabel = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" });
const SPANS: { id: LadderSpan; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "week", label: "This week" },
];

function Pills<T extends string>({ label, items, on, set, prefix }: { label: string; items: { id: T; label: string }[]; on: T; set: (v: T) => void; prefix: string }) {
  return (
    <div className="rolls-tiers mt-2" role="tablist" aria-label={label}>
      {items.map((k) => (
        <button
          key={k.id}
          type="button"
          role="tab"
          aria-selected={on === k.id}
          className={`rolls-tier ${on === k.id ? "is-on" : ""}`}
          data-testid={`${prefix}-${k.id}`}
          onClick={() => {
            sfx.ui();
            set(k.id);
          }}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}

/** The rung, with a "1st" chip when this player was first to a title in the category. */
const Rung = ({ rung, first }: { rung: string | null; first?: boolean }) =>
  rung ? (
    <span className="jr-sub">
      {rung}
      {first ? <span data-testid="ladder-first"> · 1st</span> : null}
    </span>
  ) : null;

export function LadderBoardSection() {
  const user = useCurrentUser();
  const playerId = usePlayerId();
  const cityId = useGame((s) => s.cityId);
  const [cat, setCat] = useState<TriviaCat>("sports");
  const [span, setSpan] = useState<LadderSpan>("all");
  const [pick, setScope] = useState<LadderScope>("all");
  const [board, setBoard] = useState<LadderBoard | null>(null);
  const [failed, setFailed] = useState(false);
  const uid = user?.id ?? null;
  const scope: LadderScope = pick === "friends" && !uid ? "all" : pick;
  useEffect(() => {
    let live = true;
    setBoard(null);
    setFailed(false);
    const data = { cat, span, scope, ...(scope === "city" ? { city: cityId } : {}) };
    const get = uid ? fetchMyLadder({ data }) : fetchLadder({ data });
    void get
      .then((b) => live && setBoard(b))
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [cat, uid, span, scope, cityId]);
  const me = playerId ?? user?.id ?? null;
  const mine = board?.mine;
  const inTop = Boolean(me && board?.top.some((r) => r.userId === me));
  const scopes: { id: LadderScope; label: string }[] = [
    { id: "all", label: "Everyone" },
    { id: "city", label: CITIES[cityId]?.name ?? "This city" },
    ...(uid ? [{ id: "friends" as const, label: "Friends" }] : []),
  ];
  return (
    <section className="mt-5 border-t border-border pt-4" data-testid="journal-board-ladders">
      <div className="flex items-center justify-between gap-3">
        <p className="kicker">Ladders</p>
        <label className="flex items-center gap-2 text-xs text-fg-muted">
          <span className="sr-only">Category</span>
          <select className="ladder-pick min-h-11 rounded border border-border px-2 text-sm" value={cat} onChange={(e) => setCat(e.target.value as TriviaCat)} data-testid="ladder-cat">
            {CATS.map((c) => (
              <option key={c} value={c}>
                {CAT_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Pills label="Span" prefix="ladder-span" items={SPANS} on={span} set={setSpan} />
      <Pills label="Players" prefix="ladder-scope" items={scopes} on={scope} set={setScope} />
      <p className="mt-2 text-xs text-fg-muted">
        {span === "week" ? `Right answers in ${CAT_LABEL[cat]} this week · resets Mon 12 a.m. CT.` : `Right answers in ${CAT_LABEL[cat]}. Titles at 250, 1,000 and 2,000.`}
      </p>
      {failed ? (
        <p className="mt-2 text-xs text-fg-subtle">Couldn't load the board. Try again in a minute.</p>
      ) : !board ? (
        <p className="mt-2 text-xs text-fg-subtle">Loading…</p>
      ) : board.top.length === 0 ? (
        <p className="mt-2 text-xs text-fg-subtle">{scope === "friends" ? "Send a friend ticket to start a friends ladder." : "No one on the board yet."}</p>
      ) : (
        <ol className="jr-list mt-1">
          {board.top.map((r) => (
            <li key={r.userId} className={`jr-row${r.userId === me ? " is-me" : ""}`}>
              <span className="jr-val tabular-nums w-5">{r.rank}</span>
              <span className="jr-main">
                <span className="jr-title">{r.name}</span>
                <Rung rung={r.rung} first={r.first} />
              </span>
              <span className="jr-val tabular-nums whitespace-nowrap">
                {r.value.toLocaleString("en-US")}
                <span className="ml-1.5 text-xs text-fg-muted" data-testid="ladder-pct">{pctLabel(r.pct)}</span>
              </span>
            </li>
          ))}
          {mine?.rank && !inTop ? (
            <li className="jr-row is-me" data-testid="ladder-own">
              <span className="jr-val tabular-nums w-5">{mine.rank}</span>
              <span className="jr-main">
                <span className="jr-title">You</span>
                <Rung rung={mine.rung} first={mine.first} />
              </span>
              <span className="jr-val tabular-nums whitespace-nowrap">
                {mine.value.toLocaleString("en-US")}
                <span className="ml-1.5 text-xs text-fg-muted" data-testid="ladder-pct">{pctLabel(mine.pct)}</span>
              </span>
            </li>
          ) : null}
        </ol>
      )}
      {mine?.rival ? (
        <p className="mt-2 text-xs text-fg-muted" data-testid="ladder-rival">
          {mine.rival.gap === 0 ? `Tied with ${mine.rival.name}` : `${mine.rival.gap.toLocaleString("en-US")} behind ${mine.rival.name}`}
        </p>
      ) : null}
      {scope === "friends" && board && board.top.length > 0 && board.top.every((r) => r.userId === me) ? (
        <p className="mt-2 text-xs text-fg-subtle">Send a friend ticket to start a friends ladder.</p>
      ) : null}
      {span === "week" && board?.lastWeek ? (
        <p className="mt-2 text-xs text-fg-muted" data-testid="ladder-last-week">
          Last week: {board.lastWeek.name} topped {CAT_LABEL[cat]} with {board.lastWeek.value.toLocaleString("en-US")}.
        </p>
      ) : null}
      {board?.firsts?.map((f) => (
        <p key={f.rung} className="mt-1 text-xs text-fg-muted" data-testid="ladder-firsts">
          First {f.rung}: {f.name} · {dayLabel(f.at)}
        </p>
      ))}
    </section>
  );
}
