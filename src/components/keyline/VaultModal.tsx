import { useEffect, useState } from "react";
import { Calculator, FlaskConical, Landmark, Leaf, MapPinned, Palette, ScrollText, Trophy, Utensils } from "lucide-react";
import { CITIES, KIND_LABEL, TIER_LABEL, seriesOf, seriesPoi } from "@/game/data";
import { useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { DIFF_LABEL, DIFF_MULT, TRIVIA_CATS, offerCats } from "@/game/trivia";
import { placeLine } from "@/game/place";
import type { TriviaCat } from "@/game/types";
import { ItemIcon } from "./ItemIcon";

const CAT_ICON: Record<TriviaCat, typeof Trophy> = {
  sports: Trophy,
  local: MapPinned,
  political: Landmark,
  food: Utensils,
  arts: Palette,
  math: Calculator,
  science: FlaskConical,
  history: ScrollText,
  nature: Leaf,
};

const LETTERS = ["A", "B", "C", "D"] as const;

export function VaultModal() {
  const openVault = useGame((s) => s.openVault);
  const cityId = useGame((s) => s.cityId);
  const pickCategory = useGame((s) => s.pickCategory);
  const vaultsOpened = useGame((s) => s.vaultsOpened);
  const answer = useGame((s) => s.answer);
  const closeVault = useGame((s) => s.closeVault);
  const [now, setNow] = useState(() => performance.now());

  useEffect(() => {
    if (!openVault?.question) return;
    let id = 0;
    const tick = () => {
      setNow(performance.now());
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [openVault?.question]);

  useEffect(() => {
    if (!openVault?.question) return;
    const wait = Math.max(0, openVault.deadline - performance.now());
    const id = window.setTimeout(() => {
      useGame.getState().answer("__timeout__", performance.now());
    }, wait);
    return () => window.clearTimeout(id);
  }, [openVault?.question, openVault?.deadline]);

  const quiz = openVault?.question ?? null;

  useEffect(() => {
    if (!quiz) return;
    const onKey = (e: KeyboardEvent) => {
      const idx =
        e.code === "KeyA" || e.code === "Digit1" || e.code === "Numpad1"
          ? 0
          : e.code === "KeyB" || e.code === "Digit2" || e.code === "Numpad2"
            ? 1
            : e.code === "KeyC" || e.code === "Digit3" || e.code === "Numpad3"
              ? 2
              : e.code === "KeyD" || e.code === "Digit4" || e.code === "Numpad4"
                ? 3
                : -1;
      if (idx < 0) return;
      const choice = quiz.choices[idx];
      if (!choice) return;
      e.preventDefault();
      sfx.ui();
      useGame.getState().answer(choice, performance.now());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quiz]);

  if (!openVault) return null;
  const series = seriesOf(openVault.poiId);
  const poi = series ? seriesPoi(series) : CITIES[cityId].pois.find((p) => p.id === openVault.poiId);
  if (!poi) return null;

  const left = quiz ? Math.max(0, openVault.deadline - now) : 0;
  const total = quiz ? Math.max(1, openVault.deadline - openVault.startedAt) : 1;
  const elapsed = quiz ? now - openVault.startedAt : 0;
  const grade = elapsed <= 3000 ? "Perfect" : elapsed <= 10000 ? "Great" : "Good";
  const frac = quiz ? Math.min(1, left / total) : 0;
  const catMeta = TRIVIA_CATS.find((c) => c.id === openVault.category);
  const offered = offerCats(openVault.poiId, vaultsOpened, 6, series ? undefined : poi);
  const ground = !series && poi ? placeLine(poi) : null;
  const step = (openVault.run?.step ?? 0) + (quiz ? 1 : 0);
  const steps = openVault.run?.steps ?? series?.steps ?? 3;
  const wickClass = left < 5000 ? "is-short" : `is-${grade.toLowerCase()}`;

  return (
    <div className={`vault-night tier-${poi.tier} absolute inset-0 z-[800] flex items-end justify-center p-3 sm:items-center`}>
      <div className="plate w-full max-w-lg p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={`vault-hero vault-pin tier-${poi.tier}${series?.kind === "stack" ? " is-stack" : series ? " is-run" : ""}`}>
            {series?.kind === "stack" ? (
              <span className="stack-lamp">
                <i className="lantern-cap" />
                <i className="stack-globe a">
                  <i className="lantern-glass" />
                </i>
                <i className="stack-globe b">
                  <i className="lantern-glass" />
                </i>
                <i className="lantern-post" />
              </span>
            ) : (
              <span className="lantern lantern-hero">
                <i className="lantern-cap" />
                <i className="lantern-frame">
                  <i className="lantern-glass" />
                </i>
                <i className="lantern-post" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="kicker">
              {openVault.spark
                ? `Spark · earn a ${TIER_LABEL[poi.tier]} match`
                : series
                ? `${series.name} · plate ${Math.max(1, step)} of ${steps}`
                : `${TIER_LABEL[poi.tier]} lamp · ${KIND_LABEL[poi.kind]}`}
              {catMeta ? ` · ${catMeta.label}` : ""}
            </p>
            <h2 className="font-display mt-1 text-2xl leading-tight text-balance">{poi.name}</h2>
            {!quiz ? (
              <>
                <p className="mt-2 text-sm text-pretty text-fg-muted">{poi.lore}</p>
                {ground ? <p className="mt-2 text-xs text-fg-subtle text-pretty">{ground}</p> : null}
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                  {openVault.spark ? (
                    <>
                      No match spent. A right answer is a spare <ItemIcon item={poi.tier} size={16} /> {TIER_LABEL[poi.tier]}
                    </>
                  ) : (
                    <>
                      Spends one <ItemIcon item={poi.tier} size={16} /> {TIER_LABEL[poi.tier]} match
                      {series ? ` · pays a ${TIER_LABEL[series.pay].toLowerCase()} if you clear` : ""}
                    </>
                  )}
                </p>
              </>
            ) : null}
          </div>
        </div>

        {!quiz ? (
          <div className="mt-5">
            <p className="kicker">Choose a field</p>
            <p className="mt-1 text-sm text-fg-muted">
              {series
                ? "One field for all plates — they get harder as you go."
                : "Six this lamp. They rotate. The plates prefer the ground you're on."}
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {offered.map((id) => {
                const c = TRIVIA_CATS.find((x) => x.id === id);
                if (!c) return null;
                const Icon = CAT_ICON[c.id];
                return (
                  <button
                    key={c.id}
                    type="button"
                    className="field-card"
                    onClick={() => pickCategory(c.id, performance.now())}
                  >
                    <span className="field-stamp">
                      <Icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="font-display block text-lg leading-none">{c.label}</span>
                      <span className="mt-1 block text-xs text-fg-subtle">{c.blurb}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="plate-quiz mt-4">
            <div className={`wick ${wickClass}`} aria-hidden>
              <i style={{ width: `${frac * 100}%` }} />
            </div>
            <p className="plate-meta">
              {series ? <span>Plate {(openVault.run?.step ?? 0) + 1} of {steps}</span> : null}
              <span>{DIFF_LABEL[quiz.diff]}</span>
              <span className={`grade is-${grade.toLowerCase()}`}>{grade}</span>
              <span className="tabular-nums">{(left / 1000).toFixed(1)}s</span>
              <span className="text-fg-subtle">×{DIFF_MULT[quiz.diff]}</span>
            </p>
            {series ? (
              <div className="mt-2 flex gap-1.5" aria-hidden>
                {Array.from({ length: steps }, (_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${i <= (openVault.run?.step ?? 0) ? "bg-accent" : "bg-bg-subtle"}`}
                  />
                ))}
              </div>
            ) : null}

            <p className="plate-q">{quiz.q}</p>
            <div className="plate-choices">
              {quiz.choices.map((c, i) => (
                <button
                  key={c}
                  type="button"
                  className="plate-choice"
                  onClick={() => {
                    sfx.ui();
                    answer(c, performance.now());
                  }}
                >
                  <span className="plate-letter">{LETTERS[i]}</span>
                  <span className="min-w-0 text-pretty">{c}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-fg-subtle">A–D or 1–4</p>
          </div>
        )}

        <button type="button" className="btn btn-ghost mt-4 w-full" onClick={closeVault}>
          {series && openVault.run?.spent ? `Forfeit ${series.name}` : "Leave lamp"}
        </button>
      </div>
    </div>
  );
}
