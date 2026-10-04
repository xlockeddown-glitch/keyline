import { create } from "zustand";
import { CHARMS, CITIES, CITY_LIST, KIOSK, SCOUTS, SERIES, TIER_LABEL, allPois, interactRadius, isScoutShop, seriesOf, seriesPoi, wornPerk, type KioskId, type SeriesDef, type SeriesKind } from "./data";
import { streetDrop } from "./streets";
import { MARKET_MULT, MARKET_TAG, marketAt, marketMatches, marketMult, marketOverflowCoin, marketPay, onMarket, pointOnMarket } from "./nightMarket";
import { DIFF_MULT, ASKED_KEEP } from "./triviaMeta";
import { dealTrivia, gradeTrivia } from "./triviaApi";
import { SEEN_MAX, type DealInput, type GradeResult, type PublicCard } from "./triviaSchema";
import { poiName, takeSurvey } from "./survey";
import { migratePoiIds } from "./retired";
import { sfx } from "./audio";
import { legacyDailyPaid, markDailyPaid, payDaily } from "./dailyRun";
import { markFriendPaid, payFriend } from "./friendTicket";
import { emptyAgg, emitOnAnswer, mintSaveId, PLATE_KEEP, type PlateAgg, type PlateEvent, type PlateRollMap } from "./telemetry";
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
  VaultRuntime,
} from "./types";
import { crateLine, crateLoot, nextCrateStreak } from "./crate";
import { PULSE_POINTS, pulseDue } from "./pulse";
import { applyBank, bankDownSpec, bankUpSpec, rewardPoints } from "./rewards";
import { applyTriviaBoosts, creditWhite } from "./boosts";
import { BLUE_POCKET, FARES_CAP, GREEN_POCKET, SPARK_DAY, VAULTS_PER_FARE, WHITE_POCKET, fareDesk, fareMs, formatCool, lampCoolMs, matchCap, settleRide, sparkState, ticketHint } from "./ticket";
import { chooseRideGame, dealForRide, forfeitRound, loadRideHistory, markRound, openRound, pushRideHistory, rideGameFits, rideGameFor, rideRoundMs, type RideGameId, type RideOutcome } from "./rideGames";
import { cleanWardrobe, cosmetic, payIn, priceLine, wear, type CosmeticId, type CosmeticSlot, type Wardrobe } from "./cosmetics";
import { addIngredient, cityStaple, ingredientName, rollIngredient, spendIngredient, type IngredientId } from "./ingredients";
import { chooseStart, cleanUnlocks, freshUnlocks, goalsCheck, isUnlocked, lampLit, lockLine, migrateUnlocks, runFinished, unlockCity as unlockCityPass, type CityUnlocks } from "./cityPass";
import { buildWheel, caughtUpClaims, emptyWheelClaims, grantWheelPrize, owedTier, WHEEL_EVERY, type WheelOffer } from "./wheel";
import {
  claimCircuit,
  claimErrand,
  claimLong,
  grantScrap,
  hydrateQuests,
  noteAnswer,
  noteClear,
  notePrint,
  clothName,
  clothCoin,
  printPattern,
  rareExtra,
  type ClothId,
  type LongId,
  type QuestLog,
} from "./quests";

const SAVE_KEY = "keyline-save-v1";

/** Move a trivia card to the newest end of the seen history (oldest drop off at ASKED_KEEP). */
function markSeen(asked: string[], seenIds: string[], card: { q: string; id?: string }) {
  return {
    asked: [...asked.filter((x) => x !== card.q), card.q].slice(-ASKED_KEEP),
    seenIds: card.id ? [...seenIds.filter((x) => x !== card.id), card.id].slice(-ASKED_KEEP) : seenIds,
  };
}
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

/** 0.0.53: a dealt card as the browser holds it — prompt and shuffled choices, no answer (the server grades). */
export type DealtCard = PublicCard;

/** The server's grade of the open card, as `settleAnswer` applies it. */
type Graded = { correct: boolean; elapsed: number; reveal: string; fact?: string; credited: boolean };

