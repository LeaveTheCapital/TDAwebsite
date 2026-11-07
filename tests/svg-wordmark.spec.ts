import { expect, test } from "@playwright/test";
import { svgADefinition, svgDDefinition } from "../src/svg-wordmark.ts";

test("CSS preview draws closed TDA outlines and counters on desktop and mobile", async ({ page }) => {
  await page.goto("/tda.html");
  const preview = page.getByRole("img", { name: "Animated outlined capitals TDA" });
  await expect(preview).toBeVisible();
  await expect(preview.locator("svg")).toHaveCount(3);
  for (const [letter, definition] of [["d", svgDDefinition], ["a", svgADefinition]] as const) {
    const paths = preview.locator(`.svg-core-${letter} path`);
    await expect(paths).toHaveCount(2);
    const result = await paths.evaluateAll((elements, contract) => {
      const canvas = document.createElement("canvas");
      canvas.width = 210;
      canvas.height = 210;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        throw new Error("Missing test canvas context");
      }
      ctx.translate(5, 5);
      ctx.scale(200, 200);
      ctx.lineWidth = 0.02;
      const contours = elements.map((element) => new Path2D(element.getAttribute("d") ?? ""));
      return {
        closed: elements.every((element) => element.getAttribute("d")?.endsWith("Z")),
        required: contract.required.every(([x, y]) => contours.some((path) => ctx.isPointInStroke(path, x * 200 + 5, y * 200 + 5))),
        forbidden: contract.forbidden.every(([x, y]) => contours.every((path) => !ctx.isPointInStroke(path, x * 200 + 5, y * 200 + 5))),
      };
    }, definition.pixelContract);
    expect(result).toEqual({ closed: true, required: true, forbidden: true });
  }
  await preview.locator("path").evaluateAll((paths) => {
    for (const path of paths) {
      (path as SVGPathElement).style.animation = "none";
      (path as SVGPathElement).style.strokeDashoffset = "0";
    }
  });
  await preview.screenshot({ path: "test-results/tda-wordmark-desktop.png" });
  await page.setViewportSize({ width: 375, height: 812 });
  const bounds = await preview.boundingBox();
  expect(bounds).not.toBeNull();
  for (const glyph of await preview.locator("svg").all()) {
    const box = await glyph.boundingBox();
    expect(box).not.toBeNull();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(375);
  }
  await preview.screenshot({ path: "test-results/tda-wordmark-mobile.png" });
});
