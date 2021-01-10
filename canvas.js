let canvas = document.getElementById("canvas");
canvas.style.border = "1px solid yellow";
let ctx = canvas.getContext("2d");

// ctx.globalCompositeOperation = "difference";
ctx.lineCap = "square";
ctx.lineWidth = 2;

//consts for size

const numberOfLetters = 3;
const width = canvas.width;
const height = canvas.height;
const letterWidth = width / (numberOfLetters + 2);
const paddingAroundLetters =
  (width - numberOfLetters * letterWidth) / (numberOfLetters + 1);

canvas.height = letterWidth + 2 * paddingAroundLetters;

const letterHeight = letterWidth;

const tYEndPoint = height * 0.13;
const tXEndPoint2 = width * 0.07;
const tYEndPoint3 = letterHeight - tYEndPoint;

class Letter {
  constructor(width, height, updateFunc, shouldContinue, next) {
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

  animationFunc(ms) {
    if (this.shouldContinue()) {
      window.requestAnimationFrame(this.animationFunc.bind(this));
    } else {
      this.next(ms);
    }
    this.updateFunc.call(this, ms);
  }
}

class T1 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawT1.call(this, ts),
      () => this.xEnd < this.letterWidth,
      () => new T2(width, height).animationFunc()
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [paddingAroundLetters, paddingAroundLetters];
    this.tYEndPoint = height * 0.13;
    this.tColour = `rgb(${0}, ${100 + ((0 * 1) % 255)}, ${
      100 + ((0 * 3) % 255)
    })`;
  }

  drawT1(ms) {
    this.tColour = `rgb(${0}, ${100 + ((this.xEnd * 1) % 255)}, 100)`;
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
    this.xEnd++;
    this.xEnd++;

    if (this.yEnd < this.tYEndPoint) {
      this.yEnd++;
    }
  }
}

class T2 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawT2.call(this, ts),
      () => this.xEnd < this.tXEndPoint2,
      () => new T3(width, height).animationFunc()
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.paddingAroundLetters, this.paddingAroundLetters];
    this.tYEndPoint = height * 0.13;
    this.tXEndPoint2 = width * 0.07;
    this.tYEndPoint2 = height * 0.13;
    this.colour = `rgb(${0}, ${100 + ((this.letterWidth * 1) % 255)}, 100)`;
  }

  drawT2(ms) {
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
    this.xEnd++;
    this.xEnd++;
    if (this.yEnd < this.tYEndPoint2) {
      this.yEnd++;
      this.yEnd++;
    }
  }
}

class T3 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawT3.call(this, ts),
      () => this.xEnd < this.tXEndPoint3,
      () => new T4(width, height).animationFunc()
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.paddingAroundLetters, this.paddingAroundLetters];
    this.tYEndPoint2 = height * 0.13;
    this.tXEndPoint2 = width * 0.07;
    this.tXEndPoint3 = width * 0.07;
    this.colour = `rgb(${0}, ${100 + ((this.letterWidth * 1) % 255)}, 100)`;
  }

  drawT3(ms) {
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
    this.yEnd++;
    this.yEnd++;
    if (this.xEnd < this.tXEndPoint3) {
      this.xEnd++;
    }
  }
}

class T4 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawT4.call(this, ts),
      () => this.yEnd < this.tYEndPoint4,
      () => console.log("finished T")
    );
    this.xEnd = 0;
    this.yEnd = 0;
    this.tStartPoint = [this.paddingAroundLetters, this.paddingAroundLetters];
    this.tYEndPoint = height * 0.13;
    this.tYEndPoint2 = height * 0.13;
    this.tXEndPoint2 = width * 0.07;
    this.tXEndPoint4 = this.letterWidth - 2 * this.tXEndPoint2;
    this.tYEndPoint4 = this.letterHeight - this.tYEndPoint;
    this.colour = `rgb(${0}, ${100 + ((this.letterWidth * 1) % 255)}, 100)`;
  }

  drawT4(ms) {
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
    this.yEnd++;
    this.yEnd++;
    if (this.xEnd < this.tXEndPoint4) {
      this.xEnd++;
    }
  }
}

