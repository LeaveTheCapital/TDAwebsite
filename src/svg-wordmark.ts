import { aDefinition, type GlyphPixelContract } from "./glyphs.ts";

interface SvgGlyphDefinition {
  contours: string[];
  pixelContract: GlyphPixelContract;
}

export const svgDDefinition: SvgGlyphDefinition = {
  contours: [
    "M 0 0 H 0.5 A 0.5 0.5 0 0 1 0.5 1 H 0 Z",
    "M 0.1375 0.2 H 0.5 A 0.3 0.3 0 0 1 0.5 0.8 H 0.1375 Z",
  ],
  pixelContract: {
    required: [
      [0, 0], [0.25, 0], [1, 0.5], [0.5, 1], [0, 1], [0, 0.5],
      [0.1375, 0.2], [0.3, 0.2], [0.8, 0.5], [0.3, 0.8], [0.1375, 0.5],
    ],
    forbidden: [[0.4, 0.5], [0.9, 0.05], [0.9, 0.95], [0.07, 0.5]],
  },
};

export const svgADefinition: SvgGlyphDefinition = {
  contours: ["a-outer", "a-counter"].map((prefix) => {
    const strokes = aDefinition.strokes.filter((stroke) => stroke.id.startsWith(prefix));
    return strokes.map((stroke, index) => {
      if (stroke.kind !== "line") {
        throw new Error("Expected a polygon contour for A");
      }
      return `${index === 0 ? `M ${stroke.from.join(" ")} ` : ""}L ${stroke.to.join(" ")}`;
    }).join(" ") + " Z";
  }),
  pixelContract: aDefinition.pixelContract,
};

export function renderSvgWordmark(): void {
  for (const [letter, definition] of [["d", svgDDefinition], ["a", svgADefinition]] as const) {
    const svg = document.querySelector(`.svg-core-${letter}`);
    if (svg === null) {
      continue;
    }
    for (const contour of definition.contours) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", contour);
      path.setAttribute("transform", "scale(100)");
      path.setAttribute("class", "svg-core-outline svg-core-outline--normalized");
      svg.append(path);
      path.style.setProperty("--trace-length", String(path.getTotalLength()));
    }
  }
}
