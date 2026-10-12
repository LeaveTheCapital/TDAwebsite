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

const aOuterContour: NormalizedPoint[] = [
  [0.4, 0],
  [0, 1],
  [0.24, 1],
  [0.36, 0.62],
  [0.64, 0.62],
  [0.76, 1],
  [1, 1],
  [0.6, 0],
  [0.4, 0],
];
const aCounterContour: NormalizedPoint[] = [
  [0.47, 0.2],
  [0.53, 0.2],
  [0.61, 0.48],
  [0.39, 0.48],
  [0.47, 0.2],
];

export const aDefinition: GlyphDefinition = {
  colour: "rgb(150, 100, 200)",
  strokes: [
    ...createLineContour("a-outer", aOuterContour),
    ...createLineContour("a-counter", aCounterContour),
  ],
  pixelContract: {
    required: [
      [0.4, 0],
      [0.2, 0.5],
      [0, 1],
      [0.24, 1],
      [0.36, 0.62],
      [0.5, 0.62],
      [0.64, 0.62],
      [0.76, 1],
      [1, 1],
      [0.8, 0.5],
      [0.6, 0],
      [0.47, 0.2],
      [0.53, 0.2],
      [0.61, 0.48],
      [0.39, 0.48],
    ],
    forbidden: [
      [0.5, 0.34],
      [0.5, 0.55],
      [0.5, 0.82],
      [0.08, 0.45],
      [0.92, 0.45],
    ],
  },
};

function createLineContour(id: string, points: NormalizedPoint[]) {
  return points.slice(0, -1).map((from, index) => ({
    id: `${id}-${index + 1}`,
    kind: "line" as const,
    from,
    to: points[index + 1],
  }));
}

export const apostropheDefinition: GlyphDefinition = {
  colour: "rgb(235, 190, 80)",
  strokes: [
    {
      id: "apostrophe-serif-top",
      kind: "line",
      from: [0.3, 0.02],
      to: [0.7, 0.02],
    },
    {
      id: "apostrophe-serif-right",
      kind: "line",
      from: [0.7, 0.02],
      to: [0.7, 0.1],
    },
    {
      id: "apostrophe-right-shoulder",
      kind: "line",
      from: [0.7, 0.1],
      to: [0.63, 0.1],
    },
    {
      id: "apostrophe-outer-stem",
      kind: "line",
      from: [0.63, 0.1],
      to: [0.63, 0.22],
    },
    {
      id: "apostrophe-outer-tail",
      kind: "bezier",
      from: [0.63, 0.22],
      control1: [0.63, 0.31],
      control2: [0.55, 0.4],
      to: [0.47, 0.43],
    },
    {
      id: "apostrophe-tail-cap",
      kind: "line",
      from: [0.47, 0.43],
      to: [0.35, 0.38],
    },
    {
      id: "apostrophe-inner-tail",
      kind: "bezier",
      from: [0.35, 0.38],
      control1: [0.43, 0.3],
      control2: [0.45, 0.24],
      to: [0.45, 0.2],
    },
    {
      id: "apostrophe-inner-stem",
      kind: "line",
      from: [0.45, 0.2],
      to: [0.45, 0.1],
    },
    {
      id: "apostrophe-left-shoulder",
      kind: "line",
      from: [0.45, 0.1],
      to: [0.3, 0.1],
    },
    {
      id: "apostrophe-serif-left",
      kind: "line",
      from: [0.3, 0.1],
      to: [0.3, 0.02],
    },
  ],
  pixelContract: {
    required: [
      [0.3, 0.02],
      [0.5, 0.02],
      [0.7, 0.02],
      [0.7, 0.1],
      [0.63, 0.22],
      [0.55, 0.38],
      [0.47, 0.43],
      [0.35, 0.38],
      [0.45, 0.2],
      [0.45, 0.1],
      [0.3, 0.1],
    ],
    forbidden: [
      [0.15, 0.05],
      [0.85, 0.05],
      [0.52, 0.16],
      [0.5, 0.55],
      [0.5, 0.9],
    ],
  },
};

export const zeroOvalWidthScale = 0.75;
const zeroOuterRadiusX = 0.5 * zeroOvalWidthScale;
const zeroInnerRadiusX = 0.32 * zeroOvalWidthScale;

export const zeroDefinition: GlyphDefinition = {
  colour: "rgb(80, 180, 240)",
  strokes: [
    {
      id: "zero-outer-oval",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [zeroOuterRadiusX, 0.5],
      startAngle: -Math.PI / 2,
      endAngle: (3 * Math.PI) / 2,
    },
    {
      id: "zero-inner-oval",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [zeroInnerRadiusX, 0.32],
      startAngle: -Math.PI / 2,
      endAngle: (-5 * Math.PI) / 2,
      anticlockwise: true,
    },
  ],
  pixelContract: {
    required: [
      [0.5, 0],
      [0.5 + zeroOuterRadiusX, 0.5],
      [0.5, 1],
      [0.5 - zeroOuterRadiusX, 0.5],
      [0.5, 0.18],
      [0.5 + zeroInnerRadiusX, 0.5],
      [0.5, 0.82],
      [0.5 - zeroInnerRadiusX, 0.5],
    ],
    forbidden: [
      [0.5, 0.5],
      [0.5, 0.1],
      [0.5 + 0.4 * zeroOvalWidthScale, 0.5],
    ],
  },
};

const oneContour: NormalizedPoint[] = [
  [0.44, 0],
  [0.66, 0],
  [0.66, 1],
  [0.44, 1],
  [0.44, 0.2],
  [0.25, 0.39],
  [0.15, 0.29],
  [0.44, 0],
];

