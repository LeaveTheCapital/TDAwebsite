import { Input, WebMidi, type PortEvent } from "webmidi";

import "../main.css";
import { animationTiming } from "./animation-timing.ts";
import "./dice.ts";

const canvas = getCanvas("#canvas");
const ctx = getCanvasContext(canvas, { willReadFrequently: true });
const startFakeMidiButton = getButton("#start-fake-midi");
const stopFakeMidiButton = getButton("#stop-fake-midi");

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

const animationStepScale = animationTiming.stepScale;

function advanceTowards(current: number, step: number, endPoint: number) {
  return Math.min(current + step * animationStepScale, endPoint);
}

const numberOfLetters = 3;
const width = canvas.width;
const height = canvas.height;
const letterWidth = width / (numberOfLetters + 2);
const paddingAroundLetters =
(width - numberOfLetters * letterWidth) / (numberOfLetters + 1);

canvas.height = letterWidth + 2 * paddingAroundLetters;
canvas.dataset.animationState = "running";
const midiOverlay = getCanvas("#midi-overlay");
midiOverlay.width = canvas.width;
midiOverlay.height = canvas.height;
const midiOverlayContext = getCanvasContext(midiOverlay);
midiOverlay.dataset.circleVisible = "false";
ctx.lineCap = "square";
ctx.lineWidth = 2;

const letterHeight = letterWidth;

const tYEndPoint = height * 0.13;
const tYEndPoint3 = letterHeight - tYEndPoint;
const aBottomLineWidth = width * 0.05;
const aTopLineWidth = width * 0.03;
const aInnerLineHeight = letterHeight / 2;

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

class Letter {
  readonly numberOfLetters: number;
  readonly width: number;
  readonly height: number;
  readonly letterWidth: number;
  readonly paddingAroundLetters: number;
  readonly letterHeight: number;
  readonly updateFunc: (ms: number) => void;
  readonly shouldContinue: () => boolean;
  readonly next: (ms?: number) => void;

  constructor(
    width: number,
    height: number,
    updateFunc: (ms: number) => void,
    shouldContinue: () => boolean,
    next: (ms?: number) => void,
  ) {
    this.numberOfLetters = 3;
    this.width = width;
    this.height = height;
    this.letterWidth = width / (numberOfLetters + 2);
    this.paddingAroundLetters =
      (width - numberOfLetters * letterWidth) / (numberOfLetters + 1);
    this.letterHeight = this.letterWidth;
    this.updateFunc = updateFunc;
    this.shouldContinue = shouldContinue;
    this.next = next;
  }

  animationFunc(ms = 0) {
    if (this.shouldContinue()) {
      window.requestAnimationFrame(this.animationFunc.bind(this));
    } else {
      this.next(ms);
    }
    this.updateFunc.call(this, ms);
  }
}

class T1 extends Letter {
  declare xEnd: number;
  declare yEnd: number;
  declare tStartPoint: Point;
  declare tYEndPoint: number;
  declare tColour: string;

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawT1();
      },
      () => this.xEnd < this.letterWidth,
      () => {
        new T2(width, height).animationFunc();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [paddingAroundLetters, paddingAroundLetters];
    this.tYEndPoint = height * 0.13;
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

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawT2();
      },
      () => this.xEnd < this.tXEndPoint2,
      () => {
        new T3(width, height).animationFunc();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.paddingAroundLetters, this.paddingAroundLetters];
    this.tYEndPoint = height * 0.13;
    this.tXEndPoint2 = width * 0.07;
    this.tYEndPoint2 = height * 0.13;
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

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawT3();
      },
      () => this.xEnd < this.tXEndPoint3,
      () => {
        new T4(width, height).animationFunc();
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.paddingAroundLetters, this.paddingAroundLetters];
    this.tYEndPoint2 = height * 0.13;
    this.tXEndPoint2 = width * 0.07;
    this.tXEndPoint3 = width * 0.07;
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
      initialCoords: [this.tStartPoint[0] + letterWidth, this.tStartPoint[1]],
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

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawT4();
      },
      () => this.yEnd < this.tYEndPoint4,
      () => {
        console.log("finished T");
      }
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.paddingAroundLetters, this.paddingAroundLetters];
    this.tYEndPoint = height * 0.13;
    this.tYEndPoint2 = height * 0.13;
    this.tXEndPoint2 = width * 0.07;
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
  declare dXEnd: number;
  declare dYEnd: number;
  declare dStartPoint: Point;
  declare dYEndPoint: number;

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawD1();
      },
      () => this.dYEnd < this.dYEndPoint,
      () => {
        new D2(width, height).animationFunc();
      }
    );

    this.dXEnd = -Math.PI / 2;
    this.dYEnd = 0;
    this.dStartPoint = [
      letterWidth + 2 * paddingAroundLetters,
      paddingAroundLetters,
    ];
    this.dYEndPoint = letterHeight;
  }

  drawD1() {
    drawLineYForwards({
      initialCoords: this.dStartPoint,
      endPoint: 0,
      length: this.dYEnd,
      colour: `rgb(150, ${10 + ((this.dYEnd * 1) % 255)}, ${
        10 + ((this.dYEnd * 2) % 255)
      })`,
    });
    ctx.beginPath();
    ctx.ellipse(
      this.dStartPoint[0],
      this.dStartPoint[1] + this.letterHeight / 2,
      this.letterWidth,
      this.letterHeight / 2,
      0,
      -Math.PI / 2,
      this.dXEnd
    );
    ctx.strokeStyle = `rgb(150, ${10 + ((this.dYEnd * 1) % 255)}, ${
      10 + ((this.dYEnd * 2) % 255)
    })`;
    ctx.stroke();
    this.dYEnd = advanceTowards(this.dYEnd, 1, this.dYEndPoint);
    if (this.dXEnd < Math.PI / 2) {
      this.dXEnd = advanceTowards(this.dXEnd, 0.05, Math.PI / 2);
    }
  }
}

