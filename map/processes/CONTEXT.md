# Processes

This shelf records movements that run in the browser, with inputs, steps and outputs.

## Inputs

- Reference (every run): `../_meta/schema.md`
- Working (this run): the object cards listed in a process card’s `consumes` field

## Process

1. Open one process from [_index.md](_index.md).
2. Trace each cited step in source before changing a flow.
3. After changing a card, run `python3 -I map/_tools/index.py map/processes` from the repository root.

## Outputs

- A verified process card and generated `_index.md`.

## Check

The editor confirms that the cited movement runs from its named input to its named output.
