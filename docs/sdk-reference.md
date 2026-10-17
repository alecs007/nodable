# SDK Reference

`@nodable/sdk` is the only module the web app imports from. It wraps `@nodable/engine` in a small,
stable API and owns sessions, layout, exporters and workspaces.

Everything is immutable: a function that changes a session returns a new session and never mutates
its arguments. Nothing in the SDK throws for invalid user data; failures come back as diagnostics.

```ts
import { createSession, getTree, layoutTree, updateInput } from '@nodable/sdk'
```

## Sessions

A session is one formula: its input text, the analysis the engine produced from it, and the layout
offsets of its nodes.

```ts
type Session = {
  readonly id: SessionId
  readonly name: string
  readonly input: string
  readonly analysis: Analysis
  readonly offsets: NodeOffsets
}
```

### `createSession(input?: string, name?: string): Session`

Creates a session with a fresh identifier and analyzes the input. Both arguments default to the
empty string; a session without a name is listed by its formula.

```ts
const session = createSession('((¬p) ∨ q)')
```

### `renameSession(session: Session, name: string): Session`

Returns a session with a new name. The formula and the identifier are untouched.

### `restoreSession(id: SessionId, input: string, offsets: NodeOffsets, name?: string): Session`

Rebuilds a session that was stored earlier. The analysis is recomputed from the input, so only the
identifier, the input and the offsets need to be persisted.

### `updateInput(session: Session, input: string): Session`

Re-analyzes the formula and returns a new session, keeping the identifier and the offsets. Returns
the same session object when the input did not change, so the interface can skip a re-render.

### `normalizeInput(session: Session): Session`

Replaces every ASCII alias in the input with its canonical symbol, for example `->` with `→`.

### `getTree(session: Session): TreeSnapshot`

Returns everything needed to draw the tree.

```ts
type TreeSnapshot = {
  readonly root: TreeNode
  readonly cursor: Cursor
  readonly offsets: NodeOffsets
  readonly isComplete: boolean
}
```

### `getSteps(session: Session): readonly BuildStep[]`

Returns the ordered build steps. The first step is the initial state with no token; each later step
holds the tree, the cursor and the number of open parentheses after one more token was applied.

### `getStep(session: Session, index: number): BuildStep | undefined`

Returns one step, or `undefined` when the index is out of range.

### `getStepTree(session: Session, index: number): TreeSnapshot | undefined`

Returns the snapshot of one step, for replaying the build. The current offsets are kept, so a node
the user moved stays where they put it while stepping through.

### `getDiagnostics(session: Session): readonly Diagnostic[]`

Returns the diagnostics of the current input: at most one error, or the `NDB007` warning when the
formula is merely incomplete. See [notation.md](notation.md) for the codes.

### `getAllowedNext(session: Session): readonly TokenKind[]`

Returns the token kinds that may be typed next, for highlighting toolbar buttons and showing a hint.

### `moveNode(session: Session, nodeId: NodeId, offset: Point): Session`

Stores a layout offset for one node, in pixels, relative to its computed position. An offset of
`{ x: 0, y: 0 }` removes the stored entry.

### `resetOffsets(session: Session): Session`

Removes every offset, putting all nodes back where the layout places them.

## Layout

Layout is pure geometry and lives in the SDK, so the web app and the SVG exporter place nodes the
same way. The web app renders the result as Svelte SVG; it does not compute positions itself.

### `layoutTree(snapshot: TreeSnapshot, options?: LayoutOptions): TreeLayout`

```ts
type TreeLayout = {
  readonly nodes: readonly LayoutNode[]
  readonly edges: readonly LayoutEdge[]
  readonly cursor: LayoutCursor
  readonly width: number
  readonly height: number
  readonly options: LayoutOptions
}
```

Nodes come back in document order, each with its center point and depth. Positions are anchored on
the layout computed without offsets, so moving one node leaves every other node where it was, and
the reported size never shrinks below the untouched layout. Edges connect a parent
center to a child center. The cursor carries the point the arrow should mark and whether it sits
above the root, which means the formula is complete. `width` and `height` are the size of the whole
drawing including padding.

`LayoutOptions` sets `nodeWidth`, `nodeHeight`, `horizontalGap`, `verticalGap` and `padding`;
`DEFAULT_LAYOUT_OPTIONS` holds the values used by the interface and the exporters.

## Variants

### `pendingVariants(snapshot: TreeSnapshot): readonly FormulaVariant[]`

While a group is waiting for its arity, this returns the shapes the tree can still take, each one a
full snapshot with the working node already expanded.

```ts
type FormulaVariant = {
  readonly kind: 'double' | 'single'
  readonly snapshot: TreeSnapshot
  readonly pending: readonly NodeId[]
}
```

