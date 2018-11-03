let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

console.log("linewidth", ctx.lineWidth);

width = canvas.width = window.innerWidth / 3.1;
height = canvas.height = width * 0.4;

const velocity = 0.6 || width / 250;

const letterHeight = height * 0.53;

ctx.lineWidth = 2;
ctx.shadowBlur = 0;
ctx.shadowColor = "white";

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
// was letterHeight / 2
const aStartCoordsFinal = [tStartPoint[0], height * 0.225 + letterHeight / 2.5];

aXEndPointFinal = width * 0.65;

// vars for lightShow

const lightShowStartCoords = [width * 0.1, height * 0.1];
let xEndLightShow = 0;
let yEndLightShow = 0;

const lightShowVelocity = 3 || width / 300;

function cloneCanvas(oldCanvas) {
  //create a new canvas
  var newCanvas = document.createElement("canvas");
  var context = newCanvas.getContext("2d");

  //set dimensions
  newCanvas.width = oldCanvas.width;
  newCanvas.height = oldCanvas.height;

  //apply the old canvas to the new one
  context.drawImage(oldCanvas, 0, 0);

  //return the new canvas
  return newCanvas;
}

let newCanvas = document.getElementById("new-canvas");
newCanvas.width = canvas.width;
newCanvas.height = canvas.height;
newCanvas.style = canvas.style;
let ctx2 = newCanvas.getContext("2d");

let canvas3 = document.getElementById("third-canvas");
canvas3.width = canvas.width;
canvas3.height = canvas.height;
canvas3.style = canvas.style;
let ctx3 = canvas3.getContext("2d");

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
var lightShowImage;

function drawLineYDiagonal(initialCoords, endCoords, variable, colour) {
  ctx.beginPath();
  ctx.moveTo(initialCoords[0] + variable, initialCoords[1]);
  ctx.lineTo(endCoords[0], endCoords[1]);
  ctx.strokeStyle = colour;
  ctx.stroke();
}

let xToggle = 0;
let yToggle = 0;

var count = 0;
function lightShow() {
  if (count < 300) {
    requestAnimationFrame(lightShow);
    console.log("would be animating");
  } else {
    ctx.putImageData(finalImage, 0, 0);

    ctx2.drawImage(canvas, 0, 0);

    console.log("finished");
  }
  count++;
  ctx.putImageData(finalImage, 0, 0);
  ctx.beginPath();
  ctx.arc(
    lightShowStartCoords[0] + xEndLightShow,
    lightShowStartCoords[1] + yEndLightShow,
    Math.abs(xEndLightShow) / 3,
    0,
    2 * Math.PI
  );
  ctx.fillStyle = "pink";
  ctx.fill();

  ctx.strokeStyle = "pink";

  if (xEndLightShow >= width * 0.8 || xEndLightShow < 0) {
    xToggle = !xToggle ? 1 : 0;
  }

  if (yEndLightShow >= height * 0.7 || yEndLightShow < 0) {
    yToggle = !yToggle ? 1 : 0;
  }

  xEndLightShow = !xToggle
    ? xEndLightShow + lightShowVelocity
    : xEndLightShow - lightShowVelocity;
  yEndLightShow = !yToggle
    ? yEndLightShow + 0.2 * lightShowVelocity
    : yEndLightShow - 0.2 * lightShowVelocity;
}

