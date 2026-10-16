# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- pnpm workspace with the `@nodable/engine`, `@nodable/sdk` and `@nodable/web` packages.
- Shared TypeScript, ESLint, Prettier, Vitest and Playwright configuration.
- Continuous integration and GitHub Pages deployment workflows.
- Community documentation: readme, contributing guide, code of conduct, security policy, issue and
  pull request templates.
- Engine: immutable tree model, tokenizer with ASCII alias normalization, builder implementing the
  course placement rules with per-token build steps, and a validator producing diagnostics
  `NDB001` to `NDB007` and allowed-next hints.
- SDK: sessions, tree layout, exporters for SVG, PNG, JSON, LaTeX and plain text, workspace
  serialization, and a storage adapter interface.
- Web: application shell with the formula bar, connective toolbar, hints and diagnostics, light,
  dark and system themes, and English and Romanian translations.
- Web: tree canvas with the cursor arrow, dotted slots, the A and B choice, and short transitions.
- Web: node dragging with keyboard nudging, build-step replay, a view of all trees at once, and a
  toggle that highlights variables.
