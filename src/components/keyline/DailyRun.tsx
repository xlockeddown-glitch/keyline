import { useEffect, useState } from "react";
import { Flame, Trophy, X } from "lucide-react";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUser, useCurrentUserState } from "@/lib/auth/use-current-user";
import { CITIES, TIER_LABEL } from "@/game/data";
import { formatDist } from "@/game/geo";
import { DAILY_REWARD, dailyRewardValue, dailyRoute, formatRunTime, isDailyPaid, legMeters, utcDay, type DailyStanding } from "@/game/dailyRun";
import { fetchDailyBoard, fetchDailyMine, type DailyState } from "@/game/dailyApi";
import { activeProgress, todayRoute, useDaily, type DailyProgress } from "@/game/dailyStore";
import { standingName } from "@/game/standingName";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import type { CityId, Tier } from "@/game/types";
import { ItemIcon, QtyChip } from "./ItemIcon";
import { SignInActions } from "./AuthChip";

function useTick(on: boolean, ms = 100) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setN((n) => n + 1), ms);
    return () => window.clearInterval(id);
  }, [on, ms]);
}

function elapsed(p: DailyProgress | null) {
  if (!p?.startedAt) return null;
  if (p.timeMs != null) return p.timeMs;
  return Date.now() - p.startedAt;
}

const REWARD_LINE = (Object.entries(DAILY_REWARD) as [Tier, number][]).map(([t, n]) => `${n} ${TIER_LABEL[t].toLowerCase()}`).join(" + ");

/** HUD line under the city plate: progress and the running clock. */
export function DailyHudLine() {
  const cityId = useGame((s) => s.cityId);
  const show = useDaily((s) => s.show);
  const prog = useDaily((s) => activeProgress(s.runs, cityId));
  const setPanel = useDaily((s) => s.setPanel);
  const running = Boolean(prog?.startedAt && prog.timeMs == null);
  useTick(running);
  if (!show && !running) return null;
  const route = prog ? dailyRoute(prog.city, prog.day) : todayRoute(cityId);
  const lit = prog?.lit ?? 0;
  const next = route.lamps[lit];
  const t = elapsed(prog);
  return (
    <button type="button" className="daily-hud pointer-events-auto mt-1" onClick={() => setPanel(true)} aria-label="Open Daily Lantern Run">
      <span className="kicker mr-1.5">Lantern Run</span>
      <span className="tabular-nums">{lit}/5</span>
      <span className="tabular-nums text-fg"> · {t == null ? "0:00.0" : formatRunTime(t)}</span>
      {next ? <span className="text-fg-subtle"> · {lit === 0 ? "start at" : "next"} {next.name}</span> : <span className="text-fg-subtle"> · finished</span>}
    </button>
  );
}

