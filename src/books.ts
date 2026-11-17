import "../books.css";
import { JsonStorageSocket } from "./storage/json-storage-socket";
import { LocalStorageAdapter } from "./storage/local-storage-adapter";

enum BookGenre {
  Fantasy = "Fantasy",
  ScienceFiction = "Science fiction",
  Mystery = "Mystery",
  Thriller = "Thriller",
  Horror = "Horror",
  Romance = "Romance",
  HistoricalFiction = "Historical fiction",
  LiteraryFiction = "Literary fiction",
  Classic = "Classic",
  Crime = "Crime",
  Adventure = "Adventure",
  YoungAdult = "Young adult",
  Children = "Children's",
  GraphicNovel = "Graphic novel",
  Poetry = "Poetry",
  Drama = "Drama",
  ShortStories = "Short stories",
  Biography = "Biography",
  Memoir = "Memoir",
  History = "History",
  Science = "Science",
  Philosophy = "Philosophy",
  Essays = "Essays",
  Nonfiction = "Nonfiction",
}

enum FilmGenre {
  Action = "Action",
  Adventure = "Adventure",
  Animation = "Animation",
  Comedy = "Comedy",
  Crime = "Crime",
  Documentary = "Documentary",
  Drama = "Drama",
  Family = "Family",
  Fantasy = "Fantasy",
  Historical = "Historical",
  Horror = "Horror",
  Musical = "Musical",
  Mystery = "Mystery",
  Romance = "Romance",
  ScienceFiction = "Science fiction",
  Thriller = "Thriller",
  War = "War",
  Western = "Western",
}

enum SeriesGenre {
  Action = "Action",
  Adventure = "Adventure",
  Animation = "Animation",
  Anthology = "Anthology",
  Comedy = "Comedy",
  Crime = "Crime",
  Documentary = "Documentary",
  Drama = "Drama",
  Fantasy = "Fantasy",
  Historical = "Historical",
  Horror = "Horror",
  Mystery = "Mystery",
  Reality = "Reality",
  Romance = "Romance",
  ScienceFiction = "Science fiction",
  Sitcom = "Sitcom",
  Soap = "Soap",
  Thriller = "Thriller",
  Western = "Western",
}

enum GameGenre {
  Action = "Action",
  Adventure = "Adventure",
  RolePlaying = "Role-playing",
  Strategy = "Strategy",
  Simulation = "Simulation",
  Sports = "Sports",
  Racing = "Racing",
  Puzzle = "Puzzle",
  Platformer = "Platformer",
  Fighting = "Fighting",
  Shooter = "Shooter",
  Horror = "Horror",
  Survival = "Survival",
  Sandbox = "Sandbox",
  Stealth = "Stealth",
  Rhythm = "Rhythm",
  VisualNovel = "Visual novel",
  Roguelike = "Roguelike",
  Metroidvania = "Metroidvania",
  PointAndClick = "Point and click",
}

type LibraryGenre = BookGenre | FilmGenre | SeriesGenre | GameGenre;

const entryFilterFields = ["genre", "dateWatched", "dateMade", "rating"] as const;

type EntryFilterField = (typeof entryFilterFields)[number];

type EntryDetailField = Exclude<EntryFilterField, "rating">;

interface CatalogEntry {
  id: string;
  title: string;
  creator: string;
  rating: number;
  notes: string;
  genre?: LibraryGenre;
  dateWatched?: string;
  dateMade?: string;
}

interface EntryDraft {
  title: string;
  creator: string;
  rating: number;
  notes: string;
  genre?: LibraryGenre;
  dateWatched?: string;
  dateMade?: string;
}

interface GamePlatform {
  id: string;
  name: string;
  games: CatalogEntry[];
}

interface SimpleLists {
  books: CatalogEntry[];
  films: CatalogEntry[];
  series: CatalogEntry[];
}

interface MediaLibrary extends SimpleLists {
  platforms: GamePlatform[];
}

interface ListDefinition {
  title: string;
  creatorLabel: string;
  addLabel: string;
  emptyLabel: string;
  genres: readonly LibraryGenre[];
  dateWatchedLabel: string;
  dateMadeLabel: string;
  filterFields: readonly EntryFilterField[];
}

type SimpleListKey = keyof SimpleLists;

type EntryFormKind = "add-entry" | "edit-entry" | "add-game" | "edit-game";

type ActiveEditor =
  | { type: "entry"; list: SimpleListKey; id: string }
  | { type: "game"; platformId: string; id: string }
  | { type: "platform"; platformId: string };

interface EntryFieldOptions {
  genres: readonly LibraryGenre[];
  dateWatchedLabel: string;
  dateMadeLabel: string;
}

interface EntryFormOptions extends EntryFieldOptions {
  form: EntryFormKind;
  creatorLabel: string;
  submitLabel: string;
  value: CatalogEntry | null;
  focusKey: string | null;
  list: SimpleListKey | null;
  platformId: string | null;
  id: string | null;
}

interface EntryListContext extends EntryFieldOptions {
  creatorLabel: string;
  emptyLabel: string;
  headingLevel: "h3" | "h4";
  editAction: "edit-entry" | "edit-game";
  deleteAction: "delete-entry" | "delete-game";
  form: "edit-entry" | "edit-game";
  list: SimpleListKey | null;
  platformId: string | null;
}

