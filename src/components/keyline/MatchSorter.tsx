import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sfx, unlockAudio } from "@/game/audio";
import {
  SORT_LANES,
  SORT_RANK,
  SORT_TIERS,
  SORT_WAVES,
  fallProgress,
  inAir,
  sorterSchedule,
  type SortMatch,
  type SortTally,
} from "@/game/matchSorter";
import { TIER_LABEL } from "@/game/data";
import type { Tier } from "@/game/types";

/** Rank ticks, 1 white … 6 violet: the colour-free cue, same count as the vault pips. */
function Pips({ tier }: { tier: Tier }) {
  return (
    <span className="ms-pips" aria-hidden>
      {Array.from({ length: SORT_RANK[tier] }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

function Glyph({ tier }: { tier: Tier }) {
  return (
    <span className={`match-glyph tier-${tier} ms-glyph`} aria-hidden>
      <i className="match-head" />
      <i className="match-stick" />
    </span>
  );
}

/**
 * Matches tumble down the carriage window in waves. Tap a tier box to sort the lowest match,
 * or pick a match first (tap or drag it onto a box). Keys 1–6 sort too.
 * Pure rules live in game/matchSorter.ts; this is the window, the clock and the input.
 */
export function MatchSorter({
  roundMs,
  seed,
  onDone,
  onQuit,
}: {
  roundMs: number;
  seed: number;
  onDone: (t: SortTally) => void;
  onQuit: () => void;
}) {
  const matches = useMemo(() => sorterSchedule(seed), [seed]);
  const start = useRef(0);
  const gone = useRef(new Set<number>());
  const tally = useRef({ right: 0, wrong: 0, missed: 0, streak: 0, best: 0 });
  const done = useRef(false);
  const [now, setNow] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [flash, setFlash] = useState<{ tier: Tier; ok: boolean; was?: Tier } | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  const finish = useRef(onDone);
  finish.current = onDone;
  const pickedRef = useRef<number | null>(null);
  pickedRef.current = picked;

  useEffect(() => {
    start.current = performance.now();
    let raf = 0;
    const frame = () => {
      const t = performance.now() - start.current;
      for (const m of matches) {
        if (!gone.current.has(m.id) && fallProgress(m, t) >= 1) {
          gone.current.add(m.id);
          tally.current.missed += 1;
          tally.current.streak = 0;
          if (pickedRef.current === m.id) setPicked(null);
        }
      }
      if (t >= roundMs) {
        if (!done.current) {
          done.current = true;
          const k = tally.current;
          const missed = k.missed + matches.filter((m) => !gone.current.has(m.id)).length;
          finish.current({ total: matches.length, right: k.right, wrong: k.wrong, missed, streak: k.best });
        }
        return;
      }
      setNow(t);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(flashTimer.current);
    };
  }, [matches, roundMs]);

  const sortInto = useCallback(
    (tier: Tier, id?: number) => {
      if (done.current) return;
      unlockAudio();
      const t = performance.now() - start.current;
      const air = inAir(matches, gone.current, t);
      const want = id ?? pickedRef.current;
      const m: SortMatch | undefined = air.find((x) => x.id === want) ?? air[0];
      if (!m) return;
      gone.current.add(m.id);
      const k = tally.current;
      const ok = m.tier === tier;
      if (ok) {
        k.right += 1;
        k.streak += 1;
        k.best = Math.max(k.best, k.streak);
        sfx.pickup();
      } else {
        k.wrong += 1;
        k.streak = 0;
        sfx.wrong();
      }
      setPicked(null);
      setFlash({ tier, ok, was: ok ? undefined : m.tier });
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlash(null), 650);
    },
    [matches],
  );

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= SORT_TIERS.length) {
        e.preventDefault();
        sortInto(SORT_TIERS[n - 1]!);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [sortInto]);

  // Drag a match onto a box: track the pointer, sort on release over a box.
  const onDown = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    unlockAudio();
    setPicked(id);
    setDrag({ id, x: e.clientX, y: e.clientY });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag) setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };
  const onUp = (e: React.PointerEvent) => {
    if (!drag) return;
    const id = drag.id;
    setDrag(null);
    const box = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>("[data-sort-tier]");
    const tier = box?.dataset.sortTier as Tier | undefined;
    if (tier) sortInto(tier, id);
  };

  const t = now;
  const air = inAir(matches, gone.current, t);
  const wave = matches.reduce((w, m) => (m.at <= t ? Math.max(w, m.wave) : w), 0);
  const k = tally.current;
  const left = Math.max(0, Math.ceil((roundMs - t) / 1000));
  const dragTier = drag ? matches.find((m) => m.id === drag.id)?.tier : undefined;

  return (
    <div className="ll-game ms-game" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => setDrag(null)}>
      <div className="ll-bar">
        <p className="kicker">Match sorter</p>
        <p className="ll-stats tabular-nums">
          <span>
            Wave {wave + 1} of {SORT_WAVES.length}
          </span>
          <span>{k.right} sorted</span>
          {k.streak >= 3 ? <span className="ll-streak">{k.streak} in a row</span> : null}
          <span className="ll-left">{left}s</span>
        </p>
      </div>
      <div className={`ms-chute${flash ? (flash.ok ? " is-hit" : " is-stray") : ""}`}>
        {air.map((m) => {
          const p = Math.min(1, Math.max(0, fallProgress(m, t)));
          const lane = (m.lane + 0.5) / SORT_LANES;
          return (
            <button
              key={m.id}
              type="button"
              className={`ms-match tier-${m.tier}${picked === m.id ? " is-picked" : ""}${drag?.id === m.id ? " is-dragging" : ""}`}
              style={{
                left: `${8 + lane * 84}%`,
                top: `${p * 74}%`,
                transform: `translateX(-50%) rotate(${Math.round(Math.sin((m.id + p * 3) * 2.1) * 28)}deg)`,
              }}
              aria-label={`${TIER_LABEL[m.tier]} match, rank ${SORT_RANK[m.tier]}`}
              onPointerDown={(e) => onDown(e, m.id)}
              onClick={(e) => e.preventDefault()}
            >
              <Glyph tier={m.tier} />
              <Pips tier={m.tier} />
            </button>
          );
        })}
        <div className="ms-floor" aria-hidden />
        <div className="ll-glass" aria-hidden />
      </div>
      <div className="ms-boxes" role="group" aria-label="Tier boxes">
        {SORT_TIERS.map((tier, i) => {
          const state = flash?.tier === tier ? (flash.ok ? " is-hit" : " is-wrong") : flash?.was === tier ? " is-answer" : "";
          return (
            <button
              key={tier}
              type="button"
              data-sort-tier={tier}
              className={`ms-box tier-${tier}${state}`}
              onClick={() => sortInto(tier)}
              aria-label={`${TIER_LABEL[tier]} box, rank ${SORT_RANK[tier]}, key ${i + 1}`}
            >
              <span className="wh-key tabular-nums" aria-hidden>
                {i + 1}
              </span>
              <span className="ms-swatch" aria-hidden />
              <span className="ms-box-name">{TIER_LABEL[tier]}</span>
              <Pips tier={tier} />
            </button>
          );
        })}
      </div>
      {drag && dragTier ? (
        <span className={`ms-ghost tier-${dragTier}`} style={{ left: drag.x, top: drag.y }} aria-hidden>
          <Glyph tier={dragTier} />
        </span>
      ) : null}
      <div className="ll-foot">
        <p className="text-xs text-fg-subtle">
          {flash && !flash.ok && flash.was
            ? `That one was ${TIER_LABEL[flash.was].toLowerCase()} (${SORT_RANK[flash.was]}).`
            : "Tap a box to sort the lowest match, or pick a match first. Count the ticks. Keys 1–6."}
        </p>
        <button type="button" className="btn btn-quiet ll-quit" onClick={onQuit}>
          Stop
        </button>
      </div>
    </div>
  );
}
