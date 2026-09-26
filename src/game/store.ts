import { create } from "zustand";
import { CHARMS, CITIES, CITY_LIST, KIOSK, SCOUTS, SERIES, TIER_LABEL, allPois, interactRadius, isScoutShop, seriesOf, seriesPoi, wornPerk, type KioskId, type SeriesDef, type SeriesKind } from "./data";
import { streetDrop } from "./streets";
import { pickTrivia, shuffled, DIFF_MULT, ASKED_KEEP } from "./trivia";
import { poiName, takeSurvey } from "./survey";
import { sfx } from "./audio";
import { reportCorrect } from "./rolls";
import { emptyAgg, emitOnAnswer, mintSaveId, PLATE_KEEP, type PlateAgg, type PlateEvent, type PlateRollMap } from "./telemetry";
import { reportPlate } from "./reportPlate";
import { fetchRetune } from "./retuneJob";
import { setQuarantine, setRetune } from "./rarity";
import type {
  CharmId,
  CityId,
  Journey,
  LootDrop,
  MapKey,
  MissFlash,
  Poi,
  Screen,
  ScoutId,
  StreetRun,
  Tier,
  TriviaCat,
  TriviaDiff,
  VaultRuntime,
} from "./types";
import { crateLine, crateLoot, nextCrateStreak } from "./crate";
import { PULSE_POINTS, pulseDue } from "./pulse";
import { applyBank, bankDownSpec, bankUpSpec, rewardPoints } from "./rewards";
import { applyTriviaBoosts, creditWhite } from "./boosts";
import { BLUE_POCKET, FARES_CAP, GREEN_POCKET, SPARK_DAY, VAULTS_PER_FARE, WHITE_POCKET, fareDesk, fareMs, matchCap, sparkState, transitLoot } from "./ticket";
import { addIngredient, ingredientName, rollIngredient, spendIngredient, type IngredientId } from "./ingredients";

const SAVE_KEY = "keyline-save-v1";
const SAVE_VERSION = 2;

const EMPTY_KEYS: Record<Tier, number> = {
  white: 2,
  blue: 2,
  green: 0,
  amber: 0,
  red: 0,
  violet: 0,
};

const EMPTY_CORRECT: Record<Tier, number> = {
  white: 0,
  blue: 0,
  green: 0,
  amber: 0,
  red: 0,
  violet: 0,
};

type Hud = {
  nearestId: string | null;
  nearestDist: number;
  speed: number;
  yaw: number;
  stamina: number;
  night: number;
  waypoint: { lat: number; lng: number } | null;
  seated: boolean;
  deskName: string;
  deskDist: number;
  aimDeg: number;
};

type OpenVault = {
  poiId: string;
  startedAt: number;
  question: ReturnType<typeof shuffled> | null;
  category: TriviaCat | null;
  deadline: number;
  run?: { step: number; steps: number; grades: LootDrop["grade"][]; spent: boolean };
  spark?: boolean;
};

type FireworksShow = { kind: "mini" | "grand"; id: number };

export type GameState = {
  screen: Screen;
  cityId: CityId;
  keys: Record<Tier, number>;
  points: number;
  brass: number;
  ink: number;
  vellum: number;
  schematics: number;
  pantry: Partial<Record<IngredientId, number>>;
  charms: CharmId[];
  equipped: CharmId | null;
  scouts: ScoutId[];
  scout: ScoutId;
  atlas: Record<string, true>;
  survey: Record<string, true>;
  vaults: Record<string, VaultRuntime>;
  mapKeys: MapKey[];
  run: StreetRun | null;
  stack: StreetRun | null;
  contract: { ids: string[]; done: string[] } | null;
  streak: number;
  bestStreak: number;
  vaultsOpened: number;
  correctByTier: Record<Tier, number>;
  distanceM: number;
  lastCrateDay: string;
  crateStreak: number;
  lastPulseDay: string;
  sparkDay: string;
  sparkN: number;
  sparkLamps: string[];
  charmDay: string;
  charmTopics: TriviaCat[];
  blanks: Poi[];
  streetSpread: boolean;
  tutorial: number;
  howtoDone: boolean;
  asked: string[];
  seenIds: string[];
  saveId: string;
  plates: PlateEvent[];
  plateAgg: PlateAgg;
  plateRoll: PlateRollMap;
  sessionAt: number;
  lastKeyAt: number;
  fares: number;
  cityVaults: number;
  journey: Journey | null;
  landAtStation: boolean;
  pressPass: number;
  loot: LootDrop | null;
  miss: MissFlash | null;
  openVault: OpenVault | null;
  hqOpen: boolean;
  invOpen: boolean;
  shopOpen: boolean;
  toast: string | null;
  fireworks: FireworksShow | null;
  hud: Hud;
  setScreen: (s: Screen) => void;
  pickCity: (id: CityId) => void;
  setHud: (h: Partial<Hud>) => void;
  addDistance: (m: number) => void;
  stampPlaces: (ids: string[]) => void;
  collectKey: (id: string) => void;
  maybeSpawnKey: (now: number) => void;
  maybeSpawnRun: (now: number) => void;
  seedBlanks: (list: Poi[]) => void;
  spreadDrops: (keys: MapKey[], run: StreetRun | null, stack: StreetRun | null) => void;
  tryOpen: (poiId: string, now: number) => string | null;
  closeShop: () => void;
  pickCategory: (cat: TriviaCat, now: number) => void;
  answer: (choice: string, now: number) => void;
  closeVault: () => void;
  claimCrate: () => void;
  claimPulse: () => void;
  bankUp: (tier: Tier) => void;
  bankDown: (tier: Tier) => void;
  craft: (id: CharmId) => void;
  equip: (id: CharmId | null) => void;
  buyScout: (id: ScoutId) => void;
  wearScout: (id: ScoutId) => void;
  buyKiosk: (id: KioskId) => void;
  startContract: () => void;
  toggleHq: (v?: boolean) => void;
  toggleInv: (v?: boolean) => void;
  dismissLoot: () => void;
  skipTutorial: () => void;
  advanceTutorial: (n?: number) => void;
  replayTutorial: () => void;
  resetCity: () => void;
  clearFireworks: () => void;
  boardFare: (to: CityId) => string | null;
  tickJourney: () => void;
};

