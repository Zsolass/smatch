// Layout of the 32 permanent teeth on an occlusal-view chart, as the dentist
// faces the patient: upper arch on top (incisors at the top), lower arch below,
// patient's right on the viewer's left.

import { ARCH_ORDER, getTooth, type Arch, type ToothType } from "./teeth";

export interface ToothGeometry {
  id: number;
  arch: Arch;
  type: ToothType;
  /** Centre of the tooth. */
  x: number;
  y: number;
  /** Rotation in degrees; local -y points to the lip/cheek side. */
  rotate: number;
  w: number;
  d: number;
  /** Position of the number label, outside the arch. */
  labelX: number;
  labelY: number;
}

const WIDTH: Record<number, number> = { 1: 30, 2: 25, 3: 27, 4: 26, 5: 25, 6: 36, 7: 34, 8: 31 };
const DEPTH: Record<ToothType, number> = { incisor: 0.78, canine: 0.98, premolar: 1.22, molar: 1.08 };
const GAP = 3.2;

const A = 172; // half width of the arch ellipse
const B = 162; // depth from the molar line to the incisors
const CX = 250;
const UPPER_Y = 232; // ellipse centre for the upper arch
const LOWER_Y = 288; // ellipse centre for the lower arch

function arcTable() {
  // Arc length along the ellipse from t = 0 (midline) to t, sampled finely.
  const steps = 4000;
  const tMax = Math.PI * 0.62;
  const ts: number[] = [0];
  const ss: number[] = [0];
  for (let i = 1; i <= steps; i++) {
    const t = (tMax * i) / steps;
    const tp = ts[i - 1]!;
    const ds = Math.hypot(A * (Math.sin(t) - Math.sin(tp)), B * (Math.cos(t) - Math.cos(tp)));
    ts.push(t);
    ss.push(ss[i - 1]! + ds);
  }
  return (s: number) => {
    let lo = 0, hi = ss.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (ss[mid]! < s) lo = mid + 1;
      else hi = mid;
    }
    return ts[lo]!;
  };
}

function layout(): ToothGeometry[] {
  const tAt = arcTable();
  const out: ToothGeometry[] = [];
  for (const arch of ["upper", "lower"] as Arch[]) {
    const order = ARCH_ORDER[arch];
    for (const id of order) {
      const tooth = getTooth(id);
      // Arc distance from the midline to this tooth's centre.
      let s = GAP / 2;
      for (let p = 1; p < tooth.position; p++) s += WIDTH[p]! + GAP;
      s += WIDTH[tooth.position]! / 2;
      const sign = tooth.side === "right" ? -1 : 1;
      const t = sign * tAt(s);
      const vy = arch === "upper" ? -1 : 1;
      const cy = arch === "upper" ? UPPER_Y : LOWER_Y;
      const x = CX + A * Math.sin(t);
      const y = cy + vy * B * Math.cos(t);
      let nx = Math.sin(t) / A, ny = (vy * Math.cos(t)) / B;
      const len = Math.hypot(nx, ny);
      nx /= len;
      ny /= len;
      const w = WIDTH[tooth.position]!;
      const d = w * DEPTH[tooth.type];
      const labelOffset = d / 2 + 14;
      out.push({
        id,
        arch,
        type: tooth.type,
        x,
        y,
        rotate: (Math.atan2(nx, -ny) * 180) / Math.PI,
        w,
        d,
        labelX: x + nx * labelOffset,
        labelY: y + ny * labelOffset,
      });
    }
  }
  return out;
}

export const TOOTH_GEOMETRY: ToothGeometry[] = layout();
export const GEOMETRY_BY_ID = new Map(TOOTH_GEOMETRY.map((g) => [g.id, g]));

export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function boundsOf(ids: number[], pad: number): ViewBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const id of ids) {
    const g = GEOMETRY_BY_ID.get(id)!;
    const r = Math.max(g.w, g.d) / 2 + 2;
    minX = Math.min(minX, g.x - r, g.labelX - 10);
    maxX = Math.max(maxX, g.x + r, g.labelX + 10);
    minY = Math.min(minY, g.y - r, g.labelY - 9);
    maxY = Math.max(maxY, g.y + r, g.labelY + 9);
  }
  return { x: minX - pad, y: minY - pad, w: maxX - minX + 2 * pad, h: maxY - minY + 2 * pad };
}

