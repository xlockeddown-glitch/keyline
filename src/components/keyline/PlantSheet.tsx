/** 0.1.109: place the Hearth vault: name chips, the 4-field picker and "Place … for good". The ghost is on the map. */
import { useState } from "react";
import { PLANT_CATS, PLANT_GAP_M, PLANT_NAMES } from "@/game/placedLantern";
import { TRIVIA_CATS } from "@/game/triviaMeta";
import { ghostOk, placeHearth, setPlant, usePlant } from "@/game/plantClient";
import { sfx } from "@/game/audio";
import { HEARTH_TIERS, HEARTH_VERSIONS, HEARTH_VERSION_NAME, versionLine } from "@/game/hearthMulti";
import { VK_NUM } from "@/game/pins";

const LABEL = Object.fromEntries(TRIVIA_CATS.map((c) => [c.id, c.label])) as Record<string, string>;
const FIRST = 6;

export function ghostLine(g: { gap: number; street: boolean } | null): { ok: boolean; text: string } {
  if (!g) return { ok: false, text: "Finding your spot…" };
  const m = Number.isFinite(g.gap) ? `${Math.round(g.gap)} m` : "no vault near";
  if (!g.street) return { ok: false, text: "✗ Off the mapped streets" };
  if (g.gap < PLANT_GAP_M) return { ok: false, text: `✗ ${m} · too close` };
  return { ok: true, text: `✓ On a mapped street · ${m} from the nearest vault` };
}

export function PlantSheet() {
  const p = usePlant();
  const [more, setMore] = useState(false);
  if (!p.placing) return null;
  const ok = ghostOk(p.ghost);
  const names = more ? PLANT_NAMES.map((_, i) => i) : PLANT_NAMES.slice(0, FIRST).map((_, i) => i);
  if (!names.includes(p.name)) names.push(p.name);
  const toggleCat = (c: string) => {
    sfx.ui();
    const has = p.cats.includes(c);
    if (!has && p.cats.length >= 4) return;
    setPlant({ cats: has ? p.cats.filter((x) => x !== c) : [...p.cats, c] });
  };
  const line = ghostLine(p.ghost);
  return (
    <section className="plant-sheet" role="dialog" aria-label="Place your Hearth vault" data-testid="plant-sheet">
      <p className="kicker plant-kicker">Hearth vault · {HEARTH_VERSION_NAME[p.v]} · {HEARTH_TIERS[p.v].map((t) => VK_NUM[t]).join(" → ")}</p>
      <h2 className="plant-title">Place it here, for good</h2>
      <p className="plant-sub">Unlocked by your perfect Stack. Placed vaults can't be moved or picked up.</p>
      <p className={`plant-check ${line.ok ? "ok" : "bad"}`} data-testid="plant-check">{line.text}</p>
      <p className="plant-label">Name</p>
      <div className="plant-chips" data-testid="plant-names">
        {names.map((i) => (
          <button key={i} type="button" className={`plant-chip${p.name === i ? " on" : ""}`} aria-pressed={p.name === i} onClick={() => (sfx.ui(), setPlant({ name: i }))}>
            {PLANT_NAMES[i]}
          </button>
        ))}
        {more ? null : (
          <button type="button" className="plant-chip" onClick={() => setMore(true)}>
            +{PLANT_NAMES.length - FIRST} more
          </button>
        )}
      </div>
      <p className="plant-label">Version (set for good)</p>
      <div className="plant-chips plant-version" data-testid="plant-version" role="radiogroup" aria-label="Hearth version">
        {HEARTH_VERSIONS.map((v) => (
          <button key={v} type="button" role="radio" className={`plant-chip${p.v === v ? " on" : ""}`} aria-checked={p.v === v} data-v={v} onClick={() => (sfx.ui(), setPlant({ v }))}>
            {HEARTH_VERSION_NAME[v]}
            <span className="plant-tiers">
              {HEARTH_TIERS[v].map((t, i) => (
                <span key={i} className={`hearth-chip tier-${t} is-cur`} style={{ padding: "0 6px", marginLeft: 3, fontSize: 10 }}>
                  {VK_NUM[t]}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
      <p className="plant-sub" data-testid="plant-version-line">{versionLine(p.v)}</p>
      <p className="plant-label">Pick 4 fields (they never rotate) · {p.cats.length}/4</p>
      <div className="plant-chips" data-testid="plant-cats">
        {PLANT_CATS.map((c) => {
          const on = p.cats.includes(c);
          return (
            <button key={c} type="button" className={`plant-chip${on ? " on" : ""}`} aria-pressed={on} disabled={!on && p.cats.length >= 4} onClick={() => toggleCat(c)}>
              {on ? "✓ " : ""}
              {LABEL[c] ?? c}
            </button>
          );
        })}
      </div>
      {p.note ? <p className="plant-note" role="status">{p.note}</p> : null}
      <div className="plant-actions">
        <button type="button" className="btn btn-primary" data-testid="plant-go" disabled={!ok || p.cats.length !== 4 || p.busy} onClick={() => (sfx.ui(), void placeHearth())}>
          Place {PLANT_NAMES[p.name]} here for good
        </button>
        <button type="button" className="btn btn-quiet" data-testid="plant-cancel" onClick={() => setPlant({ placing: false, ghost: null, note: null })}>
          Not yet
        </button>
      </div>
    </section>
  );
}
