# MIDI drum visualisation guide

## Musical pattern

The drum visualisation is a fixed 4/4 reference pattern driven by MIDI Timing
Clock. MIDI provides 24 clock pulses per quarter note, so one bar contains 96
pulses and one eighth note contains 12 pulses.

| Position | Pulse in bar | Bass drum | Snare circle | Hi-hat |
| --- | ---: | --- | --- | --- |
| 1 | 0 | Hit | — | Hit |
| 1 and | 12 | — | — | Hit |
| 2 | 24 | — | Hit, left | Hit |
| 2 and | 36 | — | — | Hit |
| 3 | 48 | — | — | Hit |
| 3 and | 60 | — | — | Hit |
| 4 | 72 | — | Hit, right | Hit |
| 4 and | 84 | — | — | Hit |

The pattern repeats from pulse 0 at the start of every bar. The bass drum hits
only on beat 1. The round white snare circle hits on beats 2 and 4, alternating
between the left and right positions. The orange square hi-hat hits on every
eighth note: 1, and, 2, and, 3, and, 4, and.

## Visual duration

A hit remains visible for six MIDI clock pulses after its onset. Six pulses are
one sixteenth note. This duration makes each hit readable without moving its
musical onset or allowing it to run into the next eighth-note hi-hat hit.

The visibility windows within one bar are therefore:

- Bass drum: pulses 0 through 5.
- Snare circle: pulses 24 through 29 and 72 through 77.
- Hi-hat: pulses 0 through 5, 12 through 17, 24 through 29, 36 through 41,
  48 through 53, 60 through 65, 72 through 77, and 84 through 89.

## Visual design

- The bass drum is a yellow circle centred at 35% of the overlay width.
- The snare is a white round circle near the bottom of the overlay. Beat 2 is
  placed at 35% of the width and beat 4 at 65%.
- The hi-hat is an orange square centred at 65% of the overlay width.
- Every shape has a two-pixel black outline.

The overlay exposes `data-bass-drum-visible`, `data-snare-visible`, and
`data-hi-hat-visible` for browser integration checks. While the snare is
visible, `data-snare-side` is either `left` or `right`.

## Implementation

The pure timing calculation lives in `src/drum-pattern.ts`. It converts the
current zero-based MIDI pulse into hit-onset and visibility state. Keep musical
timing out of the canvas renderer.

`src/tda.ts` owns transport handling and drawing. It passes the current pulse
to the pure timing function, clears the overlay, and draws whichever
instruments are visible. MIDI Start resets the transport to pulse 0. MIDI Stop
clears the overlay. Pausing freezes the pulse position and clears the overlay;
resuming continues from the same position.

The timing calculation is independent of BPM. BPM changes the real-world time
between pulses, but never changes which pulse triggers an instrument.

## Testing

`tests/drum-pattern.test.ts` is the authoritative timing test. It checks every
pulse across two complete bars, including all onsets, visibility windows, bar
repetition, and alternating snare positions. Run it with `npm run test:unit`.

Playwright tests should cover browser integration only: MIDI messages reaching
the transport, canvas pixels using the expected colours, and clearing on pause
or stop. Do not duplicate the full pulse table in browser tests.
