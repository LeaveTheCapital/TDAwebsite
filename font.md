# Animated font style guide

## Core style

The font is an uppercase, sans-serif, outlined block font. Letters are always
capitals. Numbers use the same visual language.

Punctuation may use a different historical style when explicitly requested.
The apostrophe is a deliberate serif exception, but it remains a closed,
outlined block contour rather than a centreline stroke.

In phrase text, `æ` and `Æ` are authoring markers for an A whose crossbar
travels in from the left edge of its wrapped row. They render as an A rather
than as the Æ ligature. A plain `A` uses the standard declarative contour
animation. Marked As animate one at a time from left to right within a row;
each row runs its own sequence simultaneously.

Each visible stem, arm, bar, bowl, or diagonal has thickness. Canvas strokes
trace the boundaries of that thick shape; they do not represent a thin line
through its centre. This is sometimes called an outline font, block font, or
contour font.

User descriptions such as "two vertical lines", "a diagonal", or "a curve"
describe the major parts of the glyph's silhouette. They must not be
implemented as isolated one-pixel or `ctx.lineWidth`-wide centreline strokes.

## Contour rules

- Every final glyph must have a fully closed perimeter. The last point of a
  contour must connect to its first point with no gaps.
- Open-looking characters such as C, 3, and S still have a closed boundary:
  trace the outside edge, cross the terminal cap, return along the inside
  edge, and close the other terminal cap.
- Enclosed counters in characters such as B, D, O, P, Q, R, and 0 have their
  own closed inner contours.
- Thick joined forms such as M, N, V, W, X, Y, and Z must be drawn as closed
  polygons around their arms and joins, not as intersecting centre lines.
- Adjacent contour segments must share exact endpoints. Do not rely on line
  caps, antialiasing, or visual overlap to hide a gap.
- Contours must not cross, overlap, or continue through another contour unless
  the user explicitly requests crossing lines. At a join, trim the incoming
  contours and merge their boundaries into one continuous outline with no
  internal seam. For example, a Q tail replaces the intersected portions of
  the inner and outer bowl contours instead of being drawn over complete
  circles.
- Keep stroke thickness visually consistent with existing outlined glyphs.
  Use B, C, E, O, and S in `src/glyphs.ts` as reference geometry.
- The finished contour is the authority. Animation may progressively reveal
  it or morph into it, but the final frame must obey all of these rules.

## Geometry and implementation

Define reusable geometry in normalized glyph coordinates, where `[0, 0]` is
the top-left and `[1, 1]` is the bottom-right of the glyph box.

Prefer `GlyphDefinition` and ordered declarative strokes. Order each contour
so it can be followed continuously around the shape. Use separate ordered
contours for holes. Custom animation classes are appropriate when the user
specifically requests moving geometry, but their final geometry must still be
a closed outlined shape.

When the user asks for an adjustable angle, width, or proportion, expose one
clearly named constant and derive all related coordinates from it.

Every glyph definition must include a pixel contract:

- `required` points cover outer edges, inner edges, joins, and terminal caps.
- `forbidden` points cover counters, openings, and nearby empty space.
- Include points that would expose a missing closure or an accidental
  centreline implementation.

Before handing off a glyph change, run the repository's typecheck, lint, and
build checks. Run browser tests only when the task calls for them or when the
change needs browser-level visual evidence.
