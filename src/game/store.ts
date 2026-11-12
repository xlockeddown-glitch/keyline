import { hearthOf, hearthPois } from "./hearthVaults";
import { HEARTH_VERSION_NAME, hearthBoost, hearthLast, hearthSteps, hearthTierAt, hearthVersion, slotUsed } from "./hearthMulti";
import { create } from "zustand";
import { DRIVE_PING_MS, MAGNET_DAY_CAP, bestVaultMs, carCool } from "./carPerks";
import { cleanCredit, creditHint, settlePocket } from "./goals";
import { CITIES, CITY_LIST, KIOSK, SCOUTS, TIER_LABEL, interactRadius, isBoard, isCounter, isScoutShop, kioskRetired, wornPerk, type KioskId } from "./data";
import { reachableDrop, streetDrop } from "./streets";
import { cityDay, openNumber, stackedCoolMs } from "./vaultStack";
import { carOf, driveOf, isCarId, type CarId } from "./cars";
import { canId, colorOf, paintPrice, parseCan } from "./carPaint";
import { cleanSkins, isSkinId, skinOf, skinOwned, type SkinId } from "./skins";
import { HOME_LAMPS, houseCost, houseOf, isHouseTier, type HouseState, type HouseTier } from "./houses";
import { MARKET_MULT, MARKET_TAG, anyPois, isMarketLantern, lanternCycleEnd, livePois, marketLanternById, marketAt, marketCoolMs, marketMatches, marketMult, marketOverflowCoin, marketPay, onMarket, pointOnMarket } from "./nightMarket";
import { patronBulb, patronCycle, patronLive, patronOpen, patronUntil, cleanPatron, type PatronBulb, type PatronHold } from "./patron";
import { DIFF_MULT, ASKED_KEEP } from "./triviaMeta";
import { dealTrivia, gradeTrivia } from "./triviaApi";
import { SEEN_MAX, type DealInput, type Grade, type GradeResult, type PublicCard, type ServerAward, type ServerWallet } from "./triviaSchema";
import { RECENT_MAX, pushRecent, type RecentReward, type RewardSource } from "./recentRewards";
import { bestLight, nextLight, type LightId } from "./marketLights";
import { commitWallet, streetPlayer, tokenNonce, walletLive } from "./walletClient";
import { SEED, parseStreetId, takeStreetSpot } from "./streetSpots";
import { poiName, takeSurvey } from "./survey";
import { migratePoiIds } from "./retired";
import { adoptScout, savedScout } from "./scoutMemory";
import { sfx } from "./audio";
import { legacyDailyPaid, markDailyPaid, payDaily } from "./dailyRun";
import { markFriendPaid, payFriend } from "./friendTicket";
import { emptyAgg, emitOnAnswer, mintSaveId, PLATE_KEEP, type PlateAgg, type PlateEvent, type PlateRollMap } from "./telemetry";
import { fetchRetune } from "./retuneJob";
import { setQuarantine, setRetune } from "./rarity";
import type {
  CityId,
  Journey,
  LootDrop,
  MapKey,
  MissFlash,
  NearReveal,
  Poi,
  PoiKind,
  Screen,
  ScoutId,
  Tier,
  TriviaCat,
  FieldPick,
  VaultRuntime,
} from "./types";
import { crateLine, crateLoot, nextCrateStreak } from "./crate";
import { addPoster, cleanPosters, loopCrate, loopCrateLoot, posterKey } from "./loop";
import { addSouvenir, canFly, cleanSouvenirs, SOUVENIRS, souvenirKey } from "./flight";
import { PULSE_POINTS, pulseDue } from "./pulse";
import { PASS_GIFT_LINE, giftPass } from "./cityPass";
import { GOAL_ALL_TIER, GOAL_COIN, cachePrize, cacheLine, cleanGoals, goalDay, goalDone, noteGoal, payMatch, payMatches, payMatchesOf, cheerFor, streakPrize, streakSub, type Cheer, type GoalDay, type GoalKind } from "./goals";
import { perfectBack } from "./perfectRefund.ts";
import { lockClock } from "./lockout.ts";
import { autoCrateDue, blitzOfferDue } from "./dailyPop";
import { BLITZ_STEPS, CONTRACT_LAMPS, blitzDue, blitzMatch, cleanBlitzMatches } from "./dailyBlitz";
import { applyBank, bankDownSpec, bankUpSpec, rewardPoints } from "./rewards";
import { cleanKeys, hasMatch, refundMatch, savedKeys, spendMatch } from "./matchSpend";
import { mergeSeen, savedSeen } from "./seenMemory";
import { applyTriviaBoosts, creditWhite } from "./boosts";
import { BLUE_POCKET, FARES_CAP, GREEN_POCKET, SPARK_DAY, VAULTS_PER_FARE, WHITE_POCKET, fareDesk, fareDeskNote, fareMs, formatCool, lampCoolMs, matchCap, landOldTrain, settleRide, sparkState, sparkTier, ticketHint } from "./ticket";
import { WEAR_SLOTS, carPick, planWornSync, type AccountWorn, type WearSlot, type WornPicks } from "./wornSync";
import { cleanPaint, mergedBench, mixPaint as mixPaintJob, PAINT_USE, planDyeSync, wearPaint as wearPaintJob, type PaintBench, type PaintJob, type ServerBench } from "./paint";
import { cleanWardrobe, cosmetic, payIn, priceLine, wear, type CosmeticId, type CosmeticSlot, type Wardrobe } from "./cosmetics";
import { addIngredient, ingredientName, paintFoundLine, paintsFromServer, isPaintId, type IngredientId, type PaintColor } from "./ingredients";
import { LUCKY_MATCH_CHANCE, PERFECT_BLUE_CHANCE } from "./vaultPay";
import { stockCoin, stockNote } from "./stockCoin";
import { chooseStart, cleanUnlocks, freshUnlocks, goalsCheck, isUnlocked, lampLit, lockLine, migrateUnlocks, runFinished, unlockCity as unlockCityPass, type CityUnlocks } from "./cityPass";
import { buildWheel, caughtUpClaims, emptyWheelClaims, grantWheelPrize, owedTier, wheelClaimFailed, wheelDue, type WheelOffer } from "./wheel";
import {
  grantScrap,
  hydrateQuests,
  clothCoin,
  clothName,
  printPattern,
  rareExtra,
  type ClothId,
  type QuestLog,
} from "./quests";
import { monthKey } from "./questPeriods";
import { questClaimLine } from "./questBoard";

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
  /** Stops on the walk the player is building, including the one underway. */
  routeStops: number;
  /** At a door, with more stops waiting. */
  routeHold: boolean;
  seated: boolean;
  /** 0.1.14: seated in the player's own car (lamps answer from it). */
  ownCar?: boolean;
  deskName: string;
  deskDist: number;
  aimDeg: number;
};

/** 0.0.53: a dealt card as the browser holds it — prompt and shuffled choices, no answer (the server grades). */
export type DealtCard = PublicCard;

/** The server's grade of the open card, as `settleAnswer` applies it. */
type Graded = {
  correct: boolean;
  elapsed: number;
  reveal: string;
  fact?: string;
  credited: boolean;
  paints?: string[];
  lockoutMs?: number;
  /** 0.1.158 Closest Number: the server's sliding-scale grade and the reveal (the client never times these). */
  near?: NearReveal;
  grade?: Grade | null;
  mult?: number;
};

type OpenVault = {
  poiId: string;
  startedAt: number;
  question: DealtCard | null;
  /** Signed pending-card token from the server deal; sent back with the answer. */
  token?: string;
  /** A server round trip is under way: dealing the card, or grading the answer. */
  pending?: "deal" | "grade";
  /** 0.1.116: "random" when the player picked Random (the server picks the field). */
  category: FieldPick | null;
  deadline: number;
  spark?: boolean;
  /** Wall clock (Date.now) when this trivia card was dealt — `startedAt` is performance.now(). The night market open then is the one that pays. */
  dealtAt?: number;
  /** 0.0.57: the match taken from the pocket when the card was dealt (refunded on a walk-away from a lamp). */
  held?: Tier;
  /**
   * 0.1.117 Double/Triple Hearth run: this question's step, the fields already used, and the last question's token
   * (the server reads the step from it). Single Hearths and other vaults leave this out.
   */
  hearth?: { step: number; used: string[]; prev?: string };
};

type FireworksShow = { kind: "mini" | "grand"; id: number };

export type GameState = {
  screen: Screen;
  cityId: CityId;
  keys: Record<Tier, number>;
  /** 0.0.97: overflow credits per colour (0-2); every 3 merge into 1 match of the next colour. */
  credit: Partial<Record<Tier, number>>;
  points: number;
  brass: number;
  ink: number;
  vellum: number;
  schematics: number;
  pantry: Partial<Record<IngredientId, number>>;
  quests: QuestLog;
  /** 0.1.22: Lucky for good (a Lucky bit printed before charms retired). */
  lucky: boolean;
  /** 0.1.22: Lucky on for this one month ("M2026-12"), from a Full month quest bonus. */
  luckyMonth: string;
  scouts: ScoutId[];
  scout: ScoutId;
  /** 0.0.45 print shop: cosmetic coats and lantern skins (owned, paid so far, worn). Purely visual. */
  wardrobe: Wardrobe;
  /** 0.0.99: guests' last 20 rewards (signed-in players read the server ledger). */
  recent: RecentReward[];
  /** 0.0.99: the city print worn over the coat (cosmetic, must be earned on the server). */
  printWorn: string | null;
  /** 0.0.99: prints whose earn moment has been shown. */
  printsSeen: string[];
  /** 0.1.00: market lights owned (server-reported) and the colour shown on the market string lights. */
  lightsOwned: string[];
  marketLight: string;
  /** 0.1.138: cosmetic market bulb for the open cycle. Null when the cycle has ended. */
  patron: PatronHold | null;
  /** 0.1.8: cars owned (server-reported) and the one you drive (null = the city cab). Showroom open at the dealer. */
  carsOwned: CarId[];
  carOn: CarId | null;
  /** 0.1.31: the player tapped Driving to go back to the city cab on purpose (otherwise an owned car is always driven). */
  carCab: boolean;
  /** 0.1.9: paint cans held ("civic:red", one per can) and each car's colour (absent = factory). Server-owned when signed in. */
  carCans: string[];
  carPaint: Partial<Record<CarId, string>>;
  /** 0.1.12: houses owned per city (server-owned) and today's key claims (hook:<city>:<day>). */
  houses: Partial<Record<CityId, HouseState>>;
  homeClaims: string[];
  houseNear: boolean;
  houseOpen: boolean;
  /** 0.1.61 map skins: bought skins (server-owned), the one you wear (saved), the sheet and a try-on preview. */
  skins: SkinId[];
  mapSkin: SkinId;
  skinsOpen: boolean;
  skinPreview: SkinId | null;
  dealerOpen: boolean;
  dealerNear: boolean;
  /** 0.0.64 vault paint: cans live in the pantry; this is what the vat has mixed and what's on. */
  paints: PaintBench;
  atlas: Record<string, true>;
  survey: Record<string, true>;
  vaults: Record<string, VaultRuntime>;
  mapKeys: MapKey[];
  contract: { ids: string[]; done: string[]; nonces?: string[] } | null;
  streak: number;
  /** 0.1.133: signed-in answer streak from the server. Not written into the save. Null until this session syncs. */
  serverStreak: number | null;
  /** Permanent Streak Lord flag from the server. Not written into the save. */
  streakLord: boolean;
  /** 0.0.95: celebratory match-reward pop (streak, cache, gift): emblem(s), big line, flies to the pocket. */
  matchPop: MatchPop | null;
  /** 0.0.96 Tabby (Nine lives): Chicago day the first miss was forgiven. */
  shieldDay: string;
  bestStreak: number;
  vaultsOpened: number;
  correctByTier: Record<Tier, number>;
  wheelClaimed: Record<Tier, number>;
  wheel: WheelOffer | null;
  /** 0.0.92: signed in, the server already rolled and paid this spin; the wheel lands on `win`. */
  wheelPaid: { win: number; line: string; slices?: WheelOffer["slices"] } | null;
  /** 0.0.93: today's three daily goals (replace the old errand). */
  goals: GoalDay;
  /** 0.0.93: UTC day the match cache was last opened (once per player per day). */
  cacheDay: string;
  distanceM: number;
  lastCrateDay: string;
  crateStreak: number;
  /** 0.1.58: tunnel posters collected on Loop rides (ledger keys `poster:<from>-<to>`). */
  posters: string[];
  /** 0.1.70: souvenirs from flights (ledger keys `souvenir:<city>`). */
  souvenirs: string[];
  /** 0.1.70: the flight playing now (takeoff, window view, landing). */
  flight: { from: CityId; to: CityId; departAt: number } | null;
  /** 0.1.58: the Loop ride playing now (cutscene), with its crate roll. */
  loop: { from: CityId; to: CityId; crate: boolean } | null;
  lastPulseDay: string;
  /** 0.0.59 Daily Blitz: the UTC day the login run was started, the coin it paid, and the matches that fit. */
  lastBlitzDay: string;
  blitzTake: number;
  blitzMatches: Tier[];
  blitzOpen: boolean;
  /** 0.0.90: the crate pop-up after the day's first answer, the blitz offer queued behind it, and the day it was offered. */
  cratePop: { day: number; line: string } | null;
  blitzOffer: boolean;
  lastBlitzOfferDay: string;
  /** 0.0.90: the one free city pass was given to this save. */
  passGift: boolean;
  sparkDay: string;
  sparkN: number;
  sparkLamps: string[];
  /** Daily Lantern Run finishes already paid, as `day|city` keys (once per city per UTC day). */
  dailyPaid: string[];
  /** Friend-ticket whites already landed in this save ("s:<token>" sent, "f:<token>" answered), 0.0.50. */
  friendPaid: string[];
  /** 0.0.54 gifts whose note this save has shown (the server's gift_claims row is the cross-device copy). */
  giftsSeen: string[];
  /** 0.0.56 city unlocks: start city, unlocked cities, free second pick, city passes and per-route progress (cityPass.ts). */
  cities: CityUnlocks;
  charmDay: string;
  charmTopics: TriviaCat[];
  blanks: Poi[];
  /** 0.1.110: bumps when the city's Hearth vaults load (map pins repaint). Not saved. */
  hearthGen?: number;
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
  landAtStation: boolean;
  pressPass: number;
  /** 0.1.82: this device already traded its retired stock for coin (guest path). */
  stockPaid: boolean;
  loot: LootDrop | null;
  miss: MissFlash | null;
  openVault: OpenVault | null;
  hqOpen: boolean;
  /** Field guide: what each colour of lamp pays. Not saved. */
  guideOpen: boolean;
  invOpen: boolean;
  shopOpen: boolean;
  /** Ward counter or notice board. Null when neither sheet is up. */
  errandOpen: null | "counter" | "board";
  /** Which counter or board was walked up to. Not saved. */
  errandId: string | null;
  toast: string | null;
  fireworks: FireworksShow | null;
  hud: Hud;
  setScreen: (s: Screen) => void;
  pickCity: (id: CityId) => void;
  /** 0.0.56: unlock a city with the free second pick or one city pass (train station). Null on success, else why not. */
  unlockCity: (id: CityId) => string | null;
  setHud: (h: Partial<Hud>) => void;
  /** 0.0.90: bumped by the HUD's route ✕; GameMap clears the whole route when it changes. */
  routeCancel: number;
  cancelRoute: () => void;
  /** 0.0.90 "I'm stuck": close everything, re-sync; GameMap puts the scout back at the walk start when `unstuck` changes. */
  unstuck: number;
  unstick: () => void;
  addDistance: (m: number) => void;
  stampPlaces: (ids: string[]) => void;
  collectKey: (id: string, via?: "magnet") => void;
  /** 0.1.46: the Roadster 2.0 Magnet pulls a street match in (spaced, capped); false when it is full for today. */
  magnetKey: (id: string) => boolean;
  magnetDay: { day: string; city: string; n: number; full?: boolean };
  maybeSpawnKey: (now: number) => void;
  bindStreet: () => void;
  seedBlanks: (list: Poi[]) => void;
  spreadDrops: (keys: MapKey[]) => void;
  tryOpen: (poiId: string, now: number) => string | null;
  closeShop: () => void;
  closeErrand: () => void;
  pickCategory: (cat: FieldPick, now: number) => void;
  answer: (choice: string, now: number) => void;
  /** 0.1.158 Closest Number: send the typed guess (the timeout still goes through `answer("__timeout__")`). */
  answerNear: (guess: number, now: number) => void;
  /** Apply a server-graded answer to the open card (rewards, streak, seen memory). Internal to the lamp flow. */
  settleAnswer: (out: Graded, now: number) => void;
  closeVault: () => void;
  claimCrate: (auto?: boolean) => void;
  /** 0.0.90: close the crate pop-up; queues the blitz offer once a day when it is due. */
  dismissCratePop: () => void;
  /** 0.0.90: answer the blitz offer (Play now opens the blitz; Later leaves it on the notice board). */
  answerBlitzOffer: (play: boolean) => void;
  claimPulse: () => void;
  /** Open Daily Blitz if today's run hasn't started. */
  openBlitz: () => void;
  /** Close the blitz sheet without starting (the day stays open). */
  dismissBlitz: () => void;
  /** The first card landed: today's run is spent, even if they walk away. */
  lockBlitz: () => void;
  /** Add a cleared lantern's coin and a match of its color. No-op unless today's run is locked. */
  bankBlitz: (pay: number, tier: Tier, nonce?: string) => { match: boolean; overflow: number };
  /** Remember a dealt blitz card so the next lantern doesn't repeat it. */
  rememberCard: (id: string) => void;
  /** Pay the Daily Lantern Run finish once per UTC day. Returns what landed, or null if already paid. */
  payDailyRun: (day: string, city: CityId) => { added: Partial<Record<Tier, number>>; coins: number } | null;
  /** Land server-confirmed friend-ticket whites (each id once per save). Returns the ids newly paid. */
  payFriendTickets: (ids: string[], tiers?: Record<string, Tier>) => { fresh: string[]; added: number; coins: number };
  bankUp: (tier: Tier) => void;
  bankDown: (tier: Tier) => void;
  /** 0.1.22: collect a weekly / monthly quest. The server recounts it; resolves to the toast line, or null when refused. */
  claimQuest: (period: string, id: string) => Promise<string | null>;
  /** 0.1.22: move an old save's milestones and charms to the server once (signed in only). */
  runLegacy: () => Promise<void>;
  wearCloth: (id: ClothId | null) => void;
  printPattern: () => void;
  buyScout: (id: ScoutId) => void;
  /** 0.1.00: buy the next market light (signed in; the server checks order and coin). */
  buyLight: (id: LightId) => void;
  /** 0.1.8: buy a car (signed in; the server checks the price) and pick which one to drive. */
  buyCar: (id: CarId) => void;
  paintCar: (id: CarId, color: string) => void;
  buyHouse: (city: CityId, tier: HouseTier) => void;
  turnKey: (city: CityId) => void;
  setHouseOpen: (open: boolean) => void;
  setSkinsOpen: (open: boolean) => void;
  previewSkin: (id: SkinId | null) => void;
  wearSkin: (id: SkinId) => void;
  buySkin: (id: SkinId) => void;
  setHouseNear: (near: boolean) => void;
  driveCar: (id: CarId | null) => void;
  /** 0.1.106: wear an earned city print on the coat (null = off). Follows the account. */
  wearPrint: (id: string | null) => void;
  /** 0.1.106: show an owned market light colour. Follows the account. */
  showLight: (id: string) => void;
  /** 0.1.106: line worn picks up with the account (after sign-in, once the wallet is live). */
  syncWorn: () => Promise<void>;
  setDealerOpen: (open: boolean) => void;
  setDealerNear: (near: boolean) => void;
  wearScout: (id: ScoutId) => void;
  /** 0.0.54 gift: add a scout to the save for free (no coins). Returns true if it was newly added. */
  grantGiftScout: (id: ScoutId) => boolean;
  /** 0.0.54 gift: remember this gift's note was shown in this save. */
  markGiftSeen: (giftId: string) => void;
  /** Print shop: pay what the pocket can toward a coat or lantern skin; the last match makes it yours and puts it on. */
  payCosmetic: (id: CosmeticId) => void;
  /** Put an owned coat / lantern skin on, or take the slot off with null. */
  wearCosmetic: (slot: CosmeticSlot, id: CosmeticId | null) => void;
  /** Take the merged wardrobe back from the server (signed-in sync). */
  adoptWardrobe: (w: Wardrobe) => void;
  /** Copy a server wallet over coins, matches and city passes, and tell the other tab. */
  adoptWallet: (w: { coins: number; keys: Record<Tier, number>; cities: CityUnlocks; credit?: Partial<Record<Tier, number>> }) => void;
  /** 0.0.95: merge what the account owns on the server (sign-in on any device, after a logout). Never removes. */
  adoptOwned: (o: { scouts: string[]; charms: string[]; cloths: string[]; lights?: string[]; cars?: string[]; cans?: string[]; paint?: Record<string, string>; houses?: Record<string, { tier: string; items?: string[] }>; homeClaims?: string[]; skins?: string[]; skin?: string | null; dyes?: { coats: string[]; vaults: string[]; wornCoat: string | null; wornVault: string | null; rows: number }; worn?: Partial<Record<"print" | "cloth" | "car" | "light", string | null>>; patron?: PatronHold | null }) => void;
  /** Spend a set number of one paint on a coat or the street vaults, and put it on. */
  mixPaint: (color: PaintColor, job: PaintJob) => void;
  /** Wear a mixed paint job, or take it off with null. */
  wearPaint: (job: PaintJob, color: PaintColor | null) => void;
  /** 0.1.105: line coat / vault paint up with the account (after sign-in, once the wallet is live). */
  syncDyes: () => Promise<void>;
  buyKiosk: (id: KioskId) => void;
  /** 0.1.138: hang a patron bulb for this market cycle. One bulb, no reward. */
  buyPatron: (bulb: PatronBulb) => void;
  /** Write the coin pocket and the save. The server replaces it when a charge is confirmed. */
  keepPoints: (n: number) => void;
  startContract: () => void;
  toggleHq: (v?: boolean) => void;
  toggleGuide: (v?: boolean) => void;
  toggleInv: (v?: boolean) => void;
  /** 0.1.82: guests only: trade the retired stock on this device for coin, once. */
  convertGuestStock: () => void;
  dismissLoot: () => void;
  claimWheel: () => void;
  noteGoalKind: (kind: GoalKind, amount?: number) => void;
  claimGoal: (i: number) => void;
  claimCache: () => void;
  /** 0.0.92: the slice to land on. Signed in, the server claims first; null means the claim failed (wheel closed). */
  spinWheel: () => Promise<number | null>;
  /** Close the wheel without claiming (0.0.89). The spin is offered again later. */
  dismissWheel: () => void;
  skipTutorial: () => void;
  advanceTutorial: (n?: number) => void;
  replayTutorial: () => void;
  resetCity: () => void;
  clearFireworks: () => void;
  /** 0.1.58: `skip` arrives at once, `loop` plays the tunnel ride. 0.1.95: the timed train is gone. */
  boardFare: (to: CityId, how?: "loop" | "fly") => string | null;
  /** 0.1.70: end the flight cutscene: arrive and pin the souvenir. */
  finishFlight: () => void;
  /** 0.1.58: end the Loop cutscene (done or skipped): arrive, file the poster, open any crate. */
  finishLoop: () => void;
  tickJourney: () => void;
};

