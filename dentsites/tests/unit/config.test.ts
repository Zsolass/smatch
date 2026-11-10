import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { clinic } from "@/config/clinic";
import { siteConfig } from "@/config/site";
import { enabledTreatments, treatments } from "@/config/treatments";
import { formatFee } from "@/lib/format";

// The site is assembled from configuration, so a typo in an id would silently
// hide a case, a fee or a clinician. These checks catch that at build time.
describe("clinic configuration", () => {
  const caseIds = clinic.results.cases.map((c) => c.id);
  const feeIds = clinic.costs.fees.map((f) => f.id);
  const memberIds = clinic.team.members.map((m) => m.id);
  const treatmentIds = treatments.map((t) => t.id);

  it("has unique, URL-safe treatment ids", () => {
    expect(new Set(treatmentIds).size).toBe(treatmentIds.length);
    for (const id of treatmentIds) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("links every treatment to cases, fees and clinicians that exist", () => {
    for (const t of treatments) {
      for (const id of t.caseIds) expect(caseIds, `${t.id}: case ${id}`).toContain(id);
      for (const id of t.feeIds) expect(feeIds, `${t.id}: fee ${id}`).toContain(id);
      for (const id of t.clinicianIds) expect(memberIds, `${t.id}: clinician ${id}`).toContain(id);
      if (t.reviewedBy) expect(memberIds).toContain(t.reviewedBy.memberId);
      if (t.comparison) for (const row of t.comparison.rows) expect(row.values, `${t.id}: ${row.label}`).toHaveLength(t.comparison.columns.length);
    }
  });

  it("links every case and fee to a treatment that exists", () => {
    for (const c of clinic.results.cases) expect(treatmentIds, `case ${c.id}`).toContain(c.treatment);
    for (const f of clinic.costs.fees) if (f.treatment) expect(treatmentIds, `fee ${f.id}`).toContain(f.treatment);
  });

  it("names a lead clinician who is on the team", () => {
    if (clinic.trust.leadClinicianId) expect(memberIds).toContain(clinic.trust.leadClinicianId);
  });

  it("states staged fees that add up, per unit", () => {
    for (const fee of clinic.costs.fees) {
      if (!fee.stages) continue;
      expect(fee.stages.reduce((sum, s) => sum + s.amount, 0), fee.id).toBe(fee.amount);
    }
    const fullArch = clinic.costs.fees.find((f) => f.id === "full-arch")!;
    expect(fullArch.unit).toBe("per arch");
    expect(formatFee(fullArch)).toBe("from $21,500");
    expect(formatFee({ amount: 95 })).toBe("$95");
  });

  it("has a location with a call link, and distinct location ids", () => {
    expect(clinic.locations.length).toBeGreaterThan(0);
    for (const loc of clinic.locations) expect(loc.phoneHref).toMatch(/^tel:\+\d+$/);
    expect(new Set(clinic.locations.map((l) => l.id)).size).toBe(clinic.locations.length);
  });

  it("offers at least one treatment and one image per treatment", () => {
    expect(enabledTreatments.length).toBeGreaterThan(0);
    for (const t of enabledTreatments) expect(t.image.alt.length).toBeGreaterThan(10);
  });
});

describe("demo and production settings", () => {
  it("keeps the fictional demo out of search engines", () => {
    if (siteConfig.demo) expect(siteConfig.noindex).toBe(true);
    if (siteConfig.demo) expect(siteConfig.structuredData).toBe(false);
  });

  it("keeps public/_headers in step with the noindex setting", () => {
    const headers = readFileSync(new URL("../../public/_headers", import.meta.url), "utf8");
    const sendsNoindex = /^\s*X-Robots-Tag:\s*noindex/m.test(headers);
    expect(sendsNoindex).toBe(siteConfig.noindex);
  });

  it("needs a booking URL for link mode", () => {
    if (siteConfig.booking.mode === "link") expect(siteConfig.booking.bookingUrl).toMatch(/^https:\/\//);
  });
});