const storageKey = "tda-books-library-v1";
const uploadStorageKey = "tda-books-library-cloud-demo-v1";
const uploadStorage = new JsonStorageSocket(new LocalStorageAdapter(() => localStorage));

const simpleListDefinitions = {
  books: {
    title: "Books & Literature",
    creatorLabel: "Author",
    addLabel: "Add book",
    emptyLabel: "No books yet.",
    genres: enumValues(BookGenre),
    dateWatchedLabel: "Date read",
    dateMadeLabel: "Published",
    filterFields: entryFilterFields,
  },
  films: {
    title: "Films",
    creatorLabel: "Director",
    addLabel: "Add film",
    emptyLabel: "No films yet.",
    genres: enumValues(FilmGenre),
    dateWatchedLabel: "Date watched",
    dateMadeLabel: "Released",
    filterFields: entryFilterFields,
  },
  series: {
    title: "TV Series",
    creatorLabel: "Creator",
    addLabel: "Add series",
    emptyLabel: "No TV series yet.",
    genres: enumValues(SeriesGenre),
    dateWatchedLabel: "Date watched",
    dateMadeLabel: "First aired",
    filterFields: entryFilterFields,
  },
} satisfies Record<SimpleListKey, ListDefinition>;

const gameListDefinition = {
  title: "Video games",
  creatorLabel: "Developer",
  addLabel: "Add game",
  emptyLabel: "No games on this platform yet.",
  platformEmptyLabel: "No platforms yet.",
  help: "Add a platform for each computer or console, then keep a separate list of games for it.",
  genres: enumValues(GameGenre),
  dateWatchedLabel: "Date played",
  dateMadeLabel: "Released",
  filterFields: entryFilterFields,
} satisfies ListDefinition & {
  platformEmptyLabel: string;
  help: string;
};

const libraryRoot = getElement("library");
const saveStatus = getElement("save-status") as HTMLOutputElement;
const uploadStatus = getElement("upload-status") as HTMLOutputElement;
const downloadButton = getElement("download-library") as HTMLButtonElement;
const uploadButton = getElement("upload-library") as HTMLButtonElement;

let library: MediaLibrary = emptyLibrary();
let editor: ActiveEditor | null = null;
let editorSnapshot: CatalogEntry | null = null;
let platformNameSnapshot: string | null = null;
let focusEditor = false;
let focusKey: string | null = null;

downloadButton.addEventListener("click", () => {
  downloadLibrary();
});

uploadButton.addEventListener("click", () => {
  void uploadLibrary();
});

libraryRoot.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  if (!(form instanceof HTMLFormElement)) {
    return;
  }
  const kind = form.dataset.form;
  if (kind === "add-entry") {
    addSimpleEntry(form);
    return;
  }
  if (kind === "add-game") {
    addGame(form);
    return;
  }
  if (kind === "add-platform") {
    addPlatform(form);
    return;
  }
  if (kind === "edit-entry" || kind === "edit-game" || kind === "edit-platform") {
    finishEditing(form);
  }
});

libraryRoot.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const button = target.closest("button");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }
  const action = button.dataset.action;
  if (action === undefined) {
    return;
  }
  if (action === "cancel-edit") {
    cancelEdit();
    return;
  }
  if (action === "edit-entry") {
    beginEntryEdit(button.dataset.list, button.dataset.id);
    return;
  }
  if (action === "delete-entry") {
    deleteSimpleEntry(button.dataset.list, button.dataset.id);
    return;
  }
  if (action === "edit-game") {
    beginGameEdit(button.dataset.platform, button.dataset.id);
    return;
  }
  if (action === "delete-game") {
    deleteGame(button.dataset.platform, button.dataset.id);
    return;
  }
  if (action === "edit-platform") {
    beginPlatformEdit(button.dataset.platform);
    return;
  }
  if (action === "delete-platform") {
    deletePlatform(button.dataset.platform);
  }
});

libraryRoot.addEventListener("input", onEditInput);
libraryRoot.addEventListener("change", onEditInput);

restoreLibrary();
render();

function onEditInput(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }
  const form = target.closest("form");
  if (!(form instanceof HTMLFormElement) || form.dataset.editing !== "true") {
    return;
  }
  if (!applyEditForm(form)) {
    return;
  }
  saveLibrary();
}

function simpleListKeys(): SimpleListKey[] {
  return Object.keys(simpleListDefinitions) as SimpleListKey[];
}

function emptyLibrary(): MediaLibrary {
  return {
    books: [],
    films: [],
    series: [],
    platforms: [],
  };
}

function isSimpleListKey(value: string | undefined): value is SimpleListKey {
  return value !== undefined && Object.prototype.hasOwnProperty.call(simpleListDefinitions, value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(values: string[]): string {
  for (const value of values) {
    if (value !== "") {
      return value;
    }
  }
  return "";
}

function normalizeRating(value: unknown): number | null {
  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) {
    return null;
  }
  return numeric;
}

function enumValues<T extends Record<string, string>>(enumObject: T): Array<T[keyof T]> {
  return Object.values(enumObject) as Array<T[keyof T]>;
}

function isDetailField(field: EntryFilterField): field is EntryDetailField {
  return field !== "rating";
}

function readOptionalDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  return value;
}

