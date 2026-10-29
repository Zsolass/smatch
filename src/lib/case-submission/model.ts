// State, rules and summaries for the case submission demo. Pure functions only,
// so the same logic can back a real submission API later.

import { workTypeById, type FileCategory, type WorkTypeId } from "@/config/case-submission";
import {
  getTooth,
  ROLE_LABEL,
  sortTeeth,
  sortUnits,
  spanLabel,
  validateBridge,
  type Arch,
  type Bridge,
  type BridgeRole,
} from "@/lib/teeth";

export interface PracticeDetails {
  practiceName: string;
  dentistName: string;
  email: string;
  phone: string;
  caseReference: string;
  /** Requested completion date, YYYY-MM-DD. A wish, not a lab commitment. */
  dueDate: string;
}

export interface Restoration {
  workType: WorkTypeId | "";
  material: string;
  shade: string;
  notes: string;
  /** Individually selected teeth (crowns, veneers, implant positions). */
  teeth: number[];
  /** Bridge spans with abutment/pontic roles. */
  bridges: Bridge[];
  activeBridgeId: string | null;
  /** Whole-arch selection, stored separately from teeth. */
  arches: Arch[];
}

export interface CaseFile {
  id: string;
  file: File;
  category: FileCategory;
  /** Object URL for image thumbnails; revoked when the file is removed. */
  previewUrl: string | null;
}

export interface CaseDraft {
  practice: PracticeDetails;
  restoration: Restoration;
  files: CaseFile[];
  instructions: string;
}

export type FieldErrors = Record<string, string>;

export const emptyDraft = (): CaseDraft => ({
  practice: { practiceName: "", dentistName: "", email: "", phone: "", caseReference: "", dueDate: "" },
  restoration: { workType: "", material: "", shade: "", notes: "", teeth: [], bridges: [], activeBridgeId: null, arches: [] },
  files: [],
  instructions: "",
});

let counter = 0;
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const ARCH_LABEL: Record<Arch, string> = { upper: "Upper arch", lower: "Lower arch" };
export const archesLabel = (arches: Arch[]) =>
  arches.length === 2 ? "Upper and lower arches" : arches.length === 1 ? ARCH_LABEL[arches[0]!] : "";

export const filledBridges = (r: Restoration) => r.bridges.filter((b) => b.units.length > 0);

// --- Work type changes ---------------------------------------------------------

/**
 * Switches the work type and reports anything that had to be cleared because
 * it no longer fits, so the change is never silent.
 */
export function changeWorkType(prev: Restoration, next: WorkTypeId): { restoration: Restoration; messages: string[] } {
  if (prev.workType === next) return { restoration: prev, messages: [] };
  const oldType = prev.workType ? workTypeById[prev.workType] : null;
  const type = workTypeById[next];
  const r: Restoration = { ...prev, workType: next };
  const messages: string[] = [];

  if (prev.material && !type.materials.includes(prev.material)) {
    messages.push(`Material “${prev.material}” isn't offered for ${type.label}, so it was cleared.`);
    r.material = "";
  }
  if (prev.shade && !type.shade) {
    messages.push(`Shade ${prev.shade} was cleared: ${type.label} doesn't use a tooth shade.`);
    r.shade = "";
  }
  if (oldType && oldType.selection !== type.selection) {
    const reason =
      type.selection === "arch"
        ? `${type.label} is recorded per arch`
        : type.selection === "bridge"
          ? "bridges need abutment and pontic roles"
          : `${type.label} is recorded per tooth`;
    if (prev.teeth.length) {
      messages.push(`Selected teeth ${sortTeeth(prev.teeth).join(", ")} were cleared: ${reason}.`);
    }
    const bridges = filledBridges(prev);
    if (bridges.length) {
      const spans = bridges.map((b) => spanLabel(b.units.map((u) => u.tooth))).join(" and ");
      messages.push(`${bridges.length === 1 ? "Bridge" : "Bridges"} ${spans} ${bridges.length === 1 ? "was" : "were"} cleared: ${reason}.`);
    }
    if (prev.arches.length) {
      messages.push(`${archesLabel(prev.arches)} selection was cleared: ${reason}.`);
    }
    r.teeth = [];
    r.bridges = [];
    r.activeBridgeId = null;
    r.arches = [];
  }
  return { restoration: r, messages };
}