export const oneDefinition: GlyphDefinition = {
  colour: "rgb(230, 160, 50)",
  strokes: oneContour.slice(0, -1).map((from, index) => ({
    id: `one-contour-${index + 1}`,
    kind: "line",
    from,
    to: oneContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0.44, 0],
      [0.55, 0],
      [0.66, 0.5],
      [0.55, 1],
      [0.44, 0.6],
      [0.44, 0.2],
      [0.345, 0.295],
      [0.25, 0.39],
      [0.15, 0.29],
      [0.295, 0.145],
    ],
    forbidden: [
      [0.55, 0.5],
      [0.25, 0.34],
      [0.2, 0.7],
      [0.8, 0.5],
    ],
  },
};

export const twoDefinition: GlyphDefinition = {
  colour: "rgb(70, 190, 130)",
  strokes: [
    {
      id: "two-outer-upper-left",
      kind: "bezier",
      from: [0.08, 0.22],
      control1: [0.16, 0.07],
      control2: [0.28, 0],
      to: [0.45, 0],
    },
    {
      id: "two-outer-upper-right",
      kind: "bezier",
      from: [0.45, 0],
      control1: [0.7, 0],
      control2: [0.92, 0.08],
      to: [0.92, 0.22],
    },
    {
      id: "two-outer-right-turn",
      kind: "bezier",
      from: [0.92, 0.22],
      control1: [0.92, 0.31],
      control2: [0.88, 0.37],
      to: [0.82, 0.42],
    },
    {
      id: "two-outer-diagonal",
      kind: "line",
      from: [0.82, 0.42],
      to: [0.28, 0.78],
    },
    {
      id: "two-bottom-bar-top",
      kind: "line",
      from: [0.28, 0.78],
      to: [1, 0.78],
    },
    {
      id: "two-bottom-bar-right",
      kind: "line",
      from: [1, 0.78],
      to: [1, 1],
    },
    {
      id: "two-bottom-bar-bottom",
      kind: "line",
      from: [1, 1],
      to: [0, 1],
    },
    {
      id: "two-bottom-bar-left",
      kind: "line",
      from: [0, 1],
      to: [0, 0.78],
    },
    {
      id: "two-inner-diagonal",
      kind: "line",
      from: [0, 0.78],
      to: [0.68, 0.34],
    },
    {
      id: "two-inner-upper-right",
      kind: "bezier",
      from: [0.68, 0.34],
      control1: [0.76, 0.29],
      control2: [0.74, 0.18],
      to: [0.56, 0.18],
    },
    {
      id: "two-inner-upper-left",
      kind: "bezier",
      from: [0.56, 0.18],
      control1: [0.39, 0.18],
      control2: [0.3, 0.22],
      to: [0.24, 0.32],
    },
    {
      id: "two-upper-terminal-cap",
      kind: "line",
      from: [0.24, 0.32],
      to: [0.08, 0.22],
    },
  ],
  pixelContract: {
    required: [
      [0.08, 0.22],
      [0.45, 0],
      [0.92, 0.22],
      [0.82, 0.42],
      [0.55, 0.6],
      [0.28, 0.78],
      [1, 0.78],
      [1, 1],
      [0, 1],
      [0, 0.78],
      [0.34, 0.56],
      [0.68, 0.34],
      [0.56, 0.18],
      [0.24, 0.32],
    ],
    forbidden: [
      [0.5, 0.1],
      [0.5, 0.3],
      [0.5, 0.89],
      [0.08, 0.5],
      [0.9, 0.6],
    ],
  },
};

export const bDefinition: GlyphDefinition = {
  colour: "rgb(20, 160, 90)",
  strokes: [
    {
      id: "b-outer-top",
      kind: "line",
      from: [0, 0],
      to: [0.52, 0],
    },
    {
      id: "b-outer-upper-right",
      kind: "bezier",
      from: [0.52, 0],
      control1: [0.82, 0],
      control2: [1, 0.09],
      to: [1, 0.25],
    },
    {
      id: "b-outer-upper-centre",
      kind: "bezier",
      from: [1, 0.25],
      control1: [1, 0.4],
      control2: [0.84, 0.47],
      to: [0.62, 0.49],
    },
    {
      id: "b-outer-lower-centre",
      kind: "bezier",
      from: [0.62, 0.49],
      control1: [0.85, 0.51],
      control2: [1, 0.57],
      to: [1, 0.72],
    },
    {
      id: "b-outer-lower-right",
      kind: "bezier",
      from: [1, 0.72],
      control1: [1, 0.9],
      control2: [0.82, 1],
      to: [0.52, 1],
    },
    {
      id: "b-outer-bottom",
      kind: "line",
      from: [0.52, 1],
      to: [0, 1],
    },
    {
      id: "b-outer-left",
      kind: "line",
      from: [0, 1],
      to: [0, 0],
    },
    {
      id: "b-inner-upper-top",
      kind: "line",
      from: [0.2, 0.18],
      to: [0.5, 0.18],
    },
    {
      id: "b-inner-upper-right",
      kind: "bezier",
      from: [0.5, 0.18],
      control1: [0.68, 0.18],
      control2: [0.78, 0.21],
      to: [0.78, 0.29],
    },
    {
      id: "b-inner-upper-bottom",
      kind: "bezier",
      from: [0.78, 0.29],
      control1: [0.78, 0.37],
      control2: [0.68, 0.4],
      to: [0.5, 0.4],
    },
    {
      id: "b-inner-upper-left",
      kind: "line",
      from: [0.5, 0.4],
      to: [0.2, 0.4],
    },
    {
      id: "b-inner-upper-close",
      kind: "line",
      from: [0.2, 0.4],
      to: [0.2, 0.18],
    },
    {
      id: "b-inner-lower-top",
      kind: "line",
      from: [0.2, 0.59],
      to: [0.52, 0.59],
    },
    {
      id: "b-inner-lower-right",
      kind: "bezier",
      from: [0.52, 0.59],
      control1: [0.7, 0.59],
      control2: [0.79, 0.63],
      to: [0.79, 0.7],
    },
    {
      id: "b-inner-lower-bottom",
      kind: "bezier",
      from: [0.79, 0.7],
      control1: [0.79, 0.78],
      control2: [0.7, 0.82],
      to: [0.52, 0.82],
    },
    {
      id: "b-inner-lower-left",
      kind: "line",
      from: [0.52, 0.82],
      to: [0.2, 0.82],
    },
    {
      id: "b-inner-lower-close",
      kind: "line",
      from: [0.2, 0.82],
      to: [0.2, 0.59],
    },
  ],
  pixelContract: {
    required: [
      [0, 0.5],
      [0.3, 0],
      [1, 0.25],
      [0.62, 0.49],
      [1, 0.72],
      [0.3, 1],
      [0.2, 0.29],
      [0.78, 0.29],
      [0.2, 0.7],
      [0.79, 0.7],
    ],
    forbidden: [
      [0.5, 0.29],
      [0.5, 0.7],
      [0.92, 0.49],
    ],
  },
};