function readGenre(value: unknown, genres: readonly LibraryGenre[]): LibraryGenre | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  for (const genre of genres) {
    const stored: string = genre;
    if (stored === value) {
      return genre;
    }
  }
  return undefined;
}

function formatStoredDate(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function withOptionalEntryFields(
  genre: LibraryGenre | undefined,
  dateWatched: string | undefined,
  dateMade: string | undefined,
): Pick<CatalogEntry, "genre" | "dateWatched" | "dateMade"> {
  const fields: Pick<CatalogEntry, "genre" | "dateWatched" | "dateMade"> = {};
  if (genre !== undefined) {
    fields.genre = genre;
  }
  if (dateWatched !== undefined) {
    fields.dateWatched = dateWatched;
  }
  if (dateMade !== undefined) {
    fields.dateMade = dateMade;
  }
  return fields;
}

function claimId(preferred: string, used: Set<string>): string {
  let id = preferred;
  if (id === "" || used.has(id)) {
    id = crypto.randomUUID();
  }
  while (used.has(id)) {
    id = crypto.randomUUID();
  }
  used.add(id);
  return id;
}

function normalizeEntry(
  value: unknown,
  used: Set<string>,
  genres: readonly LibraryGenre[],
): CatalogEntry | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const title = readString(value.title);
  const creator = firstNonEmpty([
    readString(value.creator),
    readString(value.author),
    readString(value.director),
    readString(value.developer),
  ]);
  const notes = readString(value.notes);
  const rating = normalizeRating(value.rating);
  const genre = readGenre(value.genre, genres);
  const dateWatched = readOptionalDate(value.dateWatched);
  const dateMade = readOptionalDate(value.dateMade);
  if (
    title === "" &&
    creator === "" &&
    notes === "" &&
    rating === null &&
    genre === undefined &&
    dateWatched === undefined &&
    dateMade === undefined
  ) {
    return null;
  }
  return {
    id: claimId(readString(value.id), used),
    title: title === "" ? "Untitled" : title,
    creator,
    rating: rating ?? 3,
    notes,
    ...withOptionalEntryFields(genre, dateWatched, dateMade),
  };
}

function normalizeEntries(
  value: unknown,
  used: Set<string>,
  genres: readonly LibraryGenre[],
): CatalogEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const entries: CatalogEntry[] = [];
  for (const item of value) {
    const entry = normalizeEntry(item, used, genres);
    if (entry !== null) {
      entries.push(entry);
    }
  }
  return entries;
}

function normalizePlatforms(value: unknown, used: Set<string>): GamePlatform[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const platforms: GamePlatform[] = [];
  for (const item of value) {
    if (!isPlainObject(item)) {
      continue;
    }
    const name = readString(item.name);
    const games = normalizeEntries(item.games, used, gameListDefinition.genres);
    if (name === "" && games.length === 0) {
      continue;
    }
    platforms.push({
      id: claimId(readString(item.id), used),
      name: name === "" ? "Untitled platform" : name,
      games,
    });
  }
  return platforms;
}

function hasRecognizedShape(value: Record<string, unknown>): boolean {
  const recognized = new Set<string>([...simpleListKeys(), "platforms"]);
  return Object.keys(value).some((key) => recognized.has(key));
}

function normalizeLibrary(value: unknown): MediaLibrary | null {
  if (!isPlainObject(value)) {
    return null;
  }
  if (!hasRecognizedShape(value) && Object.keys(value).length > 0) {
    return null;
  }
  const used = new Set<string>();
  const next = emptyLibrary();
  for (const key of simpleListKeys()) {
    next[key] = normalizeEntries(value[key], used, simpleListDefinitions[key].genres);
  }
  next.platforms = normalizePlatforms(value.platforms, used);
  return next;
}

function collectIds(): Set<string> {
  const used = new Set<string>();
  for (const key of simpleListKeys()) {
    for (const entry of library[key]) {
      used.add(entry.id);
    }
  }
  for (const platform of library.platforms) {
    used.add(platform.id);
    for (const game of platform.games) {
      used.add(game.id);
    }
  }
  return used;
}

function createUniqueId(): string {
  const used = collectIds();
  let id = crypto.randomUUID();
  while (used.has(id)) {
    id = crypto.randomUUID();
  }
  return id;
}

function cloneEntry(entry: CatalogEntry): CatalogEntry {
  return {
    id: entry.id,
    title: entry.title,
    creator: entry.creator,
    rating: entry.rating,
    notes: entry.notes,
    ...withOptionalEntryFields(entry.genre, entry.dateWatched, entry.dateMade),
  };
}

function clearOptionalField(
  entry: CatalogEntry,
  key: "genre" | "dateWatched" | "dateMade",
): void {
  if (key === "genre") {
    delete entry.genre;
    return;
  }
  if (key === "dateWatched") {
    delete entry.dateWatched;
    return;
  }
  delete entry.dateMade;
}

function assignEntry(entry: CatalogEntry, draft: EntryDraft): void {
  entry.title = draft.title;
  entry.creator = draft.creator;
  entry.rating = draft.rating;
  entry.notes = draft.notes;
  if (draft.genre === undefined) {
    clearOptionalField(entry, "genre");
  } else {
    entry.genre = draft.genre;
  }
  if (draft.dateWatched === undefined) {
    clearOptionalField(entry, "dateWatched");
  } else {
    entry.dateWatched = draft.dateWatched;
  }
  if (draft.dateMade === undefined) {
    clearOptionalField(entry, "dateMade");
  } else {
    entry.dateMade = draft.dateMade;
  }
}