class D1 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawD1.call(this, ts),
      () => this.dYEnd < this.dYEndPoint,
      () => new D2(width, height).animationFunc()
    );

    this.dXEnd = -Math.PI / 2;
    this.dYEnd = 0;
    this.dStartPoint = [
      letterWidth + 2 * paddingAroundLetters,
      paddingAroundLetters,
    ];
    this.dYEndPoint = letterHeight;
  }

  drawD1(ms) {
    drawLineYForwards({
      initialCoords: this.dStartPoint,
      endPoint: 0,
      length: this.dYEnd,
      colour: `rgb(${150}, ${10 + ((this.dYEnd * 1) % 255)}, ${
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
    ctx.strokeStyle = `rgb(${150}, ${10 + ((this.dYEnd * 1) % 255)}, ${
      10 + ((this.dYEnd * 2) % 255)
    })`;
    ctx.stroke();
    this.dYEnd++;
    if (this.dXEnd < Math.PI / 2) {
      this.dXEnd = this.dXEnd + 0.05;
    }
  }
}

class D2 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawD2.call(this, ts),
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

  drawD2(ms) {
    drawLineYForwards({
      initialCoords: [
        this.dStartPoint[0],
        this.dStartPoint[1] + this.width * 0.04,
      ],
      endPoint: this.dXEndPoint,
      length: this.dYEnd,
      colour: `rgb(${150}, ${10 + ((this.dYEnd * 2) % 255)}, ${
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
    ctx.strokeStyle = `rgb(${150}, ${10 + ((this.dYEnd2 * 1) % 255)}, ${
      10 + ((this.dYEnd2 * 3) % 255)
    })`;
    ctx.stroke();
    this.dYEnd++;
    if (this.dXEnd < Math.PI / 2) {
      this.dXEnd = this.dXEnd + 0.06;
    }
  }
}

const aStartCoords = [
  3 * paddingAroundLetters + 2 * letterWidth,
  paddingAroundLetters,
];

const aStartCoords2 = [aStartCoords[0] + letterWidth, paddingAroundLetters];

let imageData = ctx.getImageData(
  aStartCoords[0] - 5,
  aStartCoords[1] - 5,
  width - aStartCoords[0],
  height - aStartCoords[1]
);

class A1 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawA1.call(this, ts),
      () => this.aXEnd < this.letterWidth / 2,
      () => console.log("finished A1")
    );

    this.aStartCoords = [
      3 * paddingAroundLetters + 2 * letterWidth,
      paddingAroundLetters,
    ];
    this.aStartCoords2 = [aStartCoords[0] + letterWidth, paddingAroundLetters];
    this.aXEnd = 0;
    this.aXEnd2 = 0;
    // this.narrowAXEndPoint = width * 0.07;
    this.aEndCoords = [aStartCoords[0], paddingAroundLetters + letterHeight];
    this.aEndCoords2 = [aStartCoords2[0], paddingAroundLetters + letterHeight];
  }

  drawA1(ms) {
    this.aColour = `rgb(${150}, ${10 + ((this.aXEnd * 1) % 255)}, ${
      10 + ((this.aXEnd * 2) % 255)
    })`;
    ctx.putImageData(
      imageData,
      this.aStartCoords[0] - 5,
      this.aStartCoords[1] - 5
    );
    drawLineYDiagonal(
      this.aStartCoords,
      this.aEndCoords,
      this.aXEnd,
      this.aColour
    );
    drawLineYDiagonal(
      this.aStartCoords2,
      this.aEndCoords2,
      -this.aXEnd2,
      this.aColour
    );
    this.aXEnd = this.aXEnd + 0.35;
    this.aXEnd2 = this.aXEnd2 + 0.35;
  }
}

