import "../main.css";
import { canvasScale, setCanvasResolution } from "./canvas-resolution.ts";

const canvasWidth = (canvas: HTMLCanvasElement) => canvas.width / canvasScale;
const canvasHeight = (canvas: HTMLCanvasElement) => canvas.height / canvasScale;

const canvases = document.getElementsByClassName(
  "border-canvas",
) as HTMLCollectionOf<HTMLCanvasElement>;

const boxes = document.getElementsByClassName(
  "curve",
) as HTMLCollectionOf<HTMLElement>;
const absolutes = document.getElementsByClassName(
  "absolute",
) as HTMLCollectionOf<HTMLElement>;

const vw = Math.max(
  document.documentElement.clientWidth || 0,
  window.innerWidth || 0
);

for (let i = 0; i < absolutes.length; i++) {
  boxes[i].style.width = `${Math.floor(vw / 4)}px`;
}

for (let i = 0; i < absolutes.length; i++) {
  const heightHere = absolutes[i].offsetHeight;
  boxes[i].style.height = `${heightHere}px`;
}

for (let i = 0; i < absolutes.length; i++) {
  setCanvasResolution(
    canvases[i],
    getCanvasContext(canvases[i]),
    Math.floor(vw / 4),
    absolutes[i].offsetHeight,
  );
}

let alreadyAnimated = canvases.length;

let id = 0;

for (let i = 0; i < boxes.length; i++) {
  boxes[i].addEventListener("mouseenter", function () {
    id++;
    const prevAlreadyAnimated = alreadyAnimated;
    alreadyAnimated = i;
    animateBorders(i + 1, prevAlreadyAnimated || 1, id);
  });
}

animateBorders(canvases.length, 0, id);

function animateBorders(end: number, start = 0, identity = 0) {
  const done: Record<number, boolean> = { "-1": true };
  done[start - 1] = true;

  clearAll();
  function clearAll() {
    for (let j = alreadyAnimated + 1 || start; j < canvases.length; j++) {
      const c = canvases[j];
      const clearingContext = getCanvasContext(c);
      clearingContext.clearRect(0, 0, canvasWidth(c), canvasHeight(c));
    }
  }
  if (start > 0 && end > start) {
    for (let k = 0; k < start; k++) {
      const cvs = canvases[k];
      const drawingContext = getCanvasContext(cvs);
      const dun: Record<number, boolean> = {};
      dun[k - 1] = true;
      drawBorderLines(
        drawingContext,
        cvs,
        canvasWidth(cvs),
        canvasHeight(cvs),
        canvasWidth(cvs),
        k,
        dun
      );
    }
  }

  for (let i = start; i < end; i++) {
    let iteratorTop = 0;
    let iteratorSide = 0;
    let iteratorBottom = 0;
    done[i] = false;
    const canvas = canvases[i];
    const steps = 12;
    const heightSteps = steps * (canvasHeight(canvas) / canvasWidth(canvas));

    const ctx = getCanvasContext(canvas);

    window.requestAnimationFrame(animateBorder);

    function animateBorder() {
      if (identity < id) {
        clearAll();
        return;
      }
      if (iteratorBottom < canvasWidth(canvas)) {
        window.requestAnimationFrame(animateBorder);
      } else {
        console.log("done");
      }
      if (done[i - 1]) {
        if (iteratorTop >= canvasWidth(canvas)) {
          if (iteratorSide >= canvasHeight(canvas) && iteratorBottom < canvasWidth(canvas)) {
            iteratorBottom += canvasWidth(canvas) / steps;
            if (Math.abs(iteratorBottom - canvasWidth(canvas)) < 0.1) {
              iteratorBottom = canvasWidth(canvas);
            }
          }
          if (iteratorSide < canvasHeight(canvas)) {
            iteratorSide += canvasHeight(canvas) / heightSteps;
            if (
              Math.abs(iteratorSide - canvasHeight(canvas)) < 0.1 ||
              iteratorSide > canvasHeight(canvas)
            ) {
              iteratorSide = canvasHeight(canvas);
            }
          }
        }
        if (iteratorTop < canvasWidth(canvas)) {
          iteratorTop += canvasWidth(canvas) / steps;
          if (Math.abs(iteratorTop - canvasWidth(canvas)) < 0.1) {
            iteratorTop = canvasWidth(canvas);
          }
        }
        if (i !== 0) {
          iteratorTop = canvasWidth(canvas);
        }

        drawBorderLines(
          ctx,
          canvas,
          iteratorTop,
          iteratorSide,
          iteratorBottom,
          i,
          done
        );
      }
    }
  }
}