function findSimpleEntry(list: SimpleListKey, id: string): CatalogEntry | undefined {
  return library[list].find((entry) => entry.id === id);
}

function findPlatform(platformId: string | undefined): GamePlatform | undefined {
  if (platformId === undefined) {
    return undefined;
  }
  return library.platforms.find((platform) => platform.id === platformId);
}

function findGame(platformId: string | undefined, id: string | undefined): CatalogEntry | undefined {
  if (id === undefined) {
    return undefined;
  }
  return findPlatform(platformId)?.games.find((game) => game.id === id);
}

function setStatus(message: string): void {
  saveStatus.value = message;
}

function saveLibrary(): void {
  const serialized = JSON.stringify(library);
  try {
    localStorage.setItem(storageKey, serialized);
    setStatus("Saved locally");
  } catch {
    setStatus("Could not save the library in this browser.");
  }
}

function restoreLibrary(): void {
  const saved = localStorage.getItem(storageKey);
  if (saved === null) {
    setStatus("Ready");
    return;
  }
  try {
    const normalized = normalizeLibrary(JSON.parse(saved) as unknown);
    if (normalized === null) {
      setStatus("Could not restore local library");
      return;
    }
    library = normalized;
    try {
      localStorage.setItem(storageKey, JSON.stringify(library));
    } catch {
      setStatus("Local library restored");
      return;
    }
    setStatus("Local library restored");
  } catch {
    setStatus("Could not restore local library");
  }
}

