import "../midicc.css";

type ControlMode = "cc" | "sysex" | "lfo" | "note";

interface MidiControl {
  mode: ControlMode;
  channel: string;
  number: string;
  description: string;
  button: string;
}

interface AxisControl {
  channel: string;
  number: string;
  description: string;
}

interface PurposeControl {
  description: string;
}

interface MidiConfig {
  oxiE16: MidiControl[];
  lightreftMonolit: MidiControl[];
  intechZona: Record<"x" | "y" | "z", AxisControl>;
  elektronTonverk?: PurposeControl[];
  notes: string;
}

interface LegacyMidiConfig extends Omit<MidiConfig, "intechZona" | "notes"> {
  intechZoya: Record<"x" | "y" | "z", AxisControl>;
  notes?: string;
}

const storageKey = "tda-midi-cc-config-v1";
const form = getElement("midi-config-form") as HTMLFormElement;
const saveStatus = getElement("save-status") as HTMLOutputElement;
const downloadButton = getElement("download-config") as HTMLButtonElement;
const viewToggle = getElement("view-toggle") as HTMLButtonElement;
const viewLabel = getElement("view-label");
const controlDialog = getElement("control-dialog") as HTMLDialogElement;
const dialogContent = getElement("dialog-content");
const closeDialogButton = getElement("close-dialog") as HTMLButtonElement;
const oxiGrid = getElement("oxi-grid") as HTMLDivElement;
const monolitGrid = getElement("monolit-grid") as HTMLDivElement;
const tonverkAudioGrid = getElement("tonverk-audio-grid") as HTMLDivElement;
const tonverkRoutingGrid = getElement("tonverk-routing-grid") as HTMLDivElement;
const zonaControls = getElement("zona-controls") as HTMLDivElement;
const notes = getElement("config-notes") as HTMLTextAreaElement;
const oxiTemplate = getElement("oxi-control-template") as HTMLTemplateElement;
const monolitTemplate = getElement(
  "monolit-control-template",
) as HTMLTemplateElement;
const zonaTemplate = getElement("zona-axis-template") as HTMLTemplateElement;
const tonverkTemplate = getElement(
  "tonverk-track-template",
) as HTMLTemplateElement;

const tonverkTracks = [
  ...Array.from({ length: 8 }, (_, index) => ({
    label: `Audio track ${String(index + 1).padStart(2, "0")}`,
    kind: "Audio",
  })),
  ...Array.from({ length: 4 }, (_, index) => ({
    label: `Bus ${String(index + 9).padStart(2, "0")}`,
    kind: "Bus",
  })),
  ...Array.from({ length: 3 }, (_, index) => ({
    label: `Send ${String(index + 13).padStart(2, "0")}`,
    kind: "Send",
  })),
  { label: "Mix 16", kind: "Mix" },
];

for (let index = 1; index <= 16; index += 1) {
  const card = cloneTemplate(oxiTemplate, ".encoder-card");
  card.dataset.controller = "oxiE16";
  card.dataset.index = String(index - 1);
  setLegend(
    card,
    `Encoder ${String(index).padStart(2, "0")}`,
    String(index).padStart(2, "0"),
  );
  nameFields(card, `oxiE16.${index - 1}`);
  oxiGrid.append(card);
}

for (let index = 1; index <= 8; index += 1) {
  const card = cloneTemplate(monolitTemplate, ".slider-card");
  card.dataset.controller = "lightreftMonolit";
  card.dataset.index = String(index - 1);
  setLegend(
    card,
    `Slider ${String(index).padStart(2, "0")}`,
    String(index).padStart(2, "0"),
  );
  nameFields(card, `lightreftMonolit.${index - 1}`);
  monolitGrid.append(card);
}

tonverkTracks.forEach((track, index) => {
  const number = String(index + 1).padStart(2, "0");
  const card = cloneTemplate(tonverkTemplate, ".tonverk-card");
  card.dataset.controller = "elektronTonverk";
  card.dataset.index = String(index);
  setLegend(card, track.label, number);
  nameFields(card, `elektronTonverk.${index}`);
  const trackNumber = card.querySelector<HTMLElement>("[data-track-number]");
  const trackKind = card.querySelector<HTMLElement>("[data-track-kind]");
  if (trackNumber === null || trackKind === null) {
    throw new Error("Missing Tonverk track visual");
  }
  trackNumber.textContent = number;
  trackKind.textContent = track.kind;
  (index < 8 ? tonverkAudioGrid : tonverkRoutingGrid).append(card);
});

