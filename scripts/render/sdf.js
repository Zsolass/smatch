// Signed-distance helpers used to model teeth and dental parts procedurally.
// Units are millimetres; y is up (occlusal/incisal), z faces the lips/cheek.

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const mix = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const sphere = (x, y, z, r) => Math.hypot(x, y, z) - r;

// Approximate ellipsoid distance (good near the surface, which is all we need).
export function ellipsoid(x, y, z, rx, ry, rz) {
  const k0 = Math.hypot(x / rx, y / ry, z / rz);
  const k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
}

export function roundBox(x, y, z, bx, by, bz, r) {
  const qx = Math.abs(x) - bx + r;
  const qy = Math.abs(y) - by + r;
  const qz = Math.abs(z) - bz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r;
}

export function capsule(x, y, z, ax, ay, az, bx, by, bz, r) {
  const pax = x - ax, pay = y - ay, paz = z - az;
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h, paz - baz * h) - r;
}

// Vertical capped cylinder centred on the y axis.
export function cylinder(x, y, z, r, halfH) {
  const dx = Math.hypot(x, z) - r;
  const dy = Math.abs(y) - halfH;
  return Math.min(Math.max(dx, dy), 0) + Math.hypot(Math.max(dx, 0), Math.max(dy, 0));
}

export function smin(a, b, k) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return mix(b, a, h) - k * h * (1 - h);
}
export function smax(a, b, k) {
  return -smin(-a, -b, k);
}
// Smoothly subtract b from a.
export const ssub = (a, b, k) => smax(a, -b, k);
