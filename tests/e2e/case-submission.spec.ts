import { expect, test, type Page } from "@playwright/test";
import { collectConsoleErrors, expectNoHorizontalOverflow } from "./helpers";

const tooth = (page: Page, id: number) => page.getByRole("checkbox", { name: new RegExp(`^Tooth ${id},`) });
const bridgeTooth = (page: Page, id: number) => page.getByRole("button", { name: new RegExp(`^Tooth ${id},`) });
const summary = (page: Page) => page.getByRole("complementary", { name: "Case summary" });

/** Records any request that could carry case data off the page. */
function watchOutgoing(page: Page) {
  const sent: string[] = [];
  page.on("request", (r) => {
    if (!["GET", "HEAD"].includes(r.method())) sent.push(`${r.method()} ${r.url()}`);
  });
  return sent;
}

async function fillPractice(page: Page) {
  await page.getByLabel("Practice name").fill("E2E Test Practice (fictional)");
  await page.getByLabel("Dentist").fill("Dr. Test");
  await page.getByLabel("Email").fill("dr.test@example.com");
  await page.getByLabel("Case reference / Patient code").fill("TEST-42");
  await page.getByLabel("Requested completion date").fill("2099-01-15");
}

async function pngFile(page: Page, name: string) {
  return page.evaluateHandle(async (fileName) => {
    const canvas = document.createElement("canvas");
    canvas.width = 48;
    canvas.height = 32;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#d9cdb5";
    ctx.fillRect(0, 0, 48, 32);
    const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], fileName, { type: "image/png" }));
    return dt;
  }, name);
}