/** Top-right kit button. */
export function DailyKitButton() {
  const setPanel = useDaily((s) => s.setPanel);
  const cityId = useGame((s) => s.cityId);
  const prog = useDaily((s) => activeProgress(s.runs, cityId));
  const done = prog?.timeMs != null;
  return (
    <button
      type="button"
      className="hud-plate is-kit pointer-events-auto relative"
      onClick={() => {
        sfx.ui();
        setPanel(true);
      }}
      aria-label="Daily Lantern Run"
    >
      <Flame className="size-4 text-accent" strokeWidth={1.75} />
      <span className="kicker hidden sm:inline">Daily</span>
      {!done ? <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent" aria-hidden /> : null}
    </button>
  );
}

export function DailyBoard({ city, day }: { city: CityId; day?: string }) {
  const user = useCurrentUser();
  const { isPending } = useCurrentUserState();
  const [rows, setRows] = useState<DailyStanding[] | null>(null);
  const [mine, setMine] = useState<DailyState | null>(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener("keyline-daily", bump);
    return () => window.removeEventListener("keyline-daily", bump);
  }, []);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    fetchDailyBoard({ data: { city } })
      .then((b) => {
        if (alive) setRows(b.rows);
      })
      .catch(() => {
        if (alive) {
          setFailed(true);
          setRows([]);
        }
      });
    return () => {
      alive = false;
    };
  }, [city, tick]);

  useEffect(() => {
    if (isPending || !user) {
      setMine(null);
      return;
    }
    let alive = true;
    fetchDailyMine({ data: { city } })
      .then((m) => {
        if (alive) setMine(m);
      })
      .catch(() => {
        if (alive) setMine(null);
      });
    return () => {
      alive = false;
    };
  }, [user, isPending, city, tick]);

  const cityName = CITIES[city]?.name ?? city;
  const onBoard = Boolean(user && rows?.some((r) => r.userId === user.id));
  return (
    <div className="rolls-board">
      <p className="kicker">
        Today&apos;s board · {cityName} · {day ?? utcDay()} UTC
      </p>
      {failed ? (
        <p className="mt-3 text-sm text-fg-muted">The board did not come back. Try again in a moment.</p>
      ) : rows === null ? (
        <ul className="mt-3 grid gap-2" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-md bg-bg-subtle/50" />
          ))}
        </ul>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-sm text-pretty text-fg-muted">No times in {cityName} yet today. Light all five lamps and yours is first.</p>
      ) : (
        <ol className="mt-3 grid gap-2">
          {rows.map((row) => {
            const me = user?.id === row.userId;
            return (
              <li key={row.userId} className={`rolls-row ${me ? "is-me" : ""}`}>
                <span className="rolls-rank tabular-nums">{row.rank}</span>
                <span className="min-w-0 truncate font-medium">
                  {standingName(row.name)}
                  {me ? <span className="kicker ml-2">You</span> : null}
                </span>
                <span className="ml-auto flex items-center gap-1.5 tabular-nums text-fg">
                  {me ? <Trophy className="size-3.5 text-accent" strokeWidth={1.75} /> : null}
                  {formatRunTime(row.timeMs)}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {user && mine && mine.status === "done" && mine.city === city && !onBoard ? (
        <p className="mt-3 text-sm text-fg-muted">
          You · {formatRunTime(mine.timeMs)}
          {mine.rank ? <> · <span className="tabular-nums">#{mine.rank}</span></> : null}
        </p>
      ) : null}
      {user && mine && mine.status === "void" && mine.city === city ? (
        <p className="mt-3 text-sm text-fg-muted">Today&apos;s {cityName} run was voided. Back tomorrow, or run another city today.</p>
      ) : null}
      <div className="mt-4 border-t border-border pt-3">
        <SignInGate
          fallback={
            <div className="grid gap-3">
              <p className="text-sm text-pretty text-fg-muted">Sign in to post your time. Guests can run the route and read the board.</p>
              <SignInActions />
            </div>
          }
        >
          <p className="text-sm text-fg-muted">
            Times post under <span className="text-fg">{standingName(user?.displayName)}</span> · one run per city a day, timed by the server
          </p>
        </SignInGate>
      </div>
    </div>
  );
}

export function DailyRunPanel({ onWalk }: { onWalk: (lat: number, lng: number) => void }) {
  const open = useDaily((s) => s.panel);
  const setPanel = useDaily((s) => s.setPanel);
  const show = useDaily((s) => s.show);
  const setShow = useDaily((s) => s.setShow);
  const cityId = useGame((s) => s.cityId);
  const runs = useDaily((s) => s.runs);
  const prog = activeProgress(runs, cityId);
  const paid = useGame((s) => s.dailyPaid);
  const running = Boolean(prog?.startedAt && prog.timeMs == null);
  useTick(open && running);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setPanel]);

  if (!open) return null;
  const route = prog ? dailyRoute(prog.city, prog.day) : todayRoute(cityId);
  const lit = prog?.lit ?? 0;
  const next = route.lamps[lit];
  const t = elapsed(prog);
  const done = prog?.timeMs != null;
  let total = 0;
  for (let i = 1; i < route.lamps.length; i++) total += legMeters(route, i);

  return (
    <div className="absolute inset-0 z-[760] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6" data-testid="daily-panel">
      <div className="panel flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Daily Lantern Run · {route.day} UTC</p>
            <h2 className="font-display text-xl leading-tight">{CITIES[route.city].name} · five lamps</h2>
            <p className="mt-1 text-sm text-pretty text-fg-muted">
              Same route for every walker today. The clock starts at lamp 1 and stops at lamp 5. On foot only.
            </p>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={() => setPanel(false)} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <ol className="daily-list">
            {route.lamps.map((lamp, i) => (
              <li key={lamp.id} className={`daily-stop${i < lit ? " is-lit" : i === lit ? " is-next" : ""}`}>
                <span className="daily-num tabular-nums">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{lamp.name}</span>
                  <span className="block text-xs text-fg-subtle">
                    {i === 0 ? "Start · the clock begins here" : `${formatDist(legMeters(route, i))} from lamp ${i}`}
                    {prog && i > 0 && prog.splits[i - 1] != null ? ` · ${formatRunTime(prog.splits[i - 1])}` : ""}
                  </span>
                </span>
                {i < lit ? <span className="kicker text-accent">Lit</span> : null}
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-fg-subtle tabular-nums">About {formatDist(total)} lamp to lamp, more by street.</p>

          <div className="daily-status mt-4">
            {done ? (
              <p className="text-sm">
                Finished in <span className="font-display text-lg tabular-nums">{formatRunTime(prog?.serverMs ?? prog?.timeMs)}</span>
                {prog?.rank ? <span className="text-fg-muted"> · #{prog.rank} today</span> : null}
                {prog?.server === "guest" ? <span className="text-fg-muted"> · local time (not posted)</span> : null}
              </p>
            ) : running ? (
              <p className="text-sm">
                Clock <span className="font-display text-lg tabular-nums">{formatRunTime(t)}</span>
                <span className="text-fg-muted"> · {lit}/5 lit{next ? ` · next ${next.name}` : ""}</span>
              </p>
            ) : (
              <p className="text-sm text-fg-muted">Walk to lamp 1 with the route shown. It lights when you reach it.</p>
            )}
            {prog?.note ? <p className="mt-1 text-xs text-fg-muted">{prog.note}</p> : null}
            <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <span className="kicker">Finish pays</span>
              {(Object.entries(DAILY_REWARD) as [Tier, number][]).map(([tier, n]) => (
                <QtyChip key={tier} item={tier} n={n} />
              ))}
              <span>
                {REWARD_LINE} · {dailyRewardValue()} coin value · once per city a day{isDailyPaid(paid, route.day, route.city) ? " · paid here today" : ""}
              </span>
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {!done ? (
              show ? (
                next ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      sfx.ui();
                      setPanel(false);
                      onWalk(next.lat, next.lng);
                    }}
                  >
                    Walk to lamp {lit + 1}
                  </button>
                ) : null
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    sfx.ui();
                    setShow(true);
                    setPanel(false);
                  }}
                >
                  Show route &amp; run it
                </button>
              )
            ) : null}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                sfx.ui();
                setShow(!show);
              }}
            >
              {show ? "Hide route" : "Show route"}
            </button>
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <DailyBoard city={route.city} day={route.day} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DailyFinishCard() {
  const finish = useDaily((s) => s.finish);
  const close = useDaily((s) => s.closeFinish);
  const prog = useDaily((s) => (finish ? s.runs[finish.city] : undefined));
  if (!finish) return null;
  const route = dailyRoute(finish.city, finish.day);
  const official = prog && prog.day === finish.day && prog.city === finish.city ? prog : null;
  return (
    <div className="absolute inset-0 z-[880] flex items-end justify-center bg-bg/60 sm:items-center sm:p-6" data-testid="daily-finish">
      <div className="panel daily-finish flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-xl sm:rounded-xl">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="kicker">Daily Lantern Run · {CITIES[finish.city].name}</p>
            <h2 className="font-display text-2xl leading-tight">All five lamps lit</h2>
          </div>
          <button type="button" className="btn btn-quiet size-11 p-0" onClick={close} aria-label="Close">
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="font-display text-5xl tabular-nums">{formatRunTime(official?.serverMs ?? finish.timeMs)}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {official?.server === "ok" && official.serverMs != null
              ? `Server time${official.rank ? ` · #${official.rank} in ${CITIES[finish.city].name} today` : ""}`
              : official?.server === "guest"
                ? "Local time. Sign in to post tomorrow's run."
                : official?.server === "off"
                  ? official.note ?? "This run stayed local."
                  : "Posting to the board…"}
          </p>
          <ol className="mt-3 grid gap-1 text-sm">
            {finish.splits.map((s, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate text-fg-muted">
                  {i + 2}. {route.lamps[i + 1]?.name}
                </span>
                <span className="tabular-nums">{formatRunTime(s)}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {finish.refused ? (
              <p className="text-sm text-fg-muted">That time was faster than any walker can go. No reward.</p>
            ) : finish.reward ? (
              <>
                <span className="kicker">Reward</span>
                {(Object.entries(finish.reward.added) as [Tier, number][]).map(([t, n]) => (
                  <QtyChip key={t} item={t} n={n} />
                ))}
                {finish.reward.coins ? (
                  <span className="flex items-center gap-1 text-sm tabular-nums">
                    <ItemIcon item="coin" size={18} />+{finish.reward.coins} (pocket full)
                  </span>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-fg-muted">Today&apos;s {CITIES[finish.city].name} reward is already paid.</p>
            )}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <DailyBoard city={finish.city} day={finish.day} />
          </div>
        </div>
      </div>
    </div>
  );
}