// --- Selection operations --------------------------------------------------------

export function toggleTooth(r: Restoration, tooth: number): Restoration {
  return r.teeth.includes(tooth) ? { ...r, teeth: r.teeth.filter((t) => t !== tooth) } : { ...r, teeth: sortTeeth([...r.teeth, tooth]) };
}

export function toggleArch(r: Restoration, arch: Arch): Restoration {
  const arches = r.arches.includes(arch) ? r.arches.filter((a) => a !== arch) : [...r.arches, arch];
  return { ...r, arches: (["upper", "lower"] as Arch[]).filter((a) => arches.includes(a)) };
}

export function bridgeOf(r: Restoration, tooth: number): Bridge | undefined {
  return r.bridges.find((b) => b.units.some((u) => u.tooth === tooth));
}

/**
 * Applies a click on the chart in bridge mode with the chosen role:
 * - a tooth in another bridge makes that bridge active,
 * - a tooth in the active bridge switches role, or is removed if the role is unchanged,
 * - any other tooth joins the active bridge (a new bridge is started if needed).
 */
export function applyBridgeClick(r: Restoration, tooth: number, role: BridgeRole): Restoration {
  const owner = bridgeOf(r, tooth);
  if (owner && owner.id !== r.activeBridgeId) return { ...r, activeBridgeId: owner.id };
  if (owner) {
    const unit = owner.units.find((u) => u.tooth === tooth)!;
    const units = unit.role === role ? owner.units.filter((u) => u.tooth !== tooth) : owner.units.map((u) => (u.tooth === tooth ? { ...u, role } : u));
    return { ...r, bridges: r.bridges.map((b) => (b.id === owner.id ? { ...b, units } : b)) };
  }
  const active = r.bridges.find((b) => b.id === r.activeBridgeId);
  if (!active) {
    const bridge: Bridge = { id: newId("bridge"), units: [{ tooth, role }] };
    return { ...r, bridges: [...r.bridges, bridge], activeBridgeId: bridge.id };
  }
  return {
    ...r,
    bridges: r.bridges.map((b) => (b.id === active.id ? { ...b, units: sortUnits([...b.units, { tooth, role }]) } : b)),
  };
}

export function setUnitRole(r: Restoration, bridgeId: string, tooth: number, role: BridgeRole): Restoration {
  return {
    ...r,
    bridges: r.bridges.map((b) => (b.id === bridgeId ? { ...b, units: b.units.map((u) => (u.tooth === tooth ? { ...u, role } : u)) } : b)),
  };
}

export function removeUnit(r: Restoration, bridgeId: string, tooth: number): Restoration {
  return { ...r, bridges: r.bridges.map((b) => (b.id === bridgeId ? { ...b, units: b.units.filter((u) => u.tooth !== tooth) } : b)) };
}

export function startNewBridge(r: Restoration): Restoration {
  const kept = r.bridges.filter((b) => b.units.length > 0);
  const bridge: Bridge = { id: newId("bridge"), units: [] };
  return { ...r, bridges: [...kept, bridge], activeBridgeId: bridge.id };
}

export function removeBridge(r: Restoration, id: string): Restoration {
  const bridges = r.bridges.filter((b) => b.id !== id);
  return { ...r, bridges, activeBridgeId: r.activeBridgeId === id ? (bridges.at(-1)?.id ?? null) : r.activeBridgeId };
}

export function clearSelection(r: Restoration): Restoration {
  return { ...r, teeth: [], bridges: [], activeBridgeId: null, arches: [] };
}

/** Bridge number as shown to the user (1-based, counting filled bridges in order). */
export function bridgeNumber(r: Restoration, id: string): number {
  return r.bridges.findIndex((b) => b.id === id) + 1;
}

