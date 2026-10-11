export type NormalizedPoint = [number, number];

export interface DeclarativeLineStroke {
  id: string;
  kind: "line";
  from: NormalizedPoint;
  to: NormalizedPoint;
}

export interface DeclarativeArcStroke {
  id: string;
  kind: "arc";
  centre: NormalizedPoint;
  radius: NormalizedPoint;
  startAngle: number;
  endAngle: number;
  anticlockwise?: boolean;
}

export interface DeclarativeBezierStroke {
  id: string;
  kind: "bezier";
  from: NormalizedPoint;
  control1: NormalizedPoint;
  control2: NormalizedPoint;
  to: NormalizedPoint;
}

export type DeclarativeStroke =
  | DeclarativeLineStroke
  | DeclarativeArcStroke
  | DeclarativeBezierStroke;

export interface GlyphPixelContract {
  required: NormalizedPoint[];
  forbidden: NormalizedPoint[];
}

export interface GlyphDefinition {
  colour: string;
  strokes: DeclarativeStroke[];
  pixelContract: GlyphPixelContract;
}

function interpolatePoint(
  from: NormalizedPoint,
  to: NormalizedPoint,
  progress: number,
): NormalizedPoint {
  return [
    from[0] + (to[0] - from[0]) * progress,
    from[1] + (to[1] - from[1]) * progress,
  ];
}

export function getBezierPoint(
  stroke: DeclarativeBezierStroke,
  progress: number,
): NormalizedPoint {
  const inverseProgress = 1 - progress;
  return [
    inverseProgress ** 3 * stroke.from[0] +
      3 * inverseProgress ** 2 * progress * stroke.control1[0] +
      3 * inverseProgress * progress ** 2 * stroke.control2[0] +
      progress ** 3 * stroke.to[0],
    inverseProgress ** 3 * stroke.from[1] +
      3 * inverseProgress ** 2 * progress * stroke.control1[1] +
      3 * inverseProgress * progress ** 2 * stroke.control2[1] +
      progress ** 3 * stroke.to[1],
  ];
}

export function getPartialBezier(
  stroke: DeclarativeBezierStroke,
  progress: number,
): DeclarativeBezierStroke {
  const firstLevel1 = interpolatePoint(
    stroke.from,
    stroke.control1,
    progress,
  );
  const firstLevel2 = interpolatePoint(
    stroke.control1,
    stroke.control2,
    progress,
  );
  const firstLevel3 = interpolatePoint(
    stroke.control2,
    stroke.to,
    progress,
  );
  const secondLevel1 = interpolatePoint(
    firstLevel1,
    firstLevel2,
    progress,
  );
  const secondLevel2 = interpolatePoint(
    firstLevel2,
    firstLevel3,
    progress,
  );

  return {
    id: stroke.id,
    kind: "bezier",
    from: stroke.from,
    control1: firstLevel1,
    control2: secondLevel1,
    to: interpolatePoint(secondLevel1, secondLevel2, progress),
  };
}

const eContour: NormalizedPoint[] = [
  [1, 0],
  [0, 0],
  [0, 1],
  [1, 1],
  [1, 0.72],
  [0.35, 0.72],
  [0.35, 0.6],
  [1, 0.6],
  [1, 0.4],
  [0.35, 0.4],
  [0.35, 0.28],
  [1, 0.28],
  [1, 0],
];

export const eDefinition: GlyphDefinition = {
  colour: "rgb(210, 120, 30)",
  strokes: eContour.slice(0, -1).map((from, index) => ({
    id: `e-contour-${index + 1}`,
    kind: "line",
    from,
    to: eContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.5, 0],
      [0.65, 0.28],
      [0.6, 0.4],
      [1, 0.5],
      [0.6, 0.6],
      [0.65, 0.72],
      [0.5, 1],
    ],
    forbidden: [
      [0.7, 0.34],
      [0.7, 0.66],
    ],
  },
};