export const threeDefinition: GlyphDefinition = {
  colour: bDefinition.colour,
  strokes: [
    {
      id: "three-outer-top",
      kind: "bezier",
      from: [0.15, 0],
      control1: [0.3, 0],
      control2: [0.42, 0],
      to: [0.55, 0],
    },
    {
      id: "three-outer-upper-right",
      kind: "bezier",
      from: [0.55, 0],
      control1: [0.84, 0],
      control2: [1, 0.09],
      to: [1, 0.25],
    },
    {
      id: "three-outer-upper-centre",
      kind: "bezier",
      from: [1, 0.25],
      control1: [1, 0.4],
      control2: [0.84, 0.47],
      to: [0.65, 0.49],
    },
    {
      id: "three-outer-lower-centre",
      kind: "bezier",
      from: [0.65, 0.49],
      control1: [0.85, 0.51],
      control2: [1, 0.57],
      to: [1, 0.72],
    },
    {
      id: "three-outer-lower-right",
      kind: "bezier",
      from: [1, 0.72],
      control1: [1, 0.9],
      control2: [0.84, 1],
      to: [0.55, 1],
    },
    {
      id: "three-outer-bottom",
      kind: "line",
      from: [0.55, 1],
      to: [0.15, 1],
    },
    {
      id: "three-lower-terminal-cap",
      kind: "line",
      from: [0.15, 1],
      to: [0.25, 0.8],
    },
    {
      id: "three-inner-lower-bottom",
      kind: "line",
      from: [0.25, 0.8],
      to: [0.5, 0.8],
    },
    {
      id: "three-inner-lower-right",
      kind: "bezier",
      from: [0.5, 0.8],
      control1: [0.68, 0.8],
      control2: [0.79, 0.77],
      to: [0.79, 0.7],
    },
    {
      id: "three-inner-lower-top",
      kind: "bezier",
      from: [0.79, 0.7],
      control1: [0.79, 0.63],
      control2: [0.68, 0.59],
      to: [0.5, 0.59],
    },
    {
      id: "three-inner-centre-left",
      kind: "line",
      from: [0.5, 0.59],
      to: [0.33, 0.59],
    },
    {
      id: "three-inner-centre-cap",
      kind: "line",
      from: [0.33, 0.59],
      to: [0.33, 0.4],
    },
    {
      id: "three-inner-upper-bottom",
      kind: "line",
      from: [0.33, 0.4],
      to: [0.5, 0.4],
    },
    {
      id: "three-inner-upper-right",
      kind: "bezier",
      from: [0.5, 0.4],
      control1: [0.68, 0.4],
      control2: [0.78, 0.37],
      to: [0.78, 0.29],
    },
    {
      id: "three-inner-upper-top",
      kind: "bezier",
      from: [0.78, 0.29],
      control1: [0.78, 0.22],
      control2: [0.68, 0.2],
      to: [0.5, 0.2],
    },
    {
      id: "three-inner-top",
      kind: "line",
      from: [0.5, 0.2],
      to: [0.25, 0.2],
    },
    {
      id: "three-upper-terminal-cap",
      kind: "line",
      from: [0.25, 0.2],
      to: [0.15, 0],
    },
  ],
  pixelContract: {
    required: [
      [0.15, 0],
      [0.55, 0],
      [1, 0.25],
      [0.65, 0.49],
      [1, 0.72],
      [0.55, 1],
      [0.15, 1],
      [0.25, 0.8],
      [0.79, 0.7],
      [0.33, 0.59],
      [0.33, 0.4],
      [0.78, 0.29],
      [0.25, 0.2],
    ],
    forbidden: [
      [0, 0.5],
      [0.2, 0.5],
      [0.55, 0.29],
      [0.55, 0.7],
    ],
  },
};

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

const fContour: NormalizedPoint[] = [
  [1, 0],
  [0, 0],
  [0, 1],
  [0.35, 1],
  [0.35, 0.6],
  [1, 0.6],
  [1, 0.4],
  [0.35, 0.4],
  [0.35, 0.28],
  [1, 0.28],
  [1, 0],
];

export const fDefinition: GlyphDefinition = {
  colour: eDefinition.colour,
  strokes: fContour.slice(0, -1).map((from, index) => ({
    id: `f-contour-${index + 1}`,
    kind: "line",
    from,
    to: fContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.5, 0],
      [0.65, 0.28],
      [0.6, 0.4],
      [1, 0.5],
      [0.6, 0.6],
      [0.35, 0.8],
      [0.15, 1],
    ],
    forbidden: [
      [0.7, 0.34],
      [0.7, 0.66],
      [0.7, 1],
    ],
  },
};