// --- Validation -------------------------------------------------------------------

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function todayIso(now = new Date()): string {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function validatePractice(p: PracticeDetails, today = todayIso()): FieldErrors {
  const e: FieldErrors = {};
  if (!p.practiceName.trim()) e.practiceName = "Enter the practice name.";
  if (!p.dentistName.trim()) e.dentistName = "Enter the dentist's name.";
  if (!p.email.trim()) e.email = "Enter an email address.";
  else if (!EMAIL.test(p.email.trim())) e.email = "Enter a valid email address, like name@practice.com.";
  if (p.phone.trim()) {
    const digits = p.phone.replace(/\D/g, "");
    if (!/^\+?[\d\s().-]+$/.test(p.phone.trim()) || digits.length < 6 || digits.length > 15) {
      e.phone = "Enter a valid phone number, or leave it empty.";
    }
  }
  if (!p.caseReference.trim()) e.caseReference = "Enter a case reference or patient code.";
  else if (p.caseReference.trim().length > 40) e.caseReference = "Keep the reference under 40 characters.";
  if (!p.dueDate) e.dueDate = "Choose a requested date.";
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dueDate)) e.dueDate = "Enter the date as YYYY-MM-DD.";
  else if (p.dueDate < today) e.dueDate = "The requested date can't be in the past.";
  return e;
}

export function validateRestoration(r: Restoration): FieldErrors {
  const e: FieldErrors = {};
  if (!r.workType) {
    e.workType = "Choose the type of work.";
    return e;
  }
  const type = workTypeById[r.workType];
  if (!r.material) e.material = "Choose a material.";
  if (type.selection === "teeth" && r.teeth.length === 0) {
    e.selection = type.id === "implant" ? "Select at least one restoration position on the chart." : "Select at least one tooth on the chart.";
  }
  if (type.selection === "arch" && r.arches.length === 0) e.selection = "Choose the upper arch, the lower arch or both.";
  if (type.selection === "bridge") {
    const bridges = filledBridges(r);
    if (bridges.length === 0) e.selection = "Add at least one bridge by selecting its teeth on the chart.";
    for (const b of bridges) {
      const errors = validateBridge(b);
      if (errors.length) e[`bridge:${b.id}`] = errors.join(" ");
    }
  }
  return e;
}

export function validateFiles(files: CaseFile[]): FieldErrors {
  return files.length === 0 ? { files: "Add at least one file, for example a scan or a photo." } : {};
}

export const STEPS = [
  { id: "practice", title: "Practice & case details" },
  { id: "restoration", title: "Restoration & tooth selection" },
  { id: "files", title: "Files & instructions" },
  { id: "review", title: "Review & submit" },
] as const;

export function validateStep(step: number, d: CaseDraft, today = todayIso()): FieldErrors {
  if (step === 0) return validatePractice(d.practice, today);
  if (step === 1) return validateRestoration(d.restoration);
  if (step === 2) return validateFiles(d.files);
  return {};
}

/** First step with errors, or -1 when the whole draft is ready to submit. */
export function firstInvalidStep(d: CaseDraft, today = todayIso()): number {
  for (let i = 0; i < 3; i++) if (Object.keys(validateStep(i, d, today)).length) return i;
  return -1;
}

// --- Summaries --------------------------------------------------------------------

export interface SelectionLine {
  label: string;
  detail: string;
}

export interface SelectionSummary {
  heading: string;
  lines: SelectionLine[];
}

export function summarizeSelection(r: Restoration): SelectionSummary | null {
  if (!r.workType) return null;
  const type = workTypeById[r.workType];
  if (type.selection === "arch") {
    return { heading: r.arches.length ? archesLabel(r.arches) : "No arch selected", lines: r.arches.map((a) => ({ label: ARCH_LABEL[a], detail: type.label })) };
  }
  if (type.selection === "bridge") {
    const bridges = filledBridges(r);
    return {
      heading: bridges.length ? `${bridges.length} ${bridges.length === 1 ? "bridge" : "bridges"}` : "No bridge yet",
      lines: bridges.map((b) => ({
        label: `Bridge ${bridgeNumber(r, b.id)} · ${spanLabel(b.units.map((u) => u.tooth))}`,
        detail: sortUnits(b.units)
          .map((u) => `${u.tooth} ${ROLE_LABEL[u.role]}`)
          .join(", "),
      })),
    };
  }
  return {
    heading: r.teeth.length ? `${r.teeth.length} ${r.teeth.length === 1 ? "tooth" : "teeth"}: ${r.teeth.join(", ")}` : "No teeth selected",
    lines: sortTeeth(r.teeth).map((t) => ({ label: `Tooth ${t}`, detail: `${type.toothRole} · ${getTooth(t).name}` })),
  };
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + days));
  return date.toISOString().slice(0, 10);
}
