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

  const canvasWidth = () =>
    canvas.evaluate((element) => element.getBoundingClientRect().width);
  const availableWidth = () =>
    page.evaluate(() => document.body.getBoundingClientRect().width);

  const initialCanvasWidth = await canvasWidth();
  expect(initialCanvasWidth).toBeCloseTo(await availableWidth());
  await page.setViewportSize({ width: 640, height: 540 });
  expect(await canvasWidth()).toBeCloseTo(await availableWidth());
  expect(await canvasWidth()).toBeLessThan(initialCanvasWidth);
  await page.setViewportSize({ width: 960, height: 540 });

  const heading = page.locator("h1");
  await expect(heading).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(heading).toHaveCSS("font-family", /sans-serif/);

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
