import { useCallback, useEffect, useRef, useState } from "react";
import { sfx, unlockAudio } from "@/game/audio";
import { ROUTE_REVEAL_MS, gradeRoute, km, type RouteGrade, type RoutePuzzleMap, type RouteTally } from "@/game/routePuzzle";

/**
 * A small map of real places in the city ahead: tap the stops in the order that makes the
 * shortest trip from S to F. Pure rules live in game/routePuzzle.ts; this is the map, the
 * clock and the input. Stops wear letters, start and finish wear S and F in their own shapes,
 * and your route is solid while the shortest is dashed, so colour is never the only cue.
 */
const PAD = 9;
const W = 100;

export function RoutePuzzle({
  city,
  maps,
  roundMs,
  onDone,
  onQuit,
}: {
  city: string;
  maps: RoutePuzzleMap[];
  roundMs: number;
  onDone: (t: RouteTally) => void;
  onQuit: () => void;
}) {
  const [at, setAt] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [shown, setShown] = useState<{ grade: RouteGrade; metres: number } | null>(null);
  const [left, setLeft] = useState(Math.ceil(roundMs / 1000));
  const tally = useRef<RouteTally>({ total: maps.length, done: 0, shortest: 0, close: 0 });
  const done = useRef(false);
  const start = useRef(0);
  const next = useRef<number | undefined>(undefined);
  const finish = useRef(onDone);
  finish.current = onDone;

  const end = useCallback(() => {
    if (done.current) return;
    done.current = true;
    window.clearTimeout(next.current);
    finish.current({ ...tally.current });
  }, []);

  useEffect(() => {
    start.current = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now() - start.current;
      setLeft(Math.max(0, Math.ceil((roundMs - t) / 1000)));
      if (t >= roundMs) end();
    }, 200);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(next.current);
    };
  }, [roundMs, end]);

  const map = maps[at];

  const advance = useCallback(() => {
    window.clearTimeout(next.current);
    if (done.current) return;
    if (at + 1 >= maps.length) {
      end();
      return;
    }
    setShown(null);
    setOrder([]);
    setAt(at + 1);
  }, [at, maps.length, end]);

  const add = useCallback(
    (id: string) => {
      if (done.current || shown || !map) return;
      unlockAudio();
      if (order.includes(id)) {
        // Tapping the last stop again takes it back.
        if (order[order.length - 1] === id) setOrder(order.slice(0, -1));
        return;
      }
      sfx.ui();
      setOrder([...order, id]);
    },
    [map, order, shown],
  );
  const undo = useCallback(() => {
    if (!shown && order.length) setOrder(order.slice(0, -1));
  }, [order, shown]);
  const lock = useCallback(() => {
    if (done.current || shown || !map || order.length < map.stops.length) return;
    const g = gradeRoute(map, order);
    const k = tally.current;
    k.done += 1;
    if (g.grade === "shortest") {
      k.shortest += 1;
      sfx.pickup();
    } else {
      if (g.grade === "close") k.close += 1;
      sfx.wrong();
    }
    setShown({ grade: g.grade, metres: g.metres });
    next.current = window.setTimeout(advance, ROUTE_REVEAL_MS);
  }, [advance, map, order, shown]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (!map || e.repeat) return;
      if (shown) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          advance();
        }
        return;
      }
      const k = e.key.toUpperCase();
      const byLetter = map.stops.find((s) => s.letter === k);
      const n = Number(e.key);
      const byNum = Number.isInteger(n) && n >= 1 ? map.stops[n - 1] : undefined;
      const s = byLetter ?? byNum;
      if (s) {
        e.preventDefault();
        add(s.id);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undo();
      } else if (e.key === "Enter") {
        e.preventDefault();
        lock();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [add, advance, lock, map, shown, undo]);

  if (!map) return null;
  const k = tally.current;
  const H = Math.max(...[map.start, map.finish, ...map.stops].map((p) => p.y)) * (W - 2 * PAD) + 2 * PAD;
  const P = (p: { x: number; y: number }) => ({ x: PAD + p.x * (W - 2 * PAD), y: PAD + p.y * (W - 2 * PAD) });
  const byId = new Map(map.stops.map((s) => [s.id, s]));
  const line = (ids: string[], closed: boolean) =>
    [map.start, ...ids.map((id) => byId.get(id)!), ...(closed ? [map.finish] : [])].map((p) => `${P(p).x},${P(p).y}`).join(" ");
  const full = order.length === map.stops.length;
  const s0 = P(map.start);
  const f0 = P(map.finish);
  const bestNames = map.best.map((id) => byId.get(id)!.letter).join(" → ");

  return (
    <div className="ll-game rp-game">
      <div className="ll-bar">
        <p className="kicker">Route puzzle</p>
        <p className="ll-stats tabular-nums">
          <span>
            Map {Math.min(at + 1, maps.length)} of {maps.length}
          </span>
          <span>{k.shortest} shortest</span>
          <span className="ll-left">{left}s</span>
        </p>
      </div>
      <p className="rp-ask">
        <span className="rp-tag rp-tag-s" aria-hidden>
          S
        </span>
        {map.start.name}
        <span className="rp-to" aria-hidden>
          to
        </span>
        <span className="rp-tag rp-tag-f" aria-hidden>
          F
        </span>
        {map.finish.name}
        <span className="sr-only">. Visit every stop on the shortest route.</span>
      </p>
      <div className={`rp-map${shown ? ` is-${shown.grade}` : ""}`}>
        <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`Map of ${city}: start, finish and ${map.stops.length} stops`}>
          <polyline className={`rp-line${full ? " is-full" : ""}`} points={line(order, full)} />
          {shown && shown.grade !== "shortest" ? <polyline className="rp-best" points={line(map.best, true)} /> : null}
          <rect className="rp-end" x={s0.x - 4.6} y={s0.y - 4.6} width={9.2} height={9.2} rx={1.4} />
          <text className="rp-label" x={s0.x} y={s0.y}>
            S
          </text>
          <polygon className="rp-end" points={`${f0.x},${f0.y - 6} ${f0.x + 6},${f0.y} ${f0.x},${f0.y + 6} ${f0.x - 6},${f0.y}`} />
          <text className="rp-label" x={f0.x} y={f0.y}>
            F
          </text>
          {map.stops.map((s) => {
            const p = P(s);
            const n = order.indexOf(s.id);
            return (
              <g
                key={s.id}
                className={`rp-stop${n >= 0 ? " is-on" : ""}`}
                data-stop={s.letter}
                onClick={() => add(s.id)}
                role="button"
                aria-label={`${s.letter}: ${s.name}${n >= 0 ? `, stop ${n + 1}` : ""}`}
              >
                <circle className="rp-hit" cx={p.x} cy={p.y} r={9} />
                <circle className="rp-dot" cx={p.x} cy={p.y} r={5} />
                <text className="rp-label" x={p.x} y={p.y}>
                  {s.letter}
                </text>
                {n >= 0 ? (
                  <g className="rp-badge">
                    <circle cx={p.x + 5} cy={p.y - 5} r={3.2} />
                    <text x={p.x + 5} y={p.y - 5}>
                      {n + 1}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
        <div className="ll-glass" aria-hidden />
      </div>
      <div className="rp-stops" role="group" aria-label="Stops">
        {map.stops.map((s) => {
          const n = order.indexOf(s.id);
          return (
            <button
              key={s.id}
              type="button"
              className={`rp-chip${n >= 0 ? " is-on" : ""}`}
              disabled={!!shown}
              onClick={() => add(s.id)}
              data-stop={s.letter}
            >
              <span className="wh-key" aria-hidden>
                {s.letter}
              </span>
              <span className="rp-chip-name">{s.name}</span>
              <span className="rp-chip-n tabular-nums" aria-label={n >= 0 ? `stop ${n + 1}` : undefined}>
                {n >= 0 ? n + 1 : ""}
              </span>
            </button>
          );
        })}
      </div>
      <div className="rp-actions">
        {shown ? (
          <>
            <p className="rp-result" aria-live="polite">
              {shown.grade === "shortest"
                ? `Shortest route. ${km(shown.metres)}.`
                : `${shown.grade === "close" ? "Close" : "The long way"}: ${km(shown.metres)}. Shortest was ${km(map.bestM)} via ${bestNames} (dashed).`}
            </p>
            <button type="button" className="btn btn-primary" onClick={advance}>
              {at + 1 >= maps.length ? "Finish" : "Next map"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-quiet" disabled={!order.length} onClick={undo}>
              Undo
            </button>
            <button type="button" className="btn btn-primary rp-lock" disabled={!full} onClick={lock}>
              Lock in route
            </button>
          </>
        )}
      </div>
      <div className="ll-foot">
        <p className="text-xs text-fg-subtle">Tap the stops in order, S to F, shortest trip. Keys A–{map.stops[map.stops.length - 1]!.letter}, Backspace, Enter.</p>
        <button type="button" className="btn btn-quiet ll-quit" onClick={onQuit}>
          Stop
        </button>
      </div>
    </div>
  );
}
