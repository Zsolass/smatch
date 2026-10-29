import { describe, expect, it } from "vitest";
import { checkIncomingFiles, formatBytes, suggestCategory } from "@/lib/files";

const MB = 1024 * 1024;
const f = (name: string, size = 1000) => ({ name, size });
const rules = { extensions: ["stl", "ply", "obj", "zip", "jpg", "jpeg", "png", "pdf"], maxFiles: 20, maxFileBytes: 100 * MB, maxTotalBytes: 500 * MB };

describe("checkIncomingFiles", () => {
  it("accepts the supported formats, case-insensitively", () => {
    const names = ["a.stl", "b.PLY", "c.obj", "d.zip", "e.jpg", "f.JPEG", "g.png", "h.pdf"];
    const { accepted, rejected } = checkIncomingFiles(names.map((n) => f(n)), [], rules);
    expect(accepted).toHaveLength(8);
    expect(rejected).toEqual([]);
  });

  it("keeps valid files when others in the same batch fail", () => {
    const { accepted, rejected } = checkIncomingFiles([f("scan.dcm"), f("upper.stl"), f("empty.pdf", 0), f("huge.zip", 101 * MB)], [], rules);
    expect(accepted.map((a) => a.name)).toEqual(["upper.stl"]);
    expect(rejected.map((r) => r.name)).toEqual(["scan.dcm", "empty.pdf", "huge.zip"]);
    expect(rejected[0]!.reason).toMatch(/\.DCM files aren't supported/);
    expect(rejected[1]!.reason).toMatch(/empty/);
    expect(rejected[2]!.reason).toMatch(/limit is 100 MB/);
  });

  it("spots files added twice, across batches and within one", () => {
    const { accepted, rejected } = checkIncomingFiles([f("photo.jpg", 500), f("photo.jpg", 500), f("lower.stl")], [f("lower.stl")], rules);
    expect(accepted.map((a) => a.name)).toEqual(["photo.jpg"]);
    expect(rejected.map((r) => r.reason)).toEqual(["This file is already attached.", "This file is already attached."]);
  });

  it("enforces the file count and total size", () => {
    const existing = Array.from({ length: 19 }, (_, i) => f(`scan-${i}.stl`));
    const count = checkIncomingFiles([f("x.stl"), f("y.stl")], existing, rules);
    expect(count.accepted).toHaveLength(1);
    expect(count.rejected[0]!.reason).toMatch(/up to 20 files/);

    const big = Array.from({ length: 5 }, (_, i) => f(`big-${i}.zip`, 99 * MB));
    const total = checkIncomingFiles([f("more.zip", 30 * MB)], big, rules);
    expect(total.accepted).toHaveLength(0);
    expect(total.rejected[0]!.reason).toMatch(/over 500 MB/);
  });

  it("rejects names without an extension", () => {
    expect(checkIncomingFiles([f("README")], [], rules).rejected[0]!.reason).toMatch(/without an extension/);
  });
});

describe("suggestCategory", () => {
  it.each([
    ["DEMO-001_upper-scan.stl", "Upper scan"],
    ["Maxilla.ply", "Upper scan"],
    ["lower_jaw.obj", "Lower scan"],
    ["mandibular.stl", "Lower scan"],
    ["bite-registration.stl", "Bite scan"],
    ["IMG_2041.JPG", "Photos"],
    ["shade.png", "Photos"],
    ["rx-form.pdf", "Prescription"],
    ["report.pdf", "Other"],
    ["case.zip", "Other"],
  ])("%s -> %s", (name, category) => {
    expect(suggestCategory(name)).toBe(category);
  });
});

it("formats sizes", () => {
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(2048)).toBe("2 KB");
  expect(formatBytes(1.5 * MB)).toBe("1.5 MB");
  expect(formatBytes(100 * MB)).toBe("100 MB");
});
