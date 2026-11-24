# Map schema

Cards are kebab-case Markdown files. `object` cards describe durable source-owned nouns; `process` cards describe verified movements. `effects/CONTEXT.md` is an index, not another card type.

Object frontmatter: `type: object`, `cluster`, `universe`, `status`, `verified_on`, `revision`, `entity`. Process frontmatter: `type: process`, `status`, `verified_on`, `revision`, `consumes`, `produces`. Allowed universes are `live`, `leftover`, `ghost`; allowed statuses are `stub`, `verified`, `stale`. A verified card must cite source lines and carry a date and revision.

Use **Hits** for direct consumers or owned files. **Does not hit** names a plausible but independent component. Follow source for deeper effects. Links and paths are relative. `_index.md` files are generated with `python3 -I map/_tools/index.py map/objects/<cluster> map/processes`; do not edit them.
