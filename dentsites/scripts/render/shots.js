// Illustrative 3D scenes for the clinic demo. The tooth, arch and implant models
// are the labsite's (repository root, scripts/render); this file only arranges
// them into patient-facing views: a two-jaw "smile", before/after pairs and a
// few still lifes for the treatment pages.
import * as THREE from "three";
import { createStage, ceramicMaterial } from "shared/stage.js";
import { meshSdf } from "shared/mesher.js";
import { molar, premolar, anterior, ceramicColor, occlusion, hex, lerp3 } from "shared/teeth.js";
import { archCurve, layoutArch, archField, gingivaSdf, UPPER } from "shared/arch.js";
import { smoothstep, smax, ssub, sphere } from "shared/sdf.js";
import { implantFixture, abutment, veneerSdf } from "shared/parts.js";

// Lower teeth are narrower than the upper set the labsite models.
const LOWER = [
  { pos: 1, w: 5.4, make: () => anterior({ w: 2.6, d: 2.9, h: 8.8 }) },
  { pos: 2, w: 5.9, make: () => anterior({ w: 2.85, d: 3.0, h: 9.0 }) },
  { pos: 3, w: 7.0, make: () => anterior({ canine: true, w: 3.4, d: 3.7, h: 10 }) },
  { pos: 4, w: 7.0, make: () => premolar({ w: 3.4, h: 7.8 }) },
  { pos: 5, w: 7.2, make: () => premolar({ w: 3.5, h: 7.6 }) },
  { pos: 6, w: 11.0, make: () => molar({ w: 5.3, d: 5.0, h: 7.4 }) },
  { pos: 7, w: 10.2, make: () => molar({ w: 4.9, d: 4.8, h: 7.0 }) },
];

// Tooth shades: `bright` is the labsite's ceramic palette.
const SHADES = {
  bright: {},
  natural: { neck: "#d6b98a", body: "#eadcc0", edge: "#cfd3d0" },
  stained: { neck: "#bf9a5c", body: "#d9bf88", edge: "#c9bc95", edgeAmount: 0.6 },
  failing: { neck: "#a27c48", body: "#c9aa72", edge: "#b9a67c", edgeAmount: 0.5 },
};

const cache = new Map();
const cached = (key, make) => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
};

function gumColor(sdf) {
  const deep = hex("#b9505e"), mid = hex("#d77f88"), light = hex("#eaa8ad");
  return (x, y, z, n) => {
    let c = lerp3(deep, mid, smoothstep(-8, -2, y));
    c = lerp3(c, light, smoothstep(-0.5, 2.6, y) * 0.75);
    const ao = occlusion(sdf, x, y, z, n, 0.45, 5);
    return c.map((v) => v * (0.5 + 0.5 * ao));
  };
}

const gumMaterial = () =>
  new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.28,
    sheen: 0.4, sheenColor: new THREE.Color(0xffd3d6), specularIntensity: 0.65,
  });

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const field = (which, curve) => cached(`field:${which}`, () => archField(curve));

/**
 * One jaw, teeth pointing up. `teeth` varies single teeth by key: "L5" is the
 * fifth tooth from the midline on the negative-x side. Options per tooth:
 * missing, shade, out (mm toward the lip), turn (radians), lift, sx/sy/sz.
 */
