# Map context

The subject is the tracked website at `../`. This map records verified, first-order relationships so an editor can open only the relevant source. It does not own product behaviour.

## Reading order

1. Start in [objects](objects/CONTEXT.md) for a noun or [effects](effects/CONTEXT.md) for a proposed edit.
2. Follow one card’s **See** link to source. Read [processes](processes/CONTEXT.md) when timing or persistence crosses files.
3. Before changing glyphs or drums, read the complete [font guide](../font.md) or [drum guide](../drum.md), respectively.

## Universes and status

`live` means wired into an entry page; `leftover` means present but off the main path; `ghost` means named but unwired. Cards marked `verified` cite commit `2388b4c` on 2026-11-24. Recheck source after that commit; mark a card `stale` when its citations no longer support it. Card frontmatter is the status record.

The map covers live browser flows and shared configuration. `dist/`, `node_modules/`, test artifacts and static images are generated, installed, or passive assets, not separate architectural nouns. External consumers cannot be established from this repo alone; the sibling `../tda` links to this repository but does not name a source path.