const hContour: NormalizedPoint[] = [
  [0, 0],
  [0.3, 0],
  [0.3, 0.4],
  [0.7, 0.4],
  [0.7, 0],
  [1, 0],
  [1, 1],
  [0.7, 1],
  [0.7, 0.6],
  [0.3, 0.6],
  [0.3, 1],
  [0, 1],
  [0, 0],
];

export const hDefinition: GlyphDefinition = {
  colour: "rgb(220, 180, 20)",
  strokes: hContour.slice(0, -1).map((from, index) => ({
    id: `h-contour-${index + 1}`,
    kind: "line",
    from,
    to: hContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.3, 0.2],
      [0.5, 0.4],
      [0.5, 0.6],
      [0.7, 0.2],
      [1, 0.5],
      [0.3, 0.8],
      [0.7, 0.8],
    ],
    forbidden: [
      [0.5, 0.2],
      [0.5, 0.5],
      [0.5, 0.8],
    ],
  },
};

const iBarLeft = 1 / 3;
const iBarRight = 2 / 3;
const iStemLeft = 0.35;
const iStemRight = 0.65;
const iBarThickness = 13 / 45;
const iContour: NormalizedPoint[] = [
  [iBarLeft, 0],
  [iBarRight, 0],
  [iBarRight, iBarThickness],
  [iStemRight, iBarThickness],
  [iStemRight, 1 - iBarThickness],
  [iBarRight, 1 - iBarThickness],
  [iBarRight, 1],
  [iBarLeft, 1],
  [iBarLeft, 1 - iBarThickness],
  [iStemLeft, 1 - iBarThickness],
  [iStemLeft, iBarThickness],
  [iBarLeft, iBarThickness],
  [iBarLeft, 0],
];

export const iDefinition: GlyphDefinition = {
  colour: "rgb(230, 80, 60)",
  strokes: iContour.slice(0, -1).map((from, index) => ({
    id: `i-contour-${index + 1}`,
    kind: "line",
    from,
    to: iContour[index + 1],
  })),
  pixelContract: {
    required: [
      [iBarLeft, 0.15],
      [iBarRight, 0.15],
      [iStemLeft, 0.5],
      [iStemRight, 0.5],
      [iBarLeft, 0.85],
      [iBarRight, 0.85],
      [0.5, 0],
      [0.5, 1],
    ],
    forbidden: [
      [0.2, 0.5],
      [0.5, 0.15],
      [0.5, 0.85],
      [0.8, 0.5],
    ],
  },
};

export const jDefinition: GlyphDefinition = {
  colour: "rgb(80, 190, 230)",
  strokes: [
    {
      id: "j-outer-top",
      kind: "line",
      from: [0.125, 0],
      to: [0.875, 0],
    },
    {
      id: "j-outer-right",
      kind: "line",
      from: [0.875, 0],
      to: [0.875, 13 / 45],
    },
    {
      id: "j-outer-top-bottom",
      kind: "line",
      from: [0.875, 13 / 45],
      to: [0.65, 13 / 45],
    },
    {
      id: "j-outer-stem",
      kind: "line",
      from: [0.65, 13 / 45],
      to: [0.65, 0.6],
    },
    {
      id: "j-outer-hook",
      kind: "arc",
      centre: [0.25, 0.6],
      radius: [0.4, 0.4],
      startAngle: 0,
      endAngle: Math.PI / 2,
    },
    {
      id: "j-outer-bottom",
      kind: "line",
      from: [0.25, 1],
      to: [0.025, 1],
    },
    {
      id: "j-hook-terminal-cap",
      kind: "line",
      from: [0.025, 1],
      to: [0.025, 0.7],
    },
    {
      id: "j-inner-bottom",
      kind: "line",
      from: [0.025, 0.7],
      to: [0.25, 0.7],
    },
    {
      id: "j-inner-hook",
      kind: "arc",
      centre: [0.25, 0.6],
      radius: [0.1, 0.1],
      startAngle: Math.PI / 2,
      endAngle: 0,
      anticlockwise: true,
    },
    {
      id: "j-inner-stem",
      kind: "line",
      from: [0.35, 0.6],
      to: [0.35, 13 / 45],
    },
    {
      id: "j-inner-top",
      kind: "line",
      from: [0.35, 13 / 45],
      to: [0.125, 13 / 45],
    },
    {
      id: "j-top-terminal-cap",
      kind: "line",
      from: [0.125, 13 / 45],
      to: [0.125, 0],
    },
  ],
  pixelContract: {
    required: [
      [0.125, 0.12],
      [0.4, 0],
      [0.7, 0],
      [0.875, 0.14],
      [0.65, 0.45],
      [0.53, 0.88],
      [0.1, 1],
      [0.025, 0.85],
      [0.1, 0.7],
      [0.35, 0.45],
      [0.2, 13 / 45],
    ],
    forbidden: [
      [0.2, 0.5],
      [0.6, 0.5],
      [0.15, 0.85],
      [0.8, 0.5],
    ],
  },
};

const kContour: NormalizedPoint[] = [
  [0, 0],
  [0.25, 0],
  [0.25, 0.38],
  [0.63, 0],
  [1, 0],
  [0.5, 0.5],
  [1, 1],
  [0.63, 1],
  [0.25, 0.62],
  [0.25, 1],
  [0, 1],
  [0, 0],
];

export const kDefinition: GlyphDefinition = {
  colour: "rgb(150, 100, 240)",
  strokes: kContour.slice(0, -1).map((from, index) => ({
    id: `k-contour-${index + 1}`,
    kind: "line",
    from,
    to: kContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.25, 0.2],
      [0.44, 0.19],
      [0.75, 0.25],
      [0.5, 0.5],
      [0.75, 0.75],
      [0.44, 0.81],
      [0.25, 0.8],
    ],
    forbidden: [
      [0.12, 0.5],
      [0.55, 0.25],
      [0.55, 0.75],
      [0.8, 0.5],
    ],
  },
};

