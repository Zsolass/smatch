import * as THREE from "three";
import { createStage, ceramicMaterial } from "./stage.js";
import { meshSdf } from "./mesher.js";
import { molar, premolar, anterior, ceramicColor, occlusion, hex, lerp3 } from "./teeth.js";
import { archCurve, layoutArch, archField, gingivaSdf, baseSdf, UPPER } from "./arch.js";
import { smoothstep, clamp } from "./sdf.js";
import { bridgeSdf, implantFixture, abutment, veneerSdf } from "./parts.js";

function toothMesh(model, step = 0.12, palette) {
  const geo = meshSdf(model.sdf, model.bounds, step, ceramicColor(model.sdf, model.height, palette));
  const mesh = new THREE.Mesh(geo, ceramicMaterial(THREE));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function gumColor(sdf) {
  const deep = hex("#b9505e"), mid = hex("#d77f88"), light = hex("#eaa8ad");
  return (x, y, z, n) => {
    let c = lerp3(deep, mid, smoothstep(-8, -2, y));
    c = lerp3(c, light, smoothstep(-0.5, 2.6, y) * 0.75);
    const ao = occlusion(sdf, x, y, z, n, 0.45, 5);
    return c.map((v) => v * (0.5 + 0.5 * ao));
  };
}

function gumMaterial() {
  return new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.25,
    sheen: 0.4, sheenColor: new THREE.Color(0xffd3d6), specularIntensity: 0.7,
  });
}

function buildArch(scene, { gums = true, base = false, step = 0.12, palate = false, toothMaterial, gumMat, gumStep = 0.2, colors = true } = {}) {
  const curve = archCurve();
  const placed = layoutArch(curve, UPPER);
  const cache = new Map();
  const group = new THREE.Group();
  for (const t of placed) {
    if (!cache.has(t.pos)) {
      const model = t.make();
      if (toothMaterial) cache.set(t.pos, solid(model.sdf, model.bounds, step, toothMaterial, colors ? ceramicColor(model.sdf, model.height) : undefined));
      else cache.set(t.pos, toothMesh(model, step));
    }
    const m = cache.get(t.pos).clone();
    m.position.set(t.x, 0, t.z);
    m.rotation.y = t.angle;
    group.add(m);
  }
  const field = archField(curve);
  if (gums) {
    let g = gingivaSdf(field, placed);
    if (palate) g = withPalate(g, field);
    const geo = meshSdf(g, { min: [-38, -10, -50], max: [38, 4.5, 12] }, gumStep, colors ? gumColor(g) : undefined, gumStep * 1.6);
    const gm = new THREE.Mesh(geo, gumMat ?? gumMaterial());
    gm.castShadow = true; gm.receiveShadow = true;
    group.add(gm);
  }
  if (base) {
    const b = baseSdf(field);
    const geo = meshSdf(b, { min: [-42, -17, -54], max: [42, -5, 14] }, 0.3);
    const bm = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xe9e1d3, roughness: 0.85 }));
    bm.castShadow = true; bm.receiveShadow = true;
    group.add(bm);
  }
  scene.add(group);
  return { group, placed, curve, field };
}

// Fill the inside of the arch with a palate plate (complete denture).
function withPalate(gum, field) {
  return (x, y, z) => {
    const u = field.offset(x, z);
    const top = -2.2 - 2.4 * smoothstep(-6, -22, u);
    let plate = Math.max(y - top, -6.5 - y);
    plate = smax(plate, u + 2, 1.5);
    plate = smax(plate, -(z + 40), 4);
    return smin(gum(x, y, z), plate, 2.2);
  };
}

const smax = (a, b, k) => -smin2(-a, -b, k);
function smin2(a, b, k) {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b + (a - b) * h - k * h * (1 - h);
}
const smin = smin2;

