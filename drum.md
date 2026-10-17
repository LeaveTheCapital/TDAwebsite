# MIDI drum visualisation guide

## Musical pattern

The drum visualisation is a fixed 4/4 reference pattern driven by MIDI Timing
Clock. MIDI provides 24 clock pulses per quarter note, so one bar contains 96
pulses and one eighth note contains 12 pulses.

| Position | Pulse in bar | Bass drum | Snare | Hi-hat |
| --- | ---: | --- | --- | --- |
| 1 | 0 | Hit | — | Hit |
| 1 and | 12 | — | — | Hit |
| 2 | 24 | — | Hit | Hit |
| 2 and | 36 | — | — | Hit |
| 3 | 48 | — | — | Hit |
| 3 and | 60 | — | — | Hit |
| 4 | 72 | — | Hit | Hit |
| 4 and | 84 | — | — | Hit |

The pattern repeats from pulse 0 at the start of every bar. The bass drum hits
only on beat 1. The snare in the middle-right zone hits on beats 2 and 4. The
middle-left zone stays empty. The hi-hat hits on every
eighth note: 1, and, 2, and, 3, and, 4, and.

## Visual duration

Six MIDI clock pulses are one sixteenth note. Hit states use this duration to
make each event readable without moving its musical onset.

The visibility windows within one bar are therefore:

- Bass drum beater: stays vertical through the first beat 1 after MIDI Start,
  because no clock pulses precede that start message. For each later beat 1,
  it begins moving right at pulse 90 of the preceding bar, reaches its furthest
  angle at pulse 93, and returns to the head at pulse 0 of the next bar. Each
  half of the swing takes three clocks. The drum and beater stay visible.
- Snare stick: touches the head on pulses 24 and 72, then rises during the
  following five pulses. The drum and stick remain visible between hits.
- Hi-hat: the cymbals touch on pulses 0, 12, 24, 36, 48, 60, 72, and 84.
  They move apart over the following six pulses and remain open until the
  next hit. The stand and both cymbals stay visible throughout.

## Visual design

- The overlay is divided into four evenly spaced horizontal zones.
- The bass drum is centred in the left zone at 12.5%. Its white front head has
  a one-pixel black outer outline and a smaller inner ring. The blue shell
  extends left from the tall oval head, following the supplied side view.
- The middle-left zone at 37.5% remains empty. The snare is an angled drum
  illustration centred vertically in the middle-right zone at 62.5%.
- The hi-hat is centred in the right zone at 87.5%. A vertical grey stand runs
  through an orange, shallow bell-shaped upper cymbal and an identical lower
  cymbal reflected beneath it. Both cymbals have black outlines. They move
  symmetrically toward the centre to touch on a hit, then return to a compact
  open position. The open gap is half the original spacing. As the cymbals
  close, the top of the stand retracts downward by the same distance that
  each cymbal travels; the lower end of the stand stays fixed.
- The snare and hi-hat have two-pixel black outlines.

The dice sits directly below the drum overlay inside the same black canvas
area, separated by a half-rem top gap.

Before the first MIDI or fake MIDI start, the overlay shows a static preview:
the bass drum, snare, and hi-hat are all visible. Incoming
clock pulses do not change this preview until playback starts. Playback then
uses the pulse pattern above. The preview, pause, and stop show the bass beater
touching the centre of its head, the snare stick raised, and the hi-hat open.

The overlay exposes `data-bass-drum-visible`, `data-bass-drum-hit-visible`,
`data-snare-visible`, and `data-hi-hat-visible` for browser integration checks.
`data-snare-side` stays `right` because the single snare is always in the
middle-right zone. `data-hi-hat-closure` runs from `1` when the cymbals touch
to `0` when they are fully open. `data-bass-beater-progress` runs from `1`
when the beater touches the head to `0` when it is angled away. The
`data-bass-drum-hit-visible` flag tracks the first six pulses after the hit;
the return motion does not set it.

### Bass drum drawing

The supplied bass drum image guides the silhouette: a tall white oval head at
the right, with two thin black rim outlines. Draw a straight horizontal top
edge and bottom edge running left from the head. Connect their left ends with
the visible half of a vertical ellipse, forming the curved back edge of the
blue drum shell. The front head covers the shell's right edge.

A grey beater shaft rises from a fixed point at the bottom of the oval head.
Its dark round beater starts at the centre of the head, with the shaft straight
and vertical. During the last six clocks of each bar, the shaft pivots
slightly right and swings back to reach the head exactly on the next beat 1.
Its bottom stays fixed throughout; the shell and head stay still.

### Snare drawing

The snare should face the viewer, with its top tilted away so the viewer looks
slightly down onto the drum. The supplied image guides its perspective and
colours. The shell has no decorative patterns.

- Draw the circular top drumhead in perspective, so it appears as a wide,
  shallow ellipse. Its far edge sits higher on the canvas than its near edge.
- From the left and right edges of the top, draw the visible side walls down
  toward the bottom of the drum. These side edges should be approximately
  vertical.
- Connect the side walls with the visible front arc of the bottom circle. The
  back of that bottom circle is hidden behind the drum body.

The drumhead is white, the plain shell is red, and the top and bottom rims are
blue. All contours have black outlines. The drum stays at the right snare
position. It has a lightly tapered wooden stick angled from
above the right edge toward the middle of the head, with a small rounded beater
at the tip. Beats 2 and 4 lower the stick onto the drumhead. The stick returns
to its resting angle over six MIDI pulses.

## Implementation

The pure timing calculation lives in `src/drum-pattern.ts`. It converts the
current zero-based MIDI pulse into hit-onset and visibility state. Keep musical
timing out of the canvas renderer.

`src/tda.ts` owns transport handling and drawing. It draws the static preview
until the first start, then passes the current pulse to the pure timing
function and redraws the drums with their current hit states. MIDI Start
resets the transport to pulse 0. MIDI Stop and pause show the bass beater at
contact, with the snare stick raised and hi-hat open. Resuming continues from
the same pulse position. The first beat after MIDI Start has no bass beater
lead-in; subsequent bars use the previous bar's final six pulses.

The timing calculation is independent of BPM. BPM changes the real-world time
between pulses, but never changes which pulse triggers an instrument.

## Testing

`tests/drum-pattern.test.ts` is the authoritative timing test. It checks every
pulse across two complete bars, including all onsets, visibility windows, bar
repetition, and both snare hits. Run it with `npm run test:unit`.

Playwright tests should cover browser integration only: MIDI messages reaching
the transport, canvas pixels using the expected colours, and clearing on pause
or stop. Do not duplicate the full pulse table in browser tests.