const lContour: NormalizedPoint[] = [
  [0, 0],
  [0.3, 0],
  [0.3, 0.72],
  [1, 0.72],
  [1, 1],
  [0, 1],
  [0, 0],
];

export const lDefinition: GlyphDefinition = {
  colour: "rgb(70, 170, 210)",
  strokes: lContour.slice(0, -1).map((from, index) => ({
    id: `l-contour-${index + 1}`,
    kind: "line",
    from,
    to: lContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.3, 0.3],
      [0.3, 0.72],
      [0.65, 0.72],
      [1, 0.86],
      [0.5, 1],
    ],
    forbidden: [
      [0.15, 0.5],
      [0.6, 0.5],
      [0.6, 0.86],
    ],
  },
};

const mContour: NormalizedPoint[] = [
  [0, 0],
  [0, 1],
  [0.22, 1],
  [0.22, 0.42],
  [0.42, 1],
  [0.58, 1],
  [0.78, 0.42],
  [0.78, 1],
  [1, 1],
  [1, 0],
  [0.78, 0],
  [0.5, 0.65],
  [0.22, 0],
  [0, 0],
];

export const mDefinition: GlyphDefinition = {
  colour: "rgb(230, 90, 120)",
  strokes: mContour.slice(0, -1).map((from, index) => ({
    id: `m-contour-${index + 1}`,
    kind: "line",
    from,
    to: mContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.22, 0.75],
      [0.22, 0.42],
      [0.32, 0.71],
      [0.42, 1],
      [0.5, 1],
      [0.58, 1],
      [0.68, 0.71],
      [0.78, 0.42],
      [0.78, 0.75],
      [1, 0.5],
      [0.78, 0],
      [0.64, 0.325],
      [0.5, 0.65],
      [0.36, 0.325],
      [0.22, 0],
    ],
    forbidden: [
      [0.5, 0],
      [0.5, 0.4],
      [0.11, 0.5],
      [0.32, 0.85],
      [0.68, 0.85],
      [0.89, 0.5],
    ],
  },
};

const nContour: NormalizedPoint[] = [
  [0, 0],
  [0, 1],
  [0.22, 1],
  [0.22, 0.38],
  [0.78, 1],
  [1, 1],
  [1, 0],
  [0.78, 0],
  [0.78, 0.62],
  [0.22, 0],
  [0, 0],
];

export const nDefinition: GlyphDefinition = {
  colour: "rgb(90, 200, 140)",
  strokes: nContour.slice(0, -1).map((from, index) => ({
    id: `n-contour-${index + 1}`,
    kind: "line",
    from,
    to: nContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.22, 0.7],
      [0.22, 0.38],
      [0.5, 0.69],
      [0.78, 1],
      [1, 0.5],
      [0.78, 0.3],
      [0.78, 0.62],
      [0.5, 0.31],
      [0.22, 0],
    ],
    forbidden: [
      [0.11, 0.5],
      [0.5, 0.15],
      [0.5, 0.5],
      [0.5, 0.85],
      [0.89, 0.5],
    ],
  },
};

export const oDefinition: GlyphDefinition = {
  colour: "rgb(240, 100, 160)",
  strokes: [
    {
      id: "o-outer-circle",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.5, 0.5],
      startAngle: -Math.PI / 2,
      endAngle: (3 * Math.PI) / 2,
    },
    {
      id: "o-inner-circle",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.32, 0.32],
      startAngle: -Math.PI / 2,
      endAngle: (-5 * Math.PI) / 2,
      anticlockwise: true,
    },
  ],
  pixelContract: {
    required: [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5],
      [0.5, 0.18],
      [0.82, 0.5],
      [0.5, 0.82],
      [0.18, 0.5],
    ],
    forbidden: [
      [0.5, 0.5],
      [0.5, 0.1],
      [0.9, 0.5],
    ],
  },
};

export const pDefinition: GlyphDefinition = {
  colour: "rgb(245, 140, 50)",
  strokes: [
    {
      id: "p-outer-top",
      kind: "line",
      from: [0, 0],
      to: [0.5, 0],
    },
    {
      id: "p-outer-bowl",
      kind: "arc",
      centre: [0.5, 0.3],
      radius: [0.3, 0.3],
      startAngle: -Math.PI / 2,
      endAngle: Math.PI / 2,
    },
    {
      id: "p-outer-bowl-bottom",
      kind: "line",
      from: [0.5, 0.6],
      to: [0.22, 0.6],
    },
    {
      id: "p-inner-stem",
      kind: "line",
      from: [0.22, 0.6],
      to: [0.22, 1],
    },
    {
      id: "p-stem-bottom",
      kind: "line",
      from: [0.22, 1],
      to: [0, 1],
    },
    {
      id: "p-outer-stem",
      kind: "line",
      from: [0, 1],
      to: [0, 0],
    },
    {
      id: "p-counter-top",
      kind: "line",
      from: [0.22, 0.18],
      to: [0.48, 0.18],
    },
    {
      id: "p-counter-bowl",
      kind: "arc",
      centre: [0.48, 0.3],
      radius: [0.12, 0.12],
      startAngle: -Math.PI / 2,
      endAngle: Math.PI / 2,
    },
    {
      id: "p-counter-bottom",
      kind: "line",
      from: [0.48, 0.42],
      to: [0.22, 0.42],
    },
    {
      id: "p-counter-left",
      kind: "line",
      from: [0.22, 0.42],
      to: [0.22, 0.18],
    },
  ],
  pixelContract: {
    required: [
      [0, 0],
      [0.5, 0],
      [0.5 + 0.3 * Math.SQRT1_2, 0.3 - 0.3 * Math.SQRT1_2],
      [0.8, 0.3],
      [0.5 + 0.3 * Math.SQRT1_2, 0.3 + 0.3 * Math.SQRT1_2],
      [0.5, 0.6],
      [0.22, 0.6],
      [0.22, 0.8],
      [0, 1],
      [0, 0.5],
      [0.22, 0.18],
      [0.48, 0.18],
      [0.6, 0.3],
      [0.48, 0.42],
      [0.22, 0.42],
    ],
    forbidden: [
      [0.4, 0.3],
      [0.7, 0.3],
      [0.9, 0.3],
      [0.11, 0.75],
      [0.5, 0.8],
    ],
  },
};

