export const ezeptocoreBankCount = 16;
export const ezeptocoreSlotCount = 16;

export type ControlMode = "cc" | "sysex" | "lfo" | "note";

export interface MidiControl {
  mode: ControlMode;
  channel: string;
  number: string;
  description: string;
  button: string;
}

export interface AxisControl {
  channel: string;
  number: string;
  description: string;
}

export interface PurposeControl {
  description: string;
}

export interface EzeptocoreConfig {
  banks: string[][];
}

export interface MidiConfig {
  oxiE16: MidiControl[];
  lightreftMonolit: MidiControl[];
  intechZona: Record<"x" | "y" | "z", AxisControl>;
  elektronTonverk?: PurposeControl[];
  ezeptocore?: EzeptocoreConfig;
  notes: string;
}

interface LegacyMidiConfig extends Omit<MidiConfig, "intechZona" | "notes"> {
  intechZoya: Record<"x" | "y" | "z", AxisControl>;
  notes?: string;
}

export function serializeMidiConfig(config: MidiConfig): string {
  return JSON.stringify(config);
}

export function parseMidiConfig(json: string): MidiConfig | null {
  return normalizeMidiConfig(JSON.parse(json) as unknown);
}

export function normalizeMidiConfig(value: unknown): MidiConfig | null {
  if (isMidiConfig(value)) {
    return withNormalizedEzeptocore(value, value);
  }
  if (isLegacyMidiConfig(value)) {
    return withNormalizedEzeptocore(
      {
        oxiE16: value.oxiE16,
        lightreftMonolit: value.lightreftMonolit,
        intechZona: value.intechZoya,
        ...(value.elektronTonverk === undefined
          ? {}
          : { elektronTonverk: value.elektronTonverk }),
        notes: value.notes ?? "",
      },
      value,
    );
  }
  return null;
}

export function emptyEzeptocoreBanks(): string[][] {
  return Array.from({ length: ezeptocoreBankCount }, () =>
    Array.from({ length: ezeptocoreSlotCount }, () => ""),
  );
}

function withNormalizedEzeptocore(
  config: MidiConfig,
  source: unknown,
): MidiConfig {
  const normalized = readStoredEzeptocore(source);
  if (normalized === undefined) {
    return hasOwnEzeptocore(config) ? omitEzeptocore(config) : config;
  }
  return { ...config, ezeptocore: normalized };
}

function readStoredEzeptocore(source: unknown): EzeptocoreConfig | undefined {
  if (typeof source !== "object" || source === null || !hasOwnEzeptocore(source)) {
    return undefined;
  }
  return coerceEzeptocore((source as { ezeptocore: unknown }).ezeptocore);
}

function hasOwnEzeptocore(value: object): boolean {
  return Object.prototype.hasOwnProperty.call(value, "ezeptocore");
}

function omitEzeptocore(config: MidiConfig): MidiConfig {
  const clone: MidiConfig = { ...config };
  delete clone.ezeptocore;
  return clone;
}

function coerceEzeptocore(value: unknown): EzeptocoreConfig | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }
  const banks = (value as { banks?: unknown }).banks;
  if (!Array.isArray(banks)) {
    return undefined;
  }
  return {
    banks: Array.from({ length: ezeptocoreBankCount }, (_, bankIndex) => {
      const bank: unknown = banks[bankIndex];
      const slots = Array.isArray(bank) ? bank : [];
      return Array.from({ length: ezeptocoreSlotCount }, (_, slotIndex) => {
        const slot: unknown = slots[slotIndex];
        return typeof slot === "string" ? slot : "";
      });
    }),
  };
}

function isMidiConfig(value: unknown): value is MidiConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.oxiE16) &&
    candidate.oxiE16.length === 16 &&
    candidate.oxiE16.every(isMidiControl) &&
    Array.isArray(candidate.lightreftMonolit) &&
    candidate.lightreftMonolit.length === 8 &&
    candidate.lightreftMonolit.every(isMidiControl) &&
    isAxisCollection(candidate.intechZona) &&
    typeof candidate.notes === "string" &&
    (candidate.elektronTonverk === undefined ||
      (Array.isArray(candidate.elektronTonverk) &&
        candidate.elektronTonverk.length === 16 &&
        candidate.elektronTonverk.every(isPurposeControl)))
  );
}

function isLegacyMidiConfig(value: unknown): value is LegacyMidiConfig {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.oxiE16) &&
    candidate.oxiE16.length === 16 &&
    candidate.oxiE16.every(isMidiControl) &&
    Array.isArray(candidate.lightreftMonolit) &&
    candidate.lightreftMonolit.length === 8 &&
    candidate.lightreftMonolit.every(isMidiControl) &&
    isAxisCollection(candidate.intechZoya) &&
    (candidate.notes === undefined || typeof candidate.notes === "string") &&
    (candidate.elektronTonverk === undefined ||
      (Array.isArray(candidate.elektronTonverk) &&
        candidate.elektronTonverk.length === 16 &&
        candidate.elektronTonverk.every(isPurposeControl)))
  );
}

function isPurposeControl(value: unknown): value is PurposeControl {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return typeof (value as Record<string, unknown>).description === "string";
}

function isMidiControl(value: unknown): value is MidiControl {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    ["cc", "sysex", "lfo", "note"].includes(String(candidate.mode)) &&
    ["channel", "number", "description", "button"].every(
      (key) => typeof candidate[key] === "string",
    )
  );
}

function isAxisCollection(
  value: unknown,
): value is Record<"x" | "y" | "z", AxisControl> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return ["x", "y", "z"].every((axis) => isAxisControl(candidate[axis]));
}

function isAxisControl(value: unknown): value is AxisControl {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return ["channel", "number", "description"].every(
    (key) => typeof candidate[key] === "string",
  );
}