function downloadLibrary(): void {
  if (!syncOpenEditor()) {
    return;
  }
  const contents = JSON.stringify(library, null, 2);
  const file = new Blob([contents], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = "tda-books-library.json";
  link.click();
  URL.revokeObjectURL(link.href);
  setStatus("JSON downloaded");
}

async function uploadLibrary(): Promise<void> {
  if (!syncOpenEditor()) {
    return;
  }
  uploadButton.disabled = true;
  uploadStatus.value = "Uploading…";
  try {
    await uploadStorage.write(uploadStorageKey, library);
    uploadStatus.value = "Demo upload saved in this browser.";
  } catch {
    uploadStatus.value = "Upload failed. Please try again. Your local library is unchanged.";
  } finally {
    uploadButton.disabled = false;
  }
}

function stringField(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}

function readEntryDraft(
  form: HTMLFormElement,
  genres: readonly LibraryGenre[],
): EntryDraft | null {
  const data = new FormData(form);
  const title = stringField(data, "title").trim();
  const creator = stringField(data, "creator").trim();
  const notes = stringField(data, "notes").trim();
  const rating = normalizeRating(stringField(data, "rating"));
  if (title === "" || rating === null) {
    return null;
  }
  return {
    title,
    creator,
    rating,
    notes,
    ...withOptionalEntryFields(
      readGenre(stringField(data, "genre"), genres),
      readOptionalDate(stringField(data, "dateWatched")),
      readOptionalDate(stringField(data, "dateMade")),
    ),
  };
}

function readPlatformName(form: HTMLFormElement): string | null {
  const name = stringField(new FormData(form), "name").trim();
  if (name === "") {
    return null;
  }
  return name;
}

function applyEditForm(form: HTMLFormElement): boolean {
  const kind = form.dataset.form;
  if (kind === "edit-entry") {
    const list = form.dataset.list;
    const id = form.dataset.id;
    if (!isSimpleListKey(list) || id === undefined) {
      return false;
    }
    const entry = findSimpleEntry(list, id);
    const draft = readEntryDraft(form, simpleListDefinitions[list].genres);
    if (entry === undefined || draft === null) {
      return false;
    }
    assignEntry(entry, draft);
    return true;
  }
  if (kind === "edit-game") {
    const game = findGame(form.dataset.platform, form.dataset.id);
    const draft = readEntryDraft(form, gameListDefinition.genres);
    if (game === undefined || draft === null) {
      return false;
    }
    assignEntry(game, draft);
    return true;
  }
  if (kind === "edit-platform") {
    const platform = findPlatform(form.dataset.platform);
    const name = readPlatformName(form);
    if (platform === undefined || name === null) {
      return false;
    }
    platform.name = name;
    return true;
  }
  return false;
}

function openEditForm(): HTMLFormElement | null {
  return document.querySelector("#library form[data-editing='true']");
}

function syncOpenEditor(): boolean {
  if (editor === null) {
    return true;
  }
  const form = openEditForm();
  if (form === null) {
    return true;
  }
  if (!form.reportValidity()) {
    return false;
  }
  if (!applyEditForm(form)) {
    setStatus("Add a title and a rating from 1 to 5.");
    return false;
  }
  saveLibrary();
  return true;
}

function clearEditor(): void {
  editor = null;
  editorSnapshot = null;
  platformNameSnapshot = null;
}

function isSameEditor(next: ActiveEditor): boolean {
  if (editor === null || editor.type !== next.type) {
    return false;
  }
  if (editor.type === "entry" && next.type === "entry") {
    return editor.list === next.list && editor.id === next.id;
  }
  if (editor.type === "game" && next.type === "game") {
    return editor.platformId === next.platformId && editor.id === next.id;
  }
  if (editor.type === "platform" && next.type === "platform") {
    return editor.platformId === next.platformId;
  }
  return false;
}

function openEditor(
  next: ActiveEditor,
  snapshot: CatalogEntry | null,
  platformName: string | null,
): void {
  if (isSameEditor(next)) {
    return;
  }
  if (!syncOpenEditor()) {
    return;
  }
  editor = next;
  editorSnapshot = snapshot;
  platformNameSnapshot = platformName;
  focusEditor = true;
  focusKey = null;
  render();
}

function beginEntryEdit(list: string | undefined, id: string | undefined): void {
  if (!isSimpleListKey(list) || id === undefined) {
    return;
  }
  const entry = findSimpleEntry(list, id);
  if (entry === undefined) {
    return;
  }
  openEditor({ type: "entry", list, id }, cloneEntry(entry), null);
}

function beginGameEdit(platformId: string | undefined, id: string | undefined): void {
  const game = findGame(platformId, id);
  if (platformId === undefined || id === undefined || game === undefined) {
    return;
  }
  openEditor({ type: "game", platformId, id }, cloneEntry(game), null);
}

function beginPlatformEdit(platformId: string | undefined): void {
  const platform = findPlatform(platformId);
  if (platformId === undefined || platform === undefined) {
    return;
  }
  openEditor({ type: "platform", platformId }, null, platform.name);
}

function cancelEdit(): void {
  if (editor === null) {
    return;
  }
  if (editor.type === "entry" && editorSnapshot !== null) {
    const entry = findSimpleEntry(editor.list, editor.id);
    if (entry !== undefined) {
      assignEntry(entry, editorSnapshot);
    }
  }
  if (editor.type === "game" && editorSnapshot !== null) {
    const game = findGame(editor.platformId, editor.id);
    if (game !== undefined) {
      assignEntry(game, editorSnapshot);
    }
  }
  if (editor.type === "platform" && platformNameSnapshot !== null) {
    const platform = findPlatform(editor.platformId);
    if (platform !== undefined) {
      platform.name = platformNameSnapshot;
    }
  }
  clearEditor();
  saveLibrary();
  render();
}

function finishEditing(form: HTMLFormElement): void {
  if (!form.reportValidity()) {
    return;
  }
  if (!applyEditForm(form)) {
    setStatus("Add a title and a rating from 1 to 5.");
    return;
  }
  clearEditor();
  saveLibrary();
  render();
}

function softenOpenEditor(): void {
  const form = openEditForm();
  if (form === null) {
    return;
  }
  applyEditForm(form);
}

function editingThisEntry(list: SimpleListKey, id: string): boolean {
  return editor?.type === "entry" && editor.list === list && editor.id === id;
}

function editingThisGame(platformId: string, id: string): boolean {
  return editor?.type === "game" && editor.platformId === platformId && editor.id === id;
}

function editingThisPlatform(platformId: string): boolean {
  return editor?.type === "platform" && editor.platformId === platformId;
}

function deleteSimpleEntry(list: string | undefined, id: string | undefined): void {
  if (!isSimpleListKey(list) || id === undefined || findSimpleEntry(list, id) === undefined) {
    return;
  }
  if (editingThisEntry(list, id)) {
    clearEditor();
  } else {
    softenOpenEditor();
  }
  library[list] = library[list].filter((entry) => entry.id !== id);
  saveLibrary();
  render();
}

function deleteGame(platformId: string | undefined, id: string | undefined): void {
  const platform = findPlatform(platformId);
  if (platform === undefined || id === undefined || findGame(platformId, id) === undefined) {
    return;
  }
  if (platformId !== undefined && editingThisGame(platformId, id)) {
    clearEditor();
  } else {
    softenOpenEditor();
  }
  platform.games = platform.games.filter((game) => game.id !== id);
  saveLibrary();
  render();
}

function deletePlatform(platformId: string | undefined): void {
  const platform = findPlatform(platformId);
  if (platformId === undefined || platform === undefined) {
    return;
  }
  const noun = platform.games.length === 1 ? "game" : "games";
  const message =
    platform.games.length === 0
      ? `Delete ${platform.name}?`
      : `Delete ${platform.name} and its ${platform.games.length} ${noun}?`;
  if (!window.confirm(message)) {
    return;
  }
  if (editingThisPlatform(platformId) || (editor?.type === "game" && editor.platformId === platformId)) {
    clearEditor();
  } else {
    softenOpenEditor();
  }
  library.platforms = library.platforms.filter((item) => item.id !== platformId);
  saveLibrary();
  render();
}

function addSimpleEntry(form: HTMLFormElement): void {
  const list = form.dataset.list;
  if (!isSimpleListKey(list)) {
    return;
  }
  if (!form.reportValidity()) {
    return;
  }
  const draft = readEntryDraft(form, simpleListDefinitions[list].genres);
  if (draft === null) {
    setStatus("Add a title and a rating from 1 to 5.");
    return;
  }
  if (!syncOpenEditor()) {
    return;
  }
  library[list].push({ id: createUniqueId(), ...draft });
  focusKey = `add-${list}`;
  saveLibrary();
  render();
}

function addGame(form: HTMLFormElement): void {
  const platform = findPlatform(form.dataset.platform);
  if (platform === undefined) {
    return;
  }
  if (!form.reportValidity()) {
    return;
  }
  const draft = readEntryDraft(form, gameListDefinition.genres);
  if (draft === null) {
    setStatus("Add a title and a rating from 1 to 5.");
    return;
  }
  if (!syncOpenEditor()) {
    return;
  }
  platform.games.push({ id: createUniqueId(), ...draft });
  focusKey = `add-game-${platform.id}`;
  saveLibrary();
  render();
}

function addPlatform(form: HTMLFormElement): void {
  if (!form.reportValidity()) {
    return;
  }
  const name = readPlatformName(form);
  if (name === null) {
    setStatus("Add a platform name.");
    return;
  }
  if (!syncOpenEditor()) {
    return;
  }
  library.platforms.push({ id: createUniqueId(), name, games: [] });
  focusKey = "add-platform";
  saveLibrary();
  render();
}

function render(): void {
  libraryRoot.replaceChildren();
  for (const key of simpleListKeys()) {
    libraryRoot.append(renderSimpleSection(key));
  }
  libraryRoot.append(renderGamesSection());
  if (focusEditor) {
    libraryRoot.querySelector<HTMLElement>("[data-autofocus='true']")?.focus();
    focusEditor = false;
    focusKey = null;
    return;
  }
  if (focusKey !== null) {
    focusNamedField(focusKey);
    focusKey = null;
  }
}

function focusNamedField(key: string): void {
  for (const field of libraryRoot.querySelectorAll<HTMLElement>("[data-focus-key]")) {
    if (field.dataset.focusKey === key) {
      field.focus();
      return;
    }
  }
}

function renderSimpleSection(key: SimpleListKey): HTMLElement {
  const definition = simpleListDefinitions[key];
  const section = document.createElement("section");
  section.className = "library-section";
  const headingId = `${key}-title`;
  section.setAttribute("aria-labelledby", headingId);
  const heading = document.createElement("h2");
  heading.id = headingId;
  heading.textContent = definition.title;
  section.append(heading);
  section.append(
    renderEntryForm({
      form: "add-entry",
      creatorLabel: definition.creatorLabel,
      submitLabel: definition.addLabel,
      value: null,
      focusKey: `add-${key}`,
      list: key,
      platformId: null,
      id: null,
      genres: definition.genres,
      dateWatchedLabel: definition.dateWatchedLabel,
      dateMadeLabel: definition.dateMadeLabel,
    }),
  );
  section.append(
    renderEntries(library[key], {
      creatorLabel: definition.creatorLabel,
      emptyLabel: definition.emptyLabel,
      headingLevel: "h3",
      editAction: "edit-entry",
      deleteAction: "delete-entry",
      form: "edit-entry",
      list: key,
      platformId: null,
      genres: definition.genres,
      dateWatchedLabel: definition.dateWatchedLabel,
      dateMadeLabel: definition.dateMadeLabel,
    }),
  );
  return section;
}

function renderGamesSection(): HTMLElement {
  const section = document.createElement("section");
  section.className = "library-section";
  section.setAttribute("aria-labelledby", "games-title");
  const heading = document.createElement("h2");
  heading.id = "games-title";
  heading.textContent = gameListDefinition.title;
  const help = document.createElement("p");
  help.className = "section-help";
  help.textContent = gameListDefinition.help;
  section.append(heading, help, renderAddPlatformForm());
  if (library.platforms.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = gameListDefinition.platformEmptyLabel;
    section.append(empty);
    return section;
  }
  for (const platform of library.platforms) {
    section.append(renderPlatformCard(platform));
  }
  return section;
}

function renderAddPlatformForm(): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "platform-form";
  form.dataset.form = "add-platform";
  form.autocomplete = "off";
  form.append(
    renderLabeledControl("name", "Platform", {
      value: "",
      required: true,
      multiline: false,
      placeholder: "DOS, Amiga, Switch",
      autofocus: false,
      focusKey: "add-platform",
      className: null,
    }),
    renderActions("Add platform", false),
  );
  return form;
}

