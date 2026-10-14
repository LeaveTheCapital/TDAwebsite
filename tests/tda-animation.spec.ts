import { test, expect, type Page } from "@playwright/test";
import {
  bDefinition,
  cDefinition,
  commaDefinition,
  eDefinition,
  sDefinition,
  type GlyphDefinition,
  type GlyphPixelContract,
} from "../src/glyphs.ts";

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

test("positions query-string letters, including G, E, S, C and B, before the light show", async ({
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

  await page.goto("/tda.html?text=gcseb&animationDurationMs=1000");

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-text", "GCSEB");
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

    const slotCount = 5;
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

  expect(occupiedSlots).toEqual([true, true, true, true, true]);
  expect(browserErrors).toEqual([]);
});

test("draws the outlined G with an open lower-right bar junction", async ({
  page,
}) => {
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

  await page.goto("/tda.html?text=G&animationDurationMs=1000");

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-animation-state", "complete");

  const segments = await canvas.evaluate<
    Record<string, boolean>,
    undefined,
    HTMLCanvasElement
  >((element) => {
    const context = element.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable.");
    }

    const letterWidth = element.width / 3;
    const padding = (element.width - letterWidth) / 2;
    const centreX = padding + letterWidth / 2;
    const centreY = padding + letterWidth / 2;
    const innerRadius = letterWidth * 0.32;
    const junctionX = centreX + innerRadius * Math.cos(Math.PI / 6);
    const junctionY = centreY + innerRadius * Math.sin(Math.PI / 6);
    const outerJunctionX =
      centreX +
      (letterWidth / 2) * Math.cos(Math.asin(0.32));
    const barTopY = padding + letterWidth * 0.48;

    const hasGStroke = (x: number, y: number) => {
      const radius = 3;
      const pixels = context.getImageData(
        Math.round(x) - radius,
        Math.round(y) - radius,
        radius * 2 + 1,
        radius * 2 + 1,
      ).data;

      for (let index = 0; index < pixels.length; index += 4) {
        if (
          pixels[index] < 80 &&
          pixels[index + 1] > 100 &&
          pixels[index + 2] > 100 &&
          pixels[index + 3] > 0
        ) {
          return true;
        }
      }

      return false;
    };

    return {
      leftVertical: hasGStroke(centreX, (barTopY + junctionY) / 2),
      rightVertical: hasGStroke(
        outerJunctionX,
        (barTopY + junctionY) / 2,
      ),
      lowerLeft: hasGStroke((centreX + junctionX) / 2, junctionY),
      lowerRight: hasGStroke(
        (junctionX + outerJunctionX) / 2,
        junctionY,
      ),
      curveJunction: hasGStroke(junctionX, junctionY),
    };
  });

  expect(segments).toEqual({
    leftVertical: true,
    rightVertical: true,
    lowerLeft: true,
    lowerRight: false,
    curveJunction: true,
  });
});

interface PixelColourRange {
  red: [number, number];
  green: [number, number];
  blue: [number, number];
}

interface GlyphContractArguments {
  pixelContract: GlyphPixelContract;
  colour: PixelColourRange;
}

async function expectGlyphPixelContract(
  page: Page,
  letter: string,
  definition: GlyphDefinition,
  colour: PixelColourRange,
) {
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

  await page.goto(
    `/tda.html?text=${letter}&lightShow=false&animationDurationMs=1000`,
  );

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-letter-animation-state", "complete");
  await expect(canvas).toHaveAttribute("data-animation-state", "complete");

  const contractResult = await canvas.evaluate<
    { required: boolean[]; forbidden: boolean[] },
    GlyphContractArguments,
    HTMLCanvasElement
  >((element, contract) => {
    const context = element.getContext("2d");
    if (!context) {
      throw new Error("Canvas context unavailable.");
    }

    const letterWidth = element.width / 3;
    const padding = (element.width - letterWidth) / 2;
    const hasGlyphStroke = ([normalizedX, normalizedY]: [number, number]) => {
      const x = padding + normalizedX * letterWidth;
      const y = padding + normalizedY * letterWidth;
      const radius = 3;
      const pixels = context.getImageData(
        Math.round(x) - radius,
        Math.round(y) - radius,
        radius * 2 + 1,
        radius * 2 + 1,
      ).data;

      for (let index = 0; index < pixels.length; index += 4) {
        if (
          pixels[index] >= contract.colour.red[0] &&
          pixels[index] <= contract.colour.red[1] &&
          pixels[index + 1] >= contract.colour.green[0] &&
          pixels[index + 1] <= contract.colour.green[1] &&
          pixels[index + 2] >= contract.colour.blue[0] &&
          pixels[index + 2] <= contract.colour.blue[1] &&
          pixels[index + 3] > 0
        ) {
          return true;
        }
      }

      return false;
    };

    return {
      required: contract.pixelContract.required.map(hasGlyphStroke),
      forbidden: contract.pixelContract.forbidden.map(hasGlyphStroke),
    };
  }, { pixelContract: definition.pixelContract, colour });

  expect(contractResult.required).toEqual(
    Array<boolean>(definition.pixelContract.required.length).fill(true),
  );
  expect(contractResult.forbidden).toEqual(
    Array<boolean>(definition.pixelContract.forbidden.length).fill(false),
  );
}

test("draws E from its normalized stroke and pixel contract", async ({
  page,
}) => {
  await expectGlyphPixelContract(page, "E", eDefinition, {
    red: [150, 255],
    green: [70, 170],
    blue: [0, 80],
  });
});

test("draws S from its normalized stroke and pixel contract", async ({
  page,
}) => {
  await expectGlyphPixelContract(page, "S", sDefinition, {
    red: [140, 255],
    green: [0, 100],
    blue: [120, 255],
  });
});

test("draws C from its normalized stroke and pixel contract", async ({
  page,
}) => {
  await expectGlyphPixelContract(page, "C", cDefinition, {
    red: [0, 90],
    green: [50, 150],
    blue: [170, 255],
  });
});

test("draws B from its normalized stroke and pixel contract", async ({
  page,
}) => {
  await expectGlyphPixelContract(page, "B", bDefinition, {
    red: [0, 70],
    green: [110, 210],
    blue: [40, 140],
  });
});

test("draws comma from its normalized stroke and pixel contract", async ({
  page,
}) => {
  await expectGlyphPixelContract(page, ",", commaDefinition, {
    red: [180, 255],
    green: [140, 230],
    blue: [30, 130],
  });
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
