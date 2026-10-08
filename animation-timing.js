(function configureAnimationTiming() {
  const defaultDurationMs = 21500;
  const minimumDurationMs = 250;
  const maximumDurationMs = 60000;
  const requestedDuration = Number(
    new URLSearchParams(window.location.search).get("animationDurationMs")
  );
  const hasValidRequestedDuration =
    Number.isFinite(requestedDuration) && requestedDuration > 0;
  const durationMs = hasValidRequestedDuration
    ? Math.min(
        maximumDurationMs,
        Math.max(minimumDurationMs, requestedDuration)
      )
    : defaultDurationMs;

  window.animationTiming = Object.freeze({
    durationMs,
    stepScale: defaultDurationMs / durationMs,
  });
})();
