# Contributing

Thank you for considering a contribution to Nodable.

## Setup

```bash
corepack enable
pnpm install
pnpm dev
```

Use the Node version in [.nvmrc](.nvmrc) and pnpm only. Do not run `npm` or `yarn`, and do not add
`package-lock.json` or `yarn.lock`.

Install dependencies into the package that needs them:

```bash
pnpm --filter @nodable/web add d3-hierarchy
pnpm --filter @nodable/engine add -D vitest
pnpm add -Dw prettier
```

## Branches

`main` is always releasable. Work on a branch named `<type>/<short-kebab-description>`, for example
`feat/step-replay-slider` or `fix/ndb003-range`. Pull requests are merged with squash or rebase so
history stays linear.

## Commits

Commits follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/). Each
commit is atomic: one logical change that builds and passes `pnpm check` on its own.

```
<type>(<scope>): <subject>

<body>

<footer>
```

- Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `build`, `ci`, `chore`,
  `revert`.
- Scopes: `engine`, `sdk`, `web`, `i18n`, `theme`, `export`, `storage`, `docs`, `deps`, `repo`.
- The subject is imperative, lowercase, without a trailing period, at most 72 characters.
- The body explains what changed and why, wrapped at 72 characters.
- Use `BREAKING CHANGE:` in the footer for incompatible API changes, and `Closes: #<issue>` to link
  an issue.

## Code standards

- TypeScript in strict mode. No `any`, no non-null assertions, named exports only.
- **No comments in source code.** Code explains itself through clear names, small functions and
  explicit types. Anything that needs an explanation belongs in `docs/`. This is enforced by a lint
  rule.
- Files are kebab-case, Svelte components are PascalCase, types are PascalCase, functions and
  variables are camelCase, constants are UPPER_SNAKE_CASE.
- Use the domain vocabulary consistently: formula, token, connective, operand, variable, node, slot,
  group, leaf, cursor, step, diagnostic, session, workspace.
- Svelte 5 runes only. Components render and dispatch; logic lives in the SDK or `lib/state`.
- Colors, spacing and radii come from theme CSS custom properties.
- Layers depend downward only: `apps/web` uses `packages/sdk`, which uses `packages/engine`. Import
  a package only through its `src/index.ts`.

## Tests

- Engine changes need unit tests. The engine targets 100% branch coverage.
- SDK changes need tests for sessions, exports and workspace round-trips.
- User interface changes need Playwright coverage where behavior is observable.
- Test names describe behavior, for example `moves cursor up after a variable`.

```bash
pnpm test
pnpm test:e2e
```

## Pull request checklist

- [ ] `pnpm check` passes with zero warnings.
- [ ] New behavior has tests.
- [ ] No comments were added to source files.
- [ ] `docs/` and `README.md` reflect the change.
- [ ] New user interface text exists in both `en.json` and `ro.json`.
- [ ] Both themes were checked, with a screenshot for visual changes.
- [ ] Commits follow the convention above.