function bumpStreak(get: () => GameState): Pick<GameState, "streak" | "bestStreak" | "fireworks"> {
  const prev = get().streak;
  const streak = prev + 1;
  let fireworks = get().fireworks;
  if (prev < 1000 && streak >= 1000) {
    sfx.fireworks("grand");
    fireworks = { kind: "grand", id: Date.now() };
  } else if (prev < 100 && streak >= 100) {
    sfx.fireworks("mini");
    fireworks = { kind: "mini", id: Date.now() };
  }
  return { streak, bestStreak: Math.max(get().bestStreak, streak), fireworks };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function rollBoosts(
  get: () => GameState,
  correct: boolean,
  elapsedMs: number,
  topic: TriviaCat | null | undefined,
) {
  return applyTriviaBoosts({
    correct,
    elapsedMs,
    topic: topic ?? null,
    streakAfter: correct ? get().streak + 1 : 0,
    charmDay: typeof get().charmDay === "string" ? get().charmDay : "",
    charmTopics: Array.isArray(get().charmTopics) ? get().charmTopics : [],
  });
}

function payBoosts(keys: Record<Tier, number>, points: number, award: ReturnType<typeof applyTriviaBoosts>) {
  const paid = creditWhite(keys, award.white);
  return {
    keys: paid.keys,
    points: points + award.coins,
    whiteAdded: paid.added,
    boosts: award.labels,
    charmDay: award.charmDay,
    charmTopics: award.charmTopics,
  };
}

function sparksNow(get: () => GameState) {
  return sparkState(get().sparkDay, get().sparkN, get().sparkLamps, today());
}

function placeKey(cityId: CityId, tier: Tier): MapKey {
  const c = CITIES[cityId];
  const around = c.spawn;
  const p = streetDrop(around, 220, 2200);
  return {
    id: `k-${cityId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    lat: p.lat,
    lng: p.lng,
    tier,
  };
}

function seriesLive(s: GameState, kind: SeriesKind): StreetRun | null {
  return kind === "run" ? s.run : s.stack;
}

function seriesPatch(kind: SeriesKind, pos: StreetRun): Partial<GameState> {
  return kind === "run" ? { run: pos } : { stack: pos };
}

function coolSeries(s: GameState, def: SeriesDef): StreetRun {
  const cur = seriesLive(s, def.kind);
  return { lat: cur?.lat ?? 0, lng: cur?.lng ?? 0, readyAt: Date.now() + def.coolMs };
}

function placeRun(cityId: CityId): StreetRun {
  const c = CITIES[cityId];
  const p = streetDrop(c.spawn, 280, 2000);
  return { lat: p.lat, lng: p.lng, readyAt: 0 };
}

function seedKeys(cityId: CityId, n = 6): MapKey[] {
  const c = CITIES[cityId];
  const out: MapKey[] = [];
  const tiers: Tier[] = ["white", "blue", "white", "white", "blue", "white"];
  for (let i = 0; i < n; i++) {
    const around = c.spawn;
    const p = streetDrop(around, 160 + i * 90, 2100);
    out.push({
      id: `k-${cityId}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      lat: p.lat,
      lng: p.lng,
      tier: tiers[i % tiers.length]!,
    });
  }
  return out;
}

function seedContract(cityId: CityId): { ids: string[]; done: string[] } {
  const pois = [...CITIES[cityId].pois].sort((a, b) => a.tier.localeCompare(b.tier));
  const picks = pois.filter((p) => p.tier !== "white").slice(0, 8);
  const ids: string[] = [];
  while (ids.length < 3 && picks.length) {
    const i = Math.floor(Math.random() * picks.length);
    const p = picks.splice(i, 1)[0]!;
    if (!ids.includes(p.id)) ids.push(p.id);
  }
  return { ids, done: [] };
}

function persistable(s: GameState) {
  return {
    version: SAVE_VERSION,
    cityId: s.cityId,
    keys: s.keys,
    points: s.points,
    brass: s.brass,
    ink: s.ink,
    vellum: s.vellum,
    schematics: s.schematics,
    pantry: s.pantry,
    charms: s.charms,
    equipped: s.equipped,
    scouts: s.scouts,
    scout: s.scout,
    atlas: s.atlas,
    survey: s.survey,
    vaults: s.vaults,
    mapKeys: s.mapKeys,
    run: s.run,
    stack: s.stack,
    contract: s.contract,
    streak: s.streak,
    bestStreak: s.bestStreak,
    vaultsOpened: s.vaultsOpened,
    correctByTier: s.correctByTier,
    distanceM: s.distanceM,
    lastCrateDay: s.lastCrateDay,
    crateStreak: s.crateStreak,
    lastPulseDay: s.lastPulseDay,
    sparkDay: s.sparkDay,
    sparkN: s.sparkN,
    sparkLamps: s.sparkLamps,
    charmDay: s.charmDay,
    charmTopics: s.charmTopics,
    blanks: s.blanks,
    streetSpread: s.streetSpread,
    tutorial: s.tutorial,
    howtoDone: s.howtoDone,
    asked: s.asked.slice(-ASKED_KEEP),
    seenIds: (s.seenIds ?? []).slice(-ASKED_KEEP),
    saveId: s.saveId,
    plates: (s.plates ?? []).slice(-PLATE_KEEP),
    plateAgg: s.plateAgg ?? emptyAgg(),
    plateRoll: s.plateRoll ?? {},
    fares: s.fares,
    cityVaults: s.cityVaults,
    journey: s.journey,
    landAtStation: s.landAtStation,
    pressPass: s.pressPass,
  };
}

function pocketStreet(keys: Record<Tier, number>) {
  return (keys.white ?? 0) + (keys.blue ?? 0) + (keys.green ?? 0);
}

function tightenKeys(keys: Partial<Record<Tier, number>> | undefined): Record<Tier, number> {
  const k = { ...EMPTY_KEYS, ...keys };
  return {
    white: Math.min(k.white ?? 0, WHITE_POCKET),
    blue: Math.min(k.blue ?? 0, BLUE_POCKET),
    green: Math.min(k.green ?? 0, GREEN_POCKET),
    amber: Math.min(k.amber ?? 0, 1),
    red: Math.min(k.red ?? 0, 1),
    violet: k.violet ?? 0,
  };
}

function loadSave(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { version?: number } & Partial<GameState>;
    if (data.version !== 1 && data.version !== 2) return null;
    if (data.version === 1) {
      data.keys = tightenKeys(data.keys);
    }
    return data;
  } catch {
    return null;
  }
}

let saveTimer: number | null = null;
function scheduleSave(get: () => GameState) {
  if (typeof window === "undefined") return;
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(persistable(get())));
    } catch {
      /* private mode */
    }
  }, 400);
}

function rideFindCopy(add: { white: number; blue: number; green: number }) {
  const parts: string[] = [];
  if (add.white) parts.push(add.white === 1 ? "white" : `${add.white} white`);
  if (add.blue) parts.push("blue");
  if (add.green) parts.push("green");
  if (!parts.length) return "";
  const list =
    parts.length === 1 ? parts[0]! : parts.length === 2 ? `${parts[0]} and ${parts[1]}` : `${parts[0]}, ${parts[1]}, and ${parts[2]}`;
  if (add.green) return `${list} match${parts.length > 1 || add.white > 1 ? "es" : ""}. You sat the whole haul.`;
  if (add.blue) return `${list} match${parts.length > 1 || add.white > 1 ? "es" : ""}. Ten minutes on the rail.`;
  if (add.white === 1) return "White match. Left on the seat.";
  return `${add.white} white matches in the car.`;
}

function flashToast(set: (p: Partial<GameState>) => void, get: () => GameState, msg: string, ms = 2000) {
  set({ toast: msg });
  window.setTimeout(() => {
    if (get().toast === msg) set({ toast: null });
  }, ms);
}

function bumpCorrect(get: () => GameState, tier: Tier): Record<Tier, number> {
  const cur = get().correctByTier;
  return { ...cur, [tier]: (cur[tier] ?? 0) + 1 };
}