function jaw(which, { teeth = {}, shade = "bright", gums = true, step = 0.13, gumStep = 0.2, material } = {}) {
  const set = which === "upper" ? UPPER : LOWER;
  const curve = archCurve(which === "upper" ? 0.042 : 0.045);
  const placed = layoutArch(curve, set);
  const group = new THREE.Group();
  for (const t of placed) {
    const v = teeth[`${t.side < 0 ? "L" : "R"}${t.pos}`] ?? {};
    if (v.missing) continue;
    const sh = v.shade ?? shade;
    const geo = cached(`${which}:${t.pos}:${material ? "plain" : sh}:${step}`, () => {
      const model = t.make();
      return meshSdf(model.sdf, model.bounds, step, material ? undefined : ceramicColor(model.sdf, model.height, SHADES[sh]));
    });
    const m = shadow(new THREE.Mesh(geo, material ?? ceramicMaterial(THREE)));
    const out = v.out ?? 0;
    m.position.set(t.x + t.nx * out, v.lift ?? 0, t.z + t.nz * out);
    m.rotation.y = t.angle + (v.turn ?? 0);
    m.scale.set(v.sx ?? 1, v.sy ?? 1, v.sz ?? 1);
    group.add(m);
  }
  if (gums) {
    const geo = cached(`gum:${which}:${gumStep}`, () => {
      const g = gingivaSdf(field(which, curve), placed, { bottom: -6.5 });
      return meshSdf(g, { min: [-38, -8, -50], max: [38, 4.5, 12] }, gumStep, material ? undefined : gumColor(g), gumStep * 1.6);
    });
    group.add(shadow(new THREE.Mesh(geo, material ?? gumMaterial())));
  }
  group.userData = { curve, placed };
  return group;
}

/** Upper and lower jaws, slightly apart, seen as a smile. */
function smile(st, { upper = {}, lower = {} } = {}) {
  const u = jaw("upper", upper);
  u.rotation.z = Math.PI;
  u.position.set(0, 12, 0);
  const l = jaw("lower", lower);
  l.position.set(0, -9.5, -2.6);
  l.rotation.x = 0.1;
  const group = new THREE.Group();
  group.add(u, l);
  st.scene.add(group);
  return { group, upper: u, lower: l };
}

function aim(st, pos, target) {
  st.camera.position.set(...pos);
  st.camera.lookAt(...target);
}

function stage(width = 1800, height = 1350, fov = 22) {
  const st = createStage({ width, height, fov, exposure: 0.9, envIntensity: 0.6 });
  st.key.position.set(-45, 70, 110);
  st.rim.position.set(70, 30, -40);
  return st;
}

const FRONT = [[0, 3, 150], [0, 1.2, -10]];
const CLOSE = [[0, 3, 118], [0, 1.5, -6]];
const SIDE = [[86, 6, 112], [9, 1.2, -15]];

const titanium = (color = 0xc9cdd2, roughness = 0.3) => new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.2 });
const matte = (color, roughness = 0.85) => new THREE.MeshPhysicalMaterial({ color, roughness, sheen: 0.2 });

function solid(key, sdf, bounds, step, material, colorFn, eps) {
  return shadow(new THREE.Mesh(cached(key, () => meshSdf(sdf, bounds, step, colorFn, eps)), material));
}

function crown(key, model, shade = "bright", step = 0.1) {
  return solid(`crown:${key}:${shade}`, model.sdf, model.bounds, step, ceramicMaterial(THREE), ceramicColor(model.sdf, model.height, SHADES[shade]));
}

function fixture(len = 11) {
  return solid(`fixture:${len}`, implantFixture({ len }), { min: [-2.6, -len - 1.5, -2.6], max: [2.6, 0.5, 2.6] }, 0.07, titanium());
}

function abut(h = 5.5) {
  return solid(`abutment:${h}`, abutment({ h }), { min: [-2.8, -2.2, -2.8], max: [2.8, h + 0.5, 2.8] }, 0.07, titanium(0xd6b46a, 0.25));
}

// Hidden-line "scan mesh" copy of a group built with a plain fill material.
function addWires(group, color) {
  const wire = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.6 });
  const wires = [];
  group.traverse((o) => {
    if (!o.isMesh) return;
    const w = new THREE.Mesh(o.geometry, wire);
    w.position.copy(o.position);
    w.rotation.copy(o.rotation);
    w.scale.copy(o.scale);
    wires.push([o.parent, w]);
  });
  wires.forEach(([parent, w]) => parent.add(w));
}