function solid(sdf, bounds, step, material, colorFn, eps) {
  const mesh = new THREE.Mesh(meshSdf(sdf, bounds, step, colorFn, eps), material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function bridgeMesh(step = 0.11) {
  const units = [
    { model: anterior({ canine: true }), x: -7.6, z: 1.2, angle: -0.38 },
    { model: premolar(), x: 0, z: -0.2, angle: -0.12 },
    { model: premolar({ w: 3.3, h: 7.3 }), x: 7.0, z: -0.6, angle: 0.05 },
  ];
  const sdf = bridgeSdf(units);
  return solid(sdf, { min: [-13, -0.5, -7], max: [12.5, 11.5, 7] }, step, ceramicMaterial(THREE), ceramicColor(sdf, 9.5));
}

export function titanium(color = 0xc9cdd2, roughness = 0.3) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness, clearcoat: 0.2 });
}

export function implantStack(step = 0.07) {
  const g = new THREE.Group();
  const fixture = solid(implantFixture(), { min: [-2.6, -11.5, -2.6], max: [2.6, 0.5, 2.6] }, step, titanium());
  const abut = solid(abutment(), { min: [-2.8, -2.2, -2.8], max: [2.8, 6, 2.8] }, step, titanium(0xd6b46a, 0.25));
  const crownModel = molar({ w: 4.8, d: 5.0 });
  const crown = toothMesh(crownModel, 0.1);
  abut.position.y = 4.5;
  crown.position.y = 13.5;
  g.add(fixture, abut, crown);
  return g;
}

export function veneerMesh(o = {}, step = 0.07) {
  const model = anterior(o);
  const sdf = veneerSdf(model);
  return solid(sdf, model.bounds, step, ceramicMaterial(THREE, { roughness: 0.25, transmission: 0 }), ceramicColor(sdf, model.height, { edgeAmount: 1 }));
}

function aim(st, pos, target) {
  st.camera.position.set(...pos);
  st.camera.lookAt(...target);
}

function stoneMaterial(color = 0xe8dfcf) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.82, sheen: 0.2 });
}

function fullArchOnImplants(st) {
  const { group } = buildArch(st.scene, {});
  group.position.y = 15;
  const sites = [-9, 9, -30, 30];
  const curve = archCurve();
  for (const a of sites) {
    const p = curve.at(a);
    const fx = solid(implantFixture({ len: 12 }), { min: [-2.6, -12.5, -2.6], max: [2.6, 0.5, 2.6] }, 0.08, titanium());
    const mu = solid(abutment({ h: 2.4 }), { min: [-2.8, -2.2, -2.8], max: [2.8, 3, 2.8] }, 0.08, titanium(0xd6b46a, 0.25));
    const holder = new THREE.Group();
    mu.position.y = 0.6;
    holder.add(fx, mu);
    holder.position.set(p.x, -2, p.z - 1.5);
    if (Math.abs(a) > 20) holder.rotation.z = Math.sign(a) * -0.3;
    st.scene.add(holder);
  }
  return group;
}

function splintOnModel(st) {
  const stone = stoneMaterial(0xdcd6cb);
  const { group, field } = buildArch(st.scene, { toothMaterial: stone, gumMat: stone, base: true, colors: false, gumStep: 0.25 });
  const splint = (x, y, z) => {
    const u = field.offset(x, z);
    const arc = field.arc(x, z);
    const r = 2.2;
    const qx = Math.abs(u) - 7.2 + r, qy = Math.abs(y - 7.2) - 4.6 + r;
    let v = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
    return smax(v, Math.abs(arc) - 54, 3);
  };
  const clear = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, transmission: 1, thickness: 2.5, roughness: 0.1, ior: 1.49,
    attenuationColor: new THREE.Color(0xd5eef0), attenuationDistance: 14, clearcoat: 1, clearcoatRoughness: 0.05,
  });
  const m = solid(splint, { min: [-40, 1.5, -52], max: [40, 13, 14] }, 0.25, clear, undefined, 0.4);
  m.castShadow = false;
  st.scene.add(m);
  return group;
}

