// Marching cubes over an arbitrary SDF with gradient normals.
import * as THREE from "three";
import { edgeTable, triTable } from "three/addons/objects/MarchingCubes.js";

const CORNERS = [
  [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
  [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
];
const EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7],
];

/**
 * @param {(x:number,y:number,z:number)=>number} sdf  negative inside
 * @param {{min:number[],max:number[]}} bounds
 * @param {number} step voxel size
 * @param {(x:number,y:number,z:number,n:number[])=>number[]} [colorFn]
 */
export function meshSdf(sdf, bounds, step, colorFn, normalEps = step * 0.5) {
  const [x0, y0, z0] = bounds.min;
  const nx = Math.ceil((bounds.max[0] - x0) / step) + 1;
  const ny = Math.ceil((bounds.max[1] - y0) / step) + 1;
  const nz = Math.ceil((bounds.max[2] - z0) / step) + 1;
  const total = nx * ny * nz;
  const field = new Float32Array(total);
  const idx = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) field[idx(i, j, k)] = sdf(x0 + i * step, y0 + j * step, z0 + k * step);

  const positions = [];
  const vertCache = new Map();
  const indices = [];
  const edgeVert = new Array(12);

  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let cube = 0;
        const vals = new Array(8);
        for (let c = 0; c < 8; c++) {
          const v = field[idx(i + CORNERS[c][0], j + CORNERS[c][1], k + CORNERS[c][2])];
          vals[c] = v;
          if (v < 0) cube |= 1 << c;
        }
        const edges = edgeTable[cube];
        if (!edges) continue;
        for (let e = 0; e < 12; e++) {
          if (!(edges & (1 << e))) continue;
          const [a, b] = EDGES[e];
          const ca = CORNERS[a], cb = CORNERS[b];
          const ia = idx(i + ca[0], j + ca[1], k + ca[2]);
          const ib = idx(i + cb[0], j + cb[1], k + cb[2]);
          const key = ia < ib ? ia * total + ib : ib * total + ia;
          let vi = vertCache.get(key);
          if (vi === undefined) {
            const t = vals[a] / (vals[a] - vals[b]);
            positions.push(
              x0 + (i + ca[0] + (cb[0] - ca[0]) * t) * step,
              y0 + (j + ca[1] + (cb[1] - ca[1]) * t) * step,
              z0 + (k + ca[2] + (cb[2] - ca[2]) * t) * step,
            );
            vi = positions.length / 3 - 1;
            vertCache.set(key, vi);
          }
          edgeVert[e] = vi;
        }
        const base = cube << 4;
        for (let t = 0; triTable[base + t] !== -1; t += 3) {
          indices.push(edgeVert[triTable[base + t]], edgeVert[triTable[base + t + 2]], edgeVert[triTable[base + t + 1]]);
        }
      }

  const count = positions.length / 3;
  const normals = new Float32Array(count * 3);
  const colors = colorFn ? new Float32Array(count * 3) : null;
  const h = normalEps;
  for (let v = 0; v < count; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    let gx = sdf(x + h, y, z) - sdf(x - h, y, z);
    let gy = sdf(x, y + h, z) - sdf(x, y - h, z);
    let gz = sdf(x, y, z + h) - sdf(x, y, z - h);
    const len = Math.hypot(gx, gy, gz) || 1;
    gx /= len; gy /= len; gz /= len;
    normals[v * 3] = gx; normals[v * 3 + 1] = gy; normals[v * 3 + 2] = gz;
    if (colors) {
      const c = colorFn(x, y, z, [gx, gy, gz]);
      colors[v * 3] = c[0]; colors[v * 3 + 1] = c[1]; colors[v * 3 + 2] = c[2];
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  if (colors) geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}
