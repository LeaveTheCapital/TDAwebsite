import { songsByProgram } from "./songs";

export const setlistStorageKey = "tda-setlist-v1";

export function getDefaultSetlist(): number[] {
  return [...songsByProgram.keys()];
}

export function loadSetlist(storage: Storage = localStorage): number[] {
  const fallback = getDefaultSetlist();
  const saved = storage.getItem(setlistStorageKey);

  if (saved === null) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) {
      return fallback;
    }

    const availablePrograms = new Set(fallback);
    const savedPrograms = parsed.filter(
      (program): program is number =>
        typeof program === "number" && availablePrograms.has(program),
    );
    const uniquePrograms = [...new Set(savedPrograms)];

    return [
      ...uniquePrograms,
      ...fallback.filter((program) => !uniquePrograms.includes(program)),
    ];
  } catch {
    return fallback;
  }
}

export function saveSetlist(
  programs: number[],
  storage: Storage = localStorage,
): void {
  storage.setItem(setlistStorageKey, JSON.stringify(programs));
}
