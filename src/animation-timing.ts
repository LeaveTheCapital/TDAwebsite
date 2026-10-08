export interface AnimationTiming {
  durationMs: number;
  stepScale: number;
}

const defaultDurationMs = 21_500;
const minimumDurationMs = 250;
const maximumDurationMs = 60_000;
const requestedDuration = Number(
  new URLSearchParams(window.location.search).get("animationDurationMs"),
);
const hasValidRequestedDuration =
  Number.isFinite(requestedDuration) && requestedDuration > 0;
const durationMs = hasValidRequestedDuration
  ? Math.min(maximumDurationMs, Math.max(minimumDurationMs, requestedDuration))
  : defaultDurationMs;

export const animationTiming: AnimationTiming = Object.freeze({
  durationMs,
  stepScale: defaultDurationMs / durationMs,
});

declare global {
  interface Window {
    animationTiming: AnimationTiming;
  }
}

window.animationTiming = animationTiming;
