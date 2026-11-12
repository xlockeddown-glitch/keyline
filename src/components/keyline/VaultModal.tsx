import { vaultSvgCentered } from "@/game/pins";
import { useEffect, useState, type CSSProperties } from "react";
import { cotdAt, perkFavs, favBonus, CAT_BONUS_CAP, RANDOM_BONUS } from "@/game/carPerks";
import { BookOpen, Calculator, Dices, FlaskConical, Gamepad2, Globe, Landmark, Leaf, MapPinned, Music, Palette, ScrollText, Star, Trophy, Utensils } from "lucide-react";
import { anyPois } from "@/game/nightMarket";
import { isComet } from "@/game/eventVault";
import { CITIES, KIND_LABEL, TIER_LABEL } from "@/game/data";
import { VK_NUM } from "@/game/pins";
import { HEARTH_VERSION_NAME, HEARTH_TIERS, hearthSteps, hearthTierAt, hearthVersion, slotOf } from "@/game/hearthMulti";
import { seatedCar, useGame } from "@/game/store";
import { sfx } from "@/game/audio";
import { DIFF_LABEL, DIFF_MULT, TRIVIA_CATS, offerCats } from "@/game/triviaMeta";
import { FACET_COLOR, FACET_POS, hearthOf, hearthOffer } from "@/game/hearthVaults";
import { placeLine } from "@/game/place";
import type { TriviaCat } from "@/game/types";
import { ItemIcon } from "./ItemIcon";
import { OwnerPlate } from "./OwnLamps";
import { useOwnedPoi } from "@/game/ownLampsClient";
import { choiceButtons, dropStaleFocus } from "@/game/choiceMarkup";

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
  games: Gamepad2,
  celebrity: Star,
  music: Music,
  books: BookOpen,
  geography: Globe,
};

