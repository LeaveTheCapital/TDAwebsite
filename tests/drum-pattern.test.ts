import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  drumHitVisiblePulses,
  getDrumPatternState,
  midiClocksPerBar,
} from "../src/drum-pattern.ts";

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
