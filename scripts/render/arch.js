// Dental arch layout and swept gingiva/model-base SDFs.
import { clamp, smin, smax } from "./sdf.js";
import { molar, premolar, anterior } from "./teeth.js";

// Mesio-distal widths (mm) for positions 1..7 from the midline.
export const UPPER = [
  { pos: 1, w: 8.6, make: () => anterior({ w: 4.2, h: 10.6 }) },
  { pos: 2, w: 6.8, make: () => anterior({ w: 3.25, d: 3.0, h: 9.2 }) },
  { pos: 3, w: 7.8, make: () => anterior({ canine: true }) },
  { pos: 4, w: 7.1, make: () => premolar() },
  { pos: 5, w: 6.8, make: () => premolar({ w: 3.3, h: 7.3 }) },
  { pos: 6, w: 10.4, make: () => molar() },
  { pos: 7, w: 9.4, make: () => molar({ w: 4.6, d: 5.0, h: 6.3, cusps: [[-1, 1, 0, 0.95], [1, 1, -0.25, 0.9], [-1, -1, -0.1, 1.0], [1, -1, -0.6, 0.8]] }) },
];

export function archCurve(k = 0.042) {
  // Parabolic arch, incisors at the front (+z), molars toward -z.
  const pts = [];
  for (let x = -40; x <= 40.0001; x += 0.1) pts.push([x, -k * x * x]);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const mid = s[Math.floor(pts.length / 2)];
  const at = (arc) => {
    // arc measured from the midline, negative = viewer's left
    const target = mid + arc;
    let i = 1;
    while (i < s.length - 1 && s[i] < target) i++;
    const t = (target - s[i - 1]) / (s[i] - s[i - 1]);
    const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t;
    const z = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t;
    const tx = pts[i][0] - pts[i - 1][0], tz = pts[i][1] - pts[i - 1][1];
    const len = Math.hypot(tx, tz);
    // outward normal (toward cheek/lip)
    return { x, z, tx: tx / len, tz: tz / len, nx: -tz / len, nz: tx / len };
  };
  return { pts, at, k };
}

export function layoutArch(curve, teeth = UPPER, gap = 0.15) {
  const placed = [];
  for (const side of [-1, 1]) {
    let arc = 0;
    for (const t of teeth) {
      const centre = arc + t.w / 2;
      const p = curve.at(side * centre);
      const { nx, nz } = p;
      placed.push({ ...t, side, arc: side * centre, x: p.x, z: p.z, nx, nz, angle: Math.atan2(nx, nz) });
      arc += t.w + gap;
    }
  }
  return placed;
}

// Precomputed 2D field: signed lateral offset from the arch line and arc position.
export function archField(curve, { range = 60, halfX = 42, zMin = -60, zMax = 14, cell = 0.15 } = {}) {
  const segs = [];
  for (let a = -range; a < range; a += 0.4) segs.push([curve.at(a), curve.at(Math.min(a + 0.4, range)), a]);
  const nx = Math.ceil((2 * halfX) / cell) + 1;
  const nz = Math.ceil((zMax - zMin) / cell) + 1;
  const off = new Float32Array(nx * nz);
  const arcs = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const px = -halfX + i * cell, pz = zMin + j * cell;
      let best = Infinity, bestArc = 0, bestSign = 1;
      for (const [a, b, arc0] of segs) {
        const vx = b.x - a.x, vz = b.z - a.z;
        const t = clamp(((px - a.x) * vx + (pz - a.z) * vz) / (vx * vx + vz * vz), 0, 1);
        const qx = a.x + vx * t, qz = a.z + vz * t;
        const dist = Math.hypot(px - qx, pz - qz);
        if (dist < best) {
          best = dist;
          bestArc = arc0 + 0.4 * t;
          // positive outside the arch (lip/cheek side)
          bestSign = vx * (pz - qz) - vz * (px - qx) > 0 ? 1 : -1;
        }
      }
      off[i + nx * j] = best * bestSign;
      arcs[i + nx * j] = bestArc;
    }
  const sample = (arr, x, z) => {
    const fx = clamp((x + halfX) / cell, 0, nx - 1.001), fz = clamp((z - zMin) / cell, 0, nz - 1.001);
    const i = Math.floor(fx), j = Math.floor(fz), tx = fx - i, tz = fz - j;
    const a = arr[i + nx * j], b = arr[i + 1 + nx * j], c = arr[i + nx * (j + 1)], d = arr[i + 1 + nx * (j + 1)];
    return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
  };
  return {
    offset: (x, z) => sample(off, x, z),
    arc: (x, z) => sample(arcs, x, z),
    bounds: { min: [-halfX, zMin], max: [halfX, zMax] },
  };
}

// Gingiva swept along the arch, with papillae rising between neighbouring teeth.
export function gingivaSdf(field, placed, { width = 6.6, bottom = -9, top = 0.5, papilla = 2.6, endArc = 55 } = {}) {
  const sorted = [...placed].sort((a, b) => a.arc - b.arc);
  const contacts = [];
  for (let i = 1; i < sorted.length; i++) contacts.push((sorted[i - 1].arc + sorted[i - 1].w / 2 + sorted[i].arc - sorted[i].w / 2) / 2);
  return (x, y, z) => {
    const u = field.offset(x, z);
    const arc = field.arc(x, z);
    const cy = (top + bottom) / 2, hy = (top - bottom) / 2, r = 3.2;
    const qx = Math.abs(u) - width + r, qy = Math.abs(y - cy) - hy + r;
    let v = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    v = smax(v, Math.abs(arc) - endArc, 3.0);
    for (const c of contacts) {
      const da = arc - c;
      if (Math.abs(da) > 4) continue;
      const pap = Math.hypot(da / 1.5, u / 4.6, (y - top) / papilla) - 1;
      v = smin(v, pap * 1.4, 1.1);
    }
    return v;
  };
}

// Flat-bottomed horseshoe stone base under the gingiva.
export function baseSdf(field, { width = 9.5, top = -6, bottom = -16, endArc = 60 } = {}) {
  return (x, y, z) => {
    const u = field.offset(x, z);
    const arc = field.arc(x, z);
    const qx = Math.abs(u) - width + 1.2, qy = Math.abs(y - (top + bottom) / 2) - (top - bottom) / 2 + 1.2;
    let v = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 1.2;
    return smax(v, Math.abs(arc) - endArc, 2.0);
  };
}

export { smin };
