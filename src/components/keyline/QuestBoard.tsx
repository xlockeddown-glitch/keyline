import { useEffect, useState } from "react";
import { fetchQuests } from "@/game/walletApi";
import { QUESTS, questDef, rewardLine, type QuestDef } from "@/game/questBoard";
import { currentPeriod, type PeriodKind } from "@/game/questPeriods";
import type { QuestStatus } from "@/game/questServer";
import { luckyOn, useGame } from "@/game/store";
import { walletLive } from "@/game/walletClient";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { ItemIcon } from "./ItemIcon";

/** "2d 4h" / "5h 12m" until `end`. */
function left(end: number, now: number): string {
  const ms = Math.max(0, end - now);
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
}

const RESET: Record<PeriodKind, string> = { week: "Resets Monday 00:00 Chicago time", month: "Resets on the 1st, 00:00 Chicago time" };

/**
 * 0.1.22 Journal · Progress and the notice board: this week's and this month's quests. The server counts
 * every number here from its own lamp, ride and market records; sparks never count. Guests see the list.
 */
export function QuestBoard() {
  const user = useCurrentUser();
  const points = useGame((s) => s.points);
  const claim = useGame((s) => s.claimQuest);
  const lucky = useGame((s) => luckyOn(s));
  const forever = useGame((s) => s.lucky);
  const [status, setStatus] = useState<QuestStatus | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  // Dev-only screenshot hook (scripts/shot-quests.mjs): a canned server status, no network.
  const qa = import.meta.env.DEV && typeof window !== "undefined" ? (window as { __qaQuests?: QuestStatus }).__qaQuests : undefined;
  const signed = Boolean(qa) || (Boolean(user) && walletLive());
  useEffect(() => {
    if (qa) return setStatus(qa);
    if (!signed) return setStatus(null);
    let live = true;
    void fetchQuests()
      .then((r) => live && setStatus(r))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [qa, signed, points, tick]);
  const now = status?.now ?? Date.now();
  const section = (kind: PeriodKind) => {
    const views = status?.periods.filter((p) => p.kind === kind) ?? [];
    const cur = views.find((v) => !v.grace);
    const end = cur?.end ?? currentPeriod(kind, now).end;
    return (
      <div key={kind} data-testid={`quests-${kind}`}>
        <p className="kicker mt-2">{kind === "week" ? "This week" : "This month"}</p>
        <p className="mt-1 text-xs text-fg-muted">
          {RESET[kind]} · {left(end, now)} left
        </p>
        {views
          .filter((v) => v.grace)
          .map((v) => (
            <p key={v.key} className="mt-1 text-xs text-fg-muted">
              Last {kind}: collect within 24 hours of the reset.
            </p>
          ))}
        <div className="mt-2 grid gap-2">
          {(signed ? views.flatMap((v) => v.rows.map((r) => ({ ...r, period: v.key, grace: v.grace }))) : QUESTS.filter((q) => q.kind === kind).map((q) => ({ id: q.id, have: 0, need: q.need, done: false, paid: false, note: undefined, period: "", grace: false }))).map((r) => {
            const def = questDef(r.id) as QuestDef;
            const key = `${r.period}:${r.id}`;
            return (
              <div key={key} className={`hq-row ${def.bonus ? "is-bonus" : ""}`} data-testid={`quest-${r.id}`}>
                <ItemIcon item={def.reward.matches[0] ?? "coin"} size={36} />
                <div className="hq-row-copy">
                  <p className="hq-row-title">
                    {def.title}
                    {r.grace ? " · last " + kind : ""}
                  </p>
                  <p className="hq-row-sub">{def.sub}</p>
                  <p className="hq-row-sub">
                    {signed ? `${r.have}/${r.need}${r.note ? ` · ${r.note}` : ""} · ` : ""}
                    {rewardLine(def.reward)}
                  </p>
                  {signed ? (
                    <div className="hq-row-actions">
                      <button
                        type="button"
                        className={`btn px-3 text-xs ${r.done && !r.paid ? "btn-primary" : "btn-quiet"}`}
                        disabled={!r.done || r.paid || busy === key}
                        onClick={() => {
                          setBusy(key);
                          void claim(r.period, r.id).finally(() => {
                            setBusy(null);
                            setTick((t) => t + 1);
                          });
                        }}
                      >
                        {r.paid ? "Collected" : r.done ? "Collect" : "In progress"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div data-testid="quest-board">
      <p className="kicker mt-2">Quests</p>
      <p className="mt-1 text-xs text-fg-muted">
        {signed
          ? "Counted by the server from your lamps (a match spent, never a spark), rides and night markets. Collect anywhere."
          : "Sign in to track and collect quests. Progress is counted on the server, so guest play doesn't count."}
      </p>
      {lucky ? (
        <p className="mt-1 text-xs text-fg-muted">
          <ItemIcon item="coin" size={14} /> Lucky is on{forever ? " for good" : " this month"}: about 1 in 7 lamps give back a match of their colour.
        </p>
      ) : null}
      {section("week")}
      {section("month")}
    </div>
  );
}