class D2 extends Letter {
  declare dXEnd: number;
  declare dYEnd: number;
  declare dStartPoint: Point;
  declare dXEndPoint: number;
  declare dYEndPoint2: number;

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawD2();
      },
      () => this.dYEnd < this.dYEndPoint2,
      () => {
        finalImage = ctx.getImageData(0, 0, width, height);
        new A2(width, height).animationFunc();
      }
    );

    this.dXEnd = -Math.PI / 2;
    this.dYEnd = 0;
    this.dStartPoint = [
      this.letterWidth + 2 * this.paddingAroundLetters,
      this.paddingAroundLetters,
    ];
    this.dXEndPoint = this.width * 0.0275;
    this.dYEndPoint2 = tYEndPoint + tYEndPoint3 - this.width * 0.08;
  }

  drawD2() {
    drawLineYForwards({
      initialCoords: [
        this.dStartPoint[0],
        this.dStartPoint[1] + this.width * 0.04,
      ],
      endPoint: this.dXEndPoint,
      length: this.dYEnd,
      colour: `rgb(150, ${10 + ((this.dYEnd * 2) % 255)}, ${
        50 + ((this.dYEnd * 3) % 255)
      })`,
    });
    ctx.beginPath();
    ctx.ellipse(
      this.dStartPoint[0] + this.dXEndPoint,
      this.dStartPoint[1] + this.dYEndPoint2 / 2 + this.width * 0.04,
      this.dYEndPoint2 / 2 + this.width * 0.065,
      this.dYEndPoint2 / 2,
      0,
      -Math.PI / 2,
      this.dXEnd
    );
    ctx.strokeStyle = `rgb(150, ${10 + ((this.dYEnd * 1) % 255)}, ${
      10 + ((this.dYEnd * 3) % 255)
    })`;
    ctx.stroke();
    this.dYEnd = advanceTowards(this.dYEnd, 1, this.dYEndPoint2);
    if (this.dXEnd < Math.PI / 2) {
      this.dXEnd = advanceTowards(this.dXEnd, 0.06, Math.PI / 2);
    }
  }
}

const aStartCoords: Point = [
  3 * paddingAroundLetters + 2 * letterWidth,
  paddingAroundLetters,
];

const aStartCoords2: Point = [
  aStartCoords[0] + letterWidth,
  paddingAroundLetters,
];

