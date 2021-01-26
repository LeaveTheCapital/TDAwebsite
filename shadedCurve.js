// this code accidentally makes a cross-shaded curve

const canvases = document.getElementsByTagName("canvas");
const width = canvases[0].width;
const height = canvases[0].height;
const done = { "-1": true };

const steps = 100;
const heightSteps = steps * (height / width);

for (let i = 0; i < canvases.length; i++) {
  let iteratorTop = 0;
  let iteratorSide = 0;
  let iteratorBottom = 0;
  done[i] = false;
  const canvas = canvases[i];

  const ctx = canvas.getContext("2d");

  window.requestAnimationFrame(animateBorder);

  function animateBorder() {
    if (iteratorBottom <= width) {
      window.requestAnimationFrame(animateBorder);
    } else {
      console.log("done");
    }
    if (done[i - 1]) {
      const colour = `hsl(${i * 30}, ${`100%`}, ${`50%`})`;
      const leftOrRight = i % 2 === 0 ? width : 0;
      const rightOrLeft = i % 2 === 1 ? width : 0;

      const isLeftBorder = i % 2 === 1;

      if (iteratorBottom < width) {
        iteratorBottom += width / steps;
      }
      if (iteratorSide < height) {
        iteratorSide += height / heightSteps;
      }
      if (iteratorTop < width) {
        iteratorTop += width / steps;
      }

      ctx.beginPath();

      ctx.moveTo(rightOrLeft, 0);
      if (i === 0) {
        ctx.lineTo(isLeftBorder ? width - iteratorTop : iteratorTop, 0);
      } else {
        iteratorTop = width;
        ctx.moveTo(isLeftBorder ? width - iteratorTop : iteratorTop, 0);
      }

      if (iteratorTop === width) {
        ctx.lineTo(leftOrRight, iteratorSide);

        ctx.lineTo(
          isLeftBorder ? iteratorBottom : width - iteratorBottom,
          height
        );
        if (iteratorBottom === width) {
          done[i] = true;
        }
      }

      ctx.strokeStyle = colour;
      ctx.stroke();
    }
  }
}
