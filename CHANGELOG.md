# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

First working version of Nodable.

### Added

- **Engine.** Tokenizer with ASCII alias normalization and case-sensitive variable names, a builder
  that applies the placement rules of the course and records every intermediate step, and a
  validator producing the diagnostics `NDB001` to `NDB007` and the set of tokens allowed next.
- **SDK.** Sessions, tree layout, workspaces with JSON serialization, a storage adapter interface,
  and exporters for SVG, PNG, JSON, LaTeX and plain text.
- **Tree.** The tree is rebuilt on every keystroke, with an arrow on the position the next token
  fills, dotted boxes for what is still missing, and the formula marked complete when the cursor
  passes the root.
- **Undecided groups.** After an open parenthesis both possible shapes of the group are drawn side
  by side until the next token decides between them.
- **Step replay.** A slider renders any earlier state of the construction.
- **Workspace.** Several named formulas, a picker to switch between them, and removal of the
  active one.
- **Work area.** The tree is fitted to the window and can be panned and zoomed with the pointer or
  two fingers, within bounds that keep it on screen.
- **Exports.** Image exports reproduce what the workspace shows, including both shapes of an
  undecided group, and downloads are named after the formula. The whole workspace can be written
  to JSON and read back.
- **Persistence.** Debounced automatic saving to IndexedDB, with the formulas and the active one
  restored on the next visit, and an action that clears the saved data.
- **Interface.** A full-screen work area with floating control islands, light and dark themes, and
  English and Romanian, each remembered between visits.