function drawBorderLines(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  iteratorTop: number,
  iteratorSide: number,
  iteratorBottom: number,
  i: number,
  done: Record<number, boolean>,
) {
  const colour = `hsl(${
    i * (360 / canvases.length) + 30
  }, 100%, 50%)`;
  console.log({ colour });
  const leftOrRight = i % 2 === 0 ? canvasWidth(canvas) : 0;
  const rightOrLeft = i % 2 === 1 ? canvasWidth(canvas) : 0;

  const isLeftBorder = i % 2 === 1;

  ctx.beginPath();

  ctx.moveTo(rightOrLeft, 0);
  if (i === 0) {
    ctx.lineTo(isLeftBorder ? canvasWidth(canvas) - iteratorTop : iteratorTop, 0);
    ctx.lineTo(isLeftBorder ? canvasWidth(canvas) - iteratorTop : iteratorTop, 0);
  } else {
    ctx.moveTo(isLeftBorder ? canvasWidth(canvas) - iteratorTop : iteratorTop, 0);
  }

  if (iteratorTop === canvasWidth(canvas)) {
    ctx.lineTo(leftOrRight, iteratorSide);
    ctx.lineTo(leftOrRight, iteratorSide);
    if (iteratorSide === canvasHeight(canvas)) {
      ctx.lineTo(
        isLeftBorder ? iteratorBottom : canvasWidth(canvas) - iteratorBottom,
        canvasHeight(canvas)
      );
      ctx.lineTo(
        isLeftBorder ? iteratorBottom : canvasWidth(canvas) - iteratorBottom,
        canvasHeight(canvas)
      );
    }
    if (iteratorBottom === canvasWidth(canvas)) {
      done[i] = true;
    }
  }

  const getColour = (step: number) =>
    `hsl(${i * (360 / canvases.length) + step}, 100%, 50%)`;
  const grad = ctx.createLinearGradient(
    canvasWidth(canvas) / 2,
    0,
    (canvasWidth(canvas) * 3) / 6,
    canvasHeight(canvas)
  );
  grad.addColorStop(0, getColour(20));
  grad.addColorStop(1, getColour(90));

  ctx.strokeStyle = grad;
  ctx.stroke();
  ctx.stroke();
}

const personal = document.querySelector<HTMLElement>("#personal-circle");

if (!personal) {
  throw new Error("The personal projects control is missing.");
}
personal.addEventListener("click", () => {
  animatePersonalProjects();
});

function animatePersonalProjects() {
  const canvas = document.querySelector<HTMLCanvasElement>("#personal-canvas");

  if (!canvas) {
    throw new Error("The personal projects canvas is missing.");
  }

  const ctx = getCanvasContext(canvas);
  const { width, height } = canvas.getBoundingClientRect();
  setCanvasResolution(canvas, ctx, width, height);

  let x = 0;
  let y = 0;

  window.requestAnimationFrame(drawPersonalLines);

  function drawPersonalLines() {
    if (x < width) {
      window.requestAnimationFrame(drawPersonalLines);
    } else {
      console.log("done lines");
      const personalImages = document.getElementsByClassName(
        "personal-image",
      ) as HTMLCollectionOf<HTMLElement>;
      for (let i = 0; i < 2; i++) {
        personalImages[i].style.display = "inline-block";
      }
    }

    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(x, height / 2 + y);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(x, height / 2 - y);

    ctx.strokeStyle = "white";
    ctx.stroke();
    x += 4;
    y += 2;
  }
}

function getCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("This browser does not support the 2D canvas API.");
  }

  return context;
}
