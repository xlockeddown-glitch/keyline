import { SkyLayer } from "./Sky";
import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Circle, Marker, Polygon, Polyline } from "leaflet";
import { anyPois, livePois } from "@/game/nightMarket";
import { DEALER_REACH_M, carOf, carPace, dealerOf, dealerTap } from "@/game/cars";
import { lampFromRide, rideOf, seatIsOwnCar, trimToReach } from "@/game/carReach";
import { factoryColor } from "@/game/carPaint";
import { HOUSE_METERS, HOUSE_REACH_M, houseMapArt, houseOf, lotOf, type HouseTier } from "@/game/houses";
import { HouseSheet } from "./HouseSheet";
import { CITIES, CLIMB_ID, RUN_ID, SCOUTS, SERIES, STACK_ID, cabSpeed, interactRadius, isBoard, isQuestBoard, isCounter, isScoutShop, walkSpeed, WALK_PACE } from "@/game/data";
import { CACHE_GRAB_M, CACHE_SEE_M, cacheSeed, questAlert } from "@/game/goals";
import { cacheAnywhere, reachMult } from "@/game/scoutPerks";
import { questPinHtml, boardPinHtml, counterPinHtml, seriesPinHtml, stationPinHtml, vaultPinHtml } from "@/game/pins";
import { faceFromYaw as cabFace, spriteCell, walkRow } from "@/game/facing";
import { V2_CADENCE, V2_SCOUTS, v2Cell } from "@/game/coatLayer";
import { dest, distM, wrapPi, yawToTarget } from "@/game/geo";
import { reach, useGame } from "@/game/store";
import { startBed, unlockAudio } from "@/game/audio";
import {
  bindWalkGraph,
  snapReachable,
  curbAfterCab,
  roadsInCircle,
  quietDrop,
  walkableTarget,
  walkReach,
  canGrabMatch,
  MATCH_GRAB_M,
  bootstrapDrive,
  bootstrapStreets,
  canCutBuildings,
  clearCorner,
  closestOnPath,
  constrainStep,
  expandGraph,
  fillSurroundings,
  faceAlongStreet,
  finishPath,
  graphCovers,
  nearest,
  onArterial,
  onStreet,
  pathLength,
  pointAlongPath,
  offFreeway,
  hopTouchesFreeway,
  clearOfFreeway,
  pullToStreet,
  bridgeByFoot,
  randomOnStreet,
  routeDrive,
  routeOnGraph,
  routeWalk,
  scatterStreetLamps,
  spreadOnGraph,
  standOpen,
  stuckNudge,
  WALK_REACH_M,
  type Pt,
  type StreetGraph,
} from "@/game/streets";
import { fareDesk, isFareDesk } from "@/game/ticket";
import { HOLD_CAP, holdAction, tapAction, type PlanStop } from "@/game/routePlan";
import { clampWard, inWard, wardFrom, wardRing, type Ward } from "@/game/ward";
import { Hud } from "./Hud";
import { VaultModal } from "./VaultModal";
import { HqPanel } from "./HqPanel";
import { ScoutShop } from "./ScoutShop";
import { Showroom } from "./Showroom";
import { LootToast } from "./LootToast";
import { FriendTickets } from "./FriendTickets";
import { GiftNote } from "./GiftNote";
import { MysteryWheel } from "./MysteryWheel";
import { Satchel } from "./Satchel";
import { WardCounter } from "./WardCounter";
import { NoticeBoard } from "./NoticeBoard";
import { Fireworks } from "./Fireworks";
import { Timetable } from "./Timetable";
import { DailyPop } from "./DailyPop";
import { Tutorial } from "./Tutorial";
import { FieldGuide } from "./FieldGuide";
import { DailyFinishCard, DailyRunPanel } from "./DailyRun";
import { DailyBlitz } from "./DailyBlitz";
import { activeProgress, todayRoute, useDaily } from "@/game/dailyStore";
import { DAILY_CURB_MAX_M, dailyRoute } from "@/game/dailyRun";
import { MARKET_TAG, closestOnStreet, inZone, marketAnchor, marketAt, marketLeft } from "@/game/nightMarket";
import { visibleCoat } from "@/game/paint";

/** 0.0.99: a worn city print shows over any coat or paint. */
function wornLook(paint: Parameters<typeof visibleCoat>[0], coat: string | null): string | null {
  return useGame.getState().printWorn ?? visibleCoat(paint, coat);
}
import { useWalkPoster } from "@/game/walkClient";

type LModule = typeof import("leaflet");

const TURN = 2.8;
const TURN_CAB = 1.8;
const MAX_DT = 0.1;
const CAB_REACH = 28;

type CabFace = "down" | "left" | "right" | "up";

function faceFromYaw(yaw: number): CabFace {
  return cabFace(yaw);
}

/** 0.1.9: the colour your car is painted (empty = factory paint, the base art). */
function paintOn(): string {
  const st = useGame.getState();
  const c = st.carOn ? st.carPaint[st.carOn] : undefined;
  return st.carOn && c && c !== factoryColor(st.carOn) ? c : "";
}

function cabMarkup(face: CabFace, lamps: boolean) {
  const car = useGame.getState().carOn ?? "";
  return `<div class="cab-sprite${lamps ? " is-lamps" : ""}" data-face="${face}" data-car="${car}" data-paint="${paintOn()}"><i class="cab-lamp a"></i><i class="cab-lamp b"></i><i class="cab-cone"></i></div>`;
}

type Cab = {
  lat: number;
  lng: number;
  yaw: number;
  seated: boolean;
  /** 0.1.14: the player's own car (lamps answer from inside it); false for the city cab. */
  own?: boolean;
  hail: Pt[] | null;
  hailAlong: number;
};

/** 0.0.45 print-shop coat on the walker: public/coats.css swaps walk, idle and side-idle sheets by data-coat. */
function coatAttr(coat: string | null) {
  return coat ? ` data-coat="${coat}"` : "";
}

function setCoat(el: HTMLElement, coat: string | null) {
  if (coat) {
    if (el.dataset.coat !== coat) el.dataset.coat = coat;
  } else if (el.hasAttribute("data-coat")) el.removeAttribute("data-coat");
}

/** Walk, front idle and side idle for the worn coat. Side idle is only swapped in when a left or
 *  right walk stops, so without this the first stop paints an empty frame while the sheet loads. */
