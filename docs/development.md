# Development

## Setup

```bash
corepack enable
pnpm install
```

Node must match [.nvmrc](../.nvmrc). pnpm is pinned through the `packageManager` field in the root
`package.json`, so Corepack installs the right version automatically. Use pnpm only; `npm` and
`yarn` lockfiles are not accepted.

## Scripts

| Script              | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `pnpm dev`          | Start the web app in development mode                  |
| `pnpm build`        | Build all packages and the app                         |
| `pnpm test`         | Run all unit tests                                     |
| `pnpm test:e2e`     | Run Playwright tests                                   |
| `pnpm lint`         | ESLint across the workspace                            |
| `pnpm format`       | Prettier write                                         |
| `pnpm format:check` | Prettier check                                         |
| `pnpm typecheck`    | `tsc --noEmit` and `svelte-check` across the workspace |
| `pnpm check`        | Lint, format check, typecheck and test in sequence     |

Run `pnpm check` before every commit.

## Workspace layout

`@nodable/engine` and `@nodable/sdk` are internal source-only packages: their `exports` field points
straight at `src/index.ts`, and Vite compiles them as part of the app build. They have no build step
of their own, so `pnpm build` builds the web app, and `pnpm typecheck` is what verifies that the
packages compile.

Add a dependency to the package that needs it:

```bash
pnpm --filter @nodable/web add d3-hierarchy
pnpm --filter @nodable/engine add -D vitest
pnpm add -Dw prettier
```

TypeScript is pinned to the 6.0 line because `typescript-eslint` does not yet support the 7.x
compiler. Raise the pin once type-aware linting supports it.

## Testing

Unit tests run on Vitest and live in a `tests/` folder next to `src/`, mirroring its structure, with
files named `*.test.ts`. Test names describe behavior, for example
`moves cursor up after a variable`.

```bash
pnpm test
pnpm --filter @nodable/engine coverage
```

The engine targets 100% branch coverage, enforced by the coverage thresholds in
`packages/engine/vitest.config.ts`.

End-to-end tests use Playwright against a production preview build:

```bash
pnpm --filter @nodable/web exec playwright install chromium
pnpm test:e2e
```

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request: install with a frozen lockfile,
lint, format check, typecheck, unit tests, build, then end-to-end tests.

`.github/workflows/deploy.yml` publishes `apps/web` to GitHub Pages on every push to `main`. The
build reads `BASE_PATH` so the app works from a project subpath.

## Release process

1. Make sure `main` is green and `pnpm check` passes locally.
2. Move the entries under `## [Unreleased]` in `CHANGELOG.md` into a new version heading with the
   release date, following Keep a Changelog and Semantic Versioning.
3. Bump the version in the root `package.json` and in each workspace package.
4. Commit as `chore(repo): release vX.Y.Z`.
5. Tag with `git tag -a vX.Y.Z -m "vX.Y.Z"` and push the tag.
6. Publish a GitHub release using the changelog entry as the body.