function renderPlatformCard(platform: GamePlatform): HTMLElement {
  const card = document.createElement("article");
  card.className = "platform-card";
  const header = document.createElement("div");
  header.className = "platform-heading";
  if (editingThisPlatform(platform.id)) {
    header.append(renderRenamePlatformForm(platform));
  } else {
    const title = document.createElement("h3");
    title.textContent = platform.name;
    const actions = document.createElement("div");
    actions.className = "entry-actions";
    actions.append(
      renderButton("Rename", "edit-platform", {
        id: null,
        list: null,
        platform: platform.id,
        label: `Rename ${platform.name}`,
        danger: false,
      }),
      renderButton("Delete", "delete-platform", {
        id: null,
        list: null,
        platform: platform.id,
        label: `Delete ${platform.name}`,
        danger: true,
      }),
    );
    header.append(title, actions);
  }
  card.append(header);
  card.append(
    renderEntryForm({
      form: "add-game",
      creatorLabel: gameListDefinition.creatorLabel,
      submitLabel: gameListDefinition.addLabel,
      value: null,
      focusKey: `add-game-${platform.id}`,
      list: null,
      platformId: platform.id,
      id: null,
      genres: gameListDefinition.genres,
      dateWatchedLabel: gameListDefinition.dateWatchedLabel,
      dateMadeLabel: gameListDefinition.dateMadeLabel,
    }),
  );
  card.append(
    renderEntries(platform.games, {
      creatorLabel: gameListDefinition.creatorLabel,
      emptyLabel: gameListDefinition.emptyLabel,
      headingLevel: "h4",
      editAction: "edit-game",
      deleteAction: "delete-game",
      form: "edit-game",
      list: null,
      platformId: platform.id,
      genres: gameListDefinition.genres,
      dateWatchedLabel: gameListDefinition.dateWatchedLabel,
      dateMadeLabel: gameListDefinition.dateMadeLabel,
    }),
  );
  return card;
}

