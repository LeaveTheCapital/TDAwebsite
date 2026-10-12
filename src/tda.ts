import { Input, WebMidi, type PortEvent } from "webmidi";

import "../main.css";
import {
  animationTiming,
  setLetterAnimationDurationMs,
  setLightShowDurationMs,
} from "./animation-timing.ts";
import "./dice.ts";
import {
  aDefinition,
  apostropheDefinition,
  zeroDefinition,
  oneDefinition,
  twoDefinition,
  threeDefinition,
  bDefinition,
  cDefinition,
  eDefinition,
  fDefinition,
  getBezierPoint,
  getPartialBezier,
  hDefinition,
  iDefinition,
  jDefinition,
  kDefinition,
  lDefinition,
  mDefinition,
  nDefinition,
  oDefinition,
  pDefinition,
  qDefinition,
  rDefinition,
  sDefinition,
  uDefinition,
  vDefinition,
  wDefinition,
  xDefinition,
  yDefinition,
  zDefinition,
  type DeclarativeStroke,
  type GlyphDefinition,
  type NormalizedPoint,
} from "./glyphs.ts";

const canvas = getCanvas("#canvas");
const ctx = getCanvasContext(canvas, { willReadFrequently: true });
const startFakeMidiButton = getButton("#start-fake-midi");
const stopFakeMidiButton = getButton("#stop-fake-midi");
const strokeWidthInput = getRangeInput("#stroke-width");
const strokeWidthOutput = getOutput("#stroke-width-value");
const letterDurationInput = getRangeInput("#letter-duration");
const letterDurationOutput = getOutput("#letter-duration-value");
const lightShowDurationInput = getRangeInput("#light-show-duration");
const lightShowDurationOutput = getOutput("#light-show-duration-value");

let backgroundHue: number | undefined;
let lightShowHue: number | undefined;
let lightShowColour = "yellow";
let activeMidiInput: Input | undefined;
let fakeMidiTimer: number | undefined;
const browserMidiInputName = "Midi Through Port-0";
const midiClocksPerQuarterNote = 24;
const beatsPerBar = 4;
const fakeMidiBeatsPerMinute = 120;
const fakeMidiClockIntervalMs =
  60_000 / (fakeMidiBeatsPerMinute * midiClocksPerQuarterNote);
let isFollowingMidiClock = false;
let midiClockPulseCount = 0;
let nextMidiCircleSide = "left";

startFakeMidiButton.addEventListener("click", startFakeMidiTimer);
stopFakeMidiButton.addEventListener("click", stopFakeMidiTimer);

function isBrowserMidiInput(input: Input) {
  return input.name === browserMidiInputName;
}

function randomHueExcept(...excludedHues: Array<number | undefined>): number {
  let nextHue;

  do {
    nextHue = Math.floor(Math.random() * 360);
  } while (excludedHues.includes(nextHue));

  return nextHue;
}

function handleMidiNoteOn() {
  backgroundHue = randomHueExcept(backgroundHue);
  lightShowHue = randomHueExcept(lightShowHue, backgroundHue);

  document.body.style.backgroundColor = `hsl(${backgroundHue}, 70%, 25%)`;
  lightShowColour = `hsl(${lightShowHue}, 100%, 50%)`;
}

function hideMidiBeatCircle() {
  midiOverlayContext.clearRect(0, 0, midiOverlay.width, midiOverlay.height);
  midiOverlay.dataset.circleVisible = "false";
}

function showMidiBeatCircle() {
  const radius = width / 32;
  const x = width * (nextMidiCircleSide === "left" ? 0.35 : 0.65);
  const y = midiOverlay.height - radius * 1.5;

  hideMidiBeatCircle();
  midiOverlayContext.beginPath();
  midiOverlayContext.arc(x, y, radius, 0, Math.PI * 2);
  midiOverlayContext.fillStyle = "white";
  midiOverlayContext.fill();
  midiOverlayContext.strokeStyle = "black";
  midiOverlayContext.lineWidth = 2;
  midiOverlayContext.stroke();
  midiOverlay.dataset.circleVisible = "true";
  midiOverlay.dataset.circleSide = nextMidiCircleSide;
  nextMidiCircleSide = nextMidiCircleSide === "left" ? "right" : "left";
}

function handleMidiStart() {
  document.body.style.backgroundColor = "green";
  isFollowingMidiClock = true;
  midiClockPulseCount = 0;
  nextMidiCircleSide = "left";
  hideMidiBeatCircle();
}

function handleMidiClock() {
  if (!isFollowingMidiClock) {
    return;
  }

  midiClockPulseCount += 1;
  const pulseInBar =
    midiClockPulseCount % (midiClocksPerQuarterNote * beatsPerBar);

  if (
    pulseInBar === midiClocksPerQuarterNote ||
    pulseInBar === midiClocksPerQuarterNote * 3
  ) {
    showMidiBeatCircle();
  } else if (
    pulseInBar === midiClocksPerQuarterNote * 2 ||
    pulseInBar === 0
  ) {
    hideMidiBeatCircle();
  }
}

function startFakeMidiTimer() {
  if (fakeMidiTimer !== undefined) {
    return;
  }

  handleMidiStart();
  fakeMidiTimer = window.setInterval(handleMidiClock, fakeMidiClockIntervalMs);
  updateFakeMidiButtonStates();
}

function stopFakeMidiTimer() {
  if (fakeMidiTimer !== undefined) {
    window.clearInterval(fakeMidiTimer);
    fakeMidiTimer = undefined;
  }

  isFollowingMidiClock = false;
  hideMidiBeatCircle();
  updateFakeMidiButtonStates();
}

function updateFakeMidiButtonStates() {
  const isRunning = fakeMidiTimer !== undefined;
  startFakeMidiButton.disabled = isRunning;
  stopFakeMidiButton.disabled = !isRunning;
}

function setFakeMidiControlsVisible(visible: boolean) {
  startFakeMidiButton.hidden = !visible;
  stopFakeMidiButton.hidden = !visible;
  updateFakeMidiButtonStates();
}

function connectToMidiInput() {
  if (activeMidiInput) {
    return;
  }

  const midiInput = WebMidi.inputs.find(
    (input) => input.state === "connected" && isBrowserMidiInput(input)
  );

  if (!midiInput) {
    const availableInputs = WebMidi.inputs.map((input) => ({
      manufacturer: input.manufacturer,
      name: input.name,
      state: input.state,
    }));

    console.warn(`MIDI input "${browserMidiInputName}" was not found.`, {
      availableInputs,
    });
    setFakeMidiControlsVisible(true);
    return;
  }

  stopFakeMidiTimer();
  setFakeMidiControlsVisible(false);
  activeMidiInput = midiInput;
  activeMidiInput.addListener("start", handleMidiStart);
  activeMidiInput.addListener("clock", handleMidiClock);
  activeMidiInput.channels[1].addListener("noteon", handleMidiNoteOn);
  console.log("Using MIDI input:", activeMidiInput.name, activeMidiInput);
}

