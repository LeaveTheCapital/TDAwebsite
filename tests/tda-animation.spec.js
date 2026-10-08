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
      body: `const listeners = {};
      const input = {
        id: "test-midi-input",
        manufacturer: "Playwright",
        name: "Midi Through Port-0",
        state: "connected",
        type: "input",
        channels: [undefined, { addListener: () => {} }],
        addListener: (type, listener) => {
          listeners[type] ??= [];
          listeners[type].push(listener);
        }
      };
      globalThis.WebMidi = {
        inputs: [input],
        enable: async () => {},
        addListener: () => {}
      };
      globalThis.testMidi = {
        emit: (type) => {
          for (const listener of listeners[type] ?? []) {
            listener({ type, message: { type } });
          }
        }
      };`,
    })
  );

  await page.goto("/tda.html?animationDurationMs=1000");

  const canvas = page.locator("#canvas");
  const midiOverlay = page.locator("#midi-overlay");
  const circleCentreAlpha = (side) =>
    midiOverlay.evaluate((element, circleSide) => {
      const x = element.width * (circleSide === "left" ? 0.35 : 0.65);
      const y = element.height - (element.width / 24) * 1.5;
      return element.getContext("2d").getImageData(x, y, 1, 1).data[3];
    }, side);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "false");

  await page.evaluate(() => globalThis.testMidi.emit("start"));
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 128, 0)"
  );

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-circle-side", "left");
  expect(await circleCentreAlpha("left")).toBeGreaterThan(0);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "false");
  expect(await circleCentreAlpha("left")).toBe(0);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-circle-side", "right");
  expect(await circleCentreAlpha("right")).toBeGreaterThan(0);

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
