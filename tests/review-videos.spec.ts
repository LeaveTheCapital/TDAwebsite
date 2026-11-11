import { test, type Page } from "@playwright/test";

const reviewPauseMs = 1_500;

async function pauseForReview(page: Page, ms = reviewPauseMs) {
  await page.waitForTimeout(ms);
}

test("review video: animated TDA wordmark at desktop and mobile sizes", async ({
  page,
}, testInfo) => {
  await page.goto("/tda.html");
  const wordmark = page.getByRole("img", { name: "Animated outlined capitals TDA" });
  await wordmark.scrollIntoViewIfNeeded();
  await pauseForReview(page, 3_000);
  await wordmark.screenshot({ path: testInfo.outputPath("tda-wordmark-desktop.png") });

  await page.setViewportSize({ width: 375, height: 812 });
  await wordmark.scrollIntoViewIfNeeded();
  await pauseForReview(page, 3_000);
  await wordmark.screenshot({ path: testInfo.outputPath("tda-wordmark-mobile.png") });
});

test("review video: core and dashed letter animations", async ({ page }) => {
  await page.goto("/tda.html?text=GCSEB&animationDurationMs=2500&lightShow=false");
  await page.locator("#canvas").scrollIntoViewIfNeeded();
  await pauseForReview(page, 3_500);

  await page.getByLabel("Font").selectOption("dashed");
  await pauseForReview(page, 3_500);

  await page.getByLabel("Font").selectOption("core");
  await page.getByLabel("Text").fill("TDA, S-CURVE");
  await pauseForReview(page, 3_500);
});

test("review video: MIDI drums and gcses lyric journey", async ({ page }, testInfo) => {
  await page.goto("/tda.html?animationDurationMs=1200");
  await page.getByRole("button", { name: "gcses" }).click();
  await page.getByRole("button", { name: "start fake midi timer" }).click();

  await page.locator("#midi-overlay").scrollIntoViewIfNeeded();
  await pauseForReview(page, 5_000);
  await page.locator("#canvas").scrollIntoViewIfNeeded();
  await pauseForReview(page, 5_000);
  await page.screenshot({
    path: testInfo.outputPath("tda-animation-complete.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: "stop fake midi timer" }).click();
  await pauseForReview(page);
});

test("review video: dice roll", async ({ page }) => {
  await page.goto("/tda.html");
  const die = page.locator("#roll-die");
  await die.scrollIntoViewIfNeeded();
  await pauseForReview(page);
  await die.click();
  await pauseForReview(page, 4_000);
});

test("review video: MIDI CC config and demo upload", async ({ page }) => {
  await page.goto("/midicc.html");
  await pauseForReview(page);

  await page.getByRole("button", { name: "Edit gcses" }).click();
  await page.getByRole("region", { name: "gcses config" }).scrollIntoViewIfNeeded();
  await pauseForReview(page, 2_500);

  await page.getByRole("button", { name: "Switch to expanded view" }).click();
  await page.getByRole("textbox", { name: "Notes", exact: true }).fill("Video review snapshot");
  await page.getByRole("button", { name: "Upload to cloud" }).click();
  await page.locator("#upload-status").scrollIntoViewIfNeeded();
  await pauseForReview(page, 2_500);
});
