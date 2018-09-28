let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

console.log(ctx.globalCompositeOperation);
// ctx.globalCompositeOperation = "difference";

ctx.lineWidth = 8;

const width = canvas.width;
const height = canvas.height;

const letterHeight = height * 0.53;

let xEnd = 0;
let yEnd = 0;

let xEnd2 = 0;
let yEnd2 = 0;

let xEnd3 = 0;
let yEnd3 = 0;

let xEnd4 = 0;
let yEnd4 = 0;

const cdolour = "cornflowerblue";
let tColour = `rgb(${0}, ${100 + ((xEnd * 1) % 255)}, ${100 +
  ((xEnd * 3) % 255)})`;

const tStartPoint = [width * 0.1, height * 0.225];

const tXEndPoint = width * 0.2;
const tYEndPoint = height * 0.13;

const tXEndPoint2 = width * 0.07;
const tYEndPoint2 = tYEndPoint;

const tXEndPoint3 = tXEndPoint2;
const tYEndPoint3 = height * 0.4;

const tXEndPoint4 = tXEndPoint - 2 * tXEndPoint2;
const tYEndPoint4 = tYEndPoint3;

// vars for letter D

let dXEnd = -Math.PI / 2;
let dYEnd = 0;

const dStartPoint = [width * 0.4, height * 0.225];
let dColour = `rgb(${150}, ${10 + ((dYEnd * 3) % 255)}, ${10 +
  ((dYEnd * 3) % 255)})`;

const dYEndPoint = height * 0.53;

let dXEnd2 = -Math.PI / 2;
let dYEnd2 = 0;

const dXEndPoint = width * 0.0275;
const dYEndPoint2 = tYEndPoint + tYEndPoint3 - width * 0.08;

// vars for letter A

let aXEnd = 0;
let aXEnd2 = 0;
let aXEndFinal = 0;

const aXEndPoint = width * 0.07;

const aStartCoords = [width * 0.6, height * 0.225];
const aEndCoords = [aStartCoords[0], aStartCoords[1] + letterHeight];

const aStartCoords2 = [aStartCoords[0] + 2 * aXEndPoint, aStartCoords[1]];
const aEndCoords2 = [aStartCoords2[0], aStartCoords2[1] + letterHeight];

const aStartCoordsFinal = [tStartPoint[0], height * 0.225 + letterHeight / 2];

aXEndPointFinal = width * 0.65;

// vars for lightShow

const lightShowStartCoords = [0, height * 0.5];
let xEndLightShow = 0;
let yEndLightShow = 0;

fillBackground();

animateT();

animateD();

let imageData = ctx.getImageData(
  aStartCoords[0] - 5,
  aStartCoords[1] - 5,
  width - aStartCoords[0],
  height - aStartCoords[1]
);

animateA();
var finalImage;

function drawLineYDiagonal(initialCoords, endCoords, variable, colour) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + variable, initialCoords[1]);
  ctx.lineTo(endCoords[0], endCoords[1]);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

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

