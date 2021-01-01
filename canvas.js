let canvas = document.getElementById("canvas");
canvas.style.border = "1px solid yellow";
let ctx = canvas.getContext("2d");

// ctx.globalCompositeOperation = "difference";
ctx.lineCap = "square";
ctx.lineWidth = 2;

//consts for size

const numberOfLetters = 3;
const width = canvas.width;
const letterWidth = width / (numberOfLetters + 2);
const paddingAroundLetters =
  (width - numberOfLetters * letterWidth) / (numberOfLetters + 1);

canvas.height = letterWidth + 2 * paddingAroundLetters;

const height = canvas.height;

const letterHeight = letterWidth;

const tYEndPoint = height * 0.13;
const tXEndPoint2 = width * 0.07;
const tYEndPoint3 = letterHeight - tYEndPoint;

const tInitialState = {
  xEnd: 0,
  yEnd: 0,
  tStartPoint: [paddingAroundLetters, paddingAroundLetters],
  tYEndPoint: height * 0.13,
  tXEndPoint2: width * 0.07,
  tYEndPoint2: height * 0.13,
  tXEndPoint3: width * 0.07,
  tYEndPoint3: tYEndPoint3,
  tXEndPoint4: letterWidth - 2 * tXEndPoint2,
  tYEndPoint4: letterHeight - tYEndPoint,
  tColour: `rgb(${0}, ${100 + ((0 * 1) % 255)}, ${100 + ((0 * 3) % 255)})`,
};

const dInitialState = {
  dXEnd: -Math.PI / 2,
  dYEnd: 0,

  dStartPoint: [letterWidth + 2 * paddingAroundLetters, paddingAroundLetters],
  dColour: `rgb(${150}, ${10 + ((0 * 3) % 255)}, ${10 + ((0 * 3) % 255)})`,

  dYEndPoint: letterHeight,

  dXEnd2: -Math.PI / 2,
  dYEnd2: 0,

  dXEndPoint: width * 0.0275,
  dYEndPoint2: tYEndPoint + tYEndPoint3 - width * 0.08,
};

// const aXEndPoint = width * 0.07; // old value for narrower A

const aStartCoords = [
  3 * paddingAroundLetters + 2 * letterWidth,
  paddingAroundLetters,
];

const aStartCoords2 = [aStartCoords[0] + letterWidth, paddingAroundLetters];

const aInitialState = {
  aXEnd: 0,
  aXEnd2: 0,
  narrowAXEndPoint: width * 0.07,

  aStartCoords: [
    3 * paddingAroundLetters + 2 * letterWidth,
    paddingAroundLetters,
  ],
  aEndCoords: [aStartCoords[0], paddingAroundLetters + letterHeight],
  aStartCoords2: [aStartCoords[0] + letterWidth, paddingAroundLetters],
  aEndCoords2: [aStartCoords2[0], paddingAroundLetters + letterHeight],
};

const aFinalInitialState = {
  aStartCoordsFinal: [
    paddingAroundLetters,
    paddingAroundLetters + letterHeight / 2,
  ],
  aXEndFinal: 0,
  // aXEndPointFinal: width * 0.74, // old value from narrower A
  aXEndPointFinal: width - letterWidth,
};

// vars for lightShow
const lightShowStartCoords = [0, height * 0.5];
let xEndLightShow = 0;
let yEndLightShow = 0;

// fillBackground();

let iFlash = 0;
let jFlash = 0;
let iColour = 0;

// flashBorder();

window.requestAnimationFrame(() => animateT(0, tInitialState));

window.requestAnimationFrame(() => animateD(0, dInitialState));

let imageData = ctx.getImageData(
  aStartCoords[0] - 5,
  aStartCoords[1] - 5,
  width - aStartCoords[0],
  height - aStartCoords[1]
);

window.requestAnimationFrame(() => animateA(0, aInitialState));

drawGrid();

// temp to show grid lines
function drawGrid() {
  if (false) {
    const colours = ["red", "yellow", "green", "white", "orange"];
    for (let i = 0; i <= numberOfLetters; i++) {
      // draw lines in between
      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * i,
          paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: paddingAroundLetters,
        colour: colours[2],
      });

      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * (i + 1),
          paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: letterWidth,
        colour: colours[3],
      });

      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * i,
          height - paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: paddingAroundLetters,
        colour: colours[2],
      });

      drawLineXForwards({
        initialCoords: [
          letterWidth * i + paddingAroundLetters * (i + 1),
          height - paddingAroundLetters,
        ],
        yPositionOffset: 0,
        length: letterWidth,
        colour: colours[3],
      });
    }
  }
}

let finalImage;