function handleMidiPortConnected(event: PortEvent) {
  const input = getInputFromPortEvent(event);

  if (input && isBrowserMidiInput(input)) {
    connectToMidiInput();
  }
}

function handleMidiPortDisconnected(event: PortEvent) {
  const input = getInputFromPortEvent(event);

  if (!input || input.id !== activeMidiInput?.id) {
    return;
  }

  console.warn("MIDI input disconnected:", input.name);
  activeMidiInput = undefined;
  connectToMidiInput();
}

function getInputFromPortEvent(event: PortEvent): Input | undefined {
  const port: unknown = event.port;
  return port instanceof Input ? port : undefined;
}

async function initialiseMidi() {
  try {
    await WebMidi.enable();
    WebMidi.addListener("connected", handleMidiPortConnected);
    WebMidi.addListener("disconnected", handleMidiPortDisconnected);
    connectToMidiInput();
  } catch (error) {
    console.error("WebMidi could not be enabled.", error);
    setFakeMidiControlsVisible(true);
  }
}

void initialiseMidi();

let letterAnimationStepScale = animationTiming.letterStepScale;
let lightShowAnimationStepScale = animationTiming.lightShowStepScale;
const query = new URLSearchParams(window.location.search);
const requestedText = (query.get("text") || "TDA").toUpperCase();
const shouldRunLightShow = query.get("lightShow") !== "false";
const maximumCharactersPerLine = 16;
const defaultLineWidth = 2;
const minimumLineWidth = Number(strokeWidthInput.min);
const maximumLineWidth = Number(strokeWidthInput.max);
const lineWidthStep = Number(strokeWidthInput.step);
const queryLineWidth = Number(query.get("lineWidth"));
const requestedLineWidth = normalizeLineWidth(
  Number.isFinite(queryLineWidth) && queryLineWidth > 0
    ? queryLineWidth
    : defaultLineWidth,
);

function normalizeLineWidth(lineWidth: number) {
  const clampedLineWidth = Math.min(
    Math.max(lineWidth, minimumLineWidth),
    maximumLineWidth,
  );

  return Number(
    (
      Math.round(clampedLineWidth / lineWidthStep) * lineWidthStep
    ).toFixed(1),
  );
}
const wrappedLines = wrapText(requestedText, maximumCharactersPerLine);
const letters = wrappedLines.flatMap(segmentText);

if (!query.get("text")) {
  query.set("text", requestedText);
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${query.toString()}${window.location.hash}`,
  );
}

strokeWidthInput.value = String(requestedLineWidth);
strokeWidthOutput.value = `${requestedLineWidth} px`;
strokeWidthInput.addEventListener("input", () => {
  const lineWidth = Number(strokeWidthInput.value);
  const nextQuery = new URLSearchParams(window.location.search);

  strokeWidthOutput.value = `${lineWidth} px`;
  nextQuery.set("lineWidth", String(lineWidth));
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${nextQuery.toString()}${window.location.hash}`,
  );
  startAnimation(lineWidth);
});

const requestedLetterSeconds = animationTiming.letterDurationMs / 1000;
letterDurationInput.value = String(requestedLetterSeconds);
letterDurationOutput.value = formatSeconds(requestedLetterSeconds);
letterDurationInput.addEventListener("input", () => {
  const seconds = Number(letterDurationInput.value);

  letterDurationOutput.value = formatSeconds(seconds);
  letterAnimationStepScale =
    setLetterAnimationDurationMs(seconds * 1000).letterStepScale;
  updateAnimationTimingQuery();
  startAnimation(Number(strokeWidthInput.value));
});

const requestedLightShowSeconds = animationTiming.lightShowDurationMs / 1000;
lightShowDurationInput.value = String(requestedLightShowSeconds);
lightShowDurationOutput.value = formatSeconds(requestedLightShowSeconds);
lightShowDurationInput.addEventListener("input", () => {
  const seconds = Number(lightShowDurationInput.value);

  lightShowDurationOutput.value = formatSeconds(seconds);
  lightShowAnimationStepScale =
    setLightShowDurationMs(seconds * 1000).lightShowStepScale;
  updateAnimationTimingQuery();
  startAnimation(Number(strokeWidthInput.value));
});

