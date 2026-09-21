import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Marker, Polygon, Polyline } from "leaflet";
import { CITIES, RUN_ID, SCOUTS, STACK_ID, allPois, cabSpeed, interactRadius, isScoutShop, walkSpeed } from "@/game/data";
import { dest, distM, wrapPi, yawToTarget } from "@/game/geo";
import { reach, useGame } from "@/game/store";
import { startBed, unlockAudio } from "@/game/audio";
import {
  bindWalkGraph,
  bootstrapDrive,
  bootstrapStreets,
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
  pullToStreet,
  randomOnStreet,
  routeDrive,
  routeOnGraph,
  routeWalk,
  scatterStreetLamps,
  spreadOnGraph,
  type Pt,
  type StreetGraph,
} from "@/game/streets";
import { fareDesk, isFareDesk } from "@/game/ticket";
import { clampWard, inWard, wardFrom, wardRing, type Ward } from "@/game/ward";
import { Hud } from "./Hud";
import { VaultModal } from "./VaultModal";
import { HqPanel } from "./HqPanel";
import { ScoutShop } from "./ScoutShop";
import { LootToast } from "./LootToast";
import { Satchel } from "./Satchel";
import { Fireworks } from "./Fireworks";
import { Timetable } from "./Timetable";
import { Tutorial } from "./Tutorial";

type LModule = typeof import("leaflet");

const TURN = 2.8;
const TURN_CAB = 1.8;
const MAX_DT = 0.1;
const CAB_REACH = 28;

type CabFace = "down" | "left" | "right" | "up";

function faceFromYaw(yaw: number): CabFace {
  const deg = ((yaw * 180) / Math.PI + 360) % 360;
  if (deg >= 45 && deg < 135) return "left";
  if (deg >= 135 && deg < 225) return "down";
  if (deg >= 225 && deg < 315) return "right";
  return "up";
}

function cabMarkup(face: CabFace, lamps: boolean) {
  return `<div class="cab-sprite${lamps ? " is-lamps" : ""}" data-face="${face}"><i class="cab-lamp a"></i><i class="cab-lamp b"></i><i class="cab-cone"></i></div>`;
}

type Cab = {
  lat: number;
  lng: number;
  yaw: number;
  seated: boolean;
  hail: Pt[] | null;
  hailAlong: number;
};