const warmedSheets = new Set<string>();
function warmSheets(scout: string, coat: string | null) {
  if (typeof document === "undefined") return;
  const probe = document.createElement("div");
  probe.className = "scout-marker";
  probe.dataset.scout = scout;
  if (coat) probe.dataset.coat = coat;
  probe.style.cssText = "position:absolute;left:-9999px;top:0;width:56px;height:56px;pointer-events:none";
  document.body.appendChild(probe);
  for (const pose of ["", "is-idle", "is-idle is-side"]) {
    probe.className = `scout-marker ${pose}`.trim();
    const raw = getComputedStyle(probe).backgroundImage;
    const m = /url\((['"]?)(.*?)\1\)/.exec(raw);
    const url = m?.[2];
    if (!url || url === "none" || warmedSheets.has(url)) continue;
    warmedSheets.add(url);
    const img = new Image();
    img.src = url;
  }
  probe.remove();
}

/** 0.0.90: re-plans a wedged walker gets on one leg before the route is dropped. */
const MAX_STUCK_REPLANS = 3;

// Heat (0.1.34): the camera follows the walker with a setView every frame, and Leaflet's SVG renderer answers every
// moveend by re-clipping and re-simplifying every route/trail path. The SVG already covers the view plus a padded
// margin and sits in layer coordinates, so while the view stays inside that drawn box (same zoom, same pixel origin,
// same size) the redraw would produce the same picture; skip it until the view nears the edge.
function steadySvg(L: LModule) {
  type R = { _map: LMap; _bounds?: { min: { x: number; y: number }; max: { x: number; y: number } }; _zoom?: number; _update(): void; _steady?: string };
  const Steady = L.SVG.extend({
    getEvents(this: R) {
      const ev = (L.SVG.prototype as unknown as { getEvents(): Record<string, unknown> }).getEvents.call(this);
      ev.moveend = function (this: R) {
        const map = this._map;
        const b = this._bounds;
        const size = map.getSize();
        const o = map.getPixelOrigin();
        const key = `${map.getZoom()}|${o.x},${o.y}|${size.x},${size.y}`;
        if (b && this._steady === key) {
          const tl = map.containerPointToLayerPoint([0, 0]);
          if (tl.x >= b.min.x && tl.y >= b.min.y && tl.x + size.x <= b.max.x && tl.y + size.y <= b.max.y) return;
        }
        this._update();
        this._steady = key;
      };
      return ev;
    },
  });
  return new (Steady as unknown as new (o: { padding: number }) => InstanceType<typeof L.SVG>)({ padding: 0.25 });
}

// Heat (0.1.34): only ~10 of ~80 lamp pins are on screen, but every flicker animation ticked. Pins outside the
// viewport (plus a margin) get .offscreen, which pauses their flicker; nothing visible changes.
let offscreenIO: IntersectionObserver | null = null;
function pinObserver(): IntersectionObserver {
  offscreenIO ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle("offscreen", !e.isIntersecting);
    },
    { rootMargin: "120px" },
  );
  return offscreenIO;
}

export function GameMap() {
  useWalkPoster();
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const Lref = useRef<LModule | null>(null);
  const playerMarker = useRef<Marker | null>(null);
  const vaultMarkers = useRef<Map<string, Marker>>(new Map());
  const keyMarkers = useRef<Map<string, Marker>>(new Map());
  const waypointMarker = useRef<Marker | null>(null);
  const routeLine = useRef<Polyline | null>(null);
  const graphRef = useRef<StreetGraph | null>(null);
  const driveRef = useRef<StreetGraph | null>(null);
  const cabRef = useRef<Cab | null>(null);
  const cabMarker = useRef<Marker | null>(null);
  const routeMode = useRef<"walk" | "drive">("walk");
  const routeRef = useRef<Pt[] | null>(null);
  const routeAlong = useRef(0);
  const stuckFor = useRef(0);
  const skips = useRef(0);
  /** 0.0.90: stuck re-plans on this leg. Each re-plan reset `skips`, so a walker wedged on a Lantern Run leg retried forever. */
  const replans = useRef(0);
  const lastRouteTry = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const destSeq = useRef(0);
  const expandBusy = useRef(false);
  const lastExpand = useRef(0);
  const lastKeyCheck = useRef(0);
  const expandFails = useRef(0);
  const pos = useRef({ lat: 0, lng: 0, yaw: 0, speed: 0, stamina: 1 });
  const keysHeld = useRef(new Set<string>());
  const injected = useRef<string[] | null>(null);
  const stick = useRef({ x: 0, y: 0 });
  const waypoint = useRef<PlanStop | null>(null);
  /** Stops after the one being walked, in the order they were tapped. */
  const queue = useRef<PlanStop[]>([]);
  const queueMarkers = useRef<Marker[]>([]);
  const planLine = useRef<Polyline | null>(null);
  const legKey = useRef<string | null>(null);
  const legDoor = useRef(false);
  const routeHold = useRef(false);
  const follow = useRef(true);
  const anim = useRef({ frame: 0, loop: 0, acc: 0 });
  const last = useRef(0);
  // Battery: what the loop last pushed to Leaflet, and which pin was last marked near.
  const drawnPins = useRef(-1);
  const drawn = useRef({ lat: NaN, lng: NaN, pan: false, near: "" });
  const nightRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const distAcc = useRef(0);
  const snapping = useRef(false);
  const wardRef = useRef<Ward | null>(null);
  const shadeRef = useRef<Polygon | null>(null);
  const lastFence = useRef(0);
  const cityId = useGame((s) => s.cityId);
  const scoutName = useGame((s) => SCOUTS[s.scout]?.name ?? "The walker");
  const [streets, setStreets] = useState<"loading" | "ready" | "error">("loading");
  const cacheRef = useRef<{ lat: number; lng: number; seed: { lat: number; lng: number } | null; marker: { remove: () => void; setLatLng: (ll: [number, number]) => unknown } } | null>(null);
  const arrowRef = useRef<{ remove: () => void } | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const dailyLines = useRef<Polyline[]>([]);
  const dailyPins = useRef<Marker[]>([]);
  const dailyKey = useRef("");
  const dailyShow = useDaily((s) => s.show);
  const dailyLit = useDaily((s) => activeProgress(s.runs, cityId)?.lit ?? 0);
  const marketLayers = useRef<(Polyline | Marker | Circle)[]>([]);
  const marketKey = useRef("");
  const dealerMarker = useRef<Marker | null>(null);
  const dealerDoor = useRef<{ lat: number; lng: number } | null>(null);
  const houseMarker = useRef<Marker | null>(null);
  const houseDoor = useRef<{ lat: number; lng: number } | null>(null);
  const houseGraph = useRef<StreetGraph | null>(null);

  function strokeColor() {
    if (typeof document === "undefined") return "#c4a35a";
    return getComputedStyle(document.documentElement).getPropertyValue("--color-vault-amber").trim() || "#c4a35a";
  }

  function flash(msg: string, ms = 1600) {
    useGame.setState({ toast: msg });
    window.setTimeout(() => {
      if (useGame.getState().toast === msg) useGame.setState({ toast: null });
    }, ms);
  }

  function bumpFence() {
    const now = performance.now();
    if (now - lastFence.current < 2400) return;
    lastFence.current = now;
    flash("The ward ends there.");
  }

  function setCabZoom(seated: boolean) {
    const map = mapRef.current;
    if (!map) return;
    map.setMinZoom(seated ? 14 : 15);
    if (!seated && map.getZoom() < 15) map.setZoom(15);
  }

  function paintCab() {
    const L = Lref.current;
    const map = mapRef.current;
    const cab = cabRef.current;
    if (!L || !map || !cab || cab.seated) {
      cabMarker.current?.remove();
      cabMarker.current = null;
      return;
    }
    const face = faceFromYaw(cab.yaw);
    const lamps = Boolean(cab.hail);
    if (!cabMarker.current) {
      cabMarker.current = L.marker([cab.lat, cab.lng], {
        icon: L.divIcon({
          className: "",
          html: cabMarkup(face, lamps),
          iconSize: [56, 56],
          iconAnchor: [28, 36],
        }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 700,
      }).addTo(map);
    } else {
      cabMarker.current.setLatLng([cab.lat, cab.lng]);
      const el = cabMarker.current.getElement()?.querySelector(".cab-sprite") as HTMLElement | null;
      if (el) {
        el.dataset.face = face;
        el.classList.toggle("is-lamps", lamps);
      }
    }
  }

  function seatHud(seated: boolean) {
    useGame.getState().setHud({ seated });
    const root = playerMarker.current?.getElement();
    const pawn = root?.querySelector(".pawn") as HTMLElement | null;
    pawn?.classList.toggle("is-seated", seated);
    const cabEl = pawn?.querySelector(".cab-sprite") as HTMLElement | null;
    if (cabEl) {
      if (seated) cabEl.removeAttribute("hidden");
      else cabEl.setAttribute("hidden", "");
      cabEl.dataset.face = faceFromYaw(pos.current.yaw);
      cabEl.dataset.car = useGame.getState().carOn ?? ""; // 0.1.8: your own car, or the city cab
      cabEl.dataset.paint = paintOn(); // 0.1.9: its colour (empty = factory)
      cabEl.classList.toggle("is-lamps", false);
    }
    root?.querySelector(".scout-marker")?.classList.toggle("is-seated", seated);
    setCabZoom(seated);
    paintCab();
  }

  function exitCab() {
    const cab = cabRef.current;
    if (!cab?.seated) return;
    cab.seated = false;
    cab.hail = null;
    cab.lat = pos.current.lat;
    cab.lng = pos.current.lng;
    cab.yaw = pos.current.yaw;
    const side = dest(
      pos.current.lat,
      pos.current.lng,
      Math.cos(pos.current.yaw + Math.PI / 2) * 7,
      -Math.sin(pos.current.yaw + Math.PI / 2) * 7,
    );
    const g = graphRef.current;
    // 0.1.2: snap to the main walk (wider than the old 40 m pull, never an island), so the player can always route.
    const curb = g ? curbAfterCab(g, side, walkReach()) : side;
    pos.current.lat = curb.lat;
    pos.current.lng = curb.lng;
    pos.current.speed = 0;
    routeMode.current = "walk";
    seatHud(false);
  }

  /** 0.1.8: your car drives a little faster than the city cab (1 when you have none). Seated driving only. */
  function ownPace() {
    return carPace(useGame.getState().carOn);
  }

  /** 0.1.8: the city's car lot — a sign on the map, its door snapped onto the walk. */
  function paintDealer(snapTo?: StreetGraph | null) {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const d = dealerOf(useGame.getState().cityId);
    const c = snapTo ? nearest(snapTo, d.lat, d.lng, 60) : null;
    dealerDoor.current = c ? { lat: c.lat, lng: c.lng } : { lat: d.lat, lng: d.lng };
    const safe = d.name.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    dealerMarker.current?.remove();
    dealerMarker.current = L.marker([dealerDoor.current.lat, dealerDoor.current.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="dealer-pin" data-testid="dealer-pin" title="${safe}: car lot"><i class="dealer-sign" aria-hidden="true"></i><span class="dealer-name">${safe}</span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      interactive: true,
      keyboard: false,
      zIndexOffset: 600,
    }).addTo(map);
    // 0.1.12: the sign was tap-dead (players thought the lot "won't open"); now it opens, or walks you to the door.
    dealerMarker.current.on("click", () => {
      const door = dealerDoor.current;
      if (!door) return;
      const act = dealerTap(distM(pos.current.lat, pos.current.lng, door.lat, door.lng), Boolean(cabRef.current?.seated));
      if (act === "open") useGame.getState().setDealerOpen(true);
      else if (act === "seated") flash("Step out of the car to visit the lot.");
      else {
        setDestination(door.lat, door.lng);
        flash("Walking to the car lot. The showroom opens at the door.", 2200);
      }
    });
  }

  // 0.1.12: buying or stepping up swaps the house marker straight away.
  useEffect(
    () =>
      useGame.subscribe((st, prev) => {
        if (st.houses !== prev.houses && houseMarker.current) paintHouse();
      }),
    [],
  );

  /** 0.1.12: house width in screen px for its real footprint at this zoom (scales with the map). */
  function houseWidthPx(tier: HouseTier): number {
    const map = mapRef.current;
    const door = houseDoor.current;
    if (!map || !door) return 48;
    const mpp = (156543.03392 * Math.cos((door.lat * Math.PI) / 180)) / 2 ** map.getZoom();
    // Drawn ×3 like the scouts and cars (true scale is a 20 px speck at street zoom); never smaller than a lamp.
    return Math.round(Math.min(220, Math.max(34, (HOUSE_METERS[tier] * 3) / mpp)));
  }
  function sizeHouse() {
    const el = houseMarker.current?.getElement()?.querySelector<HTMLElement>(".house-map");
    const tier = (el?.dataset.tier || "cottage") as HouseTier;
    if (el) el.style.setProperty("--house-w", `${houseWidthPx(tier)}px`);
  }

  /** 0.1.12: the city's house lot — the cottage "For sale", or your tier with "Home". Only this replaces it (never paintCab). */
  function paintHouse(snapTo?: StreetGraph | null) {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (snapTo !== undefined) houseGraph.current = snapTo;
    const st = useGame.getState();
    const lot = lotOf(st.cityId);
    // Re-snap only when a graph is handed in; a repaint (bought / stepped up) keeps the door where you stand.
    if (snapTo !== undefined || !houseDoor.current) {
      const c = houseGraph.current ? nearest(houseGraph.current, lot.lat, lot.lng, 80) : null;
      houseDoor.current = c ? { lat: c.lat, lng: c.lng } : { lat: lot.lat, lng: lot.lng };
    }
    const mine = st.houses[st.cityId];
    const tier = mine?.tier ?? "cottage";
    const chip = mine ? `Home · ${houseOf(tier)!.name}` : "For sale";
    houseMarker.current?.remove();
    // Drawn at building scale: the painted house (cutout) on a soft ground shadow with a warm window glow.
    const m = L.marker([houseDoor.current.lat, houseDoor.current.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="house-pin house-map${mine ? " is-home" : ""}" data-testid="house-pin" data-tier="${mine ? tier : ""}" style="--house-w:${houseWidthPx(tier)}px"><i class="house-shadow" aria-hidden="true"></i><i class="house-glow" aria-hidden="true"></i><img class="house-sprite" src="${houseMapArt(tier)}" alt="" draggable="false"><span class="house-chip">${chip}</span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      interactive: true,
      keyboard: false,
      zIndexOffset: 590,
    }).addTo(map);
    // Same as the lot sign: open at the door, else walk you there; in a cab or car, step out first.
    m.on("click", () => {
      const door = houseDoor.current;
      if (!door) return;
      const d = distM(pos.current.lat, pos.current.lng, door.lat, door.lng);
      if (cabRef.current?.seated) flash("Step out of the car to go home.");
      else if (d <= HOUSE_REACH_M) useGame.getState().setHouseOpen(true);
      else {
        setDestination(door.lat, door.lng);
        flash(useGame.getState().houses[useGame.getState().cityId] ? "Walking home. The door opens when you get there." : "Walking to the house for sale. It opens at the door.", 2200);
      }
    });
    houseMarker.current = m;
  }

  function enterCab() {
    const cab = cabRef.current;
    if (!cab || cab.seated) return;
    useGame.getState().noteGoalKind("cab");
    pos.current.lat = cab.lat;
    pos.current.lng = cab.lng;
    pos.current.yaw = cab.yaw;
    pos.current.speed = 0;
    cab.seated = true;
    cab.hail = null;
    cab.own = seatIsOwnCar(useGame.getState().carOn);
    routeMode.current = "drive";
    seatHud(true);
  }

  /** 0.1.14: foot, your own car, or the city cab. */
  function ride() {
    const c = cabRef.current;
    return rideOf(Boolean(c?.seated), Boolean(c?.own));
  }

  function spawnCabAt(lat: number, lng: number, yaw: number) {
    cabRef.current = { lat, lng, yaw, seated: false, hail: null, hailAlong: 0 };
    paintCab();
  }

  function toggleCab() {
    const drive = driveRef.current;
    if (cabRef.current?.seated) {
      clearRoute();
      exitCab();
      flash("Parked. The door is on foot.");
      return;
    }
    if (!drive || drive.segs.length < 4) {
      flash("The roads are still loading. Try again in a moment.");
      return;
    }
    const here = { lat: pos.current.lat, lng: pos.current.lng };
    const snap = nearest(drive, here.lat, here.lng, 120);
    if (!snap) {
      flash("No road that way.");
      return;
    }
    const cab = cabRef.current;
    if (cab && !cab.seated && distM(here.lat, here.lng, cab.lat, cab.lng) <= CAB_REACH) {
      enterCab();
      return;
    }
    // 0.1.8: your own car is already at the curb — no cab driving over to fetch you.
    const own = carOf(useGame.getState().carOn);
    if (own) {
      cabMarker.current?.remove();
      cabMarker.current = null;
      spawnCabAt(snap.lat, snap.lng, faceAlongStreet(drive, snap.lat, snap.lng));
      if (cabRef.current) cabRef.current.own = true;
      enterCab();
      flash(`${own.name}. Lamps answer from the car; park to step out.`);
      return;
    }
    if (snap.dist <= 16) {
      spawnCabAt(snap.lat, snap.lng, faceAlongStreet(drive, snap.lat, snap.lng));
      enterCab();
      return;
    }
    if (snap.dist <= 80) {
      spawnCabAt(snap.lat, snap.lng, faceAlongStreet(drive, snap.lat, snap.lng));
      flash("Cab's on the street.");
      return;
    }
    const from = cab ? { lat: cab.lat, lng: cab.lng } : { lat: snap.lat, lng: snap.lng };
    if (!cab) spawnCabAt(from.lat, from.lng, faceAlongStreet(drive, from.lat, from.lng));
    const path = routeOnGraph(drive, from, { lat: snap.lat, lng: snap.lng });
    if (!path || path.length < 2) {
      spawnCabAt(snap.lat, snap.lng, faceAlongStreet(drive, snap.lat, snap.lng));
      flash("Cab's on the street.");
      return;
    }
    cabRef.current = {
      lat: from.lat,
      lng: from.lng,
      yaw: cabRef.current?.yaw ?? 0,
      seated: false,
      hail: path,
      hailAlong: 0,
    };
    flash("Cab's coming to the curb.");
  }

  function paintWard(L: LModule, map: LMap) {
    const city = CITIES[cityId];
    const extras = [
      ...useGame.getState().mapKeys,
      ...(useGame.getState().run ? [useGame.getState().run!] : []),
      ...(useGame.getState().stack ? [useGame.getState().stack!] : []),
      ...(useGame.getState().climb ? [useGame.getState().climb!] : []),
      ...useGame.getState().blanks,
    ];
    const w = wardFrom([city.spawn, ...city.pois, ...extras]);
    wardRef.current = w;
    shadeRef.current?.remove();
    const world: [number, number][] = [
      [-90, -180],
      [-90, 180],
      [90, 180],
      [90, -180],
    ];
    shadeRef.current = L.polygon([world, wardRing(w)], {
      stroke: true,
      color: strokeColor(),
      weight: 2,
      opacity: 0.55,
      fillColor: "#070605",
      fillOpacity: 0.72,
      interactive: false,
      className: "ward-shade",
    }).addTo(map);
    const bounds = L.latLngBounds([w.south, w.west], [w.north, w.east]).pad(0.12);
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 0.92;
  }

  function clearQueueMarks() {
    for (const m of queueMarkers.current) m.remove();
    queueMarkers.current = [];
    planLine.current?.remove();
    planLine.current = null;
  }

  function syncRouteHud() {
    useGame.getState().setHud({
      routeStops: (waypoint.current ? 1 : 0) + queue.current.length,
      routeHold: routeHold.current,
    });
  }

  function paintQueue() {
    clearQueueMarks();
    const L = Lref.current;
    const map = mapRef.current;
    const cur = waypoint.current;
    if (L && map && cur) placeWaypoint(L, map, cur.lat, cur.lng);
    if (L && map && cur && queue.current.length > 0) {
      const pts = [cur, ...queue.current];
      planLine.current = L.polyline(
        pts.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#c4a35a", weight: 3, opacity: 0.75, dashArray: "1 8", interactive: false, className: "route-plan" },
      ).addTo(map);
      queue.current.forEach((s, i) => {
        const marker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({
            className: "",
            html: `<div class="route-stop">${i + 2}</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          }),
          keyboard: false,
          zIndexOffset: 640,
        }).addTo(map);
        marker.on("click", () => {
          queue.current = queue.current.filter((q) => q !== s);
          paintQueue();
          const n = (waypoint.current ? 1 : 0) + queue.current.length;
          flash(n > 1 ? `Dropped. ${n} stops left.` : "Dropped.");
        });
        queueMarkers.current.push(marker);
      });
    }
    syncRouteHud();
  }

  function clearRoute() {
    routeRef.current = null;
    routeAlong.current = 0;
    stuckFor.current = 0;
    skips.current = 0;
    replans.current = 0;
    routeLine.current?.remove();
    routeLine.current = null;
    waypoint.current = null;
    waypointMarker.current?.remove();
    waypointMarker.current = null;
    queue.current = [];
    legKey.current = null;
    legDoor.current = false;
    routeHold.current = false;
    clearQueueMarks();
    useGame.getState().setHud({ waypoint: null, routeStops: 0, routeHold: false });
  }

  /** The live stop is done. Pick up a match before moving on. A door waits until you leave it. */
  /** A stuck walker re-plans the leg a few times, then gives up instead of standing there re-planning forever. */
  function replanStuck(wp: { lat: number; lng: number }) {
    replans.current += 1;
    if (replans.current > MAX_STUCK_REPLANS) {
      clearRoute();
      flash("Can't get through here. Tap a street nearby.");
      return;
    }
    void setDestination(wp.lat, wp.lng, legDoor.current, true);
  }

  function endLeg() {
    replans.current = 0;
    const wasDrive = routeMode.current === "drive" && Boolean(cabRef.current?.seated);
    if (wasDrive && cabRef.current?.own) {
      // 0.1.14: own car — stop at the curb, stay seated; a match on the leg is picked up from the window.
      const keyId = legKey.current;
      const match = keyId ? useGame.getState().mapKeys.find((k) => k.id === keyId) : null;
      const door = legDoor.current;
      clearRoute();
      pos.current.speed = 0;
      if (match && canGrabMatch(graphRef.current, pos.current, match, reachMult(useGame.getState().scout))) useGame.getState().collectKey(match.id);
      else if (door) flash("At the curb. E to open from the car.", 1600);
      return;
    }
    if (wasDrive) {
      clearRoute();
      exitCab();
      flash("Parked. The door is on foot.", 1800);
      return;
    }
    const keyId = legKey.current;
    if (keyId) {
      const match = useGame.getState().mapKeys.find((k) => k.id === keyId);
      if (match) {
        if (canGrabMatch(graphRef.current, pos.current, match, reachMult(useGame.getState().scout))) useGame.getState().collectKey(match.id);
        else flash("That match is off the street.");
        queue.current = queue.current.filter((s) => s.keyId !== keyId);
        legKey.current = null;
      }
    }
    if (legDoor.current && queue.current.length > 0) {
      routeRef.current = null;
      routeAlong.current = 0;
      stuckFor.current = 0;
      skips.current = 0;
      routeLine.current?.remove();
      routeLine.current = null;
      routeHold.current = true;
      pos.current.speed = 0;
      flash("At the door. The rest of the route waits.");
      syncRouteHud();
      return;
    }
    const next = queue.current.shift();
    if (!next) {
      clearRoute();
      return;
    }
    routeHold.current = false;
    legDoor.current = Boolean(next.door);
    legKey.current = next.keyId ?? null;
    void setDestination(next.lat, next.lng, Boolean(next.door), true);
  }

  function noteCollected(id: string) {
    const was = legKey.current === id;
    queue.current = queue.current.filter((s) => s.keyId !== id);
    if (!was) {
      paintQueue();
      return;
    }
    legKey.current = null;
    legDoor.current = false;
    endLeg();
  }

  /**
   * Tap a point. With no walk going, start one. With a walk going, add the stop
   * on the end — tap it again to take it off. Matches keep their id so picking
   * one up drops it from the route.
   */
  function planWalk(lat: number, lng: number, door = false, keyId?: string) {
    if (ride() === "own") {
      // 0.1.14: drive there; the route stops at the curb within reach (setDestination) and you stay in the car.
      void setDestination(lat, lng, door, false, keyId);
      return;
    }
    if (cabRef.current?.seated) {
      flash("Park at the curb. The door is on foot.", 1800);
      void setDestination(lat, lng, door);
      return;
    }
    // 0.0.95: a new tap replaces the route (it used to queue up to eight stops, so repeated taps on a slow
    // or wedged walk built a long route the walker kept following instead of the latest tap).
    const decided = tapAction(waypoint.current, { lat, lng, keyId });
    if (decided === "same") return;
    queue.current = [];
    routeHold.current = false;
    void setDestination(lat, lng, door, false, keyId);
  }

  /** 0.0.97: press and hold adds a stop to the end of the route (up to HOLD_CAP stops). */
  function holdStop(lat: number, lng: number) {
    if (cabRef.current?.seated) return planWalk(lat, lng);
    const L = Lref.current;
    const map = mapRef.current;
    if (L && map) {
      const ring = L.marker([lat, lng], { icon: L.divIcon({ className: "", html: '<div class="hold-ring"></div>', iconSize: [44, 44], iconAnchor: [22, 22] }), interactive: false, keyboard: false, zIndexOffset: 650 }).addTo(map);
      window.setTimeout(() => ring.remove(), 700);
    }
    try {
      navigator.vibrate?.(18);
    } catch {
      /* no vibration */
    }
    const act = holdAction(queue.current, waypoint.current, { lat, lng });
    if (act === "start") return planWalk(lat, lng);
    if (act === "same") return;
    if (act === "full") {
      flash(`Route is full (${HOLD_CAP} stops). Tap to start a new one.`);
      return;
    }
    queue.current = [...queue.current, { lat, lng }];
    paintQueue();
    syncRouteHud();
    flash(`Stop ${queue.current.length + 1} added.`, 1200);
  }

  function drawRoute(L: LModule, map: LMap, path: Pt[]) {
    if (mapRef.current !== map) return; // removed map: Leaflet would throw adding to its gone panes
    routeLine.current?.remove();
    routeLine.current = L.polyline(
      path.map((p) => [p.lat, p.lng] as [number, number]),
      { color: strokeColor(), weight: 4, opacity: 0.88, className: "route-line", interactive: false },
    ).addTo(map);
  }

  function clearDaily() {
    for (const l of dailyLines.current) l.remove();
    for (const m of dailyPins.current) m.remove();
    dailyLines.current = [];
    dailyPins.current = [];
    dailyKey.current = "";
  }

  /** Daily Lantern Run: the five lamps, numbered, and the foot route between them. */
  function paintDaily() {
    const L = Lref.current;
    const map = mapRef.current;
    const g = graphRef.current;
    const ds = useDaily.getState();
    if (!L || !map || !ds.show) {
      clearDaily();
      return;
    }
    const cid = useGame.getState().cityId;
    const prog = activeProgress(ds.runs, cid);
    const route = prog ? dailyRoute(prog.city, prog.day) : todayRoute(cid);
    const lit = prog?.lit ?? 0;
    const key = `${route.city}|${route.day}|${g ? g.segs.length > 0 : false}`;
    for (const m of dailyPins.current) m.remove();
    dailyPins.current = route.lamps.map((lamp, i) =>
      L.marker([lamp.lat, lamp.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="daily-pin${i < lit ? " is-lit" : i === lit ? " is-next" : ""}" title="Lantern Run lamp ${i + 1}: ${lamp.name.replace(/"/g, "&quot;")}"><span>${i + 1}</span></div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 44],
        }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 700,
      }).addTo(map),
    );
    for (let i = 0; i < dailyLines.current.length; i++) {
      dailyLines.current[i]!.getElement()?.classList.toggle("is-walked", i < lit - 1);
    }
    if (dailyKey.current === key) return;
    for (const l of dailyLines.current) l.remove();
    dailyLines.current = [];
    dailyKey.current = key;
    const legs: (Polyline | null)[] = [];
    const draw = (i: number, path: Pt[] | null) => {
      if (mapRef.current !== map || dailyKey.current !== key || !path || path.length < 2) return;
      legs[i]?.remove();
      const line = L.polyline(
        path.map((p) => [p.lat, p.lng] as [number, number]),
        { weight: 5, opacity: 0.9, className: `daily-route${i < (activeProgress(useDaily.getState().runs, cid)?.lit ?? 0) - 1 ? " is-walked" : ""}`, interactive: false, dashArray: "2 9" },
      ).addTo(map);
      legs[i] = line;
      dailyLines.current = legs.filter((x): x is Polyline => Boolean(x));
    };
    const signal = abortRef.current?.signal;
    for (let i = 1; i < route.lamps.length; i++) {
      const a = route.lamps[i - 1]!;
      const b = route.lamps[i]!;
      const local = g ? routeOnGraph(g, a, b) : null;
      draw(i - 1, local);
      // Foot router first (never a car profile); the walk graph wins if it strays off walkable ways.
      void routeWalk(g, a, b, signal).then((path) => draw(i - 1, path));
    }
  }

  function clearMarket() {
    for (const l of marketLayers.current) l.remove();
    marketLayers.current = [];
    marketKey.current = "";
  }

  /** Night market: a glowing circle, its roads lit, and a ×2 lantern sign at its centre. Repaints each market and when streets load. */
  /** 0.1.7: the radial gradient the market circle fills with, added once to the overlay SVG. */
  function ensureMarketPool(map: import("leaflet").Map) {
    const svg = map.getPanes().overlayPane.querySelector("svg");
    if (!svg || svg.querySelector("#market-pool")) return;
    const ns = "http://www.w3.org/2000/svg";
    const defs = document.createElementNS(ns, "defs");
    defs.innerHTML = '<radialGradient id="market-pool"><stop offset="0" stop-opacity="0.22"/><stop offset="0.65" stop-opacity="0.09"/><stop offset="1" stop-opacity="0.02"/></radialGradient>';
    svg.prepend(defs);
  }

  function paintMarket() {
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const cid = useGame.getState().cityId;
    const now = Date.now();
    const m = marketAt(cid, now);
    const key = m ? `${cid}|${m.hour}|${graphRef.current?.segs.length ?? 0}` : "";
    const sign = marketLayers.current.find((l): l is Marker => l instanceof L.Marker);
    if (marketKey.current === key) {
      const el = sign?.getElement()?.querySelector(".market-pin-left");
      if (el && m) el.textContent = marketLeft(m, now);
      return;
    }
    clearMarket();
    // 0.1.7: the market's three lanterns come and go with it, so the lamp pins follow every market change.
    rebuildPins(L, map);
    marketKey.current = key;
    if (!m) return;
    // 0.1.6: the market is just the circle. Every road inside it glows (clipped at the edge); the old dotted line
    // along one street, running past the circle, is gone. One polyline, no events, so it is cheap and never takes a tap.
    const roads = graphRef.current ? roadsInCircle(graphRef.current, m.zone) : [];
    // 0.1.00: the market is a zone round a square; a soft glowing edge, every lamp inside counts.
    // 0.1.7 art pass: a warm pool of light (radial gradient, no flat fill) inside a fine double ring, the roads as a
    // faint warm thread, and strings of small bulbs along them — two dotted paths that twinkle out of step. Four SVG
    // paths in all, no events: cheap on phones and never takes a tap. Purely cosmetic.
    ensureMarketPool(map);
    const zone = L.circle([m.zone.lat, m.zone.lng], { radius: m.zone.r, className: "market-zone", interactive: false, weight: 1.5, fillOpacity: 1 }).addTo(map);
    const line = { interactive: false, lineCap: "round" as const, lineJoin: "round" as const };
    const glow = L.polyline(roads, { ...line, weight: 2, opacity: 0.35, className: "market-roads" }).addTo(map);
    const bulbsA = L.polyline(roads, { ...line, weight: 3.5, opacity: 1, dashArray: "0 14", className: "market-bulbs" }).addTo(map);
    const bulbsB = L.polyline(roads, { ...line, weight: 3.5, opacity: 1, dashArray: "0 14", dashOffset: "7", className: "market-bulbs is-b" }).addTo(map);
    const at = { lat: m.zone.lat, lng: m.zone.lng };
    void marketAnchor;
    const safe = m.street.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
    const pin = L.marker([at.lat, at.lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="market-pin" data-testid="market-pin" title="${safe}: lamps, trivia cards and matches pay double this hour"><i class="market-lantern" aria-hidden="true"></i><span class="market-pin-copy"><b>${MARKET_TAG}</b><em>${safe}</em><small class="market-pin-left">${marketLeft(m, now)}</small></span></div>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: 650,
    }).addTo(map);
    marketLayers.current = [zone, glow, bulbsA, bulbsB, pin];
    fitMarketSign();
  }

  /** 0.1.00: the sign shrinks as you zoom in and fades once you're inside the zone. */
  function fitMarketSign() {
    const map = mapRef.current;
    const box = map?.getContainer();
    if (!map || !box) return;
    const z = map.getZoom();
    box.style.setProperty("--market-sign", String(Math.max(0.55, Math.min(1, 1 - (z - 15) * 0.15))));
    const m = marketAt(useGame.getState().cityId, Date.now());
    box.classList.toggle("is-in-market", Boolean(m && inZone(m.zone, pos.current.lat, pos.current.lng)));
    box.dataset.marketLight = useGame.getState().marketLight;
  }

  function walkToMarket() {
    const s = useGame.getState();
    if (s.hud.seated) {
      flash("Park at the curb. The door is on foot.");
      return;
    }
    const m = marketAt(s.cityId, Date.now());
    if (!m) return;
    const p = closestOnStreet(m.street, pos.current.lat, pos.current.lng);
    if (p.dist <= 25) {
      flash(`You're on ${m.street.name}. ${MARKET_TAG} on its lamps and matches.`);
      return;
    }
    void setDestination(p.lat, p.lng);
    mapRef.current?.panTo([p.lat, p.lng]);
    flash(`Night market on ${m.street.name}. ${MARKET_TAG}.`);
  }

  function snapKeys(g: StreetGraph) {
    if (snapping.current) return;
    const keys = useGame.getState().mapKeys;
    const w = wardRef.current;
    let changed = false;
    const next = keys.map((k) => {
      // 0.0.90: only the walk you can reach from the city start (no islands, blocks or freeways).
      const reach = walkReach();
      let p = snapReachable(g, k, reach);
      if (w && !inWard(w, p.lat, p.lng)) {
        p = randomOnStreet(g, { lat: pos.current.lat, lng: pos.current.lng }, 40, 640, reach);
        const held = clampWard(w, p.lat, p.lng);
        p = snapReachable(g, held, reach);
      }
      if (distM(k.lat, k.lng, p.lat, p.lng) > 1.5) {
        changed = true;
        return { ...k, lat: p.lat, lng: p.lng };
      }
      return k;
    });
    if (changed) {
      snapping.current = true;
      useGame.setState({ mapKeys: next });
      snapping.current = false;
    }
    const run = useGame.getState().run;
    if (run && run.readyAt === 0) {
      let p = onStreet(g, run.lat, run.lng);
      if (w && !inWard(w, p.lat, p.lng)) p = onStreet(g, clampWard(w, p.lat, p.lng).lat, clampWard(w, p.lat, p.lng).lng);
      if (distM(run.lat, run.lng, p.lat, p.lng) > 1.5) {
        useGame.setState({ run: { ...run, lat: p.lat, lng: p.lng } });
      }
    }
    const stack = useGame.getState().stack;
    if (stack && stack.readyAt === 0) {
      let p = onStreet(g, stack.lat, stack.lng);
      if (w && !inWard(w, p.lat, p.lng)) p = onStreet(g, clampWard(w, p.lat, p.lng).lat, clampWard(w, p.lat, p.lng).lng);
      if (distM(stack.lat, stack.lng, p.lat, p.lng) > 1.5) {
        useGame.setState({ stack: { ...stack, lat: p.lat, lng: p.lng } });
      }
    }
    const climb = useGame.getState().climb;
    if (climb && climb.readyAt === 0) {
      let p = onStreet(g, climb.lat, climb.lng);
      if (w && !inWard(w, p.lat, p.lng)) p = onStreet(g, clampWard(w, p.lat, p.lng).lat, clampWard(w, p.lat, p.lng).lng);
      if (distM(climb.lat, climb.lng, p.lat, p.lng) > 1.5) {
        useGame.setState({ climb: { ...climb, lat: p.lat, lng: p.lng } });
      }
    }
  }

  function placeOnStreet(g: StreetGraph, lat: number, lng: number, openNorth = false) {
    const snapped = pullToStreet(g, lat, lng, 140);
    // A start (spawn, station, restored spot) never rests on a freeway, ramp or feeder.
    // A fresh city stand also steps along the curb when north dies in a few metres.
    const cleared = clearOfFreeway(g, offFreeway(g, clearCorner(g, snapped.lat, snapped.lng)));
    const p = openNorth ? standOpen(g, cleared.lat, cleared.lng) : cleared;
    pos.current.lat = p.lat;
    pos.current.lng = p.lng;
    const city = CITIES[useGame.getState().cityId];
    let toward: Pt | undefined;
    let best = Infinity;
    for (const poi of city.pois) {
      const d = distM(p.lat, p.lng, poi.lat, poi.lng);
      if (d > 40 && d < best) {
        best = d;
        toward = poi;
      }
    }
    pos.current.yaw = faceAlongStreet(g, p.lat, p.lng, toward);
    playerMarker.current?.setLatLng([p.lat, p.lng]);
  }

  function fillWardLamps(g: StreetGraph) {
    const st = useGame.getState();
    const city = CITIES[st.cityId];
    if (!st.blanks.length) {
      st.seedBlanks(scatterStreetLamps(g, [city.spawn, ...city.pois], city.id));
    }
    const now = useGame.getState();
    if (!now.streetSpread) {
      const avoid = [city.spawn, ...city.pois, ...now.blanks];
      const pts = spreadOnGraph(g, avoid, now.mapKeys.length);
      const keys = now.mapKeys.map((k, i) => (pts[i] ? { ...k, lat: pts[i]!.lat, lng: pts[i]!.lng } : k));
      const extra = spreadOnGraph(g, [...avoid, ...keys], 3, 240);
      const run =
        now.run && now.run.readyAt === 0 && extra[0]
          ? { ...now.run, lat: extra[0].lat, lng: extra[0].lng }
          : now.run;
      const stack =
        now.stack && now.stack.readyAt === 0 && extra[1]
          ? { ...now.stack, lat: extra[1].lat, lng: extra[1].lng }
          : now.stack;
      const climb =
        now.climb && now.climb.readyAt === 0 && extra[2]
          ? { ...now.climb, lat: extra[2].lat, lng: extra[2].lng }
          : now.climb;
      now.spreadDrops(keys, run, stack, climb);
    }
    const L = Lref.current;
    const m = mapRef.current;
    if (L && m) {
      paintWard(L, m);
      rebuildPins(L, m);
    }
  }

  useEffect(() => {
    const city = CITIES[cityId];
    const land = useGame.getState().landAtStation;
    const dock = land ? fareDesk(city) : (city.start ?? city.spawn);
    if (land) useGame.setState({ landAtStation: false });
    pos.current = { lat: dock.lat, lng: dock.lng, yaw: 0, speed: 0, stamina: 1 };
    waypoint.current = null;
    routeRef.current = null;
    follow.current = true;
    graphRef.current = null;
    bindWalkGraph(null);
    driveRef.current = null;
    cabRef.current = null;
    cabMarker.current?.remove();
    cabMarker.current = null;
    routeMode.current = "walk";
    // Drop the previous city's fence before the new streets arrive. One frame of the old box
    // clamps a Temple spawn onto Austin's edge, then the new box yanks that spot to the rim.
    wardRef.current = null;
    useGame.getState().setHud({ seated: false });
    setStreets("loading");
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    let cancelled = false;
    let map: LMap | null = null;

    void import("leaflet").then((L) => {
      if (cancelled || !hostRef.current) return;
      Lref.current = L;
      map = L.map(hostRef.current, {
        zoomControl: true,
        attributionControl: true,
        keyboard: false,
        zoomSnap: 1,
        zoomDelta: 1,
        minZoom: 15,
        maxZoom: 18,
        renderer: steadySvg(L),
      }).setView([dock.lat, dock.lng], 16);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
        maxNativeZoom: 18,
        className: "atlas-tiles",
      }).addTo(map);

      mapRef.current = map;
      if (import.meta.env.DEV) {
        // Dev/QA only: lets smoke scripts stand the walker at a spot and read the walk graph.
        (window as unknown as { __keylineMap?: unknown }).__keylineMap = {
          map: () => mapRef.current,
          pos: () => ({ ...pos.current }),
          graph: () => graphRef.current,
          route: () => routeRef.current,
          queue: () => queue.current.map((s) => ({ ...s })),
          waypoint: () => (waypoint.current ? { ...waypoint.current } : null),
          hold: () => routeHold.current,
          keys: () => useGame.getState().mapKeys.map((k) => ({ id: k.id, lat: k.lat, lng: k.lng, tier: k.tier })),
          walkTo: (lat: number, lng: number) => setDestination(lat, lng),
          plan: (lat: number, lng: number, keyId?: string) => planWalk(lat, lng, false, keyId),
          daily: () => useDaily.getState(),
          market: () => marketAt(useGame.getState().cityId, Date.now()),
          // 0.1.8 QA: the car lot's door and the CAB / Car button.
          dealer: () => (dealerDoor.current ? { ...dealerDoor.current } : null),
          house: () => (houseDoor.current ? { ...houseDoor.current } : null),
          cab: () => toggleCab(),
          place: (lat: number, lng: number) => {
            const g = graphRef.current;
            clearRoute();
            if (g) placeOnStreet(g, lat, lng);
            mapRef.current?.setView([pos.current.lat, pos.current.lng], mapRef.current.getZoom());
          },
          stand: (lat: number, lng: number) => {
            clearRoute();
            pos.current.lat = lat;
            pos.current.lng = lng;
            pos.current.speed = 0;
            playerMarker.current?.setLatLng([lat, lng]);
            mapRef.current?.setView([lat, lng], mapRef.current.getZoom());
          },
        };
      }
      paintWard(L, map);
      map.on("dragstart", () => {
        follow.current = false;
      });
      // 0.1.13: "center on me" — a crosshair under the zoom buttons (and C on a keyboard) pans back to you.
      const zoomBar = map.zoomControl?.getContainer();
      if (zoomBar) {
        const btn = L.DomUtil.create("a", "leaflet-control-center", zoomBar) as HTMLAnchorElement;
        btn.href = "#";
        btn.role = "button";
        btn.title = "Center on me (C)";
        btn.setAttribute("aria-label", "Center on me");
        btn.dataset.testid = "center-me";
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>`;
        L.DomEvent.disableClickPropagation(btn);
        L.DomEvent.on(btn, "click", (ev) => {
          L.DomEvent.preventDefault(ev);
          centerOnMe();
        });
      }
      // 0.0.97: press and hold (~480 ms, finger still) adds a stop; a plain tap replaces the route.
      const PINS = ".vault-pin, .shop-pin, .counter-pin, .board-pin, .match-pin, .route-stop, .leaflet-control";
      let hold: { id: number; x: number; y: number; timer: number } | null = null;
      let heldAt = 0;
      const box = map.getContainer();
      const endHold = () => {
        if (hold) window.clearTimeout(hold.timer);
        hold = null;
      };
      box.addEventListener("pointerdown", (ev) => {
        heldAt = 0; // 0.0.99: a new press forgets the last hold
        if (!ev.isPrimary || (ev.pointerType === "mouse" && ev.button !== 0)) return;
        if ((ev.target as HTMLElement | null)?.closest(PINS)) return;
        endHold();
        const x = ev.clientX;
        const y = ev.clientY;
        hold = {
          id: ev.pointerId,
          x,
          y,
          timer: window.setTimeout(() => {
            hold = null;
            heldAt = Date.now();
            const m = mapRef.current;
            if (!m) return;
            const ll = m.containerPointToLatLng(m.mouseEventToContainerPoint(ev as unknown as MouseEvent));
            holdStop(ll.lat, ll.lng);
          }, 480),
        };
      });
      box.addEventListener("pointermove", (ev) => {
        if (hold && ev.pointerId === hold.id && Math.hypot(ev.clientX - hold.x, ev.clientY - hold.y) > 8) endHold();
      });
      for (const t of ["pointerup", "pointercancel", "pointerleave"]) box.addEventListener(t, endHold);
      map.on("dragstart zoomstart", endHold);
      box.addEventListener("contextmenu", (ev) => ev.preventDefault());
      map.on("click", (e) => {
        // 0.0.99: the click that ends a long-press is swallowed however long the hold was (a desktop mouse
        // is often held well past 700 ms, and that click used to replace the route the hold had just extended).
        if (heldAt) {
          heldAt = 0;
          return;
        }
        const t = e.originalEvent.target as HTMLElement | null;
        if (t?.closest(PINS)) return;
        // 0.0.99: Shift+click adds a stop on desktop (same as press and hold).
        if ((e.originalEvent as MouseEvent).shiftKey) {
          holdStop(e.latlng.lat, e.latlng.lng);
          return;
        }
        planWalk(e.latlng.lat, e.latlng.lng);
      });

      const icon = L.divIcon({
        className: "",
        html: `<div class="pawn"><div class="scout-marker is-idle" data-scout="${useGame.getState().scout}"${coatAttr(wornLook(useGame.getState().paints.wornCoat, useGame.getState().wardrobe.coat))} data-row="0" data-col="0"></div>${cabMarkup("down", false).replace("<div ", "<div hidden ")}</div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 30],
      });
      playerMarker.current = L.marker([dock.lat, dock.lng], {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 800,
      }).addTo(map);
      warmSheets(useGame.getState().scout, wornLook(useGame.getState().paints.wornCoat, useGame.getState().wardrobe.coat));

      rebuildPins(L, map);
      paintMarket();
      map.on("zoomend", fitMarketSign);
      map.on("zoom zoomend", sizeHouse); // 0.1.12: the house keeps its real size
      const signTick = window.setInterval(fitMarketSign, 1500);
      map.once("unload", () => window.clearInterval(signTick));
    });

    void bootstrapStreets(city.id, dock.lat, dock.lng, city.pois, abort.signal)
      .then((g) => {
        if (cancelled) return;
        graphRef.current = g;
        bindWalkGraph(g, city.start ?? city.spawn);
        placeOnStreet(g, dock.lat, dock.lng, true);
        snapKeys(g);
        setStreets("ready");
        paintMarket(); // 0.1.6: the lit roads need the street graph
        paintDealer(g); // 0.1.8: and the car lot door snaps onto it
        paintHouse(g); // 0.1.12: and the house lot
        const L = Lref.current;
        const m = mapRef.current;
        if (L && m) rebuildPins(L, m);
        void fillSurroundings(g, dock.lat, dock.lng, city.pois, abort.signal).then(async () => {
          if (cancelled) return;
          snapKeys(g);
          fillWardLamps(g);
          // 0.1.8: load the streets out to the car lot (a no-op when they are already in), then seat its door.
          const d = dealerOf(city.id);
          await expandGraph(g, d.lat, d.lng, 700, abort.signal).catch(() => g);
          if (!cancelled) paintDealer(g);
        });
      })
      .catch(() => {
        if (cancelled || abort.signal.aborted) return;
        setStreets("error");
      });

    void bootstrapDrive(dock.lat, dock.lng, city.pois, abort.signal, city.id).then((dg) => {
      if (cancelled) return;
      driveRef.current = dg;
      void fillSurroundings(dg, dock.lat, dock.lng, city.pois, abort.signal, true).then(() => {
        const d = dealerOf(city.id);
        return expandGraph(dg, d.lat, d.lng, 700, abort.signal, true).catch(() => dg);
      });
    });

    return () => {
      cancelled = true;
      abort.abort();
      bindWalkGraph(null);
      map?.remove();
      mapRef.current = null;
      playerMarker.current = null;
      cabMarker.current?.remove();
      cabMarker.current = null;
      routeLine.current = null;
      routeRef.current = null;
      waypoint.current = null;
      queue.current = [];
      legKey.current = null;
      legDoor.current = false;
      routeHold.current = false;
      clearQueueMarks();
      waypointMarker.current = null;
      vaultMarkers.current.clear();
      keyMarkers.current.clear();
      dailyLines.current = [];
      dailyPins.current = [];
      dailyKey.current = "";
      marketLayers.current = [];
      marketKey.current = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  function placeWaypoint(L: LModule, map: LMap, lat: number, lng: number) {
    if (mapRef.current !== map) return;
    waypointMarker.current?.remove();
    waypointMarker.current = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="waypoint-dot${queue.current.length ? " has-num" : ""}">${queue.current.length ? "1" : ""}</div>`,
        iconSize: queue.current.length ? [18, 18] : [10, 10],
        iconAnchor: queue.current.length ? [9, 9] : [5, 5],
      }),
      interactive: false,
      keyboard: false,
      zIndexOffset: queue.current.length ? 650 : 0,
    }).addTo(map);
  }

  async function setDestination(lat: number, lng: number, door = false, keepQueue = false, keyId?: string) {
    follow.current = true;
    const L = Lref.current;
    const map = mapRef.current;
    const g = graphRef.current;
    const w = wardRef.current;
    let target = { lat, lng };
    const outside = Boolean(w && !inWard(w, lat, lng));
    if (w && outside) {
      target = clampWard(w, lat, lng);
      bumpFence();
    }
    // 0.0.90: a tap past the box, or on a walk you can't reach (Windsor from Detroit), walks to the nearest
    // reachable spot on your side instead of refusing.
    let edge = false;
    if (g && !cabRef.current?.seated && !door) {
      const near = walkableTarget(g, target, { lat: pos.current.lat, lng: pos.current.lng }, outside);
      if (near) {
        const held = w ? clampWard(w, near.lat, near.lng) : near;
        target = w && !inWard(w, near.lat, near.lng) ? (nearest(g, held.lat, held.lng, 220) ?? held) : near;
        edge = true;
        flash("That's as close as you can walk. Heading there.");
      }
    }
    const prior = waypoint.current;
    if (!keepQueue && prior && distM(prior.lat, prior.lng, target.lat, target.lng) < 14 && (routeRef.current?.length ?? 0) >= 2) {
      return;
    }
    // 0.0.95: a fresh tap drops the old line at once, so the walker never keeps marching on the stale leg
    // while the new route is still being planned (that read as "stuck / ignoring my taps").
    if (!keepQueue) {
      routeRef.current = null;
      routeLine.current?.remove();
      routeLine.current = null;
    }
    const seq = ++destSeq.current;
    const from = { lat: pos.current.lat, lng: pos.current.lng };
    const seated = Boolean(cabRef.current?.seated);
    const cut = canCutBuildings(useGame.getState().scout);
    const net = seated ? driveRef.current : g;
    let snappedRaw = net ? pullToStreet(net, target.lat, target.lng, seated ? 120 : 220, seated ? undefined : from) : target;
    let snapped = w ? clampWard(w, snappedRaw.lat, snappedRaw.lng) : snappedRaw;
    let snapGap = distM(snapped.lat, snapped.lng, target.lat, target.lng);
    // The bake is downtown. A tap past its edge still has streets — load them before deciding the
    // pin is in a field. A loaded area with nothing close (Camp Mabry, a park interior) does not.
    if (!seated && !cut && g && snapGap > WALK_REACH_M && !graphCovers(g, target.lat, target.lng)) {
      try {
        await expandGraph(g, target.lat, target.lng, 1600, abortRef.current?.signal);
      } catch {
        /* decide with the streets already loaded */
      }
      if (destSeq.current !== seq || mapRef.current !== map) return;
      snappedRaw = pullToStreet(g, target.lat, target.lng, 220, from);
      snapped = w ? clampWard(w, snappedRaw.lat, snappedRaw.lng) : snappedRaw;
      snapGap = distM(snapped.lat, snapped.lng, target.lat, target.lng);
      // 0.1.36: the streets there didn't load (live fetch down): let the foot router lay the way in.
      if (snapGap > WALK_REACH_M && (await bridgeByFoot(g, from, target, abortRef.current?.signal))) {
        if (destSeq.current !== seq || mapRef.current !== map) return;
        snappedRaw = pullToStreet(g, target.lat, target.lng, 220, from);
        snapped = w ? clampWard(w, snappedRaw.lat, snappedRaw.lng) : snappedRaw;
        snapGap = distM(snapped.lat, snapped.lng, target.lat, target.lng);
      }
    }
    // No street within a door-step: drawing the route would stop on a far curb and leave the pin behind.
    if (!cut && !edge && snapGap > (seated ? 140 : WALK_REACH_M)) {
      flash(seated ? "No road that way." : "No street that way.");
      return;
    }
    if (!keepQueue) {
      replans.current = 0;
      queue.current = [];
      routeHold.current = false;
      legKey.current = keyId ?? null;
    }
    legDoor.current = door;
    // A plain tap stands where the route can finish. A door keeps its pin; the last step is the hop.
    const pin = !cut && !door && !seated ? snapped : target;
    waypoint.current = { lat: pin.lat, lng: pin.lng, door, keyId: legKey.current ?? undefined };
    routeAlong.current = 0;
    stuckFor.current = 0;
    skips.current = 0;
    routeMode.current = seated ? "drive" : "walk";
    if (L && map) placeWaypoint(L, map, pin.lat, pin.lng);
    paintQueue();
    useGame.getState().setHud({ waypoint: pin });

    const walkTo = seated || cut ? (seated ? snapped : target) : snapped;
    const arrive = door && !cut && !seated ? target : walkTo;
    // The walk starts on the closest street that isn't under or beside a freeway, ramp or feeder.
    // A walker already in a field (no street within a block) still gets the nearest clear street,
    // so the route can begin and they can walk across open ground to join it.
    let walkFrom = from;
    if (g && !seated) {
      const snapStart = (max: number) => {
        const hit = nearest(g, from.lat, from.lng, max);
        return hit ? clearOfFreeway(g, { lat: hit.lat, lng: hit.lng }) : null;
      };
      let street = snapStart(180);
      if ((!street || distM(street.lat, street.lng, from.lat, from.lng) > 36) && !graphCovers(g, from.lat, from.lng, 250)) {
        try {
          await expandGraph(g, from.lat, from.lng, 1400, abortRef.current?.signal);
        } catch {
          /* the streets already loaded still count */
        }
        if (destSeq.current !== seq || mapRef.current !== map) return;
        street = snapStart(700) ?? street;
      }
      if (street && (distM(street.lat, street.lng, from.lat, from.lng) <= 36 || !hopTouchesFreeway(g, from, street))) walkFrom = street;
    }
    const apply = (raw: Pt[] | null) => {
      let path = seated ? (raw && cabRef.current?.own && (door || keyId) ? trimToReach(raw, target, keyId ? MATCH_GRAB_M * 0.8 : reach() * 0.8) : raw) : finishPath(raw, cut ? from : walkFrom, arrive, { cutBuildings: cut, door: door && !cut && !seated, graph: g });
      if (!path || path.length < 2) return false;
      // Off the streets (a park, Camp Mabry): walk straight to the route if that line misses every freeway.
      if (!seated && g) {
        const join = path[0]!;
        const gap = distM(from.lat, from.lng, join.lat, join.lng);
        if (gap > 18 && gap < 800 && !hopTouchesFreeway(g, from, join)) path = [{ lat: from.lat, lng: from.lng }, ...path];
      }
      const here = closestOnPath(path, pos.current.lat, pos.current.lng, routeAlong.current);
      if (here.dist > 160 && distM(path[0]!.lat, path[0]!.lng, from.lat, from.lng) > 40) return false;
      routeRef.current = path;
      routeAlong.current = here.dist < 90 ? here.along : 0;
      stuckFor.current = 0;
      if (L && map) drawRoute(L, map, path);
      const look = pointAlongPath(path, Math.min(routeAlong.current + 12, pathLength(path)));
      pos.current.yaw = yawToTarget(pos.current.lat, pos.current.lng, 0, look.lat, look.lng);
      return true;
    };

    const local = net ? routeOnGraph(net, seated || cut ? from : walkFrom, walkTo) : null;
    apply(local);

    // The online route resolves later; by then the map may have been torn down (boarding a fare,
    // switching city). Hold this map's own signal and drop the answer if the map isn't live.
    const signal = abortRef.current?.signal;
    const path = seated ? await routeDrive(net, from, snapped, signal) : await routeWalk(g, from, snapped, signal);
    if (signal?.aborted || mapRef.current !== map || destSeq.current !== seq) return;
    if (apply(path)) return;
    if (!routeRef.current) {
      useGame.setState({ toast: "No street that way." });
      window.setTimeout(() => useGame.setState({ toast: null }), 1400);
    }
  }

  function followRoute(dt: number, maxSpeed: number): boolean {
    const route = routeRef.current;
    if (!route || route.length < 2) return false;
    const total = pathLength(route);
    if (total < 4) {
      const end = route[route.length - 1]!;
      const curb = graphRef.current ? nearest(graphRef.current, end.lat, end.lng, 40) : null;
      const offStreet = !curb || curb.dist > 16;
      // Off the street (an online route's last step, a door hop): fine, unless it's a freeway or ramp.
      const rest =
        routeMode.current === "drive" || !graphRef.current
          ? end
          : offStreet
            ? offFreeway(graphRef.current, end)
            : clearCorner(graphRef.current, end.lat, end.lng);
      pos.current.lat = rest.lat;
      pos.current.lng = rest.lng;
      pos.current.speed = 0;
      endLeg();
      return true;
    }

    const expected = pointAlongPath(route, routeAlong.current);
    const off = distM(pos.current.lat, pos.current.lng, expected.lat, expected.lng);
    if (off > 24) {
      const info = closestOnPath(route, pos.current.lat, pos.current.lng, routeAlong.current);
      if (info.dist < 90 && info.along + 20 >= routeAlong.current) {
        routeAlong.current = info.along;
      } else {
        stuckFor.current += dt;
      }
    }

    const remaining = total - routeAlong.current;
    if (remaining < 6) {
      const end = route[route.length - 1]!;
      const curb = graphRef.current ? nearest(graphRef.current, end.lat, end.lng, 40) : null;
      const offStreet = !curb || curb.dist > 16;
      // Off the street (an online route's last step, a door hop): fine, unless it's a freeway or ramp.
      const rest =
        routeMode.current === "drive" || !graphRef.current
          ? end
          : offStreet
            ? offFreeway(graphRef.current, end)
            : clearCorner(graphRef.current, end.lat, end.lng);
      pos.current.lat = rest.lat;
      pos.current.lng = rest.lng;
      pos.current.speed = 0;
      endLeg();
      return true;
    }

    pos.current.speed += (maxSpeed - pos.current.speed) * Math.min(1, dt * 4.2);
    const advance = Math.max(0, pos.current.speed) * dt;
    const prevAlong = routeAlong.current;
    routeAlong.current = Math.min(routeAlong.current + advance, total);
    const next = pointAlongPath(route, routeAlong.current);
    const look = pointAlongPath(route, Math.min(routeAlong.current + 14, total));
    pos.current.yaw = yawToTarget(pos.current.lat, pos.current.lng, 0, look.lat, look.lng);
    pos.current.lat = next.lat;
    pos.current.lng = next.lng;

    if (advance > 0.35 && routeAlong.current <= prevAlong + 0.08 && remaining > 10) {
      stuckFor.current += dt;
    } else if (off <= 24) {
      stuckFor.current = Math.max(0, stuckFor.current - dt * 2);
    }

    if (stuckFor.current > 0.35) {
      stuckFor.current = 0;
      skips.current += 1;
      if (routeMode.current === "drive") {
        if (skips.current >= 2) {
          clearRoute();
          flash("No road that way.");
        }
        return true;
      }
      const wp = waypoint.current;
      if (wp) {
        const left = distM(pos.current.lat, pos.current.lng, wp.lat, wp.lng);
        const nudge = stuckNudge(pos.current, wp, canCutBuildings(useGame.getState().scout));
        const hop = nudge && !hopTouchesFreeway(graphRef.current, pos.current, nudge) ? nudge : null;
        if (hop) {
          pos.current.lat = hop.lat;
          pos.current.lng = hop.lng;
          routeAlong.current = Math.min(routeAlong.current + Math.min(18, left), total - 1);
        } else if (skips.current <= 3) {
          const gNow = graphRef.current;
          const reachable = !gNow || canCutBuildings(useGame.getState().scout) || nearest(gNow, wp.lat, wp.lng, WALK_REACH_M);
          if (!reachable) {
            clearRoute();
            flash("No street that way.");
          } else replanStuck(wp);
        }
      }
    }
    return true;
  }

  function rebuildPins(L: LModule, map: LMap) {
    drawnPins.current = -1; // battery: fresh pin elements need their "near" class again
    offscreenIO?.disconnect();
    const st = useGame.getState();
    const city = CITIES[st.cityId];
    const now = Date.now();
    for (const m of vaultMarkers.current.values()) m.remove();
    vaultMarkers.current.clear();
    for (const poi of livePois(city, st.blanks)) {
      const v = st.vaults[poi.id];
      const cooling = Boolean(v && v.state === "cooling" && v.coolUntil > now);
      const desk = isFareDesk(poi);
      const shop = isScoutShop(poi);
      const counter = isCounter(poi);
      const board = isBoard(poi);
      const lit = desk && st.fares > 0;
      const el = shop
        ? `<div class="shop-pin" title="${poi.name}"><span class="shop-awning"></span><span class="shop-body"><i class="shop-window"></i><i class="shop-door"></i></span></div>`
        : counter
          ? counterPinHtml(poi.name)
          : board
            ? isQuestBoard(poi)
              ? questPinHtml(poi.name, questAlert(st.goals))
              : boardPinHtml(poi.name)
            : desk
              ? stationPinHtml({ cooling, fare: lit })
              : vaultPinHtml(poi, { cooling });
      const marker = L.marker([poi.lat, poi.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: shop ? [46, 70] : counter ? [48, 64] : board ? [34, 70] : desk ? [30, 72] : [20, 50], iconAnchor: shop ? [23, 68] : counter ? [24, 62] : board ? [17, 68] : desk ? [15, 70] : [10, 28] }),
        keyboard: false,
        zIndexOffset: shop ? 520 : lit ? 460 : counter || board ? 400 : desk ? 280 : 200,
      }).addTo(map);
      marker.on("click", () => {
        const nowSt = useGame.getState();
        const d = distM(pos.current.lat, pos.current.lng, poi.lat, poi.lng);
        if (desk && nowSt.fares > 0 && d <= reach() && !nowSt.hud.seated) {
          setBoardOpen(true);
          return;
        }
        tryOpen(poi.id);
      });
      vaultMarkers.current.set(poi.id, marker);
    }
    const run = st.run;
    if (run && run.readyAt === 0) {
      const el = seriesPinHtml(SERIES.run);
      const marker = L.marker([run.lat, run.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: [24, 52], iconAnchor: [12, 30] }),
        keyboard: false,
        zIndexOffset: 420,
      }).addTo(map);
      marker.on("click", () => tryOpen(RUN_ID));
      vaultMarkers.current.set(RUN_ID, marker);
    }
    const stack = st.stack;
    if (stack && stack.readyAt === 0) {
      const el = seriesPinHtml(SERIES.stack);
      const marker = L.marker([stack.lat, stack.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: [28, 64], iconAnchor: [14, 62] }),
        keyboard: false,
        zIndexOffset: 430,
      }).addTo(map);
      marker.on("click", () => tryOpen(STACK_ID));
      vaultMarkers.current.set(STACK_ID, marker);
    }
    const climb = st.climb;
    if (climb && climb.readyAt === 0) {
      const el = seriesPinHtml(SERIES.climb);
      const marker = L.marker([climb.lat, climb.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: [34, 56], iconAnchor: [17, 54] }),
        keyboard: false,
        zIndexOffset: 410,
      }).addTo(map);
      marker.on("click", () => tryOpen(CLIMB_ID));
      vaultMarkers.current.set(CLIMB_ID, marker);
    }
    for (const m of keyMarkers.current.values()) m.remove();
    keyMarkers.current.clear();
    for (const k of st.mapKeys) {
      const marker = L.marker([k.lat, k.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="match-pin tier-${k.tier}" title="${k.tier} match"><i class="match-head"></i><i class="match-stick"></i></div>`,
          iconSize: [20, 42],
          iconAnchor: [10, 21],
        }),
        keyboard: false,
        zIndexOffset: 300,
      }).addTo(map);
      keyMarkers.current.set(k.id, marker);
      marker.on("click", () => tryCollect(k.id));
    }
  }

  function tryOpen(poiId: string) {
    const st = useGame.getState();
    const run = st.run;
    const poi =
      poiId === RUN_ID && run && run.readyAt === 0
        ? { lat: run.lat, lng: run.lng }
        : poiId === STACK_ID && st.stack && st.stack.readyAt === 0
          ? { lat: st.stack.lat, lng: st.stack.lng }
          : poiId === CLIMB_ID && st.climb && st.climb.readyAt === 0
          ? { lat: st.climb.lat, lng: st.climb.lng }
          : anyPois(CITIES[st.cityId], st.blanks).find((p) => p.id === poiId);
    if (!poi) return;
    const d = distM(pos.current.lat, pos.current.lng, poi.lat, poi.lng);
    if (d > reach() || !lampFromRide(ride())) {
      planWalk(poi.lat, poi.lng, true);
      return;
    }
    const err = st.tryOpen(poiId, performance.now());
    if (err) useGame.setState({ toast: err });
  }

  function tryCollect(keyId: string) {
    const k = useGame.getState().mapKeys.find((x) => x.id === keyId);
    if (!k) return;
    if (!lampFromRide(ride())) {
      flash("Park at the curb. Matches are on foot.", 1800);
      void setDestination(k.lat, k.lng);
      return;
    }
    if (!canGrabMatch(graphRef.current, pos.current, k, reachMult(useGame.getState().scout))) {
      planWalk(k.lat, k.lng, false, k.id);
      return;
    }
    useGame.getState().collectKey(k.id);
    noteCollected(k.id);
    const g = graphRef.current;
    const L = Lref.current;
    const map = mapRef.current;
    if (g) snapKeys(g);
    if (L && map) rebuildPins(L, map);
  }

  /** 0.1.13: pan back to the player and keep following (the map stops following once you drag it). */
  function centerOnMe() {
    follow.current = true;
    mapRef.current?.panTo([pos.current.lat, pos.current.lng], { animate: true, duration: 0.35 });
  }

  function interactNearest() {
    const id = useGame.getState().hud.nearestId;
    if (id) tryOpen(id);
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (useGame.getState().blitzOpen) return;
      if (useGame.getState().openVault) {
        if (e.code === "Escape") {
          useGame.getState().closeVault();
          e.preventDefault();
        }
        return;
      }
      if (useGame.getState().shopOpen || useGame.getState().errandOpen) {
        if (e.code === "Escape") {
          useGame.getState().closeShop();
          e.preventDefault();
        }
        return;
      }
      if (e.repeat && (e.code === "KeyE" || e.code === "Space")) return;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "KeyW", "KeyA", "KeyS", "KeyD"].includes(e.code)) {
        e.preventDefault();
      }
      keysHeld.current.add(e.code);
      if (e.code === "KeyE" || e.code === "Space") interactNearest();
      if (e.code === "KeyF") {
        const s = useGame.getState();
        if (!s.openVault && !s.hqOpen && !s.invOpen && !s.shopOpen && !s.errandOpen) toggleCab();
      }
      if (e.code === "KeyT") {
        const s = useGame.getState();
        if (s.openVault || s.hqOpen || s.invOpen || s.shopOpen || s.errandOpen) return;
        if (s.hud.seated) {
          flash("Park at the curb. The door is on foot.");
          return;
        }
        const city = CITIES[s.cityId];
        const desks = city.pois.filter(isFareDesk);
        const here = desks.find((p) => distM(pos.current.lat, pos.current.lng, p.lat, p.lng) <= reach());
        if (!here) {
          const desk = fareDesk(city);
          flash(`Walk to ${desk.name}. Board the train there.`);
          void setDestination(desk.lat, desk.lng);
          return;
        }
        setBoardOpen((v) => !v);
      }
      if (e.code === "KeyC") centerOnMe();
      if (e.code === "KeyI") {
        if (!useGame.getState().openVault) useGame.getState().toggleInv();
      }
      if (e.code === "Tab") {
        e.preventDefault();
        useGame.getState().toggleHq();
      }
      if (e.code === "Escape") {
        // 0.0.90: Esc closes an open panel first; with nothing open it cancels the whole route.
        const s = useGame.getState();
        const panel = s.hqOpen || s.invOpen || s.guideOpen;
        s.toggleHq(false);
        s.toggleInv(false);
        setBoardOpen(false);
        if (!panel) clearRoute();
      }
      unlockAudio();
    };
    const up = (e: KeyboardEvent) => keysHeld.current.delete(e.code);
    const blur = () => keysHeld.current.clear();
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", blur);
    playRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__controlsTest = {
      getYaw: () => pos.current.yaw,
      getSpeed: () => pos.current.speed,
      getPos: () => ({ lat: pos.current.lat, lng: pos.current.lng }),
      setYaw: (yaw: number) => {
        pos.current.yaw = yaw;
      },
      setKeys: (codes: string[]) => {
        injected.current = codes.length ? codes : null;
      },
      goTo: (lat: number, lng: number) => {
        void setDestination(lat, lng);
      },
      hasRoute: () => Boolean(routeRef.current && routeRef.current.length >= 2),
      getAlong: () => routeAlong.current,
      getCache: () => (cacheRef.current ? { lat: cacheRef.current.lat, lng: cacheRef.current.lng } : null),
    };
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      // Battery: standing still with nothing in motion, run the loop at ~30 fps (breathing idle, flicker timers and
      // HUD checks look the same); any input, route, hail or leftover speed keeps the full rate.
      if (
        t - last.current < 30 &&
        !injected.current &&
        keysHeld.current.size === 0 &&
        Math.hypot(stick.current.x, stick.current.y) <= 0.12 &&
        !routeRef.current &&
        !waypoint.current &&
        queue.current.length === 0 &&
        !cabRef.current?.hail &&
        pos.current.speed === 0
      )
        return;
      const prev = last.current || t;
      last.current = t;
      const dt = Math.min(MAX_DT, (t - prev) / 1000);
      const st = useGame.getState();
      if (st.blitzOpen || st.openVault || st.hqOpen || st.invOpen || st.errandOpen || st.screen !== "play") return;

      const held = new Set(injected.current ?? keysHeld.current);
      const seated = Boolean(cabRef.current?.seated);
      let steer = 0;
      let throttle = 0;
      let east = 0;
      let north = 0;
      if (held.has("KeyD") || held.has("ArrowRight")) east += 1;
      if (held.has("KeyA") || held.has("ArrowLeft")) east -= 1;
      if (held.has("KeyW") || held.has("ArrowUp")) north += 1;
      if (held.has("KeyS") || held.has("ArrowDown")) north -= 1;
      const sx = stick.current.x;
      const sy = stick.current.y;
      const sm = Math.hypot(sx, sy);
      if (sm > 0.12) {
        east += sx;
        north -= sy;
      }

      if (seated) {
        if (held.has("KeyA") || held.has("ArrowLeft")) steer += 1;
        if (held.has("KeyD") || held.has("ArrowRight")) steer -= 1;
        if (held.has("KeyW") || held.has("ArrowUp")) throttle += 1;
        if (held.has("KeyS") || held.has("ArrowDown")) throttle -= 1;
        if (sm > 0.12) {
          const desired = Math.atan2(-sx, -sy);
          const d = wrapPi(desired - pos.current.yaw);
          steer += Math.max(-1, Math.min(1, d * 1.6));
          throttle += sm;
        }
      } else {
        const mag = Math.hypot(east, north);
        if (mag > 0.12) {
          pos.current.yaw = Math.atan2(-east, north);
          throttle = Math.min(1, mag);
        }
      }

      const driving =
        held.has("KeyW") ||
        held.has("KeyA") ||
        held.has("KeyS") ||
        held.has("KeyD") ||
        held.has("ArrowUp") ||
        held.has("ArrowLeft") ||
        held.has("ArrowDown") ||
        held.has("ArrowRight");
      const manual = Boolean(injected.current) || driving || sm > 0.12;
      if (manual && (routeRef.current || queue.current.length > 0 || routeHold.current)) clearRoute();
      const auto = Boolean(routeRef.current && routeRef.current.length >= 2);

      steer = Math.max(-1, Math.min(1, steer));
      throttle = Math.max(-1, Math.min(1, throttle));
      const driveG = driveRef.current;
      const arterial = seated && onArterial(driveG, pos.current.lat, pos.current.lng);
      const max = seated ? cabSpeed(arterial) * ownPace() : walkSpeed(useGame.getState().scout);
      const rail = seated ? driveG : graphRef.current;
      const foot = graphRef.current;
      const turn = seated ? TURN_CAB : TURN;
      const prevLat = pos.current.lat;
      const prevLng = pos.current.lng;

      const hail = cabRef.current?.hail;
      if (hail && cabRef.current && !seated) {
        const cab = cabRef.current;
        const total = pathLength(hail);
        const pace = cabSpeed(onArterial(driveG, cab.lat, cab.lng));
        cab.hailAlong = Math.min(cab.hailAlong + pace * dt, total);
        const next = pointAlongPath(hail, cab.hailAlong);
        const look = pointAlongPath(hail, Math.min(cab.hailAlong + 16, total));
        cab.yaw = yawToTarget(cab.lat, cab.lng, 0, look.lat, look.lng);
        cab.lat = next.lat;
        cab.lng = next.lng;
        if (cab.hailAlong >= total - 4) {
          cab.hail = null;
          flash("Cab's at the curb.");
        }
        paintCab();
      }

      if (auto && followRoute(dt, max)) {
        if (routeMode.current !== "drive" && skips.current >= 4 && waypoint.current) {
          skips.current = 0;
          replanStuck(waypoint.current);
        }
      } else {
        const want = throttle * max;
        pos.current.speed += (want - pos.current.speed) * Math.min(1, dt * 4.2);
        if (want === 0 && Math.abs(pos.current.speed) < 0.01) pos.current.speed = 0; // battery: settle instead of decaying forever
        const speedFactor = Math.min(1, Math.abs(pos.current.speed) / 40);
        const reverse = pos.current.speed >= 0 ? 1 : -1;
        pos.current.yaw = wrapPi(pos.current.yaw + steer * turn * Math.max(0.35, speedFactor) * reverse * dt);

        const dist = pos.current.speed * dt;
        if (Math.abs(dist) > 0.04) {
          if (rail && rail.segs.length) {
            const movedTo = constrainStep(rail, pos.current.lat, pos.current.lng, pos.current.yaw, dist, !seated);
            pos.current.lat = movedTo.lat;
            pos.current.lng = movedTo.lng;
          } else if (!seated) {
            const step = dest(
              pos.current.lat,
              pos.current.lng,
              Math.cos(pos.current.yaw) * dist,
              -Math.sin(pos.current.yaw) * dist,
            );
            pos.current.lat = step.lat;
            pos.current.lng = step.lng;
          }
        }
      }
      if (seated && cabRef.current) {
        cabRef.current.lat = pos.current.lat;
        cabRef.current.lng = pos.current.lng;
        cabRef.current.yaw = pos.current.yaw;
      }
      const box = wardRef.current;
      if (box && !inWard(box, pos.current.lat, pos.current.lng)) {
        const held = seated ? clampWard(box, pos.current.lat, pos.current.lng) : offFreeway(foot, clampWard(box, pos.current.lat, pos.current.lng));
        pos.current.lat = held.lat;
        pos.current.lng = held.lng;
        pos.current.speed = 0;
        if (auto) {
          routeRef.current = null;
          routeLine.current?.remove();
          routeLine.current = null;
          if (queue.current.length > 0) {
            // The live leg left the ward. Keep the stops still waiting.
            legKey.current = null;
            legDoor.current = false;
            flash("That stop is outside the ward.");
            endLeg();
          } else clearRoute();
        }
        bumpFence();
      }
      const stepped = distM(prevLat, prevLng, pos.current.lat, pos.current.lng);
      if (!seated && stepped > 0.2) distAcc.current += stepped;
      if (t - lastKeyCheck.current > 1000) {
        lastKeyCheck.current = t;
        st.maybeSpawnKey(Date.now());
        st.maybeSpawnRun(Date.now());
        // 0.0.93: walk onto the day's match cache to open it.
        const c = cacheRef.current;
        if (c?.seed) {
          // The walk graph can land after the cache was placed; snap it onto a quiet street once it does.
          const q = quietDrop(c.seed);
          if (q.lat !== c.seed.lat || q.lng !== c.seed.lng) {
            c.lat = q.lat;
            c.lng = q.lng;
            c.seed = null;
            c.marker.setLatLng([q.lat, q.lng]);
          }
        }
        // 0.0.96: the cache shows within CACHE_SEE_M; the Owl (Night eyes) sees it from anywhere.
        if (c) {
          const el = (c.marker as unknown as { getElement?: () => HTMLElement | undefined }).getElement?.();
          const seen = cacheAnywhere(st.scout) || distM(pos.current.lat, pos.current.lng, c.lat, c.lng) <= CACHE_SEE_M;
          if (el) el.style.display = seen ? "" : "none";
        }
        if (c && distM(pos.current.lat, pos.current.lng, c.lat, c.lng) <= CACHE_GRAB_M) {
          cacheRef.current = null;
          c.marker.remove();
          st.claimCache();
        }
      }

      if (
        waypoint.current &&
        !routeRef.current &&
        !routeHold.current &&
        rail &&
        rail.segs.length &&
        t - lastRouteTry.current > 900
      ) {
        lastRouteTry.current = t;
        const wp = waypoint.current;
        const local = routeOnGraph(rail, { lat: pos.current.lat, lng: pos.current.lng }, wp);
        if (local && local.length >= 2) {
          routeRef.current = local;
          routeAlong.current = closestOnPath(local, pos.current.lat, pos.current.lng).along;
          stuckFor.current = 0;
          const L = Lref.current;
          const map = mapRef.current;
          if (L && map) drawRoute(L, map, local);
        }
      }

      if (
        foot &&
        t - lastExpand.current > 1400 + expandFails.current * 4000 &&
        !expandBusy.current &&
        !graphCovers(foot, pos.current.lat, pos.current.lng, 500)
      ) {
        expandBusy.current = true;
        lastExpand.current = t;
        void expandGraph(foot, pos.current.lat, pos.current.lng, 2000, abortRef.current?.signal)
          .then(() => {
            expandFails.current = 0;
          })
          .catch(() => {
            expandFails.current = Math.min(6, expandFails.current + 1);
          })
          .finally(() => {
            expandBusy.current = false;
          });
      }
      if (driveG && seated && !graphCovers(driveG, pos.current.lat, pos.current.lng, 500) && !expandBusy.current) {
        expandBusy.current = true;
        void expandGraph(driveG, pos.current.lat, pos.current.lng, 2000, abortRef.current?.signal, true).finally(() => {
          expandBusy.current = false;
        });
      }

      const city = CITIES[st.cityId];
      let nearestPoi = { id: "", d: Infinity, lat: pos.current.lat, lng: pos.current.lng };
      for (const p of livePois(city, st.blanks)) {
        const d = distM(pos.current.lat, pos.current.lng, p.lat, p.lng);
        if (d < nearestPoi.d) nearestPoi = { id: p.id, d, lat: p.lat, lng: p.lng };
      }
      if (st.run && st.run.readyAt === 0) {
        const d = distM(pos.current.lat, pos.current.lng, st.run.lat, st.run.lng);
        if (d < nearestPoi.d) nearestPoi = { id: RUN_ID, d, lat: st.run.lat, lng: st.run.lng };
      }
      if (st.stack && st.stack.readyAt === 0) {
        const d = distM(pos.current.lat, pos.current.lng, st.stack.lat, st.stack.lng);
        if (d < nearestPoi.d) nearestPoi = { id: STACK_ID, d, lat: st.stack.lat, lng: st.stack.lng };
      }
      if (st.climb && st.climb.readyAt === 0) {
        const d = distM(pos.current.lat, pos.current.lng, st.climb.lat, st.climb.lng);
        if (d < nearestPoi.d) nearestPoi = { id: CLIMB_ID, d, lat: st.climb.lat, lng: st.climb.lng };
      }
      for (const k of st.mapKeys) {
        // 0.1.35: your own car picks matches up from the window as you drive past; the city cab still doesn't.
        if (!lampFromRide(ride())) break;
        if (canGrabMatch(foot, pos.current, k, reachMult(st.scout))) {
          st.collectKey(k.id);
          noteCollected(k.id);
          const L = Lref.current;
          const map = mapRef.current;
          if (foot) snapKeys(foot);
          if (L && map) rebuildPins(L, map);
          break;
        }
      }

      const night = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t / 180000));
      if (nightRef.current) nightRef.current.style.opacity = String(night * 0.45);

      const moving = stepped / Math.max(dt, 1e-3) > 8;
      anim.current.acc += dt;
      // 0.0.87: a v2 scout may walk at a quicker cadence (the Corgi's short legs); idle timing is shared
      // 0.0.90: the step rate follows the walk pace (0.11 s a frame at the old 92).
      const frameDt = moving ? (0.11 * 92) / WALK_PACE / (V2_SCOUTS.has(st.scout) ? (V2_CADENCE[st.scout] ?? 1) : 1) : 0.34;
      if (anim.current.acc > frameDt) {
        anim.current.acc = 0;
        anim.current.frame = (anim.current.frame + 1) % 4;
        anim.current.loop = (anim.current.loop + 1) % 8; // v2 sheets: the front idle is 8 frames long
      }
      const row = walkRow(pos.current.yaw);
      const pawn = playerMarker.current?.getElement()?.querySelector(".pawn") as HTMLElement | null;
      const el = (pawn?.querySelector(".scout-marker") ??
        playerMarker.current?.getElement()?.querySelector(".scout-marker")) as HTMLElement | null;
      if (el) {
        el.dataset.scout = st.scout;
        if (st.quests.worn) el.dataset.cloth = st.quests.worn;
        else el.removeAttribute("data-cloth");
        setCoat(el, wornLook(st.paints.wornCoat, st.wardrobe.coat));
        // 0.0.83: redrawn scouts use one 8x6 sheet (8-frame strides) — same stride time, twice the frames.
        const v2 = V2_SCOUTS.has(st.scout);
        const tick = (v2 ? anim.current.loop : anim.current.frame) + Math.min(1, anim.current.acc / frameDt);
        const cell = v2
          ? { sheet: !moving && (row === 1 || row === 2) ? "idle-side" : moving ? "walk" : "idle", position: v2Cell(moving, row, tick).position }
          : spriteCell(moving, row, anim.current.frame);
        if (v2) el.dataset.art = "v2";
        else if (el.hasAttribute("data-art")) el.removeAttribute("data-art");
        el.classList.toggle("is-idle", !moving);
        el.classList.toggle("is-side", cell.sheet === "idle-side");
        el.classList.toggle("is-seated", seated);
        if (!seated) el.style.backgroundPosition = cell.position;
        // 0.0.81 art polish: facing, plus a step phase synced to the sheet frame, read by CSS for the bob,
        // lean, breathing and ground shadow (see "0.0.81 art polish" in styles.css).
        el.dataset.face = faceFromYaw(pos.current.yaw);
        const phase = tick / 4;
        const stride = moving ? Math.abs(Math.sin(phase * Math.PI * 2)) : 0;
        const breath = moving ? 0 : 0.5 + 0.5 * Math.sin(t / 520);
        pawn?.style.setProperty("--step", stride.toFixed(3));
        pawn?.style.setProperty("--breath", breath.toFixed(3));
      }
      const cabEl = pawn?.querySelector(".cab-sprite") as HTMLElement | null;
      if (cabEl && seated) {
        cabEl.dataset.face = faceFromYaw(pos.current.yaw);
        cabEl.classList.toggle("is-lamps", moving);
      }
      pawn?.classList.toggle("is-seated", seated);
      // Battery: only touch Leaflet when the scout actually moved (or follow was just switched back on).
      const movedPx = pos.current.lat !== drawn.current.lat || pos.current.lng !== drawn.current.lng;
      if (movedPx) playerMarker.current?.setLatLng([pos.current.lat, pos.current.lng]);
      if (follow.current && mapRef.current && (movedPx || !drawn.current.pan)) {
        mapRef.current.panTo([pos.current.lat, pos.current.lng], { animate: false });
      }
      drawn.current.lat = pos.current.lat;
      drawn.current.lng = pos.current.lng;
      drawn.current.pan = follow.current;

      const nearId = nearestPoi.d < 140 ? nearestPoi.id : "";
      if (nearId !== drawn.current.near || vaultMarkers.current.size !== drawnPins.current) {
        drawn.current.near = nearId;
        drawnPins.current = vaultMarkers.current.size;
        vaultMarkers.current.forEach((m, id) => {
          const node = m.getElement()?.querySelector(".vault-pin, .shop-pin, .counter-pin, .board-pin");
          node?.classList.toggle("near", id === nearId);
          if (node) pinObserver().observe(node);
        });
      }

      if (Math.floor(t / 100) !== Math.floor((t - dt * 1000) / 100)) {
        if (distAcc.current && !seated) {
          st.addDistance(distAcc.current);
          distAcc.current = 0;
        } else if (seated) {
          distAcc.current = 0;
        }
        // The Giraffe (0.0.51) sees over the rooftops: places get their atlas name from a little farther off.
        const reachM = interactRadius() * (SCOUTS[st.scout]?.perk.sight ?? 1);
        const fresh: string[] = [];
        if (!seated) {
          for (const p of livePois(city, st.blanks)) {
            if (st.atlas[p.id]) continue;
            if (distM(pos.current.lat, pos.current.lng, p.lat, p.lng) <= reachM) fresh.push(p.id);
          }
          if (fresh.length) st.stampPlaces(fresh);
        }
        // 0.1.8: on foot at the car lot's door → the Showroom button.
        const door = dealerDoor.current;
        const nearDealer = Boolean(door && !seated && distM(pos.current.lat, pos.current.lng, door.lat, door.lng) <= DEALER_REACH_M);
        if (nearDealer !== st.dealerNear) st.setDealerNear(nearDealer);
        const hd = houseDoor.current;
        const nearHouse = Boolean(hd && !seated && distM(pos.current.lat, pos.current.lng, hd.lat, hd.lng) <= HOUSE_REACH_M);
        if (nearHouse !== st.houseNear) st.setHouseNear(nearHouse);
        useDaily.getState().check({ lat: pos.current.lat, lng: pos.current.lng }, seated, (lat, lng) => {
          const g = graphRef.current;
          const c = g ? nearest(g, lat, lng, DAILY_CURB_MAX_M) : null;
          return c ? { lat: c.lat, lng: c.lng } : null;
        });
        const desk = fareDesk(city);
        let aimLat = nearestPoi.lat;
        let aimLng = nearestPoi.lng;
        if (st.fares > 0) {
          aimLat = desk.lat;
          aimLng = desk.lng;
        } else if (waypoint.current) {
          aimLat = waypoint.current.lat;
          aimLng = waypoint.current.lng;
        }
        const aimYaw = yawToTarget(pos.current.lat, pos.current.lng, pos.current.yaw, aimLat, aimLng);
        st.setHud({
          nearestId: nearestPoi.id || null,
          nearestDist: nearestPoi.d,
          speed: pos.current.speed,
          yaw: pos.current.yaw,
          stamina: pos.current.stamina,
          night,
          seated,
          ownCar: seated && Boolean(cabRef.current?.own),
          deskName: desk.name,
          deskDist: distM(pos.current.lat, pos.current.lng, desk.lat, desk.lng),
          aimDeg: (-aimYaw * 180) / Math.PI,
          routeStops: (waypoint.current ? 1 : 0) + queue.current.length,
          routeHold: routeHold.current,
        });
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cityId]);

  useEffect(() => {
    const unsub = useGame.subscribe((s, p) => {
      if (s.scout !== p.scout || s.quests.worn !== p.quests.worn || s.wardrobe.coat !== p.wardrobe.coat || s.paints.wornCoat !== p.paints.wornCoat || s.printWorn !== p.printWorn) {
        const el = playerMarker.current?.getElement()?.querySelector(".scout-marker") as HTMLElement | null;
        if (el) el.dataset.scout = s.scout;
        const coat = wornLook(s.paints.wornCoat, s.wardrobe.coat);
        if (el) setCoat(el, coat);
        warmSheets(s.scout, coat);
        if (el && s.quests.worn) el.dataset.cloth = s.quests.worn;
        else el?.removeAttribute("data-cloth");
        if (s.scout !== p.scout) startBed(s.scout);
      }
      if (p.openVault && !s.openVault && routeHold.current) {
        routeHold.current = false;
        legDoor.current = false;
        endLeg();
      }
      // 0.0.90: earning a train ticket no longer auto-routes to the station (players were marched off mid-play).
      // The HUD "Train · Walk to …" pill and T still route there on a deliberate tap.
      if (s.routeCancel !== p.routeCancel) clearRoute();
      if (s.unstuck !== p.unstuck) {
        // 0.0.90 "I'm stuck": what a reload does to the walker — out of the cab, no route, no held keys, back at the start.
        exitCab();
        clearRoute();
        keysHeld.current.clear();
        stick.current = { x: 0, y: 0 };
        follow.current = true;
        const city = CITIES[s.cityId];
        const start = city.start ?? city.spawn;
        const g = graphRef.current;
        pos.current.lat = start.lat;
        pos.current.lng = start.lng;
        if (g) placeOnStreet(g, start.lat, start.lng);
        pos.current.speed = 0;
        playerMarker.current?.setLatLng([pos.current.lat, pos.current.lng]);
        mapRef.current?.setView([pos.current.lat, pos.current.lng], mapRef.current.getZoom());
        useGame.getState().setHud({ seated: false });
      }
      if (s.mapKeys !== p.mapKeys || s.vaults !== p.vaults || s.run !== p.run || s.stack !== p.stack || s.climb !== p.climb || s.fares !== p.fares) {
        const g = graphRef.current;
        if (g && (s.mapKeys !== p.mapKeys || s.run !== p.run || s.stack !== p.stack || s.climb !== p.climb)) snapKeys(g);
        const L = Lref.current;
        const map = mapRef.current;
        if (L && map) rebuildPins(L, map);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const id = window.setInterval(paintMarket, 5_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    paintDaily();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyShow, dailyLit, streets, cityId]);

  function retryStreets() {
    const city = CITIES[cityId];
    setStreets("loading");
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    void bootstrapStreets(city.id, city.spawn.lat, city.spawn.lng, city.pois, abort.signal)
      .then((g) => {
        graphRef.current = g;
        bindWalkGraph(g, city.start ?? city.spawn);
        placeOnStreet(g, pos.current.lat, pos.current.lng);
        snapKeys(g);
        setStreets("ready");
        paintMarket(); // 0.1.6: the lit roads need the street graph
        paintDealer(g); // 0.1.8: and the car lot door snaps onto it
        paintHouse(g); // 0.1.12: and the house lot
        void fillSurroundings(g, city.spawn.lat, city.spawn.lng, city.pois, abort.signal).then(() => {
          snapKeys(g);
          fillWardLamps(g);
        });
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setStreets("error");
      });
    void bootstrapDrive(city.spawn.lat, city.spawn.lng, city.pois, abort.signal, city.id).then((dg) => {
      driveRef.current = dg;
      void fillSurroundings(dg, city.spawn.lat, city.spawn.lng, city.pois, abort.signal, true);
    });
  }

  // 0.0.95: the match cache marker: a brass-banded wooden crate with a lit match on the lid and a warm glow.
const CACHE_PIN_HTML =
  '<div class="cache-pin" data-testid="cache-pin" title="Match cache">' +
  '<svg viewBox="0 0 46 50" width="46" height="50" aria-hidden="true">' +
  '<ellipse cx="23" cy="44" rx="15" ry="3.5" fill="rgba(0,0,0,.45)"/>' +
  '<path d="M6 20h34v20a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#7a4a24" stroke="#3b2210" stroke-width="1.5"/>' +
  '<path d="M6 25h34M6 31h34M6 37h34" stroke="#5c3518" stroke-width="1"/>' +
  '<path d="M4 15h38v6H4z" fill="#8f5a2c" stroke="#3b2210" stroke-width="1.5"/>' +
  '<path d="M11 15v28M35 15v28" stroke="#d9a441" stroke-width="3.2"/>' +
  '<path d="M11 15v28M35 15v28" stroke="#fff1b8" stroke-width="0.8" opacity=".7"/>' +
  '<circle cx="11" cy="24" r="1.2" fill="#3b2210"/><circle cx="35" cy="24" r="1.2" fill="#3b2210"/>' +
  '<circle cx="11" cy="36" r="1.2" fill="#3b2210"/><circle cx="35" cy="36" r="1.2" fill="#3b2210"/>' +
  '<rect x="19" y="26" width="8" height="9" rx="1.5" fill="#d9a441" stroke="#3b2210" stroke-width="1"/>' +
  '<circle cx="23" cy="30" r="1.3" fill="#3b2210"/>' +
  '<g class="cache-match"><path d="M23 14V4.5" stroke="#e8d3a8" stroke-width="2.4" stroke-linecap="round"/>' +
  '<ellipse cx="23" cy="4" rx="2.4" ry="3" fill="#c0392b"/>' +
  '<path class="cache-flame" d="M23 -4c2.6 2.6 3 5 0 7.4c-3-2.4-2.6-4.8 0-7.4z" fill="#ffcf4a"/></g>' +
  "</svg></div>";

// 0.0.93: the day's match cache, the Quest Board's "!" and the first-play arrow to it.
  useEffect(() => {
    if (streets !== "ready") return;
    const L = Lref.current;
    const map = mapRef.current;
    if (!L || !map) return;
    const city = CITIES[cityId];
    const day = new Date().toISOString().slice(0, 10);
    if (useGame.getState().cacheDay !== day) {
      const seed = cacheSeed(cityId, day, city.start ?? city.spawn);
      const at = quietDrop(seed);
      const marker = L.marker([at.lat, at.lng], {
        icon: L.divIcon({ className: "", html: CACHE_PIN_HTML, iconSize: [46, 50], iconAnchor: [23, 40] }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 450,
      }).addTo(map);
      cacheRef.current = { lat: at.lat, lng: at.lng, seed: at.lat === seed.lat && at.lng === seed.lng ? seed : null, marker };
    }
    const qb = city.pois.find((p) => isQuestBoard(p));
    if (qb && !useGame.getState().questVisited) {
      arrowRef.current = L.marker([qb.lat, qb.lng], {
        icon: L.divIcon({ className: "", html: '<div class="quest-arrow" data-testid="quest-arrow">Quest Board<b>▼</b></div>', iconSize: [120, 44], iconAnchor: [60, 112] }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 900,
      }).addTo(map);
    }
    const paint = (on: boolean) => document.querySelectorAll("[data-quest]").forEach((el) => el.classList.toggle("is-alert", on));
    paint(questAlert(useGame.getState().goals));
    const unsub = useGame.subscribe((s, p) => {
      if (s.goals !== p.goals) paint(questAlert(s.goals));
      if (s.questWalk !== p.questWalk && qb) void setDestination(qb.lat, qb.lng, true);
      if (s.questVisited && arrowRef.current) {
        arrowRef.current.remove();
        arrowRef.current = null;
      }
    });
    return () => {
      unsub();
      cacheRef.current?.marker.remove();
      cacheRef.current = null;
      arrowRef.current?.remove();
      arrowRef.current = null;
    };
  }, [streets, cityId]);

  return (
    <div
      ref={playRef}
      className="relative isolate h-dvh w-full overflow-hidden bg-bg outline-none"
      tabIndex={0}
      onPointerDown={() => {
        playRef.current?.focus();
        unlockAudio();
        startBed(useGame.getState().scout);
      }}
    >
      <div ref={hostRef} className="absolute inset-0 touch-none" />
      <div ref={nightRef} className="night-veil bg-bg" />
      <SkyLayer />
      <Hud
        onVector={(x, y) => {
          stick.current = { x, y };
          if (x || y) follow.current = true;
        }}
        onInteract={interactNearest}
        onCab={toggleCab}
        onMarket={walkToMarket}
        onRoute={() => {
          if (routeHold.current) {
            routeHold.current = false;
            legDoor.current = false;
            endLeg();
            return;
          }
          clearRoute();
        }}
        onDesk={() => {
          const s = useGame.getState();
          if (s.hud.seated) {
            flash("Park at the curb. The door is on foot.");
            return;
          }
          const desk = fareDesk(CITIES[s.cityId]);
          const d = distM(pos.current.lat, pos.current.lng, desk.lat, desk.lng);
          if (d <= reach() && s.fares > 0) {
            setBoardOpen(true);
            return;
          }
          void setDestination(desk.lat, desk.lng);
          flash(`Trains board at ${desk.name}.`);
        }}
        onTimetable={() => {
          const s = useGame.getState();
          if (s.hud.seated) {
            flash("Park at the curb. The door is on foot.");
            return;
          }
          setBoardOpen(true);
        }}
      />
      <LootToast />
      <FriendTickets />
      <GiftNote />
      <DailyBlitz />
      <DailyPop />
      <MysteryWheel />
      <VaultModal />
      <Satchel />
      <HqPanel />
      <ScoutShop />
      <Showroom />
      <HouseSheet />
      <WardCounter />
      <NoticeBoard />
      <Fireworks />
      <DailyRunPanel
        onWalk={(lat, lng) => {
          void setDestination(lat, lng, true);
        }}
      />
      <DailyFinishCard />
      {boardOpen ? (
        <Timetable
          onClose={() => setBoardOpen(false)}
          onPunch={(id) => {
            const st = useGame.getState();
            const city = CITIES[st.cityId];
            const atDesk = city.pois.some(
              (p) => isFareDesk(p) && distM(pos.current.lat, pos.current.lng, p.lat, p.lng) <= reach(),
            );
            if (!atDesk) {
              const desk = fareDesk(city);
              flash(`Walk to ${desk.name}. Board the train there.`);
              setBoardOpen(false);
              void setDestination(desk.lat, desk.lng);
              return;
            }
            const err = st.boardFare(id);
            if (err) flash(err);
            else setBoardOpen(false);
          }}
        />
      ) : null}
      {streets !== "ready" ? (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-[700] flex justify-center px-4">
          <div className="panel pointer-events-auto max-w-sm px-4 py-3">
            {streets === "loading" ? (
              <p className="text-sm text-fg-muted">Charting streets and paths. {scoutName} stays on the grid.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-fg-muted">Couldn't read the street map. Retry, and {scoutName} stays on the roads.</p>
                <button type="button" className="btn btn-primary" onClick={retryStreets}>
                  Retry streets
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Tutorial />
      )}
      <FieldGuide />
    </div>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getPos?: () => { lat: number; lng: number };
      setYaw?: (yaw: number) => void;
      setKeys?: (codes: string[]) => void;
      goTo?: (lat: number, lng: number) => void;
      hasRoute?: () => boolean;
      getAlong?: () => number;
      getCache?: () => { lat: number; lng: number } | null;
    };
  }
}
