import { describe, expect, it } from "vitest";
import { exampleDraft } from "@/lib/case-submission/example";
import {
  applyBridgeClick,
  changeWorkType,
  emptyDraft,
  firstInvalidStep,
  startNewBridge,
  summarizeSelection,
  toggleArch,
  toggleTooth,
  validatePractice,
  validateRestoration,
  type Restoration,
} from "@/lib/case-submission/model";
import { reducer, initialState } from "@/lib/case-submission/reducer";

const base = (): Restoration => emptyDraft().restoration;

describe("work type changes", () => {
  it("keeps teeth between tooth-based types", () => {
    let r = changeWorkType(base(), "crown").restoration;
    r = toggleTooth(toggleTooth(r, 11), 21);
    const { restoration, messages } = changeWorkType(r, "veneer");
    expect(restoration.teeth).toEqual([11, 21]);
    expect(messages).toEqual([]);
  });

  it("clears and reports teeth when switching to bridges or arches", () => {
    let r = changeWorkType(base(), "crown").restoration;
    r = toggleTooth(toggleTooth(r, 14), 13);
    const toBridge = changeWorkType(r, "bridge");
    expect(toBridge.restoration.teeth).toEqual([]);
    expect(toBridge.messages.join(" ")).toMatch(/13, 14 were cleared/);
    const toArch = changeWorkType(r, "full-arch");
    expect(toArch.restoration.teeth).toEqual([]);
    expect(toArch.messages.join(" ")).toMatch(/recorded per arch/);
  });

  it("reports a material or shade that no longer applies", () => {
    let r = changeWorkType(base(), "crown").restoration;
    r = { ...r, material: "Full-cast gold", shade: "A2" };
    const { restoration, messages } = changeWorkType(r, "splint");
    expect(restoration.material).toBe("");
    expect(restoration.shade).toBe("");
    expect(messages).toHaveLength(2);
  });

  it("can be undone through the reducer", () => {
    let s = reducer(initialState(), { type: "workType", workType: "crown" });
    s = reducer(s, { type: "toggleTooth", tooth: 36 });
    s = reducer(s, { type: "workType", workType: "denture" });
    expect(s.notice?.messages.length).toBeGreaterThan(0);
    s = reducer(s, { type: "undoWorkType" });
    expect(s.draft.restoration.workType).toBe("crown");
    expect(s.draft.restoration.teeth).toEqual([36]);
  });
});

describe("bridge building", () => {
  it("adds teeth with roles, toggles roles and removes", () => {
    let r = changeWorkType(base(), "bridge").restoration;
    r = applyBridgeClick(r, 13, "abutment");
    r = applyBridgeClick(r, 14, "abutment");
    r = applyBridgeClick(r, 15, "abutment");
    r = applyBridgeClick(r, 14, "pontic"); // switch role
    expect(r.bridges).toHaveLength(1);
    expect(r.bridges[0]!.units.find((u) => u.tooth === 14)!.role).toBe("pontic");
    r = applyBridgeClick(r, 15, "abutment"); // same role again removes
    expect(r.bridges[0]!.units.map((u) => u.tooth)).toEqual([13, 14]);
  });

  it("keeps separate bridges apart", () => {
    let r = changeWorkType(base(), "bridge").restoration;
    for (const [t, role] of [[13, "abutment"], [14, "pontic"], [15, "abutment"]] as const) r = applyBridgeClick(r, t, role);
    r = startNewBridge(r);
    for (const [t, role] of [[34, "abutment"], [35, "pontic"], [36, "abutment"]] as const) r = applyBridgeClick(r, t, role);
    expect(r.bridges).toHaveLength(2);
    const summary = summarizeSelection(r)!;
    expect(summary.lines.map((l) => l.label)).toEqual(["Bridge 1 · 13–15", "Bridge 2 · 34–36"]);
    // Clicking a tooth of another bridge selects that bridge instead of moving the tooth.
    const first = r.bridges[0]!.id;
    r = applyBridgeClick(r, 14, "abutment");
    expect(r.activeBridgeId).toBe(first);
    expect(r.bridges[0]!.units.find((u) => u.tooth === 14)!.role).toBe("pontic");
    expect(validateRestoration({ ...r, material: "Monolithic zirconia" })).toEqual({});
  });

  it("flags a bridge with a gap", () => {
    let r = changeWorkType(base(), "bridge").restoration;
    r = applyBridgeClick(r, 13, "abutment");
    r = applyBridgeClick(r, 15, "abutment");
    const errors = validateRestoration({ ...r, material: "Monolithic zirconia" });
    expect(Object.values(errors).join(" ")).toMatch(/Add tooth 14/);
  });
});

describe("arch selection", () => {
  it("stores arches separately and never turns them into single teeth", () => {
    let r = changeWorkType(base(), "full-arch").restoration;
    r = toggleArch(toggleArch(r, "lower"), "upper");
    expect(r.arches).toEqual(["upper", "lower"]);
    expect(r.teeth).toEqual([]);
    const summary = summarizeSelection(r)!;
    expect(summary.heading).toBe("Upper and lower arches");
    expect(summary.lines).toHaveLength(2);
  });

  it("requires an arch", () => {
    const r = { ...changeWorkType(base(), "splint").restoration, material: "Hard acrylic" };
    expect(validateRestoration(r).selection).toMatch(/upper arch/);
  });
});

describe("practice details", () => {
  const valid = { practiceName: "P", dentistName: "D", email: "d@example.com", phone: "", caseReference: "DEMO-1", dueDate: "2030-01-01" };
  it("accepts complete details", () => {
    expect(validatePractice(valid, "2026-10-28")).toEqual({});
  });
  it("rejects past dates, bad email and missing fields", () => {
    const e = validatePractice({ ...valid, dueDate: "2026-10-27", email: "nope", practiceName: " " }, "2026-10-28");
    expect(Object.keys(e).sort()).toEqual(["dueDate", "email", "practiceName"]);
  });
});

describe("example case", () => {
  it("is a 13–15 zirconia bridge in shade A2 for DEMO-001", () => {
    const d = exampleDraft([], "2026-10-28");
    expect(d.practice.caseReference).toBe("DEMO-001");
    expect(d.practice.dueDate > "2026-10-28").toBe(true);
    expect(d.restoration).toMatchObject({ workType: "bridge", material: "Monolithic zirconia", shade: "A2" });
    const summary = summarizeSelection(d.restoration)!;
    expect(summary.lines[0]).toEqual({ label: "Bridge 1 · 13–15", detail: "13 Abutment, 14 Pontic, 15 Abutment" });
  });

  it("can't be submitted without files", () => {
    expect(firstInvalidStep(exampleDraft([], "2026-10-28"), "2026-10-28")).toBe(2);
    expect(firstInvalidStep(emptyDraft(), "2026-10-28")).toBe(0);
  });
});