for (const axis of ["x", "y", "z"] as const) {
  const card = cloneTemplate(zonaTemplate, ".axis-card");
  card.dataset.controller = "intechZona";
  card.dataset.axis = axis;
  setLegend(card, `${axis.toUpperCase()} axis`, axis.toUpperCase());
  nameFields(card, `intechZona.${axis}`);
  zonaControls.append(card);
}

restoreConfig();
resizeNotes();
updateModeFields();
updateSummaries();
document.body.classList.add("is-collapsed");

form.addEventListener("input", () => {
  resizeNotes();
  updateModeFields();
  updateSummaries();
  saveConfig();
});

form.addEventListener("change", () => {
  updateModeFields();
  updateSummaries();
  saveConfig();
});

form.addEventListener("click", (event) => {
  if (!document.body.classList.contains("is-collapsed")) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const summary = target.closest<HTMLButtonElement>("[data-open-details]");
  if (summary === null) {
    return;
  }
  const card = summary.closest<HTMLElement>(".control-card, .axis-card");
  if (card !== null) {
    openControlDialog(card);
  }
});

viewToggle.addEventListener("click", () => {
  if (controlDialog.open) {
    controlDialog.close();
  }
  const isCollapsed = document.body.classList.toggle("is-collapsed");
  viewLabel.textContent = isCollapsed ? "Collapsed" : "Expanded";
  viewToggle.setAttribute("aria-pressed", String(!isCollapsed));
  viewToggle.setAttribute(
    "aria-label",
    `Switch to ${isCollapsed ? "expanded" : "collapsed"} view`,
  );
});

closeDialogButton.addEventListener("click", () => {
  controlDialog.close();
});

controlDialog.addEventListener("close", restoreDialogCard);

