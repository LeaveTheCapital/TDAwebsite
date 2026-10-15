export interface AnimationTiming {
  durationMs: number;
  stepScale: number;
  letterDurationMs: number;
  letterStepScale: number;
  lightShowDurationMs: number;
  lightShowStepScale: number;
}

const letterReferenceDurationMs = 6_500;
const lightShowReferenceDurationMs = 15_000;
const defaultLetterDurationMs = 4_000;
const defaultLightShowDurationMs = 10_000;
export const minimumDurationMs = 1_000;
export const maximumDurationMs = 10_000;
const query = new URLSearchParams(window.location.search);
const legacyDurationMs = getRequestedDurationMs("animationDurationMs");
const letterDurationMs = normalizeDurationMs(
  getRequestedDurationMs("letterAnimationDurationMs") ??
    legacyDurationMs ??
    defaultLetterDurationMs,
);
const lightShowDurationMs = normalizeDurationMs(
  getRequestedDurationMs("lightShowDurationMs") ??
    legacyDurationMs ??
    defaultLightShowDurationMs,
);

export const animationTiming: AnimationTiming = {
  durationMs: letterDurationMs,
  stepScale: letterReferenceDurationMs / letterDurationMs,
  letterDurationMs,
  letterStepScale: letterReferenceDurationMs / letterDurationMs,
  lightShowDurationMs,
  lightShowStepScale: lightShowReferenceDurationMs / lightShowDurationMs,
};

export function setLetterAnimationDurationMs(requestedDurationMs: number) {
  const nextDurationMs = normalizeDurationMs(requestedDurationMs);

  animationTiming.durationMs = nextDurationMs;
  animationTiming.stepScale = letterReferenceDurationMs / nextDurationMs;
  animationTiming.letterDurationMs = nextDurationMs;
  animationTiming.letterStepScale = animationTiming.stepScale;

  return animationTiming;
}

export function setLightShowDurationMs(requestedDurationMs: number) {
  const nextDurationMs = normalizeDurationMs(requestedDurationMs);

  animationTiming.lightShowDurationMs = nextDurationMs;
  animationTiming.lightShowStepScale =
    lightShowReferenceDurationMs / nextDurationMs;

  return animationTiming;
}

function getRequestedDurationMs(parameter: string) {
  const value = query.get(parameter);

  if (value === null) {
    return undefined;
  }

  const durationMs = Number(value);
  return Number.isFinite(durationMs) && durationMs > 0
    ? durationMs
    : undefined;
}

function normalizeDurationMs(requestedDurationMs: number) {
  const roundedDurationMs = Math.round(requestedDurationMs / 1000) * 1000;

  return Math.min(
    maximumDurationMs,
    Math.max(minimumDurationMs, roundedDurationMs),
  );
}

declare global {
  interface Window {
    animationTiming: AnimationTiming;
  }
}

window.animationTiming = animationTiming;