function animateAFinal() {
  if (aXEndFinal < aXEndPointFinal) {
    requestAnimationFrame(animateAFinal);

    ctx.putImageData(finalImage, 0, 0);
    finalImage = ctx.getImageData(0, 0, width, height);
    ctx.globalCompositeOperation = "source-over";

    // horiz A lines

    ctx.beginPath();
    ctx.moveTo(aStartCoords[0], aStartCoords[1] + letterHeight);
    ctx.lineTo(
      aStartCoords[0] + letterHeight / 6,
      aStartCoords[1] + letterHeight
    );
    //diag A Line
    ctx.lineTo(
      aStartCoords[0] + aXEndPoint,
      aStartCoords[1] + 0.5 * letterHeight
    );
    ctx.strokeStyle = otherAColour;
    ctx.stroke();

    // horiz A line -

    ctx.beginPath();
    ctx.moveTo(
      aStartCoords[0] + 2 * aXEndPoint,
      aStartCoords[1] + letterHeight
    );
    ctx.lineTo(
      aStartCoords[0] + 2 * aXEndPoint - letterHeight / 6,
      aStartCoords[1] + letterHeight
    );
    //diag A line -
    ctx.lineTo(
      aStartCoords[0] + aXEndPoint,
      aStartCoords[1] + 0.5 * letterHeight
    );
    ctx.strokeStyle = otherAColour;
    ctx.strokeStyle = otherAColour;
    ctx.stroke();

    // A cross line
    // ctx.globalCompositeOperation = "difference";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(aStartCoordsFinal[0] + aXEndFinal / 1.35, aStartCoordsFinal[1]);
    ctx.lineTo(aStartCoordsFinal[0] + aXEndFinal, aStartCoordsFinal[1]);
    ctx.lineTo(
      aStartCoordsFinal[0] + aXEndFinal,
      aStartCoordsFinal[1] + letterHeight / 7
    );
    ctx.lineTo(
      aStartCoordsFinal[0] + aXEndFinal / 1.35,
      aStartCoordsFinal[1] + letterHeight / 7
    );
    ctx.lineTo(aStartCoordsFinal[0] + aXEndFinal / 1.35, aStartCoordsFinal[1]);

    ctx.strokeStyle = "yellow";
    ctx.stroke();

    aXEndFinal = aXEndFinal + 7;
  } else {
    console.log("done AFinal");
    ctx2.drawImage(canvas, 0, 0);
    ctx3.drawImage(canvas, 0, 0);

    finalImage = ctx.getImageData(0, 0, width, height);
    ctx.globalCompositeOperation = "destination-in";
    lightShow();
  }
}

var otherAColour = "";

function animateA() {
  if (aXEnd < aXEndPoint) {
    requestAnimationFrame(animateA);
  } else {
    // what's going on here
    ctx2.drawImage(canvas, 0, 0);

    drawLineYDiagonal(aStartCoords, aEndCoords, aXEnd, aColour);
  }
  var aColour = `rgb(${150}, ${10 + ((aXEnd * 1) % 255)}, ${10 +
    ((aXEnd * 2) % 255)})`;
  otherAColour = aColour;
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
    ctx2.drawImage(canvas, 0, 0);

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
  dYEnd = dYEnd + velocity;
  if (dXEnd < Math.PI / 2) {
    dXEnd = dXEnd + 0.03;
  }
}

function animateDStep2() {
  if (dYEnd2 < dYEndPoint2) {
    window.requestAnimationFrame(animateDStep2);
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
    dYEnd2 = dYEnd2 + velocity;
    if (dXEnd2 < Math.PI / 2) {
      dXEnd2 = dXEnd2 + 0.05;
    }
  } else {
    console.log("done D");

    finalImage = ctx.getImageData(0, 0, width, height);
    ctx2.drawImage(canvas, 0, 0);

    animateAFinal();
  }
}

function animateT() {
  if (xEnd < tXEndPoint) {
    window.requestAnimationFrame(animateT);
  } else {
    ctx2.drawImage(canvas, 0, 0);
    animateTStep2();
  }

  tColour = `rgb(${0}, ${100 + ((xEnd * 1) % 255)}, 100)`;
  ctx.shadowColor = tColour;
  drawLineXForwards(tStartPoint, 0, xEnd, tColour);
  drawLineYForwards(tStartPoint, 0, yEnd, tColour);
  xEnd = xEnd + velocity;
  xEnd = xEnd + velocity;
  if (yEnd < tYEndPoint) {
    yEnd = yEnd + velocity;
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
  xEnd2 = xEnd2 + velocity;
  xEnd2 = xEnd2 + velocity;
  if (yEnd2 < tYEndPoint2) {
    yEnd2 = yEnd2 + velocity;
    yEnd2 = yEnd2 + velocity;
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
  yEnd3 = yEnd3 + velocity;
  yEnd3 = yEnd3 + velocity;
  if (xEnd3 < tXEndPoint3) {
    xEnd3 = xEnd3 + velocity;
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
  yEnd4 = yEnd4 + velocity;
  yEnd4 = yEnd4 + velocity;
  if (xEnd4 < tXEndPoint4) {
    xEnd4 = xEnd4 + velocity;
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
