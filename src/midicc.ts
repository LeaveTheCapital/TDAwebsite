import "../midicc.css";
import {
  emptyEzeptocoreBanks,
  ezeptocoreBankCount,
  ezeptocoreSlotCount,
  type AxisControl,
  type ControlMode,
  type EzeptocoreConfig,
  type MidiConfig,
  type MidiControl,
  type PurposeControl,
} from "./midi/midi-config.ts";
import type { MidiConfigArchivePhase } from "./midi/midi-config-archive.ts";
import { openMidiConfigStorage } from "./storage/open-midi-config-storage.ts";
import { songsByProgram, type Song } from "./songs";
import { loadSetlist, saveSetlist } from "./setlist";

const { file: configFile, archive } = openMidiConfigStorage();
const uploadButton = getElement("upload-config") as HTMLButtonElement;
const loadButton = getElement("load-config") as HTMLButtonElement;
const signInButton = getElement("cloud-sign-in") as HTMLButtonElement;
const uploadStatus = getElement("upload-status") as HTMLOutputElement;
const cloudAccount = getElement("cloud-account") as HTMLOutputElement;
let archivePhase: MidiConfigArchivePhase | null = null;
let cloudBusy = false;
let cloudSessionAnnounced = false;
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
const ezeptocoreBankSelect = getElement("ezeptocore-bank") as HTMLSelectElement;
const ezeptocoreSlots = getElement("ezeptocore-slots") as HTMLDivElement;
const ezeptocoreLedRing = getElement("ezeptocore-leds") as HTMLDivElement;
const ezeptocoreBankLamp = getElement("ezeptocore-bank-lamp");
const ezeptocoreSlotInputs: HTMLInputElement[] = [];
const ezeptocoreLedButtons: HTMLButtonElement[] = [];
let ezeptocoreBanks = emptyEzeptocoreBanks();
let ezeptocoreBankIndex = 0;
const setlist = getElement("setlist") as HTMLOListElement;
const setlistStatus = getElement("setlist-status") as HTMLOutputElement;
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

const setlistPrograms = loadSetlist();
let draggedSetlistProgram: number | undefined;
let expandedSetlistProgram: number | undefined;

renderSetlist();

function renderSetlist(): void {
  setlist.replaceChildren();

  setlistPrograms.forEach((program, index) => {
    const song = songsByProgram.get(program);
    if (song === undefined) {
      return;
    }

    const item = document.createElement("li");
    item.className = "setlist-song";
    item.draggable = true;
    item.dataset.program = String(program);

    const handle = document.createElement("span");
    handle.className = "setlist-drag-handle";
    handle.ariaHidden = "true";
    handle.textContent = "⠿";

    const position = document.createElement("span");
    position.className = "setlist-position";
    position.textContent = String(index + 1).padStart(2, "0");

    const name = document.createElement("strong");
    name.textContent = song.name;

    const actions = document.createElement("div");
    actions.className = "setlist-actions";

    const configId = `song-config-${program}`;
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "setlist-edit-button";
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-controls", configId);
    editButton.setAttribute(
      "aria-expanded",
      String(expandedSetlistProgram === program),
    );
    editButton.setAttribute("aria-label", `Edit ${song.name}`);
    editButton.addEventListener("click", () => {
      const isOpening = expandedSetlistProgram !== program;
      expandedSetlistProgram = isOpening ? program : undefined;
      renderSetlist();
      if (isOpening) {
        document.getElementById(configId)?.focus();
      } else {
        setlist
          .querySelector<HTMLButtonElement>(`[aria-controls="${configId}"]`)
          ?.focus();
      }
    });

    const moveControls = document.createElement("span");
    moveControls.className = "setlist-move-controls";
    moveControls.append(
      createSetlistMoveButton(program, -1, "Move up", index === 0),
      createSetlistMoveButton(
        program,
        1,
        "Move down",
        index === setlistPrograms.length - 1,
      ),
    );
    actions.append(editButton, moveControls);

    item.append(handle, position, name, actions);
    if (expandedSetlistProgram === program) {
      item.append(createSongConfig(program, song, configId));
    }
    item.addEventListener("dragstart", handleSetlistDragStart);
    item.addEventListener("dragover", handleSetlistDragOver);
    item.addEventListener("drop", handleSetlistDrop);
    item.addEventListener("dragend", clearSetlistDragState);
    setlist.append(item);
  });
}