function animateAFinal() {
  if (aXEndFinal < aXEndPointFinal) {
    requestAnimationFrame(animateAFinal);
  } else {
    console.log("done AFinal");
    lightShow();
  }

  ctx.putImageData(finalImage, 0, 0);
  finalImage = ctx.getImageData(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(aStartCoordsFinal[0] + aXEndFinal / 1.35, aStartCoordsFinal[1]);
  ctx.lineTo(aStartCoordsFinal[0] + aXEndFinal, aStartCoordsFinal[1]);
  ctx.strokeStyle = "yellow";
  ctx.stroke();
  aXEndFinal = aXEndFinal + 7;
}

function animateA() {
  if (aXEnd < aXEndPoint) {
    requestAnimationFrame(animateA);
  } else {
    // what's going on here
    // drawLineYDiagonal(aStartCoords, aEndCoords, aXEnd, aColour);
    // animateAFinal();
    lightShow();
  }
  var aColour = `rgb(${150}, ${10 + ((aXEnd * 1) % 255)}, ${10 +
    ((aXEnd * 2) % 255)})`;
  ctx.putImageData(imageData, aStartCoords[0] - 5, aStartCoords[1] - 5);

  drawLineYDiagonal(aStartCoords, aEndCoords, aXEnd, aColour);
  drawLineYDiagonal(aStartCoords2, aEndCoords2, -aXEnd2, aColour);
  aXEnd = aXEnd + 0.35;
  aXEnd2 = aXEnd2 + 0.35;
}

function animateD() {
  if (dYEnd < dYEndPoint) {
    window.requestAnimationFrame(animateD);
  } else {
    animateDStep2();
  }
  drawLineYForwards(
    dStartPoint,
    0,
    dYEnd,
    `rgb(${150}, ${10 + ((dYEnd * 1) % 255)}, ${10 + ((dYEnd * 2) % 255)})`
  );
  ctx.beginPath();
  ctx.ellipse(
    dStartPoint[0],
    dStartPoint[1] + dYEndPoint / 2,
    dYEndPoint / 2 + width * 0.02,
    dYEndPoint / 2,
    0,
    -Math.PI / 2,
    dXEnd
  );
  ctx.strokeStyle = `rgb(${150}, ${10 + ((dYEnd * 1) % 255)}, ${10 +
    ((dYEnd * 2) % 255)})`;
  ctx.stroke();
  dYEnd++;
  if (dXEnd < Math.PI / 2) {
    dXEnd = dXEnd + 0.03;
  }
}

function animateDStep2() {
  if (dYEnd2 < dYEndPoint2) {
    window.requestAnimationFrame(animateDStep2);
  } else {
    console.log("done D");

    finalImage = ctx.getImageData(0, 0, width, height);

    animateAFinal();
  }
  drawLineYForwards(
    [dStartPoint[0], dStartPoint[1] + width * 0.04],
    dXEndPoint,
    dYEnd2,
    `rgb(${150}, ${10 + ((dYEnd2 * 2) % 255)}, ${50 + ((dYEnd2 * 3) % 255)})`
  );
  ctx.beginPath();
  ctx.ellipse(
    dStartPoint[0] + dXEndPoint,
    dStartPoint[1] + dYEndPoint2 / 2 + width * 0.04,
    dYEndPoint2 / 2 + width * 0.0,
    dYEndPoint2 / 2,
    0,
    -Math.PI / 2,
    dXEnd2
  );
  ctx.strokeStyle = `rgb(${150}, ${10 + ((dYEnd2 * 1) % 255)}, ${10 +
    ((dYEnd2 * 3) % 255)})`;
  ctx.stroke();
  dYEnd2++;
  if (dXEnd2 < Math.PI / 2) {
    dXEnd2 = dXEnd2 + 0.05;
  }
}

function animateT() {
  if (xEnd < tXEndPoint) {
    window.requestAnimationFrame(animateT);
  } else {
    animateTStep2();
  }
  tColour = `rgb(${0}, ${100 + ((xEnd * 1) % 255)}, 100)`;
  drawLineXForwards(tStartPoint, 0, xEnd, tColour);
  drawLineYForwards(tStartPoint, 0, yEnd, tColour);
  xEnd++;
  xEnd++;
  if (yEnd < tYEndPoint) {
    yEnd++;
  }
}

function animateTStep2() {
  if (xEnd2 < tXEndPoint2) {
    window.requestAnimationFrame(animateTStep2);
  } else {
    animateTStep3();
  }
  drawLineXForwards(tStartPoint, tYEndPoint, xEnd2, tColour);
  drawLineYForwards(tStartPoint, tXEndPoint, yEnd2, tColour);
  xEnd2++;
  xEnd2++;
  if (yEnd2 < tYEndPoint2) {
    yEnd2++;
    yEnd2++;
  }
}

function animateTStep3() {
  if (yEnd3 < tYEndPoint3) {
    window.requestAnimationFrame(animateTStep3);
  } else {
    animateTStep4();
  }

  drawLineYForwards(
    [tStartPoint[0], tStartPoint[1] + tYEndPoint2],
    tXEndPoint2,
    yEnd3,
    tColour
  );
  drawLineXForwards(
    [tStartPoint[0] + tXEndPoint, tStartPoint[1]],
    tYEndPoint2,
    -xEnd3,
    tColour
  );
  yEnd3++;
  yEnd3++;
  if (xEnd3 < tXEndPoint3) {
    xEnd3++;
  }
}

function animateTStep4() {
  if (yEnd4 < tYEndPoint4) {
    window.requestAnimationFrame(animateTStep4);
  } else {
    console.log("done T");
  }
  drawLineXForwards(
    [tStartPoint[0] + tXEndPoint2, tStartPoint[1]],
    tYEndPoint2 + tYEndPoint4,
    xEnd4,
    tColour
  );
  drawLineYForwards(
    [tStartPoint[0], tStartPoint[1] + tYEndPoint],
    tXEndPoint - tXEndPoint2,
    yEnd4,
    tColour
  );
  yEnd4++;
  yEnd4++;
  if (xEnd4 < tXEndPoint4) {
    xEnd4++;
  }
}

function drawLineXForwards(initialCoords, endPoint, variable, colour) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0], initialCoords[1] + endPoint);
  ctx.lineTo(initialCoords[0] + variable, initialCoords[1] + endPoint);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function drawLineYForwards(initialCoords, endPoint, variable, colour) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + endPoint, initialCoords[1]);
  ctx.lineTo(initialCoords[0] + endPoint, initialCoords[1] + variable);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

function fillBackground() {
  ctx.fillStyle = "rgb(200, 100, 100)";
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, width, height);
}