function postClear(tier: Tier) {
  void reportCorrect({ data: { tier } })
    .then(() => {
      if (typeof window !== "undefined") window.dispatchEvent(new Event("keyline-rolls"));
    })
    .catch(() => {
      /* signed out, or the rolls are down — local count still stands */
    });
}

function logPlate(get: () => GameState, ov: OpenVault, now: number, correct: boolean) {
  const q = ov.question;
  const { event, plates, plateAgg, plateRoll } = emitOnAnswer({
    plates: get().plates ?? [],
    plateAgg: get().plateAgg,
    plateRoll: get().plateRoll ?? {},
    saveId: get().saveId,
    cityId: get().cityId,
    plateId: q?.id,
    shownAt: ov.startedAt,
    answeredAt: now,
    correct,
    rarity: q?.rarity,
    difficulty: q?.diff ?? null,
  });
  if (event) {
    void reportPlate({ data: event }).catch(() => {
      /* signed out — local ring still stands */
    });
  }
  return { plates, plateAgg, plateRoll };
}

function paySurvey(set: (p: Partial<GameState>) => void, get: () => GameState, keys?: Record<Tier, number>) {
  const hit = takeSurvey({
    atlas: get().atlas,
    distanceM: get().distanceM,
    survey: get().survey,
    keys: keys ?? get().keys,
  });
  if (!hit) return false;
  sfx.pickup();
  set({ keys: hit.keys, survey: hit.survey });
  flashToast(set, get, hit.message, 2400);
  scheduleSave(get);
  return true;
}

const saved = typeof window !== "undefined" ? loadSave() : null;
const savedCity = saved?.cityId && saved.cityId in CITIES ? saved.cityId : "austin";