type OpenVault = {
  poiId: string;
  startedAt: number;
  question: DealtCard | null;
  /** Signed pending-card token from the server deal; sent back with the answer. */
  token?: string;
  /** A server round trip is under way: dealing the card, or grading the answer. */
  pending?: "deal" | "grade";
  category: TriviaCat | null;
  deadline: number;
  run?: { step: number; steps: number; grades: LootDrop["grade"][]; spent: boolean };
  spark?: boolean;
  /** Wall clock (Date.now) when this trivia card was dealt — `startedAt` is performance.now(). The night market open then is the one that pays. */
  dealtAt?: number;
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
  quests: QuestLog;
  charms: CharmId[];
  equipped: CharmId | null;
  scouts: ScoutId[];
  scout: ScoutId;
  /** 0.0.45 print shop: cosmetic coats and lantern skins (owned, paid so far, worn). Purely visual. */
  wardrobe: Wardrobe;
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
  wheelClaimed: Record<Tier, number>;
  wheel: WheelOffer | null;
  distanceM: number;
  lastCrateDay: string;
  crateStreak: number;
  lastPulseDay: string;
  sparkDay: string;
  sparkN: number;
  sparkLamps: string[];
  /** Daily Lantern Run finishes already paid, as `day|city` keys (once per city per UTC day). */
  dailyPaid: string[];
  /** Friend-ticket whites already landed in this save ("s:<token>" sent, "f:<token>" answered), 0.0.50. */
  friendPaid: string[];
  /** 0.0.55 city unlocks: start city, unlocked cities, free second pick, city passes and per-route progress (cityPass.ts). */
  cities: CityUnlocks;
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
  /** Last few ride games dealt, oldest first; weights the next deal so games change up. */
  rideHistory: RideGameId[];
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
  /** 0.0.55: unlock a city with the free second pick or one city pass (train station). Null on success, else why not. */
  unlockCity: (id: CityId) => string | null;
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
  /** Apply a server-graded answer to the open card (rewards, streak, seen memory). Internal to the lamp flow. */
  settleAnswer: (out: Graded, now: number) => void;
  closeVault: () => void;
  claimCrate: () => void;
  claimPulse: () => void;
  /** Pay the Daily Lantern Run finish once per UTC day. Returns what landed, or null if already paid. */
  payDailyRun: (day: string, city: CityId) => { added: Partial<Record<Tier, number>>; coins: number } | null;
  /** Land server-confirmed friend-ticket whites (each id once per save). Returns the ids newly paid. */
  payFriendTickets: (ids: string[]) => { fresh: string[]; added: number; coins: number };
  bankUp: (tier: Tier) => void;
  bankDown: (tier: Tier) => void;
  craft: (id: CharmId) => void;
  equip: (id: CharmId | null) => void;
  claimErrand: () => void;
  claimCircuit: () => void;
  claimLong: (id: LongId) => void;
  wearCloth: (id: ClothId | null) => void;
  printPattern: () => void;
  buyScout: (id: ScoutId) => void;
  wearScout: (id: ScoutId) => void;
  /** Print shop: pay what the pocket can toward a coat or lantern skin; the last match makes it yours and puts it on. */
  payCosmetic: (id: CosmeticId) => void;
  /** Put an owned coat / lantern skin on, or take the slot off with null. */
  wearCosmetic: (slot: CosmeticSlot, id: CosmeticId | null) => void;
  /** Take the merged wardrobe back from the server (signed-in sync). */
  adoptWardrobe: (w: Wardrobe) => void;
  buyKiosk: (id: KioskId) => void;
  startContract: () => void;
  toggleHq: (v?: boolean) => void;
  toggleInv: (v?: boolean) => void;
  dismissLoot: () => void;
  claimWheel: () => void;
  skipTutorial: () => void;
  advanceTutorial: (n?: number) => void;
  replayTutorial: () => void;
  resetCity: () => void;
  clearFireworks: () => void;
  boardFare: (to: CityId) => string | null;
  tickJourney: () => void;
  /** Pick this ride's game (0.0.41). Stored on the ride so a reload and every screen agree. */
  chooseRideGame: (game: RideGameId) => void;
  /**
   * Start a ride-game round of `game` (default: the ride's current game) and store it as the pick.
   * Returns its length, or null if that game no longer fits before the platform.
   */
  startRideRound: (game?: RideGameId) => number | null;
  /** Bank a finished round (best outcome only) and pay what it newly earns. */
  finishRideRound: (outcome: RideOutcome) => { white: number; blue: number; green: number; owed: number };
  /** The player pressed Stop mid-round: forfeit it. Idle pay still stands. */
  dropRideRound: () => void;
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

/** While a night market is open, every other new street match drops along the market street. */
function marketKey(cityId: CityId, tier: Tier, now: number): MapKey | null {
  const m = marketAt(cityId, now);
  if (!m || Math.random() < 0.5) return null;
  const p = pointOnMarket(m.street);
  return { id: `k-${cityId}-m${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`, lat: p.lat, lng: p.lng, tier };
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

function streetKeyCap(pocket: number): number {
  return pocket >= 5 ? 5 : 8;
}

/** A little rarer the longer this session has been going. Violet stays off the curb. */
function streetKeyTier(playMin: number): Tier {
  const t = Math.min(90, Math.max(0, playMin));
  const weights: [Tier, number][] = [
    ["white", Math.max(0.22, 0.78 - t * 0.0055)],
    ["blue", 0.18 + t * 0.002],
    ["green", 0.04 + t * 0.0018],
    ["amber", t > 18 ? (t - 18) * 0.0014 : 0],
    ["red", t > 50 ? (t - 50) * 0.00045 : 0],
  ];
  const sum = weights.reduce((s, [, w]) => s + w, 0) || 1;
  let r = Math.random() * sum;
  for (const [tier, w] of weights) {
    r -= w;
    if (r <= 0) return tier;
  }
  return "white";
}

function seedKeys(cityId: CityId, n = 9): MapKey[] {
  const c = CITIES[cityId];
  const out: MapKey[] = [];
  const tiers: Tier[] = ["white", "blue", "white", "white", "blue", "white", "white", "blue", "white"];
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
    quests: s.quests,
    charms: s.charms,
    equipped: s.equipped,
    scouts: s.scouts,
    scout: s.scout,
    wardrobe: s.wardrobe,
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
    wheelClaimed: s.wheelClaimed,
    wheel: s.wheel,
    distanceM: s.distanceM,
    lastCrateDay: s.lastCrateDay,
    crateStreak: s.crateStreak,
    lastPulseDay: s.lastPulseDay,
    sparkDay: s.sparkDay,
    sparkN: s.sparkN,
    sparkLamps: s.sparkLamps,
    dailyPaid: s.dailyPaid,
    friendPaid: s.friendPaid,
    cities: s.cities,
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
    rideHistory: s.rideHistory,
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
    return migratePoiIds(data);
  } catch {
    return null;
  }
}

let saveTimer: number | null = null;
/**
 * Save within 400ms of the first change, writing whatever the state is then. A pending save is
 * not pushed back: the ride screen ticks every 250ms, and a resetting debounce never fired there.
 */
function scheduleSave(get: () => GameState) {
  if (typeof window === "undefined") return;
  if (saveTimer) return;
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(persistable(get())));
    } catch {
      /* private mode */
    }
  }, 400);
}

