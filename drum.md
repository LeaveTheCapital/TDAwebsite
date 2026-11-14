# MIDI drum visualisation guide

## MIDI drum notes

Songs with `hasMidiDrumNotes: true` use Note On messages on MIDI channel 10
to trigger the drum animation. Other songs use the clock pattern below.
MIDI clock still advances song sections and controls the six-pulse decay of
each hit. Silent sections show the resting pose and ignore drum notes.

| Sound | Channel | Note | Visual |
| --- | ---: | ---: | --- |
| Bass drum | 10 | 36 | Bass drum |
| Snare drum | 10 | 38 | Snare |
| Low tom | 10 | 43 | Tall floor tom |
| Hand clap | 10 | 39 | Clapping hands |
| Closed hi-hat | 10 | 42 | Closing hi-hat |
| Open hi-hat | 10 | 46 | Opening hi-hat |

Other note numbers are ignored. Notes are heard visually as soon as they
arrive, including between clocks. Their animations decay over the next six
clock pulses. Start, stop, and song changes clear previous hits.

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
  half of the swing takes three clocks.
- Snare stick: touches the head on pulses 24 and 72, then rises during the
  following five pulses.
- Hi-hat: the cymbals touch on pulses 0, 12, 24, 36, 48, 60, 72, and 84.
  They move apart over the following six pulses and remain open until the
  next hit.

## Visual design

- The overlay is divided into four evenly spaced horizontal zones.
- The bass drum is centred in the left zone at 12.5%. Its white front head has
  a one-pixel black outer outline and a smaller inner ring. The blue shell
  extends left from the tall oval head, following the supplied side view.
- The snare is an angled drum illustration centred vertically in the
  middle-right zone at 62.5%.
- MIDI drum-note songs also show a taller floor tom to the left of the bass
  drum and a pair of clapping hands farther left. The fixed clock pattern does
  not trigger them, so they remain grey during songs without MIDI drum notes.
- The hi-hat is centred in the right zone at 87.5%. A vertical grey stand runs
  through an orange, shallow bell-shaped upper cymbal and an identical lower
  cymbal reflected beneath it. Both cymbals have black outlines. They move
  symmetrically toward the centre to touch on a hit, then return to a compact
  open position. The open gap is half the original spacing. As the cymbals
  close, the top of the stand retracts downward by the same distance that
  each cymbal travels; the lower end of the stand stays fixed.
- The snare and hi-hat have two-pixel black outlines.
- Closed and open hi-hat notes share one stand and pair of cymbals. Note 42
  closes them; note 46 spreads them wider before they settle to the resting
  gap over six clocks. If both arrive on the same pulse, the closed hit wins.

The dice sits directly below the drum overlay inside the same black canvas
area, separated by a half-rem top gap.

Selecting a song shows every instrument in its resting pose and in shades of
grey. An instrument gains its normal colours as soon as its first hit starts,
then stays coloured for the rest of that song. The closed and open hi-hat notes
share one colour state. Pause and silent sections keep all instruments visible
in their resting poses, preserving which ones have played. Stop and song
changes reset all instruments to grey. The intro without a selected song has
an empty overlay.

The overlay exposes `data-bass-drum-visible`, `data-bass-drum-hit-visible`,
`data-snare-visible`, `data-low-tom-visible`, `data-hand-clap-visible`, and
`data-hi-hat-visible` for browser integration checks. Their corresponding
`data-*-played` flags track whether each instrument has gained colour.
`data-snare-side` stays `right` because the single snare is always in the
middle-right zone. `data-hi-hat-closure` runs from `1` when the cymbals touch
to `0` when they are fully open. `data-bass-beater-progress` runs from `1`
when the beater touches the head to `0` when it is angled away. The
`data-bass-drum-hit-visible` flag tracks the first six pulses after the hit;
the return motion does not set it.
`data-hi-hat-opening` runs from `1` at an open hat hit to `0` at rest.

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
current zero-based MIDI pulse into hit-onset and visibility state for both
the fixed pattern and incoming drum notes. Keep musical timing out of the
canvas renderer.

`src/tda.ts` owns transport handling and drawing. It tracks which instruments
have been hit during the current song and colours those instruments. After
MIDI Start it passes the current pulse to the pure timing function and redraws
the drums with their current hit states. MIDI Start resets the transport to
pulse 0. MIDI Stop resets the colours. Pause shows every instrument at rest,
with the bass beater at contact, the snare stick raised, and the hi-hat open.
Resuming continues from
the same pulse position. The first beat after MIDI Start has no bass beater
lead-in; subsequent bars use the previous bar's final six pulses.

The timing calculation is independent of BPM. BPM changes the real-world time
between pulses, but never changes which pulse triggers an instrument.

## Testing

`tests/drum-pattern.test.ts` is the authoritative timing test. It checks every
pulse across two complete bars, including all onsets, visibility windows, bar
repetition, and both snare hits. Run it with `npm run test:unit`.

Playwright tests are mainly there to be able to create a visual of the journey which can be uploaded as evidence for the Henry(TDA) to review.
They should cover browser integration only: MIDI messages reaching
the transport, visual elements being present (but no need to assert on colour as this can be changed for creative reasons at any time) , and clearing on pause
or stop. Do not duplicate the full pulse table in browser tests.