function wireArch(st, color = 0x67d6d3) {
  // Low-resolution "scan mesh" of the same arch, drawn as hidden-line wireframe.
  const fill = new THREE.MeshBasicMaterial({ color: 0x0d2a30, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const wire = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.55 });
  const a = buildArch(st.scene, { toothMaterial: fill, gumMat: fill, step: 0.55, gumStep: 0.9, colors: false });
  const wires = [];
  a.group.traverse((o) => {
    if (o.isMesh) {
      const w = new THREE.Mesh(o.geometry, wire);
      w.position.copy(o.position); w.rotation.copy(o.rotation); w.scale.copy(o.scale);
      wires.push(w);
    }
  });
  wires.forEach((w) => a.group.add(w));
  return a.group;
}

export const shots = {
  // --- Hero: full arch, solid and wireframe passes composited in post ---
  async "hero-solid"() {
    const st = createStage({ width: 1800, height: 1800, fov: 26 });
    st.key.position.set(-50, 90, 70);
    buildArch(st.scene, {});
    st.ground(-9.5, 0.28);
    aim(st, [26, 104, 150], [0, -6, -20]);
    return st.render();
  },
  async "hero-wire"() {
    const st = createStage({ width: 1800, height: 1800, fov: 26 });
    wireArch(st);
    aim(st, [26, 104, 150], [0, -6, -20]);
    return st.render();
  },

  // --- Services (light backgrounds) ---
  async "service-crowns-bridges"() {
    const st = createStage({ width: 1800, height: 1350, fov: 24 });
    const b = bridgeMesh();
    b.position.set(-6, 0, 2);
    b.rotation.y = 0.25;
    const crown = toothMesh(molar());
    crown.position.set(15, 0, -4);
    crown.rotation.y = -0.5;
    st.scene.add(b, crown);
    st.ground(0, 0.22);
    aim(st, [6, 42, 70], [3, 3.5, 0]);
    return st.render();
  },
  async "service-implants"() {
    const st = createStage({ width: 1800, height: 1350, fov: 24 });
    const s1 = implantStack();
    s1.position.set(0, 12, 0);
    s1.rotation.y = 0.5;
    st.scene.add(s1);
    st.ground(0, 0.22);
    aim(st, [0, 30, 96], [0, 16, 0]);
    return st.render();
  },
  async "service-full-arch"() {
    const st = createStage({ width: 1800, height: 1350, fov: 26 });
    fullArchOnImplants(st);
    st.ground(-15, 0.2);
    aim(st, [0, 70, 130], [0, 4, -16]);
    return st.render();
  },
  async "service-veneers"() {
    const st = createStage({ width: 1800, height: 1350, fov: 24 });
    const specs = [
      [{ w: 3.25, d: 3.0, h: 9.2 }, -15, 0.5],
      [{}, -5.5, 0.18],
      [{}, 5.5, -0.18],
      [{ w: 3.25, d: 3.0, h: 9.2 }, 15, -0.5],
    ];
    for (const [o, x, ry] of specs) {
      const v = veneerMesh(o);
      v.position.set(x, 0, -Math.abs(x) * 0.25);
      v.rotation.y = ry + Math.PI * 0.12;
      st.scene.add(v);
    }
    st.ground(0, 0.2);
    aim(st, [-8, 30, 62], [0, 5, 0]);
    return st.render();
  },
  async "service-dentures"() {
    const st = createStage({ width: 1800, height: 1350, fov: 26 });
    buildArch(st.scene, { palate: true });
    st.ground(-9.5, 0.24);
    aim(st, [-20, 92, 104], [0, -4, -18]);
    return st.render();
  },
  async "service-splints"() {
    const st = createStage({ width: 1800, height: 1350, fov: 26 });
    st.scene.background = new THREE.Color(0xeeebe5);
    splintOnModel(st);
    st.ground(-16, 0.2);
    aim(st, [18, 78, 112], [0, -2, -16]);
    return st.render();
  },

  // --- Sample cases (dark studio) ---
  async "case-bridge"() {
    const st = createStage({ width: 1800, height: 1350, fov: 22 });
    const b = bridgeMesh(0.09);
    b.rotation.y = -0.35;
    st.scene.add(b);
    st.ground(0, 0.35);
    aim(st, [-14, 30, 58], [0, 4, 0]);
    return st.render();
  },
  async "case-implant"() {
    const st = createStage({ width: 1800, height: 1350, fov: 22 });
    const s1 = implantStack();
    s1.children[1].position.y = 1.2;
    s1.children[2].position.y = 6.6;
    s1.position.set(0, 12, 0);
    s1.rotation.y = -0.4;
    st.scene.add(s1);
    st.ground(0, 0.35);
    aim(st, [12, 26, 70], [0, 12.5, 0]);
    return st.render();
  },
  async "case-veneers"() {
    const st = createStage({ width: 1800, height: 1350, fov: 22 });
    const xs = [[-11, { w: 3.25, d: 3.0, h: 9.2 }], [-3.8, {}], [3.8, {}], [11, { w: 3.25, d: 3.0, h: 9.2 }]];
    xs.forEach(([x, o]) => {
      const v = veneerMesh(o);
      v.position.set(x, 0, -Math.abs(x) * 0.35);
      v.rotation.y = -x * 0.05;
      st.scene.add(v);
    });
    st.ground(0, 0.35);
    aim(st, [6, 18, 56], [0, 5, 0]);
    return st.render();
  },
  async "case-full-arch"() {
    const st = createStage({ width: 1800, height: 1350, fov: 26 });
    buildArch(st.scene, {});
    st.ground(-9.5, 0.3);
    aim(st, [0, 128, 60], [0, -2, -18]);
    return st.render();
  },
  async "case-denture"() {
    const st = createStage({ width: 1800, height: 1350, fov: 24 });
    buildArch(st.scene, { palate: true });
    st.ground(-9.5, 0.3);
    aim(st, [42, 60, 112], [0, -3, -16]);
    return st.render();
  },
  async "case-splint"() {
    const st = createStage({ width: 1800, height: 1350, fov: 24 });
    st.scene.background = new THREE.Color(0x14262c);
    splintOnModel(st);
    st.ground(-16, 0.3);
    aim(st, [-30, 64, 110], [0, -1, -16]);
    return st.render();
  },
  async "cad-solid"() {
    const st = createStage({ width: 1800, height: 1350, fov: 22 });
    const c = toothMesh(molar(), 0.1);
    c.rotation.y = 0.5;
    st.scene.add(c);
    aim(st, [0, 19, 54], [0, 3.2, 0]);
    return st.render();
  },
  async "cad-wire"() {
    const st = createStage({ width: 1800, height: 1350, fov: 22 });
    const model = molar();
    const fill = new THREE.MeshBasicMaterial({ color: 0x0d2a30, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
    const geo = meshSdf(model.sdf, model.bounds, 0.42);
    const a = new THREE.Mesh(geo, fill);
    const w = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x67d6d3, wireframe: true, transparent: true, opacity: 0.7 }));
    // margin line
    const pts = [];
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * Math.PI * 2;
      let r = 1, x = 0, z = 0;
      for (let k = 0; k < 40; k++) {
        x = Math.cos(t) * r; z = Math.sin(t) * r;
        if (model.sdf(x, 0.35, z) > 0) break;
        r += 0.2;
      }
      pts.push(new THREE.Vector3(x, 0.35, z));
    }
    const line = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 200, 0.09, 8, true), new THREE.MeshBasicMaterial({ color: 0xf2b86c }));
    const g = new THREE.Group();
    g.add(a, w, line);
    g.rotation.y = 0.5;
    st.scene.add(g);
    aim(st, [0, 19, 54], [0, 3.2, 0]);
    return st.render();
  },
};
