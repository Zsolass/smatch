// Case submission demo: work types, materials, shades and file rules.
// Change these lists to match what the lab actually offers.

export type SelectionMode = "teeth" | "bridge" | "arch";

export interface WorkType {
  id: WorkTypeId;
  label: string;
  selection: SelectionMode;
  /** Wording for selected teeth in summaries, e.g. "Crown" or "Restoration position". */
  toothRole: string;
  materials: string[];
  shade: boolean;
  /** Short guidance shown above the tooth chart. */
  hint: string;
}

export type WorkTypeId = "crown" | "bridge" | "veneer" | "implant" | "full-arch" | "denture" | "splint";

export const workTypes: WorkType[] = [
  {
    id: "crown",
    label: "Crown",
    selection: "teeth",
    toothRole: "Crown",
    materials: ["Monolithic zirconia", "Layered zirconia", "Lithium disilicate", "PFM (porcelain-fused-to-metal)", "Full-cast gold"],
    shade: true,
    hint: "Select every tooth that needs a crown.",
  },
  {
    id: "bridge",
    label: "Bridge",
    selection: "bridge",
    toothRole: "Bridge unit",
    materials: ["Monolithic zirconia", "Layered zirconia", "Lithium disilicate", "PFM (porcelain-fused-to-metal)"],
    shade: true,
    hint: "Choose Abutment or Pontic, then select adjacent teeth on one arch. Add another bridge for a separate span.",
  },
  {
    id: "veneer",
    label: "Veneer",
    selection: "teeth",
    toothRole: "Veneer",
    materials: ["Lithium disilicate", "Feldspathic porcelain", "Composite"],
    shade: true,
    hint: "Select every tooth that needs a veneer.",
  },
  {
    id: "implant",
    label: "Implant Restoration",
    selection: "teeth",
    toothRole: "Restoration position",
    materials: ["Zirconia crown on Ti-base", "Screw-retained zirconia crown", "Custom titanium abutment + crown", "PFM on custom abutment"],
    shade: true,
    hint: "Mark where the restorations go. Implant details come from your scan bodies and instructions.",
  },
  {
    id: "full-arch",
    label: "Full-Arch Restoration",
    selection: "arch",
    toothRole: "Arch",
    materials: ["Zirconia full-arch", "Hybrid (titanium bar + acrylic)", "PMMA provisional"],
    shade: true,
    hint: "Choose the upper arch, the lower arch or both.",
  },
  {
    id: "denture",
    label: "Denture",
    selection: "arch",
    toothRole: "Arch",
    materials: ["Milled complete denture", "Printed complete denture", "Try-in denture"],
    shade: true,
    hint: "Choose the upper arch, the lower arch or both.",
  },
  {
    id: "splint",
    label: "Splint / Night Guard",
    selection: "arch",
    toothRole: "Arch",
    materials: ["Hard acrylic", "Hard/soft dual laminate", "Soft thermoformed"],
    shade: false,
    hint: "Choose the upper arch, the lower arch or both.",
  },
];

export const workTypeById = Object.fromEntries(workTypes.map((w) => [w.id, w])) as Record<WorkTypeId, WorkType>;

export function isWorkTypeId(value: unknown): value is WorkTypeId {
  return typeof value === "string" && value in workTypeById;
}

export const shades = ["A1", "A2", "A3", "A3.5", "A4", "B1", "B2", "B3", "B4", "C1", "C2", "C3", "C4", "D2", "D3", "D4", "Bleach shade"];

export const fileCategories = ["Upper scan", "Lower scan", "Bite scan", "Photos", "Prescription", "Other"] as const;
export type FileCategory = (typeof fileCategories)[number];

export const fileRules = {
  extensions: ["stl", "ply", "obj", "zip", "jpg", "jpeg", "png", "pdf"],
  maxFiles: 20,
  maxFileBytes: 100 * 1024 * 1024,
  maxTotalBytes: 500 * 1024 * 1024,
};

/** Small, real sample files served from /public/demo-files for "Load example case". */
export const exampleFiles: { path: string; category: FileCategory; type: string }[] = [
  { path: "/demo-files/DEMO-001_upper-scan.stl", category: "Upper scan", type: "model/stl" },
  { path: "/demo-files/DEMO-001_lower-scan.stl", category: "Lower scan", type: "model/stl" },
  { path: "/demo-files/DEMO-001_bite-scan.ply", category: "Bite scan", type: "application/octet-stream" },
  { path: "/demo-files/DEMO-001_shade-photo.jpg", category: "Photos", type: "image/jpeg" },
  { path: "/demo-files/DEMO-001_prescription.pdf", category: "Prescription", type: "application/pdf" },
];