let finalImage;

class A2 extends Letter {
  constructor(width, height) {
    super(
      width,
      height,
      (ts) => this.drawA2.call(this, ts),
      () => this.aXEndFinal < this.aXEndPointFinal,
      () => {
        console.log("finished A2.. can do light show");
        finalImage = ctx.getImageData(0, 0, width, height);
        lightShow();
      }
    );
    this.aStartCoordsFinal = [
      paddingAroundLetters,
      paddingAroundLetters + letterHeight / 2,
    ];
    this.aXEndFinal = 0;
    // aXEndPointFinal = width * 0.74, // old value from narrower A
    this.aXEndPointFinal = width - letterWidth;
  }

  drawA2(ms) {
    ctx.putImageData(finalImage, 0, 0);
    // finalImage = ctx.getImageData(0, 0, this.width, this.height);
    ctx.beginPath();
    ctx.moveTo(
      this.aStartCoordsFinal[0] + this.aXEndFinal / 1.35,
      this.aStartCoordsFinal[1]
    );
    ctx.lineTo(
      this.aStartCoordsFinal[0] + this.aXEndFinal,
      this.aStartCoordsFinal[1]
    );
    ctx.strokeStyle = "yellow";
    ctx.stroke();
    this.aXEndFinal = this.aXEndFinal + 7;
  }
}

let iFlash = 0;
let jFlash = 0;
let iColour = 0;

// flashBorder();

const t = new T1(width, height);
t.animationFunc();
const d = new D1(width, height);
d.animationFunc();
const a = new A1(width, height);
a.animationFunc();

function drawLineYDiagonal(initialCoords, endCoords, variable, colour) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + variable, initialCoords[1]);
  ctx.lineTo(endCoords[0], endCoords[1]);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawLineXForwards({ initialCoords, yPositionOffset, length, colour }) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0], initialCoords[1] + yPositionOffset);
  ctx.lineTo(initialCoords[0] + length, initialCoords[1] + yPositionOffset);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawLineYForwards({ initialCoords, endPoint, length, colour }) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + endPoint, initialCoords[1]);
  ctx.lineTo(initialCoords[0] + endPoint, initialCoords[1] + length);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function flashBorder() {
  iFlash += 3;
  if (iFlash <= 1000) {
    window.requestAnimationFrame(flashBorder);
  } else {
    console.log("finished flashing");
  }

  const hue = iFlash % 360;

  const borderColour = `hsl(${hue}, ${`100%`}, ${`50%`})`;
  canvas.style.border = `2px solid ${borderColour}`;
}

// vars for lightShow
const lightShowStartCoords = [0, height * 0.5];
const lightShowStartCoords2 = [width, height * 0.5];
let xEndLightShow = 0;
let yEndLightShow = height * 1.5;
let time = 0;

// supposed to be like fox searchlight pictures torch thing
function lightShow() {
  if (time < width * 2) {
    requestAnimationFrame(lightShow);
  } else {
    console.log("finished");
  }
  ctx.putImageData(finalImage, 0, 0);
  ctx.globalCompositeOperation = "xor"; // lighter

  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(
    lightShowStartCoords[0] + xEndLightShow - letterWidth / 4,
    height / 2 - yEndLightShow
  );
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
  ctx.lineTo(
    lightShowStartCoords[0] + xEndLightShow + letterWidth / 4,
    height / 2 - yEndLightShow
  );
  ctx.closePath();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "yellow";
  ctx.fillStyle = "yellow";
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
  ctx.closePath();
  ctx.strokeStyle = "yellow";
  ctx.fillStyle = "yellow";
  ctx.globalAlpha = 0.3;

  ctx.fill();

  time += 2;
  if (time < width) {
    xEndLightShow += 2;
    yEndLightShow--;
  } else {
    xEndLightShow -= 2;
    yEndLightShow -= 0.5;
  }
}