function updateAnimationTimingQuery() {
  const nextQuery = new URLSearchParams(window.location.search);

  nextQuery.delete("animationDurationMs");
  nextQuery.set(
    "letterAnimationDurationMs",
    String(animationTiming.letterDurationMs),
  );
  nextQuery.set(
    "lightShowDurationMs",
    String(animationTiming.lightShowDurationMs),
  );
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}?${nextQuery.toString()}${window.location.hash}`,
  );
}

function formatSeconds(seconds: number) {
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}

function segmentText(text: string) {
  return Array.from(
    new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
    ({ segment }) => segment,
  );
}

function wrapText(text: string, maximumLineLength: number) {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    let remainingCharacters = segmentText(word);

    while (remainingCharacters.length > maximumLineLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }

      lines.push(remainingCharacters.slice(0, maximumLineLength).join(""));
      remainingCharacters = remainingCharacters.slice(maximumLineLength);
    }

    const remainingWord = remainingCharacters.join("");
    if (!remainingWord) {
      return;
    }

    const candidateLine = currentLine
      ? `${currentLine} ${remainingWord}`
      : remainingWord;

    if (segmentText(candidateLine).length > maximumLineLength) {
      lines.push(currentLine);
      currentLine = remainingWord;
    } else {
      currentLine = candidateLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [""];
}

function advanceTowards(current: number, step: number, endPoint: number) {
  return Math.min(current + step * letterAnimationStepScale, endPoint);
}

const width = canvas.width;
const longestLineLength = Math.max(
  1,
  ...wrappedLines.map((line) => segmentText(line).length),
);
const letterWidth = width / (longestLineLength + 2);
const paddingAroundLetters =
  (width - longestLineLength * letterWidth) / (longestLineLength + 1);
const lineHeight = letterWidth + 2 * paddingAroundLetters;

canvas.height = Math.ceil(lineHeight * wrappedLines.length);
const height = canvas.height;

interface LetterLayout {
  x: number;
  y: number;
  lineStartX: number;
  lineIndex: number;
}

const letterLayouts: LetterLayout[] = wrappedLines.flatMap((line, lineIndex) => {
  const lineCharacters = segmentText(line);
  const contentWidth =
    lineCharacters.length * letterWidth +
    Math.max(0, lineCharacters.length - 1) * paddingAroundLetters;
  const lineStartX = (width - contentWidth) / 2;

  return lineCharacters.map((_, characterIndex) => ({
    x: lineStartX + characterIndex * (letterWidth + paddingAroundLetters),
    y: lineIndex * lineHeight + paddingAroundLetters,
    lineStartX,
    lineIndex,
  }));
});

canvas.dataset.animationState = "running";
canvas.dataset.letterAnimationState = "running";
canvas.dataset.text = requestedText;
canvas.dataset.lineCount = String(wrappedLines.length);
const midiOverlay = getCanvas("#midi-overlay");
midiOverlay.width = canvas.width;
midiOverlay.height = canvas.height;
const midiOverlayContext = getCanvasContext(midiOverlay);
midiOverlay.dataset.circleVisible = "false";
ctx.lineCap = "square";
ctx.lineWidth = requestedLineWidth;
canvas.dataset.lineWidth = String(requestedLineWidth);

const letterHeight = letterWidth;

const tYEndPoint = letterWidth * (13 / 45);
const aBottomLineWidth = letterWidth * 0.25;
const aTopLineWidth = letterWidth * 0.15;
const aInnerLineHeight = letterHeight / 2;
const dAndGFirstStageDistance = letterHeight;
const dAndGSecondStageDistance = letterHeight * 0.6;
const gOpeningAngle = Math.PI / 6;
const gInnerRadiusScale = 0.32;
const gLowerOuterOpeningAngle = Math.asin(
  gInnerRadiusScale * 2 * Math.sin(gOpeningAngle),
);
const gOuterArcAngle =
  Math.PI * 2 - gOpeningAngle - gLowerOuterOpeningAngle;
const gInnerArcAngle = Math.PI * 2 - gOpeningAngle * 2;

type Point = [number, number];

interface LineTowardsOptions {
  initialCoords: Point;
  endCoords: Point;
  progress: number;
  colour: string;
}

interface PolygonOptions {
  points: Point[];
  xOffset: number;
  colour: string;
}

interface HorizontalLineOptions {
  initialCoords: Point;
  yPositionOffset: number;
  length: number;
  colour: string;
}

interface VerticalLineOptions {
  initialCoords: Point;
  endPoint: number;
  length: number;
  colour: string;
}

const animationFrameIds = new Set<number>();

function queueAnimationFrame(callback: FrameRequestCallback) {
  const frameId = window.requestAnimationFrame((ms) => {
    animationFrameIds.delete(frameId);
    callback(ms);
  });

  animationFrameIds.add(frameId);
}

class Letter {
  readonly width: number;
  readonly height: number;
  readonly letterWidth: number;
  readonly paddingAroundLetters: number;
  readonly letterHeight: number;
  readonly letterIndex: number;
  readonly startX: number;
  readonly startY: number;
  readonly updateFunc: (ms: number) => void;
  readonly shouldContinue: () => boolean;
  readonly next: (ms?: number) => void;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    updateFunc: (ms: number) => void,
    shouldContinue: () => boolean,
    next: (ms?: number) => void,
  ) {
    this.width = width;
    this.height = height;
    this.letterWidth = letterWidth;
    this.paddingAroundLetters = paddingAroundLetters;
    this.letterHeight = this.letterWidth;
    this.letterIndex = letterIndex;
    this.startX = letterLayouts[letterIndex].x;
    this.startY = letterLayouts[letterIndex].y;
    this.updateFunc = updateFunc;
    this.shouldContinue = shouldContinue;
    this.next = next;
  }

  animationFunc(ms = 0) {
    if (this.shouldContinue()) {
      queueAnimationFrame(this.animationFunc.bind(this));
    } else {
      this.next(ms);
    }
    this.updateFunc.call(this, ms);
  }
}

class DeclarativeGlyph extends Letter {
  declare progress: number;
  declare endPoint: number;
  declare definition: GlyphDefinition;
  declare strokeLengths: number[];
  declare totalStrokeLength: number;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    definition: GlyphDefinition,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawGlyph();
      },
      () => this.progress < this.endPoint,
      onComplete,
    );

    this.progress = 0;
    this.endPoint = dAndGFirstStageDistance + dAndGSecondStageDistance;
    this.definition = definition;
    this.strokeLengths = definition.strokes.map((stroke) =>
      this.getStrokeLength(stroke),
    );
    this.totalStrokeLength = this.strokeLengths.reduce(
      (total, length) => total + length,
      0,
    );
  }

  drawGlyph() {
    this.progress = advanceTowards(this.progress, 1, this.endPoint);
    let remainingLength =
      (this.progress / this.endPoint) * this.totalStrokeLength;

    this.definition.strokes.forEach((stroke, index) => {
      const strokeLength = this.strokeLengths[index];
      const strokeProgress = Math.min(
        Math.max(remainingLength / strokeLength, 0),
        1,
      );

      if (strokeProgress > 0) {
        this.drawStroke(stroke, strokeProgress);
      }

      remainingLength -= strokeLength;
    });
  }

  getStrokeLength(stroke: DeclarativeStroke) {
    if (stroke.kind === "line") {
      return Math.hypot(
        stroke.to[0] - stroke.from[0],
        stroke.to[1] - stroke.from[1],
      );
    }

    if (stroke.kind === "arc") {
      const meanRadius = Math.sqrt(
        (stroke.radius[0] ** 2 + stroke.radius[1] ** 2) / 2,
      );
      return Math.abs(stroke.endAngle - stroke.startAngle) * meanRadius;
    }

    let length = 0;
    let previousPoint = stroke.from;

    for (let step = 1; step <= 20; step += 1) {
      const point = getBezierPoint(stroke, step / 20);
      length += Math.hypot(
        point[0] - previousPoint[0],
        point[1] - previousPoint[1],
      );
      previousPoint = point;
    }

    return length;
  }

  drawStroke(stroke: DeclarativeStroke, progress: number) {
    ctx.beginPath();

    if (stroke.kind === "line") {
      const from = this.toCanvasPoint(stroke.from);
      const to = this.toCanvasPoint(stroke.to);
      ctx.moveTo(from[0], from[1]);
      ctx.lineTo(
        from[0] + (to[0] - from[0]) * progress,
        from[1] + (to[1] - from[1]) * progress,
      );
    } else if (stroke.kind === "arc") {
      const centre = this.toCanvasPoint(stroke.centre);
      ctx.ellipse(
        centre[0],
        centre[1],
        stroke.radius[0] * this.letterWidth,
        stroke.radius[1] * this.letterHeight,
        0,
        stroke.startAngle,
        stroke.startAngle +
          (stroke.endAngle - stroke.startAngle) * progress,
        stroke.anticlockwise,
      );
    } else {
      const partialBezier = getPartialBezier(stroke, progress);
      const from = this.toCanvasPoint(partialBezier.from);
      const control1 = this.toCanvasPoint(partialBezier.control1);
      const control2 = this.toCanvasPoint(partialBezier.control2);
      const to = this.toCanvasPoint(partialBezier.to);
      ctx.moveTo(from[0], from[1]);
      ctx.bezierCurveTo(
        control1[0],
        control1[1],
        control2[0],
        control2[1],
        to[0],
        to[1],
      );
    }

    ctx.strokeStyle = this.definition.colour;
    ctx.stroke();
  }

  toCanvasPoint(point: NormalizedPoint): Point {
    return [
      this.startX + point[0] * this.letterWidth,
      this.startY + point[1] * this.letterHeight,
    ];
  }
}

class T1 extends Letter {
  declare xEnd: number;
  declare yEnd: number;
  declare tStartPoint: Point;
  declare tYEndPoint: number;
  declare tColour: string;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawT1();
      },
      () => this.xEnd < this.letterWidth,
      () => {
        new T2(width, height, letterIndex, onComplete).animationFunc();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.startX, this.startY];
    this.tYEndPoint = tYEndPoint;
    this.tColour = `rgb(0, ${100 + ((0 * 1) % 255)}, ${
      100 + ((0 * 3) % 255)
    })`;
  }

  drawT1() {
    this.tColour = `rgb(0, ${100 + ((this.xEnd * 1) % 255)}, 100)`;
    drawLineXForwards({
      initialCoords: this.tStartPoint,
      yPositionOffset: 0,
      length: this.xEnd,
      colour: this.tColour,
    });
    drawLineYForwards({
      initialCoords: this.tStartPoint,
      endPoint: 0,
      length: this.yEnd,
      colour: this.tColour,
    });
    this.xEnd = advanceTowards(this.xEnd, 2, this.letterWidth);

    if (this.yEnd < this.tYEndPoint) {
      this.yEnd = advanceTowards(this.yEnd, 1, this.tYEndPoint);
    }
  }
}

class T2 extends Letter {
  declare xEnd: number;
  declare yEnd: number;
  declare tStartPoint: Point;
  declare tYEndPoint: number;
  declare tXEndPoint2: number;
  declare tYEndPoint2: number;
  declare colour: string;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawT2();
      },
      () => this.xEnd < this.tXEndPoint2,
      () => {
        new T3(width, height, letterIndex, onComplete).animationFunc();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.startX, this.startY];
    this.tYEndPoint = tYEndPoint;
    this.tXEndPoint2 = this.letterWidth * 0.35;
    this.tYEndPoint2 = tYEndPoint;
    this.colour = `rgb(0, ${100 + ((this.letterWidth * 1) % 255)}, 100)`;
  }

  drawT2() {
    drawLineXForwards({
      initialCoords: this.tStartPoint,
      yPositionOffset: this.tYEndPoint,
      length: this.xEnd,
      colour: this.colour,
    });
    drawLineYForwards({
      initialCoords: this.tStartPoint,
      endPoint: this.letterWidth,
      length: this.yEnd,
      colour: this.colour,
    });
    this.xEnd = advanceTowards(this.xEnd, 2, this.tXEndPoint2);
    if (this.yEnd < this.tYEndPoint2) {
      this.yEnd = advanceTowards(this.yEnd, 2, this.tYEndPoint2);
    }
  }
}

class T3 extends Letter {
  declare xEnd: number;
  declare yEnd: number;
  declare tStartPoint: Point;
  declare tYEndPoint2: number;
  declare tXEndPoint2: number;
  declare tXEndPoint3: number;
  declare colour: string;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawT3();
      },
      () => this.xEnd < this.tXEndPoint3,
      () => {
        new T4(width, height, letterIndex, onComplete).animationFunc();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.startX, this.startY];
    this.tYEndPoint2 = tYEndPoint;
    this.tXEndPoint2 = this.letterWidth * 0.35;
    this.tXEndPoint3 = this.letterWidth * 0.35;
    this.colour = `rgb(0, ${100 + ((this.letterWidth * 1) % 255)}, 100)`;
  }

  drawT3() {
    drawLineYForwards({
      initialCoords: [
        this.tStartPoint[0],
        this.tStartPoint[1] + this.tYEndPoint2,
      ],
      endPoint: this.tXEndPoint2,
      length: this.yEnd,
      colour: this.colour,
    });
    drawLineXForwards({
      initialCoords: [
        this.tStartPoint[0] + this.letterWidth,
        this.tStartPoint[1],
      ],
      yPositionOffset: this.tYEndPoint2,
      length: -this.xEnd,
      colour: this.colour,
    });
    this.yEnd = advanceTowards(this.yEnd, 2, this.letterHeight);
    if (this.xEnd < this.tXEndPoint3) {
      this.xEnd = advanceTowards(this.xEnd, 1, this.tXEndPoint3);
    }
  }
}

class T4 extends Letter {
  declare xEnd: number;
  declare yEnd: number;
  declare tStartPoint: Point;
  declare tYEndPoint: number;
  declare tYEndPoint2: number;
  declare tXEndPoint2: number;
  declare tXEndPoint4: number;
  declare tYEndPoint4: number;
  declare colour: string;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawT4();
      },
      () => this.yEnd < this.tYEndPoint4,
      () => {
        onComplete();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.startX, this.startY];
    this.tYEndPoint = tYEndPoint;
    this.tYEndPoint2 = tYEndPoint;
    this.tXEndPoint2 = this.letterWidth * 0.35;
    this.tXEndPoint4 = this.letterWidth - 2 * this.tXEndPoint2;
    this.tYEndPoint4 = this.letterHeight - this.tYEndPoint;
    this.colour = `rgb(0, ${100 + ((this.letterWidth * 1) % 255)}, 100)`;
  }

  drawT4() {
    drawLineXForwards({
      initialCoords: [
        this.tStartPoint[0] + this.tXEndPoint2,
        this.tStartPoint[1],
      ],
      yPositionOffset: this.tYEndPoint2 + this.tYEndPoint4,
      length: this.xEnd,
      colour: this.colour,
    });
    drawLineYForwards({
      initialCoords: [
        this.tStartPoint[0],
        this.tStartPoint[1] + this.tYEndPoint,
      ],
      endPoint: this.letterWidth - this.tXEndPoint2,
      length: this.yEnd,
      colour: this.colour,
    });
    this.yEnd = advanceTowards(this.yEnd, 2, this.tYEndPoint4);
    if (this.xEnd < this.tXEndPoint4) {
      this.xEnd = advanceTowards(this.xEnd, 1, this.tXEndPoint4);
    }
  }
}

class D1 extends Letter {
  declare dYEnd: number;
  declare dStartPoint: Point;
  declare dYEndPoint: number;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawD1();
      },
      () => this.dYEnd < this.dYEndPoint,
      () => {
        new D2(width, height, letterIndex, onComplete).animationFunc();
      }
    );

    this.dYEnd = 0;
    this.dStartPoint = [this.startX, this.startY];
    this.dYEndPoint = dAndGFirstStageDistance;
  }

  drawD1() {
    const animationProgress = this.dYEnd / this.dYEndPoint;
    const colour = `rgb(150, ${10 + ((this.dYEnd * 1) % 255)}, ${
      10 + ((this.dYEnd * 2) % 255)
    })`;
    const outerCurveStart: Point = [
      this.dStartPoint[0] + this.letterWidth / 2,
      this.dStartPoint[1],
    ];
    const outerCurveEnd: Point = [
      outerCurveStart[0],
      this.dStartPoint[1] + this.letterHeight,
    ];

    drawLineYForwards({
      initialCoords: this.dStartPoint,
      endPoint: 0,
      length: this.dYEnd,
      colour,
    });
    drawLineTowards({
      initialCoords: this.dStartPoint,
      endCoords: outerCurveStart,
      progress: animationProgress,
      colour,
    });
    ctx.beginPath();
    ctx.ellipse(
      this.dStartPoint[0] + this.letterWidth / 2,
      this.dStartPoint[1] + this.letterHeight / 2,
      this.letterWidth / 2,
      this.letterHeight / 2,
      0,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * animationProgress,
    );
    ctx.strokeStyle = colour;
    ctx.stroke();
    drawLineTowards({
      initialCoords: outerCurveEnd,
      endCoords: [
        this.dStartPoint[0],
        this.dStartPoint[1] + this.letterHeight,
      ],
      progress: animationProgress,
      colour,
    });
    this.dYEnd = advanceTowards(this.dYEnd, 1, this.dYEndPoint);
  }
}

class D2 extends Letter {
  declare dYEnd: number;
  declare dStartPoint: Point;
  declare dXEndPoint: number;
  declare dYEndPoint2: number;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawD2();
      },
      () => this.dYEnd < this.dYEndPoint2,
      () => {
        onComplete();
      }
    );

    this.dYEnd = 0;
    this.dStartPoint = [this.startX, this.startY];
    this.dXEndPoint = this.letterWidth * 0.1375;
    this.dYEndPoint2 = dAndGSecondStageDistance;
  }

  drawD2() {
    const animationProgress = this.dYEnd / this.dYEndPoint2;
    const stemColour = `rgb(150, ${10 + ((this.dYEnd * 2) % 255)}, ${
      50 + ((this.dYEnd * 3) % 255)
    })`;
    const curveColour = `rgb(150, ${10 + ((this.dYEnd * 1) % 255)}, ${
      10 + ((this.dYEnd * 3) % 255)
    })`;
    const innerCurveStart: Point = [
      this.dStartPoint[0] + this.letterWidth / 2,
      this.dStartPoint[1] + this.letterHeight * 0.2,
    ];
    const innerCurveEnd: Point = [
      innerCurveStart[0],
      this.dStartPoint[1] + this.letterHeight * 0.8,
    ];
    const innerStemTop: Point = [
      this.dStartPoint[0] + this.dXEndPoint,
      this.dStartPoint[1] + this.letterWidth * 0.2,
    ];
    const innerStemBottom: Point = [
      innerStemTop[0],
      innerStemTop[1] + this.dYEndPoint2,
    ];

    drawLineYForwards({
      initialCoords: [this.dStartPoint[0], innerStemTop[1]],
      endPoint: this.dXEndPoint,
      length: this.dYEnd,
      colour: stemColour,
    });
    drawLineTowards({
      initialCoords: innerStemTop,
      endCoords: innerCurveStart,
      progress: animationProgress,
      colour: curveColour,
    });
    ctx.beginPath();
    ctx.ellipse(
      this.dStartPoint[0] + this.letterWidth / 2,
      this.dStartPoint[1] + this.letterHeight / 2,
      this.letterWidth * 0.3,
      this.letterHeight * 0.3,
      0,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * animationProgress,
    );
    ctx.strokeStyle = curveColour;
    ctx.stroke();
    drawLineTowards({
      initialCoords: innerCurveEnd,
      endCoords: innerStemBottom,
      progress: animationProgress,
      colour: curveColour,
    });
    this.dYEnd = advanceTowards(this.dYEnd, 1, this.dYEndPoint2);
  }
}

class G1 extends Letter {
  declare progress: number;
  declare startPoint: Point;
  declare endPoint: number;
  declare colour: string;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawG1();
      },
      () => this.progress < this.endPoint,
      () => {
        new G2(width, height, letterIndex, onComplete).animationFunc();
      },
    );

    this.progress = 0;
    this.startPoint = [this.startX, this.startY];
    this.endPoint = dAndGFirstStageDistance;
    this.colour = "rgb(20, 160, 180)";
  }

  drawG1() {
    const animationProgress = this.progress / this.endPoint;

    ctx.beginPath();
    ctx.ellipse(
      this.startPoint[0] + this.letterWidth / 2,
      this.startPoint[1] + this.letterHeight / 2,
      this.letterWidth / 2,
      this.letterHeight / 2,
      0,
      gLowerOuterOpeningAngle,
      gLowerOuterOpeningAngle + gOuterArcAngle * animationProgress,
    );
    ctx.strokeStyle = this.colour;
    ctx.stroke();
    this.progress = advanceTowards(this.progress, 1, this.endPoint);
  }
}

class G2 extends Letter {
  declare progress: number;
  declare endPoint: number;
  declare centre: Point;
  declare outerRadius: number;
  declare innerRadius: number;
  declare upperOuterEnd: Point;
  declare upperInnerEnd: Point;
  declare lowerInnerEnd: Point;
  declare lowerOuterStart: Point;
  declare crossbarTopStart: Point;
  declare crossbarTopEnd: Point;
  declare crossbarBottomStart: Point;
  declare crossbarBottomEnd: Point;
  declare colour: string;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawG2();
      },
      () => this.progress < this.endPoint,
      onComplete,
    );

    this.progress = 0;
    this.endPoint = dAndGSecondStageDistance;
    this.centre = [
      this.startX + this.letterWidth / 2,
      this.startY + this.letterHeight / 2,
    ];
    this.outerRadius = this.letterWidth / 2;
    this.innerRadius = this.letterWidth * gInnerRadiusScale;
    this.upperOuterEnd = [
      this.centre[0] + this.outerRadius * Math.cos(gOpeningAngle),
      this.centre[1] - this.outerRadius * Math.sin(gOpeningAngle),
    ];
    this.upperInnerEnd = [
      this.centre[0] + this.innerRadius * Math.cos(gOpeningAngle),
      this.centre[1] - this.innerRadius * Math.sin(gOpeningAngle),
    ];
    this.lowerInnerEnd = [
      this.centre[0] + this.innerRadius * Math.cos(gOpeningAngle),
      this.centre[1] + this.innerRadius * Math.sin(gOpeningAngle),
    ];
    this.lowerOuterStart = [
      this.centre[0] +
        this.outerRadius * Math.cos(gLowerOuterOpeningAngle),
      this.centre[1] +
        this.outerRadius * Math.sin(gLowerOuterOpeningAngle),
    ];
    this.crossbarTopStart = [
      this.startX + this.letterWidth * 0.5,
      this.startY + this.letterHeight * 0.48,
    ];
    this.crossbarTopEnd = [
      this.lowerOuterStart[0],
      this.crossbarTopStart[1],
    ];
    this.crossbarBottomStart = [
      this.crossbarTopStart[0],
      this.lowerInnerEnd[1],
    ];
    this.crossbarBottomEnd = this.lowerInnerEnd;
    this.colour = "rgb(20, 160, 180)";
  }

  drawG2() {
    this.progress = advanceTowards(this.progress, 1, this.endPoint);
    const animationProgress = this.progress / this.endPoint;

    ctx.beginPath();
    ctx.ellipse(
      this.centre[0],
      this.centre[1],
      this.innerRadius,
      this.innerRadius,
      0,
      Math.PI * 2 - gOpeningAngle,
      Math.PI * 2 - gOpeningAngle - gInnerArcAngle * animationProgress,
      true,
    );
    ctx.strokeStyle = this.colour;
    ctx.stroke();

    drawLineTowards({
      initialCoords: this.upperOuterEnd,
      endCoords: this.upperInnerEnd,
      progress: animationProgress,
      colour: this.colour,
    });
    drawLineTowards({
      initialCoords: this.crossbarTopStart,
      endCoords: this.crossbarTopEnd,
      progress: animationProgress,
      colour: this.colour,
    });
    drawLineTowards({
      initialCoords: this.crossbarBottomStart,
      endCoords: this.crossbarBottomEnd,
      progress: animationProgress,
      colour: this.colour,
    });
    drawLineTowards({
      initialCoords: this.crossbarTopStart,
      endCoords: this.crossbarBottomStart,
      progress: animationProgress,
      colour: this.colour,
    });
    drawLineTowards({
      initialCoords: this.crossbarTopEnd,
      endCoords: this.lowerOuterStart,
      progress: animationProgress,
      colour: this.colour,
    });
  }
}

class A1 extends Letter {
  declare aStartCoords: Point;
  declare aStartCoords2: Point;
  declare aXEnd: number;
  declare aXEnd2: number;
  declare aBottomLineWidth: number;
  declare aOuterLineRun: number;
  declare aEndCoords: Point;
  declare aEndCoords2: Point;
  declare aColour: string;
  declare imageData: ImageData;
  declare imageStart: Point;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawA1();
      },
      () => this.aXEnd < this.aOuterLineRun,
      () => {
        onComplete();
      }
    );

    this.aStartCoords = [this.startX, this.startY];
    this.aStartCoords2 = [
      this.aStartCoords[0] + this.letterWidth,
      this.startY,
    ];
    this.aXEnd = 0;
    this.aXEnd2 = 0;
    this.aColour = aDefinition.colour;
    this.aBottomLineWidth = aBottomLineWidth;
    this.aOuterLineRun = (this.letterWidth - aTopLineWidth) / 2;
    this.aEndCoords = [
      this.aStartCoords[0],
      this.startY + letterHeight,
    ];
    this.aEndCoords2 = [
      this.aStartCoords2[0],
      this.startY + letterHeight,
    ];
    const imageMargin = Math.min(5, this.paddingAroundLetters / 2);
    this.imageStart = [
      Math.max(0, this.aStartCoords[0] - imageMargin),
      Math.max(0, this.aStartCoords[1] - imageMargin),
    ];
    this.imageData = ctx.getImageData(
      this.imageStart[0],
      this.imageStart[1],
      Math.min(
        this.letterWidth + 2 * imageMargin,
        width - this.imageStart[0],
      ),
      Math.min(
        this.letterHeight + 2 * imageMargin,
        canvas.height - this.imageStart[1],
      ),
    );
  }

  drawA1() {
    ctx.putImageData(
      this.imageData,
      this.imageStart[0],
      this.imageStart[1],
    );
    const outerLineDistance = Math.min(this.aXEnd, this.aOuterLineRun);

    drawLineYDiagonal(
      this.aStartCoords,
      this.aEndCoords,
      outerLineDistance,
      this.aColour
    );
    drawLineYDiagonal(
      this.aStartCoords2,
      this.aEndCoords2,
      -outerLineDistance,
      this.aColour
    );

    const bottomLineLength = Math.min(
      this.aBottomLineWidth,
      (outerLineDistance / this.aOuterLineRun) * this.aBottomLineWidth
    );

    drawLineXForwards({
      initialCoords: this.aEndCoords,
      yPositionOffset: 0,
      length: bottomLineLength,
      colour: this.aColour,
    });
    drawLineXForwards({
      initialCoords: this.aEndCoords2,
      yPositionOffset: 0,
      length: -bottomLineLength,
      colour: this.aColour,
    });

    this.aXEnd = advanceTowards(this.aXEnd, 0.35, this.aOuterLineRun);
    this.aXEnd2 = advanceTowards(this.aXEnd2, 0.35, this.aOuterLineRun);
  }
}

let finalImage = ctx.getImageData(0, 0, width, canvas.height);

class A2 extends Letter {
  declare aXEndFinal: number;
  declare aXStep: number;
  declare aXEndPointFinal: number;
  declare travelStartX: number;
  declare rowTop: number;
  declare rowImage: ImageData;
  declare aColour: string;
  declare aInnerLeftStart: Point;
  declare aInnerRightStart: Point;
  declare aInnerLeftEnd: Point;
  declare aInnerRightEnd: Point;
  declare aCrossbarStartPoint: Point;
  declare aCrossbarEndPoint: Point;
  declare aTopShapeCentreX: number;
  declare aTopShapePoints: Point[];
  declare aTopLineStart: Point;
  declare aTopLineEnd: Point;

  constructor(
    width: number,
    height: number,
    letterIndex: number,
    onComplete: () => void,
  ) {
    super(
      width,
      height,
      letterIndex,
      () => {
        this.drawA2();
      },
      () => this.aXEndFinal < this.aXEndPointFinal + this.aXStep,
      () => {
        onComplete();
      }
    );
    this.aXEndFinal = 0;
    this.aXStep = 7 * letterAnimationStepScale;

    const halfLetterWidth = this.letterWidth / 2;
    const outerLineRun = halfLetterWidth - aTopLineWidth / 2;
    this.aColour = aDefinition.colour;
    const bottomY = this.startY + this.letterHeight;
    const crossbarY = bottomY - aInnerLineHeight;
    const aStartCoords: Point = [this.startX, this.startY];
    const aStartCoords2: Point = [
      this.startX + this.letterWidth,
      this.startY,
    ];
    const innerGapLeft = aStartCoords[0] + halfLetterWidth - aTopLineWidth / 2;
    const innerGapRight = aStartCoords[0] + halfLetterWidth + aTopLineWidth / 2;

    this.aInnerLeftStart = [aStartCoords[0] + aBottomLineWidth, bottomY];
    this.aInnerRightStart = [aStartCoords2[0] - aBottomLineWidth, bottomY];
    this.aInnerLeftEnd = [innerGapLeft, crossbarY];
    this.aInnerRightEnd = [innerGapRight, crossbarY];
    this.aCrossbarStartPoint = [innerGapLeft, crossbarY];
    this.aCrossbarEndPoint = [innerGapRight, crossbarY];
    this.aTopShapeCentreX = aStartCoords[0] + halfLetterWidth;
    this.travelStartX = letterLayouts[letterIndex].lineStartX;
    const lineIndex = letterLayouts[letterIndex].lineIndex;
    this.rowTop = Math.floor(lineIndex * lineHeight);
    const rowBottom =
      lineIndex === wrappedLines.length - 1
        ? canvas.height
        : Math.floor((lineIndex + 1) * lineHeight);
    this.rowImage = ctx.getImageData(
      0,
      this.rowTop,
      width,
      rowBottom - this.rowTop,
    );
    this.aXEndPointFinal = Math.max(
      1,
      this.aTopShapeCentreX - this.travelStartX,
    );
    const topShapeBottomY = crossbarY - aTopLineWidth / 2;
    const topShapeTopWidth = ctx.lineWidth;
    const outerLineSlope = outerLineRun / this.letterHeight;
    const topShapeHeight =
      (aTopLineWidth - topShapeTopWidth) / (2 * outerLineSlope);
    const topShapeTopY = topShapeBottomY - topShapeHeight;
    this.aTopShapePoints = [
      [
        this.aTopShapeCentreX - topShapeTopWidth / 2,
        topShapeTopY,
      ],
      [
        this.aCrossbarStartPoint[0],
        topShapeBottomY,
      ],
      [
        this.aCrossbarEndPoint[0],
        topShapeBottomY,
      ],
      [
        this.aTopShapeCentreX + topShapeTopWidth / 2,
        topShapeTopY,
      ],
    ];
    this.aTopLineStart = [
      aStartCoords[0] + outerLineRun,
      this.startY,
    ];
    this.aTopLineEnd = [
      aStartCoords2[0] - outerLineRun,
      this.startY,
    ];
  }

  drawA2() {
    ctx.putImageData(this.rowImage, 0, this.rowTop);
    const animationDistance = Math.min(
      this.aXEndFinal,
      this.aXEndPointFinal
    );
    const animationProgress = animationDistance / this.aXEndPointFinal;
    const topShapeOffsetX =
      (this.travelStartX - this.aTopShapeCentreX) *
      (1 - animationProgress);

    drawPolygon({
      points: this.aTopShapePoints,
      xOffset: topShapeOffsetX,
      colour: this.aColour,
    });

    ctx.beginPath();
    ctx.moveTo(
      this.aCrossbarStartPoint[0] + topShapeOffsetX,
      this.aCrossbarStartPoint[1],
    );
    ctx.lineTo(
      this.aCrossbarEndPoint[0] + topShapeOffsetX,
      this.aCrossbarEndPoint[1],
    );
    ctx.strokeStyle = "yellow";
    ctx.stroke();

    drawLineTowards({
      initialCoords: this.aInnerLeftStart,
      endCoords: this.aInnerLeftEnd,
      progress: animationProgress,
      colour: this.aColour,
    });
    drawLineTowards({
      initialCoords: this.aInnerRightStart,
      endCoords: this.aInnerRightEnd,
      progress: animationProgress,
      colour: this.aColour,
    });
    drawLineTowards({
      initialCoords: this.aTopLineStart,
      endCoords: this.aTopLineEnd,
      progress: animationProgress,
      colour: this.aColour,
    });

    this.aXEndFinal = this.aXEndFinal + this.aXStep;
  }
}

let travellingCrossbarIndexesByLine: number[][] = [];
let unfinishedCrossbarLines = 0;
let unfinishedLetters = 0;

function finishLetter() {
  unfinishedLetters -= 1;

  if (unfinishedLetters === 0) {
    finalImage = ctx.getImageData(0, 0, width, canvas.height);
    startTravellingCrossbars();
  }
}

function startTravellingCrossbars() {
  const populatedLineQueues = travellingCrossbarIndexesByLine.filter(
    (lineQueue) => lineQueue.length > 0,
  );
  unfinishedCrossbarLines = populatedLineQueues.length;

  if (unfinishedCrossbarLines === 0) {
    completeLetterPhase();
    return;
  }

  populatedLineQueues.forEach(animateNextTravellingCrossbar);
}

function animateNextTravellingCrossbar(lineQueue: number[]) {
  const letterIndex = lineQueue.shift();

  if (letterIndex === undefined) {
    unfinishedCrossbarLines -= 1;
    if (unfinishedCrossbarLines === 0) {
      completeLetterPhase();
    }
    return;
  }

  new A2(width, height, letterIndex, () => {
    animateNextTravellingCrossbar(lineQueue);
  }).animationFunc();
}

function completeLetterPhase() {
  finalImage = ctx.getImageData(0, 0, width, canvas.height);
  canvas.dataset.letterAnimationState = "complete";
  canvas.dispatchEvent(new CustomEvent("letterscomplete"));

  if (shouldRunLightShow) {
    flashBorder();
    lightShow();
  } else {
    markAnimationComplete();
  }
}

function startAnimation(lineWidth: number) {
  animationFrameIds.forEach((frameId) => {
    cancelAnimationFrame(frameId);
  });
  animationFrameIds.clear();

  stopFlashing = false;
  borderColour = "yellow";
  iFlash = 37;
  xEndLightShow = letterWidth / 2;
  yEndLightShow = height * 1.5;
  time = 0;

  ctx.clearRect(0, 0, width, canvas.height);
  ctx.lineCap = "square";
  ctx.lineWidth = lineWidth;
  canvas.dataset.lineWidth = String(lineWidth);
  canvas.dataset.animationState = "running";
  canvas.dataset.letterAnimationState = "running";

  finalImage = ctx.getImageData(0, 0, width, canvas.height);
  travellingCrossbarIndexesByLine = wrappedLines.map(() => []);
  letters.forEach((letter, index) => {
    if (isTravellingCrossbarMarker(letter)) {
      travellingCrossbarIndexesByLine[letterLayouts[index].lineIndex].push(
        index,
      );
    }
  });
  unfinishedLetters = letters.filter((letter) =>
    "'’æÆ0123TDAGESCBFHIJKLMNOPQRUVWXYZ".includes(letter),
  ).length;

  letters.forEach((letter, index) => {
    if (letter === "'" || letter === "’") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        apostropheDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "0") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        zeroDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "1") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        oneDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "2") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        twoDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "3") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        threeDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "T") {
      new T1(width, height, index, finishLetter).animationFunc();
    } else if (letter === "D") {
      new D1(width, height, index, finishLetter).animationFunc();
    } else if (letter === "A") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        aDefinition,
        finishLetter,
      ).animationFunc();
    } else if (isTravellingCrossbarMarker(letter)) {
      new A1(width, height, index, finishLetter).animationFunc();
    } else if (letter === "G") {
      new G1(width, height, index, finishLetter).animationFunc();
    } else if (letter === "E") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        eDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "S") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        sDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "C") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        cDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "B") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        bDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "F") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        fDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "H") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        hDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "I") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        iDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "J") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        jDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "K") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        kDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "L") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        lDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "M") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        mDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "N") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        nDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "O") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        oDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "P") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        pDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "Q") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        qDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "R") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        rDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "U") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        uDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "V") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        vDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "W") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        wDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "X") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        xDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "Y") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        yDefinition,
        finishLetter,
      ).animationFunc();
    } else if (letter === "Z") {
      new DeclarativeGlyph(
        width,
        height,
        index,
        zDefinition,
        finishLetter,
      ).animationFunc();
    }
  });

  if (unfinishedLetters === 0) {
    startTravellingCrossbars();
  }
}

function isTravellingCrossbarMarker(letter: string) {
  return letter === "æ" || letter === "Æ";
}

function drawLineYDiagonal(
  initialCoords: Point,
  endCoords: Point,
  variable: number,
  colour: string,
) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + variable, initialCoords[1]);
  ctx.lineTo(endCoords[0], endCoords[1]);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawLineTowards({
  initialCoords,
  endCoords,
  progress,
  colour,
}: LineTowardsOptions) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0], initialCoords[1]);
  ctx.lineTo(
    initialCoords[0] + (endCoords[0] - initialCoords[0]) * progress,
    initialCoords[1] + (endCoords[1] - initialCoords[1]) * progress
  );
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawPolygon({ points, xOffset, colour }: PolygonOptions) {
  ctx.beginPath();
  ctx.moveTo(points[0][0] + xOffset, points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0] + xOffset, points[i][1]);
  }
  ctx.closePath();
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawLineXForwards({
  initialCoords,
  yPositionOffset,
  length,
  colour,
}: HorizontalLineOptions) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0], initialCoords[1] + yPositionOffset);
  ctx.lineTo(initialCoords[0] + length, initialCoords[1] + yPositionOffset);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawLineYForwards({
  initialCoords,
  endPoint,
  length,
  colour,
}: VerticalLineOptions) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + endPoint, initialCoords[1]);
  ctx.lineTo(initialCoords[0] + endPoint, initialCoords[1] + length);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

let stopFlashing = false;
let borderColour = "yellow";
let iFlash = 37;

function flashBorder() {
  iFlash += 0.05 * lightShowAnimationStepScale;
  if (iFlash <= 1000) {
    if (!stopFlashing) {
      queueAnimationFrame(flashBorder);
    }
  } else {
    console.log("finished flashing");
  }

  const hue = iFlash % 360;

  borderColour = `hsl(${hue}, 100%, 50%)`;
}

const lightShowStartCoords = [0, height * 0.5];
const lightShowStartCoords2 = [width, height * 0.5];
let xEndLightShow = letterWidth / 2;
let yEndLightShow = height * 1.5;
let time = 0;

function markAnimationComplete() {
  canvas.dataset.animationState = "complete";
  canvas.dispatchEvent(new CustomEvent("animationcomplete"));
}

function lightShow() {
  if (time < width * 2) {
    queueAnimationFrame(lightShow);
  } else {
    stopFlashing = true;
    ctx.font = "36px serif";
    ctx.fillStyle = "yellow";
    ctx.fillText("Presents", width / 3, (height * 7) / 8);
    markAnimationComplete();
    console.log("finished light show");
    return;
  }
  ctx.putImageData(finalImage, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";

  ctx.beginPath();

  const cx = lightShowStartCoords[0] + xEndLightShow;
  const cy = lightShowStartCoords[1] - yEndLightShow;
  const r = letterWidth / 4;
  const a = Math.PI * 1.25;
  const b = Math.PI * 0.25;
  const x = cx + r * Math.cos(a);
  const y = cy + r * Math.sin(a);
  const x2 = cx + r * Math.cos(b);
  const y2 = cy + r * Math.sin(b);

  ctx.moveTo(0, height);
  ctx.lineTo(x, y);
  ctx.ellipse(
    lightShowStartCoords[0] + xEndLightShow,
    lightShowStartCoords[1] - yEndLightShow,
    letterWidth / 4,
    letterWidth / 4,
    0,
    2 * Math.PI,
    0
  );
  ctx.moveTo(0, height);
  ctx.lineTo(x2, y2);
  ctx.ellipse(
    lightShowStartCoords[0] + xEndLightShow,
    lightShowStartCoords[1] - yEndLightShow,
    letterWidth / 4,
    letterWidth / 4,
    0,
    2 * Math.PI,
    0
  );

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "yellow";
  ctx.fillStyle = lightShowColour;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width, height);
  ctx.lineTo(
    lightShowStartCoords2[0] - 0.7 * xEndLightShow - letterWidth / 4,
    height / 2 - 0.7 * yEndLightShow
  );
  ctx.ellipse(
    lightShowStartCoords2[0] - 0.7 * xEndLightShow,
    lightShowStartCoords2[1] - 0.7 * yEndLightShow,
    letterWidth / 4,
    letterWidth / 4,
    0,
    2 * Math.PI,
    0
  );
  ctx.moveTo(width, height);
  ctx.lineTo(
    lightShowStartCoords2[0] - 0.7 * xEndLightShow + letterWidth / 4,
    height / 2 - 0.7 * yEndLightShow
  );
  ctx.strokeStyle = "yellow";
  ctx.fillStyle = "yellow";
  ctx.strokeStyle = borderColour;
  ctx.fillStyle = borderColour;
  ctx.globalAlpha = 0.3;

  ctx.fill();
  ctx.restore();

  time += 2 * lightShowAnimationStepScale;
  if (time < width) {
    xEndLightShow += 2 * lightShowAnimationStepScale;
    yEndLightShow -= lightShowAnimationStepScale;
  } else {
    xEndLightShow -= 2 * lightShowAnimationStepScale;
    yEndLightShow -= 0.5 * lightShowAnimationStepScale;
  }
}

function getCanvas(selector: string): HTMLCanvasElement {
  const element = document.querySelector<HTMLCanvasElement>(selector);

  if (!element) {
    throw new Error(`The canvas element "${selector}" is missing.`);
  }

  return element;
}

function getButton(selector: string): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>(selector);

  if (!element) {
    throw new Error(`The button element "${selector}" is missing.`);
  }

  return element;
}

function getRangeInput(selector: string): HTMLInputElement {
  const element = document.querySelector<HTMLInputElement>(selector);

  if (!element || element.type !== "range") {
    throw new Error(`The range input "${selector}" is missing.`);
  }

  return element;
}

function getOutput(selector: string): HTMLOutputElement {
  const element = document.querySelector<HTMLOutputElement>(selector);

  if (!element) {
    throw new Error(`The output element "${selector}" is missing.`);
  }

  return element;
}

function getCanvasContext(
  element: HTMLCanvasElement,
  options?: CanvasRenderingContext2DSettings,
): CanvasRenderingContext2D {
  const context = element.getContext("2d", options);

  if (!context) {
    throw new Error("This browser does not support the 2D canvas API.");
  }

  return context;
}

startAnimation(requestedLineWidth);
