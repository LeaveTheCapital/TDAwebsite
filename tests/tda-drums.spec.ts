import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const input = {
      id: "test-midi-input",
      manufacturer: "test",
      name: "Korg Tonverk MIDI 1",
      state: "connected",
      connection: "open",
      type: "input",
      onmidimessage: null as ((event: { data: Uint8Array; receivedTime: number; timeStamp: number }) => void) | null,
      onstatechange: null,
      addEventListener() {},
      removeEventListener() {},
      open() {
        return Promise.resolve(this);
      },
      close() {
        return Promise.resolve(this);
      },
    };

    Object.defineProperty(navigator, "requestMIDIAccess", {
      configurable: true,
      value: () => Promise.resolve({
        inputs: new Map([[input.id, input]]),
        outputs: new Map(),
        sysexEnabled: false,
        addEventListener() {},
        removeEventListener() {},
      }),
    });

    Object.assign(globalThis, {
      midiProbe: {
        isReady: () => typeof input.onmidimessage === "function",
        emit: (...data: number[]) => input.onmidimessage?.({
          data: new Uint8Array(data),
          receivedTime: performance.now(),
          timeStamp: performance.now(),
        }),
      },
    });
  });
});

test("silent song sections keep the drums in their resting pose", async ({ page }) => {
  await page.goto("/tda.html");
  await page.waitForFunction(() => (
    globalThis as typeof globalThis & { midiProbe?: { isReady(): boolean } }
  ).midiProbe?.isReady());

  await page.getByRole("button", { name: "mugs game" }).click();
  await page.evaluate(() => {
    (
      globalThis as typeof globalThis & { midiProbe: { emit(status: number): void } }
    ).midiProbe.emit(0xfa);
  });

  const overlay = page.locator("#midi-overlay");
  await expect(page.locator("#transport-position")).toHaveAttribute("data-section", "Intro");
  await expect(overlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(overlay).toHaveAttribute("data-snare-visible", "true");
  await expect(overlay).toHaveAttribute("data-low-tom-visible", "true");
  await expect(overlay).toHaveAttribute("data-hand-clap-visible", "true");
  await expect(overlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(overlay).toHaveAttribute("data-bass-drum-played", "false");
  await expect(overlay).toHaveAttribute("data-hi-hat-played", "false");

  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(status: number): void } }
    ).midiProbe;
    probe.emit(0xf8);
  });
  await expect(overlay).toHaveAttribute("data-bass-drum-hit-visible", "false");
  await expect(overlay).toHaveAttribute("data-bass-beater-progress", "1");
  await expect(overlay).toHaveAttribute("data-hi-hat-closure", "0");

  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(status: number): void } }
    ).midiProbe;
    for (let pulse = 1; pulse < 192; pulse += 1) probe.emit(0xf8);
  });
  await expect(page.locator("#transport-position")).toHaveAttribute("data-section", "Bass Intro");
  await expect(overlay).toHaveAttribute("data-bass-drum-hit-visible", "false");
  await expect(overlay).toHaveAttribute("data-hi-hat-closure", "0");

  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe;
    probe.emit(0x99, 36, 100);
    probe.emit(0x99, 42, 100);
  });
  await expect(overlay).toHaveAttribute("data-bass-drum-hit-visible", "true");
  await expect(overlay).toHaveAttribute("data-hi-hat-closure", "1");
  await expect(overlay).toHaveAttribute("data-bass-drum-played", "true");
  await expect(overlay).toHaveAttribute("data-snare-played", "false");
  await expect(overlay).toHaveAttribute("data-hi-hat-played", "true");
});

test("each drum gains colour on its first note and a new song starts grey", async ({ page }) => {
  await page.goto("/tda.html");
  await page.waitForFunction(() => (
    globalThis as typeof globalThis & { midiProbe?: { isReady(): boolean } }
  ).midiProbe?.isReady());

  const overlay = page.locator("#midi-overlay");
  await page.getByRole("button", { name: "mugs game" }).click();
  await expect(overlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(overlay).toHaveAttribute("data-hi-hat-played", "false");

  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe;
    probe.emit(0xfa);
    for (let pulse = 0; pulse < 192; pulse += 1) probe.emit(0xf8);
    probe.emit(0x99, 42, 100);
  });
  await expect(overlay).toHaveAttribute("data-bass-drum-played", "false");
  await expect(overlay).toHaveAttribute("data-snare-played", "false");
  await expect(overlay).toHaveAttribute("data-hi-hat-played", "true");

  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe;
    probe.emit(0xf8);
    probe.emit(0x99, 38, 100);
  });
  await expect(overlay).toHaveAttribute("data-snare-played", "true");

  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe;
    probe.emit(0x99, 43, 100);
    probe.emit(0x99, 39, 100);
    probe.emit(0x99, 46, 100);
  });
  await expect(overlay).toHaveAttribute("data-low-tom-played", "true");
  await expect(overlay).toHaveAttribute("data-hand-clap-played", "true");
  await expect(overlay).toHaveAttribute("data-hi-hat-opening", "1");
  await page.evaluate(() => {
    (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe.emit(0x99, 42, 100);
  });
  await expect(overlay).toHaveAttribute("data-hi-hat-closure", "1");
  await expect(overlay).toHaveAttribute("data-hi-hat-opening", "0");

  await page.getByRole("button", { name: "gcses" }).click();
  await expect(overlay).toHaveAttribute("data-bass-drum-visible", "true");
  await expect(overlay).toHaveAttribute("data-snare-visible", "true");
  await expect(overlay).toHaveAttribute("data-hi-hat-visible", "true");
  await expect(overlay).toHaveAttribute("data-low-tom-visible", "true");
  await expect(overlay).toHaveAttribute("data-hand-clap-visible", "true");
  await expect(overlay).toHaveAttribute("data-bass-drum-played", "false");
  await expect(overlay).toHaveAttribute("data-snare-played", "false");
  await expect(overlay).toHaveAttribute("data-hi-hat-played", "false");
  await expect(overlay).toHaveAttribute("data-low-tom-played", "false");
  await expect(overlay).toHaveAttribute("data-hand-clap-played", "false");
});