function animateT(ms, tState) {
  let state = { ...tState };
  let { xEnd, tStartPoint, tColour, yEnd, tYEndPoint } = state;
  if (xEnd < letterWidth) {
    window.requestAnimationFrame((ts) => animateT(ts, state));
  } else {
    window.requestAnimationFrame(() =>
      animateTStep2(ms, { ...state, xEnd: 0, yEnd: 0 })
    );
  }
  tColour = `rgb(${0}, ${100 + ((xEnd * 1) % 255)}, 100)`;
  drawLineXForwards({
    initialCoords: tStartPoint,
    yPositionOffset: 0,
    length: xEnd,
    colour: tColour,
  });
  drawLineYForwards({
    initialCoords: tStartPoint,
    endPoint: 0,
    length: yEnd,
    colour: tColour,
  });
  xEnd++;
  xEnd++;

  if (yEnd < tYEndPoint) {
    yEnd++;
  }
  state = { ...state, tColour, xEnd, yEnd };
}

function animateTStep2(ms, tState) {
  let state = { ...tState };
  let {
    xEnd,
    tXEndPoint2,
    tStartPoint,
    tColour,
    yEnd,
    tYEndPoint,
    tYEndPoint2,
  } = state;

  if (xEnd < tXEndPoint2) {
    window.requestAnimationFrame((ts) => animateTStep2(ts, state));
  } else {
    window.requestAnimationFrame(() =>
      animateTStep3(ms, { ...state, xEnd: 0, yEnd: 0 })
    );
  }
  drawLineXForwards({
    initialCoords: tStartPoint,
    yPositionOffset: tYEndPoint,
    length: xEnd,
    colour: tColour,
  });
  drawLineYForwards({
    initialCoords: tStartPoint,
    endPoint: letterWidth,
    length: yEnd,
    colour: tColour,
  });
  xEnd++;
  xEnd++;
  if (yEnd < tYEndPoint2) {
    yEnd++;
    yEnd++;
  }
  state = { ...state, xEnd, yEnd };
}

function animateTStep3(ms, tState) {
  let state = { ...tState };
  let { tStartPoint, tColour, xEnd, yEnd, tYEndPoint2, tXEndPoint3 } = state;
  if (yEnd < tYEndPoint3) {
    window.requestAnimationFrame(() => animateTStep3(ms, state));
  } else {
    window.requestAnimationFrame(() =>
      animateTStep4(ms, { ...state, xEnd: 0, yEnd: 0 })
    );
  }

  drawLineYForwards({
    initialCoords: [tStartPoint[0], tStartPoint[1] + tYEndPoint2],
    endPoint: tXEndPoint2,
    length: yEnd,
    colour: tColour,
  });
  drawLineXForwards({
    initialCoords: [tStartPoint[0] + letterWidth, tStartPoint[1]],
    yPositionOffset: tYEndPoint2,
    length: -xEnd,
    colour: tColour,
  });
  yEnd++;
  yEnd++;
  if (xEnd < tXEndPoint3) {
    xEnd++;
  }
  state = { ...state, xEnd, yEnd };
}

function animateTStep4(ms, tState) {
  let state = { ...tState };
  let {
    xEnd,
    tStartPoint,
    tXEndPoint2,
    tColour,
    yEnd,
    tYEndPoint,
    tYEndPoint2,
    tXEndPoint4,
    tYEndPoint4,
  } = state;
  if (yEnd < tYEndPoint4) {
    window.requestAnimationFrame(() => animateTStep4(ms, { ...state }));
  } else {
    console.log("done T");
  }
  drawLineXForwards({
    initialCoords: [tStartPoint[0] + tXEndPoint2, tStartPoint[1]],
    yPositionOffset: tYEndPoint2 + tYEndPoint4,
    length: xEnd,
    colour: tColour,
  });
  drawLineYForwards({
    initialCoords: [tStartPoint[0], tStartPoint[1] + tYEndPoint],
    endPoint: letterWidth - tXEndPoint2,
    length: yEnd,
    colour: tColour,
  });
  yEnd++;
  yEnd++;
  if (xEnd < tXEndPoint4) {
    xEnd++;
  }
  state = { ...state, xEnd, yEnd };
}

