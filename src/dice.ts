type Point3d = [number, number, number];
type Point2d = [number, number];

interface Rotation {
  x: number;
  y: number;
  z: number;
}

interface Face {
  value: number;
  normal: Point3d;
  corners: Point3d[];
  pipPoint: (horizontal: number, vertical: number) => Point3d;
}

const canvas = getCanvas("#dice-canvas");
const context = getCanvasContext(canvas);
const rollButton = getButton("#roll-die");
const result = getOutput("#dice-result");
const luminousGreen = "#39ff14";

const pipPositions: Record<number, Point2d[]> = {
  1: [[0, 0]],
  2: [[-0.45, -0.45], [0.45, 0.45]],
  3: [[-0.45, -0.45], [0, 0], [0.45, 0.45]],
  4: [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]],
  5: [[-0.45, -0.45], [0.45, -0.45], [0, 0], [-0.45, 0.45], [0.45, 0.45]],
  6: [[-0.45, -0.5], [-0.45, 0], [-0.45, 0.5], [0.45, -0.5], [0.45, 0], [0.45, 0.5]],
};

const faces: Face[] = [
  createFace(1, [0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], (x, y) => [x, y, 1]),
  createFace(6, [0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]], (x, y) => [-x, y, -1]),
  createFace(3, [1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]], (x, y) => [1, y, -x]),
  createFace(4, [-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]], (x, y) => [-1, y, x]),
  createFace(2, [0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]], (x, y) => [x, 1, -y]),
  createFace(5, [0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]], (x, y) => [x, -1, y]),
];

const restingRotation: Rotation = { x: -0.48, y: 0.62, z: 0.08 };
let rotation = { ...restingRotation };
let animationFrame: number | undefined;

drawDie(rotation);
rollButton.addEventListener("click", rollDie);

function createFace(
  value: number,
  normal: Point3d,
  corners: Point3d[],
  pipPoint: Face["pipPoint"],
): Face {
  return { value, normal, corners, pipPoint };
}

function rollDie() {
  if (animationFrame !== undefined) {
    return;
  }

  const value = Math.floor(Math.random() * 6) + 1;
  const finalRotation = rotationForValue(value);
  const startRotation = { ...rotation };
  const turns = 4;
  const targetRotation = {
    x: finalRotation.x + Math.PI * 2 * turns,
    y: finalRotation.y + Math.PI * 2 * (turns + 1),
    z: finalRotation.z + Math.PI * 2 * turns,
  };
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1800;
  const startTime = performance.now();

  rollButton.dataset.rolling = "true";
  rollButton.setAttribute("aria-label", "Rolling the die");
  result.value = "Rolling…";

  const animate = (now: number) => {
    const progress = duration === 0 ? 1 : Math.min((now - startTime) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 5);

    rotation = interpolateRotation(startRotation, targetRotation, easedProgress);
    drawDie(rotation);

    if (progress < 1) {
      animationFrame = window.requestAnimationFrame(animate);
      return;
    }

    rotation = finalRotation;
    animationFrame = undefined;
    rollButton.dataset.rolling = "false";
    rollButton.dataset.value = String(value);
    rollButton.setAttribute("aria-label", `Roll again. Current result: ${value}`);
    result.value = `You rolled ${value}`;
    drawDie(rotation);
  };

  animationFrame = window.requestAnimationFrame(animate);
}

function rotationForValue(value: number): Rotation {
  const rotations: Record<number, Rotation> = {
    1: { x: 0, y: 0, z: 0 },
    2: { x: Math.PI / 2, y: 0, z: 0 },
    3: { x: 0, y: -Math.PI / 2, z: 0 },
    4: { x: 0, y: Math.PI / 2, z: 0 },
    5: { x: -Math.PI / 2, y: 0, z: 0 },
    6: { x: 0, y: Math.PI, z: 0 },
  };

  return rotations[value] ?? rotations[1];
}

function interpolateRotation(start: Rotation, end: Rotation, progress: number): Rotation {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
    z: start.z + (end.z - start.z) * progress,
  };
}