export type ChartView = "full" | "q1" | "q2" | "q3" | "q4";

const quadrant = (q: number) => TOOTH_GEOMETRY.filter((g) => Math.floor(g.id / 10) === q).map((g) => g.id);

export const VIEW_BOXES: Record<ChartView, ViewBox> = {
  full: boundsOf(TOOTH_GEOMETRY.map((g) => g.id), 34),
  q1: boundsOf(quadrant(1), 16),
  q2: boundsOf(quadrant(2), 16),
  q3: boundsOf(quadrant(3), 16),
  q4: boundsOf(quadrant(4), 16),
};

export const ARCH_CENTRE = { x: CX, upperY: UPPER_Y, lowerY: LOWER_Y };

/** Occlusal outline of a tooth in local coordinates (labial side toward -y). */
export function toothPath(type: ToothType, w: number, d: number): string {
  const hw = w / 2, hd = d / 2;
  switch (type) {
    case "incisor":
      return `M ${-hw} ${-hd * 0.45} C ${-hw * 0.7} ${-hd * 1.05}, ${hw * 0.7} ${-hd * 1.05}, ${hw} ${-hd * 0.45} C ${hw * 0.95} ${hd * 0.2}, ${hw * 0.45} ${hd}, 0 ${hd} C ${-hw * 0.45} ${hd}, ${-hw * 0.95} ${hd * 0.2}, ${-hw} ${-hd * 0.45} Z`;
    case "canine":
      return `M 0 ${-hd} C ${hw * 0.75} ${-hd * 0.95}, ${hw} ${-hd * 0.3}, ${hw * 0.92} ${hd * 0.15} C ${hw * 0.8} ${hd * 0.75}, ${hw * 0.35} ${hd}, 0 ${hd} C ${-hw * 0.35} ${hd}, ${-hw * 0.8} ${hd * 0.75}, ${-hw * 0.92} ${hd * 0.15} C ${-hw} ${-hd * 0.3}, ${-hw * 0.75} ${-hd * 0.95}, 0 ${-hd} Z`;
    case "premolar": {
      const r = hw * 0.85;
      return `M ${-hw} ${-hd + r} C ${-hw} ${-hd - r * 0.15}, ${hw} ${-hd - r * 0.15}, ${hw} ${-hd + r} L ${hw} ${hd - r} C ${hw} ${hd + r * 0.1}, ${-hw} ${hd + r * 0.1}, ${-hw} ${hd - r} Z`;
    }
    case "molar": {
      const r = hw * 0.42;
      return `M ${-hw + r} ${-hd} L ${hw - r} ${-hd} Q ${hw} ${-hd} ${hw} ${-hd + r} L ${hw * 0.96} ${hd - r} Q ${hw * 0.94} ${hd} ${hw - r} ${hd} L ${-hw + r} ${hd} Q ${-hw * 0.94} ${hd} ${-hw * 0.96} ${hd - r} L ${-hw} ${-hd + r} Q ${-hw} ${-hd} ${-hw + r} ${-hd} Z`;
    }
  }
}

/** Fissure detail lines drawn on top of the outline. */
export function fissurePath(type: ToothType, w: number, d: number): string {
  const hw = w / 2, hd = d / 2;
  switch (type) {
    case "incisor":
      return `M ${-hw * 0.6} ${-hd * 0.38} Q 0 ${-hd * 0.62} ${hw * 0.6} ${-hd * 0.38}`;
    case "canine":
      return `M ${-hw * 0.45} ${-hd * 0.05} Q 0 ${-hd * 0.55} ${hw * 0.45} ${-hd * 0.05}`;
    case "premolar":
      return `M ${-hw * 0.55} 0 Q 0 ${hd * 0.12} ${hw * 0.55} 0`;
    case "molar":
      return `M ${-hw * 0.6} ${-hd * 0.05} L ${-hw * 0.12} 0 L ${hw * 0.6} ${hd * 0.05} M ${-hw * 0.12} 0 L ${-hw * 0.18} ${-hd * 0.62} M ${hw * 0.15} ${hd * 0.02} L ${hw * 0.12} ${hd * 0.6}`;
  }
}
