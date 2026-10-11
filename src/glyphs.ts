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

export const cDefinition: GlyphDefinition = {
  colour: "rgb(40, 100, 220)",
  strokes: [
    {
      id: "c-outer-curve",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.5, 0.5],
      startAngle: -Math.PI / 4,
      endAngle: (-7 * Math.PI) / 4,
      anticlockwise: true,
    },
    {
      id: "c-lower-terminal-cap",
      kind: "line",
      from: [0.85, 0.85],
      to: [0.73, 0.73],
    },
    {
      id: "c-inner-curve",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.32, 0.32],
      startAngle: Math.PI / 4,
      endAngle: (7 * Math.PI) / 4,
    },
    {
      id: "c-upper-terminal-cap",
      kind: "line",
      from: [0.73, 0.27],
      to: [0.85, 0.15],
    },
  ],
  pixelContract: {
    required: [
      [0.85, 0.15],
      [0.5, 0],
      [0, 0.5],
      [0.5, 1],
      [0.85, 0.85],
      [0.73, 0.73],
      [0.18, 0.5],
      [0.73, 0.27],
    ],
    forbidden: [
      [0.5, 0.5],
      [0.9, 0.5],
    ],
  },
};

export const sDefinition: GlyphDefinition = {
  colour: "rgb(190, 50, 170)",
  strokes: [
    {
      id: "s-outer-top",
      kind: "bezier",
      from: [0.92, 0.18],
      control1: [0.8, 0.05],
      control2: [0.66, 0],
      to: [0.48, 0],
    },
    {
      id: "s-outer-upper-left",
      kind: "bezier",
      from: [0.48, 0],
      control1: [0.18, 0],
      control2: [0.03, 0.15],
      to: [0.03, 0.35],
    },
    {
      id: "s-outer-centre-left",
      kind: "bezier",
      from: [0.03, 0.35],
      control1: [0.03, 0.48],
      control2: [0.16, 0.55],
      to: [0.48, 0.59],
    },
    {
      id: "s-inner-lower-right",
      kind: "bezier",
      from: [0.48, 0.59],
      control1: [0.67, 0.63],
      control2: [0.79, 0.68],
      to: [0.79, 0.75],
    },
    {
      id: "s-inner-bottom",
      kind: "bezier",
      from: [0.79, 0.75],
      control1: [0.79, 0.8],
      control2: [0.68, 0.82],
      to: [0.51, 0.82],
    },
    {
      id: "s-lower-left-terminal",
      kind: "bezier",
      from: [0.51, 0.82],
      control1: [0.34, 0.82],
      control2: [0.24, 0.76],
      to: [0.15, 0.65],
    },
    {
      id: "s-lower-terminal-cap",
      kind: "line",
      from: [0.15, 0.65],
      to: [0, 0.85],
    },
    {
      id: "s-outer-bottom",
      kind: "bezier",
      from: [0, 0.85],
      control1: [0.13, 1],
      control2: [0.3, 1],
      to: [0.51, 1],
    },
    {
      id: "s-outer-lower-right",
      kind: "bezier",
      from: [0.51, 1],
      control1: [0.82, 1],
      control2: [0.97, 0.84],
      to: [0.97, 0.66],
    },
    {
      id: "s-outer-centre-right",
      kind: "bezier",
      from: [0.97, 0.66],
      control1: [0.97, 0.52],
      control2: [0.84, 0.45],
      to: [0.52, 0.41],
    },
    {
      id: "s-inner-upper-left",
      kind: "bezier",
      from: [0.52, 0.41],
      control1: [0.33, 0.37],
      control2: [0.21, 0.31],
      to: [0.21, 0.25],
    },
    {
      id: "s-inner-top",
      kind: "bezier",
      from: [0.21, 0.25],
      control1: [0.21, 0.2],
      control2: [0.33, 0.18],
      to: [0.48, 0.18],
    },
    {
      id: "s-inner-upper-right",
      kind: "bezier",
      from: [0.48, 0.18],
      control1: [0.62, 0.18],
      control2: [0.7, 0.23],
      to: [0.78, 0.34],
    },
    {
      id: "s-upper-terminal-cap",
      kind: "line",
      from: [0.78, 0.34],
      to: [0.92, 0.18],
    },
  ],
  pixelContract: {
    required: [
      [0.92, 0.18],
      [0.03, 0.35],
      [0.48, 0.59],
      [0.15, 0.65],
      [0.51, 1],
      [0.97, 0.66],
      [0.52, 0.41],
      [0.48, 0.18],
    ],
    forbidden: [
      [0.5, 0.28],
      [0.5, 0.5],
      [0.5, 0.86],
    ],
  },
};