const qTailEdgeOffset = 0.08;

function getQTailCircleIntersections(radius: number) {
  const root = Math.sqrt(2 * radius ** 2 - qTailEdgeOffset ** 2);
  const upper: NormalizedPoint = [
    0.5 + (root + qTailEdgeOffset) / 2,
    0.5 + (root - qTailEdgeOffset) / 2,
  ];
  const lower: NormalizedPoint = [upper[1], upper[0]];

  return { upper, lower };
}

const qOuterTail = getQTailCircleIntersections(0.5);
const qInnerTail = getQTailCircleIntersections(0.32);
const qOuterUpperAngle = Math.atan2(
  qOuterTail.upper[1] - 0.5,
  qOuterTail.upper[0] - 0.5,
);
const qOuterLowerAngle = Math.atan2(
  qOuterTail.lower[1] - 0.5,
  qOuterTail.lower[0] - 0.5,
);
const qInnerUpperAngle = Math.atan2(
  qInnerTail.upper[1] - 0.5,
  qInnerTail.upper[0] - 0.5,
);
const qInnerLowerAngle = Math.atan2(
  qInnerTail.lower[1] - 0.5,
  qInnerTail.lower[0] - 0.5,
);

export const qDefinition: GlyphDefinition = {
  colour: oDefinition.colour,
  strokes: [
    {
      id: "q-outer-circle",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.5, 0.5],
      startAngle: qOuterLowerAngle,
      endAngle: qOuterUpperAngle + Math.PI * 2,
    },
    {
      id: "q-tail-outer-upper",
      kind: "line",
      from: qOuterTail.upper,
      to: [1, 0.92],
    },
    {
      id: "q-tail-outer-cap",
      kind: "line",
      from: [1, 0.92],
      to: [0.92, 1],
    },
    {
      id: "q-tail-outer-lower",
      kind: "line",
      from: [0.92, 1],
      to: qOuterTail.lower,
    },
    {
      id: "q-inner-circle",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.32, 0.32],
      startAngle: qInnerUpperAngle,
      endAngle: qInnerLowerAngle - Math.PI * 2,
      anticlockwise: true,
    },
    {
      id: "q-tail-inner-lower",
      kind: "line",
      from: qInnerTail.lower,
      to: [0.64, 0.72],
    },
    {
      id: "q-tail-inner-cap",
      kind: "line",
      from: [0.64, 0.72],
      to: [0.72, 0.64],
    },
    {
      id: "q-tail-inner-upper",
      kind: "line",
      from: [0.72, 0.64],
      to: qInnerTail.upper,
    },
  ],
  pixelContract: {
    required: [
      [0.5, 0],
      [1, 0.5],
      [0.5, 1],
      [0, 0.5],
      [0.5, 0.18],
      [0.82, 0.5],
      [0.5, 0.82],
      [0.18, 0.5],
      qOuterTail.upper,
      [1, 0.92],
      [0.96, 0.96],
      [0.92, 1],
      qOuterTail.lower,
      qInnerTail.lower,
      [0.64, 0.72],
      [0.68, 0.68],
      [0.72, 0.64],
      qInnerTail.upper,
    ],
    forbidden: [
      [0.5, 0.5],
      [0.5, 0.1],
      [0.9, 0.5],
      [0.82, 0.82],
      [0.7, 0.9],
    ],
  },
};

export const rDefinition: GlyphDefinition = {
  colour: "rgb(180, 90, 220)",
  strokes: [
    {
      id: "r-outer-top",
      kind: "line",
      from: [0, 0],
      to: [0.5, 0],
    },
    {
      id: "r-outer-bowl",
      kind: "arc",
      centre: [0.5, 0.3],
      radius: [0.3, 0.3],
      startAngle: -Math.PI / 2,
      endAngle: Math.PI / 2,
    },
    {
      id: "r-outer-bowl-bottom",
      kind: "line",
      from: [0.5, 0.6],
      to: [0.36, 0.6],
    },
    {
      id: "r-leg-outer",
      kind: "line",
      from: [0.36, 0.6],
      to: [0.8, 1],
    },
    {
      id: "r-leg-cap",
      kind: "line",
      from: [0.8, 1],
      to: [0.58, 1],
    },
    {
      id: "r-leg-inner",
      kind: "line",
      from: [0.58, 1],
      to: [0.22, 0.68],
    },
    {
      id: "r-inner-stem",
      kind: "line",
      from: [0.22, 0.68],
      to: [0.22, 1],
    },
    {
      id: "r-stem-bottom",
      kind: "line",
      from: [0.22, 1],
      to: [0, 1],
    },
    {
      id: "r-outer-stem",
      kind: "line",
      from: [0, 1],
      to: [0, 0],
    },
    {
      id: "r-counter-top",
      kind: "line",
      from: [0.22, 0.18],
      to: [0.48, 0.18],
    },
    {
      id: "r-counter-bowl",
      kind: "arc",
      centre: [0.48, 0.3],
      radius: [0.12, 0.12],
      startAngle: -Math.PI / 2,
      endAngle: Math.PI / 2,
    },
    {
      id: "r-counter-bottom",
      kind: "line",
      from: [0.48, 0.42],
      to: [0.22, 0.42],
    },
    {
      id: "r-counter-left",
      kind: "line",
      from: [0.22, 0.42],
      to: [0.22, 0.18],
    },
  ],
  pixelContract: {
    required: [
      [0, 0],
      [0.5, 0],
      [0.5 + 0.3 * Math.SQRT1_2, 0.3 - 0.3 * Math.SQRT1_2],
      [0.8, 0.3],
      [0.5 + 0.3 * Math.SQRT1_2, 0.3 + 0.3 * Math.SQRT1_2],
      [0.5, 0.6],
      [0.36, 0.6],
      [0.58, 0.8],
      [0.8, 1],
      [0.58, 1],
      [0.4, 0.84],
      [0.22, 0.68],
      [0.22, 0.85],
      [0, 1],
      [0, 0.5],
      [0.22, 0.18],
      [0.48, 0.18],
      [0.6, 0.3],
      [0.48, 0.42],
      [0.22, 0.42],
    ],
    forbidden: [
      [0.4, 0.3],
      [0.7, 0.3],
      [0.9, 0.3],
      [0.11, 0.8],
      [0.47, 0.8],
      [0.75, 0.75],
      [0.9, 0.9],
    ],
  },
};

