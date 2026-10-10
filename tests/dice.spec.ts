import { expect, test } from "@playwright/test";

test("rolls the die and announces a result", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tda.html");

  const die = page.locator("#roll-die");
  const canvas = page.locator("#dice-canvas");

  await expect(die).toHaveAttribute("aria-label", "Roll the die");
  await expect(canvas).toBeVisible();
  await die.click();

  await expect(die).toHaveAttribute("data-value", /^[1-6]$/);
  await expect(die).toHaveAttribute("data-rolling", "false");
  await expect(page.locator("#dice-result")).toHaveText(/^You rolled [1-6]$/);
  await expect(die).toHaveAttribute(
    "aria-label",
    /^Roll again\. Current result: [1-6]$/,
  );
});
