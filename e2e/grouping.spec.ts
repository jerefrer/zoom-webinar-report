import { test, expect, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const DAY1 = path.join(dir, "fixtures/day1.csv"); // 05/12/2026 → Day 1
const DAY2 = path.join(dir, "fixtures/day2.csv"); // 05/13/2026 → Day 2

async function uploadAndReachGrouping(page: Page) {
  await page.goto("/app/");
  await page.locator('input[type="file"]').setInputFiles([DAY1, DAY2]);
  await expect(page.getByText("day1.csv")).toBeVisible();
  await expect(page.getByText("day2.csv")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Review the day grouping" })).toBeVisible();
}

async function centerOf(page: Page, name: string) {
  // exact: true — "Move day1.csv" would otherwise also match "Remove day1.csv"
  // (accessible-name matching is substring, and "reMOVE" contains "move").
  const box = await page.getByRole("button", { name, exact: true }).boundingBox();
  if (!box) throw new Error(`no box for ${name}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe("day-grouping drag-and-drop", () => {
  test("auto-groups two dates into Day 1 and Day 2", async ({ page }) => {
    await uploadAndReachGrouping(page);
    await expect(page.getByText("Day 1", { exact: true })).toBeVisible();
    await expect(page.getByText("Day 2", { exact: true })).toBeVisible();
    // Initial order: day1.csv (Day 1) sits above day2.csv (Day 2).
    const c1 = await centerOf(page, "Move day1.csv");
    const c2 = await centerOf(page, "Move day2.csv");
    expect(c1.y).toBeLessThan(c2.y);
  });

  test("a dragged card stays visible (overlay) and moves to the other day", async ({ page }) => {
    await uploadAndReachGrouping(page);

    const src = await centerOf(page, "Move day1.csv");
    const dst = await centerOf(page, "Move day2.csv"); // inside the Day 2 bucket

    // Real pointer drag: dnd-kit's PointerSensor needs movement past its 4px
    // activation distance, so we move in steps rather than teleporting.
    await page.mouse.move(src.x, src.y);
    await page.mouse.down();
    await page.mouse.move(src.x + 8, src.y + 8, { steps: 4 });
    await page.mouse.move(dst.x, dst.y, { steps: 12 });

    // Mid-drag: the DragOverlay clone must be on screen (the bug was that the
    // card got clipped by the bucket's overflow-hidden and vanished). The clone
    // is a portal-rendered, position:fixed element — never clipped.
    const overlay = page.getByTestId("file-card-overlay");
    await expect(overlay).toBeVisible();
    await expect(overlay).toContainText("day1.csv");

    await page.mouse.up();

    // The overlay clone is gone once the drag ends.
    await expect(page.getByTestId("file-card-overlay")).toHaveCount(0);
    // After the drop, both files live under Day 2, so day1.csv now renders
    // BELOW day2.csv (it moved down into the second bucket).
    const after1 = await centerOf(page, "Move day1.csv");
    const after2 = await centerOf(page, "Move day2.csv");
    expect(after1.y).toBeGreaterThan(after2.y);
  });
});

test("full flow: upload → group → options → download XLSX", async ({ page }) => {
  await uploadAndReachGrouping(page);
  await page.getByRole("button", { name: "Continue" }).click();

  // Options step
  await expect(page.getByRole("heading", { name: "Report options" })).toBeVisible();
  await page.getByLabel("Event title").fill("E2E Event");
  await page.getByLabel("Viewing-time thresholds (minutes)").fill("60");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Generate report" }).click();

  // Results
  await expect(page.getByRole("heading", { name: "E2E Event" })).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Download XLSX/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
});
