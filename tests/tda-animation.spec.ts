import { test, expect } from "@playwright/test";

test("records the complete TDA canvas animation", async ({ page }, testInfo) => {
  const browserErrors: string[] = [];

  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.addInitScript(() => {
    const listeners: Record<string, Array<(event: unknown) => void>> = {};
    const input = {
      id: "test-midi-input",
      manufacturer: "Playwright",
      name: "Midi Through Port-0",
      state: "connected",
      connection: "open",
      type: "input",
      onmidimessage: null as null | ((event: unknown) => void),
      onstatechange: null,
      addEventListener: (type: string, listener: (event: unknown) => void) => {
        listeners[type] ??= [];
        listeners[type].push(listener);
      },
      removeEventListener: () => {},
      open: () => Promise.resolve(input),
      close: () => Promise.resolve(input),
    };
    const midiAccess = {
      inputs: new Map([[input.id, input]]),
      outputs: new Map(),
      sysexEnabled: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    Object.defineProperty(navigator, "requestMIDIAccess", {
      configurable: true,
      value: () => Promise.resolve(midiAccess),
    });

    globalThis.testMidi = {
      ready: () => typeof input.onmidimessage === "function",
      emit: (type: "clock" | "start") => {
        const data = new Uint8Array([type === "clock" ? 0xf8 : 0xfa]);
        input.onmidimessage?.({ data, receivedTime: performance.now() });
      },
    };
  });

  await page.goto("/tda.html?text=TDA&animationDurationMs=2000");
  await page.waitForFunction(() => globalThis.testMidi?.ready());
  await expect(page.getByRole("button", { name: "start fake midi timer" })).toBeHidden();
  await expect(page.getByRole("button", { name: "stop fake midi timer" })).toBeHidden();

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-text", "TDA");
  const midiOverlay = page.locator("#midi-overlay");
  const circleCentreAlpha = (side: "left" | "right") =>
    midiOverlay.evaluate<number, "left" | "right", HTMLCanvasElement>((element, circleSide) => {
      const x = element.width * (circleSide === "left" ? 0.35 : 0.65);
      const y = element.height - (element.width / 32) * 1.5;
      const context = element.getContext("2d");
      if (!context) {
        throw new Error("Canvas context unavailable.");
      }
      return context.getImageData(x, y, 1, 1).data[3];
    }, side);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "false");

  await page.evaluate(() => globalThis.testMidi?.emit("start"));
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 128, 0)"
  );

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-circle-side", "left");
  expect(await circleCentreAlpha("left")).toBeGreaterThan(0);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "false");
  expect(await circleCentreAlpha("left")).toBe(0);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-circle-side", "right");
  expect(await circleCentreAlpha("right")).toBeGreaterThan(0);

  await expect(canvas).toHaveAttribute("data-animation-state", "complete");
  expect(await page.evaluate(() => window.animationTiming.durationMs)).toBe(2000);

  const canvasWidth = () =>
    canvas.evaluate<number, undefined, HTMLCanvasElement>((element) =>
      element.getBoundingClientRect().width,
    );
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

  const drawnPixelCount = await canvas.evaluate<
    number,
    undefined,
    HTMLCanvasElement
  >((element) => {
    const context = element.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable.");
    }
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

test("positions repeated query-string letters before the light show", async ({
  page,
}) => {
  const browserErrors: string[] = [];

  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.addInitScript(() => {
    const midiAccess = {
      inputs: new Map(),
      outputs: new Map(),
      sysexEnabled: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    Object.defineProperty(navigator, "requestMIDIAccess", {
      configurable: true,
      value: () => Promise.resolve(midiAccess),
    });
  });

  await page.goto("/tda.html?text=adta&animationDurationMs=1000");

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-text", "ADTA");
  await expect(canvas).toHaveAttribute("data-animation-state", "complete");

  const occupiedSlots = await canvas.evaluate<
    boolean[],
    undefined,
    HTMLCanvasElement
  >((element) => {
    const context = element.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable.");
    }

    const slotCount = 4;
    const letterWidth = element.width / (slotCount + 2);
    const padding =
      (element.width - slotCount * letterWidth) / (slotCount + 1);

    return Array.from({ length: slotCount }, (_, index) => {
      const x = padding + index * (letterWidth + padding);
      const pixels = context.getImageData(
        x,
        padding,
        letterWidth,
        letterWidth,
      ).data;

      for (let pixel = 3; pixel < pixels.length; pixel += 4) {
        if (pixels[pixel] !== 0) {
          return true;
        }
      }

      return false;
    });
  });

  expect(occupiedSlots).toEqual([true, true, true, true]);
  expect(browserErrors).toEqual([]);
});

test("offers a 120 BPM MIDI clock when no input is available", async ({ page }) => {
  const browserErrors: string[] = [];

  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });

  await page.addInitScript(() => {
    const midiAccess = {
      inputs: new Map(),
      outputs: new Map(),
      sysexEnabled: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    Object.defineProperty(navigator, "requestMIDIAccess", {
      configurable: true,
      value: () => Promise.resolve(midiAccess),
    });
  });

  await page.goto("/tda.html?text=TDA&animationDurationMs=2000");

  const startButton = page.getByRole("button", { name: "start fake midi timer" });
  const stopButton = page.getByRole("button", { name: "stop fake midi timer" });
  const midiOverlay = page.locator("#midi-overlay");

  await expect(startButton).toBeVisible();
  await expect(stopButton).toBeVisible();
  await expect(startButton).toBeEnabled();
  await expect(stopButton).toBeDisabled();
  await startButton.click();
  await expect(startButton).toBeDisabled();
  await expect(stopButton).toBeEnabled();
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 128, 0)",
  );
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "true", {
    timeout: 900,
  });
  await expect(midiOverlay).toHaveAttribute("data-circle-side", "left");
  await stopButton.click();
  await expect(startButton).toBeEnabled();
  await expect(stopButton).toBeDisabled();
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "false");
  await page.waitForTimeout(600);
  await expect(midiOverlay).toHaveAttribute("data-circle-visible", "false");
  expect(browserErrors).toEqual([]);
});
