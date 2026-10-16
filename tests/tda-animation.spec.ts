import { test, expect, type Page } from "@playwright/test";
import {
  bDefinition,
  cDefinition,
  commaDefinition,
  eDefinition,
  hyphenDefinition,
  sDefinition,
  type GlyphDefinition,
  type GlyphPixelContract,
} from "../src/glyphs.ts";

test("runs the MIDI clock and song sections", async ({ page }, testInfo) => {
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
      name: "Korg Tonverk MIDI 1",
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
      emit: (
        type: "clock" | "start" | "stop",
        receivedTime = performance.now(),
      ) => {
        const statusByte = type === "clock" ? 0xf8 : type === "start" ? 0xfa : 0xfc;
        const data = new Uint8Array([statusByte]);
        input.onmidimessage?.({ data, receivedTime, timeStamp: receivedTime });
      },
    };
  });

  await page.goto("/tda.html?text=TDA&animationDurationMs=2000");
  await page.waitForFunction(() => globalThis.testMidi?.ready());
  const midiInputSelect = page.getByLabel("Choose MIDI input");
  await expect(midiInputSelect).toHaveValue("test-midi-input");
  await expect(midiInputSelect.locator("option")).toHaveText([
    "Choose MIDI input…",
    "Korg Tonverk MIDI 1",
  ]);
  await expect(page.getByRole("button", { name: "start fake midi timer" })).toBeHidden();
  await expect(page.getByRole("button", { name: "stop fake midi timer" })).toBeHidden();

  const canvas = page.locator("#canvas");
  await expect(canvas).toHaveAttribute("data-text", "TDA");
  const midiOverlay = page.locator("#midi-overlay");
  const transportPosition = page.locator("#transport-position");
  const clockBpm = page.locator("#clock-bpm");
  const songName = page.locator("#song-name");
  const sectionId = page.locator("#section-id");
  const midiDevice = page.locator("#midi-device");
  const die = page.locator("#roll-die");
  const canvasBox = await canvas.boundingBox();
  const drumCanvasBox = await midiOverlay.boundingBox();
  const dieBox = await die.boundingBox();
  const transportBox = await transportPosition.locator("..").boundingBox();

  if (!canvasBox || !drumCanvasBox || !dieBox || !transportBox) {
    throw new Error("Canvas, dice, or transport layout is unavailable.");
  }

  expect(drumCanvasBox.width).toBeCloseTo(canvasBox.width);
  expect(drumCanvasBox.y).toBeGreaterThanOrEqual(canvasBox.y + canvasBox.height);
  expect(dieBox.y).toBeGreaterThan(drumCanvasBox.y + drumCanvasBox.height);
  expect(transportBox.y).toBeGreaterThanOrEqual(dieBox.y + dieBox.height);
  await expect(midiDevice).toHaveText("MIDI: Korg Tonverk MIDI 1");
  await expect(page.getByRole("button", { name: "TDA", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "gcses" })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "gcses" }).click();
  await expect(page.getByRole("button", { name: "gcses" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(songName).toHaveText("Song: gcses");
  await expect(sectionId).toHaveText("Section: –");
  await expect(canvas).toHaveAttribute("data-display-mode", "song");
  await expect(canvas).toHaveAttribute("data-text", "");
  const drumHitPixel = (instrument: "bass" | "bass-shell" | "hi-hat" | "hi-hat-lower") =>
    midiOverlay.evaluate<number[], "bass" | "bass-shell" | "hi-hat" | "hi-hat-lower", HTMLCanvasElement>((element, drum) => {
      const bassRadius = Math.min(element.width / 32, element.height / 4);
      const x = drum === "bass"
        ? element.width * 0.125 + bassRadius * 0.4
        : drum === "bass-shell"
          ? element.width * 0.125 - bassRadius * 0.85
          : element.width * 0.875;
      const cymbalRadius = Math.min(element.width / 32, element.height * 0.3);
      const closure = Number(element.dataset.hiHatClosure);
      const cymbalOffset = cymbalRadius * (0.35 * (1 - closure) + 0.42 * 0.75);
      const y = element.height / 2 + (
        drum === "hi-hat" ? -cymbalOffset : drum === "hi-hat-lower" ? cymbalOffset : 0
      );
      const context = element.getContext("2d");
      if (!context) {
        throw new Error("Canvas context unavailable.");
      }
      return [...context.getImageData(x, y, 1, 1).data];
    }, instrument);
  const snareHitPixel = (part: "head" | "shell" | "rim" | "empty") =>
    midiOverlay.evaluate<number[], "head" | "shell" | "rim" | "empty", HTMLCanvasElement>((element, target) => {
      const x = element.width * (target === "empty" ? 0.375 : 0.625);
      const y = element.height / 2 + (target === "head" ? -23 : target === "rim" ? 32 : 0);
      const context = element.getContext("2d");
      if (!context) {
        throw new Error("Canvas context unavailable.");
      }
      return [...context.getImageData(x, y, 1, 1).data];
    }, part);
  const snareStickTipY = () =>
    midiOverlay.evaluate<number, null, HTMLCanvasElement>((element) => {
      const context = element.getContext("2d");
      if (!context) {
        throw new Error("Canvas context unavailable.");
      }
      const x = element.width * 0.625;
      const radiusX = Math.min(element.width / 18, element.height * 0.36);
      const topY = element.height / 2 - radiusX * 0.46;
      const image = context.getImageData(
        Math.floor(x - radiusX), Math.floor(topY - radiusX),
        Math.ceil(radiusX * 2), Math.ceil(radiusX * 2),
      );
      let lowestY = -1;
      for (let y = 0; y < image.height; y += 1) {
        for (let pixelX = 0; pixelX < image.width; pixelX += 1) {
          const offset = (y * image.width + pixelX) * 4;
          if (image.data[offset] === 213 && image.data[offset + 1] === 163 && image.data[offset + 2] === 106) {
            lowestY = y;
          }
        }
      }
      return lowestY;
    }, null);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-closure", "0");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "false");
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "1");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);
  expect(await drumHitPixel("bass-shell")).toEqual([57, 123, 184, 255]);
  expect(await snareHitPixel("empty")).toEqual([0, 0, 0, 0]);
  expect(await snareHitPixel("shell")).toEqual([201, 54, 43, 255]);
  expect(await drumHitPixel("hi-hat")).toEqual([255, 140, 0, 255]);
  expect(await drumHitPixel("hi-hat-lower")).toEqual([255, 140, 0, 255]);
  const restingStickY = await snareStickTipY();
  expect(restingStickY).toBeGreaterThan(0);

  await page.evaluate(() => globalThis.testMidi?.emit("start"));
  await expect(canvas).toHaveAttribute("data-text", "");
  await expect(canvas).toHaveAttribute("data-animation-state", "empty");
  await expect(transportPosition).toHaveText("Bar 1 · Beat 1");
  await expect(transportPosition).toHaveAttribute("data-section", "Intro");
  await expect(sectionId).toHaveText("Section: Intro");
  await expect(transportPosition).toHaveAttribute("data-transport", "running");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-closure", "1");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "1");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);
  expect(await drumHitPixel("hi-hat")).toEqual([255, 140, 0, 255]);

  await page.evaluate(() => {
    const bpm = 123.6;
    const intervalMs = 60_000 / (bpm * 24);
    for (let pulse = 0; pulse < 6; pulse += 1) {
      globalThis.testMidi?.emit("clock", 1_000 + pulse * intervalMs);
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "false");
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "1");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-closure", "0");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  expect(await snareHitPixel("empty")).toEqual([0, 0, 0, 0]);
  expect(await snareStickTipY()).toBe(restingStickY);

  await page.evaluate(() => {
    const bpm = 123.6;
    const intervalMs = 60_000 / (bpm * 24);
    for (let pulse = 6; pulse < 12; pulse += 1) {
      globalThis.testMidi?.emit("clock", 1_000 + pulse * intervalMs);
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "1");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-closure", "1");
  expect(await drumHitPixel("hi-hat")).toEqual([255, 140, 0, 255]);

  await page.evaluate(() => {
    const bpm = 123.6;
    const intervalMs = 60_000 / (bpm * 24);
    for (let pulse = 12; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock", 1_000 + pulse * intervalMs);
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(transportPosition).toHaveText("Bar 1 · Beat 2");
  await expect(clockBpm).toHaveText("124 BPM");
  await expect(clockBpm).toHaveAttribute("data-bpm", "124");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);
  expect(await snareHitPixel("empty")).toEqual([0, 0, 0, 0]);
  expect(await snareHitPixel("head")).toEqual([255, 255, 255, 255]);
  expect(await snareHitPixel("shell")).toEqual([201, 54, 43, 255]);
  expect(await snareHitPixel("rim")).toEqual([57, 123, 184, 255]);
  expect(await snareStickTipY()).toBeGreaterThan(restingStickY);
  expect(await drumHitPixel("hi-hat")).toEqual([255, 140, 0, 255]);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 6; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  expect(await snareStickTipY()).toBe(restingStickY);

  await page.evaluate(() => globalThis.testMidi?.emit("start"));
  await expect(transportPosition).toHaveAttribute("data-transport", "paused");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "false");
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "1");
  await expect(midiOverlay).toHaveAttribute("data-snare-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-closure", "0");
  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveText("Bar 1 · Beat 2");

  await page.evaluate(() => globalThis.testMidi?.emit("start"));
  await expect(transportPosition).toHaveAttribute("data-transport", "running");

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 18; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 24; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-snare-side", "right");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  expect(await snareHitPixel("head")).toEqual([255, 255, 255, 255]);
  expect(await snareHitPixel("shell")).toEqual([201, 54, 43, 255]);
  expect(await snareStickTipY()).toBeGreaterThan(restingStickY);
  expect(await drumHitPixel("hi-hat")).toEqual([255, 140, 0, 255]);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 21; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "0");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "false");
  expect(await drumHitPixel("bass")).toEqual([255, 255, 255, 255]);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 3; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(midiOverlay).toHaveAttribute("data-bass-beater-progress", "1");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "true");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 96; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveText("Bar 3 · Beat 1");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-hit-visible", "true");
  expect(await drumHitPixel("bass")).toEqual([51, 51, 51, 255]);
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(transportPosition).toHaveAttribute("data-section", "Verse 1");
  await expect(canvas).toHaveAttribute(
    "data-text",
    "I'VE GOT 11 GCSES",
  );
  await expect(transportPosition).toHaveAttribute("data-lyric-cue", "1");
  await expect(canvas).toHaveAttribute("data-word-count", "4");
  await expect(canvas).toHaveAttribute("data-started-word-count", "1");

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 47; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(canvas).toHaveAttribute("data-started-word-count", "1");

  await page.evaluate(() => globalThis.testMidi?.emit("clock"));
  await expect(canvas).toHaveAttribute("data-started-word-count", "2");

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 96; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(canvas).toHaveAttribute("data-started-word-count", "4");

  await expect(canvas).toHaveAttribute("data-animation-state", "complete");
  await expect(canvas).toHaveAttribute("data-light-show-state", "skipped");
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
  await expect(heading).toHaveCSS("color", "rgb(0, 255, 100)");
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

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 48; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveAttribute("data-section", "Verse 1");
  await expect(transportPosition).toHaveAttribute("data-lyric-cue", "2");
  await expect(canvas).toHaveAttribute("data-started-word-count", "1");
  await expect(canvas).toHaveAttribute(
    "data-text",
    "IT'S EASY FOR YOU, IT'S EASY FOR ME",
  );

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 192; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveAttribute("data-lyric-cue", "3");
  await expect(canvas).toHaveAttribute(
    "data-text",
    "DON'T HAVE TIME FOR ANYTHING ELSE",
  );

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 192; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveAttribute("data-lyric-cue", "4");
  await expect(canvas).toHaveAttribute(
    "data-text",
    "LIKE EXTRA-CURRICULAR ACTIVITIES",
  );

  await page.evaluate(() => globalThis.testMidi?.emit("stop"));
  await expect(transportPosition).toHaveAttribute("data-transport", "stopped");
  await expect(transportPosition).toHaveText("Bar 1 · Beat 1");
  await expect(transportPosition).toHaveAttribute("data-section", "Intro");
  await expect(canvas).toHaveAttribute("data-text", "");
  await expect(clockBpm).toHaveText("– BPM");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");

  await page.getByRole("button", { name: "mugs game" }).click();
  await page.evaluate(() => globalThis.testMidi?.emit("start"));
  await page.evaluate(() => {
    for (let pulse = 0; pulse < 192; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveAttribute("data-section", "Verse 1");
  await expect(canvas).toHaveAttribute("data-word-count", "12");
  await expect(canvas).toHaveAttribute("data-started-word-count", "1");

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 175; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(canvas).toHaveAttribute("data-started-word-count", "11");
  await page.evaluate(() => globalThis.testMidi?.emit("clock"));
  await expect(canvas).toHaveAttribute("data-started-word-count", "12");

  await page.evaluate(() => {
    for (let pulse = 0; pulse < 16; pulse += 1) {
      globalThis.testMidi?.emit("clock");
    }
  });
  await expect(transportPosition).toHaveAttribute(
    "data-section",
    "Instrumental",
  );
  await expect(canvas).toHaveAttribute("data-text", "");

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

test("draws hyphen from its normalized stroke and pixel contract", async ({
  page,
}) => {
  await expectGlyphPixelContract(page, "-", hyphenDefinition, {
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
  const clockBpm = page.locator("#clock-bpm");
  const songName = page.locator("#song-name");
  const sectionId = page.locator("#section-id");
  const midiDevice = page.locator("#midi-device");

  await expect(startButton).toBeVisible();
  await expect(stopButton).toBeVisible();
  await expect(startButton).toBeDisabled();
  await expect(stopButton).toBeDisabled();
  await expect(page.getByLabel("Choose MIDI input")).toBeDisabled();
  await page.getByRole("button", { name: "mugs game" }).click();
  await expect(page.getByRole("button", { name: "mugs game" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(songName).toHaveText("Song: mugs game");
  await expect(sectionId).toHaveText("Section: –");
  await expect(startButton).toBeEnabled();
  await startButton.click();
  await expect(startButton).toBeDisabled();
  await expect(stopButton).toBeEnabled();
  await expect(clockBpm).toHaveText("120 BPM");
  await expect(clockBpm).toHaveAttribute("data-bpm", "120");
  await expect(midiDevice).toHaveText("MIDI: Fake MIDI");
  await expect(page.locator("#transport-position")).toHaveText(
    "Bar 1 · Beat 1",
  );
  await expect(page.locator("#transport-position")).toHaveAttribute(
    "data-section",
    "Intro",
  );
  await expect(sectionId).toHaveText("Section: Intro");
  await expect(page.locator("#canvas")).toHaveAttribute("data-text", "");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true", {
    timeout: 900,
  });
  await stopButton.click();
  await expect(startButton).toBeEnabled();
  await expect(stopButton).toBeDisabled();
  await expect(clockBpm).toHaveText("– BPM");
  await expect(midiDevice).toHaveText("MIDI: No device");
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  await page.waitForTimeout(600);
  await expect(midiOverlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(midiOverlay).toHaveAttribute("data-hi-hat-visible", "true");
  expect(browserErrors).toEqual([]);
});

test("selects the dashed T and draws ten horizontal bars", async ({ page }) => {
  await page.goto("/tda.html?text=T&lightShow=false");
  const canvas = page.locator("#canvas");
  const fontSelect = page.getByLabel("Font");

  await expect(fontSelect).toHaveValue("core");
  await fontSelect.selectOption("dashed");
  await expect(canvas).toHaveAttribute("data-font", "dashed");
  await expect.poll(() => new URL(page.url()).searchParams.get("font"))
    .toBe("dashed");
  await expect(canvas).toHaveAttribute("data-letter-animation-state", "complete");

  const rows = await canvas.evaluate<number[][], null, HTMLCanvasElement>((element) => {
    const context = element.getContext("2d");
    if (!context) throw new Error("Canvas context unavailable.");
    const size = element.width / 3;
    const x = size;
    const y = size;
    return Array.from({ length: 10 }, (_, index) => {
      const barY = y + (0.04 + index * 0.1) * size;
      return [0.2, 0.5, 0.8].map((fraction) =>
        context.getImageData(x + fraction * size, barY, 1, 1).data[1],
      );
    });
  }, null);

  expect(rows.slice(0, 3)).toEqual(Array.from({ length: 3 }, () => [255, 255, 255]));
  expect(rows.slice(3)).toEqual(Array.from({ length: 7 }, () => [0, 255, 0]));

  await page.reload();
  await expect(fontSelect).toHaveValue("dashed");
  await fontSelect.selectOption("core");
  await expect(canvas).toHaveAttribute("data-font", "core");
  await expect.poll(() => new URL(page.url()).searchParams.get("font"))
    .toBeNull();
});