downloadButton.addEventListener("click", () => {
  const contents = JSON.stringify(readConfig(), null, 2);
  const file = new Blob([contents], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "tda-midi-cc-config.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("JSON downloaded");
});

function readConfig(): MidiConfig {
  return {
    oxiE16: readMidiControls("oxiE16", 16),
    lightreftMonolit: readMidiControls("lightreftMonolit", 8),
    intechZona: {
      x: readAxis("x"),
      y: readAxis("y"),
      z: readAxis("z"),
    },
    elektronTonverk: readPurposeControls("elektronTonverk", 16),
    notes: notes.value,
  };
}

function readMidiControls(controller: string, count: number): MidiControl[] {
  return Array.from({ length: count }, (_, index) => {
    const card = getControlCard(controller, String(index));
    return {
      mode: getField(card, "mode").value as ControlMode,
      channel: getField(card, "channel").value,
      number: getField(card, "number").value,
      description: getField(card, "description").value,
      button: getField(card, "button").value,
    };
  });
}

function readAxis(axis: "x" | "y" | "z"): AxisControl {
  const card = getControlCard("intechZona", axis);
  return {
    channel: getField(card, "channel").value,
    number: getField(card, "number").value,
    description: getField(card, "description").value,
  };
}

function readPurposeControls(controller: string, count: number): PurposeControl[] {
  return Array.from({ length: count }, (_, index) => ({
    description: getField(
      getControlCard(controller, String(index)),
      "description",
    ).value,
  }));
}

function saveConfig(): void {
  localStorage.setItem(storageKey, JSON.stringify(readConfig()));
  setStatus("Saved locally");
}

function restoreConfig(): void {
  const saved = localStorage.getItem(storageKey);
  if (saved === null) {
    return;
  }

  try {
    const config = JSON.parse(saved) as unknown;
    const normalizedConfig = normalizeMidiConfig(config);
    if (normalizedConfig === null) {
      return;
    }
    normalizedConfig.oxiE16.forEach((control, index) => {
      fillMidiControl(getControlCard("oxiE16", String(index)), control);
    });
    normalizedConfig.lightreftMonolit.forEach((control, index) => {
      fillMidiControl(
        getControlCard("lightreftMonolit", String(index)),
        control,
      );
    });
    for (const axis of ["x", "y", "z"] as const) {
      fillAxis(getControlCard("intechZona", axis), normalizedConfig.intechZona[axis]);
    }
    normalizedConfig.elektronTonverk?.forEach((control, index) => {
      getField(
        getControlCard("elektronTonverk", String(index)),
        "description",
      ).value = control.description;
    });
    notes.value = normalizedConfig.notes;
    localStorage.setItem(storageKey, JSON.stringify(normalizedConfig));
    setStatus("Local config restored");
  } catch {
    setStatus("Could not restore local config");
  }
}

function fillMidiControl(card: HTMLElement, control: MidiControl): void {
  getField(card, "mode").value = control.mode;
  getField(card, "channel").value = control.channel;
  getField(card, "number").value = control.number;
  getField(card, "description").value = control.description;
  getField(card, "button").value = control.button;
}

function fillAxis(card: HTMLElement, control: AxisControl): void {
  getField(card, "channel").value = control.channel;
  getField(card, "number").value = control.number;
  getField(card, "description").value = control.description;
}

function updateModeFields(): void {
  for (const card of form.querySelectorAll<HTMLElement>(".encoder-card")) {
    const isSysEx = getField(card, "mode").value === "sysex";
    for (const input of card.querySelectorAll<HTMLInputElement>(
      ".midi-fields input",
    )) {
      input.disabled = isSysEx;
    }
  }

  for (const card of form.querySelectorAll<HTMLElement>(".slider-card")) {
    const mode = getField(card, "mode").value;
    const label = card.querySelector<HTMLElement>("[data-number-label]");
    if (label === null) {
      throw new Error("Missing Monolit number label");
    }
    label.childNodes[0].textContent = mode === "note" ? "Note\n            " : "CC\n            ";
  }
}

function updateSummaries(): void {
  for (const card of form.querySelectorAll<HTMLElement>(
    ".control-card, .axis-card",
  )) {
    const description = getField(card, "description").value.trim();
    const buttonDescription = card
      .querySelector<HTMLInputElement>("[data-field=\"button\"]")
      ?.value.trim();
    const descriptionSummary = card.querySelector<HTMLElement>(
      "[data-summary-description]",
    );
    if (descriptionSummary === null) {
      throw new Error("Missing control summary");
    }
    descriptionSummary.textContent =
      [description, buttonDescription].filter(Boolean).join("/") || "—";
  }
}

let dialogReturnParent: HTMLElement | null = null;
let dialogReturnNext: Element | null = null;

function openControlDialog(card: HTMLElement): void {
  dialogReturnParent = card.parentElement;
  dialogReturnNext = card.nextElementSibling;
  dialogContent.append(card);
  controlDialog.showModal();
  const firstField = card.querySelector<HTMLElement>("select, input");
  firstField?.focus();
}

function restoreDialogCard(): void {
  const card = dialogContent.querySelector<HTMLElement>(
    ".control-card, .axis-card",
  );
  if (card === null || dialogReturnParent === null) {
    return;
  }
  dialogReturnParent.insertBefore(card, dialogReturnNext);
  const summary = card.querySelector<HTMLButtonElement>("[data-open-details]");
  summary?.focus();
  dialogReturnParent = null;
  dialogReturnNext = null;
}

function normalizeMidiConfig(value: unknown): MidiConfig | null {
  if (isMidiConfig(value)) {
    return value;
  }
  if (isLegacyMidiConfig(value)) {
    return {
      oxiE16: value.oxiE16,
      lightreftMonolit: value.lightreftMonolit,
      intechZona: value.intechZoya,
      ...(value.elektronTonverk === undefined
        ? {}
        : { elektronTonverk: value.elektronTonverk }),
      notes: value.notes ?? "",
    };
  }
  return null;
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

function getControlCard(controller: string, position: string): HTMLElement {
  const selector =
    controller === "intechZona"
      ? `[data-controller="${controller}"][data-axis="${position}"]`
      : `[data-controller="${controller}"][data-index="${position}"]`;
  const card = form.querySelector<HTMLElement>(selector);
  if (card === null) {
    throw new Error(`Missing control card: ${controller} ${position}`);
  }
  return card;
}

function resizeNotes(): void {
  notes.style.height = "auto";
  notes.style.height = `${notes.scrollHeight}px`;
}

function getField(
  card: HTMLElement,
  field: string,
): HTMLInputElement | HTMLSelectElement {
  const input = card.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[data-field="${field}"]`,
  );
  if (input === null) {
    throw new Error(`Missing field: ${field}`);
  }
  return input;
}

function nameFields(card: HTMLElement, prefix: string): void {
  for (const field of card.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
    "[data-field]",
  )) {
    field.name = `${prefix}.${field.dataset.field ?? "field"}`;
  }
}

function setLegend(card: HTMLElement, text: string, shortText: string): void {
  const legend = card.querySelector("legend");
  if (legend === null) {
    throw new Error("Missing control legend");
  }
  legend.textContent = text;
  legend.dataset.shortLabel = shortText;
}

function cloneTemplate(template: HTMLTemplateElement, selector: string): HTMLElement {
  const clone = template.content.cloneNode(true);
  if (!(clone instanceof DocumentFragment)) {
    throw new Error("Could not clone control template");
  }
  const element = clone.querySelector<HTMLElement>(selector);
  if (element === null) {
    throw new Error(`Missing template element: ${selector}`);
  }
  return element;
}

function setStatus(message: string): void {
  saveStatus.value = message;
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element: ${id}`);
  }
  return element;
}
