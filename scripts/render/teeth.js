// Procedural tooth crown shapes as SDFs. Origin is the centre of the cervical
// margin; +y points to the occlusal/incisal edge, +z to the cheek/lip side.
import { clamp, ellipsoid, roundBox, capsule, smin, smax, ssub, smoothstep } from "./sdf.js";

function taper(y, h, base = 0.8, top = 0.9) {
  const t = y / h;
  return base + (1 - base) * smoothstep(-0.05, 0.42, t) - (1 - top) * smoothstep(0.6, 1.05, t);
}

export function molar(o = {}) {
  const w = o.w ?? 5.0, d = o.d ?? 5.3, h = o.h ?? 6.8;
  const cusps = o.cusps ?? [
    // [x sign, z sign, height offset, size]
    [-1, 1, 0, 1.0], [1, 1, -0.2, 0.95], [-1, -1, -0.1, 1.05], [1, -1, -0.45, 0.9],
  ];
  const sdf = (x, y, z) => {
    const s = taper(y, h, 0.8, 0.95);
    const px = x / s, pz = z / s;
    let v = roundBox(px, y - h * 0.36, pz, w, h * 0.36, d, 1.7) * s;
    for (const [cx, cz, ch, k] of cusps) {
      const ex = px - cx * w * 0.47, ez = pz - cz * d * 0.47;
      // cone-ish cusp: ellipsoid sharpened toward its tip
      const cy = y - (h - 1.9 + ch);
      v = smin(v, ellipsoid(ex, cy, ez, 2.2 * k, 2.0 * k, 2.2 * k) + 0.45 * Math.max(cy, 0), 0.55);
    }
    v = ssub(v, ellipsoid(px, y - (h + 0.2), pz, 2.2, 1.9, 2.0), 0.4);
    v = ssub(v, capsule(px, y, pz, -w * 0.78, h - 1.25, 0.15, w * 0.78, h - 1.25, -0.2, 0.3), 0.22);
    v = ssub(v, capsule(px, y, pz, 0.2, h - 1.25, -d * 0.8, -0.25, h - 1.25, d * 0.8, 0.28), 0.22);
    // buccal and lingual developmental grooves running down the sides
    v = ssub(v, capsule(px, y, pz, 0.3, h - 1.5, d * 1.02, 0.1, h * 0.45, d * 0.98, 0.22), 0.5);
    return smax(v, -y, 0.35);
  };
  return { sdf, bounds: { min: [-w - 1, -0.6, -d - 1], max: [w + 1, h + 1.2, d + 1] }, height: h, kind: "molar" };
}

export function premolar(o = {}) {
  const w = o.w ?? 3.5, d = o.d ?? 4.5, h = o.h ?? 7.8;
  const sdf = (x, y, z) => {
    const s = taper(y, h, 0.76, 0.92);
    const px = x / s, pz = z / s;
    let v = roundBox(px, y - h * 0.37, pz, w, h * 0.37, d, 1.8) * s;
    const b = y - (h - 1.6);
    v = smin(v, ellipsoid(px, b, pz - d * 0.45, 2.6, 2.3, 2.0) + 0.5 * Math.max(b, 0), 0.55);
    const l = y - (h - 2.3);
    v = smin(v, ellipsoid(px, l, pz + d * 0.45, 2.3, 2.0, 1.9) + 0.5 * Math.max(l, 0), 0.55);
    v = ssub(v, capsule(px, y, pz, -w * 0.8, h - 1.6, -0.2, w * 0.8, h - 1.6, -0.2, 0.32), 0.25);
    return smax(v, -y, 0.35);
  };
  return { sdf, bounds: { min: [-w - 1, -0.6, -d - 1], max: [w + 1, h + 1, d + 1] }, height: h, kind: "premolar" };
}

export function anterior(o = {}) {
  // Incisor by default; `canine: true` gives a pointed cusp and a fuller body.
  const canine = !!o.canine;
  const w = o.w ?? (canine ? 3.8 : 4.2), d = o.d ?? (canine ? 3.9 : 3.4), h = o.h ?? (canine ? 10.2 : 10.6);
  const sdf = (x, y, z) => {
    const t = clamp(y / h, 0, 1);
    const sx = (canine ? 0.78 : 0.7) + (canine ? 0.22 : 0.3) * smoothstep(0.0, 0.55, t);
    const sz = 1 - (canine ? 0.45 : 0.68) * smoothstep(0.2, 1.0, t);
    const px = x / sx;
    const pz = (z + 0.6 * t) / sz;
    let v = roundBox(px, y - h * 0.5, pz, w, h * 0.5, d, canine ? 3.0 : 2.2) * Math.min(sx, sz);
    // labial convexity and lingual fossa
    if (!canine) v = ssub(v, ellipsoid(x, y - h * 0.62, z + d * 0.62 + 0.6, w * 0.6, h * 0.3, 0.9), 0.6);
    if (canine) {
      v = smax(v, y - (h - 0.9 * Math.abs(x)) - 0.2 * Math.abs(z), 0.8);
    } else {
      v = smax(v, y - h + 0.12 * x * x * 0.08, 0.35);
    }
    return smax(v, -y, 0.35);
  };
  return { sdf, bounds: { min: [-w - 1.2, -0.6, -d - 1.6], max: [w + 1.2, h + 1, d + 1.2] }, height: h, kind: canine ? "canine" : "incisor" };
}

// Classic SDF ambient occlusion: how open the space is along the normal.
export function occlusion(sdf, x, y, z, n, step = 0.35, samples = 5) {
  let occ = 0, w = 1;
  for (let i = 1; i <= samples; i++) {
    const dist = step * i;
    occ += w * (dist - sdf(x + n[0] * dist, y + n[1] * dist, z + n[2] * dist));
    w *= 0.6;
  }
  return clamp(1 - 0.55 * occ, 0, 1);
}

// sRGB hex -> linear RGB (three.js treats vertex colours as linear).
export const hex = (h) => [1, 3, 5].map((i) => Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2));
export const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// Layered-ceramic look: warmer chroma at the neck, translucent cool incisal edge.
export function ceramicColor(sdf, h, palette = {}) {
  const neck = hex(palette.neck ?? "#dcc39b");
  const body = hex(palette.body ?? "#efe5d1");
  const edge = hex(palette.edge ?? "#d3dadd");
  return (x, y, z, n) => {
    const t = clamp(y / h, 0, 1);
    let c = lerp3(neck, body, smoothstep(0.05, 0.45, t));
    c = lerp3(c, edge, smoothstep(0.7, 1.0, t) * (palette.edgeAmount ?? 0.85));
    const ao = occlusion(sdf, x, y, z, n);
    return c.map((v) => v * (0.55 + 0.45 * ao));
  };
}