export type MatchPop = { id: number; big: string; sub: string; tiers: Tier[]; coin: number; kind: "streak" | "cache" | "gift" | "level" | "print" | "perfect"; cheer?: Cheer | null };
/** 0.0.95: show the match-reward pop (also sets a plain toast for screen readers / old paths). */
/** 0.0.99: pops that arrive while one is showing wait their turn instead of replacing it. */
const popQueue: MatchPop[] = [];
let popSeq = 0;
export function popMatch(p: Omit<MatchPop, "id">) {
  const pop = { ...p, id: Date.now() * 100 + (popSeq++ % 100) };
  if (useGame.getState().matchPop) popQueue.push(pop);
  else useGame.setState({ matchPop: pop });
}

/** 0.0.96: a wrong answer. The Tabby keeps its streak on the first miss of each (Chicago) day. */
function missStreak(get: () => GameState): { streak: number; shieldDay: string } {
  const st = get();
  const day = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
  if (wornPerk(st.scout).shield && st.shieldDay !== day && st.streak > 0) {
    window.setTimeout(() => useGame.setState({ toast: `Nine lives: your ${st.streak}-answer streak survives today's first miss.` }), 1600);
    return { streak: st.streak, shieldDay: day };
  }
  return { streak: 0, shieldDay: st.shieldDay };
}

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
  topic: FieldPick | null | undefined,
) {
  return applyTriviaBoosts({
    correct,
    elapsedMs,
    // A Random pick's field is the server's; the device's estimate leaves charm topics out.
    topic: topic && topic !== "random" ? topic : null,
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

let boarding = false;

function streetFloor(cityId: CityId, keys: { id: string }[]): number {
  const day = new Date().toISOString().slice(0, 10);
  let n = 0;
  for (const k of keys) {
    const p = parseStreetId(k.id);
    if (p && p.city === cityId && p.day === day) n = Math.max(n, p.index + 1);
  }
  return n;
}

/** 0.1.14: everything already lit in this city, so a new street match keeps its distance (SPREAD_MIN_M). */
function litPoints(cityId: CityId, held: { lat: number; lng: number }[]): { lat: number; lng: number }[] {
  let blanks: Poi[] = [];
  try {
    const st = useGame.getState();
    if (st.cityId === cityId) blanks = st.blanks;
  } catch {
    /* the store is still being built (first seed) */
  }
  return [...CITIES[cityId].pois, ...blanks, ...held];
}

/** A spot from this player's city-day list. Guests, and a sync that has not landed, get null. */
function issuedKey(cityId: CityId, held: MapKey[]): MapKey | null {
  const player = streetPlayer();
  if (!player || !walletLive()) return null;
  const spot = takeStreetSpot(player, cityId, Date.now(), streetFloor(cityId, held));
  if (!spot) return null;
  const m = spot.market ? marketAt(cityId, Date.now()) : null;
  const p = m ? reachableDrop(pointOnMarket(m.street)) : streetDrop(CITIES[cityId].spawn, 220, 2200, litPoints(cityId, held));
  return { id: spot.id, lat: p.lat, lng: p.lng, tier: spot.tier };
}

function placeKey(cityId: CityId, tier: Tier, held: MapKey[] = []): MapKey {
  const c = CITIES[cityId];
  const around = c.spawn;
  const p = streetDrop(around, 220, 2200, litPoints(cityId, held));
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
  const p = reachableDrop(pointOnMarket(m.street));
  return { id: `k-${cityId}-m${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`, lat: p.lat, lng: p.lng, tier };
}

function streetKeyCap(pocket: number): number {
  // 0.0.90: doubled (was 5 / 8). 0.0.94: drops to 10 only at 15+ held (was 5+).
  return pocket >= 15 ? 10 : 16;
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

function seedKeys(cityId: CityId, n = SEED.length): MapKey[] {
  if (walletLive() && streetPlayer()) {
    const issued: MapKey[] = [];
    for (let i = 0; i < n; i++) {
      const key = issuedKey(cityId, issued);
      if (!key) break;
      issued.push(key);
    }
    if (issued.length) return issued;
  }
  const c = CITIES[cityId];
  const out: MapKey[] = [];
  const tiers = SEED;
  for (let i = 0; i < n; i++) {
    const around = c.spawn;
    const p = streetDrop(around, 160 + i * 90, 2100, litPoints(cityId, out));
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
  while (ids.length < CONTRACT_LAMPS && picks.length) {
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
    credit: s.credit,
    points: s.points,
    brass: s.brass,
    ink: s.ink,
    vellum: s.vellum,
    schematics: s.schematics,
    pantry: s.pantry,
    quests: s.quests,
    lucky: s.lucky,
    luckyMonth: s.luckyMonth,
    scouts: s.scouts,
    scout: s.scout,
    wardrobe: s.wardrobe,
    recent: s.recent,
    printWorn: s.printWorn,
    printsSeen: s.printsSeen,
    lightsOwned: s.lightsOwned,
    marketLight: s.marketLight,
    patron: s.patron,
    carsOwned: s.carsOwned,
    carOn: s.carOn,
    carCab: s.carCab,
    carCans: s.carCans,
    carPaint: s.carPaint,
    houses: s.houses,
    homeClaims: s.homeClaims,
    skins: s.skins,
    mapSkin: s.mapSkin,
    paints: s.paints,
    atlas: s.atlas,
    survey: s.survey,
    vaults: s.vaults,
    mapKeys: s.mapKeys,
    contract: s.contract,
    streak: s.streak,
    shieldDay: s.shieldDay,
    bestStreak: s.bestStreak,
    vaultsOpened: s.vaultsOpened,
    correctByTier: s.correctByTier,
    wheelClaimed: s.wheelClaimed,
    wheel: s.wheel,
    distanceM: s.distanceM,
    lastCrateDay: s.lastCrateDay,
    crateStreak: s.crateStreak,
    posters: s.posters,
    souvenirs: s.souvenirs,
    lastPulseDay: s.lastPulseDay,
    lastBlitzDay: s.lastBlitzDay,
    lastBlitzOfferDay: s.lastBlitzOfferDay,
    goals: s.goals,
    cacheDay: s.cacheDay,
    passGift: s.passGift,
    blitzTake: s.blitzTake,
    blitzMatches: s.blitzMatches,
    sparkDay: s.sparkDay,
    sparkN: s.sparkN,
    sparkLamps: s.sparkLamps,
    dailyPaid: s.dailyPaid,
    friendPaid: s.friendPaid,
    giftsSeen: s.giftsSeen,
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
    landAtStation: s.landAtStation,
    pressPass: s.pressPass,
    stockPaid: s.stockPaid,
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
  if (add.green) return `${list} key${parts.length > 1 || add.white > 1 ? "s" : ""}. You sat the whole haul.`;
  if (add.blue) return `${list} key${parts.length > 1 || add.white > 1 ? "s" : ""} in the car.`;
  if (add.white === 1) return "White key. Left on the seat.";
  return `${add.white} white keys in the car.`;
}

function flashToast(set: (p: Partial<GameState>) => void, get: () => GameState, msg: string, ms = 2000) {
  set({ toast: msg });
  window.setTimeout(() => {
    if (get().toast === msg) set({ toast: null });
  }, ms);
}

// 0.1.87: the errand is gone; answers no longer touch the quest log.
function answered(get: () => GameState, _correct: boolean, _perfect: boolean) {
  return get().quests;
}

function cleared(get: () => GameState, base: QuestLog, poi: { id: string; tier: Tier }) {
  let quests = base;
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
  // 0.0.89: any unclaimed spin of this color, not only the exact 25th, so "Later" or a failed claim comes back.
  if (wheelDue(n, claimed)) {
    return { correctByTier, wheel: buildWheel(tier, get().cityId, Math.random()) };
  }
  return { correctByTier, wheel: held };
}

const DEAL_FAIL = "The vault can't reach the card office. Check your connection and try again — no key spent.";
const SEEN_ID = /^[A-Za-z0-9_:.~-]{1,80}$/;

/**
 * 0.0.53: ask the server for a trivia card (triviaApi.dealTrivia). It picks from its own bank with this save's
 * seen ids (anti-repeat), the lamp's tier and topics, and returns the prompt and shuffled
 * choices with a signed token — never the answer. Null when the server can't be reached (nothing is spent).
 */
/** 0.0.58: fold another tab's seen cards (the saved list) into this tab's before a deal. */
function foldSavedSeen(set: (p: Partial<GameState>) => void, get: () => GameState) {
  if (typeof window === "undefined") return;
  let other: ReturnType<typeof savedSeen> = null;
  try {
    other = savedSeen(localStorage.getItem(SAVE_KEY));
  } catch {
    return;
  }
  if (!other) return;
  const mine = get();
  const seenIds = mergeSeen(other.seenIds, mine.seenIds ?? [], ASKED_KEEP);
  const asked = mergeSeen(other.asked, mine.asked ?? [], ASKED_KEEP);
  if (seenIds !== mine.seenIds || asked !== mine.asked) set({ seenIds: [...seenIds], asked: [...asked] });
}

/** Street blanks are lamps. Counters and boards are not dealt as trivia. */
function lampKind(kind: PoiKind): kind is Exclude<PoiKind, "counter" | "board"> {
  return kind !== "counter" && kind !== "board";
}

async function dealCard(
  set: (p: Partial<GameState>) => void,
  get: () => GameState,
  poiId: string,
  cat: FieldPick,
  step: number,
  prevToken?: string,
  hearthPrev?: string,
): Promise<{ card: DealtCard; token: string; windowMs: number; wallet?: ServerWallet } | { need: true } | { lockedMs: number } | null> {
  foldSavedSeen(set, get);
  const st = get();
  const city = CITIES[st.cityId];
  const named = city.pois.find((p) => p.id === poiId) ?? marketLanternById(st.cityId, poiId, Date.now()) ?? hearthPois(st.cityId).find((p) => p.id === poiId);
  const blank = named ? undefined : st.blanks.find((p) => p.id === poiId);
  const dealBlank =
    blank && lampKind(blank.kind)
      ? { name: blank.name.slice(0, 120), kind: blank.kind, tier: blank.tier }
      : undefined;
  if (!named && !dealBlank) return null;
  const spark = Boolean(st.openVault?.spark);
  const extra = (st.pressPass > 0 ? 5000 : 0) + bestVaultMs(wornPerk(st.scout).vaultMs, seatedCar(st));
  const windowMs = spark ? 20000 : step > 0 ? 25000 : 25000 + extra;
  const spot = named ?? blank;
  // 0.1.158: only a street lamp's first card can be True/False or Closest Number (no spark, Hearth, Blitz or Flight).
  const street = !spark && step === 0 && !hearthPrev && !poiId.startsWith("placed-") && !poiId.startsWith("blitz-");
  const input: DealInput = {
    city: st.cityId,
    cat,
    poiId,
    blank: dealBlank,
    ...(hearthPrev ? { hearthPrev } : {}),
    spark: spark || undefined,
    windowMs,
    seen: (st.seenIds ?? []).filter((x) => SEEN_ID.test(x)).slice(-SEEN_MAX),
    saveId: st.saveId,
    pay: {
      streak: Math.max(0, Math.min(80, Math.floor(st.streak) || 0)),
      loot: wornPerk(st.scout).loot ?? 1,
      lucky: luckyOn(st),
      cloth: st.quests.worn,
      charmDay: typeof st.charmDay === "string" ? st.charmDay.slice(0, 10) : "",
      charmTopics: (st.charmTopics ?? []).slice(0, 3),
      lat: spot?.lat ?? 0,
      lng: spot?.lng ?? 0,
      prevToken,
      scout: st.scout,
      ...(seatedCar(st) ? { car: seatedCar(st)! } : {}),
    },
    ...(street ? { formats: ["tf", "near"] as ("tf" | "near")[] } : {}),
  };
  try {
    const r = await dealTrivia({ data: input });
    if (!r.ok) return r.reason === "no-match" ? { need: true } : r.reason === "locked-out" ? { lockedMs: r.leftMs } : null;
    return { card: r.card, token: r.token, windowMs: r.windowMs, wallet: r.wallet };
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

/** 0.1.106: the account's worn picks from the last sign-in sync, waiting for syncWorn. */
let accountWorn: AccountWorn | null = null;

function wornPicks(s: GameState): WornPicks {
  return { print: s.printWorn, cloth: s.quests.worn ?? null, car: carPick(s.carOn, s.carCab), light: s.marketLight };
}

/** 0.1.105: the account's paint bench from the last sign-in sync, waiting for syncDyes. */
let accountDyes: ServerBench | null = null;

function cleanServerBench(v: { coats: string[]; vaults: string[]; wornCoat: string | null; wornVault: string | null; rows: number }): ServerBench {
  return { ...cleanPaint(v), rows: Number(v.rows) || 0 };
}

/** 0.0.98: scouts the server reported as owned on sign-in; a refused buy never rolls these back. */
const serverOwnedScouts = new Set<string>();

/** 0.1.9: a paint can the server just handed over (vault or cache): into the satchel, with a toast. */
function gotCan(c: { car: string; color: string }) {
  const can = parseCan(`${c.car}:${c.color}`);
  if (!can) return;
  const st = useGame.getState();
  useGame.setState({ carCans: [...st.carCans, canId(can)] });
  window.setTimeout(() => {
    useGame.setState({ toast: `Found a paint can: ${carOf(can.car)?.name} · ${colorOf(can.car, can.color)?.name}. Paint it at a car lot.` });
    window.setTimeout(() => useGame.setState({ toast: null }), 2600);
  }, 1800);
}

function cleanHouses(v: unknown): Partial<Record<CityId, HouseState>> {
  const out: Partial<Record<CityId, HouseState>> = {};
  if (v && typeof v === "object")
    for (const [k, h] of Object.entries(v as Record<string, { tier?: unknown; items?: unknown }>))
      if (k in CITIES && h && isHouseTier(h.tier)) out[k as CityId] = { tier: h.tier, ...(Array.isArray(h.items) ? { items: h.items.filter((x) => typeof x === "string") } : {}) };
  return out;
}

function savedCars(raw: string | null): { owned: CarId[]; on: CarId | null; cab: boolean } | null {
  try {
    const v = raw ? JSON.parse(raw) : null;
    if (!v || !Array.isArray(v.carsOwned)) return null;
    return { owned: v.carsOwned.filter(isCarId), on: isCarId(v.carOn) ? v.carOn : null, cab: v.carCab === true };
  } catch {
    return null;
  }
}

function cleanCarPaint(v: unknown): Partial<Record<CarId, string>> {
  const out: Partial<Record<CarId, string>> = {};
  if (v && typeof v === "object") for (const [k, c] of Object.entries(v as Record<string, unknown>)) if (isCarId(k) && typeof c === "string" && colorOf(k, c)) out[k] = c;
  return out;
}

/** 0.1.46: the Magnet's drive ping (at most once a minute) goes first, then the pull; at the server's cap the Magnet stops for the day. */
let drivePingAt = 0;
export async function drivePing(city: CityId, force = false) {
  if (!walletLive()) return;
  if (!force && Date.now() - drivePingAt < DRIVE_PING_MS) return;
  drivePingAt = Date.now();
  await commitWallet({ kind: "drive", city });
}
async function magnetCommit(op: Parameters<typeof commitWallet>[0], city: CityId) {
  if (!walletLive()) return;
  await drivePing(city);
  const r = await commitWallet(op);
  if (r && !r.ok && r.reason === "magnet-capped") {
    const md = useGame.getState().magnetDay;
    useGame.setState({ magnetDay: { ...md, n: MAGNET_DAY_CAP, full: true } });
  }
}

function pushOp(op: Parameters<typeof commitWallet>[0], undo?: () => void) {
  if (!walletLive()) return;
  void commitWallet(op).then((r) => {
    if (r && !r.ok && undo) undo();
  });
}

/** After a migrated grade, the server pocket wins. Survey, contract and goal extras are credited on top. */
function applyServerGrade(
  wallet: ServerWallet,
  award: ServerAward | undefined,
  surveyBefore: Record<string, true>,
  goalsBefore: readonly string[],
  contractBefore: { ids: string[]; done: string[]; nonces?: string[] } | null,
) {
  const st = useGame.getState();
  const surveyNew = Object.keys(st.survey).filter((id) => !surveyBefore[id]);
  const goalsNew = st.cities.goalsPaid.filter((id) => !goalsBefore.includes(id));
  const contractDone = Boolean(
    contractBefore &&
      contractBefore.ids.length > 0 &&
      contractBefore.done.length < contractBefore.ids.length &&
      st.contract &&
      st.contract.ids.join("|") !== contractBefore.ids.join("|"),
  );
  const loot = st.loot;
  st.adoptWallet(wallet);
  if (typeof wallet.streakRun === "number") useGame.setState({ serverStreak: wallet.streakRun, streakLord: wallet.streakLord === true });
  if (award && loot && useGame.getState().loot) {
    const amber = (award.keys.amber ?? 0) + (contractDone ? 1 : 0);
    const keys = { ...award.keys };
    if (contractDone) keys.amber = amber;
    useGame.setState({
      loot: {
        ...useGame.getState().loot!,
        points: award.coins + (contractDone ? 1500 : 0),
        keys,
        boosts: award.boosts.length ? award.boosts : undefined,
      },
    });
  }
  void (async () => {
    for (const id of surveyNew) await commitWallet({ kind: "survey", id });
    for (const cityId of goalsNew) await commitWallet({ kind: "goal", cityId: cityId as CityId });
    if (contractDone && contractBefore?.nonces?.length) {
      await commitWallet({ kind: "contract", nonces: contractBefore.nonces.slice(0, 8) });
    }
  })();
}

function paySurvey(set: (p: Partial<GameState>) => void, get: () => GameState, keys?: Record<Tier, number>) {
  const before = get().survey;
  const hit = takeSurvey({
    atlas: get().atlas,
    distanceM: get().distanceM,
    survey: get().survey,
    keys: keys ?? get().keys,
  });
  if (!hit) return false;
  sfx.pickup();
  set({ keys: hit.keys, survey: hit.survey });
  for (const id of Object.keys(hit.survey)) {
    if (!before[id]) pushOp({ kind: "survey", id });
  }
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
const passGiftDue = typeof window !== "undefined" && saved?.passGift !== true;
/** 0.1.22: charms printed before they retired (an old save's `charms`); moved to the server once by runLegacy. */
const oldCharmsRaw = (saved as { charms?: unknown } | null)?.charms;
const oldCharms: string[] = Array.isArray(oldCharmsRaw) ? oldCharmsRaw.filter((x): x is string => typeof x === "string") : [];
const savedCity = saved?.cityId && saved.cityId in CITIES ? saved.cityId : "austin";

/** Send the open card's answer to the server and apply its grade. `choice` and `guess` both absent: the wick ran out. */
function sendAnswer(set: (p: Partial<GameState>) => void, get: () => GameState, choice: string | null, guess: number | undefined, now: number) {
  const ov = get().openVault;
  if (!ov?.question || ov.pending) return;
  const token = ov.token;
  const timeout = choice == null && guess == null;
  const clientMs = Math.max(0, now - ov.startedAt);
  if (!token) return;
  set({ openVault: { ...ov, pending: "grade" } });
  const lost = () => {
    const cur = get().openVault;
    if (!cur || cur.token !== token) return;
    if (timeout || performance.now() >= cur.deadline) {
      // The wick is out and the lamp can't be reached: a miss (never a reward without the server's grade).
      set({ openVault: { ...cur, pending: undefined } });
      get().settleAnswer({ correct: false, elapsed: clientMs, reveal: "The vault lost its line — no answer this time.", credited: false }, performance.now());
      return;
    }
    set({ openVault: { ...cur, pending: undefined } });
    flashToast(set, get, "The vault lost its line. Tap your answer again.", 2600);
  };
  void gradeTrivia({ data: { token, choice: timeout ? null : choice, clientMs, ...(guess != null ? { guess } : {}) } })
    .then((res: GradeResult) => {
      const cur = get().openVault;
      if (!cur || cur.token !== token) return;
      if (!res.ok) return lost();
      set({ openVault: { ...cur, pending: undefined } });
      const surveyBefore = get().survey;
      const goalsBefore = get().cities.goalsPaid;
      const contractBefore = get().contract;
      get().settleAnswer(
        {
          correct: res.correct,
          elapsed: res.elapsedMs,
          reveal: res.answer,
          fact: res.fact,
          credited: res.credited,
          paints: res.paints,
          lockoutMs: res.lockoutMs,
          ...(res.near ? { near: res.near, grade: res.grade, mult: res.mult } : {}),
        },
        performance.now(),
      );
      if (res.wallet) applyServerGrade(res.wallet, res.award, surveyBefore, goalsBefore, contractBefore);
      if (res.can) gotCan(res.can);
    })
    .catch(() => lost());
}

export const useGame = create<GameState>((set, get) => ({
  screen: "title",
  cityId: savedCity,
  keys: cleanKeys({ ...EMPTY_KEYS, ...saved?.keys }),
  credit: cleanCredit((saved as { credit?: unknown } | null)?.credit),
  points: saved?.points ?? 0,
  brass: saved?.brass ?? 0,
  ink: saved?.ink ?? 0,
  vellum: saved?.vellum ?? 0,
  schematics: saved?.schematics ?? 0,
  pantry: saved?.pantry ?? {},
  quests: hydrateQuests(saved?.quests, savedCity, oldCharms),
  lucky: saved?.lucky === true || oldCharms.includes("lucky"),
  luckyMonth: typeof saved?.luckyMonth === "string" ? saved.luckyMonth : "",
  scouts: saved?.scouts?.length ? saved.scouts : ["raccoon"],
  scout: saved?.scout ?? "raccoon",
  wardrobe: cleanWardrobe(saved?.wardrobe),
  recent: Array.isArray(saved?.recent) ? saved.recent.slice(0, RECENT_MAX) : [],
  lightsOwned: Array.isArray(saved?.lightsOwned) ? saved.lightsOwned.filter((x: unknown) => typeof x === "string") : ["amber"],
  marketLight: typeof saved?.marketLight === "string" ? saved.marketLight : "amber",
  patron: cleanPatron((saved as { patron?: unknown } | null)?.patron, Date.now()),
  carsOwned: Array.isArray(saved?.carsOwned) ? saved.carsOwned.filter(isCarId) : [],
  carOn: driveOf(Array.isArray(saved?.carsOwned) ? saved.carsOwned.filter(isCarId) : [], isCarId(saved?.carOn) ? saved.carOn : null, saved?.carCab === true),
  carCab: saved?.carCab === true,
  carCans: Array.isArray(saved?.carCans) ? saved.carCans.filter((x: unknown) => parseCan(x)) : [],
  carPaint: cleanCarPaint(saved?.carPaint),
  houses: cleanHouses(saved?.houses),
  homeClaims: Array.isArray(saved?.homeClaims) ? saved.homeClaims.filter((x: unknown) => typeof x === "string").slice(-40) : [],
  houseNear: false,
  houseOpen: false,
  skins: cleanSkins(saved?.skins),
  mapSkin: isSkinId(saved?.mapSkin) ? saved.mapSkin : "default",
  skinsOpen: false,
  skinPreview: null,
  dealerOpen: false,
  dealerNear: false,
  printWorn: typeof saved?.printWorn === "string" ? saved.printWorn : null,
  printsSeen: Array.isArray(saved?.printsSeen) ? saved.printsSeen.filter((x: unknown) => typeof x === "string") : [],
  paints: cleanPaint(saved?.paints),
  atlas: saved?.atlas ?? {},
  survey: saved?.survey ?? {},
  vaults: saved?.vaults ?? {},
  mapKeys: saved?.mapKeys?.length ? saved.mapKeys : seedKeys(savedCity),
  contract: saved?.contract ?? null,
  streak: saved?.streak ?? 0,
  serverStreak: null,
  streakLord: false,
  matchPop: null,
  shieldDay: saved?.shieldDay ?? "",
  bestStreak: saved?.bestStreak ?? 0,
  vaultsOpened: saved?.vaultsOpened ?? 0,
  correctByTier: { ...EMPTY_CORRECT, ...saved?.correctByTier },
  wheelClaimed:
    saved && saved.wheelClaimed
      ? { ...emptyWheelClaims(), ...saved.wheelClaimed }
      : caughtUpClaims({ ...EMPTY_CORRECT, ...saved?.correctByTier }),
  wheel: null,
  wheelPaid: null,
  distanceM: saved?.distanceM ?? 0,
  lastCrateDay: saved?.lastCrateDay ?? "",
  crateStreak: saved?.crateStreak ?? 0,
  posters: cleanPosters(saved?.posters),
  souvenirs: cleanSouvenirs(saved?.souvenirs),
  flight: null,
  loop: null,
  lastPulseDay: typeof saved?.lastPulseDay === "string" ? saved.lastPulseDay : "",
  lastBlitzDay: typeof saved?.lastBlitzDay === "string" ? saved.lastBlitzDay : "",
  blitzTake: typeof saved?.blitzTake === "number" && saved.blitzTake > 0 ? Math.floor(saved.blitzTake) : 0,
  blitzMatches: cleanBlitzMatches(saved?.blitzMatches),
  blitzOpen: false,
  cratePop: null,
  blitzOffer: false,
  lastBlitzOfferDay: typeof saved?.lastBlitzOfferDay === "string" ? saved.lastBlitzOfferDay : "",
  goals: cleanGoals(saved?.goals, goalDay()),
  cacheDay: typeof saved?.cacheDay === "string" ? saved.cacheDay : "",
  sparkDay: saved?.sparkDay ?? "",
  sparkN: saved?.sparkN ?? 0,
  sparkLamps: saved?.sparkLamps ?? [],
  dailyPaid: Array.isArray(saved?.dailyPaid)
    ? saved.dailyPaid.filter((k): k is string => typeof k === "string")
    : legacyDailyPaid((saved as { dailyPaidDay?: unknown } | null | undefined)?.dailyPaidDay, legacyDailyRun()),
  friendPaid: Array.isArray(saved?.friendPaid) ? saved.friendPaid.filter((k): k is string => typeof k === "string") : [],
  giftsSeen: Array.isArray(saved?.giftsSeen) ? saved.giftsSeen.filter((k): k is string => typeof k === "string") : [],
  // 0.0.56: no save = a new player (picks a start city); a save without unlocks is from before 0.0.56 and migrates.
  // 0.0.90: one free pass, once per save (a new save starts at 1). Signed-in pockets are replaced by the server's on sync.
  cities: passGiftDue
    ? giftPass(saved ? (saved.cities ? cleanUnlocks(saved.cities) : migrateUnlocks(saved)) : freshUnlocks())
    : saved ? (saved.cities ? cleanUnlocks(saved.cities) : migrateUnlocks(saved)) : freshUnlocks(),
  passGift: true,
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
  journey: landOldTrain(saved?.journey, Date.now()),
  landAtStation: Boolean(saved?.landAtStation),
  pressPass: saved?.pressPass ?? 0,
  stockPaid: saved?.stockPaid === true,
  loot: null,
  miss: null,
  openVault: null,
  magnetDay: { day: "", city: "", n: 0 },
  hqOpen: false,
  guideOpen: false,
  invOpen: false,
  shopOpen: false,
  errandOpen: null,
  errandId: null,
  toast: passGiftDue ? PASS_GIFT_LINE : null,
  fireworks: null,
  hud: {
    nearestId: null,
    nearestDist: 99999,
    speed: 0,
    yaw: 0,
    stamina: 1,
    night: 0.2,
    waypoint: null,
    routeStops: 0,
    routeHold: false,
    seated: false,
    deskName: "",
    deskDist: 99999,
    aimDeg: 0,
  },

  setScreen: (s) => {
    set({ screen: s });
    if (s === "play") paySurvey(set, get);
    scheduleSave(get);
  },
  pickCity: (id) => {
    if (get().journey) {
      get().tickJourney();
      if (get().journey) return;
    }
    // 0.0.56: a new player's first pick is their start city; after that only unlocked cities can be entered.
    if (!get().cities.start) {
      set({ cities: chooseStart(get().cities, id) });
      pushOp({ kind: "start", cityId: id });
    }
    else if (!isUnlocked(get().cities, id)) {
      flashToast(set, get, `${CITIES[id]?.name ?? "That city"} is locked. ${lockLine(get().cities, id).replace(/^Locked · /, "")}`, 3200);
      return;
    }
    const prev = get();
    const same = prev.cityId === id && prev.mapKeys.length;
    if (!same) sfx.cityArrive();
    set({
      cityId: id,
      screen: "play",
      mapKeys: same ? prev.mapKeys : seedKeys(id),
      contract: same && prev.contract ? prev.contract : seedContract(id),
      openVault: null,
      hqOpen: false,
      invOpen: false,
      shopOpen: false,
      errandOpen: null,
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
    const before = get().cities;
    const r = unlockCityPass(before, id);
    if (!r) return isUnlocked(before, id) ? `${CITIES[id].name} is already open.` : lockLine(before, id);
    sfx.pickup();
    // Goals or Lantern Runs already finished in the new city count from the moment it opens.
    const goals = goalsCheck(r.u, id, get().atlas);
    set({ cities: goals.u });
    if (walletLive()) {
      void commitWallet({ kind: "unlock", cityId: id }).then((res) => {
        if (res == null) {
          set({ cities: before });
          saveNow(get);
          return;
        }
        if (!res.ok) return;
        if (goals.earned) return commitWallet({ kind: "goal", cityId: id });
      });
    }
    flashToast(set, get, `${CITIES[id].name} unlocked${r.paid === "free" ? " · your free second city" : " · 1 city pass spent"}.${goals.earned ? " Every place there already visited: city pass earned." : ""}`, 2800);
    saveNow(get);
    return null;
  },
  // Battery: the map loop reports the HUD 10x a second; skip the store update (and every HUD re-render) when nothing changed.
  setHud: (h) => {
    const cur = get().hud as unknown as Record<string, unknown>;
    if (Object.keys(h).every((k) => Object.is(cur[k], (h as Record<string, unknown>)[k]))) return;
    set({ hud: { ...get().hud, ...h } });
  },
  routeCancel: 0,
  cancelRoute: () => set({ routeCancel: get().routeCancel + 1 }),
  unstuck: 0,
  unstick: () => {
    // Same as a reload, nothing lost: no cooldown, card, coin or match changes. An open card is closed the
    // normal way (its match comes back, like Esc), then panels close and the street/wallet re-binds.
    if (get().openVault) get().closeVault();
    set({ hqOpen: false, invOpen: false, shopOpen: false, errandOpen: null, guideOpen: false, blitzOpen: false, cratePop: null, blitzOffer: false, unstuck: get().unstuck + 1 });
    get().bindStreet();
  },
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
    if (goals.earned) pushOp({ kind: "goal", cityId: get().cityId });
    const surveyPaid = paySurvey(set, get);
    if (goals.earned) flashToast(set, get, msg, 2800);
    else if (!surveyPaid) flashToast(set, get, msg, 1400);
    scheduleSave(get);
  },
  magnetKey: (id) => {
    const day = new Date().toISOString().slice(0, 10);
    const city = get().cityId;
    const md = get().magnetDay.day === day && get().magnetDay.city === city ? get().magnetDay : { day, city, n: 0 };
    if (md.full || md.n >= MAGNET_DAY_CAP) {
      if (!md.full) {
        set({ magnetDay: { ...md, full: true }, toast: "Magnet's full for today" });
        window.setTimeout(() => { if (get().toast === "Magnet's full for today") set({ toast: null }); }, 1800);
      }
      return false;
    }
    set({ magnetDay: { ...md, n: md.n + 1 } });
    get().collectKey(id, "magnet");
    return true;
  },
  collectKey: (id, via) => {
    const k = get().mapKeys.find((x) => x.id === id);
    if (!k) return;
    const mult = marketMult(get().cityId, Date.now(), { kind: "match", lat: k.lat, lng: k.lng });
    // A street match always lands (as before); the market's second one respects the pocket cap and pays coin if it's full.
    const firstKeys = { ...get().keys, [k.tier]: get().keys[k.tier] + 1 };
    const second = mult > 1 ? payMatchesOf(firstKeys, k.tier, mult - 1) : { keys: firstKeys, coin: 0, add: {}, up: 0 };
    const add = 1 + (second.add[k.tier] ?? 0);
    const coin = second.coin;
    const keys = second.keys;
    get().noteGoalKind("street");
    sfx.pickup();
    set({
      keys,
      points: get().points + coin,
      mapKeys: get().mapKeys.filter((x) => x.id !== id),
      lastKeyAt: Date.now(),
      toast:
        mult > 1
          ? `${MARKET_TAG} · ${add} ${TIER_LABEL[k.tier]} key${add === 1 ? "" : "s"}${coin ? ` + ${coin} coin (every pocket full)` : ""}`
          : via === "magnet"
            ? `Magnet: +1 ${TIER_LABEL[k.tier]}`
            : `${TIER_LABEL[k.tier]} key`,
    });
    if (via === "magnet") {
      const city = get().cityId;
      void magnetCommit({ kind: "street", id: k.id, tier: k.tier, city, lat: k.lat, lng: k.lng, via: "magnet" }, city);
    } else pushOp({ kind: "street", id: k.id, tier: k.tier, city: get().cityId, lat: k.lat, lng: k.lng });
    scheduleSave(get);
    window.setTimeout(() => {
      if (get().toast?.includes(" key") || get().toast?.startsWith("Magnet:")) set({ toast: null });
    }, 1400);
  },
  maybeSpawnKey: (now) => {
    const playMin = (now - get().sessionAt) / 60_000 + get().vaultsOpened * 0.35;
    const pocket = pocketStreet(get().keys);
    // 0.0.93: no pause at 7+ held matches any more; the map cap and the 80/day cap still apply.
    const cap = streetKeyCap(pocket);
    // 0.0.90: twice as often (was max(28s, 78s − play·0.9s)).
    const interval = Math.max(14_000, 39_000 - playMin * 450);
    if (get().mapKeys.length >= cap) return;
    if (now - get().lastKeyAt < interval) return;
    if (walletLive()) {
      const key = issuedKey(get().cityId, get().mapKeys);
      if (!key) return;
      set({ mapKeys: [...get().mapKeys, key], lastKeyAt: now });
      scheduleSave(get);
      return;
    }
    set({
      mapKeys: [...get().mapKeys, marketKey(get().cityId, streetKeyTier(playMin), now) ?? placeKey(get().cityId, streetKeyTier(playMin), get().mapKeys)],
      lastKeyAt: now,
    });
    scheduleSave(get);
  },
  bindStreet: () => {
    const player = streetPlayer();
    if (!walletLive() || !player) return;
    const cityId = get().cityId;
    const day = new Date().toISOString().slice(0, 10);
    let changed = false;
    const held = [...get().mapKeys];
    const mapKeys = get().mapKeys.map((k) => {
      const parsed = parseStreetId(k.id);
      if (parsed && parsed.city === cityId && parsed.day === day) return k;
      const next = issuedKey(cityId, held);
      if (!next) return k;
      held.push(next);
      changed = true;
      return next;
    });
    if (!changed) return;
    set({ mapKeys });
    scheduleSave(get);
  },
  seedBlanks: (list) => {
    if (get().blanks.length) return;
    if (!list.length) return;
    set({ blanks: list });
    scheduleSave(get);
  },
  spreadDrops: (keys) => {
    if (get().streetSpread) return;
    set({ mapKeys: keys, streetSpread: true });
    scheduleSave(get);
  },
  tryOpen: (poiId, now) => {
    const city = CITIES[get().cityId];
    const poi = livePois(city, get().blanks).find((p) => p.id === poiId);
    if (!poi) return "No vault.";
    // 0.0.57: one lamp at a time. An answer with the server stays; any other open card is walked away from first (its held match comes back).
    if (get().openVault?.poiId === poiId) return null;
    if (get().openVault?.pending === "grade") return "Finish this trivia card first.";
    if (get().openVault) get().closeVault();
    if (isScoutShop(poi) || isCounter(poi) || isBoard(poi)) {
      sfx.open();
      set({
        shopOpen: isScoutShop(poi),
        errandOpen: isCounter(poi) ? "counter" : isBoard(poi) ? "board" : null,
        errandId: isCounter(poi) || isBoard(poi) ? poi.id : null,
        hqOpen: false,
        invOpen: false,
        openVault: null,
        loot: null,
        miss: null,
      });
      return null;
    }
    // 0.1.41: a train stop is never a lamp (the board opens from the map when you have a ticket).
    const desk = fareDeskNote(poi, get().cityVaults, get().hud.seated);
    if (desk) return desk;
    const v = get().vaults[poiId];
    const clock = Date.now();
    if (v && v.state === "cooling" && v.coolUntil > clock)
      return v.lockout ? `Locked out for ${lockClock(v.coolUntil - clock)}. Wrong answer; try another vault.` : `This vault is dark for ${formatCool(v.coolUntil - clock)}.`;
    if (!hasMatch(get().keys, poi.tier)) {
      // 0.1.19 (Ryan): violet never sparks; it needs a violet match.
      if (!sparkTier(poi.tier)) return `Need a ${TIER_LABEL[poi.tier]} key.`;
      const spark = sparksNow(get);
      if (spark.sparkN >= SPARK_DAY) return `Need a ${TIER_LABEL[poi.tier]} key. Sparks are spent today.`;
      if (spark.sparkLamps.includes(poiId)) return `Need a ${TIER_LABEL[poi.tier]} key. This vault already sparked.`;
      sfx.vaultOpen(poi.tier);
      set({
        openVault: { poiId, startedAt: now, question: null, category: null, deadline: now, spark: true },
        hqOpen: false,
        invOpen: false,
        shopOpen: false,
        errandOpen: null,
        loot: null,
        miss: null,
      });
      return null;
    }
    sfx.vaultOpen(poi.tier);
    set({
      openVault: { poiId, startedAt: now, question: null, category: null, deadline: now },
      hqOpen: false,
      invOpen: false,
      shopOpen: false,
      errandOpen: null,
      loot: null,
      miss: null,
    });
    return null;
  },
  pickCategory: (cat, _now) => {
    const ov = get().openVault;
    if (!ov || ov.question || ov.pending) return;
    // 0.0.57: the tier this card costs (none for a spark). Re-checked here and taken atomically when the card lands.
    const lampTier: Tier | null = ov.spark ? null : (anyPois(CITIES[get().cityId], get().blanks).find((p) => p.id === ov.poiId)?.tier ?? null);
    if (!ov.spark && !lampTier) return;
    // 0.1.117: a Double/Triple Hearth spends its one key on the first question; later picks cost nothing and can't reuse a field.
    const hv = hearthOf(ov.poiId);
    const run = hv && hearthVersion(hv.v) > 1 ? (ov.hearth ?? { step: 0, used: [] }) : undefined;
    if (run && hv && slotUsed(hv.cats, run.used, cat)) return;
    const cost: Tier | null = run && run.step > 0 ? null : lampTier;
    if (cost && !hasMatch(get().keys, cost)) {
      flashToast(set, get, `Need a ${TIER_LABEL[cost]} key.`, 2400);
      set({ openVault: null });
      return;
    }
    sfx.ui();
    set({ openVault: { ...ov, category: cat, pending: "deal" } });
    void dealCard(set, get, ov.poiId, cat, 0, undefined, run?.prev).then((dealt) => {
      const cur = get().openVault;
      if (!cur || cur.poiId !== ov.poiId || cur.pending !== "deal") return;
      if (!dealt) {
        // 0.1.117: a later Hearth question that won't deal ends the run (the server already counted the last one).
        if (run && run.step > 0) {
          set({ openVault: null });
          flashToast(set, get, `The Hearth run ends here. ${DEAL_FAIL}`, 3200);
          return;
        }
        set({ openVault: { ...cur, category: null, pending: undefined } });
        flashToast(set, get, DEAL_FAIL, 3200);
        return;
      }
      if ("lockedMs" in dealt) {
        // 0.1.107: the server's ledger still has this vault locked out (a reload or another device can't skip it).
        const prev = get().vaults[ov.poiId];
        set({ openVault: null, vaults: { ...get().vaults, [ov.poiId]: { ...prev, state: "cooling", coolUntil: Date.now() + dealt.lockedMs, lockout: true } } });
        flashToast(set, get, `Locked out for ${lockClock(dealt.lockedMs)}.`, 2400);
        scheduleSave(get);
        return;
      }
      if ("need" in dealt) {
        set({ openVault: null });
        flashToast(set, get, `Need a ${TIER_LABEL[cost!]} key.`, 2400);
        return;
      }
      const spark = Boolean(cur.spark);
      const extra = (get().pressPass > 0 ? 5000 : 0) + bestVaultMs(wornPerk(get().scout).vaultMs, seatedCar(get()));
      // Check and take the match in one step: if it was spent while the card was coming (another tab, an exchange), the lamp doesn't open.
      // A migrated wallet already paid on the server; that pocket is the one we keep.
      const keys = dealt.wallet ? cleanKeys(dealt.wallet.keys) : cost ? spendMatch(get().keys, cost) : get().keys;
      if (!keys) {
        set({ openVault: null });
        flashToast(set, get, `Need a ${TIER_LABEL[cost!]} key.`, 2400);
        return;
      }
      const pressPass = !spark && extra >= 5000 && get().pressPass > 0 ? get().pressPass - 1 : get().pressPass;
      // The wick starts when the card arrives, so the round trip never eats into the player's time.
      const shown = performance.now();
      set({
        keys,
        points: dealt.wallet ? dealt.wallet.coins : get().points,
        cities: dealt.wallet ? cleanUnlocks(dealt.wallet.cities) : get().cities,
        pressPass,
        openVault: {
          poiId: cur.poiId,
          category: cat,
          question: dealt.card,
          token: dealt.token,
          startedAt: shown,
          deadline: shown + dealt.windowMs,
          spark,
          dealtAt: Date.now(),
          held: cost ?? undefined,
          ...(run ? { hearth: run } : {}),
        },
        // 0.0.58: a card counts as seen the moment it's dealt (a reload or a second tab mid-card can't re-deal it).
        ...markSeen(get().asked, get().seenIds, dealt.card),
      });
      saveNow(get);
    });
  },
  answer: (choice, now) => sendAnswer(set, get, choice === "__timeout__" ? null : choice, undefined, now),
  answerNear: (guess, now) => {
    if (get().openVault?.question?.kind !== "near" || !Number.isFinite(guess)) return;
    sendAnswer(set, get, null, guess, now);
  },
  settleAnswer: (out, now) => {
    const ov = get().openVault;
    if (!ov?.question) return;
    const city = CITIES[get().cityId];
    const poi0 = anyPois(city, get().blanks).find((p) => p.id === ov.poiId);
    if (!poi0) return;
    // 0.1.117: a Double/Triple Hearth question plays at its step's tier (green → amber → red).
    const hRun = ov.hearth;
    const hV = hRun ? hearthVersion(hearthOf(ov.poiId)?.v) : 1;
    const poi = hRun && hV > 1 ? { ...poi0, tier: hearthTierAt(hV, hRun.step) } : poi0;
    // 0.0.90: the day's first graded answer (right or wrong) claims the morning crate.
    if (autoCrateDue(get().lastCrateDay, today())) get().claimCrate(true);
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
          ...missStreak(get),
          charmDay: boost.charmDay,
          charmTopics: boost.charmTopics,
          asked,
          seenIds,
          ...logged,
          openVault: null,
          loot: null,
          miss: { answer: out.reveal, fact: out.fact },
          toast: "Not quite. The vault goes dark for now.",
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
          ? `${MARKET_TAG}: ${sparkAdd} ${TIER_LABEL[poi.tier]} key${sparkAdd === 1 ? "" : "s"} from the spark${sparkCoin ? ` + ${sparkCoin} coin (every pocket full)` : ""}.`
          : null;
      const spun = foldWheel(get, poi.tier);
      const boost = rollBoosts(get, true, elapsed, ov.category);
      const questHit = cleared(get, answered(get, true, elapsed <= 3000), poi);
      if (have >= cap) {
        sfx.correct();
        // 0.0.96: a full tier steps the wick's match up (match ↑); coin only when every tier above is full.
        const stepped = payMatchesOf(get().keys, poi.tier, sparkMult);
        const paid = payBoosts(stepped.keys, get().points + stepped.coin, boost);
        const upTiers = (Object.keys(stepped.add) as Tier[]).map((t) => TIER_LABEL[t]).join(", ");
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
            upTiers ? `Key ↑ ${upTiers}.${sparkMult > 1 ? ` ${MARKET_TAG}.` : ""}` : `Every pocket is full: +${stepped.coin} coin.`,
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
              ? `A ${TIER_LABEL[poi.tier]} key from the spark. ${paid.boosts.join(" · ")}.`
              : `A ${TIER_LABEL[poi.tier]} key from the spark.`),
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

    // 0.0.57: the match left the pocket when the card was dealt (`held`); never take a second one here.
    // 0.1.117: a later Hearth question holds no key (the run spent one on question 1), so nothing is taken here either.
    const keys = ov.held ? cleanKeys(get().keys) : hRun && hRun.step > 0 ? cleanKeys(get().keys) : (spendMatch(get().keys, poi.tier) ?? cleanKeys(get().keys));
    // 0.1.117: a right answer before a Double/Triple Hearth's last question pays its tier coin (boosted) and opens the next pick.
    if (correct && hRun && hV > 1 && !hearthLast(hV, hRun.step) && ov.category) {
      const g: LootDrop["grade"] = elapsed <= 3000 ? "perfect" : elapsed <= 10000 ? "great" : "good";
      const m = g === "perfect" ? 1 : g === "great" ? 0.7 : 0.4;
      const bumped = bumpStreak(get);
      const coin = Math.round(
        rewardPoints(poi.tier, { mult: m, bonus: 1 + Math.min(0.4, bumped.streak * 0.05), diffMult: DIFF_MULT[ov.question.diff ?? 2], loot: wornPerk(get().scout).loot ?? 1 }) * hearthBoost(hV, hRun.step),
      );
      const boost = rollBoosts(get, true, elapsed, ov.category);
      const paid = payBoosts(keys, get().points + coin, boost);
      if (g === "perfect") sfx.perfect();
      else sfx.correct();
      const next = hRun.step + 1;
      set({
        keys: paid.keys,
        points: paid.points,
        ...bumped,
        charmDay: paid.charmDay,
        charmTopics: paid.charmTopics,
        asked,
        seenIds,
        ...logged,
        loot: null,
        miss: null,
        openVault: {
          poiId: ov.poiId,
          startedAt: now,
          question: null,
          category: null,
          deadline: now,
          hearth: { step: next, used: [...hRun.used, ov.category], prev: ov.token },
        },
        toast: `Right, +${coin} coin. Pick question ${next + 1} of ${hearthSteps(hV)}.`,
        quests: answered(get, true, g === "perfect"),
      });
      scheduleSave(get);
      return;
    }
    if (!correct) {
      sfx.wrong();
      const boost = rollBoosts(get, false, elapsed, ov.category);
      // 0.1.107: a wrong answer locks this vault out for the server's time (3 min I-III, 5 min IV-VI); the key stays used.
      const lockMs = out.lockoutMs ?? 0;
      const prev = get().vaults[poi.id];
      set({
        ...(lockMs > 0 ? { vaults: { ...get().vaults, [poi.id]: { ...prev, state: "cooling" as const, coolUntil: Date.now() + lockMs, lockout: true } } } : {}),
        keys,
        ...missStreak(get),
        charmDay: boost.charmDay,
        charmTopics: boost.charmTopics,
        asked,
        seenIds,
        ...logged,
        openVault: null,
        loot: null,
        miss: { answer: out.reveal, fact: out.fact, ...(lockMs > 0 ? { lockMs } : {}), ...(out.near ? { near: out.near } : {}) },
        toast: null,
        quests: answered(get, false, false),
      });
      scheduleSave(get);
      return;
    }
    let grade: LootDrop["grade"] = "good";
    let mult = 0.4;
    if (out.near && out.grade) {
      // 0.1.158 Closest Number: accuracy pays (the server's sliding scale), not speed.
      grade = out.grade;
      mult = out.mult ?? 0;
    } else if (elapsed <= 3000) {
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
    const lampCoin = Math.round(
      rewardPoints(poi.tier, {
        mult,
        bonus,
        diffMult: DIFF_MULT[diff],
        loot: wornPerk(get().scout).loot ?? 1,
      }) * (hRun && hV > 1 ? hearthBoost(hV, hRun.step) : 1),
    );
    const lampMarket = marketAt(city.id, ov.dealtAt ?? Date.now());
    const lampMult = onMarket(lampMarket, { kind: "lamp", poiId: poi.id, lat: poi.lat, lng: poi.lng }) ? MARKET_MULT : 1;
    // 0.1.82: brass, ink, vellum and press stock are cut (nothing spent them); only paint still drops.
    const brass = 0;
    const ink = 0;
    const vellum = 0;
    const schematic = false;
    const ing: IngredientId | null = null;
    const paints = paintsFromServer(poi.tier, out.paints);
    let pantry = ing ? addIngredient(get().pantry, ing) : get().pantry;
    for (const id of paints) pantry = addIngredient(pantry, id);
    const baseKeys: Partial<Record<Tier, number>> = {};
    if (luckyOn(get()) && Math.random() < LUCKY_MATCH_CHANCE) baseKeys[poi.tier] = 1;
    if (grade === "perfect" && Math.random() < PERFECT_BLUE_CHANCE) baseKeys.blue = (baseKeys.blue ?? 0) + 1;
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
      paint: paints[0] ? { id: paints[0], name: ingredientName(paints[0]) } : undefined,
      extraPaint: paints[1] ? { id: paints[1], name: ingredientName(paints[1]) } : undefined,
      market: lampMult > 1 && lampMarket ? { street: lampMarket.street.name, mult: lampMult, coin: lampPay.extraCoin, matches: lampPay.extraMatches } : undefined,
      ...(out.near ? { near: out.near } : {}),
    };
    let nextKeys = { ...keys };
    for (const [t, n] of Object.entries(extraKeys) as [Tier, number][]) {
      nextKeys[t] += n;
    }
    // 0.0.90: a lamp answered right is a perfect lamp: the spent match comes back, same tier. Not violet.
    const lBack = perfectBack(poi.tier, nextKeys);
    if (lBack.match) nextKeys[lBack.tier] = (nextKeys[lBack.tier] ?? 0) + lBack.match;
    if (lBack.match || lBack.coin) {
      loot.points += lBack.coin;
      loot.refund = { tier: lBack.tier, match: lBack.match, coin: lBack.coin, up: lBack.up };
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
    // 0.1.6: a lamp on the open night market rests four times as long (was 3x faster in 0.0.90 — players camped it).
    // 0.1.7: and each open of the same lamp today rests longer: 1x, 2x, 3x… (resets at the city's midnight).
    const openDay = cityDay(get().cityId, Date.now());
    const opens = openNumber(get().vaults[poi.id], openDay);
    // 0.1.45: the Shelby (Quick stop) rests lamps opened from it 15% shorter.
    // 0.1.45: the Mustang's Quick stop takes 15% off the whole rest while seated in it.
    const coolMs = stackedCoolMs(marketCoolMs(lampCoolMs(poi.tier), lampMult), opens);
    const restMs = Math.round(coolMs * carCool(seatedCar(get())));
    // 0.1.7: a market lantern opens once per market — it stays dark until its market closes (and then it is gone).
    const lanternLeft = isMarketLantern(poi.id) ? Math.max(restMs, lanternCycleEnd(poi.id) - Date.now()) : restMs;
    const vaults = { ...get().vaults, [poi.id]: { state: "cooling" as const, coolUntil: Date.now() + lanternLeft, opens, openDay } };
    let contract = get().contract;
    let contractToast: string | null = null;
    if (contract && contract.ids.includes(poi.id) && !contract.done.includes(poi.id)) {
      const done = [...contract.done, poi.id];
      const stamped = tokenNonce(ov.token);
      const nonces = [...(contract.nonces ?? [])];
      if (stamped && !nonces.includes(stamped)) nonces.push(stamped);
      contract.nonces = nonces;
      contract = { ...contract, done, nonces };
      if (done.length >= contract.ids.length) {
        nextKeys.amber += 1;
        loot.points += 1500;
        contractToast = "Contract complete. Amber key issued.";
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
        ? `A train ticket printed. Walk to ${fareDesk(CITIES[get().cityId]).name} to travel.`
        : `Another train ticket. Two is the pocket. Travel from ${fareDesk(CITIES[get().cityId]).name}.`;
    }
    if (grade === "perfect") sfx.perfect();
    else sfx.correct();
    if (grade === "perfect" && poi.tier === "violet") {
      popMatch({ kind: "perfect", big: "Perfect on violet!", sub: "The hardest vault, answered fast. Well done!", tiers: [], coin: 0, cheer: "violet" });
    }
    const spun = foldWheel(get, poi.tier);
    const wornCloth = get().quests.worn;
    const clothLine = tip > 0 && wornCloth ? `${clothName(wornCloth)} +${tip}.` : null;
    const ingLine = ing ? `${ingredientName(ing)} for the press.` : null;
    const paintLine = paints.length ? paints.map((id) => paintFoundLine(id)).join(" ") : null;
    const questHit = cleared(get, answered(get, true, grade === "perfect"), poi);
    // 0.0.56 city passes: amber+ lamp points (route a) and every place in the city (route b).
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
      toast: [passLine, contractToast, fareToast, surveyHit?.message, clothLine, paintLine, ingLine, questHit.line].filter(Boolean).join(" ") || null,
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
    // A trivia card that was shown and walked away from counts as seen, so closing is not a reroll.
    if (ov?.question) set(markSeen(get().asked, get().seenIds, ov.question));
    // 0.1.117: walking away mid-way through a Double/Triple Hearth ends the run; its key was spent on question 1.
    if (ov?.hearth && ov.hearth.step > 0) {
      const name = HEARTH_VERSION_NAME[hearthVersion(hearthOf(ov.poiId)?.v)];
      set({ openVault: null });
      flashToast(set, get, `You left the ${name} Hearth, so the run ends here.`, 2400);
      scheduleSave(get);
      return;
    }
    // A lamp walked away from before answering costs nothing: the held match goes back in the pocket.
    if (ov?.held) {
      const token = ov.token;
      set({ openVault: null, keys: refundMatch(get().keys, ov.held) });
      saveNow(get);
      if (token) pushOp({ kind: "refund", token });
      return;
    }
    set({ openVault: null });
    if (ov?.question) scheduleSave(get);
  },
  closeShop: () => set({ shopOpen: false, errandOpen: null }),
  closeErrand: () => set({ errandOpen: null }),
  claimCrate: (auto) => {
    const d = today();
    if (get().lastCrateDay === d) return;
    const day = nextCrateStreak(get().lastCrateDay, get().crateStreak, d);
    const loot = crateLoot(day);
    const keys = { ...get().keys };
    (Object.keys(loot) as Tier[]).forEach((t) => {
      keys[t] = (keys[t] ?? 0) + (loot[t] ?? 0);
    });
    sfx.crateOpen(`crate:${d}`);
    set({
      lastCrateDay: d,
      crateStreak: day,
      keys,
      ...(auto ? { cratePop: { day, line: crateLine(loot) } } : { toast: `Day ${day} crate. ${crateLine(loot)}.` }),
    });
    pushOp({ kind: "crate" });
    scheduleSave(get);
    if (auto) return;
    window.setTimeout(() => {
      if (get().toast?.includes("crate")) set({ toast: null });
    }, 2400);
  },
  dismissCratePop: () => {
    const d = today();
    const offer = blitzOfferDue(get().lastBlitzOfferDay, get().lastBlitzDay, d);
    set({ cratePop: null, ...(offer ? { blitzOffer: true, lastBlitzOfferDay: d } : {}) });
    if (offer) scheduleSave(get);
  },
  answerBlitzOffer: (play) => {
    set({ blitzOffer: false });
    if (play) get().openBlitz();
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
  openBlitz: () => {
    if (!blitzDue(get().lastBlitzDay, today())) return;
    set({ blitzOpen: true, hqOpen: false });
  },
  dismissBlitz: () => set({ blitzOpen: false }),
  lockBlitz: () => {
    const d = today();
    if (get().lastBlitzDay === d) return;
    set({ lastBlitzDay: d, blitzTake: 0, blitzMatches: [] });
    saveNow(get);
  },
  bankBlitz: (pay, tier, nonce) => {
    const n = Math.floor(pay);
    if (n <= 0 || get().lastBlitzDay !== today()) return { match: false, overflow: 0 };
    const have = get().keys[tier] ?? 0;
    const grant = blitzMatch(tier, have, matchCap(tier));
    set({
      points: get().points + n + grant.overflow,
      blitzTake: get().blitzTake + n + grant.overflow,
      keys: grant.match ? { ...get().keys, [tier]: have + 1 } : get().keys,
      blitzMatches: grant.match ? [...get().blitzMatches, tier] : get().blitzMatches,
    });
    saveNow(get);
    const step = BLITZ_STEPS.findIndex((s) => s.tier === tier);
    const stamped = tokenNonce(nonce);
    if (step >= 0 && stamped) pushOp({ kind: "blitz", step, nonces: [stamped] });
    return grant;
  },
  rememberCard: (id) => {
    if (!id) return;
    const seenIds = [...get().seenIds.filter((x) => x !== id), id].slice(-ASKED_KEEP);
    set({ seenIds });
    scheduleSave(get);
  },
  payDailyRun: (day, city) => {
    const marked = markDailyPaid(get().dailyPaid, day, city);
    if (!marked) return null;
    const paid = payDaily(get().keys, get().points);
    sfx.pickup();
    // 0.0.56: the 3rd paid Lantern Run in a city pays a city pass (route c), once per city.
    const runs = runFinished(get().cities, city);
    set({ dailyPaid: marked, keys: paid.keys, points: paid.points, cities: runs.u });
    pushOp({ kind: "daily", day, city });
    if (runs.earned) flashToast(set, get, `Third Lantern Run in ${CITIES[city]?.name ?? "this city"} · city pass earned.`, 3200);
    scheduleSave(get);
    return { added: paid.added, coins: paid.coins };
  },
  payFriendTickets: (ids, tiers = {}) => {
    const marked = markFriendPaid(get().friendPaid, ids);
    if (!marked.fresh.length) return { fresh: [], added: 0, coins: 0 };
    // 0.1.26: each ticket lands its ladder colour as the server reported it (the server wallet pays its own replay).
    let paid = { keys: get().keys, points: get().points, added: 0, coins: 0 };
    for (const id of marked.fresh) {
      const p = payFriend(paid.keys, paid.points, 1, matchCap("white"), payMatchesOf, tiers[id] ?? "white");
      paid = { keys: p.keys, points: p.points, added: paid.added + p.added, coins: paid.coins + p.coins };
    }
    sfx.pickup();
    set({ friendPaid: marked.paid, keys: paid.keys, points: paid.points });
    if (walletLive()) {
      const fresh = marked.fresh;
      void (async () => {
        for (const id of fresh) await commitWallet({ kind: "friend", id });
      })();
    }
    scheduleSave(get);
    return { fresh: marked.fresh, added: paid.added, coins: paid.coins };
  },
  bankUp: (tier) => {
    const spec = bankUpSpec(tier);
    if (!spec) return;
    const next = applyBank(get().keys, spec, matchCap);
    if (!next) {
      set({ toast: "Not enough keys of that color to forge." });
      window.setTimeout(() => set({ toast: null }), 1600);
      return;
    }
    sfx.pickup();
    set({ keys: next, toast: `Forged ${spec.payN} ${TIER_LABEL[spec.pay]} keys into 1 ${TIER_LABEL[spec.get]}.` });
    pushOp({ kind: "bank", dir: "up", tier });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 2000);
  },
  bankDown: (tier) => {
    const spec = bankDownSpec(tier);
    if (!spec) return;
    const next = applyBank(get().keys, spec, matchCap);
    if (!next) {
      set({ toast: "The forge can't split that key right now." });
      window.setTimeout(() => set({ toast: null }), 1600);
      return;
    }
    sfx.pickup();
    set({ keys: next, toast: `Split 1 ${TIER_LABEL[spec.pay]} key into ${spec.getN} ${TIER_LABEL[spec.get]}.` });
    pushOp({ kind: "bank", dir: "down", tier });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 2000);
  },
  claimQuest: async (period, id) => {
    if (!walletLive()) {
      flashToast(set, get, "Sign in to collect quests.", 1800);
      return null;
    }
    const r = await commitWallet({ kind: "quest", period, id });
    if (!r?.ok && !r?.replay) {
      flashToast(set, get, questClaimLine(r ? r.reason : "offline"), 2400);
      return null;
    }
    const lucky = r.quest?.lucky;
    if (lucky) set({ luckyMonth: lucky });
    const coins = r.award?.coins ?? 0;
    const keys = Object.entries(r.award?.keys ?? {}).filter(([, n]) => (n ?? 0) > 0) as [Tier, number][];
    const bits = [coins ? `+${coins.toLocaleString("en-US")} coin` : "", ...keys.map(([t, n]) => `${n > 1 ? `${n} ` : ""}${TIER_LABEL[t]}`), lucky ? "Lucky all next month" : ""].filter(Boolean);
    const line = r.replay ? "Already collected." : `Quest done! ${bits.join(" · ")}`;
    if (r.replay) sfx.ui();
    else sfx.questDone(`quest:${period}:${id}`);
    flashToast(set, get, line, 2200);
    saveNow(get);
    return line;
  },
  runLegacy: async () => {
    const legacy = get().quests.legacy;
    if (!legacy || !walletLive()) return;
    const r = await commitWallet({ kind: "legacy", claimed: legacy.claimed, circuits: legacy.circuits, unfinished: legacy.unfinished, charms: legacy.charms });
    if (!r?.ok) return;
    const st = get();
    let q: QuestLog = { ...st.quests, legacy: null };
    let lucky = st.lucky;
    const lines: string[] = [];
    for (const g of r.legacy ?? []) {
      if (g.kind === "title") {
        q = { ...q, title: q.title ?? g.title };
        lines.push(`Title: ${g.title}`);
      } else if (g.kind === "coin") lines.push(`+${g.coins.toLocaleString("en-US")} coin for Unbroken`);
      else if (g.kind === "pattern") q = { ...q, patterns: q.patterns + 1 };
      else if (g.kind === "cloth") q = { ...q, cloths: q.cloths.includes(g.cloth as ClothId) ? q.cloths : [...q.cloths, g.cloth as ClothId] };
      else if (g.kind === "thanks") lines.push(`+${g.coins.toLocaleString("en-US")} coin for milestone progress`);
      else if (g.kind === "lucky") lucky = true;
      else if (g.kind === "refund") lines.push(`Charm refunded: +${g.coins.toLocaleString("en-US")} coin`);
    }
    set({ quests: q, lucky });
    if (lines.length) flashToast(set, get, `Milestones and charms retired. ${[...new Set(lines)].join(" · ")}.`, 3200);
    saveNow(get);
  },
  wearCloth: (id) => {
    const owned = id == null || get().quests.cloths.includes(id);
    if (!owned) return;
    set({ quests: { ...get().quests, worn: id } });
    scheduleSave(get);
    pushOp({ kind: "wear", slot: "cloth", id });
  },
  convertGuestStock: () => {
    const s = get();
    if (s.stockPaid) return;
    let press = 0;
    for (const [id, n] of Object.entries(s.pantry)) if (!isPaintId(id)) press += Math.max(0, n ?? 0);
    const coin = stockCoin({ brass: s.brass, ink: s.ink, vellum: s.vellum, schematic: s.schematics, press });
    set({ stockPaid: true, points: s.points + coin });
    if (coin > 0) popMatch({ kind: "gift", big: "Old stock traded in", sub: stockNote(coin), tiers: [], coin: 0 });
    saveNow(get);
  },
  printPattern: () => {
    const s = get();
    // 0.1.82: a violet pattern alone prints Night glass.
    const printed = printPattern(s.quests);
    if (!printed) {
      flashToast(set, get, "Need a violet pattern.", 1600);
      return;
    }
    sfx.craft();
    set({ quests: printed.log });
    pushOp({ kind: "cloth", id: "night-glass" });
    flashToast(set, get, "Night glass printed.", 1600);
    scheduleSave(get);
  },
  buyCar: (id) => {
    const car = carOf(id);
    if (!car || get().carsOwned.includes(id)) return;
    if (!walletLive()) {
      flashToast(set, get, "Sign in to buy a car.", 1600);
      return;
    }
    if (get().points < car.price) {
      flashToast(set, get, "Need more coins.", 1400);
      return;
    }
    const before = { carsOwned: get().carsOwned, carOn: get().carOn };
    set({ points: get().points - car.price, carsOwned: [...before.carsOwned, id], carOn: id, carCab: false });
    sfx.carBuy();
    pushOp({ kind: "car", id }, () => set(before));
    flashToast(set, get, `${car.name} is yours. Tap CAB and it's at the curb.`, 2200);
    scheduleSave(get);
  },
  paintCar: (id, color) => {
    const car = carOf(id);
    const col = car ? colorOf(car.id, color) : null;
    const can = `${id}:${color}`;
    const st = get();
    if (!car || !col || !st.carsOwned.includes(id) || !st.carCans.includes(can)) return;
    if (!walletLive()) {
      flashToast(set, get, "Sign in to paint a car.", 1600);
      return;
    }
    const price = paintPrice(id);
    if (st.points < price) {
      flashToast(set, get, "Need more coins.", 1400);
      return;
    }
    const before = { carCans: st.carCans, carPaint: st.carPaint, points: st.points };
    const i = st.carCans.indexOf(can);
    set({ points: st.points - price, carCans: [...st.carCans.slice(0, i), ...st.carCans.slice(i + 1)], carPaint: { ...st.carPaint, [id]: color } });
    pushOp({ kind: "paint", car: id, color }, () => set(before));
    flashToast(set, get, `${car.name} painted ${col.name}.`, 2000);
    scheduleSave(get);
  },
  buyHouse: (city, tier) => {
    const def = houseOf(tier);
    const st = get();
    const owned = st.houses[city]?.tier ?? null;
    const cost = def ? houseCost(owned, def.id) : null;
    if (!def || cost === null) return;
    if (!walletLive()) {
      flashToast(set, get, "Sign in to buy a house.", 1600);
      return;
    }
    if (st.points < cost) {
      flashToast(set, get, "Need more coins.", 1400);
      return;
    }
    const before = { houses: st.houses, points: st.points };
    set({ points: st.points - cost, houses: { ...st.houses, [city]: { ...st.houses[city], tier: def.id } } });
    pushOp({ kind: "house", city, tier: def.id }, () => set(before));
    sfx.craft();
    flashToast(set, get, owned ? `Upgraded to the ${def.name}.` : `The ${def.name} is yours! Open ${HOME_LAMPS} vaults here, then turn the key for your daily key.`, 2400);
    scheduleSave(get);
  },
  turnKey: (city) => {
    const st = get();
    if (!st.houses[city]) return;
    if (!walletLive()) {
      flashToast(set, get, "Sign in to use your house.", 1600);
      return;
    }
    void commitWallet({ kind: "home", city }).then((r) => {
      if (!r) return flashToast(set, get, "Couldn't turn the key. Try again in a moment.", 2000);
      if (!r.ok && r.reason === "unproven") return flashToast(set, get, `Open ${HOME_LAMPS} vaults in this city today first, then turn the key.`, 2400);
      if (!r.ok) return flashToast(set, get, "Couldn't turn the key. Try again in a moment.", 2000);
      const h = r.home;
      const day = h?.day ?? cityDay(city, Date.now());
      set({ homeClaims: Array.from(new Set([...get().homeClaims, `hook:${city}:${day}`])).slice(-40) });

      sfx.pickup();
      flashToast(set, get, h?.match ? `You got ${h.n ?? 2} ${TIER_LABEL[h.match]} keys${h.coin ? ` and ${h.coin.toLocaleString("en-US")} coins` : ""}. Come back tomorrow for more.` : "You already got today's key. More at midnight.", 2600);
      saveNow(get);
    });
  },
  setHouseOpen: (open) => set({ houseOpen: open }),
  setSkinsOpen: (open) => set({ skinsOpen: open, skinPreview: null }),
  previewSkin: (id) => set({ skinPreview: id }),
  wearSkin: (id) => {
    if (!skinOwned(id, get().skins)) return;
    const before = get().mapSkin;
    set({ mapSkin: id, skinPreview: null });
    scheduleSave(get);
    if (walletLive()) void commitWallet({ kind: "skinOn", id }).then((r) => {
      if (r && !r.ok) set({ mapSkin: before });
    });
  },
  buySkin: (id) => {
    const def = skinOf(id);
    const st = get();
    if (!def || skinOwned(id, st.skins)) return;
    if (!walletLive()) {
      flashToast(set, get, "Sign in to buy a map skin. You can still try it on.", 1800);
      return;
    }
    if (st.points < def.price) {
      flashToast(set, get, "Need more coins.", 1400);
      return;
    }
    const before = { skins: st.skins, points: st.points };
    set({ points: st.points - def.price, skins: [...st.skins, id] });
    void commitWallet({ kind: "skin", id }).then((r) => {
      if (!r || !r.ok) {
        set(before);
        flashToast(set, get, "Couldn't buy the skin. Try again in a moment.", 2000);
        return;
      }
      get().wearSkin(id);
    });
    sfx.craft();
    flashToast(set, get, `${def.name} is yours.`, 1800);
  },
  setHouseNear: (near) => set({ houseNear: near, houseOpen: near ? get().houseOpen : false }),
  driveCar: (id) => {
    if (id && !get().carsOwned.includes(id)) return;
    set({ carOn: id, carCab: id === null });
    scheduleSave(get);
    pushOp({ kind: "wear", slot: "car", id: id ?? "cab" });
  },
  wearPrint: (id) => {
    if (get().printWorn === id) return;
    set({ printWorn: id });
    scheduleSave(get);
    pushOp({ kind: "wear", slot: "print", id });
  },
  showLight: (id) => {
    if (!get().lightsOwned.includes(id) || get().marketLight === id) return;
    set({ marketLight: id });
    scheduleSave(get);
    pushOp({ kind: "wear", slot: "light", id });
  },
  syncWorn: async () => {
    const account = accountWorn;
    if (!account || !walletLive()) return;
    accountWorn = null;
    const plan = planWornSync(wornPicks(get()), account);
    // Never undo a device-only pick: a refused backfill just stays on this device.
    for (const b of plan.backfill) await commitWallet({ kind: "wear", slot: b.slot, id: b.id });
    const s = get();
    const patch: Partial<GameState> = {};
    for (const slot of WEAR_SLOTS as WearSlot[]) {
      if (!(slot in plan.adopt)) continue;
      const v = plan.adopt[slot] ?? null;
      if (slot === "print") patch.printWorn = v;
      else if (slot === "cloth") {
        if (v === null || s.quests.cloths.includes(v as ClothId)) patch.quests = { ...s.quests, worn: v as ClothId | null };
      } else if (slot === "car") {
        if (v === "cab") Object.assign(patch, { carOn: null, carCab: true });
        else if (v === null) Object.assign(patch, { carOn: driveOf(s.carsOwned, null, false), carCab: false });
        else if (isCarId(v) && s.carsOwned.includes(v)) Object.assign(patch, { carOn: v, carCab: false });
      } else if (v && s.lightsOwned.includes(v)) patch.marketLight = v;
    }
    if (Object.keys(patch).length) {
      set(patch);
      saveNow(get);
    }
  },
  setDealerOpen: (open) => set({ dealerOpen: open }),
  setDealerNear: (near) => set({ dealerNear: near, dealerOpen: near ? get().dealerOpen : false }),
  buyLight: (id) => {
    const next = nextLight(get().lightsOwned);
    if (!next || next.id !== id) return;
    if (!walletLive()) {
      flashToast(set, get, "Sign in to buy market lights.", 1600);
      return;
    }
    if (get().points < next.price) {
      flashToast(set, get, "Need more coins.", 1400);
      return;
    }
    const before = get().lightsOwned;
    set({ points: get().points - next.price, lightsOwned: [...before, id], marketLight: id });
    pushOp({ kind: "light", id }, () => set({ lightsOwned: before, marketLight: bestLight(before).id }));
    flashToast(set, get, `${next.label} market lights: night markets pay ×${next.mult.toFixed(1)}.`, 2000);
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
    const prevScout = get().scout;
    set({
      points: get().points - s.coins,
      scouts: [...get().scouts, id],
      scout: id,
      toast: s.perk.label ? `${s.name} hired. ${s.perk.label}` : `${s.name} hired.`,
    });
    pushOp({ kind: "scout", id }, () => {
      if (!useGame.getState().scouts.includes(id)) return;
      // 0.0.98: never drop a scout the server says this account owns (gift restores included).
      if (serverOwnedScouts.has(id)) return;
      set({ scouts: useGame.getState().scouts.filter((x) => x !== id), scout: prevScout });
    });
    scheduleSave(get);
    window.setTimeout(() => set({ toast: null }), 1800);
  },
  adoptOwned: (o) => {
    // 0.1.105: applied by syncDyes once the wallet is live (it may need to offer this device's mixes first).
    accountDyes = o.dyes ? cleanServerBench(o.dyes) : null;
    accountWorn = o.worn && typeof o.worn === "object" ? { ...o.worn } : null;
    for (const x of o.scouts) serverOwnedScouts.add(x);
    if (o.lights) set({ lightsOwned: Array.from(new Set(["amber", ...o.lights])) });
    if ("patron" in o) set({ patron: o.patron ?? null });
    if (o.cans) set({ carCans: o.cans.filter((x) => parseCan(x)) });
    if (o.houses) set({ houses: cleanHouses(o.houses) });
    if (o.homeClaims) set({ homeClaims: o.homeClaims.filter((x) => typeof x === "string") });
    if (o.skins) set({ skins: cleanSkins(o.skins) });
    if (o.skin && isSkinId(o.skin)) set({ mapSkin: o.skin });
    if (o.paint) set({ carPaint: cleanCarPaint(o.paint) });
    if (o.cars) {
      const cars = Array.from(new Set([...get().carsOwned, ...o.cars.filter(isCarId)]));
      set({ carsOwned: cars, carOn: driveOf(cars, get().carOn, get().carCab) });
    }
    const st = get();
    const scouts = Array.from(new Set([...st.scouts, ...(o.scouts.filter((x) => x in SCOUTS) as ScoutId[])]));
    const lucky = st.lucky || o.charms.includes("lucky");
    const cloths = Array.from(new Set([...(st.quests.cloths ?? []), ...(o.cloths as typeof st.quests.cloths)]));
    if (scouts.length === st.scouts.length && lucky === st.lucky && cloths.length === (st.quests.cloths ?? []).length) return;
    set({ scouts, lucky, quests: { ...st.quests, cloths } });
    saveNow(get);
  },
  grantGiftScout: (id) => {
    if (!(id in SCOUTS) || get().scouts.includes(id)) return false;
    set({ scouts: [...get().scouts, id] });
    saveNow(get);
    return true;
  },
  markGiftSeen: (giftId) => {
    if (get().giftsSeen.includes(giftId)) return;
    set({ giftsSeen: [...get().giftsSeen, giftId].slice(-50) });
    saveNow(get);
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
    const paints = { ...get().paints };
    if (res.done && c.slot === "coat") paints.wornCoat = null;
    if (res.done && c.slot === "lantern") paints.wornVault = null;
    const prevWardrobe = get().wardrobe;
    const prevPaints = get().paints;
    set({ wardrobe: res.wardrobe, keys: res.keys, paints });
    pushOp({ kind: "print", id }, () => set({ wardrobe: prevWardrobe, paints: prevPaints }));

    flashToast(
      set,
      get,
      res.done ? `${c.name} printed. Wearing it.` : `Paid ${priceLine(res.took)} toward the ${c.name}. ${priceLine(res.left)} to go.`,
      res.done ? 2200 : 2000,
    );
    saveNow(get);
  },
  wearCosmetic: (slot, id) => {
    const paints = { ...get().paints };
    const covering = slot === "coat" ? paints.wornCoat : paints.wornVault;
    const next = wear(get().wardrobe, slot, id, Date.now());
    if (!next && !covering) return;
    sfx.ui();
    if (slot === "coat") paints.wornCoat = null;
    else paints.wornVault = null;
    set({ wardrobe: next ?? get().wardrobe, paints });
    const name = id ? cosmetic(id)?.name : null;
    flashToast(set, get, name ? `Wearing the ${name}.` : slot === "coat" ? "Back in the field coat." : "Vaults back to brass.", 1400);
    saveNow(get);
  },
  mixPaint: (color, job) => {
    const use = PAINT_USE[color];
    const res = mixPaintJob(get().paints, get().pantry, color, job);
    if (!res) {
      const owned = job === "coat" ? get().paints.coats.includes(color) : get().paints.vaults.includes(color);
      const need = use[job];
      const have = get().pantry[`paint-${color}`] ?? 0;
      flashToast(
        set,
        get,
        owned ? `${use.name} is already mixed.` : `Need ${need} ${use.name.toLowerCase()}. You have ${have}.`,
        1800,
      );
      return;
    }
    sfx.craft();
    set({ paints: res.bench, pantry: res.pantry });
    // 0.1.105: the account records the mix (and puts it on). A refusal (cans it can't see) leaves it on this device only.
    pushOp({ kind: "dye", job, color });
    flashToast(set, get, job === "coat" ? `${use.name} on the coat.` : `Street vaults in ${use.name.toLowerCase()}.`, 1800);
    saveNow(get);
  },
  wearPaint: (job, color) => {
    const next = wearPaintJob(get().paints, job, color);
    if (!next) return;
    sfx.ui();
    set({ paints: next });
    pushOp({ kind: "dyeOn", job, color });
    const use = color ? PAINT_USE[color] : null;
    flashToast(
      set,
      get,
      !use ? (job === "coat" ? "Back in the field coat." : "Vaults back to brass.") : job === "coat" ? `${use.name} on the coat.` : `Street vaults in ${use.name.toLowerCase()}.`,
      1400,
    );
    saveNow(get);
  },
  syncDyes: async () => {
    const server = accountDyes;
    if (!server || !walletLive()) return;
    accountDyes = null;
    const plan = planDyeSync(get().paints, server);
    const taken: PaintBench = { ...server, coats: [...server.coats], vaults: [...server.vaults] };
    for (const b of plan.backfill) {
      const r = await commitWallet({ kind: "dye", job: b.job, color: b.color });
      if (r?.ok) (b.job === "coat" ? taken.coats : taken.vaults).push(b.color);
    }
    // A backfilled mix puts itself on at the account; set the planned picks back (the server replays a no-op).
    if (plan.backfill.length || server.rows === 0) {
      for (const job of ["coat", "vault"] as const) {
        const want = plan.wear[job];
        if (want === null || (job === "coat" ? taken.coats : taken.vaults).includes(want)) await commitWallet({ kind: "dyeOn", job, color: want });
      }
    }
    const paints = mergedBench(get().paints, taken, plan.wear);
    if (JSON.stringify(paints) !== JSON.stringify(get().paints)) {
      set({ paints });
      saveNow(get);
    }
  },
  adoptWardrobe: (w) => {
    const next = cleanWardrobe(w);
    if (JSON.stringify(next) === JSON.stringify(get().wardrobe)) return;
    set({ wardrobe: next });
    saveNow(get);
  },
  adoptWallet: (w) => {
    const keys = cleanKeys(w.keys);
    const cities = cleanUnlocks(w.cities);
    const points = Math.max(0, Math.floor(Number(w.coins) || 0));
    const cur = get();
    const credit = w.credit ? cleanCredit(w.credit) : cur.credit;
    const sameKeys = (Object.keys(keys) as Tier[]).every((t) => cur.keys[t] === keys[t]);
    if (points === cur.points && sameKeys && JSON.stringify(cities) === JSON.stringify(cur.cities) && JSON.stringify(credit) === JSON.stringify(cur.credit)) return;
    // The server already settled this pocket: the client hook must not settle it again.
    adopting = true;
    set({ points, keys, cities, credit });
    adopting = false;
    saveNow(get);
  },
  keepPoints: (n) => {
    set({ points: Math.max(0, Math.floor(n)) });
    scheduleSave(get);
  },
  buyPatron: (bulb) => {
    const spec = patronBulb(bulb);
    if (!spec) return;
    const now = Date.now();
    if (!patronOpen(now)) {
      flashToast(set, get, "The market is dark. The lamp comes back with the next one.", 1800);
      return;
    }
    const cycle = patronCycle(now);
    const cur = get().patron;
    if (cur && cur.cycle === cycle && patronLive(cur, now)) {
      flashToast(set, get, cur.bulb === bulb ? "That bulb is already up this cycle." : "This cycle already has a bulb.", 1600);
      return;
    }
    if (get().points < spec.price) {
      flashToast(set, get, "Need more coins.", 1400);
      return;
    }
    const before = get().patron;
    set({ points: get().points - spec.price, patron: { bulb, cycle, until: patronUntil(cycle) } });
    pushOp({ kind: "patron", bulb }, () => {
      // A refused second bulb already wrote the stored hold. Keep that one.
      const held = useGame.getState().patron;
      if (held && held.cycle === cycle && held.bulb !== bulb) return;
      set({ patron: before });
    });
    flashToast(set, get, `${spec.label} up. Pay stays the same.`, 2000);
    saveNow(get);
  },
  buyKiosk: (id) => {
    if (kioskRetired(id)) {
      flashToast(set, get, "The desk no longer sells keys. The ones you already hold stay in your pocket.", 2000);
      return;
    }
    const item = KIOSK[id as keyof typeof KIOSK];
    if (!item) return;
    if (get().points < item.cost) {
      flashToast(set, get, "Short on coin.", 1600);
      return;
    }
    if (id === "fare") {
      if (get().fares >= FARES_CAP) {
        flashToast(set, get, "Two is the pocket.", 1600);
        return;
      }
      sfx.craft();
      set({ points: get().points - item.cost, fares: get().fares + 1 });
      pushOp({ kind: "kiosk", id }, () => set({ fares: Math.max(0, useGame.getState().fares - 1) }));
      flashToast(set, get, `A train ticket reprinted. Travel from ${fareDesk(CITIES[get().cityId]).name}.`, 2400);
      scheduleSave(get);
      return;
    }
    if (id === "pass") {
      sfx.craft();
      set({ points: get().points - item.cost, pressPass: get().pressPass + 1 });
      pushOp({ kind: "kiosk", id }, () => set({ pressPass: Math.max(0, useGame.getState().pressPass - 1) }));
      flashToast(set, get, "Press pass. The next door holds five extra seconds.", 2200);
      scheduleSave(get);
      return;
    }
    const city = CITIES[get().cityId];
    const unknown = city.pois.filter((p) => p.kind !== "shop" && p.kind !== "counter" && p.kind !== "board" && p.kind !== "station" && !get().atlas[p.id]);
    if (!unknown.length) {
      flashToast(set, get, "Every vault in this ward is named.", 2000);
      return;
    }
    const pick = unknown[Math.floor(Math.random() * unknown.length)]!;
    sfx.craft();
    const namedId = pick.id;
    set({
      points: get().points - item.cost,
      atlas: { ...get().atlas, [pick.id]: true as const },
    });
    pushOp({ kind: "kiosk", id, poi: namedId }, () => {
      const atlas = { ...useGame.getState().atlas };
      delete atlas[namedId];
      set({ atlas });
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
    set({ hqOpen: next, guideOpen: next ? false : get().guideOpen, invOpen: next ? false : get().invOpen, shopOpen: next ? false : get().shopOpen, errandOpen: next ? null : get().errandOpen });
  },
  toggleGuide: (v) => {
    const next = v ?? !get().guideOpen;
    set({ guideOpen: next, hqOpen: next ? false : get().hqOpen, invOpen: next ? false : get().invOpen, shopOpen: next ? false : get().shopOpen, errandOpen: next ? null : get().errandOpen });
  },
  toggleInv: (v) => {
    const next = v ?? !get().invOpen;
    set({ invOpen: next, hqOpen: next ? false : get().hqOpen, guideOpen: next ? false : get().guideOpen, shopOpen: next ? false : get().shopOpen, errandOpen: next ? null : get().errandOpen });
  },
  dismissLoot: () => set({ loot: null, miss: null, toast: null }),
  noteGoalKind: (kind, amount = 1) => {
    const g = noteGoal(get().goals, kind, amount, goalDay());
    if (g !== get().goals) set({ goals: g });
  },
  claimGoal: (i) => {
    const g = noteGoal(get().goals, "right", 0, goalDay());
    const all = i === 3;
    if (all ? !(g.paid.every(Boolean) && !g.all) : !goalDone(g, i) || g.paid[i]) return;
    const mark = (): GoalDay => (all ? { ...g, all: true } : { ...g, paid: g.paid.map((p, k) => p || k === i) as GoalDay["paid"] });
    const line = all ? "All three goals! A green key." : `Goal done. +${GOAL_COIN} coin.`;
    if (walletLive()) {
      void commitWallet({ kind: "dgoal", i }).then((r) => {
        if (!r?.ok && !r?.replay) {
          set({ toast: r?.reason === "unproven" ? "Open a few vaults first, then claim." : "Board's busy. Try again in a moment." });
          return;
        }
        set({ goals: mark(), toast: line });
        saveNow(get);
      });
      return;
    }
    if (all) {
      const p = payMatch(get().keys, GOAL_ALL_TIER);
      set({ keys: p.keys, points: get().points + p.coin, goals: mark(), toast: p.match ? (p.up ? `${line} ↑ ${TIER_LABEL[p.tier!]}` : line) : `All three goals! Every pocket is full: +${p.coin} coin.` });
    } else set({ points: get().points + GOAL_COIN, goals: mark(), toast: line });
    sfx.pickup();
    scheduleSave(get);
  },
  claimCache: () => {
    const d = today();
    if (get().cacheDay === d) return;
    const say = (got: Tier[], coin: number) => cacheLine(got, coin, TIER_LABEL);
    set({ cacheDay: d });
    sfx.pickup();
    if (walletLive()) {
      void commitWallet({ kind: "cache", city: get().cityId }).then((r) => {
        if (!r?.ok && !r?.replay) {
          set({ cacheDay: "", toast: "The cache is stuck. Try again in a moment." });
          return;
        }
        if (r.can) gotCan(r.can);
        // 0.1.23: already opened today (another device): say so, no empty "pockets full" pop.
        if (r.replay || r.cache?.already || !r.cache) {
          set({ toast: "You already opened today's key cache. A new one appears tomorrow." });
          saveNow(get);
          return;
        }
        popMatch({ kind: "cache", big: "Key cache!", sub: say(r.cache?.got ?? [], r.cache?.coin ?? 0).replace(/^Key cache! /, ""), tiers: r.cache?.got ?? [], coin: r.cache?.coin ?? 0 });
        saveNow(get);
      });
      return;
    }
    const paid = payMatches(get().keys, cachePrize(streetPlayer() || "guest", d));
    set({ keys: paid.keys, points: get().points + paid.coin });
    popMatch({ kind: "cache", big: "Key cache!", sub: say(paid.got, paid.coin).replace(/^Key cache! /, ""), tiers: paid.got, coin: paid.coin });
    scheduleSave(get);
  },
  spinWheel: async () => {
    const offer = get().wheel;
    if (!offer) return null;
    if (!walletLive()) return offer.win;
    const tier = offer.tier;
    const city = get().cityId;
    const r = await commitWallet({ kind: "wheel", tier, city });
    const gone = get().wheel !== offer;
    if (gone && !r?.ok) return null;
    if (!r?.ok || typeof r.wheelWin !== "number") {
      // 0.0.89: never re-show the same offer (players got stuck looping on "Take it").
      const fail = wheelClaimFailed(r, tier, get().correctByTier, get().wheelClaimed);
      set({ wheel: null, wheelPaid: null, wheelClaimed: fail.wheelClaimed, toast: fail.toast });
      saveNow(get);
      window.setTimeout(() => {
        if (get().toast === fail.toast) set({ toast: null });
      }, 2600);
      return null;
    }
    // Paid on the server already (the pocket came back with the reply). Count it now; Take it only closes.
    const wheelClaimed = { ...get().wheelClaimed, [tier]: (get().wheelClaimed[tier] ?? 0) + 1 };
    let pantry = get().pantry;
    if (r.ingredient) {
      for (let i = 0; i < r.ingredient.n; i++) pantry = addIngredient(pantry, r.ingredient.id as IngredientId);
    }
    // 0.1.97: rebuild from the server's roll so the coin faces show what was paid.
    const slices = typeof r.wheelRoll === "number" ? buildWheel(tier, city, r.wheelRoll).slices : offer.slices;
    const line = r.line || slices[r.wheelWin]?.label || "";
    if (gone) {
      // Closed mid-spin: the prize is paid anyway, so say what it was.
      set({ pantry, wheelClaimed, wheelPaid: null, toast: line || null });
      saveNow(get);
      return null;
    }
    set({ pantry, wheelClaimed, wheelPaid: { win: r.wheelWin, line, slices } });
    saveNow(get);
    return r.wheelWin;
  },
  claimWheel: () => {
    const offer = get().wheel;
    if (!offer) return;
    const done = get().wheelPaid;
    if (done) {
      const next = owedTier(get().correctByTier, get().wheelClaimed);
      set({ wheelPaid: null, wheel: next ? buildWheel(next, get().cityId, Math.random()) : null, toast: done.line || null });
      window.setTimeout(() => {
        if (get().toast === done.line) set({ toast: null });
      }, 2200);
      return;
    }
    if (walletLive()) {
      // Signed in, the spin claims (spinWheel). Nothing to pay here.
      set({ wheel: null });
      return;
    }
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
  dismissWheel: () => {
    if (!get().wheel) return;
    // 0.0.92: a spin the server already paid closes like Take it (the prize is in the pocket).
    if (get().wheelPaid) {
      get().claimWheel();
      return;
    }
    // Not a claim: the spin stays owed and comes back on the next correct answer of that color.
    set({ wheel: null });
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
    set({ tutorial: 0, howtoDone: false, hqOpen: false, guideOpen: false, invOpen: false, shopOpen: false, errandOpen: null });
    scheduleSave(get);
  },
  resetCity: () => {
    const id = get().cityId;
    set({
      mapKeys: seedKeys(id),
      contract: seedContract(id),
      vaults: {},
      blanks: [],
      streetSpread: false,
    });
    scheduleSave(get);
  },
  clearFireworks: () => set({ fireworks: null }),
  boardFare: (to, how = "loop") => {
    if (get().hud.seated) return "Park at the curb. The door is on foot.";
    if (to === get().cityId) return "You're already in this ward.";
    if (!CITIES[to]) return "No ward by that name.";
    if (!isUnlocked(get().cities, to)) return lockLine(get().cities, to);
    const noTicket = `Need a train ticket. ${ticketHint(get().cityVaults)} in this city.`;
    if (get().fares < 1) return noTicket;
    if (get().journey) return "You're already on a train.";
    const from = get().cityId;
    if (how === "fly" && !canFly(from, to)) return "Too close to fly. Take the Loop.";
    const go = () => {
      if (get().fares < 1 || get().journey) return;
      const now = Date.now();
      const arriveAt = now + fareMs(from, to);
      sfx.open();
      set({
        fares: get().fares - 1,
        journey: { from, to, departAt: now, arriveAt, openMs: 0, lastTickAt: now, grantedWhite: 0, grantedBlue: 0, grantedGreen: 0 },
        hqOpen: false,
        invOpen: false,
        shopOpen: false,
        errandOpen: null,
        openVault: null,
        loot: null,
        miss: null,
        toast: null,
      });
      scheduleSave(get);
      if (how === "fly") flyNow(set, get);
      else rideLoop(set, get);
    };
    if (walletLive()) {
      if (boarding) return "You're already on a train.";
      boarding = true;
      void commitWallet({ kind: "board", from, to }).then((res) => {
        boarding = false;
        if (!res?.ok) {
          flashToast(set, get, noTicket, 2400);
          return;
        }
        go();
      });
      return null;
    }
    go();
    return null;
  },
  finishFlight: () => {
    const f = get().flight;
    if (!f) return;
    set({ flight: null });
    get().tickJourney();
    const fresh = !get().souvenirs.includes(souvenirKey(f.to));
    set({ souvenirs: addSouvenir(get().souvenirs, souvenirKey(f.to)) });
    sfx.cityArrive();
    // After the arrival toasts ("Visited N places"), so the souvenir line is not stepped on.
    window.setTimeout(() => flashToast(set, get, fresh ? `Souvenir from the flight: ${SOUVENIRS[f.to]}.` : `You already have the ${SOUVENIRS[f.to]}.`, 3600), 2600);
    scheduleSave(get);
  },
  finishLoop: () => {
    const l = get().loop;
    if (!l) return;
    set({ loop: null });
    get().tickJourney();
    const loot = loopCrateLoot();
    const add: Partial<GameState> = { posters: addPoster(get().posters, posterKey(l.from, l.to)) };
    if (l.crate && !walletLive()) {
      const keys = { ...get().keys };
      for (const [t, n] of Object.entries(loot) as [Tier, number][]) keys[t] = (keys[t] ?? 0) + n;
      add.keys = keys;
    }
    set(add);
    sfx.cityArrive();
    if (l.crate) {
      sfx.crateOpen();
      flashToast(set, get, `Mystery crate in the tunnel. ${crateLine(loot)}.`, 3200);
    }
    scheduleSave(get);
  },
  tickJourney: () => {
    const j = get().journey;
    if (!j) return;
    if (!CITIES[j.to]) {
      set({ journey: null });
      return;
    }
    const now = Date.now();
    // 0.1.95: the timed train is gone; a journey only lives between boarding and Arrive/Loop/Fly closing it.
    const { journey: nextJourney, keys, add } = settleRide(j, get().keys, now, false);
    const found = add.white + add.blue + add.green;
    if (found > 0) {
      sfx.pickup();
      set({ keys, journey: nextJourney });
    }
    if (now < j.arriveAt) {
      set({ journey: nextJourney });
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
      errandOpen: null,
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

/** 0.1.70: end the open ride by air: the flight cutscene plays, then finishFlight lands. */
function flyNow(set: (p: Partial<GameState>) => void, get: () => GameState) {
  const j = get().journey;
  if (!j) return;
  set({ journey: { ...j, arriveAt: Date.now(), fullMs: j.fullMs ?? j.arriveAt - j.departAt } });
  if (walletLive()) void commitWallet({ kind: "fly" });
  set({ flight: { from: j.from, to: j.to, departAt: j.departAt }, screen: "flight" });
  scheduleSave(get);
}

/** 0.1.58: end the open ride with the Loop's tunnel (finishLoop lands). 0.1.128: the instant Arrive is gone. */
function rideLoop(set: (p: Partial<GameState>) => void, get: () => GameState) {
  const j = get().journey;
  if (!j) return;
  const now = Date.now();
  set({ journey: { ...j, arriveAt: now, fullMs: j.fullMs ?? j.arriveAt - j.departAt } });
  if (walletLive()) void commitWallet({ kind: "loop", ride: true });
  set({ loop: { from: j.from, to: j.to, crate: loopCrate(j.departAt) }, screen: "loop" });
  scheduleSave(get);
}

export function cityOf() {
  return CITIES[useGame.getState().cityId];
}

export function allCities() {
  return CITY_LIST;
}

/** 0.1.22: Lucky pays when owned for good, or in the month a Full month bonus turned it on (Chicago month). */
export function luckyOn(st: { lucky: boolean; luckyMonth: string }, now = Date.now()): boolean {
  return st.lucky || (st.luckyMonth !== "" && st.luckyMonth === monthKey(now));
}

export function reach() {
  const st = useGame.getState();
  return interactRadius() * (wornPerk(st.scout).reach ?? 1);
}

function savedPocket(raw: string | null): { points: number; cities: CityUnlocks } | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { version?: number; points?: unknown; cities?: unknown };
    if (!data || (data.version !== 1 && data.version !== 2)) return null;
    const points = Number(data.points);
    if (!Number.isFinite(points) || points < 0) return null;
    return { points: Math.floor(points), cities: cleanUnlocks(data.cities) };
  } catch {
    return null;
  }
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
  // 0.0.57: another tab of this save spent or earned matches. Take its pocket so this tab's count (and what it can open) is real.
  window.addEventListener("storage", (e) => {
    if (e.key !== SAVE_KEY) return;
    const keys = savedKeys(e.newValue);
    if (!keys) return;
    const cur = useGame.getState();
    const patch: Partial<GameState> = {};
    if (!(Object.keys(keys) as Tier[]).every((t) => cur.keys[t] === keys[t])) patch.keys = keys;
    const pocket = savedPocket(e.newValue);
    if (pocket && (pocket.points !== cur.points || JSON.stringify(pocket.cities) !== JSON.stringify(cur.cities))) {
      patch.points = pocket.points;
      patch.cities = pocket.cities;
    }
    // 0.1.6: and the scout it put on, so this tab doesn't write the old one back (Beth B.'s Corgi kept coming off).
    const worn = savedScout(e.newValue, (x) => x in SCOUTS);
    const scoutPatch = worn ? adoptScout(cur, worn) : null;
    if (scoutPatch) {
      patch.scout = scoutPatch.scout as ScoutId;
      patch.scouts = scoutPatch.scouts as ScoutId[];
    }
    // 0.1.31: and the cars it bought / picked, so this tab doesn't write an old carless save back over them.
    const cars = savedCars(e.newValue);
    if (cars) {
      const owned = Array.from(new Set([...cur.carsOwned, ...cars.owned]));
      const carOn = driveOf(owned, cars.on ?? cur.carOn, cars.cab);
      if (owned.length !== cur.carsOwned.length || carOn !== cur.carOn || cars.cab !== cur.carCab) {
        patch.carsOwned = owned;
        patch.carOn = carOn;
        patch.carCab = cars.cab;
      }
    }
    if (patch.keys || patch.points != null || patch.cities || patch.scout || patch.carsOwned) useGame.setState(patch);
    // 0.0.58: and the cards it was dealt, so this tab doesn't deal them again.
    const seen = savedSeen(e.newValue);
    if (!seen) return;
    const st = useGame.getState();
    const seenIds = mergeSeen(seen.seenIds, st.seenIds ?? [], ASKED_KEEP);
    const asked = mergeSeen(seen.asked, st.asked ?? [], ASKED_KEEP);
    if (seenIds !== st.seenIds || asked !== st.asked) useGame.setState({ seenIds: [...seenIds], asked: [...asked] });
  });
  window.addEventListener("pagehide", flush);
}


// 0.0.93: daily-goal progress and answer streaks, from the counters the game already keeps.
if (typeof window !== "undefined") {
  useGame.subscribe((s, prev) => {
    if (s.correctByTier !== prev.correctByTier) {
      for (const t of ["green", "blue"] as const) {
        const d = (s.correctByTier[t] ?? 0) - (prev.correctByTier[t] ?? 0);
        if (d > 0) s.noteGoalKind(t, d);
      }
    }
    if (s.distanceM > prev.distanceM) s.noteGoalKind("walk", s.distanceM - prev.distanceM);
    if (s.streak > prev.streak) {
      s.noteGoalKind("right", s.streak - prev.streak);
      const tier = streakPrize(s.streak);
      if (tier) {
        // Signed in, the server pays it with the grade (walletApply awardGrade); a guest pays here.
        if (!walletLive()) {
          const p = payMatch(s.keys, tier);
          useGame.setState({ keys: p.keys, points: s.points + p.coin });
        }
        const run = s.streak;
        window.setTimeout(() => popMatch({ kind: "streak", big: `${run} in a row!`, sub: streakSub(tier), tiers: [tier], coin: 0, cheer: cheerFor(run) }), 900);
      }
    }
  });
}


/**
 * 0.0.97 pocket rule on the client (guests and the optimistic signed-in pocket): any rise past a pocket of 30
 * becomes overflow credits that merge 3→1 into the next colour (goals.ts settlePocket). Server pockets adopted
 * through adoptWallet are already settled and skipped.
 */
let adopting = false;
let settling = false;
useGame.subscribe((s, prev) => {
  if (adopting || settling || s.keys === prev.keys) return;
  const st = settlePocket(prev.keys, s.keys, s.credit);
  const changed = (Object.keys(st.keys) as Tier[]).some((t) => st.keys[t] !== s.keys[t]) || JSON.stringify(st.credit) !== JSON.stringify(s.credit) || st.coin > 0;
  if (!changed) return;
  settling = true;
  const merged = Object.entries(st.merged) as [Tier, number][];
  const msg = merged.length
    ? `↑ 3 extras merged: +${merged.map(([t, n]) => `${n} ${TIER_LABEL[t]}`).join(", ")}`
    : st.coin
      ? `Violet pocket full: +${st.coin} coin`
      : (() => {
          const [t] = (Object.keys(st.credited) as Tier[]).slice(-1);
          return t ? `Pocket full · ${creditHint(st.credit, t) ?? `${TIER_LABEL[t]} extra`}` : null;
        })();
  useGame.setState({ keys: st.keys, credit: st.credit, points: s.points + st.coin, ...(msg && !s.toast ? { toast: msg } : {}) });
  settling = false;
});

// 0.0.99: when a pop is dismissed, the next queued one shows.
useGame.subscribe((s, prev) => {
  if (prev.matchPop && !s.matchPop && popQueue.length) {
    const next = popQueue.shift()!;
    queueMicrotask(() => useGame.setState({ matchPop: next }));
  }
});

// 0.0.99 Recent rewards for guests: every rise in coin or matches is logged with its best-known source.
useGame.subscribe((s, prev) => {
  if (walletLive() || adopting) return;
  if (s.keys === prev.keys && s.points === prev.points && s.credit === prev.credit) return;
  const keys: Partial<Record<Tier, number>> = {};
  for (const t of Object.keys(s.keys) as Tier[]) {
    const d = (s.keys[t] ?? 0) - (prev.keys[t] ?? 0);
    if (d > 0) keys[t] = d;
  }
  const credit: Partial<Record<Tier, number>> = {};
  for (const [t, n] of Object.entries(s.credit) as [Tier, number][]) if ((n ?? 0) > (prev.credit[t] ?? 0)) credit[t] = n - (prev.credit[t] ?? 0);
  const coins = s.points - prev.points;
  if (coins <= 0 && !Object.keys(keys).length && !Object.keys(credit).length) return;
  const pop = s.matchPop && s.matchPop !== prev.matchPop ? s.matchPop.kind : null;
  const vault = prev.openVault ?? s.openVault;
  const poi = vault ? CITIES[s.cityId]?.pois.find((p) => p.id === (vault as { poiId?: string }).poiId) : undefined;
  const src: RewardSource = pop === "level" ? "level" : pop === "gift" ? "gift" : pop === "cache" ? "cache" : pop === "streak" ? "streak" : poi ? "lamp" : s.mapKeys.length < prev.mapKeys.length ? "street" : "reward"; // 0.1.15: a street pick-up is a Street match
  const r: RecentReward = { at: Date.now(), src, ...(poi ? { where: poi.name } : {}), coins: Math.max(0, coins), keys, ...(Object.keys(credit).length ? { credit } : {}) };
  // Merge with the entry from the same moment (a reward often lands in two writes).
  const top = s.recent[0];
  if (top && r.at - top.at < 1500 && (top.src === r.src || r.src === "reward")) {
    const k = { ...top.keys };
    for (const [t, n] of Object.entries(keys) as [Tier, number][]) k[t] = (k[t] ?? 0) + n;
    useGame.setState({ recent: [{ ...top, coins: top.coins + r.coins, keys: k }, ...s.recent.slice(1)] });
  } else useGame.setState({ recent: pushRecent(s.recent, r) });
});

/** 0.1.45: the owned car you sit in right now (its perk and favorite count only then). */
export function seatedCar(st: Pick<GameState, "hud" | "carOn">): CarId | null {
  return st.hud.seated && st.hud.ownCar ? st.carOn : null;
}