test.describe("Case submission demo", () => {
  test("service details open a prefilled case form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Crowns & Bridges/ }).click();
    const dialog = page.getByRole("dialog", { name: "Crowns & Bridges" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /Crowns & Bridges/ })).toBeFocused();

    await page.getByRole("button", { name: /Crowns & Bridges/ }).click();
    await dialog.getByRole("link", { name: /Send a bridge case/ }).click();
    await expect(page).toHaveURL(/\/submit-case\?type=bridge$/);
    await expect(summary(page)).toContainText("Bridge");
  });

  test("walks through every step from an empty form", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const outgoing = watchOutgoing(page);
    await page.goto("/submit-case");
    await expect(page.getByText("Demo only. Use sample files and fictional case details.")).toBeVisible();

    // Step 1: nothing passes until required fields are valid.
    await page.getByRole("button", { name: /Next: Restoration/ }).click();
    await expect(page.getByRole("alert").first()).toContainText("need your attention");
    await expect(page.getByLabel("Practice name")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Practice name")).toBeFocused();
    await fillPractice(page);
    await page.getByLabel("Email").fill("not-an-email");
    await page.getByLabel("Requested completion date").fill("2001-01-01");
    await expect(page.getByText("Enter a valid email address, like name@practice.com.")).toBeVisible();
    await expect(page.getByText("The requested date can't be in the past.")).toBeVisible();
    await page.getByLabel("Email").fill("dr.test@example.com");
    await page.getByLabel("Requested completion date").fill("2099-01-15");
    await page.getByRole("button", { name: /Next: Restoration/ }).click();

    // Step 2: crowns with mouse and keyboard selection.
    await expect(page.getByRole("heading", { name: "Restoration & tooth selection" })).toBeVisible();
    await page.getByRole("button", { name: /Next: Files/ }).click();
    await expect(page.getByText("Choose the type of work.")).toBeVisible();
    await page.getByText("Crown", { exact: true }).click();
    await page.getByRole("button", { name: /Next: Files/ }).click();
    await expect(page.getByText("Choose a material.")).toBeVisible();
    await expect(page.getByText("Select at least one tooth on the chart.")).toBeVisible();
    await page.getByLabel("Material").selectOption("Lithium disilicate");
    await page.getByLabel("Shade").selectOption("A2");
    await tooth(page, 13).click();
    await expect(tooth(page, 13)).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowLeft"); // along the arch toward the molars: 14
    await expect(tooth(page, 14)).toBeFocused();
    await page.keyboard.press(" ");
    await page.keyboard.press("ArrowDown"); // same position on the lower arch: 44
    await expect(tooth(page, 44)).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Selected teeth: 13, 14, 44")).toBeVisible();
    await tooth(page, 44).click(); // deselect
    await expect(page.getByText("Selected teeth: 13, 14", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Next: Files/ }).click();

    // Step 3: files via the picker and drag-and-drop.
    await page.getByRole("button", { name: /Next: Review/ }).click();
    await expect(page.getByText("Add at least one file, for example a scan or a photo.")).toBeVisible();
    const picker = page.locator('input[type="file"]');
    await picker.setInputFiles([
      { name: "upper_jaw.stl", mimeType: "model/stl", buffer: Buffer.from("solid demo\nendsolid demo\n") },
      { name: "scan.dcm", mimeType: "application/dicom", buffer: Buffer.from("DICM") },
      { name: "empty.pdf", mimeType: "application/pdf", buffer: Buffer.alloc(0) },
    ]);
    const rejection = page.getByRole("alert").filter({ hasText: "files weren't added" });
    await expect(rejection).toContainText(".DCM files aren't supported");
    await expect(rejection).toContainText("The file is empty");
    await expect(page.getByText("upper_jaw.stl", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Category for upper_jaw.stl")).toHaveValue("Upper scan");
    await picker.setInputFiles([{ name: "upper_jaw.stl", mimeType: "model/stl", buffer: Buffer.from("solid demo\nendsolid demo\n") }]);
    await expect(page.getByRole("alert").filter({ hasText: "wasn't added" })).toContainText("already attached");

    const dropzone = page.getByTestId("dropzone");
    const dt = await pngFile(page, "intraoral-photo.png");
    await dropzone.dispatchEvent("dragenter", { dataTransfer: dt });
    await expect(dropzone).toHaveAttribute("data-dragging", "true");
    await expect(dropzone).toContainText("Drop to add the files");
    await dropzone.dispatchEvent("drop", { dataTransfer: dt });
    await expect(page.getByLabel("Category for intraoral-photo.png")).toHaveValue("Photos");
    const thumb = page.locator("li", { hasText: "intraoral-photo.png" }).locator("img");
    await expect(thumb).toHaveJSProperty("complete", true);
    expect(await thumb.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(48);
    await page.getByLabel("Category for upper_jaw.stl").selectOption("Bite scan");
    await page.getByLabel("Instructions for the lab").fill("E2E test instructions.");
    await page.getByRole("button", { name: /Next: Review/ }).click();

    // Step 4: review, edit and come back without losing anything.
    await expect(page.getByRole("heading", { name: "Review & submit" })).toBeVisible();
    const review = page.locator("main");
    for (const text of ["E2E Test Practice (fictional)", "TEST-42", "15 January 2099", "Crown", "Lithium disilicate", "A2", "Tooth 13", "Tooth 14", "upper_jaw.stl", "Bite scan", "intraoral-photo.png", "E2E test instructions."]) {
      await expect(review).toContainText(text);
    }
    await page.getByRole("button", { name: "Edit Restoration & teeth" }).click();
    await expect(page.getByLabel("Material")).toHaveValue("Lithium disilicate");
    await expect(tooth(page, 14)).toHaveAttribute("aria-checked", "true");
    await page.getByRole("button", { name: "Save and return to review" }).click();
    await page.getByRole("button", { name: "Edit Files & instructions" }).click();
    await expect(page.getByText("intraoral-photo.png", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Save and return to review" }).click();

    await page.getByRole("button", { name: "Submit demo case" }).click();
    await expect(page.getByText("Demo completed. No case or files were sent to a laboratory.")).toBeVisible();
    await expect(page.getByText(/DEMO-[A-Z0-9]{6}/)).toBeVisible();
    await expect(page.locator("main")).toContainText("Lithium disilicate");

    await page.getByRole("button", { name: "Start a new demo case" }).click();
    await expect(page.getByLabel("Practice name")).toHaveValue("");
    expect(outgoing).toEqual([]);
    expect(errors).toEqual([]);
  });

  test("example case: 13–15 zirconia bridge, submitted without sending anything", async ({ page }) => {
    const outgoing = watchOutgoing(page);
    await page.goto("/submit-case");
    await page.getByRole("button", { name: "Load example case" }).click();
    await expect(page.getByText(/Example case DEMO-001 loaded/)).toBeVisible();
    await expect(page.getByLabel("Case reference / Patient code")).toHaveValue("DEMO-001");
    await page.getByRole("button", { name: /Next: Restoration/ }).click();
    await expect(bridgeTooth(page, 13)).toHaveAccessibleName(/abutment in bridge 1/);
    await expect(bridgeTooth(page, 14)).toHaveAccessibleName(/pontic in bridge 1/);
    await expect(bridgeTooth(page, 15)).toHaveAccessibleName(/abutment in bridge 1/);
    await expect(summary(page)).toContainText("Bridge 1 · 13–15");
    await expect(summary(page)).toContainText("13 Abutment, 14 Pontic, 15 Abutment");
    await page.getByRole("button", { name: /Next: Files/ }).click();
    for (const name of ["DEMO-001_upper-scan.stl", "DEMO-001_lower-scan.stl", "DEMO-001_bite-scan.ply", "DEMO-001_shade-photo.jpg", "DEMO-001_prescription.pdf"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: /Next: Review/ }).click();
    await expect(page.locator("main")).toContainText("Monolithic zirconia");
    await expect(page.locator("main")).toContainText("A2");
    await page.getByRole("button", { name: "Submit demo case" }).click();
    await expect(page.getByText("Demo completed. No case or files were sent to a laboratory.")).toBeVisible();
    expect(outgoing).toEqual([]);
  });

  test("bridges: across the midline, several spans, roles and removal", async ({ page }) => {
    await page.goto("/submit-case?type=bridge");
    await page.getByRole("button", { name: /Next: Restoration/ }).click(); // blocked by step 1
    await fillPractice(page);
    await page.getByRole("button", { name: /Next: Restoration/ }).click();
    await page.getByLabel("Material").selectOption("Monolithic zirconia");

    await bridgeTooth(page, 12).click();
    await page.getByRole("radio", { name: "Pontic" }).click();
    await bridgeTooth(page, 11).click();
    await bridgeTooth(page, 21).click();
    await page.getByRole("radio", { name: "Abutment" }).click();
    await bridgeTooth(page, 22).click();
    await expect(summary(page)).toContainText("Bridge 1 · 12–22");

    await page.getByRole("button", { name: "Add another bridge" }).click();
    await bridgeTooth(page, 34).click();
    await bridgeTooth(page, 36).click();
    await expect(page.getByText(/Bridge teeth must be next to each other\. Add tooth 35/)).toBeVisible();
    await page.getByRole("radio", { name: "Pontic" }).click();
    await bridgeTooth(page, 35).click();
    await expect(summary(page)).toContainText("Bridge 2 · 34–36");
    await expect(summary(page)).toContainText("34 Abutment, 35 Pontic, 36 Abutment");
    await expect(summary(page)).toContainText("12 Abutment, 11 Pontic, 21 Pontic, 22 Abutment");

    // Change a role from the list, then remove a tooth and a whole bridge.
    await page.getByLabel("Role of tooth 21 in bridge 1").selectOption("abutment");
    await expect(bridgeTooth(page, 21)).toHaveAccessibleName(/abutment in bridge 1/);
    await page.getByRole("button", { name: "Remove tooth 36 from bridge 2" }).click();
    await expect(summary(page)).toContainText("34 Abutment, 35 Pontic");
    await page.getByRole("button", { name: "Remove bridge 1" }).click();
    await expect(summary(page)).not.toContainText("12–22");
    await expect(summary(page)).toContainText("1 bridge");

    await page.getByRole("button", { name: /Next: Files/ }).click();
    await expect(page.getByRole("heading", { name: "Files & instructions", level: 2 })).toBeVisible();
  });

  test("switching work type reports cleared choices and can be undone", async ({ page }) => {
    await page.goto("/submit-case?type=crown");
    await fillPractice(page);
    await page.getByRole("button", { name: /Next: Restoration/ }).click();
    await page.getByLabel("Material").selectOption("Full-cast gold");
    await tooth(page, 11).click();
    await tooth(page, 21).click();
    await page.getByText("Full-Arch Restoration", { exact: true }).click();
    const notice = page.getByRole("alert").filter({ hasText: "didn't fit the new work type" });
    await expect(notice).toContainText("Selected teeth 11, 21 were cleared");
    await expect(notice).toContainText("Full-cast gold");
    await notice.getByRole("button", { name: "Undo" }).click();
    await expect(tooth(page, 11)).toHaveAttribute("aria-checked", "true");
    await expect(page.getByLabel("Material")).toHaveValue("Full-cast gold");

    // Full-arch work is recorded per arch, not as 16 single teeth.
    await page.getByText("Full-Arch Restoration", { exact: true }).click();
    await page.getByRole("button", { name: "Dismiss" }).click();
    await page.getByRole("button", { name: "Both" }).click();
    await expect(summary(page)).toContainText("Upper and lower arches");
    await expect(page.getByRole("button", { name: "Upper", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByLabel("Material").selectOption("Zirconia full-arch");
    await page.getByRole("button", { name: /Next: Files/ }).click();
    await page.locator('input[type="file"]').setInputFiles([{ name: "lower.ply", mimeType: "application/octet-stream", buffer: Buffer.from("ply\n") }]);
    await page.getByRole("button", { name: /Next: Review/ }).click();
    await expect(page.locator("main")).toContainText("Upper arch");
    await expect(page.locator("main")).toContainText("Lower arch");
    await expect(page.locator("main")).not.toContainText("Tooth 11");
  });

  test("a reload starts a clean case and nothing is stored locally", async ({ page }) => {
    await page.goto("/submit-case");
    await page.getByRole("button", { name: "Load example case" }).click();
    await expect(page.getByLabel("Practice name")).not.toHaveValue("");
    await page.reload();
    await expect(page.getByLabel("Practice name")).toHaveValue("");
    expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);
  });

  test("mobile: zoomed chart, collapsible summary and no sideways scrolling", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto("/submit-case");
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "Load example case" }).click();
    await page.getByRole("button", { name: /Next: Restoration/ }).click();
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("button", { name: "Show Upper right (Q1)" })).toHaveAttribute("aria-pressed", "true");
    const box = await bridgeTooth(page, 16).boundingBox();
    expect(Math.min(box!.width, box!.height)).toBeGreaterThanOrEqual(36);
    await bridgeTooth(page, 16).tap();
    await expect(bridgeTooth(page, 16)).toHaveAccessibleName(/abutment in bridge 1/);
    await page.locator("details > summary").click();
    await expect(page.locator("details[open]")).toContainText("Bridge 1 · 13–16");
    for (const next of [/Next: Files/, /Next: Review/]) {
      await page.getByRole("button", { name: next }).click();
      await expectNoHorizontalOverflow(page);
    }
    await context.close();
  });
});