function renderRenamePlatformForm(platform: GamePlatform): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "platform-form";
  form.dataset.form = "edit-platform";
  form.dataset.editing = "true";
  form.dataset.platform = platform.id;
  form.autocomplete = "off";
  form.append(
    renderLabeledControl("name", "Platform name", {
      value: platform.name,
      required: true,
      multiline: false,
      placeholder: null,
      autofocus: true,
      focusKey: null,
      className: null,
    }),
    renderActions("Save", true),
  );
  return form;
}

function renderEntries(entries: CatalogEntry[], context: EntryListContext): HTMLElement {
  const list = document.createElement("div");
  list.className = "entry-list";
  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = context.emptyLabel;
    list.append(empty);
    return list;
  }
  list.setAttribute("role", "list");
  for (const entry of entries) {
    const item = document.createElement("div");
    item.setAttribute("role", "listitem");
    if (isEntryEditing(context, entry.id)) {
      item.append(
        renderEntryForm({
          form: context.form,
          creatorLabel: context.creatorLabel,
          submitLabel: "Save",
          value: entry,
          focusKey: null,
          list: context.list,
          platformId: context.platformId,
          id: entry.id,
          genres: context.genres,
          dateWatchedLabel: context.dateWatchedLabel,
          dateMadeLabel: context.dateMadeLabel,
        }),
      );
    } else {
      item.append(renderEntryCard(entry, context));
    }
    list.append(item);
  }
  return list;
}

function isEntryEditing(context: EntryListContext, id: string): boolean {
  if (context.form === "edit-entry" && context.list !== null) {
    return editingThisEntry(context.list, id);
  }
  if (context.form === "edit-game" && context.platformId !== null) {
    return editingThisGame(context.platformId, id);
  }
  return false;
}

function renderEntryCard(entry: CatalogEntry, context: EntryListContext): HTMLElement {
  const card = document.createElement("article");
  card.className = "entry-card";
  const heading = document.createElement("div");
  heading.className = "entry-heading";
  const title = document.createElement(context.headingLevel);
  title.textContent = entry.title;
  const rating = document.createElement("p");
  rating.className = "entry-rating";
  rating.textContent = `${entry.rating} / 5`;
  heading.append(title, rating);
  card.append(heading);
  if (entry.creator !== "") {
    const creator = document.createElement("p");
    creator.className = "entry-creator";
    creator.textContent = entry.creator;
    card.append(creator);
  }
  const meta = renderEntryMeta(entry, context);
  if (meta !== null) {
    card.append(meta);
  }
  if (entry.notes !== "") {
    const notes = document.createElement("p");
    notes.className = "entry-notes";
    notes.textContent = entry.notes;
    card.append(notes);
  }
  const actions = document.createElement("div");
  actions.className = "entry-actions";
  actions.append(
    renderButton("Edit", context.editAction, {
      id: entry.id,
      list: context.list,
      platform: context.platformId,
      label: `Edit ${entry.title}`,
      danger: false,
    }),
    renderButton("Delete", context.deleteAction, {
      id: entry.id,
      list: context.list,
      platform: context.platformId,
      label: `Delete ${entry.title}`,
      danger: true,
    }),
  );
  card.append(actions);
  return card;
}

function renderEntryForm(options: EntryFormOptions): HTMLFormElement {
  const form = document.createElement("form");
  form.className = "entry-form";
  form.dataset.form = options.form;
  form.autocomplete = "off";
  if (options.form === "edit-entry" || options.form === "edit-game") {
    form.dataset.editing = "true";
  }
  if (options.list !== null) {
    form.dataset.list = options.list;
  }
  if (options.platformId !== null) {
    form.dataset.platform = options.platformId;
  }
  if (options.id !== null) {
    form.dataset.id = options.id;
  }
  const editing = options.value !== null;
  form.append(
    renderLabeledControl("title", "Title", {
      value: options.value?.title ?? "",
      required: true,
      multiline: false,
      placeholder: null,
      autofocus: editing,
      focusKey: options.focusKey,
      className: null,
    }),
    renderLabeledControl("creator", options.creatorLabel, {
      value: options.value?.creator ?? "",
      required: false,
      multiline: false,
      placeholder: null,
      autofocus: false,
      focusKey: null,
      className: null,
    }),
    renderRatingField(options.value?.rating ?? null),
    renderGenreField(options.genres, options.value?.genre ?? null),
    renderDateField(
      "dateWatched",
      options.dateWatchedLabel,
      options.value?.dateWatched ?? "",
    ),
    renderDateField("dateMade", options.dateMadeLabel, options.value?.dateMade ?? ""),
    renderLabeledControl("notes", "Notes", {
      value: options.value?.notes ?? "",
      required: false,
      multiline: true,
      placeholder: null,
      autofocus: false,
      focusKey: null,
      className: "notes-field",
    }),
    renderActions(options.submitLabel, editing),
  );
  return form;
}