export const useGame = create<GameState>((set, get) => ({
  screen: "title",
  cityId: savedCity,
  keys: { ...EMPTY_KEYS, ...saved?.keys },
  points: saved?.points ?? 0,
  brass: saved?.brass ?? 0,
  ink: saved?.ink ?? 0,
  vellum: saved?.vellum ?? 0,
  schematics: saved?.schematics ?? 0,
  pantry: saved?.pantry ?? {},
  charms: saved?.charms ?? [],
  equipped: saved?.equipped ?? null,
  scouts: saved?.scouts?.length ? saved.scouts : ["raccoon"],
  scout: saved?.scout ?? "raccoon",
  atlas: saved?.atlas ?? {},
  survey: saved?.survey ?? {},
  vaults: saved?.vaults ?? {},
  mapKeys: saved?.mapKeys?.length ? saved.mapKeys : seedKeys(savedCity),
  run: saved?.run ?? placeRun(savedCity),
  stack: saved?.stack ?? placeRun(savedCity),
  contract: saved?.contract ?? null,
  streak: saved?.streak ?? 0,
  bestStreak: saved?.bestStreak ?? 0,
  vaultsOpened: saved?.vaultsOpened ?? 0,
  correctByTier: { ...EMPTY_CORRECT, ...saved?.correctByTier },
  distanceM: saved?.distanceM ?? 0,
  lastCrateDay: saved?.lastCrateDay ?? "",
  crateStreak: saved?.crateStreak ?? 0,
  lastPulseDay: typeof saved?.lastPulseDay === "string" ? saved.lastPulseDay : "",
  sparkDay: saved?.sparkDay ?? "",
  sparkN: saved?.sparkN ?? 0,
  sparkLamps: saved?.sparkLamps ?? [],
  charmDay: typeof saved?.charmDay === "string" ? saved.charmDay : "",
  charmTopics: Array.isArray(saved?.charmTopics) ? saved.charmTopics : [],
  blanks: Array.isArray(saved?.blanks) ? saved.blanks : [],
  streetSpread: Boolean(saved?.streetSpread),
  tutorial: saved?.howtoDone ? (saved.tutorial ?? 4) : 0,
  howtoDone: saved?.howtoDone === true,
  asked: saved?.asked ?? [],
  seenIds: Array.isArray(saved?.seenIds) ? saved.seenIds : [],
  saveId: typeof saved?.saveId === "string" && saved.saveId ? saved.saveId : mintSaveId(),
  plates: Array.isArray(saved?.plates) ? saved.plates.slice(-PLATE_KEEP) : [],
  plateAgg: { ...emptyAgg(), ...(saved?.plateAgg ?? {}) },
  plateRoll: saved?.plateRoll && typeof saved.plateRoll === "object" ? saved.plateRoll : {},
  sessionAt: Date.now(),
  lastKeyAt: Date.now(),
  fares: saved?.fares ?? 0,
  cityVaults: saved?.cityVaults ?? 0,
  journey: saved?.journey ?? null,
  landAtStation: Boolean(saved?.landAtStation),
  pressPass: saved?.pressPass ?? 0,
  loot: null,
  miss: null,
  openVault: null,
  hqOpen: false,
  invOpen: false,
  shopOpen: false,
  toast: null,
  fireworks: null,
  hud: {
    nearestId: null,
    nearestDist: 99999,
    speed: 0,
    yaw: 0,
    stamina: 1,
    night: 0.2,
    waypoint: null,
    seated: false,
    deskName: "",
    deskDist: 99999,
    aimDeg: 0,
  },

  setScreen: (s) => {
    const hint =
      s === "play" && pulseDue(get().lastPulseDay, today()) && get().screen !== "play"
        ? "City Pulse is waiting in HQ · Ledger."
        : get().toast;
    set({ screen: s, toast: hint });
    if (s === "play") paySurvey(set, get);
    if (hint && hint.includes("City Pulse")) {
      window.setTimeout(() => {
        if (get().toast?.includes("City Pulse")) set({ toast: null });
      }, 2800);
    }
    scheduleSave(get);
  },
  pickCity: (id) => {
    if (get().journey) {
      get().tickJourney();
      if (get().journey) return;
    }
    const prev = get();
    const same = prev.cityId === id && prev.mapKeys.length;
    set({
      cityId: id,
      screen: "play",
      mapKeys: same ? prev.mapKeys : seedKeys(id),
      run: same && prev.run ? prev.run : placeRun(id),
      stack: same && prev.stack ? prev.stack : placeRun(id),
      contract: same && prev.contract ? prev.contract : seedContract(id),
      openVault: null,
      hqOpen: false,
      invOpen: false,
      shopOpen: false,
      loot: null,
      miss: null,
      sessionAt: Date.now(),
      lastKeyAt: Date.now(),
      landAtStation: false,
      blanks: same && prev.cityId === id ? prev.blanks : [],
      streetSpread: same && prev.cityId === id ? prev.streetSpread : false,
    });
    paySurvey(set, get);
    scheduleSave(get);
  },
  setHud: (h) => set({ hud: { ...get().hud, ...h } }),
  addDistance: (m) => {
    const distanceM = get().distanceM + m;
    const tutorial = get().tutorial === 0 && distanceM >= 25 ? 1 : get().tutorial;
    set({ distanceM, tutorial });
    paySurvey(set, get);
  },
  stampPlaces: (ids) => {
    const atlas = { ...get().atlas };
    let n = 0;
    let name: string | null = null;
    for (const id of ids) {
      if (atlas[id]) continue;
      atlas[id] = true;
      n += 1;
      if (!name) name = poiName(id);
    }
    if (!n) return;
    sfx.ui();
    const msg = n === 1 ? `Stamped · ${name}` : `Stamped ${n} marks`;
    set({ atlas });
    if (!paySurvey(set, get)) flashToast(set, get, msg, 1400);
    scheduleSave(get);
  },
  collectKey: (id) => {
    const k = get().mapKeys.find((x) => x.id === id);
    if (!k) return;
    const keys = { ...get().keys, [k.tier]: get().keys[k.tier] + 1 };
    sfx.pickup();
    set({
      keys,
      mapKeys: get().mapKeys.filter((x) => x.id !== id),
      lastKeyAt: Date.now(),
      toast: `${TIER_LABEL[k.tier]} match`,
    });
    scheduleSave(get);
    window.setTimeout(() => {
      if (get().toast?.includes("match")) set({ toast: null });
    }, 1400);
  },
  maybeSpawnKey: (now) => {
    const playMin = (now - get().sessionAt) / 60_000 + get().vaultsOpened * 0.35;
    const pocket = pocketStreet(get().keys);
    if (pocket >= 7) return;
    const cap = pocket >= 5 ? 3 : 5;
    const interval = Math.max(28_000, 78_000 - playMin * 900);
    if (get().mapKeys.length >= cap) return;
    if (now - get().lastKeyAt < interval) return;
    const r = Math.random();
    const tier: Tier = r < 0.78 ? "white" : r < 0.96 ? "blue" : "green";
    set({
      mapKeys: [...get().mapKeys, placeKey(get().cityId, tier)],
      lastKeyAt: now,
    });
    scheduleSave(get);
  },
  maybeSpawnRun: (now) => {
    const cityId = get().cityId;
    const patch: Partial<GameState> = {};
    const notes: string[] = [];
    for (const def of Object.values(SERIES)) {
      const live = seriesLive(get(), def.kind);
      if (live && live.readyAt === 0) continue;
      if (live && live.readyAt > now) continue;
      patch[def.kind] = placeRun(cityId);
      notes.push(live ? `${def.name} is back on the street.` : `${def.name} is up. ${def.kicker[0]!.toUpperCase()}${def.kicker.slice(1)} match.`);
    }
    if (!notes.length) return;
    sfx.ui();
    set({ ...patch, toast: notes[0]! });
    scheduleSave(get);
    window.setTimeout(() => {
      const t = get().toast;
      if (t && notes.some((n) => t.startsWith(n.slice(0, 12)))) set({ toast: null });
    }, 2400);
  },
  seedBlanks: (list) => {
    if (get().blanks.length) return;
    if (!list.length) return;
    set({ blanks: list });
    scheduleSave(get);
  },
  spreadDrops: (keys, run, stack) => {
    if (get().streetSpread) return;
    set({ mapKeys: keys, run, stack, streetSpread: true });
    scheduleSave(get);
  },
  tryOpen: (poiId, now) => {
    const city = CITIES[get().cityId];
    const series = seriesOf(poiId);
    const poi = series ? seriesPoi(series) : allPois(city, get().blanks).find((p) => p.id === poiId);
    if (!poi) return "No lamp.";
    if (isScoutShop(poi)) {
      sfx.open();
      set({
        shopOpen: true,
        hqOpen: false,
        invOpen: false,
        openVault: null,
        loot: null,
        miss: null,
      });
      return null;
    }
    if (series) {
      const live = seriesLive(get(), series.kind);
      if (!live || live.readyAt > Date.now()) return `${series.name} is recasting.`;
      if (get().keys[series.cost] < 1) return `Need a ${TIER_LABEL[series.cost]} match.`;
      sfx.open();
      set({
        openVault: {
          poiId: series.id,
          startedAt: now,
          question: null,
          category: null,
          deadline: now,
          run: { step: 0, steps: series.steps, grades: [], spent: false },
        },
        hqOpen: false,
        invOpen: false,
        shopOpen: false,
        loot: null,
        miss: null,
      });
      return null;
    }
    const v = get().vaults[poiId];
    const clock = Date.now();
    if (v && v.state === "cooling" && v.coolUntil > clock) return "This lamp is recasting.";
    if (get().keys[poi.tier] < 1) {
      const spark = sparksNow(get);
      if (spark.sparkN >= SPARK_DAY) return `Need a ${TIER_LABEL[poi.tier]} match. Sparks are spent today.`;
      if (spark.sparkLamps.includes(poiId)) return `Need a ${TIER_LABEL[poi.tier]} match. This wick already sparked.`;
      sfx.open();
      set({
        openVault: { poiId, startedAt: now, question: null, category: null, deadline: now, spark: true },
        hqOpen: false,
        invOpen: false,
        shopOpen: false,
        loot: null,
        miss: null,
      });
      return null;
    }
    sfx.open();
    set({
      openVault: { poiId, startedAt: now, question: null, category: null, deadline: now },
      hqOpen: false,
      invOpen: false,
      shopOpen: false,
      loot: null,
      miss: null,
    });
    return null;
  },
  pickCategory: (cat, now) => {
    const ov = get().openVault;
    if (!ov || ov.question) return;
    const city = CITIES[get().cityId];
    const series = seriesOf(ov.poiId);
    const poi = series ? seriesPoi(series) : allPois(city, get().blanks).find((p) => p.id === ov.poiId);
    const extra = (get().equipped === "scholar" ? 3000 : 0) + (get().pressPass > 0 ? 5000 : 0) + (wornPerk(get().scout).vaultMs ?? 0);
    const want: TriviaDiff | undefined = series ? series.diffs[ov.run?.step ?? 0] : undefined;
    if (series) {
      if (get().keys[series.cost] < 1) {
        set({ toast: `Need a ${TIER_LABEL[series.cost]} match.`, openVault: null });
        return;
      }
    }
    sfx.ui();
    const spark = Boolean(ov.spark);
    const keys = series && !spark ? { ...get().keys, [series.cost]: get().keys[series.cost] - 1 } : get().keys;
    const pressPass = !spark && extra >= 5000 && get().pressPass > 0 ? get().pressPass - 1 : get().pressPass;
    set({
      keys,
      pressPass,
      openVault: {
        poiId: ov.poiId,
        category: cat,
        question: shuffled(pickTrivia(city.id, cat, poi, poi?.tier, [...get().seenIds, ...get().asked], want)),
        startedAt: now,
        deadline: now + (spark ? 20000 : 25000) + (spark ? (get().equipped === "scholar" ? 3000 : 0) : extra),
        run: series ? { step: 0, steps: series.steps, grades: [], spent: true } : undefined,
        spark,
      },
    });
    if (series) scheduleSave(get);
  },
  answer: (choice, now) => {
    const ov = get().openVault;
    if (!ov?.question) return;
    const city = CITIES[get().cityId];
    const series = seriesOf(ov.poiId);
    const poi = series ? seriesPoi(series) : allPois(city, get().blanks).find((p) => p.id === ov.poiId);
    if (!poi) return;
    const elapsed = now - ov.startedAt;
    const correct = choice === ov.question.answer;
    const asked = [...get().asked.filter((x) => x !== ov.question!.q), ov.question.q].slice(-ASKED_KEEP);
    const seenIds = ov.question.id
      ? [...get().seenIds.filter((x) => x !== ov.question!.id), ov.question.id].slice(-ASKED_KEEP)
      : get().seenIds;
    const logged = logPlate(get, ov, now, correct);

    if (ov.spark) {
      const spark = sparksNow(get);
      const used = {
        sparkDay: spark.sparkDay,
        sparkN: spark.sparkN + 1,
        sparkLamps: spark.sparkLamps.includes(ov.poiId) ? spark.sparkLamps : [...spark.sparkLamps, ov.poiId],
      };
      if (!correct) {
        sfx.wrong();
        const boost = rollBoosts(get, false, elapsed, ov.category);
        set({
          ...used,
          streak: 0,
          charmDay: boost.charmDay,
          charmTopics: boost.charmTopics,
          asked,
          seenIds,
          ...logged,
          openVault: null,
          loot: null,
          miss: { answer: ov.question.answer, fact: ov.question.fact },
          toast: "The spark dies.",
        });
        scheduleSave(get);
        return;
      }
      const have = get().keys[poi.tier] ?? 0;
      const cap = matchCap(poi.tier);
      const correctByTier = bumpCorrect(get, poi.tier);
      const boost = rollBoosts(get, true, elapsed, ov.category);
      if (have >= cap) {
        sfx.correct();
        const paid = payBoosts(get().keys, get().points + 12, boost);
        set({
          ...used,
          ...bumpStreak(get),
          asked,
          seenIds,
          ...logged,
          keys: paid.keys,
          points: paid.points,
          charmDay: paid.charmDay,
          charmTopics: paid.charmTopics,
          openVault: null,
          loot: null,
          miss: null,
          correctByTier,
          toast: paid.boosts.length
            ? `Pocket full. The spark paid in coin. ${paid.boosts.join(" · ")}.`
            : "Pocket full. The spark paid in coin.",
        });
      } else {
        sfx.correct();
        const paid = payBoosts({ ...get().keys, [poi.tier]: have + 1 }, get().points, boost);
        set({
          ...used,
          keys: paid.keys,
          points: paid.points,
          ...bumpStreak(get),
          asked,
          seenIds,
          ...logged,
          charmDay: paid.charmDay,
          charmTopics: paid.charmTopics,
          openVault: null,
          loot: null,
          miss: null,
          correctByTier,
          toast: paid.boosts.length
            ? `A ${TIER_LABEL[poi.tier]} match from the wick. ${paid.boosts.join(" · ")}.`
            : `A ${TIER_LABEL[poi.tier]} match from the wick.`,
        });
      }
      scheduleSave(get);
      window.setTimeout(() => {
        const t = get().toast;
        if (t && (t.includes("wick") || t.includes("spark") || t.includes("Pocket"))) set({ toast: null });
      }, 2200);
      return;
    }

    if (series) {
      const step = ov.run?.step ?? 0;
      const steps = ov.run?.steps ?? series.steps;
      if (!correct) {
        sfx.wrong();
        const boost = rollBoosts(get, false, elapsed, ov.category);
        set({
          streak: 0,
          charmDay: boost.charmDay,
          charmTopics: boost.charmTopics,
          asked,
          seenIds,
          ...logged,
          openVault: null,
          loot: null,
          miss: { answer: ov.question.answer, fact: ov.question.fact },
          ...seriesPatch(series.kind, coolSeries(get(), series)),
          toast: `${series.name} breaks on trivia card ${step + 1}.`,
        });
        scheduleSave(get);
        return;
      }
      let grade: LootDrop["grade"] = "good";
      if (elapsed <= 3000) grade = "perfect";
      else if (elapsed <= 10000) grade = "great";
      const grades = [...(ov.run?.grades ?? []), grade];
      const extra = get().equipped === "scholar" ? 3000 : 0;
      if (step + 1 < steps && ov.category) {
        const want = series.diffs[step + 1];
        if (grade === "perfect") sfx.perfect();
        else sfx.correct();
        const correctByTier = bumpCorrect(get, series.cost);
        const boost = rollBoosts(get, true, elapsed, ov.category);
        const paid = payBoosts(get().keys, get().points, boost);
        set({
          asked,
          seenIds,
          ...logged,
          ...bumpStreak(get),
          keys: paid.keys,
          points: paid.points,
          charmDay: paid.charmDay,
          charmTopics: paid.charmTopics,
          correctByTier,
          toast: paid.boosts.length ? paid.boosts.join(" · ") : null,
          openVault: {
            poiId: series.id,
            category: ov.category,
            question: shuffled(pickTrivia(city.id, ov.category, poi, poi.tier, [...seenIds, ...asked], want)),
            startedAt: now,
            deadline: now + 25000 + extra,
            run: { step: step + 1, steps, grades, spent: true },
          },
        });
        postClear(series.cost);
        scheduleSave(get);
        if (paid.boosts.length) {
          const line = paid.boosts.join(" · ");
          window.setTimeout(() => {
            if (get().toast === line) set({ toast: null });
          }, 2200);
        }
        return;
      }
      let mult = 0.4;
      if (grades.every((g) => g === "perfect")) mult = 1;
      else if (grades.filter((g) => g === "perfect" || g === "great").length >= 2) mult = 0.75;
      else if (grades.some((g) => g === "great" || g === "perfect")) mult = 0.55;
      const bumped = bumpStreak(get);
      const streak = bumped.streak;
      const bonus = 1 + Math.min(0.4, streak * 0.05);
      const points = rewardPoints(series.pay, {
        mult,
        bonus,
        loot: wornPerk(get().scout).loot ?? 1,
        series: true,
      });
      const extraKeys: Partial<Record<Tier, number>> = { [series.pay]: 1 };
      if (grades.every((g) => g === "perfect")) extraKeys[series.bonus] = 1;
      else if (get().equipped === "lucky" && Math.random() < 0.15) extraKeys.blue = 1;
      const brass = series.kind === "stack" ? 6 : 4;
      const ink = series.kind === "stack" ? 4 : 3;
      const vellum = series.kind === "stack" ? 3 : 2;
      const schematic = grades.every((g) => g === "perfect") || Math.random() < (series.kind === "stack" ? 0.28 : 0.2);
      const ing = rollIngredient(get().cityId, { id: series.id, tier: series.cost });
      const pantry = ing ? addIngredient(get().pantry, ing) : get().pantry;
      const loot: LootDrop = {
        points,
        grade: grades.includes("perfect") ? "perfect" : grades.includes("great") ? "great" : "good",
        diff: 3,
        keys: extraKeys,
        brass,
        ink,
        vellum,
        schematic,
        ingredient: ing ? { id: ing, name: ingredientName(ing) } : undefined,
      };
      let nextKeys = { ...get().keys };
      for (const [t, n] of Object.entries(extraKeys) as [Tier, number][]) nextKeys[t] += n;
      const surveyHit = takeSurvey({
        atlas: get().atlas,
        distanceM: get().distanceM,
        survey: get().survey,
        keys: nextKeys,
      });
      if (surveyHit) nextKeys = surveyHit.keys;
      const boost = rollBoosts(get, true, elapsed, ov.category);
      const paid = payBoosts(nextKeys, get().points + loot.points, boost);
      if (paid.whiteAdded) extraKeys.white = (extraKeys.white ?? 0) + paid.whiteAdded;
      loot.keys = extraKeys;
      loot.points = paid.points - get().points;
      loot.boosts = paid.boosts.length ? paid.boosts : undefined;
      if (loot.grade === "perfect") sfx.perfect();
      else sfx.correct();
      const bonusHit = Boolean(extraKeys[series.bonus]);
      const correctByTier = bumpCorrect(get, series.cost);
      const clearLine = bonusHit
        ? `${series.name} is clear. ${TIER_LABEL[series.pay]} and ${TIER_LABEL[series.bonus]} matches.`
        : `${series.name} is clear. ${TIER_LABEL[series.pay]} match.`;
      const ingLine = ing ? `${ingredientName(ing)} for the press.` : null;
      set({
        keys: paid.keys,
        points: paid.points,
        brass: get().brass + brass,
        ink: get().ink + ink,
        vellum: get().vellum + vellum,
        schematics: get().schematics + (schematic ? 1 : 0),
        pantry,
        survey: surveyHit?.survey ?? get().survey,
        ...bumped,
        charmDay: paid.charmDay,
        charmTopics: paid.charmTopics,
        vaultsOpened: get().vaultsOpened + 1,
        correctByTier,
        asked,
        seenIds,
        ...logged,
        openVault: null,
        loot,
        miss: null,
        ...seriesPatch(series.kind, coolSeries(get(), series)),
        toast: [paid.boosts.length ? `${clearLine} ${paid.boosts.join(" · ")}.` : clearLine, ingLine].filter(Boolean).join(" "),
        tutorial: Math.max(get().tutorial, 2),
      });
      postClear(series.cost);
      scheduleSave(get);
      return;
    }

    const keys = { ...get().keys, [poi.tier]: get().keys[poi.tier] - 1 };
    if (!correct) {
      sfx.wrong();
      const boost = rollBoosts(get, false, elapsed, ov.category);
      set({
        keys,
        streak: 0,
        charmDay: boost.charmDay,
        charmTopics: boost.charmTopics,
        asked,
        seenIds,
        ...logged,
        openVault: null,
        loot: null,
        miss: { answer: ov.question.answer, fact: ov.question.fact },
        toast: null,
      });
      scheduleSave(get);
      return;
    }
    let grade: LootDrop["grade"] = "good";
    let mult = 0.4;
    if (elapsed <= 3000) {
      grade = "perfect";
      mult = 1;
    } else if (elapsed <= 10000) {
      grade = "great";
      mult = 0.7;
    }
    const bumped = bumpStreak(get);
    const streak = bumped.streak;
    const bonus = 1 + Math.min(0.4, streak * 0.05);
    const diff = ov.question.diff ?? 2;
    const points = rewardPoints(poi.tier, {
      mult,
      bonus,
      diffMult: DIFF_MULT[diff],
      loot: wornPerk(get().scout).loot ?? 1,
    });
    const brass =
      1 +
      (poi.tier === "green" || poi.tier === "amber" ? 2 : 0) +
      (poi.tier === "red" ? 4 : 0) +
      (diff === 3 ? 2 : 0);
    const ink = poi.kind === "museum" || poi.kind === "library" || poi.kind === "theatre" ? 2 : 1;
    const vellum = poi.kind === "park" || poi.kind === "campus" ? 2 : Math.random() < 0.4 ? 1 : 0;
    const schematic = poi.tier === "amber" || poi.tier === "red" || poi.tier === "violet" || (poi.tier !== "white" && Math.random() < 0.08);
    const ing = rollIngredient(get().cityId, poi);
    const pantry = ing ? addIngredient(get().pantry, ing) : get().pantry;
    const extraKeys: Partial<Record<Tier, number>> = {};
    if (get().equipped === "lucky" && Math.random() < 0.15) extraKeys[poi.tier] = 1;
    if (grade === "perfect" && Math.random() < 0.1) extraKeys.blue = (extraKeys.blue ?? 0) + 1;

    const loot: LootDrop = {
      points,
      grade,
      diff,
      keys: extraKeys,
      brass,
      ink,
      vellum,
      schematic,
      ingredient: ing ? { id: ing, name: ingredientName(ing) } : undefined,
    };
    let nextKeys = { ...keys };
    for (const [t, n] of Object.entries(extraKeys) as [Tier, number][]) {
      nextKeys[t] += n;
    }
    const atlas = { ...get().atlas, [poi.id]: true as const };
    const surveyHit = takeSurvey({
      atlas,
      distanceM: get().distanceM,
      survey: get().survey,
      keys: nextKeys,
    });
    const survey = surveyHit?.survey ?? get().survey;
    if (surveyHit) nextKeys = surveyHit.keys;
    const boost = rollBoosts(get, true, elapsed, ov.category);
    const paid = payBoosts(nextKeys, get().points + points, boost);
    nextKeys = paid.keys;
    if (paid.whiteAdded) extraKeys.white = (extraKeys.white ?? 0) + paid.whiteAdded;
    loot.keys = extraKeys;
    loot.points = paid.points - get().points;
    loot.boosts = paid.boosts.length ? paid.boosts : undefined;
    const coolMs =
      poi.tier === "white" ? 90_000 : poi.tier === "blue" ? 140_000 : poi.tier === "green" ? 220_000 : 400_000;
    const vaults = { ...get().vaults, [poi.id]: { state: "cooling" as const, coolUntil: Date.now() + coolMs } };
    let contract = get().contract;
    let contractToast: string | null = null;
    if (contract && contract.ids.includes(poi.id) && !contract.done.includes(poi.id)) {
      const done = [...contract.done, poi.id];
      contract = { ...contract, done };
      if (done.length >= contract.ids.length) {
        nextKeys.amber += 1;
        loot.points += 1500;
        contractToast = "Contract complete. Amber match issued.";
        contract = seedContract(get().cityId);
      }
    }
    let fares = get().fares;
    let cityVaults = get().cityVaults + 1;
    let fareToast: string | null = null;
    if (fares < FARES_CAP && cityVaults >= VAULTS_PER_FARE) {
      fares += 1;
      cityVaults = 0;
      fareToast = fares === 1
        ? `A fare printed. Walk to ${fareDesk(CITIES[get().cityId]).name} and punch it.`
        : `Another fare. Two is the pocket. ${fareDesk(CITIES[get().cityId]).name} still punches.`;
    }
    if (grade === "perfect") sfx.perfect();
    else sfx.correct();
    const correctByTier = bumpCorrect(get, poi.tier);
    const boostLine = paid.boosts.length ? paid.boosts.join(" · ") : null;
    const ingLine = ing ? `${ingredientName(ing)} for the press.` : null;
    set({
      keys: nextKeys,
      points: get().points + loot.points,
      brass: get().brass + brass,
      ink: get().ink + ink,
      vellum: get().vellum + vellum,
      schematics: get().schematics + (schematic ? 1 : 0),
      pantry,
      atlas,
      survey,
      vaults,
      contract,
      fares,
      cityVaults,
      ...bumped,
      charmDay: paid.charmDay,
      charmTopics: paid.charmTopics,
      vaultsOpened: get().vaultsOpened + 1,
      correctByTier,
      asked,
      seenIds,
      ...logged,
      openVault: null,
      loot,
      miss: null,
      toast: [contractToast, fareToast, surveyHit?.message, boostLine, ingLine].filter(Boolean).join(" ") || null,
      tutorial: Math.max(get().tutorial, 2),
    });
    postClear(poi.tier);
    scheduleSave(get);
  },
  closeVault: () => {
    const ov = get().openVault;
    const series = ov ? seriesOf(ov.poiId) : null;
    if (series && ov?.run?.spent) {
      sfx.wrong();
      set({
        openVault: null,
        ...seriesPatch(series.kind, coolSeries(get(), series)),
        toast: `Walked from ${series.name}. The match is spent.`,
        streak: 0,
      });
      scheduleSave(get);
      window.setTimeout(() => {
        if (get().toast?.includes(series.name)) set({ toast: null });
      }, 2000);
      return;
    }
    set({ openVault: null });
  },
  closeShop: () => set({ shopOpen: false }),
  claimCrate: () => {
    const d = today();
    if (get().lastCrateDay === d) return;
    const day = nextCrateStreak(get().lastCrateDay, get().crateStreak, d);
    const loot = crateLoot(day);
    const keys = { ...get().keys };
    (Object.keys(loot) as Tier[]).forEach((t) => {
      keys[t] = (keys[t] ?? 0) + (loot[t] ?? 0);
    });
    sfx.pickup();
    set({
      lastCrateDay: d,
      crateStreak: day,
      keys,
      toast: `Day ${day} crate. ${crateLine(loot)}.`,
    });
    scheduleSave(get);
    window.setTimeout(() => {
      if (get().toast?.includes("crate")) set({ toast: null });
    }, 2400);
  },
  claimPulse: () => {
    const d = today();
    if (!pulseDue(get().lastPulseDay, d)) return;
    sfx.pickup();
    set({
      lastPulseDay: d,
      points: get().points + PULSE_POINTS,
      toast: `City Pulse filed. ${PULSE_POINTS} coin.`,
    });
    scheduleSave(get);
    window.setTimeout(() => {
      if (get().toast?.includes("City Pulse")) set({ toast: null });
    }, 2200);
  },
  bankUp: (tier) => {
    const spec = bankUpSpec(tier);
    if (!spec) return;
    const next = applyBank(get().keys, spec, matchCap);
    if (!next) {
      set({ toast: "The bank won't take that pocket." });
      window.setTimeout(() => set({ toast: null }), 1600);
      return;
    }
    sfx.pickup();
    set({ keys: next, toast: `Four ${TIER_LABEL[spec.pay]} for one ${TIER_LABEL[spec.get]}. Tax paid.` });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 2000);
  },
  bankDown: (tier) => {
    const spec = bankDownSpec(tier);
    if (!spec) return;
    const next = applyBank(get().keys, spec, matchCap);
    if (!next) {
      set({ toast: "The bank won't take that pocket." });
      window.setTimeout(() => set({ toast: null }), 1600);
      return;
    }
    sfx.pickup();
    set({ keys: next, toast: `One ${TIER_LABEL[spec.pay]} for three ${TIER_LABEL[spec.get]}. No tax.` });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 2000);
  },
  craft: (id) => {
    if (get().charms.includes(id)) return;
    const c = CHARMS[id];
    const s = get();
    const press = spendIngredient(s.cityId, s.pantry);
    if (s.brass < c.cost.brass || s.ink < c.cost.ink || s.vellum < c.cost.vellum || s.schematics < c.cost.schematic || !press) {
      const staple = ingredientName(rollIngredient(s.cityId, { id: "press", tier: "green" }) ?? "pecan");
      set({ toast: press ? "Need more stock." : `Need more stock. Print wants a ${staple} from a green vault or higher.` });
      window.setTimeout(() => set({ toast: null }), 1800);
      return;
    }
    sfx.craft();
    set({
      brass: s.brass - c.cost.brass,
      ink: s.ink - c.cost.ink,
      vellum: s.vellum - c.cost.vellum,
      schematics: s.schematics - c.cost.schematic,
      pantry: { ...s.pantry, [press]: (s.pantry[press] ?? 1) - 1 },
      charms: [...s.charms, id],
      equipped: s.equipped ?? id,
      toast: `Printed ${c.name}.`,
    });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 1600);
  },
  equip: (id) => {
    set({ equipped: id });
    scheduleSave(get);
  },
  buyScout: (id) => {
    if (get().scouts.includes(id)) {
      set({ scout: id });
      scheduleSave(get);
      return;
    }
    const s = SCOUTS[id];
    if (!s.coins) {
      set({ scout: id, scouts: Array.from(new Set([...get().scouts, id])) });
      scheduleSave(get);
      return;
    }
    if (get().points < s.coins) {
      set({ toast: "Need more coins." });
      window.setTimeout(() => set({ toast: null }), 1400);
      return;
    }
    sfx.craft();
    set({
      points: get().points - s.coins,
      scouts: [...get().scouts, id],
      scout: id,
      toast: s.perk.label ? `${s.name} hired. ${s.perk.label}` : `${s.name} hired.`,
    });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 1800);
  },
  wearScout: (id) => {
    if (!get().scouts.includes(id)) return;
    const s = SCOUTS[id];
    set({ scout: id, toast: s.perk.label });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 1600);
  },
  buyKiosk: (id) => {
    const item = KIOSK[id];
    if (get().points < item.cost) {
      flashToast(set, get, "Short on coin.", 1600);
      return;
    }
    if (id === "tinder" || id === "wick") {
      const tier: Tier = id === "wick" ? "blue" : "white";
      const add = id === "tinder" ? 2 : 1;
      const have = get().keys[tier] ?? 0;
      const room = Math.max(0, matchCap(tier) - have);
      const n = Math.min(add, room);
      if (n < 1) {
        flashToast(set, get, "That pocket is full.", 1600);
        return;
      }
      sfx.craft();
      set({
        points: get().points - item.cost,
        keys: { ...get().keys, [tier]: have + n },
      });
      flashToast(set, get, n === 1 ? `${TIER_LABEL[tier]} match from the desk.` : `Two white matches from the desk.`, 2200);
      scheduleSave(get);
      return;
    }
    if (id === "fare") {
      if (get().fares >= FARES_CAP) {
        flashToast(set, get, "Two is the pocket.", 1600);
        return;
      }
      sfx.craft();
      set({ points: get().points - item.cost, fares: get().fares + 1 });
      flashToast(set, get, `A fare reprinted. Punch it at ${fareDesk(CITIES[get().cityId]).name}.`, 2400);
      scheduleSave(get);
      return;
    }
    if (id === "pass") {
      sfx.craft();
      set({ points: get().points - item.cost, pressPass: get().pressPass + 1 });
      flashToast(set, get, "Press pass. The next door holds five extra seconds.", 2200);
      scheduleSave(get);
      return;
    }
    if (id === "amber" || id === "oil") {
      const tier: Tier = id === "oil" ? "violet" : "amber";
      sfx.craft();
      set({
        points: get().points - item.cost,
        keys: { ...get().keys, [tier]: get().keys[tier] + 1 },
      });
      flashToast(set, get, `${TIER_LABEL[tier]} match from the desk.`, 2200);
      scheduleSave(get);
      return;
    }
    const city = CITIES[get().cityId];
    const unknown = city.pois.filter((p) => p.kind !== "shop" && !get().atlas[p.id]);
    if (!unknown.length) {
      flashToast(set, get, "Every lantern in this ward is named.", 2000);
      return;
    }
    const pick = unknown[Math.floor(Math.random() * unknown.length)]!;
    sfx.craft();
    set({
      points: get().points - item.cost,
      atlas: { ...get().atlas, [pick.id]: true as const },
    });
    flashToast(set, get, `Named · ${pick.name}.`, 2400);
    scheduleSave(get);
  },
  startContract: () => {
    set({ contract: seedContract(get().cityId) });
    scheduleSave(get);
  },
  toggleHq: (v) => {
    const next = v ?? !get().hqOpen;
    set({ hqOpen: next, invOpen: next ? false : get().invOpen, shopOpen: next ? false : get().shopOpen });
  },
  toggleInv: (v) => {
    const next = v ?? !get().invOpen;
    set({ invOpen: next, hqOpen: next ? false : get().hqOpen, shopOpen: next ? false : get().shopOpen });
  },
  dismissLoot: () => set({ loot: null, miss: null, toast: null }),
  skipTutorial: () => {
    set({ tutorial: 4, howtoDone: true });
    scheduleSave(get);
  },
  advanceTutorial: (n) => {
    const cur = get().tutorial;
    const next = Math.min(4, n == null ? cur + 1 : Math.max(cur, n));
    if (next === cur) return;
    set({ tutorial: next, howtoDone: next >= 3 ? true : get().howtoDone });
    scheduleSave(get);
  },
  replayTutorial: () => {
    set({ tutorial: 0, howtoDone: false, hqOpen: false, invOpen: false, shopOpen: false });
    scheduleSave(get);
  },
  resetCity: () => {
    const id = get().cityId;
    set({
      mapKeys: seedKeys(id),
      run: placeRun(id),
      stack: placeRun(id),
      contract: seedContract(id),
      vaults: {},
      blanks: [],
      streetSpread: false,
    });
    scheduleSave(get);
  },
  clearFireworks: () => set({ fireworks: null }),
  boardFare: (to) => {
    if (get().hud.seated) return "Park at the curb. The door is on foot.";
    if (to === get().cityId) return "You're already in this ward.";
    if (!CITIES[to]) return "No ward by that name.";
    if (get().fares < 1) return "Need a fare. Light lamps in this city.";
    if (get().journey) return "You're already on a train.";
    const now = Date.now();
    const arriveAt = now + fareMs(get().cityId, to);
    sfx.open();
    set({
      fares: get().fares - 1,
      journey: { from: get().cityId, to, departAt: now, arriveAt, openMs: 0, lastTickAt: now, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0 },
      screen: "ride",
      hqOpen: false,
      invOpen: false,
      shopOpen: false,
      openVault: null,
      loot: null,
      miss: null,
      toast: null,
    });
    scheduleSave(get);
    return null;
  },
  tickJourney: () => {
    const j = get().journey;
    if (!j) return;
    if (!CITIES[j.to]) {
      set({ journey: null });
      return;
    }
    const now = Date.now();
    const last = j.lastTickAt ?? j.departAt;
    const clipped = Math.min(now, j.arriveAt);
    const dt = Math.max(0, clipped - last);
    const watching =
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      get().screen === "ride";
    const openMs = (j.openMs ?? 0) + (watching ? dt : 0);
    const wallMs = Math.max(0, clipped - j.departAt);
    const due = transitLoot(wallMs, openMs);
    const have = {
      white: j.grantedWhite ?? 0,
      blue: j.grantedBlue ?? 0,
      green: j.grantedGreen ?? 0,
    };
    const keys = { ...get().keys };
    const add = {
      white: Math.min(Math.max(0, WHITE_POCKET - (keys.white ?? 0)), Math.max(0, due.white - have.white)),
      blue: Math.min(Math.max(0, BLUE_POCKET - (keys.blue ?? 0)), Math.max(0, due.blue - have.blue)),
      green: Math.min(Math.max(0, GREEN_POCKET - (keys.green ?? 0)), Math.max(0, due.green - have.green)),
    };
    const found = add.white + add.blue + add.green;
    keys.white += add.white;
    keys.blue += add.blue;
    keys.green += add.green;
    const nextJourney = {
      ...j,
      openMs,
      lastTickAt: clipped,
      grantedWhite: have.white + add.white,
      grantedBlue: have.blue + add.blue,
      grantedGreen: have.green + add.green,
    };
    if (found > 0) {
      sfx.pickup();
      if (now < j.arriveAt) {
        set({
          keys,
          journey: nextJourney,
          screen: "ride",
          hqOpen: false,
          invOpen: false,
          shopOpen: false,
          openVault: null,
        });
        flashToast(set, get, rideFindCopy(add), 2200);
        scheduleSave(get);
        return;
      }
      set({ keys, journey: nextJourney });
    } else if (now < j.arriveAt) {
      set({
        journey: nextJourney,
        screen: "ride",
        hqOpen: false,
        invOpen: false,
        shopOpen: false,
        openVault: null,
      });
      scheduleSave(get);
      return;
    }

    const destCity = CITIES[j.to];
    sfx.ui();
    const rideNote = found > 0 ? ` ${rideFindCopy(add)}` : "";
    set({
      journey: null,
      cityId: j.to,
      mapKeys: seedKeys(j.to),
      run: placeRun(j.to),
      stack: placeRun(j.to),
      contract: seedContract(j.to),
      cityVaults: 0,
      landAtStation: true,
      blanks: [],
      streetSpread: false,
      screen: "play",
      openVault: null,
      hqOpen: false,
      invOpen: false,
      shopOpen: false,
      loot: null,
      miss: null,
      sessionAt: Date.now(),
      lastKeyAt: Date.now(),
      toast: `${destCity.name}.${rideNote} Walk from ${fareDesk(destCity).name}.`,
    });
    scheduleSave(get);
    window.setTimeout(() => {
      const t = get().toast;
      if (t && t.startsWith(destCity.name)) set({ toast: null });
    }, 3200);
  },
}));

export function cityOf() {
  return CITIES[useGame.getState().cityId];
}

export function allCities() {
  return CITY_LIST;
}

export function reach() {
  const st = useGame.getState();
  return interactRadius(st.equipped === "lantern") * (wornPerk(st.scout).reach ?? 1);
}

if (typeof window !== "undefined") {
  if (import.meta.env.DEV) {
    (window as unknown as { __keyline: typeof useGame }).__keyline = useGame;
  }
  void fetchRetune()
    .then((pack) => {
      setRetune(pack?.overrides ?? {});
      setQuarantine(pack?.quarantine ?? []);
    })
    .catch(() => {
      /* local / unsigned — assigned rarity still stands */
    });
  const flush = () => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(persistable(useGame.getState())));
    } catch {
      /* ignore */
    }
  };
  window.addEventListener("visibilitychange", () => {
    if (document.hidden) flush();
  });
  window.addEventListener("pagehide", flush);
}