export function VaultModal() {
  const openVault = useGame((s) => s.openVault);
  const cityId = useGame((s) => s.cityId);
  const blanks = useGame((s) => s.blanks);
  const pickCategory = useGame((s) => s.pickCategory);
  const vaultsOpened = useGame((s) => s.vaultsOpened);
  const answer = useGame((s) => s.answer);
  const answerNear = useGame((s) => s.answerNear);
  const closeVault = useGame((s) => s.closeVault);
  const [now, setNow] = useState(() => performance.now());
  const [nearGuess, setNearGuess] = useState("");

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
  const isOpen = Boolean(openVault);
  const scout = useGame((s) => s.scout);
  const carNow = useGame((s) => seatedCar(s));
  const owned = useOwnedPoi(openVault?.poiId);

  // 0.0.52: phones hide the map's +/- zoom while the lamp card is open — the card fills the screen there and the
  // zoom (a Leaflet control above the overlay) sat on its top-left corner, over the lamp. CSS keys off this class.
  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    root.classList.add("lamp-card-open");
    return () => root.classList.remove("lamp-card-open");
  }, [isOpen]);

  // 0.0.52: no button starts a card focused — iOS kept the last tap's focus/hover on whatever sat under it.
  useEffect(() => {
    if (isOpen) dropStaleFocus(document);
  }, [isOpen, quiz]);

  useEffect(() => {
    setNearGuess("");
  }, [quiz?.id]);

  useEffect(() => {
    if (!quiz) return;
    const onKey = (e: KeyboardEvent) => {
      if (quiz.kind === "near") return;
      const idx =
        quiz.kind === "tf"
          ? e.code === "KeyT" || e.code === "Digit1" || e.code === "Numpad1"
            ? 0
            : e.code === "KeyF" || e.code === "Digit2" || e.code === "Numpad2"
              ? 1
              : -1
          : e.code === "KeyA" || e.code === "Digit1" || e.code === "Numpad1"
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
      if (!choice || choice === quiz.struck) return;
      e.preventDefault();
      sfx.ui();
      useGame.getState().answer(choice, performance.now());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quiz]);

  if (!openVault) return null;
  const poi = anyPois(CITIES[cityId], blanks).find((p) => p.id === openVault.poiId);
  if (!poi) return null;

  const left = quiz ? Math.max(0, openVault.deadline - now) : 0;
  const total = quiz ? Math.max(1, openVault.deadline - openVault.startedAt) : 1;
  const elapsed = quiz ? now - openVault.startedAt : 0;
  const grade = quiz?.kind === "near" ? "Estimate" : elapsed <= 3000 ? "Perfect" : elapsed <= 10000 ? "Great" : "Good";
  const frac = quiz ? Math.min(1, left / total) : 0;
  const catMeta = openVault.category === "random" ? { label: "Random" } : TRIVIA_CATS.find((c) => c.id === openVault.category);
  const today = cotdAt(Date.now());
  // 0.1.110: a Hearth vault offers its owner's 4 fixed fields (Math on MATH_OFFER_KEEP of visits, like any lamp).
  const hearth = hearthOf(openVault.poiId);
  // 0.1.117: Double/Triple Hearth: which question this is, its tier, and the fields already used this run.
  const hv = hearth ? hearthVersion(hearth.v) : 1;
  const multi = Boolean(hearth) && hv > 1;
  const hStep = multi ? (openVault.hearth?.step ?? 0) : 0;
  const hUsed = multi ? (openVault.hearth?.used ?? []) : [];
  const hTier = hearthTierAt(hv, hStep);
  const hName = HEARTH_VERSION_NAME[hv];
  const offered = hearth
    ? hearthOffer(hearth.cats, openVault.poiId, vaultsOpened, hStep)
    : offerCats(openVault.poiId, vaultsOpened, 6, poi, today);
  const favs = perkFavs(scout, true, carNow);
  const ground = poi ? placeLine(poi) : null;
  const wickClass = left < 5000 ? "is-short" : quiz?.kind === "near" ? "is-good" : `is-${grade.toLowerCase()}`;

  return (
    <div className={`vault-night tier-${poi.tier} absolute inset-0 z-[800] flex items-end justify-center p-3 sm:items-center`}>
      <div className={`plate lamp-card w-full max-w-lg${owned ? " is-owned" : ""}`}>
        <div className="lamp-card-body px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-start gap-4">
            <div className={`vault-hero vault-pin tier-${poi.tier}`}>
              {hearth ? (
                <span className="hearth-hero" data-testid="hearth-hero">
                  <ItemIcon item={multi ? hTier : "red"} size={56} />
                </span>
              ) : isComet(poi.id) ? (
                // 0.1.159: the Comet vault's own painting (the approved Gemini mock), nothing drawn over it.
                <img className="comet-hero" src="/sprites/comet/open.webp" width={72} height={86} alt="" draggable={false} data-testid="comet-hero-art" />
              ) : (
                // 0.1.112: the vault itself (centered drawing, dial concentric), with its tier quirk.
                <span className={`vk-hero vk-q-${poi.tier}`} data-testid="vault-hero-art" dangerouslySetInnerHTML={{ __html: vaultSvgCentered(poi.tier) }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="kicker">
                {openVault.spark
                  ? `Spark · earn a ${TIER_LABEL[poi.tier]} key`
                  : multi
                  ? `Hearth · ${hName} · question ${hStep + 1} of ${hearthSteps(hv)}`
                  : hearth
                  ? "Hearth vault · plays as V · spends one V key"
                  : `${TIER_LABEL[poi.tier]} vault · ${KIND_LABEL[poi.kind]}`}
                {catMeta ? ` · ${catMeta.label}` : ""}
                {!hearth && openVault.category === today ? <span className="cotd-badge ml-1.5">+25% today</span> : null}
              </p>
              <h2 className="font-display mt-1 text-2xl leading-tight text-balance">{poi.name}</h2>
              {hearth ? null : <OwnerPlate poiId={poi.id} />}
              {multi ? (
                <>
                  <div className="hearth-chips" data-testid="hearth-chips" aria-label={`${hName} Hearth tiers`}>
                    {HEARTH_TIERS[hv].map((t, i) => {
                      const st = i < hStep ? "done" : i === hStep ? "cur" : "next";
                      return (
                        <span key={i} className={`hearth-chip tier-${t} is-${st}`} data-state={st}>
                          <ItemIcon item={t} size={14} /> {VK_NUM[t]}
                          {st === "done" ? " ✓" : st === "next" ? " 🔒" : ""}
                        </span>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-sm text-fg-muted" data-testid="hearth-by">
                    Placed by {hearth!.by.replace(/\.$/, "")} · {hName} Hearth · {HEARTH_TIERS[hv].map((t) => VK_NUM[t]).join(" → ")}
                  </p>
                  <p className="hearth-note mt-1 text-sm" data-testid="hearth-note">
                    {hStep === 0
                      ? `Right answers unlock the next pick. The prize pays only after question ${hearthSteps(hv)}. A miss ends it.`
                      : `${hUsed.length} field${hUsed.length > 1 ? "s" : ""} used. ${hStep + 1 >= hearthSteps(hv) ? "Last question — right pays the prize." : `Right opens question ${hStep + 2}.`} A miss ends it and locks the vault.`}
                  </p>
                </>
              ) : hearth ? (
                <p className="mt-1 text-sm text-fg-muted" data-testid="hearth-by">
                  Placed by {hearth.by.replace(/\.$/, "")}. A right answer pays like any V vault. A wrong one locks it out.
                </p>
              ) : null}
              {!quiz ? (
                <>
                  {hearth ? null : <p className="mt-2 text-sm text-pretty text-fg-muted">{poi.lore}</p>}
                  {ground ? <p className="mt-2 text-xs text-fg-subtle text-pretty">{ground}</p> : null}
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-subtle">
                    {openVault.spark ? (
                      <>
                        No key spent. A right answer is a spare <ItemIcon item={poi.tier} size={16} /> {TIER_LABEL[poi.tier]}
                      </>
                    ) : multi && hStep > 0 ? (
                      <>
                        No new key · plays at <ItemIcon item={hTier} size={16} /> {VK_NUM[hTier]}
                      </>
                    ) : (
                      <>
                        Spends one <ItemIcon item={poi.tier} size={16} /> {TIER_LABEL[poi.tier]} key
                      </>
                    )}
                  </p>
                </>
              ) : null}
            </div>
          </div>

          {!quiz && openVault.pending === "deal" ? (
            <div className="mt-5" aria-live="polite" data-testid="lamp-dealing">
              <p className="kicker">Lighting the card</p>
              <p className="mt-1 text-sm text-fg-muted">The card office is pulling a trivia card for this vault…</p>
            </div>
          ) : !quiz ? (
            <div className="mt-5">
              <p className="kicker">{multi ? `Pick a field · ${4 - hUsed.length} left` : "Choose a field"}</p>
              <p className="mt-1 text-sm text-fg-muted">
                {hearth
                  ? offered.includes("math") || !hearth.cats.includes("math")
                    ? "The owner picked these 4. They never rotate."
                    : `The owner picked these. Math sits out this visit; ${TRIVIA_CATS.find((t) => t.id === offered[3])?.label ?? "another field"} fills the 4th slot.`
                  : "Six this vault, or Random. They rotate. The trivia cards prefer the ground you're on."}
              </p>
              <div className="field-grid mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {offered.map((id) => {
                  // 0.1.117: a field used earlier in this run keeps its slot, greyed out (a Math stand-in shares Math's slot).
                  const usedAt = multi ? hUsed.findIndex((u) => slotOf(hearth!.cats, u) === slotOf(hearth!.cats, id)) : -1;
                  if (usedAt >= 0) {
                    const u = TRIVIA_CATS.find((x) => x.id === hUsed[usedAt]);
                    const UIcon = u ? CAT_ICON[u.id] : null;
                    return (
                      <button key={id} type="button" className="field-card hearth-field is-used" style={{ "--hf": FACET_COLOR[hUsed[usedAt]!] } as CSSProperties} disabled aria-disabled data-testid="hearth-used">
                        <span className="field-stamp">{UIcon ? <UIcon className="size-4" strokeWidth={1.75} /> : null}</span>
                        <span className="min-w-0">
                          <span className="font-display block text-lg leading-none">{u?.label ?? hUsed[usedAt]}</span>
                          <span className="hearth-plays mt-1 block text-xs text-fg-subtle">✓ used on Q{usedAt + 1}</span>
                        </span>
                      </button>
                    );
                  }
                  const c = TRIVIA_CATS.find((x) => x.id === id);
                  if (!c) return null;
                  const Icon = CAT_ICON[c.id];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`field-card${hearth ? " hearth-field" : ""}`}
                      style={hearth ? ({ "--hf": FACET_COLOR[c.id] } as CSSProperties) : undefined}
                      title={c.blurb}
                      onClick={() => pickCategory(c.id, performance.now())}
                    >
                      <span className="field-stamp">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0">
                        <span className="font-display block text-lg leading-none">
                          {c.label}
                          {c.id === today && !hearth ? <span className="cotd-badge ml-1.5">Today +25%</span> : null}
                          {favs.includes(c.id) ? <span className="fav-badge ml-1.5">Favorite +{Math.round(favBonus(favs.filter((f) => f === c.id).length) * 100)}%</span> : null}
                        </span>
                        {multi ? <span className="hearth-plays mt-1 block text-xs text-fg-subtle">Plays at {VK_NUM[hTier]}</span> : null}
                        <span className="field-blurb mt-1 block text-xs text-fg-subtle">
                          {hearth ? (hearth.cats.includes(c.id as never) ? `${FACET_POS[hearth.cats.indexOf(c.id as never)] ?? ""} facet · ` : "Stands in for Math today · ") : ""}
                          {c.blurb}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {/* 0.1.116: Random deals from any field (+10% coin, server-paid). Never at a Hearth vault: its 4 fields are fixed. */}
                {hearth ? null : (
                  <button type="button" className="field-card field-random" style={{ gridColumn: "1 / -1" }} data-testid="field-random" title="Any field. The card office picks." onClick={() => pickCategory("random", performance.now())}>
                    <span className="field-stamp">
                      <Dices className="size-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="font-display block text-lg leading-none">
                        Random
                        <span className="cotd-badge ml-1.5">+{Math.round(RANDOM_BONUS * 100)}%</span>
                        {favs.includes("random") ? (
                          <span className="fav-badge ml-1.5" data-testid="fav-random">
                            Favorite +{Math.round(Math.min(CAT_BONUS_CAP - RANDOM_BONUS, favBonus(favs.filter((f) => f === "random").length)) * 100)}%
                          </span>
                        ) : null}
                      </span>
                      <span className="field-blurb mt-1 block text-xs text-fg-subtle">Any field. The card office picks.</span>
                    </span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="plate-quiz mt-4">
              <div className={`wick ${wickClass}`} aria-hidden>
                <i style={{ width: `${frac * 100}%` }} />
              </div>
              <p className="plate-meta">
                <span>{DIFF_LABEL[quiz.diff]}</span>
                <span className={`grade is-${grade.toLowerCase()}`}>{grade}</span>
                <span className="tabular-nums">{(left / 1000).toFixed(1)}s</span>
                <span className="text-fg-subtle">×{DIFF_MULT[quiz.diff]}</span>
              </p>

              <p className="plate-q">{quiz.q}</p>
              {quiz.kind === "near" ? (
                <form
                  className="mt-3 flex flex-col gap-2"
                  data-testid="near-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const n = Number(nearGuess.replace(/,/g, "").trim());
                    if (!Number.isFinite(n) || openVault.pending === "grade") return;
                    sfx.ui();
                    answerNear(n, performance.now());
                  }}
                >
                  <label className="sr-only" htmlFor="near-guess">
                    Your estimate{quiz.unit ? ` in ${quiz.unit}` : ""}
                  </label>
                  <input
                    id="near-guess"
                    className="acct-input tabular-nums"
                    inputMode="decimal"
                    autoComplete="off"
                    value={nearGuess}
                    placeholder={quiz.unit ? quiz.unit : "Your estimate"}
                    disabled={openVault.pending === "grade"}
                    data-testid="near-guess"
                    onChange={(e) => setNearGuess(e.currentTarget.value)}
                  />
                  <button type="submit" className="btn btn-primary w-full" disabled={openVault.pending === "grade"} data-testid="near-lock">
                    Lock in
                  </button>
                </form>
              ) : (
                <div className="plate-choices">
                  {/* Before the answer every choice is the same button; only its text differs (choiceMarkup.ts). */}
                  {choiceButtons(quiz.id, quiz.choices, quiz.kind === "tf" ? ["T", "F"] : undefined).map((b) => (
                    <button
                      key={b.key}
                      type="button"
                      className={`${b.className}${quiz.struck === b.text ? " is-struck" : ""}`}
                      disabled={openVault.pending === "grade" || quiz.struck === b.text}
                      data-struck={quiz.struck === b.text ? "1" : undefined}
                      onClick={() => {
                        sfx.ui();
                        answer(b.text, performance.now());
                      }}
                    >
                      <span className="plate-letter">{b.letter}</span>
                      <span className="min-w-0 text-pretty">{b.text}</span>
                    </button>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-fg-subtle" aria-live="polite">
                {openVault.pending === "grade" ? "Checking your answer…" : quiz.kind === "tf" ? "T/F or 1/2" : quiz.kind === "near" ? "Type a number, then Lock in or press Enter" : "A–D or 1–4"}
              </p>
            </div>
          )}
        </div>
        {/* 0.0.52: the leave/forfeit action sits in a footer that never scrolls, so it is on screen on short phones. */}
        <div className="lamp-card-foot px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
          <button type="button" className="btn btn-ghost w-full" onClick={closeVault} disabled={openVault.pending === "grade"}>
            Leave vault
          </button>
        </div>
      </div>
    </div>
  );
}