function renderLabeledControl(
  name: string,
  labelText: string,
  options: {
    value: string;
    required: boolean;
    multiline: boolean;
    placeholder: string | null;
    autofocus: boolean;
    focusKey: string | null;
    className: string | null;
  },
): HTMLLabelElement {
  const label = document.createElement("label");
  if (options.className !== null) {
    label.className = options.className;
  }
  const caption = document.createElement("span");
  caption.textContent = labelText;
  label.append(caption);
  if (options.multiline) {
    const textarea = document.createElement("textarea");
    textarea.name = name;
    textarea.rows = 3;
    textarea.value = options.value;
    label.append(textarea);
    return label;
  }
  const input = document.createElement("input");
  input.name = name;
  input.type = "text";
  input.value = options.value;
  input.autocomplete = "off";
  input.required = options.required;
  if (options.placeholder !== null) {
    input.placeholder = options.placeholder;
  }
  if (options.autofocus) {
    input.dataset.autofocus = "true";
  }
  if (options.focusKey !== null) {
    input.dataset.focusKey = options.focusKey;
  }
  label.append(input);
  return label;
}

function renderRatingField(selected: number | null): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "rating-field";
  const caption = document.createElement("span");
  caption.textContent = "Rating";
  const select = document.createElement("select");
  select.name = "rating";
  select.required = true;
  select.dataset.entryField = "rating";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "1–5";
  placeholder.disabled = true;
  placeholder.selected = selected === null;
  select.append(placeholder);
  for (const value of [1, 2, 3, 4, 5]) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    option.selected = selected === value;
    select.append(option);
  }
  label.append(caption, select);
  return label;
}

function renderGenreField(genres: readonly LibraryGenre[], selected: LibraryGenre | null): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "genre-field";
  const caption = document.createElement("span");
  caption.textContent = "Genre";
  const select = document.createElement("select");
  select.name = "genre";
  select.dataset.entryField = "genre";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "None";
  none.selected = selected === null;
  select.append(none);
  for (const genre of genres) {
    const option = document.createElement("option");
    option.value = genre;
    option.textContent = genre;
    option.selected = selected === genre;
    select.append(option);
  }
  label.append(caption, select);
  return label;
}

function renderDateField(
  name: "dateWatched" | "dateMade",
  labelText: string,
  value: string,
): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "date-field";
  const caption = document.createElement("span");
  caption.textContent = labelText;
  const input = document.createElement("input");
  input.type = "date";
  input.name = name;
  input.value = value;
  input.dataset.entryField = name;
  label.append(caption, input);
  return label;
}

function renderEntryMeta(entry: CatalogEntry, context: EntryListContext): HTMLDListElement | null {
  const list = document.createElement("dl");
  list.className = "entry-meta";
  for (const field of entryFilterFields.filter(isDetailField)) {
    const value = detailValue(entry, field);
    if (value === undefined) {
      continue;
    }
    const row = document.createElement("div");
    row.dataset.entryField = field;
    row.dataset.entryValue = field === "genre" ? value : (entry[field] ?? "");
    const term = document.createElement("dt");
    term.textContent = detailLabel(field, context);
    const description = document.createElement("dd");
    description.textContent = value;
    row.append(term, description);
    list.append(row);
  }
  if (list.childElementCount === 0) {
    return null;
  }
  return list;
}

function detailLabel(field: EntryDetailField, context: EntryListContext): string {
  if (field === "genre") {
    return "Genre";
  }
  if (field === "dateWatched") {
    return context.dateWatchedLabel;
  }
  return context.dateMadeLabel;
}

function detailValue(entry: CatalogEntry, field: EntryDetailField): string | undefined {
  if (field === "genre") {
    return entry.genre;
  }
  const stored = entry[field];
  if (stored === undefined) {
    return undefined;
  }
  return formatStoredDate(stored);
}

function renderActions(submitLabel: string, includeCancel: boolean): HTMLDivElement {
  const actions = document.createElement("div");
  actions.className = "form-actions";
  const submit = document.createElement("button");
  submit.type = "submit";
  submit.className = "action-button";
  submit.textContent = submitLabel;
  actions.append(submit);
  if (includeCancel) {
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "ghost-button";
    cancel.dataset.action = "cancel-edit";
    cancel.textContent = "Cancel";
    actions.append(cancel);
  }
  return actions;
}

function renderButton(
  text: string,
  action: string,
  options: {
    id: string | null;
    list: SimpleListKey | null;
    platform: string | null;
    label: string;
    danger: boolean;
  },
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = options.danger ? "ghost-button danger-button" : "ghost-button";
  button.dataset.action = action;
  button.textContent = text;
  button.setAttribute("aria-label", options.label);
  if (options.id !== null) {
    button.dataset.id = options.id;
  }
  if (options.list !== null) {
    button.dataset.list = options.list;
  }
  if (options.platform !== null) {
    button.dataset.platform = options.platform;
  }
  return button;
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);
  if (element === null) {
    throw new Error(`Missing element: ${id}`);
  }
  return element;
}
