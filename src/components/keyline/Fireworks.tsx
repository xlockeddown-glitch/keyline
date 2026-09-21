import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
  g: number;
  b: number;
  size: number;
  drag: number;
  gravity: number;
};

type Rocket = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuse: number;
  r: number;
  g: number;
  b: number;
  power: number;
  willow: boolean;
};

const PALETTE = {
  gold: [196, 163, 90] as const,
  cream: [237, 232, 223] as const,
  copper: [196, 92, 74] as const,
  blue: [126, 160, 184] as const,
  green: [127, 157, 122] as const,
  violet: [139, 132, 152] as const,
};

const MINI_COLORS = [PALETTE.gold, PALETTE.cream, PALETTE.copper];
const GRAND_COLORS = [PALETTE.gold, PALETTE.cream, PALETTE.copper, PALETTE.blue, PALETTE.green, PALETTE.violet];

function pick<T>(list: readonly T[]) {
  return list[(Math.random() * list.length) | 0]!;
}

export function Fireworks() {
  const show = useGame((s) => s.fireworks);
  const clear = useGame((s) => s.clearFireworks);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!show) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gfx = canvas.getContext("2d");
    if (!gfx) return;
    const surface = canvas;
    const ctx = gfx;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const grand = show.kind === "grand";
    const duration = reduce ? 4200 : grand ? 14000 : 5600;
    const started = performance.now();
    const sparks: Spark[] = [];
    const rockets: Rocket[] = [];
    let launches = 0;
    const maxLaunch = reduce ? (grand ? 6 : 3) : grand ? 34 : 8;
    let lastLaunch = 0;
    let raf = 0;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      surface.width = Math.floor(w * dpr);
      surface.height = Math.floor(h * dpr);
      surface.style.width = `${w}px`;
      surface.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function burst(x: number, y: number, color: readonly [number, number, number], power: number, willow: boolean) {
      const n = reduce ? 18 : willow ? 70 : grand ? 86 : 48;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n + Math.random() * 0.2;
        const sp = power * (0.45 + Math.random() * 0.7);
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp * 0.85,
          life: willow ? 1.6 + Math.random() * 0.8 : 0.85 + Math.random() * 0.45,
          max: willow ? 2.2 : 1.3,
          r: color[0],
          g: color[1],
          b: color[2],
          size: willow ? 1.6 : 2.3 + Math.random() * 1.8,
          drag: willow ? 0.988 : 0.982,
          gravity: willow ? 90 : 160,
        });
      }
      if (grand && !reduce) {
        for (let i = 0; i < 10; i++) {
          sparks.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 40,
            vy: (Math.random() - 0.5) * 40,
            life: 0.35,
            max: 0.4,
            r: 255,
            g: 248,
            b: 230,
            size: 3.2,
            drag: 0.96,
            gravity: 20,
          });
        }
      }
    }

    function launch(now: number) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const color = pick(grand ? GRAND_COLORS : MINI_COLORS);
      const x = w * (0.16 + Math.random() * 0.68);
      rockets.push({
        x,
        y: h + 8,
        vx: (w * 0.5 - x) * 0.22 + (Math.random() - 0.5) * 70,
        vy: -(grand ? 560 : 460) - Math.random() * 160,
        fuse: now + (grand ? 900 : 780) + Math.random() * 180,
        r: color[0],
        g: color[1],
        b: color[2],
        power: grand ? 340 + Math.random() * 120 : 240 + Math.random() * 80,
        willow: grand && Math.random() < 0.28,
      });
      launches += 1;
    }

    function frame(now: number) {
      const elapsed = now - started;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const dt = Math.min(0.033, 1 / 60);
      const finale = grand && elapsed > duration * 0.62 && elapsed < duration * 0.88;
      const cadence = reduce ? 420 : finale ? 140 : grand ? 280 : 480;
      if (launches < maxLaunch && now - lastLaunch > cadence && elapsed < duration * 0.78) {
        lastLaunch = now;
        launch(now);
        if (finale) launch(now);
      }

      for (let i = rockets.length - 1; i >= 0; i--) {
        const rk = rockets[i]!;
        rk.vy += 210 * dt;
        rk.x += rk.vx * dt;
        rk.y += rk.vy * dt;
        ctx.fillStyle = `rgba(${rk.r},${rk.g},${rk.b},0.9)`;
        ctx.beginPath();
        ctx.arc(rk.x, rk.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,244,214,0.45)`;
        ctx.beginPath();
        ctx.arc(rk.x, rk.y + 6, 1.2, 0, Math.PI * 2);
        ctx.fill();
        if (now >= rk.fuse || rk.vy > 40) {
          burst(rk.x, rk.y, [rk.r, rk.g, rk.b], rk.power, rk.willow);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]!;
        s.life -= dt;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        s.vx *= s.drag;
        s.vy = s.vy * s.drag + s.gravity * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        const a = Math.max(0, s.life / s.max);
        ctx.fillStyle = `rgba(${s.r},${s.g},${s.b},${0.15 + a * 0.85})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (0.4 + a), 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      if (elapsed < duration && (rockets.length || sparks.length || launches < maxLaunch)) {
        raf = requestAnimationFrame(frame);
      } else {
        clear();
      }
    }

    raf = requestAnimationFrame(frame);
    const failsafe = window.setTimeout(() => clear(), duration + 1200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      window.removeEventListener("resize", resize);
    };
  }, [show, clear]);

  if (!show) return null;
  const grand = show.kind === "grand";

  return (
    <div className="fireworks" aria-live="polite">
      <canvas ref={canvasRef} />
      <p className={`fireworks-kicker ${grand ? "is-grand" : ""}`}>
        <span className="kicker">{grand ? "A thousand in a row" : "A hundred in a row"}</span>
        <span className="font-display">{grand ? "The sky answers." : "The lanterns rise."}</span>
      </p>
    </div>
  );
}
