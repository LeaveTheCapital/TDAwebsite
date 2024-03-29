const canvases = document.getElementsByClassName("border-canvas");

const boxes = document.getElementsByClassName("curve");
const absolutes = document.getElementsByClassName("absolute");

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
  const canvasWidth = Math.floor(vw / 4);
  const canvasHeight = absolutes[i].offsetHeight;
  canvases[i].width = canvasWidth;
  canvases[i].height = canvasHeight;
}

let alreadyAnimated = canvases.length;

let id = 0;

for (let i = 0; i < boxes.length; i++) {
  boxes[i].addEventListener("mouseenter", function () {
    id++;
    let prevAlreadyAnimated = alreadyAnimated;
    alreadyAnimated = i;
    animateBorders(i + 1, prevAlreadyAnimated || 1, id);
  });
}

animateBorders(canvases.length, 0, id);

function animateBorders(end, start = 0, identity = 0) {
  const done = { "-1": true };
  done[start - 1] = true;

  clearAll();
  function clearAll() {
    for (let j = alreadyAnimated + 1 || start; j < canvases.length; j++) {
      const c = canvases[j];
      const clearingContext = c.getContext("2d");
      clearingContext.clearRect(0, 0, c.width, c.height);
    }
  }
  if (start > 0 && end > start) {
    for (let k = 0; k < start; k++) {
      const cvs = canvases[k];
      const drawingContext = cvs.getContext("2d");
      const dun = {};
      dun[k - 1] = true;
      drawBorderLines(
        drawingContext,
        cvs,
        cvs.width,
        cvs.height,
        cvs.width,
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
    const heightSteps = steps * (canvas.height / canvas.width);

    const ctx = canvas.getContext("2d");

    window.requestAnimationFrame(animateBorder);

    function animateBorder() {
      if (identity < id) {
        clearAll();
        return;
      }
      if (iteratorBottom < canvas.width) {
        window.requestAnimationFrame(animateBorder);
      } else {
        console.log("done");
      }
      if (done[i - 1]) {
        if (iteratorTop >= canvas.width) {
          if (iteratorSide >= canvas.height && iteratorBottom < canvas.width) {
            iteratorBottom += canvas.width / steps;
            if (Math.abs(iteratorBottom - canvas.width) < 0.1) {
              iteratorBottom = canvas.width;
            }
          }
          if (iteratorSide < canvas.height) {
            iteratorSide += canvas.height / heightSteps;
            if (
              Math.abs(iteratorSide - canvas.height) < 0.1 ||
              iteratorSide > canvas.height
            ) {
              iteratorSide = canvas.height;
            }
          }
        }
        if (iteratorTop < canvas.width) {
          iteratorTop += canvas.width / steps;
          if (Math.abs(iteratorTop - canvas.width) < 0.1) {
            iteratorTop = canvas.width;
          }
        }
        if (i !== 0) {
          iteratorTop = canvas.width;
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
  ctx,
  canvas,
  iteratorTop,
  iteratorSide,
  iteratorBottom,
  i,
  done
) {
  const colour = `hsl(${
    i * (360 / canvases.length) + 30
  }, ${`100%`}, ${`50%`})`;
  console.log({ colour });
  const leftOrRight = i % 2 === 0 ? canvas.width : 0;
  const rightOrLeft = i % 2 === 1 ? canvas.width : 0;

  const isLeftBorder = i % 2 === 1;

  ctx.beginPath();

  ctx.moveTo(rightOrLeft, 0);
  if (i === 0) {
    ctx.lineTo(isLeftBorder ? canvas.width - iteratorTop : iteratorTop, 0);
    ctx.lineTo(isLeftBorder ? canvas.width - iteratorTop : iteratorTop, 0);
  } else {
    ctx.moveTo(isLeftBorder ? canvas.width - iteratorTop : iteratorTop, 0);
  }

  if (iteratorTop === canvas.width) {
    ctx.lineTo(leftOrRight, iteratorSide);
    ctx.lineTo(leftOrRight, iteratorSide);
    if (iteratorSide === canvas.height) {
      ctx.lineTo(
        isLeftBorder ? iteratorBottom : canvas.width - iteratorBottom,
        canvas.height
      );
      ctx.lineTo(
        isLeftBorder ? iteratorBottom : canvas.width - iteratorBottom,
        canvas.height
      );
    }
    if (iteratorBottom === canvas.width) {
      done[i] = true;
    }
  }

  // ctx.strokeStyle = colour;
  const getColour = (step) =>
    `hsl(${i * (360 / canvases.length) + step}, ${`100%`}, ${`50%`})`;
  // const grad = ctx.createLinearGradient(
  //   canvas.width / 2,
  //   0,
  //   canvas.width / 2,
  //   canvas.height
  // );
  const grad = ctx.createLinearGradient(
    canvas.width / 2,
    0,
    (canvas.width * 3) / 6,
    canvas.height
  );
  grad.addColorStop(0, getColour(20));
  // grad.addColorStop(0.5, getColour(45));
  grad.addColorStop(1, getColour(90));

  ctx.strokeStyle = grad;
  ctx.stroke();
  ctx.stroke();
}

const personal = document.getElementById("personal-circle");
personal.addEventListener("click", () => {
  animatePersonalProjects();
});

function animatePersonalProjects() {
  const canvas = document.getElementById("personal-canvas");
  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;

  let x = 0;
  let y = 0;

  window.requestAnimationFrame(drawPersonalLines);

  function drawPersonalLines() {
    if (x < width) {
      window.requestAnimationFrame(drawPersonalLines);
    } else {
      console.log("done lines");
      const personalImages = document.getElementsByClassName("personal-image");
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