/** Write the save right away. Ride rounds use it so a reload can't land between round and save. */
function saveNow(get: () => GameState) {
  if (typeof window === "undefined") return;
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = null;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(persistable(get())));
  } catch {
    /* private mode */
  }
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
  if (add.blue) return `${list} match${parts.length > 1 || add.white > 1 ? "es" : ""} in the car.`;
  if (add.white === 1) return "White match. Left on the seat.";
  return `${add.white} white matches in the car.`;
}

function flashToast(set: (p: Partial<GameState>) => void, get: () => GameState, msg: string, ms = 2000) {
  set({ toast: msg });
  window.setTimeout(() => {
    if (get().toast === msg) set({ toast: null });
  }, ms);
}

function answered(get: () => GameState, correct: boolean, perfect: boolean) {
  return noteAnswer(get().quests, correct, perfect);
}

function cleared(get: () => GameState, base: QuestLog, poi: { id: string; tier: Tier }) {
  let quests = noteClear(base, { cityId: get().cityId, poiId: poi.id, tier: poi.tier });
  const extra = rareExtra(poi.tier, Math.random());
  let line: string | null = null;
  if (extra === "scrap") {
    const g = grantScrap(quests);
    quests = g.log;
    line = g.fresh ? "Road dust for the lantern." : null;
  } else if (extra === "pattern") {
    quests = { ...quests, patterns: quests.patterns + 1 };
    line = "A violet pattern for the press.";
  }
  return { quests, line };
}

function bumpCorrect(get: () => GameState, tier: Tier): Record<Tier, number> {
  const cur = get().correctByTier;
  return { ...cur, [tier]: (cur[tier] ?? 0) + 1 };
}

function foldWheel(get: () => GameState, tier: Tier): { correctByTier: Record<Tier, number>; wheel: WheelOffer | null } {
  const correctByTier = bumpCorrect(get, tier);
  const held = get().wheel;
  if (held) return { correctByTier, wheel: held };
  const n = correctByTier[tier] ?? 0;
  const claimed = get().wheelClaimed[tier] ?? 0;
  if (n > 0 && n % WHEEL_EVERY === 0 && Math.floor(n / WHEEL_EVERY) > claimed) {
    return { correctByTier, wheel: buildWheel(tier, get().cityId, Math.random()) };
  }
  return { correctByTier, wheel: held };
}

const DEAL_FAIL = "The lamp can't reach the card office. Check your connection and try again — no match spent.";
const SEEN_ID = /^[A-Za-z0-9_:.~-]{1,80}$/;

/**
 * 0.0.53: ask the server for a trivia card (triviaApi.dealTrivia). It picks from its own bank with this save's
 * seen ids (anti-repeat), the lamp's tier and topics, the Run/Stack step, and returns the prompt and shuffled
 * choices with a signed token — never the answer. Null when the server can't be reached (nothing is spent).
 */
async function dealCard(
  _set: (p: Partial<GameState>) => void,
  get: () => GameState,
  poiId: string,
  cat: TriviaCat,
  step: number,
): Promise<{ card: DealtCard; token: string; windowMs: number } | null> {
  const st = get();
  const city = CITIES[st.cityId];
  const series = seriesOf(poiId);
  const named = series ? null : city.pois.find((p) => p.id === poiId);
  const blank = series || named ? undefined : st.blanks.find((p) => p.id === poiId);
  if (!series && !named && !blank) return null;
  const spark = Boolean(st.openVault?.spark);
  const scholar = st.equipped === "scholar" ? 3000 : 0;
  const extra = scholar + (st.pressPass > 0 ? 5000 : 0) + (wornPerk(st.scout).vaultMs ?? 0);
  const windowMs = spark ? 20000 + scholar : step > 0 ? 25000 + scholar : 25000 + extra;
  const input: DealInput = {
    city: st.cityId,
    cat,
    poiId,
    blank: blank ? { name: blank.name.slice(0, 120), kind: blank.kind, tier: blank.tier } : undefined,
    step: series ? step : undefined,
    spark: spark || undefined,
    windowMs,
    seen: (st.seenIds ?? []).filter((x) => SEEN_ID.test(x)).slice(-SEEN_MAX),
    saveId: st.saveId,
  };
  try {
    const r = await dealTrivia({ data: input });
    return r.ok ? { card: r.card, token: r.token, windowMs: r.windowMs } : null;
  } catch {
    return null;
  }
}