function createSongConfig(
  program: number,
  song: Song,
  id: string,
): HTMLElement {
  const config = document.createElement("section");
  config.id = id;
  config.className = "song-config";
  config.tabIndex = -1;
  config.setAttribute("aria-label", `${song.name} config`);

  const heading = document.createElement("div");
  heading.className = "song-config-heading";
  const title = document.createElement("h3");
  title.textContent = "Song config";
  const readOnly = document.createElement("span");
  readOnly.textContent = "Read only";
  heading.append(title, readOnly);

  const summary = document.createElement("dl");
  summary.className = "song-config-summary";
  appendConfigValue(summary, "Program", String(program));
  appendConfigValue(summary, "Name", song.name);
  appendConfigValue(summary, "Sections", String(song.sections.length));

  const sections = document.createElement("ol");
  sections.className = "song-config-sections";
  song.sections.forEach((section, index) => {
    const item = document.createElement("li");
    const sectionTitle = document.createElement("h4");
    sectionTitle.textContent = `${String(index + 1).padStart(2, "0")} · ${section.id}`;
    const values = document.createElement("dl");
    appendConfigValue(values, "Bars", String(section.bars));
    appendConfigValue(values, "Beats", String(section.beats));
    appendConfigValue(values, "Lyrics", section.lyrics ?? "—", "song-config-lyrics");
    appendConfigValue(values, "Notes", section.notes ?? "—");
    appendConfigValue(values, "Tonverk", section.tonverk ?? "—");
    item.append(sectionTitle, values);
    sections.append(item);
  });

  config.append(heading, summary, sections);
  return config;
}

function appendConfigValue(
  list: HTMLDListElement,
  label: string,
  value: string,
  valueClass?: string,
): void {
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  description.textContent = value;
  if (valueClass !== undefined) {
    description.className = valueClass;
  }
  list.append(term, description);
}

function createSetlistMoveButton(
  program: number,
  direction: -1 | 1,
  label: string,
  disabled: boolean,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "setlist-move-button";
  button.textContent = direction === -1 ? "↑" : "↓";
  button.setAttribute("aria-label", `${label} ${songsByProgram.get(program)?.name ?? "song"}`);
  button.disabled = disabled;
  button.addEventListener("click", () => {
    moveSetlistSong(program, direction);
  });
  return button;
}

function handleSetlistDragStart(event: DragEvent): void {
  const item = event.currentTarget as HTMLLIElement;
  draggedSetlistProgram = Number(item.dataset.program);
  item.classList.add("is-dragging");
  event.dataTransfer?.setData("text/plain", String(draggedSetlistProgram));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
  }
}

function handleSetlistDragOver(event: DragEvent): void {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

function handleSetlistDrop(event: DragEvent): void {
  event.preventDefault();
  const target = event.currentTarget as HTMLLIElement;
  const targetProgram = Number(target.dataset.program);
  const sourceProgram = draggedSetlistProgram ?? Number(event.dataTransfer?.getData("text/plain"));

  if (!Number.isInteger(sourceProgram) || sourceProgram === targetProgram) {
    clearSetlistDragState();
    return;
  }

  const fromIndex = setlistPrograms.indexOf(sourceProgram);
  const toIndex = setlistPrograms.indexOf(targetProgram);
  if (fromIndex < 0 || toIndex < 0) {
    clearSetlistDragState();
    return;
  }

  setlistPrograms.splice(fromIndex, 1);
  setlistPrograms.splice(toIndex, 0, sourceProgram);
  commitSetlist();
}

function moveSetlistSong(program: number, direction: -1 | 1): void {
  const fromIndex = setlistPrograms.indexOf(program);
  const toIndex = fromIndex + direction;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= setlistPrograms.length) {
    return;
  }

  [setlistPrograms[fromIndex], setlistPrograms[toIndex]] =
    [setlistPrograms[toIndex], setlistPrograms[fromIndex]];
  commitSetlist();
}

function commitSetlist(): void {
  saveSetlist(setlistPrograms);
  setlistStatus.value = "Setlist saved locally";
  renderSetlist();
  clearSetlistDragState();
}

function clearSetlistDragState(): void {
  draggedSetlistProgram = undefined;
  setlist.querySelectorAll(".is-dragging").forEach((item) => {
    item.classList.remove("is-dragging");
  });
}

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

mountEzeptocoreEditor();
restoreConfig();
resizeNotes();
updateModeFields();
updateSummaries();
document.body.classList.add("is-collapsed");

