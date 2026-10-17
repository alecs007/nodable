<div align="center">

<img src="assets/logo/logo.svg" alt="" width="88">

# Nodable

Syntax trees for propositional logic formulas, in the browser.

[![CI](https://github.com/[OWNER]/nodable/actions/workflows/ci.yml/badge.svg)](https://github.com/[OWNER]/nodable/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Latest release](https://img.shields.io/github/v/release/[OWNER]/nodable?sort=semver)](https://github.com/[OWNER]/nodable/releases)

</div>

![The tree of a complete formula](assets/screenshots/overview.png)

Type a formula and the tree is rebuilt on every keystroke, following the placement rules of the
Computational Logic course. Everything runs in the browser: no account, no server, no tracking.

## Features

- An arrow marks where the next token goes, and dotted boxes show what is still missing.
- A slider replays the construction from the first token to the last.
- Errors are reported in plain words, and the last valid tree is kept.
- Several named formulas per workspace, saved locally.
- Export to SVG, PNG, LaTeX or plain text.
- English and Romanian, light and dark.

## Undecided groups

![Both possible shapes of an undecided group](assets/screenshots/variants.png)

After an open parenthesis, a group can still become a single or a double node. Nodable draws both
trees until the next token decides which one it is.

## Node details

![A selected node and its description](assets/screenshots/node.png)

Select a node to read what it is. The main connective of the formula is marked as such.

## Dark theme

![The same tree in the dark theme](assets/screenshots/dark.png)

## Quick start

Node.js as pinned in [.nvmrc](.nvmrc), and pnpm through Corepack.

```bash
corepack enable
pnpm install
pnpm dev
```

`pnpm build` writes the static site to `apps/web/dist`.

## Writing formulas

Formulas are fully parenthesized: every connective and every negation has its own parentheses, as
in `((¬p) ∨ q)`. A single variable such as `p` is also a formula.

| Connective  | Symbol | Also accepted |
| ----------- | ------ | ------------- |
| Negation    | `¬`    | `!` `~`       |
| Conjunction | `∧`    | `&` `/\`      |
| Disjunction | `∨`    | `\|` `\/`     |
| Implication | `→`    | `->` `=>`     |
| Equivalence | `↔`    | `<->` `<=>`   |

A variable is a letter followed by digits, such as `p`, `q1` or `P2`. Names are case sensitive and
spaces are ignored.

| Input          | Action                    |
| -------------- | ------------------------- |
| `Enter`        | Start another formula     |
| `Escape`       | Clear the formula         |
| Wheel or pinch | Zoom                      |
| Drag           | Move around the workspace |

The complete rules and the diagnostic codes are in [docs/notation.md](docs/notation.md).

## Architecture

```
apps/web        interface (Svelte)
   ↓
packages/sdk    sessions, layout, exports
   ↓
packages/engine tokenizer, builder, validator
```

Dependencies point downward only. The engine is pure and deterministic; the interface imports from
the SDK and nothing else. See [docs/architecture.md](docs/architecture.md).

## Contributing

Scripts, tests and the release process are in [docs/development.md](docs/development.md). The
conventions are in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE).

## Acknowledgements

The notation and the construction method follow the Computational Logic university course.