/** 0.0.53: the server writes the rolls clear when it grades a right answer; the board just refreshes. */
function postClear(_tier: Tier) {
  if (typeof window !== "undefined") window.setTimeout(() => window.dispatchEvent(new Event("keyline-rolls")), 50);
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
  // 0.0.53: the server records a signed-in walker's plate event itself when it grades the card.
  void event;
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

/** The 0.0.43 single Lantern Run save (one run a day, any city) — names the city a legacy paid day belongs to. */
function legacyDailyRun(): { day?: unknown; city?: unknown; timeMs?: unknown } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("keyline-daily-v1");
    const p = raw ? (JSON.parse(raw) as unknown) : null;
    return p && typeof p === "object" ? (p as { day?: unknown; city?: unknown; timeMs?: unknown }) : null;
  } catch {
    return null;
  }
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
  quests: hydrateQuests(saved?.quests, savedCity),
  charms: saved?.charms ?? [],
  equipped: saved?.equipped ?? null,
  scouts: saved?.scouts?.length ? saved.scouts : ["raccoon"],
  scout: saved?.scout ?? "raccoon",
  wardrobe: cleanWardrobe(saved?.wardrobe),
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
  wheelClaimed:
    saved && saved.wheelClaimed
      ? { ...emptyWheelClaims(), ...saved.wheelClaimed }
      : caughtUpClaims({ ...EMPTY_CORRECT, ...saved?.correctByTier }),
  wheel: null,
  distanceM: saved?.distanceM ?? 0,
  lastCrateDay: saved?.lastCrateDay ?? "",
  crateStreak: saved?.crateStreak ?? 0,
  lastPulseDay: typeof saved?.lastPulseDay === "string" ? saved.lastPulseDay : "",
  sparkDay: saved?.sparkDay ?? "",
  sparkN: saved?.sparkN ?? 0,
  sparkLamps: saved?.sparkLamps ?? [],
  dailyPaid: Array.isArray(saved?.dailyPaid)
    ? saved.dailyPaid.filter((k): k is string => typeof k === "string")
    : legacyDailyPaid((saved as { dailyPaidDay?: unknown } | null | undefined)?.dailyPaidDay, legacyDailyRun()),
  friendPaid: Array.isArray(saved?.friendPaid) ? saved.friendPaid.filter((k): k is string => typeof k === "string") : [],
  // 0.0.55: no save = a new player (picks a start city); a save without unlocks is from before 0.0.55 and migrates.
  cities: saved ? (saved.cities ? cleanUnlocks(saved.cities) : migrateUnlocks(saved)) : freshUnlocks(),
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
  journey: saved?.journey ? forfeitRound(saved.journey) : null,
  rideHistory: loadRideHistory(saved?.rideHistory),
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
        ? "City Pulse is waiting in Journal · Progress."
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
    // 0.0.55: a new player's first pick is their start city; after that only unlocked cities can be entered.
    if (!get().cities.start) set({ cities: chooseStart(get().cities, id) });
    else if (!isUnlocked(get().cities, id)) {
      flashToast(set, get, `${CITIES[id]?.name ?? "That city"} is locked. ${lockLine(get().cities, id).replace(/^Locked · /, "")}`, 3200);
      return;
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
  unlockCity: (id) => {
    if (!CITIES[id]) return "No ward by that name.";
    const r = unlockCityPass(get().cities, id);
    if (!r) return isUnlocked(get().cities, id) ? `${CITIES[id].name} is already open.` : lockLine(get().cities, id);
    sfx.pickup();
    // Goals or Lantern Runs already finished in the new city count from the moment it opens.
    const goals = goalsCheck(r.u, id, get().atlas);
    set({ cities: goals.u });
    flashToast(set, get, `${CITIES[id].name} unlocked${r.paid === "free" ? " · your free second city" : " · 1 city pass spent"}.${goals.earned ? " Every place there already visited: city pass earned." : ""}`, 2800);
    saveNow(get);
    return null;
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
    const goals = goalsCheck(get().cities, get().cityId, atlas);
    const msg = goals.earned ? `Every place in ${CITIES[get().cityId].name} visited · city pass earned` : n === 1 ? `Visited · ${name}` : `Visited ${n} places`;
    set({ atlas, cities: goals.u });
    const surveyPaid = paySurvey(set, get);
    if (goals.earned) flashToast(set, get, msg, 2800);
    else if (!surveyPaid) flashToast(set, get, msg, 1400);
    scheduleSave(get);
  },
  collectKey: (id) => {
    const k = get().mapKeys.find((x) => x.id === id);
    if (!k) return;
    const mult = marketMult(get().cityId, Date.now(), { kind: "match", lat: k.lat, lng: k.lng });
    // A street match always lands (as before); the market's second one respects the pocket cap and pays coin if it's full.
    const add = mult > 1 ? marketMatches(get().keys[k.tier], Math.max(matchCap(k.tier), get().keys[k.tier] + 1), mult) : 1;
    const coin = mult > 1 ? marketOverflowCoin(k.tier, mult, add) : 0;
    const keys = { ...get().keys, [k.tier]: get().keys[k.tier] + add };
    sfx.pickup();
    set({
      keys,
      points: get().points + coin,
      mapKeys: get().mapKeys.filter((x) => x.id !== id),
      lastKeyAt: Date.now(),
      toast:
        mult > 1
          ? `${MARKET_TAG} · ${add} ${TIER_LABEL[k.tier]} match${add === 1 ? "" : "es"}${coin ? ` + ${coin} coin (pocket full)` : ""}`
          : `${TIER_LABEL[k.tier]} match`,
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
    const cap = streetKeyCap(pocket);
    const interval = Math.max(28_000, 78_000 - playMin * 900);
    if (get().mapKeys.length >= cap) return;
    if (now - get().lastKeyAt < interval) return;
    set({
      mapKeys: [...get().mapKeys, marketKey(get().cityId, streetKeyTier(playMin), now) ?? placeKey(get().cityId, streetKeyTier(playMin))],
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
    if (v && v.state === "cooling" && v.coolUntil > clock) return `This lamp is dark for ${formatCool(v.coolUntil - clock)}.`;
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
  pickCategory: (cat, _now) => {
    const ov = get().openVault;
    if (!ov || ov.question || ov.pending) return;
    const series = seriesOf(ov.poiId);
    if (series) {
      if (get().keys[series.cost] < 1) {
        set({ toast: `Need a ${TIER_LABEL[series.cost]} match.`, openVault: null });
        return;
      }
    }
    sfx.ui();
    set({ openVault: { ...ov, category: cat, pending: "deal" } });
    void dealCard(set, get, ov.poiId, cat, 0).then((dealt) => {
      const cur = get().openVault;
      if (!cur || cur.poiId !== ov.poiId || cur.pending !== "deal") return;
      if (!dealt) {
        set({ openVault: { ...cur, category: null, pending: undefined } });
        flashToast(set, get, DEAL_FAIL, 3200);
        return;
      }
      const spark = Boolean(cur.spark);
      const extra = (get().equipped === "scholar" ? 3000 : 0) + (get().pressPass > 0 ? 5000 : 0) + (wornPerk(get().scout).vaultMs ?? 0);
      const keys = series && !spark ? { ...get().keys, [series.cost]: get().keys[series.cost] - 1 } : get().keys;
      const pressPass = !spark && extra >= 5000 && get().pressPass > 0 ? get().pressPass - 1 : get().pressPass;
      // The wick starts when the card arrives, so the round trip never eats into the player's time.
      const shown = performance.now();
      set({
        keys,
        pressPass,
        openVault: {
          poiId: cur.poiId,
          category: cat,
          question: dealt.card,
          token: dealt.token,
          startedAt: shown,
          deadline: shown + dealt.windowMs,
          run: series ? { step: 0, steps: series.steps, grades: [], spent: true } : undefined,
          spark,
          dealtAt: Date.now(),
        },
      });
      if (series) scheduleSave(get);
    });
  },
  answer: (choice, now) => {
    const ov = get().openVault;
    if (!ov?.question || ov.pending) return;
    const token = ov.token;
    const timeout = choice === "__timeout__";
    const clientMs = Math.max(0, now - ov.startedAt);
    if (!token) return;
    set({ openVault: { ...ov, pending: "grade" } });
    const lost = () => {
      const cur = get().openVault;
      if (!cur || cur.token !== token) return;
      if (timeout || performance.now() >= cur.deadline) {
        // The wick is out and the lamp can't be reached: a miss (never a reward without the server's grade).
        set({ openVault: { ...cur, pending: undefined } });
        get().settleAnswer({ correct: false, elapsed: clientMs, reveal: "The lamp lost its line — no answer this time.", credited: false }, performance.now());
        return;
      }
      set({ openVault: { ...cur, pending: undefined } });
      flashToast(set, get, "The lamp lost its line. Tap your answer again.", 2600);
    };
    void gradeTrivia({ data: { token, choice: timeout ? null : choice, clientMs } })
      .then((res: GradeResult) => {
        const cur = get().openVault;
        if (!cur || cur.token !== token) return;
        if (!res.ok) return lost();
        set({ openVault: { ...cur, pending: undefined } });
        get().settleAnswer({ correct: res.correct, elapsed: res.elapsedMs, reveal: res.answer, fact: res.fact, credited: res.credited }, performance.now());
      })
      .catch(() => lost());
  },
  settleAnswer: (out, now) => {
    const ov = get().openVault;
    if (!ov?.question) return;
    const city = CITIES[get().cityId];
    const series = seriesOf(ov.poiId);
    const poi = series ? seriesPoi(series) : allPois(city, get().blanks).find((p) => p.id === ov.poiId);
    if (!poi) return;
    // 0.0.53: right/wrong and the answer time come from the server's grade (gradeTrivia), not the client.
    const elapsed = out.elapsed;
    const correct = out.correct;
    const { asked, seenIds } = markSeen(get().asked, get().seenIds, ov.question);
    const logged = logPlate(get, ov, ov.startedAt + elapsed, correct);

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
          miss: { answer: out.reveal, fact: out.fact },
          toast: "The spark dies.",
          quests: answered(get, false, false),
        });
        scheduleSave(get);
        return;
      }
      const have = get().keys[poi.tier] ?? 0;
      const cap = matchCap(poi.tier);
      const sparkMult = marketMult(city.id, ov.dealtAt ?? Date.now(), { kind: "lamp", poiId: poi.id, lat: poi.lat, lng: poi.lng });
      const sparkAdd = marketMatches(have, cap, sparkMult);
      const sparkCoin = sparkMult > 1 && have < cap ? marketOverflowCoin(poi.tier, sparkMult, sparkAdd) : 0;
      const sparkTag =
        sparkMult > 1
          ? `${MARKET_TAG}: ${sparkAdd} ${TIER_LABEL[poi.tier]} match${sparkAdd === 1 ? "" : "es"} from the wick${sparkCoin ? ` + ${sparkCoin} coin (pocket full)` : ""}.`
          : null;
      const spun = foldWheel(get, poi.tier);
      const boost = rollBoosts(get, true, elapsed, ov.category);
      const questHit = cleared(get, answered(get, true, elapsed <= 3000), poi);
      if (have >= cap) {
        sfx.correct();
        const paid = payBoosts(get().keys, get().points + 12 * sparkMult, boost);
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
          ...spun,
          toast: [
            sparkMult > 1 ? `Pocket full. The spark paid ${12 * sparkMult} coin. ${MARKET_TAG}.` : "Pocket full. The spark paid in coin.",
            paid.boosts.length ? `${paid.boosts.join(" · ")}.` : null,
          ]
            .filter(Boolean)
            .join(" "),
          quests: questHit.quests,
        });
      } else {
        sfx.correct();
        const paid = payBoosts({ ...get().keys, [poi.tier]: have + sparkAdd }, get().points + sparkCoin, boost);
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
          ...spun,
          toast: [
            sparkTag ?? (paid.boosts.length
              ? `A ${TIER_LABEL[poi.tier]} match from the wick. ${paid.boosts.join(" · ")}.`
              : `A ${TIER_LABEL[poi.tier]} match from the wick.`),
            sparkTag && paid.boosts.length ? `${paid.boosts.join(" · ")}.` : null,
            questHit.line,
          ]
            .filter(Boolean)
            .join(" "),
          quests: questHit.quests,
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
          miss: { answer: out.reveal, fact: out.fact },
          ...seriesPatch(series.kind, coolSeries(get(), series)),
          toast: `${series.name} breaks on trivia card ${step + 1}.`,
          quests: answered(get, false, false),
        });
        scheduleSave(get);
        return;
      }
      let grade: LootDrop["grade"] = "good";
      if (elapsed <= 3000) grade = "perfect";
      else if (elapsed <= 10000) grade = "great";
      const grades = [...(ov.run?.grades ?? []), grade];
      if (step + 1 < steps && ov.category) {
        if (grade === "perfect") sfx.perfect();
        else sfx.correct();
        const spun = foldWheel(get, series.cost);
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
          ...spun,
          toast: paid.boosts.length ? paid.boosts.join(" · ") : null,
          quests: answered(get, true, grade === "perfect"),
          openVault: {
            poiId: series.id,
            category: ov.category,
            question: null,
            pending: "deal",
            startedAt: now,
            deadline: now,
            run: { step: step + 1, steps, grades, spent: true },
          },
        });
        const nextCat = ov.category;
        void dealCard(set, get, series.id, nextCat, step + 1).then((dealt) => {
          const cur = get().openVault;
          if (!cur || cur.poiId !== series.id || cur.pending !== "deal") return;
          if (!dealt) {
            // Can't reach the lamp for the next card: the run breaks like a walk-away, with a clear message.
            set({ openVault: null, ...seriesPatch(series.kind, coolSeries(get(), series)), toast: `${series.name}: ${DEAL_FAIL}` });
            scheduleSave(get);
            return;
          }
          const shown = performance.now();
          set({
            openVault: {
              ...cur,
              pending: undefined,
              question: dealt.card,
              token: dealt.token,
              startedAt: shown,
              deadline: shown + dealt.windowMs,
              dealtAt: Date.now(),
            },
          });
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
      const seriesCoin = rewardPoints(series.pay, {
        mult,
        bonus,
        loot: wornPerk(get().scout).loot ?? 1,
        series: true,
      });
      const baseKeys: Partial<Record<Tier, number>> = { [series.pay]: 1 };
      if (grades.every((g) => g === "perfect")) baseKeys[series.bonus] = 1;
      else if (get().equipped === "lucky" && Math.random() < 0.15) baseKeys.blue = 1;
      const spot = seriesLive(get(), series.kind);
      const seriesMarket = marketAt(city.id, ov.dealtAt ?? Date.now());
      const sMult = spot && onMarket(seriesMarket, { kind: "series", lat: spot.lat, lng: spot.lng }) ? MARKET_MULT : 1;
      const sPay = marketPay(seriesCoin, baseKeys, sMult);
      const points = sPay.coin;
      const extraKeys: Partial<Record<Tier, number>> = sPay.keys;
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
        market: sMult > 1 && seriesMarket ? { street: seriesMarket.street.name, mult: sMult, coin: sPay.extraCoin, matches: sPay.extraMatches } : undefined,
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
      const spun = foldWheel(get, series.cost);
      const clearLine = (bonusHit
        ? `${series.name} is clear. ${TIER_LABEL[series.pay]} and ${TIER_LABEL[series.bonus]} matches.`
        : `${series.name} is clear. ${TIER_LABEL[series.pay]} match.`) + (sMult > 1 ? ` ${MARKET_TAG}.` : "");
      const ingLine = ing ? `${ingredientName(ing)} for the press.` : null;
      const questHit = cleared(get, answered(get, true, grade === "perfect"), { id: series.id, tier: series.cost });
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
        ...spun,
        asked,
        seenIds,
        ...logged,
        openVault: null,
        loot,
        miss: null,
        ...seriesPatch(series.kind, coolSeries(get(), series)),
        // Boost labels ride on loot.boosts (their own line in the reward pop); not repeated in the toast.
        toast: [clearLine, ingLine, questHit.line].filter(Boolean).join(" "),
        quests: questHit.quests,
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
        miss: { answer: out.reveal, fact: out.fact },
        toast: null,
        quests: answered(get, false, false),
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
    const tip = clothCoin(get().quests.worn, get().cityId, poi.tier);
    const lampCoin = rewardPoints(poi.tier, {
      mult,
      bonus,
      diffMult: DIFF_MULT[diff],
      loot: wornPerk(get().scout).loot ?? 1,
    });
    const lampMarket = marketAt(city.id, ov.dealtAt ?? Date.now());
    const lampMult = onMarket(lampMarket, { kind: "lamp", poiId: poi.id, lat: poi.lat, lng: poi.lng }) ? MARKET_MULT : 1;
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
    const baseKeys: Partial<Record<Tier, number>> = {};
    if (get().equipped === "lucky" && Math.random() < 0.15) baseKeys[poi.tier] = 1;
    if (grade === "perfect" && Math.random() < 0.1) baseKeys.blue = (baseKeys.blue ?? 0) + 1;
    // Night market: the trivia card's coin and its bonus matches double; the cloth tip and boosts don't.
    const lampPay = marketPay(lampCoin, baseKeys, lampMult);
    const points = lampPay.coin + tip;
    const extraKeys: Partial<Record<Tier, number>> = lampPay.keys;

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
      market: lampMult > 1 && lampMarket ? { street: lampMarket.street.name, mult: lampMult, coin: lampPay.extraCoin, matches: lampPay.extraMatches } : undefined,
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
    const coolMs = lampCoolMs(poi.tier);
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
        ? `A train ticket printed. Walk to ${fareDesk(CITIES[get().cityId]).name} and board.`
        : `Another train ticket. Two is the pocket. Board at ${fareDesk(CITIES[get().cityId]).name}.`;
    }
    if (grade === "perfect") sfx.perfect();
    else sfx.correct();
    const spun = foldWheel(get, poi.tier);
    const wornCloth = get().quests.worn;
    const clothLine = tip > 0 && wornCloth ? `${clothName(wornCloth)} +${tip}.` : null;
    const ingLine = ing ? `${ingredientName(ing)} for the press.` : null;
    const questHit = cleared(get, answered(get, true, grade === "perfect"), poi);
    // 0.0.55 city passes: amber+ lamp points (route a) and every place in the city (route b).
    const lit = lampLit(get().cities, poi.tier);
    const goalsHit = goalsCheck(lit.u, get().cityId, atlas);
    const passLine = lit.earned + goalsHit.earned ? `City pass earned${lit.earned + goalsHit.earned > 1 ? ` ×${lit.earned + goalsHit.earned}` : ""}. Unlock a city at the train station.` : null;
    set({
      cities: goalsHit.u,
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
      ...spun,
      asked,
      seenIds,
      ...logged,
      openVault: null,
      loot,
      miss: null,
      // Boost labels ride on loot.boosts (their own line in the reward pop); not repeated in the toast.
      toast: [passLine, contractToast, fareToast, surveyHit?.message, clothLine, ingLine, questHit.line].filter(Boolean).join(" ") || null,
      quests: questHit.quests,
      tutorial: Math.max(get().tutorial, 2),
    });
    postClear(poi.tier);
    scheduleSave(get);
  },
  closeVault: () => {
    const ov = get().openVault;
    // 0.0.53: an answer is with the server — the lamp stays until it's graded.
    if (ov?.pending === "grade") return;
    const series = ov ? seriesOf(ov.poiId) : null;
    // A trivia card that was shown and walked away from counts as seen, so closing is not a reroll.
    if (ov?.question) set(markSeen(get().asked, get().seenIds, ov.question));
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
    if (ov?.question) scheduleSave(get);
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
  payDailyRun: (day, city) => {
    const marked = markDailyPaid(get().dailyPaid, day, city);
    if (!marked) return null;
    const paid = payDaily(get().keys, get().points);
    sfx.pickup();
    // 0.0.55: the 3rd paid Lantern Run in a city pays a city pass (route c), once per city.
    const runs = runFinished(get().cities, city);
    set({ dailyPaid: marked, keys: paid.keys, points: paid.points, cities: runs.u });
    if (runs.earned) flashToast(set, get, `Third Lantern Run in ${CITIES[city]?.name ?? "this city"} · city pass earned.`, 3200);
    scheduleSave(get);
    return { added: paid.added, coins: paid.coins };
  },
  payFriendTickets: (ids) => {
    const marked = markFriendPaid(get().friendPaid, ids);
    if (!marked.fresh.length) return { fresh: [], added: 0, coins: 0 };
    const paid = payFriend(get().keys, get().points, marked.fresh.length, matchCap("white"));
    sfx.pickup();
    set({ friendPaid: marked.paid, keys: paid.keys, points: paid.points });
    scheduleSave(get);
    return { fresh: marked.fresh, added: paid.added, coins: paid.coins };
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
      quests: notePrint(s.quests, s.cityId),
    });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 1600);
  },
  equip: (id) => {
    set({ equipped: id });
    scheduleSave(get);
  },
  claimErrand: () => {
    const paid = claimErrand(get().quests, get().cityId);
    if (!paid) {
      flashToast(set, get, "The errand is not finished.", 1400);
      return;
    }
    sfx.pickup();
    const pantry = addIngredient(get().pantry, paid.ingredient);
    set({ quests: paid.log, pantry });
    flashToast(set, get, `${ingredientName(paid.ingredient)} from the errand.`, 1800);
    scheduleSave(get);
  },
  claimCircuit: () => {
    const s = get();
    const paid = claimCircuit(s.quests, s.cityId, s.pantry[cityStaple(s.cityId)] ?? 0, s.charms.length);
    if (!paid) {
      flashToast(set, get, "Circuit still open. Red, a ward, three stock, and a charm.", 1800);
      return;
    }
    sfx.pickup();
    set({ quests: paid.log });
    flashToast(set, get, `${clothName(paid.cloth)} in the closet.`, 1800);
    scheduleSave(get);
  },
  claimLong: (id) => {
    const paid = claimLong(get().quests, id, get().distanceM);
    if (!paid) return;
    sfx.pickup();
    set({
      quests: paid.log,
      schematics: get().schematics + (paid.schematic ? 1 : 0),
    });
    const msg = paid.title
      ? `Title: ${paid.title}.`
      : paid.schematic
        ? "A schematic from the unbroken run."
        : paid.pattern
          ? "A pattern for the press."
          : paid.cloth
            ? "Cloth for the lantern."
            : "Filed.";
    flashToast(set, get, msg, 1800);
    scheduleSave(get);
  },
  wearCloth: (id) => {
    const owned = id == null || get().quests.cloths.includes(id);
    if (!owned) return;
    set({ quests: { ...get().quests, worn: id } });
    scheduleSave(get);
  },
  printPattern: () => {
    const s = get();
    const press = spendIngredient(s.cityId, s.pantry);
    const printed = printPattern(s.quests);
    if (!printed || !press) {
      flashToast(set, get, "Need a pattern and one press ingredient.", 1600);
      return;
    }
    sfx.craft();
    set({
      quests: printed.log,
      pantry: { ...s.pantry, [press]: (s.pantry[press] ?? 1) - 1 },
    });
    flashToast(set, get, "Night glass printed.", 1600);
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
  payCosmetic: (id) => {
    const c = cosmetic(id);
    if (!c) return;
    const res = payIn(get().wardrobe, get().keys, id, Date.now());
    if (!res) {
      if (!get().wardrobe.owned.includes(id)) flashToast(set, get, `The print shop takes ${priceLine(c.price)} for the ${c.name}.`, 1800);
      return;
    }
    if (res.done) sfx.craft();
    else sfx.pickup();
    set({ wardrobe: res.wardrobe, keys: res.keys });
    flashToast(
      set,
      get,
      res.done ? `${c.name} printed. Wearing it.` : `Paid ${priceLine(res.took)} toward the ${c.name}. ${priceLine(res.left)} to go.`,
      res.done ? 2200 : 2000,
    );
    saveNow(get);
  },
  wearCosmetic: (slot, id) => {
    const next = wear(get().wardrobe, slot, id, Date.now());
    if (!next) return;
    sfx.ui();
    set({ wardrobe: next });
    const name = id ? cosmetic(id)?.name : null;
    flashToast(set, get, name ? `Wearing the ${name}.` : slot === "coat" ? "Back in the field coat." : "Lamps back to brass.", 1400);
    saveNow(get);
  },
  adoptWardrobe: (w) => {
    const next = cleanWardrobe(w);
    if (JSON.stringify(next) === JSON.stringify(get().wardrobe)) return;
    set({ wardrobe: next });
    saveNow(get);
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
      flashToast(set, get, `A train ticket reprinted. Board at ${fareDesk(CITIES[get().cityId]).name}.`, 2400);
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
  claimWheel: () => {
    const offer = get().wheel;
    if (!offer) return;
    const paid = grantWheelPrize(offer.slices[offer.win]!, {
      keys: get().keys,
      points: get().points,
      pantry: get().pantry,
    });
    const wheelClaimed = { ...get().wheelClaimed, [offer.tier]: (get().wheelClaimed[offer.tier] ?? 0) + 1 };
    const next = owedTier(get().correctByTier, wheelClaimed);
    sfx.pickup();
    set({
      keys: paid.keys,
      points: paid.points,
      pantry: paid.pantry,
      wheelClaimed,
      wheel: next ? buildWheel(next, get().cityId, Math.random()) : null,
      toast: paid.line,
    });
    scheduleSave(get);
    window.setTimeout(() => {
      if (get().toast === paid.line) set({ toast: null });
    }, 2200);
  },
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
    if (!isUnlocked(get().cities, to)) return lockLine(get().cities, to);
    if (get().fares < 1) return `Need a train ticket. ${ticketHint(get().cityVaults)} in this city.`;
    if (get().journey) return "You're already on a train.";
    const now = Date.now();
    const arriveAt = now + fareMs(get().cityId, to);
    const rideGame = dealForRide(arriveAt - now, get().rideHistory ?? []);
    sfx.open();
    set({
      fares: get().fares - 1,
      journey: { from: get().cityId, to, departAt: now, arriveAt, openMs: 0, lastTickAt: now, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0, rideGame },
      rideHistory: pushRideHistory(get().rideHistory ?? [], rideGame),
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
  chooseRideGame: (game) => {
    const j = get().journey;
    if (!j || j.roundAt != null || j.chosenGame === game) return;
    set({ journey: chooseRideGame(j, game) });
    saveNow(get);
  },
  startRideRound: (pick) => {
    const j = get().journey;
    if (!j) return null;
    const now = Date.now();
    const game = pick ?? rideGameFor(j);
    if (!rideGameFits(game, j.arriveAt - now)) return null;
    const ms = rideRoundMs(game, j.arriveAt - now);
    if (ms == null) return null;
    // The ride's history entry follows what was actually played, so the next suggestion varies
    // against the player's picks. Rides from before 0.0.35 never pushed an entry; leave theirs alone.
    const hist = get().rideHistory ?? [];
    const history = j.rideGame && hist.length && hist[hist.length - 1] !== game ? [...hist.slice(0, -1), game] : hist;
    set({ journey: openRound(chooseRideGame(j, game), now), rideHistory: history });
    saveNow(get);
    return ms;
  },
  finishRideRound: (outcome) => {
    const j = get().journey;
    if (!j) return { white: 0, blue: 0, green: 0, owed: 0 };
    const before = get().keys;
    const granted = (x: GameState["journey"]) => (x?.grantedWhite ?? 0) + (x?.grantedBlue ?? 0) + (x?.grantedGreen ?? 0);
    set({ journey: markRound(j, outcome) });
    get().tickJourney();
    const after = get().keys;
    saveNow(get);
    return {
      /** Matches the round newly settled, pocketed or not. 0 = it pays no more than the ride already had. */
      owed: Math.max(0, granted(get().journey) - granted(j)),
      white: Math.max(0, (after.white ?? 0) - (before.white ?? 0)),
      blue: Math.max(0, (after.blue ?? 0) - (before.blue ?? 0)),
      green: Math.max(0, (after.green ?? 0) - (before.green ?? 0)),
    };
  },
  dropRideRound: () => {
    const j = get().journey;
    if (!j || j.roundAt == null) return;
    set({ journey: forfeitRound(j, "stopped") });
    saveNow(get);
  },
  tickJourney: () => {
    const j = get().journey;
    if (!j) return;
    if (!CITIES[j.to]) {
      set({ journey: null });
      return;
    }
    const now = Date.now();
    const watching =
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      get().screen === "ride";
    const { journey: nextJourney, keys, add } = settleRide(j, get().keys, now, watching);
    const found = add.white + add.blue + add.green;
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

