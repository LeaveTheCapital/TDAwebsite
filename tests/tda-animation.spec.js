const { test, expect } = require("@playwright/test");

test("records the complete TDA canvas animation", async ({ page }, testInfo) => {
  const browserErrors = [];

  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.route("https://cdn.jsdelivr.net/**", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `globalThis.WebMidi = {
        inputs: [],
        enable: async () => {},
        addListener: () => {}
      };`,
    })
  );

  await page.goto("/tda.html?animationDurationMs=1000");

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-animation-state", "complete");
  expect(await page.evaluate(() => window.animationTiming.durationMs)).toBe(1000);

  const drawnPixelCount = await canvas.evaluate((element) => {
    const context = element.getContext("2d");
    const pixels = context.getImageData(0, 0, element.width, element.height).data;
    let count = 0;

    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] !== 0) {
        count += 1;
      }
    }

    return count;
  });

  expect(drawnPixelCount).toBeGreaterThan(100);

  const finalScreenshot = testInfo.outputPath("tda-animation-complete.png");
  await page.screenshot({ path: finalScreenshot, fullPage: true });
  await testInfo.attach("completed animation", {
    path: finalScreenshot,
    contentType: "image/png",
  });

  expect(browserErrors).toEqual([]);
});