form.addEventListener("input", () => {
  resizeNotes();
  updateModeFields();
  updateSummaries();
  updateEzeptocoreLeds();
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

uploadButton.addEventListener("click", () => {
  void uploadConfig();
});

loadButton.addEventListener("click", () => {
  void loadCloudConfig();
});

signInButton.addEventListener("click", () => {
  void toggleCloudAccount();
});

watchArchive();

async function uploadConfig(): Promise<void> {
  if (!beginCloudAction()) {
    return;
  }
  uploadStatus.value = "Uploading…";
  try {
    const place = await archive.save(readConfig());
    uploadStatus.value =
      place === "remote"
        ? "Cloud copy saved."
        : "Saved in this browser. Cloud storage is not configured.";
  } catch (error: unknown) {
    uploadStatus.value = archive.failureMessage(
      error,
      "Upload failed. Please try again. Your local config is unchanged.",
    );
  } finally {
    setCloudBusy(false);
  }
}

async function loadCloudConfig(): Promise<void> {
  if (!beginCloudAction()) {
    return;
  }
  uploadStatus.value = "Loading cloud copy…";
  try {
    const loaded = await archive.load();
    if ("invalid" in loaded) {
      uploadStatus.value =
        "Could not load the cloud copy. The saved config was not recognised. Your local config is unchanged.";
      return;
    }
    if (loaded.config === null) {
      uploadStatus.value =
        loaded.place === "remote"
          ? "No cloud copy saved yet."
          : "No copy saved in this browser yet.";
      return;
    }
    applyConfig(loaded.config);
    resizeNotes();
    updateModeFields();
    updateSummaries();
    setStatus("Saved locally");
    uploadStatus.value =
      loaded.place === "remote"
        ? "Cloud copy loaded."
        : "Loaded the copy saved in this browser.";
  } catch (error: unknown) {
    uploadStatus.value = archive.failureMessage(
      error,
      "Could not load the cloud copy. Your local config is unchanged.",
    );
  } finally {
    setCloudBusy(false);
  }
}

async function toggleCloudAccount(): Promise<void> {
  const phase = archive.phase();
  if (cloudBusy || phase.kind !== "remote") {
    return;
  }
  const signingIn = phase.account === null;
  setCloudBusy(true);
  uploadStatus.value = signingIn ? "Opening Google sign-in…" : "Signing out…";
  try {
    if (signingIn) {
      await archive.signIn();
      uploadStatus.value = "Signed in.";
    } else {
      await archive.signOut();
      uploadStatus.value = "Signed out.";
    }
  } catch (error: unknown) {
    uploadStatus.value = archive.failureMessage(
      error,
      signingIn
        ? "Sign-in failed. Please try again."
        : "Sign-out failed. Please try again.",
    );
  } finally {
    setCloudBusy(false);
  }
}

function watchArchive(): void {
  archive.onPhase((phase) => {
    const wasStarting = archivePhase?.kind === "starting";
    archivePhase = phase;
    paintArchive(phase);
    if (phase.kind === "starting") {
      setCloudBusy(true);
      return;
    }
    if (wasStarting) {
      setCloudBusy(false);
    }
  });
}

function paintArchive(phase: MidiConfigArchivePhase): void {
  if (phase.kind === "local") {
    signInButton.hidden = true;
    cloudAccount.hidden = true;
    uploadStatus.value =
      phase.reason === "unavailable"
        ? "Cloud storage could not start. Uploads stay in this browser."
        : "Cloud storage is not configured. Uploads stay in this browser.";
    return;
  }
  signInButton.hidden = false;
  cloudAccount.hidden = false;
  if (phase.kind === "starting") {
    cloudAccount.value = "Checking Google sign-in…";
    uploadStatus.value = "Checking cloud storage…";
    return;
  }
  const account = phase.account;
  signInButton.textContent = account === null ? "Sign in with Google" : "Sign out";
  if (account === null) {
    cloudAccount.value = "Not signed in";
  } else if (account.email === null) {
    cloudAccount.value = "Signed in";
  } else {
    cloudAccount.value = `Signed in as ${account.email}`;
  }
  if (phase.rejection !== null) {
    uploadStatus.value = phase.rejection;
    cloudSessionAnnounced = true;
    return;
  }
  if (!cloudSessionAnnounced) {
    cloudSessionAnnounced = true;
    uploadStatus.value =
      account === null
        ? "Sign in with Google to upload or load the cloud copy."
        : "Signed in. Upload saves a cloud copy; load brings it back.";
  }
}

function beginCloudAction(): boolean {
  if (cloudBusy || archive.phase().kind === "starting") {
    if (archive.phase().kind === "starting") {
      uploadStatus.value = "Cloud storage is still starting. Try again in a moment.";
    }
    return false;
  }
  const blocked = archive.blockedReason();
  if (blocked !== null) {
    uploadStatus.value = blocked;
    return false;
  }
  setCloudBusy(true);
  return true;
}

function setCloudBusy(busy: boolean): void {
  cloudBusy = busy;
  uploadButton.disabled = busy;
  loadButton.disabled = busy;
  signInButton.disabled = busy;
}

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
    ezeptocore: readEzeptocore(),
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

function readEzeptocore(): EzeptocoreConfig {
  syncActiveEzeptocoreBank();
  return {
    banks: ezeptocoreBanks.map((bank) => [...bank]),
  };
}

function saveConfig(): void {
  configFile.save(readConfig());
  setStatus("Saved locally");
}

function restoreConfig(): void {
  try {
    const saved = configFile.load();
    if (saved === null) {
      return;
    }
    applyConfig(saved);
    setStatus("Local config restored");
  } catch {
    setStatus("Could not restore local config");
  }
}

function applyConfig(config: MidiConfig): void {
  config.oxiE16.forEach((control, index) => {
    fillMidiControl(getControlCard("oxiE16", String(index)), control);
  });
  config.lightreftMonolit.forEach((control, index) => {
    fillMidiControl(getControlCard("lightreftMonolit", String(index)), control);
  });
  for (const axis of ["x", "y", "z"] as const) {
    fillAxis(getControlCard("intechZona", axis), config.intechZona[axis]);
  }
  config.elektronTonverk?.forEach((control, index) => {
    getField(
      getControlCard("elektronTonverk", String(index)),
      "description",
    ).value = control.description;
  });
  notes.value = config.notes;
  applyEzeptocoreConfig(config.ezeptocore);
  configFile.save(config);
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

function mountEzeptocoreEditor(): void {
  for (let index = 0; index < ezeptocoreSlotCount; index += 1) {
    const number = String(index + 1).padStart(2, "0");
    const slot = document.createElement("label");
    slot.className = "ezeptocore-slot";
    const slotNumber = document.createElement("span");
    slotNumber.textContent = number;
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Sample name";
    input.autocomplete = "off";
    input.dataset.ezeptocoreSlot = String(index);
    input.setAttribute("aria-label", `Sample ${number}`);
    slot.append(slotNumber, input);
    ezeptocoreSlots.append(slot);
    ezeptocoreSlotInputs.push(input);

    const led = document.createElement("button");
    led.type = "button";
    led.className = "amen-led";
    led.tabIndex = -1;
    led.setAttribute("aria-hidden", "true");
    led.textContent = String(index + 1);
    led.style.setProperty(
      "--angle",
      `${(index / ezeptocoreSlotCount) * 360}deg`,
    );
    led.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    led.addEventListener("click", () => {
      input.focus();
    });
    ezeptocoreLedRing.append(led);
    ezeptocoreLedButtons.push(led);
  }

  ezeptocoreBankSelect.addEventListener("change", () => {
    const nextIndex = Number(ezeptocoreBankSelect.value) - 1;
    if (
      !Number.isInteger(nextIndex) ||
      nextIndex < 0 ||
      nextIndex >= ezeptocoreBankCount
    ) {
      ezeptocoreBankSelect.value = String(ezeptocoreBankIndex + 1);
      return;
    }
    if (nextIndex === ezeptocoreBankIndex) {
      return;
    }
    syncActiveEzeptocoreBank();
    ezeptocoreBankIndex = nextIndex;
    renderActiveEzeptocoreBank();
  });

  ezeptocoreSlots.addEventListener("focusin", updateEzeptocoreLeds);
  ezeptocoreSlots.addEventListener("focusout", updateEzeptocoreLeds);
  renderActiveEzeptocoreBank();
}

function renderActiveEzeptocoreBank(): void {
  const bank = ezeptocoreBanks[ezeptocoreBankIndex];
  ezeptocoreSlotInputs.forEach((input, index) => {
    input.value = bank[index] ?? "";
    input.name = `ezeptocore.${ezeptocoreBankIndex}.sample.${index}`;
  });
  ezeptocoreBankLamp.textContent = `Bank ${ezeptocoreBankIndex + 1}`;
  updateEzeptocoreLeds();
}

function syncActiveEzeptocoreBank(): void {
  const bank = ezeptocoreBanks[ezeptocoreBankIndex];
  ezeptocoreSlotInputs.forEach((input, index) => {
    bank[index] = input.value;
  });
}

function updateEzeptocoreLeds(): void {
  ezeptocoreSlotInputs.forEach((input, index) => {
    const led = ezeptocoreLedButtons[index];
    led.classList.toggle("is-named", input.value.trim() !== "");
    led.classList.toggle("is-active", document.activeElement === input);
  });
}

function applyEzeptocoreConfig(config: EzeptocoreConfig | undefined): void {
  ezeptocoreBanks =
    config === undefined
      ? emptyEzeptocoreBanks()
      : config.banks.map((bank) => [...bank]);
  ezeptocoreBankIndex = 0;
  ezeptocoreBankSelect.value = "1";
  renderActiveEzeptocoreBank();
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
