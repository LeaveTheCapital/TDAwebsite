import { expect, test } from "@playwright/test";

test("uses a short visible roll when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tda.html");

  const die = page.locator("#roll-die");
  const canvas = page.locator("#dice-canvas");

  await expect(die).toHaveAttribute("aria-label", "Roll the die");
  await expect(canvas).toBeVisible();
  await die.click();

  await expect(die).toHaveAttribute("data-rolling", "true");
  await expect(page.locator("#dice-result")).toHaveText("Rolling…");
  await page.waitForTimeout(100);
  await expect(die).toHaveAttribute("data-rolling", "true");

  await expect(die).toHaveAttribute("data-value", /^[1-6]$/);
  await expect(die).toHaveAttribute("data-rolling", "false");
  await expect(page.locator("#dice-result")).toHaveText(/^You rolled [1-6]$/);
  await expect(die).toHaveAttribute(
    "aria-label",
    /^Roll again\. Current result: [1-6]$/,
  );
});

test("keeps the full roll animation without reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/tda.html");

  const die = page.locator("#roll-die");
  await die.click();

  await expect(die).toHaveAttribute("data-rolling", "true");
  await page.waitForTimeout(4000);
  await expect(die).toHaveAttribute("data-rolling", "true");
  await expect(die).toHaveAttribute("data-value", /^[1-6]$/);
  await expect(die).toHaveAttribute("data-rolling", "false");
});
