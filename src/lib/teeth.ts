// FDI two-digit tooth notation for the 32 permanent teeth.
// Quadrants: 1 upper right, 2 upper left, 3 lower left, 4 lower right
// (right/left are the patient's sides).

export type Arch = "upper" | "lower";
export type Side = "right" | "left";
export type ToothType = "incisor" | "canine" | "premolar" | "molar";

export interface Tooth {
  id: number;
  arch: Arch;
  side: Side;
  /** 1 = central incisor ... 8 = third molar */
  position: number;
  type: ToothType;
  name: string;
  /** Position along the arch as the dentist faces the patient, 0..15 left to right. */
  archIndex: number;
}

const TYPES: ToothType[] = ["incisor", "incisor", "canine", "premolar", "premolar", "molar", "molar", "molar"];
const NAMES = ["central incisor", "lateral incisor", "canine", "first premolar", "second premolar", "first molar", "second molar", "third molar"];

/** Teeth in display order: patient's right on the viewer's left. */
export const ARCH_ORDER: Record<Arch, number[]> = {
  upper: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  lower: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
};

function build(id: number): Tooth {
  const quadrant = Math.floor(id / 10);
  const position = id % 10;
  const arch: Arch = quadrant <= 2 ? "upper" : "lower";
  const side: Side = quadrant === 1 || quadrant === 4 ? "right" : "left";
  return {
    id,
    arch,
    side,
    position,
    type: TYPES[position - 1]!,
    name: `${arch} ${side} ${NAMES[position - 1]}`,
    archIndex: ARCH_ORDER[arch].indexOf(id),
  };
}

export const TEETH: Tooth[] = [...ARCH_ORDER.upper, ...ARCH_ORDER.lower].map(build);
const BY_ID = new Map(TEETH.map((t) => [t.id, t]));

export function getTooth(id: number): Tooth {
  const t = BY_ID.get(id);
  if (!t) throw new Error(`Unknown FDI tooth ${id}`);
  return t;
}

export function isToothId(id: unknown): id is number {
  return typeof id === "number" && BY_ID.has(id);
}

/** Neighbours along the arch, including across the midline (11–21, 41–31). */
export function areAdjacent(a: number, b: number): boolean {
  const ta = getTooth(a), tb = getTooth(b);
  return ta.arch === tb.arch && Math.abs(ta.archIndex - tb.archIndex) === 1;
}

/** Reading order for lists: FDI numbers ascending (11, 12 … 48). */
export function sortTeeth(ids: number[]): number[] {
  return [...ids].sort((a, b) => a - b);
}

/** Order along the arch as drawn: upper arch first, patient's right to left. */
export function sortAlongArch(ids: number[]): number[] {
  return [...ids].sort((a, b) => {
    const ta = getTooth(a), tb = getTooth(b);
    if (ta.arch !== tb.arch) return ta.arch === "upper" ? -1 : 1;
    return ta.archIndex - tb.archIndex;
  });
}

const quadrant = (id: number) => Math.floor(id / 10);

/** Within one quadrant teeth read 13, 14, 15; across the midline they follow the arch (12, 11, 21, 22). */
function spanOrder(ids: number[]): number[] {
  return new Set(ids.map(quadrant)).size === 1 ? sortTeeth(ids) : sortAlongArch(ids);
}

export function toothLabel(id: number): string {
  const t = getTooth(id);
  return `${id} · ${t.name.charAt(0).toUpperCase()}${t.name.slice(1)}`;
}

// --- Bridges ---------------------------------------------------------------

export type BridgeRole = "abutment" | "pontic";
export interface BridgeUnit {
  tooth: number;
  role: BridgeRole;
}
export interface Bridge {
  id: string;
  units: BridgeUnit[];
}

export const ROLE_LABEL: Record<BridgeRole, string> = { abutment: "Abutment", pontic: "Pontic" };

export function sortUnits(units: BridgeUnit[]): BridgeUnit[] {
  const order = spanOrder(units.map((u) => u.tooth));
  return order.map((id) => units.find((u) => u.tooth === id)!);
}

/** "13–15" or "12–22" for a contiguous span, otherwise a comma list. */
export function spanLabel(ids: number[]): string {
  if (ids.length === 0) return "";
  if (ids.length === 1) return String(ids[0]);
  const along = sortAlongArch(ids);
  const contiguous = along.every((id, i) => i === 0 || areAdjacent(along[i - 1]!, id));
  if (!contiguous) return sortTeeth(ids).join(", ");
  const ordered = spanOrder(ids);
  return `${ordered[0]}–${ordered.at(-1)}`;
}

/** Teeth missing between the first and last unit of a bridge on one arch. */
export function bridgeGaps(units: BridgeUnit[]): number[] {
  if (units.length < 2) return [];
  const teeth = units.map((u) => getTooth(u.tooth));
  const arch = teeth[0]!.arch;
  if (teeth.some((t) => t.arch !== arch)) return [];
  const indices = teeth.map((t) => t.archIndex);
  const min = Math.min(...indices), max = Math.max(...indices);
  const gaps: number[] = [];
  for (let i = min; i <= max; i++) if (!indices.includes(i)) gaps.push(ARCH_ORDER[arch][i]!);
  return gaps;
}

export function validateBridge(bridge: Bridge): string[] {
  const errors: string[] = [];
  const { units } = bridge;
  if (units.length < 2) {
    errors.push("A bridge needs at least two teeth.");
    return errors;
  }
  const arches = new Set(units.map((u) => getTooth(u.tooth).arch));
  if (arches.size > 1) {
    errors.push("All teeth in a bridge must be on the same arch. Use a separate bridge for the other arch.");
  } else {
    const gaps = bridgeGaps(units);
    if (gaps.length) {
      errors.push(
        `Bridge teeth must be next to each other. Add ${gaps.length === 1 ? "tooth" : "teeth"} ${gaps.join(", ")} or split this into separate bridges.`,
      );
    }
  }
  if (!units.some((u) => u.role === "abutment")) errors.push("Mark at least one tooth as an abutment.");
  if (!units.some((u) => u.role === "pontic")) errors.push("Mark at least one tooth as a pontic.");
  return errors;
}