// --- Before / after cases: each pair shares one camera --------------------------------
const cases = {
  // A missing upper premolar, replaced by an implant crown.
  implant: {
    view: SIDE,
    before: { upper: { shade: "natural", teeth: { L5: { missing: true } } }, lower: { shade: "natural" } },
    after: { upper: { shade: "natural" }, lower: { shade: "natural" } },
  },
  // Several missing and failing upper teeth, rebuilt with a fixed full-arch bridge.
  "full-arch": {
    view: FRONT,
    before: {
      upper: {
        shade: "failing",
        teeth: {
          L2: { missing: true }, L5: { missing: true }, L6: { missing: true }, R4: { missing: true }, R5: { missing: true }, R7: { missing: true },
          L1: { sy: 0.84, turn: 0.08 }, R1: { sy: 0.78, out: -0.8 }, R2: { sy: 0.86, turn: -0.2, out: 0.6 }, L3: { sy: 0.9 }, R3: { sy: 0.88, turn: 0.15 },
          L4: { sy: 0.9, turn: -0.2 }, R6: { sy: 0.9 }, L7: { sy: 0.92 },
        },
      },
      lower: { shade: "stained" },
    },
    after: { upper: { shade: "bright" }, lower: { shade: "stained" } },
  },
  // Worn, discoloured front teeth restored with veneers after whitening.
  veneers: {
    view: CLOSE,
    before: {
      upper: {
        shade: "natural",
        teeth: {
          L1: { shade: "stained", sy: 0.86 }, R1: { shade: "stained", sy: 0.82, sx: 0.97 }, L2: { shade: "stained", sy: 0.88, sx: 0.92 },
          R2: { shade: "stained", sy: 0.84, sx: 0.9 }, L3: { shade: "stained", sy: 0.93 }, R3: { shade: "stained", sy: 0.9 },
        },
      },
      lower: { shade: "stained" },
    },
    after: { upper: { shade: "bright" }, lower: { shade: "natural" } },
  },
  // Crowded upper front teeth, aligned with clear aligners.
  aligners: {
    view: CLOSE,
    before: {
      upper: {
        shade: "natural",
        teeth: {
          L1: { turn: -0.2, out: 0.9 }, R1: { turn: 0.26, out: -0.7 }, L2: { turn: 0.32, out: -1.7 }, R2: { turn: -0.3, out: -1.5 },
          L3: { out: 1.3, turn: -0.12 }, R3: { out: 0.9, turn: 0.1 }, L4: { turn: 0.12 },
        },
      },
      lower: { shade: "natural", teeth: { L1: { out: -0.9, turn: 0.22 }, R1: { out: 0.8, turn: 0.18 }, R2: { out: -1.0, turn: -0.2 }, L2: { out: 0.5, turn: -0.15 } } },
    },
    after: { upper: { shade: "natural" }, lower: { shade: "natural" } },
  },
};

export const shots = {};
for (const [name, c] of Object.entries(cases)) {
  for (const phase of ["before", "after"]) {
    shots[`case-${name}-${phase}`] = () => {
      const st = stage();
      smile(st, c[phase]);
      aim(st, ...c.view);
      return st.render();
    };
  }
}

