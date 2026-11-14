# Repository instructions

## Use of tests

Playwright tests are really only here as means of creating a visual snapshot/video which can be uploaded
as an artifact on CI runs and for visual verification by Henry. We don't use them to actually verify pixel 
accurate behaviour and such, because this is an art project and we don't want to be bogged down by that.
Unit tests are there to verify as much as they can of behaviour but should only be used for 


## Font and glyph work

Before creating, changing, or reviewing any letter or number glyph, read
[font.md](font.md) in full. It is the canonical style guide for the animated
font in this repository.

Do not treat a requested line, curve, stem, arm, or diagonal as a single
centreline stroke. Those terms describe parts of an outlined block glyph; the
finished glyph must follow the closed-contour rules in the font guide.

## Drum visualisation work

Before changing or reviewing drum timing or drum canvas behaviour, read
[drum.md](drum.md) in full. It is the canonical guide for the MIDI-driven drum
pattern and its tests.