function drawDie(currentRotation: Rotation) {
  const size = canvas.width;
  const centre = size / 2;
  const scale = size * 0.3;
  const transformedFaces = faces
    .map((face) => ({
      face,
      normal: rotate(face.normal, currentRotation),
      corners: face.corners.map((corner) => rotate(corner, currentRotation)),
    }))
    .sort((a, b) => averageDepth(a.corners) - averageDepth(b.corners));

  context.clearRect(0, 0, size, size);
  context.fillStyle = "black";
  context.fillRect(0, 0, size, size);
  context.lineJoin = "round";
  context.lineCap = "round";

  for (const transformedFace of transformedFaces) {
    if (transformedFace.normal[2] <= 0) {
      continue;
    }

    const projectedCorners = transformedFace.corners.map((point) => project(point, centre, scale));
    context.beginPath();
    context.moveTo(projectedCorners[0][0], projectedCorners[0][1]);
    for (const point of projectedCorners.slice(1)) {
      context.lineTo(point[0], point[1]);
    }
    context.closePath();
    context.fillStyle = "black";
    context.fill();
    context.strokeStyle = luminousGreen;
    context.lineWidth = 3;
    context.stroke();

    for (const [horizontal, vertical] of pipPositions[transformedFace.face.value]) {
      const pipRadius = 0.11;
      const pipSegments = 20;
      context.beginPath();

      for (let segment = 0; segment <= pipSegments; segment += 1) {
        const angle = (segment / pipSegments) * Math.PI * 2;
        const pipPoint = transformedFace.face.pipPoint(
          horizontal + Math.cos(angle) * pipRadius,
          vertical + Math.sin(angle) * pipRadius,
        );
        const [x, y] = project(rotate(pipPoint, currentRotation), centre, scale);

        if (segment === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.closePath();
      context.fillStyle = luminousGreen;
      context.fill();
    }
  }
}

function rotate([x, y, z]: Point3d, angles: Rotation): Point3d {
  const cosX = Math.cos(angles.x);
  const sinX = Math.sin(angles.x);
  const cosY = Math.cos(angles.y);
  const sinY = Math.sin(angles.y);
  const cosZ = Math.cos(angles.z);
  const sinZ = Math.sin(angles.z);
  const afterX: Point3d = [x, y * cosX - z * sinX, y * sinX + z * cosX];
  const afterY: Point3d = [afterX[0] * cosY + afterX[2] * sinY, afterX[1], -afterX[0] * sinY + afterX[2] * cosY];

  return [afterY[0] * cosZ - afterY[1] * sinZ, afterY[0] * sinZ + afterY[1] * cosZ, afterY[2]];
}

function project([x, y, z]: Point3d, centre: number, scale: number): Point2d {
  const perspective = 4.5 / (4.5 - z);
  return [centre + x * scale * perspective, centre + y * scale * perspective];
}

function averageDepth(points: Point3d[]): number {
  return points.reduce((total, point) => total + point[2], 0) / points.length;
}

function getCanvas(selector: string): HTMLCanvasElement {
  const element = document.querySelector<HTMLCanvasElement>(selector);

  if (!element) {
    throw new Error(`The element "${selector}" is missing.`);
  }

  return element;
}

function getCanvasContext(element: HTMLCanvasElement): CanvasRenderingContext2D {
  const drawingContext = element.getContext("2d");

  if (!drawingContext) {
    throw new Error("This browser does not support the 2D canvas API.");
  }

  return drawingContext;
}

function getButton(selector: string): HTMLButtonElement {
  const element = document.querySelector<HTMLButtonElement>(selector);

  if (!element) {
    throw new Error(`The element "${selector}" is missing.`);
  }

  return element;
}

function getOutput(selector: string): HTMLOutputElement {
  const element = document.querySelector<HTMLOutputElement>(selector);

  if (!element) {
    throw new Error(`The element "${selector}" is missing.`);
  }

  return element;
}