export const uDefinition: GlyphDefinition = {
  colour: "rgb(40, 180, 200)",
  strokes: [
    {
      id: "u-outer-left",
      kind: "line",
      from: [0, 0],
      to: [0, 0.5],
    },
    {
      id: "u-outer-bottom",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.5, 0.5],
      startAngle: Math.PI,
      endAngle: 0,
      anticlockwise: true,
    },
    {
      id: "u-outer-right",
      kind: "line",
      from: [1, 0.5],
      to: [1, 0],
    },
    {
      id: "u-right-terminal-cap",
      kind: "line",
      from: [1, 0],
      to: [0.78, 0],
    },
    {
      id: "u-inner-right",
      kind: "line",
      from: [0.78, 0],
      to: [0.78, 0.5],
    },
    {
      id: "u-inner-bottom",
      kind: "arc",
      centre: [0.5, 0.5],
      radius: [0.28, 0.28],
      startAngle: 0,
      endAngle: Math.PI,
    },
    {
      id: "u-inner-left",
      kind: "line",
      from: [0.22, 0.5],
      to: [0.22, 0],
    },
    {
      id: "u-left-terminal-cap",
      kind: "line",
      from: [0.22, 0],
      to: [0, 0],
    },
  ],
  pixelContract: {
    required: [
      [0, 0.25],
      [0, 0.5],
      [0.5, 1],
      [1, 0.5],
      [1, 0.25],
      [0.89, 0],
      [0.78, 0.25],
      [0.78, 0.5],
      [0.5, 0.78],
      [0.22, 0.5],
      [0.22, 0.25],
      [0.11, 0],
    ],
    forbidden: [
      [0.5, 0],
      [0.5, 0.5],
      [0.5, 0.89],
      [0.11, 0.25],
      [0.89, 0.25],
    ],
  },
};

const vContour: NormalizedPoint[] = [
  [0, 0],
  [0.38, 1],
  [0.62, 1],
  [1, 0],
  [0.76, 0],
  [0.5, 0.72],
  [0.24, 0],
  [0, 0],
];

export const vDefinition: GlyphDefinition = {
  colour: "rgb(60, 120, 240)",
  strokes: vContour.slice(0, -1).map((from, index) => ({
    id: `v-contour-${index + 1}`,
    kind: "line",
    from,
    to: vContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0],
      [0.19, 0.5],
      [0.38, 1],
      [0.5, 1],
      [0.62, 1],
      [0.81, 0.5],
      [1, 0],
      [0.88, 0],
      [0.63, 0.36],
      [0.5, 0.72],
      [0.37, 0.36],
      [0.24, 0],
      [0.12, 0],
    ],
    forbidden: [
      [0.5, 0],
      [0.5, 0.4],
      [0.5, 0.85],
      [0.1, 0.5],
      [0.9, 0.5],
    ],
  },
};

const wContour: NormalizedPoint[] = [
  [0, 1],
  [0, 0],
  [0.22, 0],
  [0.22, 0.58],
  [0.42, 0],
  [0.58, 0],
  [0.78, 0.58],
  [0.78, 0],
  [1, 0],
  [1, 1],
  [0.78, 1],
  [0.5, 0.35],
  [0.22, 1],
  [0, 1],
];

export const wDefinition: GlyphDefinition = {
  colour: mDefinition.colour,
  strokes: wContour.slice(0, -1).map((from, index) => ({
    id: `w-contour-${index + 1}`,
    kind: "line",
    from,
    to: wContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0.5],
      [0.22, 0.25],
      [0.22, 0.58],
      [0.32, 0.29],
      [0.42, 0],
      [0.5, 0],
      [0.58, 0],
      [0.68, 0.29],
      [0.78, 0.58],
      [0.78, 0.25],
      [1, 0.5],
      [0.78, 1],
      [0.64, 0.675],
      [0.5, 0.35],
      [0.36, 0.675],
      [0.22, 1],
    ],
    forbidden: [
      [0.5, 1],
      [0.5, 0.6],
      [0.11, 0.5],
      [0.32, 0.15],
      [0.68, 0.15],
      [0.89, 0.5],
    ],
  },
};

