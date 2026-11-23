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
- **Interpretation.** A complete formula opens a separate view where each variable is set to true
  or false. The tree shows the value of every node as soon as it is decided, a step-by-step list
  writes out each subformula with the values it was computed from, and the chosen values are saved
  with the formula.
- **Classification.** A complete formula is marked valid, satisfiable but not valid, or
  unsatisfiable, and the interpretation view offers a model and a counter-model to load.
- **Truth table.** Every interpretation with the value of every distinct subformula, the current
  one highlighted and each row loadable into the variables, exported to LaTeX, CSV or Markdown.
- **Workspace.** Several named formulas in a searchable list, sorted into colored folders by
  dragging or through a menu, where each formula can be renamed, duplicated, moved or deleted.
- **Work area.** The tree is fitted to the window and can be panned and zoomed with the pointer or
  two fingers, within bounds that keep it on screen.
- **Exports.** Image exports reproduce what the workspace shows, including both shapes of an
  undecided group, and downloads are named after the formula, with a spinner while the file is
  prepared and a check once it is saved. The whole workspace, folders included, can be written to
  JSON and read back.
- **Search and sharing.** A descriptive title and summary in both languages, a preview image with
  the logo for shared links, structured data, a sitemap and icons for every platform.
- **Persistence.** Debounced automatic saving to IndexedDB, with the formulas and the active one
  restored on the next visit, and an action that clears the saved data.
- **Interface.** A full-screen work area with floating control islands, light and dark themes, and
  English and Romanian, each remembered between visits.
