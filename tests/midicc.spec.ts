import { expect, test } from "@playwright/test";

const draftKey = "tda-midi-cc-config-v1";
const uploadKey = "tda-midi-cc-config-cloud-demo-v1";

test("shows each song config from its setlist edit button without editable fields", async ({ page }) => {
  await page.goto("/midicc.html");

  const editButtons = page.locator(".setlist-edit-button");
  await expect(editButtons).toHaveCount(3);

  const gcsesEdit = page.getByRole("button", { name: "Edit gcses" });
  await expect(gcsesEdit).toHaveAttribute("aria-expanded", "false");
  await gcsesEdit.click();

  const config = page.getByRole("region", { name: "gcses config" });
  await expect(config).toBeVisible();
  await expect(gcsesEdit).toHaveAttribute("aria-expanded", "true");
  await expect(config.getByText("Read only")).toBeVisible();
  await expect(config.getByRole("heading", { name: "01 · Intro" })).toBeVisible();
  await expect(config.getByText("drum intro")).toBeVisible();
  await expect(config.locator("input, textarea, select")).toHaveCount(0);

  await gcsesEdit.click();
  await expect(config).toBeHidden();
});

test("uploads the complete current config as an independent persistent snapshot", async ({ page }) => {
  await page.goto("/midicc.html");
  await page.getByRole("button", { name: "Switch to expanded view" }).click();
  await page.locator('[name="oxiE16.0.description"]').fill("Filter cutoff");
  await page.locator('[name="elektronTonverk.15.description"]').fill("Main mix");
  await page.getByRole("textbox", { name: "Notes", exact: true }).fill("First snapshot");
  expect(await page.evaluate((key) => localStorage.getItem(key), uploadKey)).toBeNull();
  await page.getByRole("button", { name: "Upload to cloud" }).click();
  await expect(page.locator("#upload-status")).toHaveText("Demo upload saved in this browser.");
  const snapshot = await page.evaluate((key) => localStorage.getItem(key), uploadKey);
  const draft = await page.evaluate((key) => localStorage.getItem(key), draftKey);
  expect(JSON.parse(snapshot ?? "null") as unknown).toEqual(JSON.parse(draft ?? "null"));
  await page.getByRole("textbox", { name: "Notes", exact: true }).fill("Later edit");
  expect(await page.evaluate((key) => localStorage.getItem(key), uploadKey)).toBe(snapshot);
  await page.reload();
  await expect(page.locator("#config-notes")).toHaveValue("Later edit");
  expect(await page.evaluate((key) => localStorage.getItem(key), uploadKey)).toBe(snapshot);
  await page.getByRole("button", { name: "Upload to cloud" }).click();
  await expect(page.locator("#upload-status")).toHaveText("Demo upload saved in this browser.");
  expect(await page.evaluate((key) => localStorage.getItem(key), uploadKey)).not.toBe(snapshot);
});

test("reports failed uploads and allows retry without changing the draft", async ({ page }) => {
  await page.goto("/midicc.html");
  await page.locator("#config-notes").fill("Keep my draft");
  const draft = await page.evaluate((key) => localStorage.getItem(key), draftKey);
  await page.evaluate((key) => {
    const original = localStorage.setItem.bind(localStorage);
    Storage.prototype.setItem = function (name: string, value: string): void {
      if (name === key) {
        throw new DOMException("Storage full", "QuotaExceededError");
      }
      original(name, value);
    };
  }, uploadKey);
  await page.getByRole("button", { name: "Upload to cloud" }).click();
  await expect(page.locator("#upload-status")).toContainText("Upload failed");
  await expect(page.getByRole("button", { name: "Upload to cloud" })).toBeEnabled();
  expect(await page.evaluate((key) => localStorage.getItem(key), draftKey)).toBe(draft);
  await page.reload();
  await page.getByRole("button", { name: "Upload to cloud" }).click();
  await expect(page.locator("#upload-status")).toHaveText("Demo upload saved in this browser.");
});
