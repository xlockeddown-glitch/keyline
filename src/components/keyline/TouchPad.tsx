import { useRef, useState, type CSSProperties } from "react";

type Props = {
  onVector: (x: number, y: number) => void;
  stamina: number;
};

export function TouchPad({ onVector, stamina }: Props) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });

  function setFrom(cx: number, cy: number, x: number, y: number) {
    const dx = x - cx;
    const dy = y - cy;
    const m = Math.hypot(dx, dy) || 1;
    const mag = Math.min(1, m / 46);
    const nx = (dx / m) * mag;
    const ny = (dy / m) * mag;
    setKnob({ x: nx * 22, y: ny * 22 });
    onVector(nx, ny);
  }

  function release() {
    origin.current = null;
    setKnob({ x: 0, y: 0 });
    onVector(0, 0);
  }

  return (
    <div
      className="stick pointer-events-auto"
      style={
        {
          "--pace": String(Math.max(0, Math.min(1, stamina))),
          "--kx": `${knob.x}px`,
          "--ky": `${knob.y}px`,
        } as CSSProperties
      }
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        origin.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        setFrom(origin.current.x, origin.current.y, e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!origin.current) return;
        setFrom(origin.current.x, origin.current.y, e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      aria-label="Walk"
    >
      <span className="pace-ring" aria-hidden />
      <span className="stick-knob" aria-hidden />
    </div>
  );
}