export function GameMap() {
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
  const lastRouteTry = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const expandBusy = useRef(false);
  const lastExpand = useRef(0);
  const lastKeyCheck = useRef(0);
  const expandFails = useRef(0);
  const pos = useRef({ lat: 0, lng: 0, yaw: 0, speed: 0, stamina: 1 });
  const keysHeld = useRef(new Set<string>());
  const injected = useRef<string[] | null>(null);
  const stick = useRef({ x: 0, y: 0 });
  const waypoint = useRef<{ lat: number; lng: number } | null>(null);
  const follow = useRef(true);
  const anim = useRef({ frame: 0, acc: 0 });
  const last = useRef(0);
  const nightRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<HTMLDivElement>(null);
  const distAcc = useRef(0);
  const snapping = useRef(false);
  const wardRef = useRef<Ward | null>(null);
  const shadeRef = useRef<Polygon | null>(null);
  const lastFence = useRef(0);
  const cityId = useGame((s) => s.cityId);
  const [streets, setStreets] = useState<"loading" | "ready" | "error">("loading");
  const [boardOpen, setBoardOpen] = useState(false);

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
    const curb = g ? pullToStreet(g, side.lat, side.lng, 40) : side;
    pos.current.lat = curb.lat;
    pos.current.lng = curb.lng;
    pos.current.speed = 0;
    routeMode.current = "walk";
    seatHud(false);
  }

  function enterCab() {
    const cab = cabRef.current;
    if (!cab || cab.seated) return;
    pos.current.lat = cab.lat;
    pos.current.lng = cab.lng;
    pos.current.yaw = cab.yaw;
    pos.current.speed = 0;
    cab.seated = true;
    cab.hail = null;
    routeMode.current = "drive";
    seatHud(true);
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
      flash("No road that way.");
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

  function clearRoute() {
    routeRef.current = null;
    routeAlong.current = 0;
    stuckFor.current = 0;
    skips.current = 0;
    routeLine.current?.remove();
    routeLine.current = null;
    waypoint.current = null;
    waypointMarker.current?.remove();
    waypointMarker.current = null;
    useGame.getState().setHud({ waypoint: null });
  }

  function drawRoute(L: LModule, map: LMap, path: Pt[]) {
    routeLine.current?.remove();
    routeLine.current = L.polyline(
      path.map((p) => [p.lat, p.lng] as [number, number]),
      { color: strokeColor(), weight: 4, opacity: 0.88, className: "route-line", interactive: false },
    ).addTo(map);
  }

  function snapKeys(g: StreetGraph) {
    if (snapping.current) return;
    const keys = useGame.getState().mapKeys;
    const w = wardRef.current;
    let changed = false;
    const next = keys.map((k) => {
      let p = onStreet(g, k.lat, k.lng);
      if (w && !inWard(w, p.lat, p.lng)) {
        p = randomOnStreet(g, { lat: pos.current.lat, lng: pos.current.lng }, 40, 640);
        const held = clampWard(w, p.lat, p.lng);
        p = onStreet(g, held.lat, held.lng);
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
  }

  function placeOnStreet(g: StreetGraph, lat: number, lng: number) {
    const p = pullToStreet(g, lat, lng, 140);
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
      const extra = spreadOnGraph(g, [...avoid, ...keys], 2, 240);
      const run =
        now.run && now.run.readyAt === 0 && extra[0]
          ? { ...now.run, lat: extra[0].lat, lng: extra[0].lng }
          : now.run;
      const stack =
        now.stack && now.stack.readyAt === 0 && extra[1]
          ? { ...now.stack, lat: extra[1].lat, lng: extra[1].lng }
          : now.stack;
      now.spreadDrops(keys, run, stack);
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
    const dock = land ? fareDesk(city) : city.spawn;
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
        zoomSnap: 0.25,
        minZoom: 15,
        maxZoom: 19,
      }).setView([dock.lat, dock.lng], 16);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
        className: "atlas-tiles",
      }).addTo(map);

      mapRef.current = map;
      paintWard(L, map);
      map.on("dragstart", () => {
        follow.current = false;
      });
      map.on("click", (e) => {
        const t = e.originalEvent.target as HTMLElement | null;
        if (t?.closest(".vault-pin, .match-pin, .leaflet-control")) return;
        void setDestination(e.latlng.lat, e.latlng.lng);
      });

      const icon = L.divIcon({
        className: "",
        html: `<div class="pawn"><div class="scout-marker is-idle" data-scout="${useGame.getState().scout}" data-row="0" data-col="0"></div>${cabMarkup("down", false).replace("<div ", "<div hidden ")}</div>`,
        iconSize: [56, 56],
        iconAnchor: [28, 48],
      });
      playerMarker.current = L.marker([dock.lat, dock.lng], {
        icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 800,
      }).addTo(map);

      rebuildPins(L, map);
    });

    void bootstrapStreets(city.id, dock.lat, dock.lng, city.pois, abort.signal)
      .then((g) => {
        if (cancelled) return;
        graphRef.current = g;
        bindWalkGraph(g);
        placeOnStreet(g, pos.current.lat, pos.current.lng);
        snapKeys(g);
        setStreets("ready");
        const L = Lref.current;
        const m = mapRef.current;
        if (L && m) rebuildPins(L, m);
        void fillSurroundings(g, dock.lat, dock.lng, city.pois, abort.signal).then(() => {
          if (cancelled) return;
          snapKeys(g);
          fillWardLamps(g);
        });
      })
      .catch(() => {
        if (cancelled || abort.signal.aborted) return;
        setStreets("error");
      });

    void bootstrapDrive(dock.lat, dock.lng, city.pois, abort.signal).then((dg) => {
      if (cancelled) return;
      driveRef.current = dg;
      void fillSurroundings(dg, dock.lat, dock.lng, city.pois, abort.signal, true);
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
      vaultMarkers.current.clear();
      keyMarkers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  function placeWaypoint(L: LModule, map: LMap, lat: number, lng: number) {
    waypointMarker.current?.remove();
    waypointMarker.current = L.marker([lat, lng], {
      icon: L.divIcon({
        className: "",
        html: `<div class="waypoint-dot"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      }),
      interactive: false,
      keyboard: false,
    }).addTo(map);
  }

  async function setDestination(lat: number, lng: number) {
    follow.current = true;
    const L = Lref.current;
    const map = mapRef.current;
    const g = graphRef.current;
    const w = wardRef.current;
    let target = { lat, lng };
    if (w && !inWard(w, lat, lng)) {
      target = clampWard(w, lat, lng);
      bumpFence();
    }
    const seated = Boolean(cabRef.current?.seated);
    const net = seated ? driveRef.current : g;
    const snappedRaw = net ? pullToStreet(net, target.lat, target.lng, seated ? 120 : 220) : target;
    const snapped = w ? clampWard(w, snappedRaw.lat, snappedRaw.lng) : snappedRaw;
    if (seated && distM(snapped.lat, snapped.lng, target.lat, target.lng) > 140) {
      flash("No road that way.");
      return;
    }
    waypoint.current = target;
    routeAlong.current = 0;
    stuckFor.current = 0;
    skips.current = 0;
    routeMode.current = seated ? "drive" : "walk";
    if (L && map) placeWaypoint(L, map, target.lat, target.lng);
    useGame.getState().setHud({ waypoint: target });

    const from = { lat: pos.current.lat, lng: pos.current.lng };
    const apply = (raw: Pt[] | null) => {
      const path = seated ? raw : finishPath(raw, from, target);
      if (!path || path.length < 2) return false;
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

    const local = net ? routeOnGraph(net, from, seated ? snapped : target) : null;
    apply(local);

    const path = seated
      ? await routeDrive(net, from, snapped, abortRef.current?.signal)
      : await routeWalk(g, from, snapped, abortRef.current?.signal);
    if (waypoint.current !== target) return;
    if (apply(path)) return;
    if (!routeRef.current) {
      if (abortRef.current?.signal.aborted) return;
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
      pos.current.lat = end.lat;
      pos.current.lng = end.lng;
      pos.current.speed = 0;
      const wasDrive = routeMode.current === "drive" && cabRef.current?.seated;
      clearRoute();
      if (wasDrive) {
        exitCab();
        flash("Parked. The door is on foot.", 1800);
      }
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
      pos.current.lat = end.lat;
      pos.current.lng = end.lng;
      pos.current.speed = 0;
      const wasDrive = routeMode.current === "drive" && cabRef.current?.seated;
      clearRoute();
      if (wasDrive) {
        exitCab();
        flash("Parked. The door is on foot.", 1800);
      }
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
        if (left < 80) {
          const hop = Math.min(18, left);
          const n = ((wp.lat - pos.current.lat) * 111_320) / (left || 1);
          const e =
            ((wp.lng - pos.current.lng) * 111_320 * Math.cos((pos.current.lat * Math.PI) / 180)) / (left || 1);
          const next = dest(pos.current.lat, pos.current.lng, n * hop, e * hop);
          pos.current.lat = next.lat;
          pos.current.lng = next.lng;
          routeAlong.current = Math.min(routeAlong.current + hop, total - 1);
        } else if (skips.current <= 3) {
          void setDestination(wp.lat, wp.lng);
        }
      }
    }
    return true;
  }

  function rebuildPins(L: LModule, map: LMap) {
    const st = useGame.getState();
    const city = CITIES[st.cityId];
    const now = Date.now();
    for (const m of vaultMarkers.current.values()) m.remove();
    vaultMarkers.current.clear();
    for (const poi of allPois(city, st.blanks)) {
      const v = st.vaults[poi.id];
      const cooling = Boolean(v && v.state === "cooling" && v.coolUntil > now);
      const desk = isFareDesk(poi);
      const shop = isScoutShop(poi);
      const lit = desk && st.fares > 0;
      const el = shop
        ? `<div class="shop-pin" title="${poi.name}"><span class="shop-awning"></span><span class="shop-body"><i class="shop-window"></i><i class="shop-door"></i></span></div>`
        : `<div class="vault-pin tier-${poi.tier}${cooling ? " cooling" : ""}${desk ? " is-desk" : ""}${lit ? " is-fare" : ""}"><span class="lantern"><i class="lantern-cap"></i><i class="lantern-frame"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span>${desk ? `<i class="fare-stub"></i>` : ""}</div>`;
      const marker = L.marker([poi.lat, poi.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: shop ? [36, 42] : [32, 48], iconAnchor: shop ? [18, 40] : [16, 46] }),
        keyboard: false,
        zIndexOffset: shop ? 520 : lit ? 460 : desk ? 280 : 200,
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
      const el = `<div class="vault-pin is-run tier-amber"><span class="lantern"><i class="lantern-cap"></i><i class="lantern-frame"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span></div>`;
      const marker = L.marker([run.lat, run.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: [38, 56], iconAnchor: [19, 54] }),
        keyboard: false,
        zIndexOffset: 420,
      }).addTo(map);
      marker.on("click", () => tryOpen(RUN_ID));
      vaultMarkers.current.set(RUN_ID, marker);
    }
    const stack = st.stack;
    if (stack && stack.readyAt === 0) {
      const el = `<div class="vault-pin is-stack tier-green"><span class="stack-lamp"><i class="lantern-cap"></i><i class="stack-globe a"><i class="lantern-glass"></i></i><i class="stack-globe b"><i class="lantern-glass"></i></i><i class="lantern-post"></i></span></div>`;
      const marker = L.marker([stack.lat, stack.lng], {
        icon: L.divIcon({ className: "", html: el, iconSize: [28, 64], iconAnchor: [14, 62] }),
        keyboard: false,
        zIndexOffset: 430,
      }).addTo(map);
      marker.on("click", () => tryOpen(STACK_ID));
      vaultMarkers.current.set(STACK_ID, marker);
    }
    for (const m of keyMarkers.current.values()) m.remove();
    keyMarkers.current.clear();
    for (const k of st.mapKeys) {
      const marker = L.marker([k.lat, k.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="match-pin tier-${k.tier}" title="${k.tier} match"><i class="match-head"></i><i class="match-stick"></i></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        }),
        keyboard: false,
        zIndexOffset: 300,
      }).addTo(map);
      keyMarkers.current.set(k.id, marker);
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
          : CITIES[st.cityId].pois.find((p) => p.id === poiId);
    if (!poi) return;
    const d = distM(pos.current.lat, pos.current.lng, poi.lat, poi.lng);
    if (d > reach() || cabRef.current?.seated) {
      if (cabRef.current?.seated) flash("Park at the curb. The door is on foot.", 1800);
      void setDestination(poi.lat, poi.lng);
      return;
    }
    const err = st.tryOpen(poiId, performance.now());
    if (err) useGame.setState({ toast: err });
  }

  function interactNearest() {
    const id = useGame.getState().hud.nearestId;
    if (id) tryOpen(id);
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (useGame.getState().openVault) {
        if (e.code === "Escape") {
          useGame.getState().closeVault();
          e.preventDefault();
        }
        return;
      }
      if (useGame.getState().shopOpen) {
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
        if (!s.openVault && !s.hqOpen && !s.invOpen && !s.shopOpen) toggleCab();
      }
      if (e.code === "KeyT") {
        const s = useGame.getState();
        if (s.openVault || s.hqOpen || s.invOpen || s.shopOpen) return;
        if (s.hud.seated) {
          flash("Park at the curb. The door is on foot.");
          return;
        }
        const city = CITIES[s.cityId];
        const desks = city.pois.filter(isFareDesk);
        const here = desks.find((p) => distM(pos.current.lat, pos.current.lng, p.lat, p.lng) <= reach());
        if (!here) {
          const desk = fareDesk(city);
          flash(`Walk to ${desk.name}. Punch a fare there.`);
          void setDestination(desk.lat, desk.lng);
          return;
        }
        setBoardOpen((v) => !v);
      }
      if (e.code === "KeyI") {
        if (!useGame.getState().openVault) useGame.getState().toggleInv();
      }
      if (e.code === "Tab") {
        e.preventDefault();
        useGame.getState().toggleHq();
      }
      if (e.code === "Escape") {
        useGame.getState().toggleHq(false);
        useGame.getState().toggleInv(false);
        useGame.getState().closeVault();
        setBoardOpen(false);
        clearRoute();
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
    };
    return () => {
      delete window.__controlsTest;
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const step = (t: number) => {
      raf = requestAnimationFrame(step);
      const prev = last.current || t;
      last.current = t;
      const dt = Math.min(MAX_DT, (t - prev) / 1000);
      const st = useGame.getState();
      if (st.openVault || st.hqOpen || st.invOpen || st.screen !== "play") return;

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
      if (manual && routeRef.current) clearRoute();
      const auto = Boolean(routeRef.current && routeRef.current.length >= 2);

      steer = Math.max(-1, Math.min(1, steer));
      throttle = Math.max(-1, Math.min(1, throttle));
      const worn = SCOUTS[st.scout];
      const gait = (worn?.gait ?? 1) * (worn?.perk.pace ?? 1);
      const driveG = driveRef.current;
      const sprintHeld = held.has("ShiftLeft") || held.has("ShiftRight");
      const sprinting = !seated && sprintHeld && pos.current.stamina > 0.08 && (throttle > 0 || auto);
      const hasSprinter = st.equipped === "sprinter";
      if (!seated) {
        if (sprinting) pos.current.stamina = Math.max(0, pos.current.stamina - dt * (hasSprinter ? 0.16 : 0.28) * (SCOUTS[st.scout]?.perk.stamina ?? 1));
        else pos.current.stamina = Math.min(1, pos.current.stamina + dt * (hasSprinter ? 0.32 : 0.22));
      }
      const arterial = seated && onArterial(driveG, pos.current.lat, pos.current.lng);
      const max = seated ? cabSpeed(arterial, gait) : walkSpeed(sprinting, gait);
      const rail = seated ? driveG : graphRef.current;
      const foot = graphRef.current;
      const turn = seated ? TURN_CAB : TURN;
      const prevLat = pos.current.lat;
      const prevLng = pos.current.lng;

      const hail = cabRef.current?.hail;
      if (hail && cabRef.current && !seated) {
        const cab = cabRef.current;
        const total = pathLength(hail);
        const pace = cabSpeed(onArterial(driveG, cab.lat, cab.lng), gait);
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
          const wp = waypoint.current;
          void setDestination(wp.lat, wp.lng);
        }
      } else {
        const want = throttle * max;
        pos.current.speed += (want - pos.current.speed) * Math.min(1, dt * 4.2);
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
        const held = clampWard(box, pos.current.lat, pos.current.lng);
        pos.current.lat = held.lat;
        pos.current.lng = held.lng;
        pos.current.speed = 0;
        if (auto) clearRoute();
        bumpFence();
      }
      const stepped = distM(prevLat, prevLng, pos.current.lat, pos.current.lng);
      if (!seated && stepped > 0.2) distAcc.current += stepped;
      if (t - lastKeyCheck.current > 1000) {
        lastKeyCheck.current = t;
        st.maybeSpawnKey(Date.now());
        st.maybeSpawnRun(Date.now());
      }

      if (
        waypoint.current &&
        !routeRef.current &&
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
      for (const p of allPois(city, st.blanks)) {
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
      for (const k of st.mapKeys) {
        if (seated) break;
        const d = distM(pos.current.lat, pos.current.lng, k.lat, k.lng);
        if (d < 22) {
          st.collectKey(k.id);
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
      const frameDt = moving ? 0.11 / Math.max(0.7, gait) : 0.34;
      if (anim.current.acc > frameDt) {
        anim.current.acc = 0;
        anim.current.frame = (anim.current.frame + 1) % 4;
      }
      const deg = ((pos.current.yaw * 180) / Math.PI + 360) % 360;
      let row = 3;
      if (deg >= 45 && deg < 135) row = 1;
      else if (deg >= 135 && deg < 225) row = 0;
      else if (deg >= 225 && deg < 315) row = 2;
      const pawn = playerMarker.current?.getElement()?.querySelector(".pawn") as HTMLElement | null;
      const el = (pawn?.querySelector(".scout-marker") ??
        playerMarker.current?.getElement()?.querySelector(".scout-marker")) as HTMLElement | null;
      if (el) {
        el.dataset.scout = st.scout;
        el.classList.toggle("is-idle", !moving);
        el.classList.toggle("is-seated", seated);
        if (!seated) {
          const col = anim.current.frame;
          el.style.backgroundPosition = moving
            ? `${col * 33.333}% ${row * 33.333}%`
            : `${(col % 2) * 100}% ${Math.floor(col / 2) * 100}%`;
        }
      }
      const cabEl = pawn?.querySelector(".cab-sprite") as HTMLElement | null;
      if (cabEl && seated) {
        cabEl.dataset.face = faceFromYaw(pos.current.yaw);
        cabEl.classList.toggle("is-lamps", moving);
      }
      pawn?.classList.toggle("is-seated", seated);
      playerMarker.current?.setLatLng([pos.current.lat, pos.current.lng]);
      if (follow.current && mapRef.current) {
        mapRef.current.panTo([pos.current.lat, pos.current.lng], { animate: false });
      }

      vaultMarkers.current.forEach((m, id) => {
        const node = m.getElement()?.querySelector(".vault-pin, .shop-pin");
        node?.classList.toggle("near", id === nearestPoi.id && nearestPoi.d < 140);
      });

      if (Math.floor(t / 100) !== Math.floor((t - dt * 1000) / 100)) {
        if (distAcc.current && !seated) {
          st.addDistance(distAcc.current);
          distAcc.current = 0;
        } else if (seated) {
          distAcc.current = 0;
        }
        const reachM = interactRadius(st.equipped === "lantern");
        const fresh: string[] = [];
        if (!seated) {
          for (const p of allPois(city, st.blanks)) {
            if (st.atlas[p.id]) continue;
            if (distM(pos.current.lat, pos.current.lng, p.lat, p.lng) <= reachM) fresh.push(p.id);
          }
          if (fresh.length) st.stampPlaces(fresh);
        }
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
          deskName: desk.name,
          deskDist: distM(pos.current.lat, pos.current.lng, desk.lat, desk.lng),
          aimDeg: (-aimYaw * 180) / Math.PI,
        });
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cityId]);

  useEffect(() => {
    const unsub = useGame.subscribe((s, p) => {
      if (s.scout !== p.scout) {
        const el = playerMarker.current?.getElement()?.querySelector(".scout-marker") as HTMLElement | null;
        if (el) el.dataset.scout = s.scout;
        startBed(s.scout);
      }
      if (s.fares > p.fares) {
        const desk = fareDesk(CITIES[s.cityId]);
        void setDestination(desk.lat, desk.lng);
      }
      if (s.mapKeys !== p.mapKeys || s.vaults !== p.vaults || s.run !== p.run || s.stack !== p.stack || s.fares !== p.fares) {
        const g = graphRef.current;
        if (g && (s.mapKeys !== p.mapKeys || s.run !== p.run || s.stack !== p.stack)) snapKeys(g);
        const L = Lref.current;
        const map = mapRef.current;
        if (L && map) rebuildPins(L, map);
      }
    });
    return unsub;
  }, []);

  function retryStreets() {
    const city = CITIES[cityId];
    setStreets("loading");
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;
    void bootstrapStreets(city.id, city.spawn.lat, city.spawn.lng, city.pois, abort.signal)
      .then((g) => {
        graphRef.current = g;
        bindWalkGraph(g);
        placeOnStreet(g, pos.current.lat, pos.current.lng);
        snapKeys(g);
        setStreets("ready");
        void fillSurroundings(g, city.spawn.lat, city.spawn.lng, city.pois, abort.signal).then(() => {
          snapKeys(g);
          fillWardLamps(g);
        });
      })
      .catch(() => {
        if (abort.signal.aborted) return;
        setStreets("error");
      });
    void bootstrapDrive(city.spawn.lat, city.spawn.lng, city.pois, abort.signal).then((dg) => {
      driveRef.current = dg;
      void fillSurroundings(dg, city.spawn.lat, city.spawn.lng, city.pois, abort.signal, true);
    });
  }

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
      <Hud
        onVector={(x, y) => {
          stick.current = { x, y };
          if (x || y) follow.current = true;
        }}
        onInteract={interactNearest}
        onCab={toggleCab}
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
          flash(`${desk.name} punches fares.`);
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
      <VaultModal />
      <Satchel />
      <HqPanel />
      <ScoutShop />
      <Fireworks />
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
              flash(`Walk to ${desk.name}. Punch a fare there.`);
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
              <p className="text-sm text-fg-muted">Charting streets and paths. The raccoon stays on the grid.</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-fg-muted">Couldn't read the street map. Retry to keep the raccoon on roads.</p>
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
    };
  }
}
