# Objects

This shelf holds source-linked cards for components that an editor might change.

## Inputs

- Reference (every run): `../_meta/schema.md`
- Reference (every run): `../../AGENTS.md`
- Working (this run): the source path in the selected card’s `entity` field

## Process

1. Choose the relevant cluster: [pages](pages/_index.md), [performance](performance/_index.md), or [editors](editors/_index.md).
2. Open one card and verify its citations against the source before using its impact notes.
3. After editing a card, run `python3 -I map/_tools/index.py map/objects/pages map/objects/performance map/objects/editors` from the repository root.

## Outputs

- One card in the relevant cluster and its generated `_index.md`.

## Check

The editor confirms that each changed claim has a source citation and that each **Hits** entry is a direct relationship.