const imageData = ctx.getImageData(
  aStartCoords[0] - 5,
  aStartCoords[1] - 5,
  width - aStartCoords[0],
  height - aStartCoords[1]
);

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

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawA1();
      },
      () => this.aXEnd < this.aOuterLineRun,
      () => {
        console.log("finished A1");
      }
    );

    this.aStartCoords = [
      3 * paddingAroundLetters + 2 * letterWidth,
      paddingAroundLetters,
    ];
    this.aStartCoords2 = [aStartCoords[0] + letterWidth, paddingAroundLetters];
    this.aXEnd = 0;
    this.aXEnd2 = 0;
    this.aBottomLineWidth = aBottomLineWidth;
    this.aOuterLineRun = (this.letterWidth - aTopLineWidth) / 2;
    this.aEndCoords = [aStartCoords[0], paddingAroundLetters + letterHeight];
    this.aEndCoords2 = [aStartCoords2[0], paddingAroundLetters + letterHeight];
  }

  drawA1() {
    this.aColour = `rgb(150, ${10 + ((this.aXEnd * 1) % 255)}, ${
      10 + ((this.aXEnd * 2) % 255)
    })`;
    ctx.putImageData(
      imageData,
      this.aStartCoords[0] - 5,
      this.aStartCoords[1] - 5
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

let finalImage = imageData;

class A2 extends Letter {
  declare aXEndFinal: number;
  declare aXStep: number;
  declare aXEndPointFinal: number;
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

  constructor(width: number, height: number) {
    super(
      width,
      height,
      () => {
        this.drawA2();
      },
      () => this.aXEndFinal < this.aXEndPointFinal + this.aXStep,
      () => {
        console.log("finished A2.. can do light show");
        finalImage = ctx.getImageData(0, 0, width, height);
        flashBorder();
        lightShow();
      }
    );
    this.aXEndFinal = 0;
    this.aXStep = 7 * animationStepScale;
    this.aXEndPointFinal = width - letterWidth;

    const halfLetterWidth = this.letterWidth / 2;
    const outerLineRun = halfLetterWidth - aTopLineWidth / 2;
    this.aColour = `rgb(150, ${10 + (outerLineRun % 255)}, ${
      10 + ((outerLineRun * 2) % 255)
    })`;
    const bottomY = paddingAroundLetters + this.letterHeight;
    const crossbarY = bottomY - aInnerLineHeight;
    const innerGapLeft = aStartCoords[0] + halfLetterWidth - aTopLineWidth / 2;
    const innerGapRight = aStartCoords[0] + halfLetterWidth + aTopLineWidth / 2;

    this.aInnerLeftStart = [aStartCoords[0] + aBottomLineWidth, bottomY];
    this.aInnerRightStart = [aStartCoords2[0] - aBottomLineWidth, bottomY];
    this.aInnerLeftEnd = [innerGapLeft, crossbarY];
    this.aInnerRightEnd = [innerGapRight, crossbarY];
    this.aCrossbarStartPoint = [innerGapLeft, crossbarY];
    this.aCrossbarEndPoint = [innerGapRight, crossbarY];
    this.aTopShapeCentreX = aStartCoords[0] + halfLetterWidth;
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
      paddingAroundLetters,
    ];
    this.aTopLineEnd = [
      aStartCoords2[0] - outerLineRun,
      paddingAroundLetters,
    ];
  }

  drawA2() {
    ctx.putImageData(finalImage, 0, 0);
    const animationDistance = Math.min(
      this.aXEndFinal,
      this.aXEndPointFinal
    );
    const animationProgress = animationDistance / this.aXEndPointFinal;
    const topShapeOffsetX =
      (paddingAroundLetters - this.aTopShapeCentreX) *
      (1 - animationProgress);

    drawPolygon({
      points: this.aTopShapePoints,
      xOffset: topShapeOffsetX,
      colour: this.aColour,
    });

    ctx.beginPath();
    ctx.moveTo(
      paddingAroundLetters +
        (this.aCrossbarStartPoint[0] - paddingAroundLetters) *
          animationProgress,
      this.aCrossbarStartPoint[1]
    );
    ctx.lineTo(
      paddingAroundLetters +
        (this.aCrossbarEndPoint[0] - paddingAroundLetters) *
          animationProgress,
      this.aCrossbarEndPoint[1]
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

const t = new T1(width, height);
t.animationFunc();
const d = new D1(width, height);
d.animationFunc();
const a = new A1(width, height);
a.animationFunc();

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
  iFlash += 0.05 * animationStepScale;
  if (iFlash <= 1000) {
    if (!stopFlashing) {
      window.requestAnimationFrame(flashBorder);
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

function lightShow() {
  if (time < width * 2) {
    requestAnimationFrame(lightShow);
  } else {
    stopFlashing = true;
    ctx.font = "36px serif";
    ctx.fillStyle = "yellow";
    ctx.fillText("Presents", width / 3, (height * 7) / 8);
    canvas.dataset.animationState = "complete";
    canvas.dispatchEvent(new CustomEvent("animationcomplete"));
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

  time += 2 * animationStepScale;
  if (time < width) {
    xEndLightShow += 2 * animationStepScale;
    yEndLightShow -= animationStepScale;
  } else {
    xEndLightShow -= 2 * animationStepScale;
    yEndLightShow -= 0.5 * animationStepScale;
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