Object.assign(shots, {
  // --- Hero: the smile, large; the page crops it into an arch ----------------------
  hero() {
    const st = stage(1500, 1875, 24);
    st.key.position.set(-70, 90, 120);
    const { group } = smile(st);
    group.rotation.y = -0.38;
    group.rotation.x = 0.06;
    aim(st, [0, 10, 268], [9, -6, -8]);
    return st.render();
  },

  // --- Treatment pages (light backgrounds) -------------------------------------------
  "treat-implant"() {
    const st = stage();
    const g = new THREE.Group();
    const f = fixture();
    const a = abut();
    a.position.y = 4.5;
    const c = crown("molar-implant", molar({ w: 4.8, d: 5.0 }));
    c.position.y = 13.5;
    g.add(f, a, c);
    g.position.set(-10, 12, 0);
    g.rotation.y = 0.5;
    // The same parts assembled, beside the exploded view.
    const g2 = new THREE.Group();
    const a2 = abut();
    a2.position.y = 1.0;
    const c2 = crown("molar-implant", molar({ w: 4.8, d: 5.0 }));
    c2.position.y = 5.6;
    g2.add(fixture(), a2, c2);
    g2.position.set(12, 12, -6);
    g2.rotation.y = -0.4;
    st.scene.add(g, g2);
    st.ground(0, 0.2);
    aim(st, [0, 30, 104], [1, 15, 0]);
    return st.render();
  },
  "treat-full-arch"() {
    const st = stage(1800, 1350, 26);
    const a = jaw("upper");
    a.position.y = 14;
    st.scene.add(a);
    const { curve } = a.userData;
    for (const arc of [-9, 9, -30, 30]) {
      const p = curve.at(arc);
      const holder = new THREE.Group();
      const mu = abut(2.4);
      mu.position.y = 0.6;
      holder.add(fixture(12), mu);
      holder.position.set(p.x, -2.5, p.z - 1.5);
      if (Math.abs(arc) > 20) holder.rotation.z = Math.sign(arc) * -0.3;
      st.scene.add(holder);
    }
    st.ground(-15.5, 0.2);
    aim(st, [-34, 62, 132], [0, 4, -17]);
    return st.render();
  },
  "treat-veneers"() {
    const st = stage(1800, 1350, 24);
    const specs = [[{ w: 3.25, d: 3.0, h: 9.2 }, -15.5, 0.5], [{}, -5.6, 0.18], [{}, 5.6, -0.18], [{ w: 3.25, d: 3.0, h: 9.2 }, 15.5, -0.5]];
    specs.forEach(([o, x, ry], i) => {
      const model = anterior(o);
      const sdf = veneerSdf(model);
      const v = solid(`veneer:${i}`, sdf, model.bounds, 0.07, ceramicMaterial(THREE, { roughness: 0.25, transmission: 0 }), ceramicColor(sdf, model.height, { edgeAmount: 1 }));
      v.position.set(x, 0, -Math.abs(x) * 0.25);
      v.rotation.y = ry + Math.PI * 0.12;
      st.scene.add(v);
    });
    st.ground(0, 0.2);
    aim(st, [-8, 28, 64], [0, 5, 0]);
    return st.render();
  },
  "treat-aligners"() {
    const st = stage(1800, 1350, 26);
    // Transmission samples the scene behind the tray, so this shot has its own opaque background.
    st.scene.background = new THREE.Color(0xdfe6d8);
    const a = jaw("upper", { shade: "natural" });
    st.scene.add(a);
    const f = field("upper", a.userData.curve);
    // A thin tray following the arch, open underneath.
    const tray = (x, y, z) => {
      const u = f.offset(x, z), arc = f.arc(x, z), r = 2.4;
      const qx = Math.abs(u) - 5.6 + r, qy = Math.abs(y - 6.6) - 5.0 + r;
      let v = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      v = smax(v, Math.abs(arc) - 57.5, 3);
      v = smax(v, -(v + 0.9), 0.15);
      return smax(v, 2.6 - y, 0.5);
    };
    const clear = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, transmission: 1, thickness: 0.6, roughness: 0.06, ior: 1.45, side: THREE.DoubleSide,
      attenuationColor: new THREE.Color(0xe4f2ea), attenuationDistance: 30, clearcoat: 1, clearcoatRoughness: 0.05,
    });
    const m = solid("tray", tray, { min: [-40, 1, -52], max: [40, 13, 14] }, 0.22, clear, undefined, 0.3);
    m.castShadow = false;
    m.position.y = 9;
    m.rotation.x = -0.07;
    st.scene.add(m);
    st.ground(-7, 0.18);
    aim(st, [-26, 80, 120], [0, 7, -17]);
    return st.render();
  },
  "treat-emergency"() {
    const st = stage(1800, 1350, 22);
    const model = molar();
    const chip = (x, y, z) => sphere(x - 4.4, y - 7.6, z - 4.2, 4.3);
    const broken = (x, y, z) => ssub(model.sdf(x, y, z), chip(x, y, z), 0.18);
    const piece = (x, y, z) => smax(model.sdf(x, y, z), chip(x, y, z), 0.18);
    const colors = (sdf) => ceramicColor(sdf, model.height, SHADES.natural);
    const tooth = solid("chipped", broken, model.bounds, 0.08, ceramicMaterial(THREE), colors(broken));
    tooth.rotation.y = -0.2;
    // The broken corner, lying beside the tooth.
    const frag = solid("fragment", piece, model.bounds, 0.08, ceramicMaterial(THREE), colors(piece));
    const holder = new THREE.Group();
    frag.position.set(-3.6, -4.6, -3.6);
    holder.add(frag);
    holder.position.set(11.5, 0.2, 7);
    holder.rotation.y = 0.9;
    st.scene.add(tooth, holder);
    st.ground(0, 0.22);
    aim(st, [20, 24, 62], [3.5, 3.2, 1]);
    return st.render();
  },
  "treat-general"() {
    const st = stage(1800, 1350, 26);
    const a = jaw("lower", { shade: "natural" });
    st.scene.add(a);
    // A mouth mirror held over the back teeth: the handle leaves the head at 30 degrees.
    const mirror = new THREE.Group();
    const head = shadow(new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 1.4, 64), titanium(0xd9dde0, 0.22)));
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(7.6, 7.6, 0.2, 64), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 1, roughness: 0.03 }));
    glass.position.y = 0.75;
    const dir = new THREE.Vector3(0, 0.5, -0.866);
    const rod = (radius, length, from, material) => {
      const m = shadow(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 32), material));
      m.position.copy(dir).multiplyScalar(from + length / 2);
      m.rotation.x = -Math.PI / 3;
      return m;
    };
    mirror.add(head, glass, rod(0.8, 15, 7.5, titanium()), rod(1.7, 60, 22, titanium(0xc4c9cc, 0.38)));
    mirror.position.set(27, 13, -24);
    mirror.rotation.set(-0.5, -0.9, 0.5);
    st.scene.add(mirror);
    st.ground(-7, 0.2);
    aim(st, [-30, 84, 122], [2, 6, -18]);
    return st.render();
  },

  // --- Clinic and technology ---------------------------------------------------------
  "tech-scan-solid"() {
    const st = stage(1800, 1350, 24);
    smile(st, { upper: { shade: "natural" }, lower: { shade: "natural" } }).group.rotation.y = -0.5;
    aim(st, [0, 22, 158], [2, 0, -8]);
    return st.render();
  },
  "tech-scan-wire"() {
    const st = stage(1800, 1350, 24);
    const fill = new THREE.MeshBasicMaterial({ color: 0x15332b, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const coarse = { material: fill, step: 0.55, gumStep: 0.9 };
    const { group } = smile(st, { upper: coarse, lower: coarse });
    addWires(group, 0xb9d3b0);
    group.rotation.y = -0.5;
    aim(st, [0, 22, 158], [2, 0, -8]);
    return st.render();
  },
  "tech-lab"() {
    const st = stage(1800, 1350, 24);
    const plate = shadow(new THREE.Mesh(new THREE.CylinderGeometry(27, 27, 2.4, 96), matte(0x8fa287, 0.55)));
    plate.position.y = -1.2;
    st.scene.add(plate);
    const row = [
      [crown("lab-molar", molar()), -13, 3, 0.4],
      [crown("lab-premolar", premolar()), -1.5, -5, -0.2],
      [crown("lab-canine", anterior({ canine: true })), 8, 4, 0.5],
      [crown("lab-incisor", anterior()), 15.5, -6, -0.3],
    ];
    for (const [m, x, z, ry] of row) {
      m.position.set(x, 0, z);
      m.rotation.y = ry;
      st.scene.add(m);
    }
    st.ground(-2.4, 0.22);
    aim(st, [-8, 44, 96], [1, 3, 0]);
    return st.render();
  },
});