function drawLineYDiagonal(initialCoords, endCoords, variable, colour) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + variable, initialCoords[1]);
  ctx.lineTo(endCoords[0], endCoords[1]);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function animateAFinal(ms, aFinalState) {
  let state = { ...aFinalState };
  let { aXEndFinal, aXEndPointFinal, aStartCoordsFinal } = state;
  if (aXEndFinal < aXEndPointFinal) {
    requestAnimationFrame((ts) => animateAFinal(ts, { ...state }));
  } else {
    console.log("done AFinal");
    // initiate final flourish
    // lightShow();
  }

  ctx.putImageData(finalImage, 0, 0);
  finalImage = ctx.getImageData(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(aStartCoordsFinal[0] + aXEndFinal / 1.35, aStartCoordsFinal[1]);
  ctx.lineTo(aStartCoordsFinal[0] + aXEndFinal, aStartCoordsFinal[1]);
  ctx.strokeStyle = "yellow";
  ctx.stroke();
  aXEndFinal = aXEndFinal + 7;
  state = { ...state, aXEndFinal };
}

function animateA(ms, aState) {
  let state = { ...aState };
  let {
    aStartCoords,
    aEndCoords,
    aEndCoords2,
    aXEnd,
    aColour,
    aXEnd2,
    s,
  } = state;
  if (aXEnd < letterWidth / 2) {
    requestAnimationFrame((ts) => animateA(ts, state));
  } else {
    drawLineYDiagonal(aStartCoords, aEndCoords, aXEnd, aColour);
  }
  aColour = `rgb(${150}, ${10 + ((aXEnd * 1) % 255)}, ${
    10 + ((aXEnd * 2) % 255)
  })`;
  ctx.putImageData(imageData, aStartCoords[0] - 5, aStartCoords[1] - 5);
  drawGrid();
  drawLineYDiagonal(aStartCoords, aEndCoords, aXEnd, aColour);
  drawLineYDiagonal(aStartCoords2, aEndCoords2, -aXEnd2, aColour);
  aXEnd = aXEnd + 0.35;
  aXEnd2 = aXEnd2 + 0.35;
  state = { ...state, aXEnd, aXEnd2 };
}

function animateD(ms, dState) {
  let state = { ...dState };
  let { dXEnd, dYEnd, dStartPoint, dYEndPoint } = state;
  if (dYEnd < dYEndPoint) {
    window.requestAnimationFrame((ts) => animateD(ts, state));
  } else {
    window.requestAnimationFrame((ts) => animateDStep2(ts, state));
  }
  drawLineYForwards({
    initialCoords: dStartPoint,
    endPoint: 0,
    length: dYEnd,
    colour: `rgb(${150}, ${10 + ((dYEnd * 1) % 255)}, ${
      10 + ((dYEnd * 2) % 255)
    })`,
  });
  ctx.beginPath();
  ctx.ellipse(
    dStartPoint[0],
    dStartPoint[1] + letterHeight / 2,
    letterWidth,
    letterHeight / 2,
    0,
    -Math.PI / 2,
    dXEnd
  );
  ctx.strokeStyle = `rgb(${150}, ${10 + ((dYEnd * 1) % 255)}, ${
    10 + ((dYEnd * 2) % 255)
  })`;
  ctx.stroke();
  dYEnd++;
  if (dXEnd < Math.PI / 2) {
    dXEnd = dXEnd + 0.05;
  }
  state = { ...state, dYEnd, dXEnd };
}

function animateDStep2(ms, dState) {
  let state = { ...dState };
  let { dStartPoint, dXEnd2, dYEnd2, dXEndPoint, dYEndPoint2 } = state;

  if (dYEnd2 < dYEndPoint2) {
    window.requestAnimationFrame((ts) => animateDStep2(ts, state));
  } else {
    console.log("done D");

    finalImage = ctx.getImageData(0, 0, width, height);

    requestAnimationFrame((ts) => animateAFinal(ts, aFinalInitialState));
  }
  drawLineYForwards({
    initialCoords: [dStartPoint[0], dStartPoint[1] + width * 0.04],
    endPoint: dXEndPoint,
    length: dYEnd2,
    colour: `rgb(${150}, ${10 + ((dYEnd2 * 2) % 255)}, ${
      50 + ((dYEnd2 * 3) % 255)
    })`,
  });
  ctx.beginPath();
  ctx.ellipse(
    dStartPoint[0] + dXEndPoint,
    dStartPoint[1] + dYEndPoint2 / 2 + width * 0.04,
    dYEndPoint2 / 2 + width * 0.065,
    dYEndPoint2 / 2,
    0,
    -Math.PI / 2,
    dXEnd2
  );
  ctx.strokeStyle = `rgb(${150}, ${10 + ((dYEnd2 * 1) % 255)}, ${
    10 + ((dYEnd2 * 3) % 255)
  })`;
  ctx.stroke();
  dYEnd2++;
  if (dXEnd2 < Math.PI / 2) {
    dXEnd2 = dXEnd2 + 0.06;
  }

  state = { ...state, dYEnd2, dXEnd2 };
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

// function fillBackground() {
//   ctx.fillStyle = "rgb(200, 100, 100)";
//   ctx.fillStyle = "black";
//   ctx.fillRect(0, 0, width, height);
// }

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

// supposed to be like fox searchlight pictures torch thing
function lightShow() {
  if (100 < 101) {
    requestAnimationFrame(lightShow);
  } else {
    console.log("finished");
  }
  ctx.globalCompositeOperation = "destination-atop";
  // ctx.putImageData(finalImage, 0, 0);
  ctx.moveTo(
    lightShowStartCoords[0] + xEndLightShow,
    lightShowStartCoords[1] + yEndLightShow
  );
  ctx.lineTo(lightShowStartCoords[0] + 10, lightShowStartCoords[1]);
  ctx.strokeStyle = "yellow";
  ctx.stroke();
  if (xEndLightShow < width) {
    xEndLightShow++;
  } else {
    xEndLightShow--;
  }
}
