import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getDrumInstrument,
  getMidiDrumState,
  drumHitVisiblePulses,
  getDrumPatternState,
  midiClocksPerBar,
} from "../src/drum-pattern.ts";

void describe("MIDI drum notes", () => {
  void it("routes all six channel 10 note numbers to the displayed instruments", () => {
    assert.equal(getDrumInstrument(36), "bass");
    for (const note of [38, 43, 39]) assert.equal(getDrumInstrument(note), "snare");
    for (const note of [42, 46]) assert.equal(getDrumInstrument(note), "hiHat");
    assert.equal(getDrumInstrument(37), undefined);
  });

  void it("keeps independent hits active for six clocks", () => {
    const hits = { bass: 10, snare: 12, hiHat: 14 };
    assert.equal(getMidiDrumState(14, hits).hiHatClosure, 1);
    assert.ok(Math.abs(getMidiDrumState(14, hits).snareStrikeProgress - 2 / 3) < 1e-10);
    assert.equal(getMidiDrumState(15, hits).bassDrumHitVisible, true);
    assert.equal(getMidiDrumState(16, hits).bassDrumHitVisible, false);
    assert.equal(getMidiDrumState(20, hits).hiHatClosure, 0);
  });
});

void describe("drum pattern timing", () => {
  void it("places drum hits on the requested 4/4 subdivisions", () => {
    const bassDrumHits: number[] = [];
    const snareDrumHits: number[] = [];
    const hiHatHits: number[] = [];

    for (let pulse = 0; pulse < midiClocksPerBar * 2; pulse += 1) {
      const state = getDrumPatternState(pulse);

      if (state.bassDrumHit) {
        bassDrumHits.push(pulse);
      }
      if (state.snareDrumHit) {
        snareDrumHits.push(pulse);
      }
      if (state.hiHatHit) {
        hiHatHits.push(pulse);
      }
    }

    assert.deepEqual(bassDrumHits, [0, 96]);
    assert.deepEqual(snareDrumHits, [24, 72, 120, 168]);
    assert.deepEqual(hiHatHits, [
      0, 12, 24, 36, 48, 60, 72, 84,
      96, 108, 120, 132, 144, 156, 168, 180,
    ]);
  });

  void it("keeps hits active for six clocks while the hi-hat stays visible", () => {
    for (let pulse = 0; pulse < midiClocksPerBar * 2; pulse += 1) {
      const state = getDrumPatternState(pulse);
      const pulseInBar = pulse % midiClocksPerBar;
      const pulseInBeat = pulseInBar % 24;
      const pulseInEighth = pulseInBar % 12;
      const beatInBar = Math.floor(pulseInBar / 24);

      assert.equal(
        state.bassDrumHitVisible,
        pulseInBar < drumHitVisiblePulses,
      );
      assert.equal(
        state.snareDrumVisible,
        (beatInBar === 1 || beatInBar === 3) &&
          pulseInBeat < drumHitVisiblePulses,
      );
      assert.equal(
        state.snareStrikeProgress,
        state.snareDrumVisible
          ? 1 - pulseInBeat / drumHitVisiblePulses
          : 0,
      );
      assert.equal(state.hiHatVisible, true);
      assert.equal(
        state.hiHatClosure,
        pulseInEighth < drumHitVisiblePulses
          ? 1 - pulseInEighth / drumHitVisiblePulses
          : 0,
      );
    }
  });

  void it("prepares the bass beater before the next bar's downbeat", () => {
    assert.equal(getDrumPatternState(0).bassBeaterProgress, 1);
    assert.equal(getDrumPatternState(6).bassBeaterProgress, 1);
    assert.equal(getDrumPatternState(12).bassBeaterProgress, 1);
    assert.equal(getDrumPatternState(83).bassBeaterProgress, 1);
    assert.equal(getDrumPatternState(84).bassBeaterProgress, 1);
    assert.equal(getDrumPatternState(90).bassBeaterProgress, 1);
    assert.ok(
      Math.abs(getDrumPatternState(91).bassBeaterProgress - 2 / 3) < 1e-12,
    );
    assert.equal(getDrumPatternState(93).bassBeaterProgress, 0);
    assert.equal(getDrumPatternState(95).bassBeaterProgress, 2 / 3);
    assert.equal(getDrumPatternState(95).bassDrumHitVisible, false);
    assert.equal(getDrumPatternState(96).bassBeaterProgress, 1);
    assert.equal(getDrumPatternState(96).bassDrumHit, true);
  });

});
