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

  void it("keeps each visual visible for six clocks from its onset", () => {
    for (let pulse = 0; pulse < midiClocksPerBar * 2; pulse += 1) {
      const state = getDrumPatternState(pulse);
      const pulseInBar = pulse % midiClocksPerBar;
      const pulseInBeat = pulseInBar % 24;
      const pulseInEighth = pulseInBar % 12;
      const beatInBar = Math.floor(pulseInBar / 24);

      assert.equal(
        state.bassDrumVisible,
        pulseInBar < drumHitVisiblePulses,
      );
      assert.equal(
        state.snareDrumVisible,
        (beatInBar === 1 || beatInBar === 3) &&
          pulseInBeat < drumHitVisiblePulses,
      );
      assert.equal(
        state.hiHatVisible,
        pulseInEighth < drumHitVisiblePulses,
      );
    }
  });

  void it("alternates the snare circle between left and right", () => {
    assert.equal(getDrumPatternState(24).snareSide, "left");
    assert.equal(getDrumPatternState(72).snareSide, "right");
    assert.equal(getDrumPatternState(120).snareSide, "left");
    assert.equal(getDrumPatternState(168).snareSide, "right");
    assert.equal(getDrumPatternState(48).snareSide, null);
  });
});
