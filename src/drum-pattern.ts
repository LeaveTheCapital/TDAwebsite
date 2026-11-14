export const midiClocksPerQuarterNote = 24;
export const beatsPerBar = 4;
export const midiClocksPerEighthNote = midiClocksPerQuarterNote / 2;
export const drumHitVisiblePulses = midiClocksPerQuarterNote / 4;
export const midiClocksPerBar = midiClocksPerQuarterNote * beatsPerBar;

export const drumNoteNumbers = {
  bass: 36,
  snare: 38,
  lowTom: 43,
  handClap: 39,
  closedHiHat: 42,
  openHiHat: 46,
} as const;

export type DrumInstrument = "bass" | "snare" | "hiHat";

export function getDrumInstrument(noteNumber: number): DrumInstrument | undefined {
  switch (noteNumber) {
    case drumNoteNumbers.bass: return "bass";
    case drumNoteNumbers.snare:
    case drumNoteNumbers.lowTom:
    case drumNoteNumbers.handClap: return "snare";
    case drumNoteNumbers.closedHiHat:
    case drumNoteNumbers.openHiHat: return "hiHat";
    default: return undefined;
  }
}

export function getMidiDrumState(
  pulse: number,
  lastHits: Partial<Record<DrumInstrument, number>>,
): DrumPatternState {
  const age = (instrument: DrumInstrument) =>
    lastHits[instrument] === undefined ? Infinity : Math.max(0, pulse - lastHits[instrument]);
  const bassAge = age("bass");
  const snareAge = age("snare");
  const hiHatAge = age("hiHat");
  const progress = (hitAge: number) => hitAge < drumHitVisiblePulses
    ? 1 - hitAge / drumHitVisiblePulses : 0;

  return {
    bassDrumHit: bassAge === 0,
    bassDrumHitVisible: bassAge < drumHitVisiblePulses,
    bassBeaterProgress: Number.isFinite(bassAge) ? progress(bassAge) : 0,
    snareDrumHit: snareAge === 0,
    snareDrumVisible: snareAge < drumHitVisiblePulses,
    snareStrikeProgress: progress(snareAge),
    hiHatHit: hiHatAge === 0,
    hiHatVisible: true,
    hiHatClosure: progress(hiHatAge),
  };
}

export interface DrumPatternState {
  bassDrumHit: boolean;
  bassDrumHitVisible: boolean;
  bassBeaterProgress: number;
  snareDrumHit: boolean;
  snareDrumVisible: boolean;
  snareStrikeProgress: number;
  hiHatHit: boolean;
  hiHatVisible: boolean;
  hiHatClosure: number;
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
  const bassSwingHalfPulses = drumHitVisiblePulses / 2;
  const bassSwingStart = midiClocksPerBar - drumHitVisiblePulses;
  const bassReturnStart = midiClocksPerBar - bassSwingHalfPulses;
  const bassBeaterProgress = pulseInBar < bassSwingStart
    ? 1
    : pulseInBar < bassReturnStart
      ? 1 - (pulseInBar - bassSwingStart) / bassSwingHalfPulses
      : (pulseInBar - bassReturnStart) / bassSwingHalfPulses;

  return {
    bassDrumHit,
    bassDrumHitVisible: pulseInBar < drumHitVisiblePulses,
    bassBeaterProgress,
    snareDrumHit,
    snareDrumVisible,
    snareStrikeProgress: snareDrumVisible
      ? 1 - pulseInBeat / drumHitVisiblePulses
      : 0,
    hiHatHit,
    hiHatVisible: true,
    hiHatClosure: pulseInEighth < drumHitVisiblePulses
      ? 1 - pulseInEighth / drumHitVisiblePulses
      : 0,
  };
}

function normalizePulse(pulse: number) {
  return Math.max(0, Math.floor(pulse));
}
