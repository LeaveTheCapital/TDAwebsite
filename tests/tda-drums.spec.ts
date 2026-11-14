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

test("live set notes queue a song until Stop primes it and Start plays it", async ({ page }) => {
  await page.goto("/tda.html");
  await page.waitForFunction(() => (
    globalThis as typeof globalThis & { midiProbe?: { isReady(): boolean } }
  ).midiProbe?.isReady());

  const emit = async (...data: number[]) => page.evaluate((bytes) => {
    (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe.emit(...bytes);
  }, data);
  const liveStatus = page.locator("#live-set-status");
  const transport = page.locator("#transport-position");
  const queuedSong = page.locator("#queued-song");

  await page.getByRole("button", { name: "LIVE SET" }).click();
  await expect(page.locator("#canvas")).toHaveAttribute("data-display-mode", "intro");
  await expect(liveStatus).toHaveText("Ready 1/3: gcses");
  await expect(queuedSong).toHaveText("Queued song: –");
  await expect(queuedSong).toBeVisible();

  await emit(0xfa);
  await expect(liveStatus).toHaveText("Playing 1/3: gcses");
  await expect(transport).toHaveAttribute("data-transport", "running");

  await emit(0x99, 2, 100);
  await emit(0x99, 1, 100);
  await emit(0x99, 12, 100);
  await emit(0x90, 2, 100);
  await expect(liveStatus).toHaveText("Playing 1/3: gcses · Next: mugs game");
  await expect(queuedSong).toHaveText("Queued song: mugs game");
  await expect(page.locator("#song-name")).toHaveText("Song: gcses");

  await page.keyboard.press("q");
  await expect(queuedSong).toBeHidden();
  await page.keyboard.press("q");
  await expect(queuedSong).toBeVisible();

  await emit(0xfc);
  await expect(liveStatus).toHaveText("Ready 2/3: mugs game");
  await expect(queuedSong).toHaveText("Queued song: –");
  await expect(transport).toHaveAttribute("data-transport", "stopped");
  await expect(page.locator("#canvas")).toHaveAttribute("data-display-mode", "intro");
  await expect(page.locator("#song-name")).toHaveText("Song: –");
  await expect(page.locator("#midi-overlay")).toHaveAttribute("data-bass-drum-visible", "false");

  await emit(0x99, 2, 100);
  await expect(liveStatus).toHaveText("Ready 2/3: mugs game · Next: Dyno");
  await expect(queuedSong).toHaveText("Queued song: Dyno");
  await emit(0xfa);
  await expect(liveStatus).toHaveText("Playing 2/3: mugs game · Next: Dyno");
  await expect(page.locator("#song-name")).toHaveText("Song: mugs game");

  await emit(0xfc);
  await expect(liveStatus).toHaveText("Ready 3/3: Dyno");
  await emit(0xfa);
  await expect(page.locator("#song-name")).toHaveText("Song: Dyno");

  await emit(0xfc);
  await expect(liveStatus).toHaveText("Ready 3/3: Dyno");
  await emit(0xfa);
  await expect(page.locator("#song-name")).toHaveText("Song: Dyno");
});

test("live set selection notes follow the saved song order", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("tda-setlist-v1", JSON.stringify([2, 0, 1]));
  });
  await page.goto("/tda.html");
  await page.waitForFunction(() => (
    globalThis as typeof globalThis & { midiProbe?: { isReady(): boolean } }
  ).midiProbe?.isReady());

  await page.getByRole("button", { name: "LIVE SET" }).click();
  await expect(page.locator("#live-set-status")).toHaveText("Ready 1/3: Dyno");
  await page.evaluate(() => {
    const probe = (
      globalThis as typeof globalThis & { midiProbe: { emit(...data: number[]): void } }
    ).midiProbe;
    probe.emit(0xfa);
    probe.emit(0x99, 1, 100);
    probe.emit(0xfc);
  });

  await expect(page.locator("#live-set-status")).toHaveText("Ready 2/3: gcses");
  await expect(page.locator("#canvas")).toHaveAttribute("data-display-mode", "intro");
});