export const xDiagonalAngleDegrees = 60;
const xDiagonalAngle = (xDiagonalAngleDegrees * Math.PI) / 180;
const xHorizontalRun = 0.5 / Math.tan(xDiagonalAngle);
const xLeft = 0.5 - xHorizontalRun;
const xRight = 0.5 + xHorizontalRun;
const xArmHalfWidth = 0.1;
const xJunctionTop = 0.5 - xArmHalfWidth * Math.tan(xDiagonalAngle);
const xJunctionBottom = 1 - xJunctionTop;
const xJunctionLeft = 0.5 - xArmHalfWidth;
const xJunctionRight = 0.5 + xArmHalfWidth;
const xContour: NormalizedPoint[] = [
  [xLeft - xArmHalfWidth, 0],
  [xLeft + xArmHalfWidth, 0],
  [0.5, xJunctionTop],
  [xRight - xArmHalfWidth, 0],
  [xRight + xArmHalfWidth, 0],
  [xJunctionRight, 0.5],
  [xRight + xArmHalfWidth, 1],
  [xRight - xArmHalfWidth, 1],
  [0.5, xJunctionBottom],
  [xLeft + xArmHalfWidth, 1],
  [xLeft - xArmHalfWidth, 1],
  [xJunctionLeft, 0.5],
  [xLeft - xArmHalfWidth, 0],
];

export const xDefinition: GlyphDefinition = {
  colour: "rgb(240, 80, 80)",
  strokes: xContour.slice(0, -1).map((from, index) => ({
    id: `x-contour-${index + 1}`,
    kind: "line",
    from,
    to: xContour[index + 1],
  })),
  pixelContract: {
    required: [
      [xLeft - xArmHalfWidth, 0],
      [xLeft + xArmHalfWidth, 0],
      [0.5, xJunctionTop],
      [xRight - xArmHalfWidth, 0],
      [xRight + xArmHalfWidth, 0],
      [xJunctionRight, 0.5],
      [xRight + xArmHalfWidth, 1],
      [xRight - xArmHalfWidth, 1],
      [0.5, xJunctionBottom],
      [xLeft + xArmHalfWidth, 1],
      [xLeft - xArmHalfWidth, 1],
      [xJunctionLeft, 0.5],
    ],
    forbidden: [
      [0, 0.5],
      [0.5, 0],
      [xLeft + 0.25 / Math.tan(xDiagonalAngle), 0.25],
      [xRight - 0.25 / Math.tan(xDiagonalAngle), 0.25],
      [0.5, 0.5],
      [xLeft + 0.25 / Math.tan(xDiagonalAngle), 0.75],
      [xRight - 0.25 / Math.tan(xDiagonalAngle), 0.75],
      [0.5, 1],
      [1, 0.5],
    ],
  },
};

export const yDiagonalAngleDegrees = 60;
const yDiagonalAngle = (yDiagonalAngleDegrees * Math.PI) / 180;
const yHorizontalRun = 0.5 / Math.tan(yDiagonalAngle);
const yLeft = 0.5 - yHorizontalRun;
const yRight = 0.5 + yHorizontalRun;
const yArmHalfWidth = 0.1;
const yJunctionTop = 0.5 - yArmHalfWidth * Math.tan(yDiagonalAngle);
const yStemLeft = 0.5 - yArmHalfWidth;
const yStemRight = 0.5 + yArmHalfWidth;
const yContour: NormalizedPoint[] = [
  [yLeft - yArmHalfWidth, 0],
  [yLeft + yArmHalfWidth, 0],
  [0.5, yJunctionTop],
  [yRight - yArmHalfWidth, 0],
  [yRight + yArmHalfWidth, 0],
  [yStemRight, 0.5],
  [yStemRight, 1],
  [yStemLeft, 1],
  [yStemLeft, 0.5],
  [yLeft - yArmHalfWidth, 0],
];

export const yDefinition: GlyphDefinition = {
  colour: "rgb(240, 190, 40)",
  strokes: yContour.slice(0, -1).map((from, index) => ({
    id: `y-contour-${index + 1}`,
    kind: "line",
    from,
    to: yContour[index + 1],
  })),
  pixelContract: {
    required: [
      [yLeft - yArmHalfWidth, 0],
      [yLeft + yArmHalfWidth, 0],
      [0.5, yJunctionTop],
      [yRight - yArmHalfWidth, 0],
      [yRight + yArmHalfWidth, 0],
      [yStemRight, 0.5],
      [yStemRight, 1],
      [yStemLeft, 1],
      [yStemLeft, 0.5],
    ],
    forbidden: [
      [0.5, 0],
      [yLeft + 0.25 / Math.tan(yDiagonalAngle), 0.25],
      [yRight - 0.25 / Math.tan(yDiagonalAngle), 0.25],
      [0.5, 0.5],
      [0.5, 0.75],
      [0, 0.5],
      [1, 0.5],
    ],
  },
};

const zContour: NormalizedPoint[] = [
  [0, 0],
  [1, 0],
  [1, 0.22],
  [0.38, 0.78],
  [1, 0.78],
  [1, 1],
  [0, 1],
  [0, 0.78],
  [0.62, 0.22],
  [0, 0.22],
  [0, 0],
];

export const zDefinition: GlyphDefinition = {
  colour: "rgb(110, 100, 230)",
  strokes: zContour.slice(0, -1).map((from, index) => ({
    id: `z-contour-${index + 1}`,
    kind: "line",
    from,
    to: zContour[index + 1],
  })),
  pixelContract: {
    required: [
      [0, 0],
      [0.5, 0],
      [1, 0],
      [1, 0.22],
      [0.69, 0.5],
      [0.38, 0.78],
      [1, 0.78],
      [1, 1],
      [0.5, 1],
      [0, 1],
      [0, 0.78],
      [0.31, 0.5],
      [0.62, 0.22],
      [0, 0.22],
    ],
    forbidden: [
      [0, 0.5],
      [0.5, 0.11],
      [0.5, 0.5],
      [0.5, 0.89],
      [1, 0.5],
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
