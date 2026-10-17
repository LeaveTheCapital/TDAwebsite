export const canvasScale = 2;

export function setCanvasResolution(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  canvas.width = Math.ceil(width * canvasScale);
  canvas.height = Math.ceil(height * canvasScale);
  context.setTransform(canvasScale, 0, 0, canvasScale, 0, 0);
}

export function getCanvasImageData(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const left = Math.floor(x * canvasScale);
  const top = Math.floor(y * canvasScale);
  return context.getImageData(
    left,
    top,
    Math.max(1, Math.ceil((x + width) * canvasScale) - left),
    Math.max(1, Math.ceil((y + height) * canvasScale) - top),
  );
}

export function putCanvasImageData(
  context: CanvasRenderingContext2D,
  image: ImageData,
  x: number,
  y: number,
) {
  context.putImageData(image, Math.floor(x * canvasScale), Math.floor(y * canvasScale));
}
