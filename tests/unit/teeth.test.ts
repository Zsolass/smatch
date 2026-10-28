import { describe, expect, it } from "vitest";
import { ARCH_ORDER, areAdjacent, getTooth, sortUnits, spanLabel, TEETH, validateBridge } from "@/lib/teeth";
import { GEOMETRY_BY_ID } from "@/lib/odontogram-geometry";

describe("FDI tooth model", () => {
  it("has the 32 permanent teeth", () => {
    expect(TEETH).toHaveLength(32);
    expect(new Set(TEETH.map((t) => t.id)).size).toBe(32);
  });

  it("lays out arches as the dentist faces the patient", () => {
    expect(ARCH_ORDER.upper).toEqual([18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28]);
    expect(ARCH_ORDER.lower).toEqual([48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]);
  });

  it("names the patient's sides by quadrant", () => {
    expect(getTooth(13)).toMatchObject({ arch: "upper", side: "right", type: "canine", name: "upper right canine" });
    expect(getTooth(26)).toMatchObject({ arch: "upper", side: "left", type: "molar" });
    expect(getTooth(36)).toMatchObject({ arch: "lower", side: "left", name: "lower left first molar" });
    expect(getTooth(41)).toMatchObject({ arch: "lower", side: "right", type: "incisor" });
  });

  it("draws the patient's right on the viewer's left", () => {
    const x = (id: number) => GEOMETRY_BY_ID.get(id)!.x;
    expect(x(18)).toBeLessThan(x(11));
    expect(x(11)).toBeLessThan(x(21));
    expect(x(21)).toBeLessThan(x(28));
    expect(x(48)).toBeLessThan(x(41));
    expect(x(41)).toBeLessThan(x(31));
    const y = (id: number) => GEOMETRY_BY_ID.get(id)!.y;
    expect(y(11)).toBeLessThan(y(41)); // upper arch above lower arch
  });

  it("treats neighbours across the midline as adjacent", () => {
    expect(areAdjacent(11, 21)).toBe(true);
    expect(areAdjacent(41, 31)).toBe(true);
    expect(areAdjacent(13, 14)).toBe(true);
    expect(areAdjacent(13, 15)).toBe(false);
    expect(areAdjacent(18, 28)).toBe(false);
    expect(areAdjacent(11, 41)).toBe(false);
  });
});

describe("bridges", () => {
  const bridge = (units: [number, "abutment" | "pontic"][]) => ({ id: "b", units: units.map(([tooth, role]) => ({ tooth, role })) });

  it("accepts the 13–15 example bridge", () => {
    expect(validateBridge(bridge([[13, "abutment"], [14, "pontic"], [15, "abutment"]]))).toEqual([]);
  });

  it("accepts a bridge across the midline", () => {
    expect(validateBridge(bridge([[12, "abutment"], [11, "pontic"], [21, "pontic"], [22, "abutment"]]))).toEqual([]);
  });

  it("reports missing teeth between units", () => {
    const errors = validateBridge(bridge([[13, "abutment"], [15, "abutment"]]));
    expect(errors.join(" ")).toMatch(/Add tooth 14/);
  });

  it("rejects spans over both arches", () => {
    expect(validateBridge(bridge([[11, "abutment"], [41, "pontic"]])).join(" ")).toMatch(/same arch/);
  });

  it("needs at least one abutment and one pontic", () => {
    expect(validateBridge(bridge([[13, "abutment"], [14, "abutment"]])).join(" ")).toMatch(/pontic/);
    expect(validateBridge(bridge([[13, "pontic"], [14, "pontic"]])).join(" ")).toMatch(/abutment/);
    expect(validateBridge(bridge([[13, "abutment"]])).join(" ")).toMatch(/at least two/);
  });

  it("labels spans the way dentists write them", () => {
    expect(spanLabel([15, 13, 14])).toBe("13–15");
    expect(spanLabel([22, 11, 12, 21])).toBe("12–22");
    expect(spanLabel([34, 36])).toBe("34, 36");
    expect(sortUnits(bridge([[15, "abutment"], [13, "abutment"], [14, "pontic"]]).units).map((u) => u.tooth)).toEqual([13, 14, 15]);
  });
});
