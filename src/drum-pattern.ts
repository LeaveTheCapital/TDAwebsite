export const midiClocksPerQuarterNote = 24;
export const beatsPerBar = 4;
export const midiClocksPerEighthNote = midiClocksPerQuarterNote / 2;
export const drumHitVisiblePulses = midiClocksPerQuarterNote / 4;
export const midiClocksPerBar = midiClocksPerQuarterNote * beatsPerBar;

export interface DrumPatternState {
  bassDrumHit: boolean;
  bassDrumVisible: boolean;
  snareDrumHit: boolean;
  snareDrumVisible: boolean;
  snareSide: "left" | "right" | null;
  hiHatHit: boolean;
  hiHatVisible: boolean;
}

export function getDrumPatternState(pulse: number): DrumPatternState {
  const pulseInBar = normalizePulse(pulse) % midiClocksPerBar;
  const beatInBar = Math.floor(pulseInBar / midiClocksPerQuarterNote);
  const pulseInBeat = pulseInBar % midiClocksPerQuarterNote;
  const pulseInEighth = pulseInBar % midiClocksPerEighthNote;
  const bassDrumHit = pulseInBar === 0;
  const snareDrumHit =
    (beatInBar === 1 || beatInBar === 3) && pulseInBeat === 0;
  const hiHatHit = pulseInEighth === 0;
  const snareDrumVisible =
    (beatInBar === 1 || beatInBar === 3) &&
    pulseInBeat < drumHitVisiblePulses;

  return {
    bassDrumHit,
    bassDrumVisible: pulseInBar < drumHitVisiblePulses,
    snareDrumHit,
    snareDrumVisible,
    snareSide: snareDrumVisible
      ? beatInBar === 1
        ? "left"
        : "right"
      : null,
    hiHatHit,
    hiHatVisible: pulseInEighth < drumHitVisiblePulses,
  };
}

function normalizePulse(pulse: number) {
  return Math.max(0, Math.floor(pulse));
}
