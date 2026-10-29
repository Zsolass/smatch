// Restorations and lab parts built from the tooth SDFs.
import { clamp, smin, smax, ssub, ellipsoid, cylinder, smoothstep, capsule } from "./sdf.js";
import { molar, premolar, anterior } from "./teeth.js";

// Place a tooth SDF at (x, z) rotated about y (angle: local +z -> world direction).
export function placed(model, x, z, angle, y = 0) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return (px, py, pz) => {
    const dx = px - x, dz = pz - z;
    // inverse rotation
    const lx = c * dx - s * dz;
    const lz = s * dx + c * dz;
    return model.sdf(lx, py - y, lz);
  };
}

// A fused multi-unit bridge following a list of placed teeth.
export function bridgeSdf(units) {
  const fns = units.map((u) => placed(u.model, u.x, u.z, u.angle));
  const connectors = [];
  for (let i = 1; i < units.length; i++) {
    const a = units[i - 1], b = units[i];
    connectors.push([(a.x + b.x) / 2, (a.z + b.z) / 2, Math.atan2(b.x - a.x, b.z - a.z)]);
  }
  return (x, y, z) => {
    let v = fns[0](x, y, z);
    for (let i = 1; i < fns.length; i++) v = smin(v, fns[i](x, y, z), 0.6);
    for (const [cx, cz] of connectors) {
      v = smin(v, ellipsoid(x - cx, y - 4.2, z - cz, 2.0, 2.2, 2.0), 0.9);
    }
    return smax(v, -y, 0.3);
  };
}

// Threaded implant fixture, platform at y = 0, apex at y = -len.
export function implantFixture({ r = 2.05, len = 11, pitch = 0.8, depth = 0.32 } = {}) {
  return (x, y, z) => {
    const rho = Math.hypot(x, z);
    const theta = Math.atan2(z, x);
    const t = clamp(-y / len, 0, 1);
    const core = r - 0.55 * smoothstep(0.7, 1.0, t);
    const phase = ((y / pitch + theta / (2 * Math.PI)) % 1 + 1) % 1;
    const tri = 1 - 2 * Math.abs(phase - 0.5);
    const threaded = smoothstep(0.06, 0.14, t) * (1 - smoothstep(0.93, 1.0, t));
    const radius = core - depth * threaded * (1 - tri);
    let v = (rho - radius) * 0.75;
    v = smax(v, y, 0.15);
    v = smax(v, -y - len, 0.9);
    // internal connection on the platform
    v = ssub(v, cylinder(x, y, z, 1.05, 1.2), 0.15);
    return v;
  };
}

// Tapered abutment with a flat anti-rotation side and a screw channel.
export function abutment({ h = 5.5 } = {}) {
  return (x, y, z) => {
    const t = clamp(y / h, 0, 1);
    const r = 2.45 - 0.7 * t;
    let v = (Math.hypot(x, z) - r) * 0.9;
    v = smax(v, y - h, 0.35);
    v = smax(v, -y, 0.2);
    v = smax(v, z - 1.7, 0.25); // flat side
    // narrow collar below the platform
    v = smin(v, cylinder(x, y + 0.9, z, 1.0, 0.9), 0.2);
    v = ssub(v, cylinder(x, y - h, z, 0.95, 2.2), 0.12);
    return v;
  };
}

// Thin labial shell taken from an incisor (a veneer).
export function veneerSdf(model, thickness = 0.65) {
  return (x, y, z) => {
    const s = model.sdf(x, y, z);
    let v = smax(s, -(s + thickness), 0.08);
    // keep the labial half and a small incisal wrap
    v = smax(v, -(z + 0.2 - 1.6 * smoothstep(model.height - 2.5, model.height, y)), 0.12);
    return smax(v, -(y - 0.4), 0.2);
  };
}

export { capsule, molar, premolar, anterior };