A group whose first operand is already filled can only become a double node, so it is settled into
one in every variant returned. The innermost group, the one whose first operand is still an empty
slot, is the only one that can still go either way: it produces the double and the single shape.
With nothing undecided the list holds the single settled tree, and with no pending group at all it
is empty. lists the groups whose symbol is not known yet, so the interface can draw them
without one.

## Exporters

### `exportSession(session: Session, format: ExportFormat, options?: LayoutOptions): ExportResult`

`ExportFormat` is `'svg' | 'png' | 'json' | 'latex' | 'text'`.

Text-based formats return the content directly:

```ts
type TextExportResult = {
  readonly kind: 'text'
  readonly format: 'svg' | 'json' | 'latex' | 'text'
  readonly fileName: string
  readonly mimeType: string
  readonly content: string
}
```

PNG is different, because rasterizing needs a canvas and the SDK stays free of browser APIs. The SDK
returns the markup and the pixel size, and the web app draws it:

```ts
type RasterExportResult = {
  readonly kind: 'raster'
  readonly format: 'png'
  readonly fileName: string
  readonly mimeType: 'image/png'
  readonly svg: string
  readonly width: number
  readonly height: number
}
```

| Format  | Output                                                                   |
| ------- | ------------------------------------------------------------------------ |
| `svg`   | A standalone SVG document with its styles inlined                        |
| `png`   | The same markup plus the pixel size, for the interface to rasterize      |
| `json`  | A workspace holding this one session, readable by `deserializeWorkspace` |
| `latex` | A `forest` environment for the LaTeX `forest` package                    |
| `text`  | An indented tree drawn with box characters                               |

The file name comes from the name of the session, reduced to a slug, and falls back to
`nodable-tree` when the session has no name.

`toSvg(panels, title)` and `drawSvg(panels, title)` build that document from one or more laid out
panels; `drawSvg` also reports its pixel size. `toLatex(root)` and `toText(root)` are exported for
callers that only need the markup. A fourth argument to `exportSession` carries the captions of the
variant panels, so no interface text lives in the SDK.

### `nodeLabel(node: TreeNode): string`

The label shown on a node: the variable name, the connective symbol, `□` for an empty slot or `( )`
for a group whose arity is still pending.

## Workspaces

```ts
type Workspace = {
  readonly version: number
  readonly name: string
  readonly activeId: SessionId
  readonly sessions: readonly Session[]
}
```

### `createWorkspace(name?, sessions?, activeId?): Workspace`

Creates a workspace. Without sessions it starts with a single empty one, and without an active
identifier the first session is the active one.

### `addSession`, `removeSession`, `replaceSession`

```ts
addSession(workspace: Workspace, session: Session): Workspace
removeSession(workspace: Workspace, id: SessionId): Workspace
replaceSession(workspace: Workspace, session: Session): Workspace
```

Each returns a new workspace. `replaceSession` matches on the session identifier.

### `serializeWorkspace(workspace: Workspace): string`

Writes the workspace as indented JSON. Only the identifier, the name, the input and the offsets of
each session are stored, together with the identifier of the active one; the analysis is rebuilt on
load.

### `deserializeWorkspace(data: string): Result<Workspace, Diagnostic>`

Reads a workspace back. Malformed JSON, a missing `sessions` array or a session without an
identifier or an input all return `NDB008`. An active identifier that names no stored session falls
back to the first one. Offsets that are not points are dropped rather than
failing the whole load.

```ts
const result = deserializeWorkspace(data)

if (result.ok) {
  use(result.value)
} else {
  report(result.error)
}
```

## Storage

The SDK never touches IndexedDB or `localStorage`. The web app provides an adapter.

```ts
type StorageAdapter = {
  readonly read: () => Promise<string | undefined>
  readonly write: (data: string) => Promise<void>
  readonly clear: () => Promise<void>
}
```

### `saveWorkspace(adapter: StorageAdapter, workspace: Workspace): Promise<void>`

Serializes the workspace and writes it through the adapter.

### `loadWorkspace(adapter: StorageAdapter): Promise<Result<Workspace | undefined, Diagnostic>>`

Reads and deserializes. A successful result with `undefined` means nothing was stored yet.

### `clearWorkspace(adapter: StorageAdapter): Promise<void>`

Clears whatever the adapter holds.

## Result

```ts
type Result<TValue, TError> =
  { readonly ok: true; readonly value: TValue } | { readonly ok: false; readonly error: TError }
```

`ok(value)` and `fail(error)` build the two cases.

## Re-exported engine types

For convenience the SDK re-exports the engine types the interface needs, so the app never imports
`@nodable/engine` directly: `Analysis`, `BuildStep`, `Cursor`, `Diagnostic`, `DiagnosticCode`,
`DiagnosticMessageKey`, `DiagnosticSeverity`, `NodeId`, `NodeKind`, `Token`, `TokenKind`,
`TreeNode` and its variants, the canonical symbols, `childrenOf`, `collectNodes`, `isNodeComplete`,
`leavesOf` and `normalizeFormula`.
