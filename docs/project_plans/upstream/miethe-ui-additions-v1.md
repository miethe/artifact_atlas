---
schema_version: "1.0"
doc_type: report
report_category: handoff
title: "@miethe/ui Upstream Additions — UI Polish Pass (v1)"
description: >
  Handoff plan from the Artifact Atlas project to the @miethe/ui package (skillmeat).
  Specifies five targeted additions that AA needs for the UI Polish Pass feature,
  plus the required 0.6.0 publish step. Each entry cites the exact source location
  of the gap, proposes a concrete API shape grounded in the package's live conventions,
  and states AA's acceptance criteria and phase dependency.
status: draft
created: 2026-06-20
updated: 2026-06-20
feature_slug: ui-polish-pass
target_repo: "skillmeat (@miethe/ui package)"
related_documents:
  - docs/project_plans/spikes/ui-polish-pass-spike.md
---

# @miethe/ui Upstream Additions — UI Polish Pass (v1)

> Scope: ADR-6 of the UI Polish Pass SPIKE (see related document above) decided that work
> benefiting all `@miethe/ui` consumers goes UPSTREAM as a separate plan. This document is
> that plan. It is authored by the Artifact Atlas (AA) project and handed off to the
> `@miethe/ui` maintainer (currently the same person/team via skillmeat). AA does not fork
> the library; it files these additions and provides thin local shims if upstream lands late.

---

## Background: Why These Five Additions

AA needs a multi-format asset viewer (`AssetViewer` dispatcher, SPIKE §3) that relies on
`ContentPane` as its text/code/markdown rendering surface. Four of the five gaps below are
in that surface. The fifth — publishing 0.6.0 — is a prerequisite to consuming any of them.

All file references in the gap column point to the live source tree:
`skillmeat/skillmeat/web/packages/ui/src/`

---

## Addition 1 — Shiki Syntax Highlighting in ContentPane / ContentDisplay

**Component / file:** `src/content-viewer/ContentPane.tsx` → internal `ContentDisplay` component
(lines 324–340)

**The gap (with file ref):**
`ContentDisplay` renders non-markdown code files as a plain, unstyled `<pre>` with no language
awareness (line 335: `<pre className="... font-mono text-xs leading-6">{content}</pre>`). The
`isEditableFile` guard (lines 115–130) identifies `.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.json`,
`.yml`, `.yaml`, `.toml`, `.txt` — but none of these get syntax highlighting; they all fall through
to raw text. Confirmed UPSTREAM classification: leg-4 §6, SPIKE §7 row "Code view (syntax-hl)".

**Proposed API / prop shape:**

Add an optional `codeHighlight` boolean to `ContentPaneProps` (mirrors the existing
`codeHighlight` prop on `ArticleViewer` — same name, same semantics, consistent with package
conventions). When `true`, replace `ContentDisplay` with a `HighlightedDisplay` component that
calls `shiki` (v4.x) server-side or in an RSC boundary:

```ts
// ContentPaneProps addition (additive, backward-compat)
export interface ContentPaneProps {
  // ... existing props unchanged ...

  /**
   * When true, non-markdown code files are syntax-highlighted using shiki.
   * Language is detected from `path` extension and validated against shiki's
   * known-language list before calling codeToHtml(). Falls back to plain
   * ContentDisplay for unknown extensions.
   * @default false
   */
  codeHighlight?: boolean;
}
```

Internal implementation sketch (does not need to be exact — the maintainer owns this):

```ts
// In ContentPane: replace the ContentDisplay branch for code files
if (codeHighlight && path && !isMarkdown) {
  return <HighlightedDisplay path={path} content={displayContent} />;
}

// HighlightedDisplay: RSC-safe, server component
// 1. Derive lang = extensionToShikiLang(path)  // validate against bundledLanguages
// 2. If lang unknown → fall back to <ContentDisplay>
// 3. const html = await codeToHtml(content, { lang, theme: 'github-light' })
// 4. <div dangerouslySetInnerHTML={{ __html: html }} className="..." />
```

`shiki` 4.x is RSC-safe (no DOM dependency); grammar files are lazy-loaded per language so only
selected extensions add bundle weight. Validate language string against `bundledLanguages` before
calling `codeToHtml()` — unknown extensions must fall through gracefully.

**Backward-compat note:** `codeHighlight` defaults to `false`. All existing callers that do not
pass it see zero behavior change. The `ContentDisplay` component is unchanged and remains the
fallback path.

**Acceptance criteria:**
1. `<ContentPane path="src/index.ts" content={src} codeHighlight />` renders TypeScript with
   token colors (not a grey blob of text).
2. Language detection covers at minimum: `.ts/.tsx`, `.js/.jsx`, `.py`, `.json`, `.yml/.yaml`,
   `.toml`, `.md` (no double-render — markdown still routes through `SplitPreview`).
3. Unknown extensions (e.g. `.xyz`) fall through to `ContentDisplay` without throwing.
4. AA-side: `sanitize={true}` and `codeHighlight={true}` can coexist without conflict (shiki
   output is already escaped HTML; `sanitize` only affects the markdown path).
5. Build passes `tsc --noEmit`; no new peer-dep required beyond adding `shiki` to `dependencies`.

**Effort:** M (shiki integration + language map + fallback + tests)

**AA phase:** Phase 4 (Multi-format asset viewer). AA can shim locally with a bare
`<ContentDisplay>` until this ships; the shim is swapped out once 0.6.x publishes this.

---

## Addition 2 — CodeMirror 6 Multi-Language Lang Packs + CodeEditor Surface

**Component / file:** `src/editor/MarkdownEditor.tsx` (lines 1–204); `src/content-viewer/ContentPane.tsx` edit path (lines 549–617 — markdown only); `src/editor/index.ts`

**The gap (with file ref):**
`MarkdownEditor` bundles exactly one language grammar: `@codemirror/lang-markdown` (line 6 of
`MarkdownEditor.tsx`; line 146 of `package.json` `dependencies`). `ContentPane` dispatches
non-markdown editable files (`.ts`, `.py`, `.json`, etc.) to `isEditing` state but never routes
them to a `SplitPreview`-equivalent editor — they stay on the plain `ContentDisplay` read-only
path (lines 619–664). Clicking "Edit" on a `.ts` file wires up Edit/Save buttons but the edit
area is still a `<pre>`. Confirmed UPSTREAM: leg-2 §2.3, leg-4 §7, SPIKE §7 row "Code edit".

**Proposed API / prop shape:**

Export a new `CodeEditor` component from `@miethe/ui/editor` that wraps the existing raw
CodeMirror 6 setup in `MarkdownEditor` but accepts a `language` prop instead of hardcoding
`@codemirror/lang-markdown`:

```ts
// New export in src/editor/CodeEditor.tsx
// Mirrors MarkdownEditorProps exactly; adds one required prop.
export interface CodeEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
  className?: string;
  /**
   * CodeMirror language to use. Pass the result of the appropriate
   * @codemirror/lang-* factory function, or omit for plain-text mode.
   * Consumers are responsible for importing the lang pack they need;
   * ContentPane's internal dispatcher handles this for supported extensions.
   * @default undefined (plain text, no syntax grammar)
   */
  language?: LanguageSupport;
}

export function CodeEditor({ ..., language }: CodeEditorProps): JSX.Element
```

Additionally, update `ContentPane`'s non-markdown edit path to lazy-load `CodeEditor` (mirrors
how `SplitPreview` is lazy-loaded for markdown, lines 27–29) with a language resolved from
`path`. Add the following lang packs to `package.json` `dependencies`:

```jsonc
"@codemirror/lang-javascript": "^6.x",   // covers .ts/.tsx/.js/.jsx via typescript option
"@codemirror/lang-python": "^6.x",
"@codemirror/lang-json": "^6.x",
"@codemirror/lang-css": "^6.x"
// @codemirror/lang-yaml is community; omit or add if a suitable package exists
// TOML: omit unless a maintained CM6 package is found
```

`@codemirror/state` is already a direct dependency (package.json line 129). Consumers MUST
resolve a single instance — document this and add a pnpm/npm `overrides` recommendation in
README.

**Backward-compat note:** `CodeEditor` is an entirely new export. Existing `MarkdownEditor`
and `SplitPreview` are unchanged. `ContentPane`'s non-markdown edit path currently does nothing
useful (shows a `<pre>` even in "editing" state); routing it to `CodeEditor` is a behavior
improvement with no regression for callers.

**Acceptance criteria:**
1. `<ContentPane path="app/page.tsx" content={src} onEditStart={...} onSave={...} />` opens a
   TypeScript-aware CodeMirror editor (syntax colors, correct indent) when "Edit" is clicked.
2. `<ContentPane path="config.json" ... />` opens a JSON-aware editor.
3. `<ContentPane path="script.py" ... />` opens a Python-aware editor.
4. A single `@codemirror/state` instance resolves at runtime (verify with `npm ls @codemirror/state`).
5. React 19 StrictMode double-mount is handled: `EditorView.destroy()` called in effect cleanup
   (already done in `MarkdownEditor` at line 181; same pattern required in `CodeEditor`).
6. Bundle: CodeEditor chunk is lazy-loaded and never downloaded for read-only or markdown files.

**Effort:** M (new CodeEditor component + lang pack wiring in ContentPane + tests)

**AA phase:** Phase 4. AA can defer non-markdown editing entirely (render as read-only) until this
ships — the code-edit flow is not Phase 1 blocking.

---

## Addition 3 — Reactive Dark-Mode in MarkdownEditor

**Component / file:** `src/editor/MarkdownEditor.tsx` lines 134–183 (the mount-only `useEffect`)

**The gap (with file ref):**
Theme is selected once at mount: `const isDarkMode = window.matchMedia(...).matches` (line 138),
captured in the `EditorState.create()` extensions array (line 162: `isDarkMode ? darkTheme : lightTheme`).
The effect dependency array is empty (`[]`, line 183) — the editor never re-creates or reconfigures
when the user switches dark/light mode after mount. Confirmed gap: leg-2 §5, leg-2 §2.3 "no
reactive dark-mode switch".

**Proposed API / prop shape:**

No new props required. This is a pure internal fix using CM6's `EditorView.dispatch` +
`Compartment` to swap the theme extension at runtime, or a `MediaQueryList` listener:

```ts
// In MarkdownEditor.tsx — add a MediaQueryList listener alongside the existing effect

const themeCompartment = new Compartment();

// In effect, replace direct theme selection with:
const mql = window.matchMedia('(prefers-color-scheme: dark)');
const getTheme = () => (mql.matches ? darkTheme : lightTheme);

// Initial state: replace the static `isDarkMode ? darkTheme : lightTheme` with:
themeCompartment.of(getTheme())  // inside extensions array

// Add listener to swap compartment when preference changes:
const handleChange = () => {
  editorRef.current?.dispatch({
    effects: themeCompartment.reconfigure(getTheme()),
  });
};
mql.addEventListener('change', handleChange);
// Cleanup:
return () => {
  mql.removeEventListener('change', handleChange);
  view.destroy();
};
```

Both `lightTheme` and `darkTheme` objects are already defined in the file (lines 28–99) — no new
CSS is needed.

**Backward-compat note:** Purely internal. No prop changes. All existing callers see improved
behavior (editor now tracks OS preference changes). AA note: AA is intentionally light-only
(SPIKE §1 out-of-scope), so this fix is a nice-to-have for AA but a correctness fix for
SkillMeat and other consumers who support dark mode.

**Acceptance criteria:**
1. Open `MarkdownEditor`; switch OS from light → dark while the editor is mounted; editor
   background and token colors update without remount.
2. Switch back dark → light; editor updates again.
3. `MediaQueryList` listener is removed in the effect cleanup; no memory leak.
4. React 19 StrictMode double-mount: effect runs twice; second mount re-attaches the listener
   correctly (verify via `editorRef.current?.destroy()` guard before creating a new view).

**Effort:** S (single effect refactor, no new deps, no API changes)

**AA phase:** Phase 5 (Facelift pass) — AA is light-only, so this does not block any AA phase.
Still requested so SkillMeat consumers benefit. Should be trivially batchable with Addition 1 or 2.

---

## Addition 4 — Optional Image-Preview Slot in ContentPane

**Component / file:** `src/content-viewer/ContentPane.tsx` — the extension dispatch path
(currently there is no image branch; unknown extensions fall through to `ContentDisplay`)

**The gap (with file ref):**
`ContentPane` dispatches on `isMarkdownFile()` (line 429) and `isEditableFile()` (line 428) but
has no branch for image extensions (`.png`, `.jpg`, `.gif`, `.svg`, `.webp`). There is no image
preview path anywhere in the package. Confirmed gap: leg-2 §5 "Images — Not present", leg-4 §1
classification "COVERED (partial)" (only because AA's existing `AssetPreview` does a bare `<img>`
outside of ContentPane — not inside).

AA's rationale for requesting an UPSTREAM slot rather than a purely LOCAL implementation: a
pluggable binary-renderer hook standardizes the extension seam for all consumers, keeps heavy
deps (next/image, react-pdf, docx-preview) out of the library core, and gives SkillMeat a
documented compose pattern for any future binary preview needs.

**Proposed API / prop shape:**

Add an optional `renderBinaryPreview` render prop to `ContentPaneProps`. When provided and the
file extension is not in `isEditableFile`'s list (and not `.md`), call the render prop instead
of `ContentDisplay`. The library passes the detected extension and raw content string; the
consumer supplies the renderer.

```ts
// ContentPaneProps addition
export interface ContentPaneProps {
  // ... existing props unchanged ...

  /**
   * Optional render prop for binary / non-text file types.
   * Called when `path` has an extension that ContentPane does not handle
   * natively (i.e. not in the editable-text list and not .md).
   * The consumer is responsible for rendering the content (e.g. next/image
   * for images, react-pdf for PDFs). ContentPane handles the surrounding
   * breadcrumb header and scroll region.
   *
   * @param ext - Lowercase extension including dot, e.g. ".png", ".pdf"
   * @param content - Raw string content if available; null for binary blobs
   *                  that must be fetched separately by the consumer.
   * @returns A React node, or null to fall through to ContentDisplay.
   */
  renderBinaryPreview?: (ext: string, content: string | null) => React.ReactNode | null;
}
```

Internal dispatch addition (after the markdown branch, before the final return):

```ts
// In ContentPane's render logic, after the isMarkdown branch:
if (!isEditableFile(path) && renderBinaryPreview) {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
  const binaryNode = renderBinaryPreview(ext, content);
  if (binaryNode !== null) {
    return (
      <div role="region" aria-label={ariaLabel || `File preview: ${path}`} ...>
        {/* existing breadcrumb header */}
        <ScrollArea className="...">
          {binaryNode}
        </ScrollArea>
      </div>
    );
  }
}
// fallthrough to ContentDisplay
```

**Backward-compat note:** `renderBinaryPreview` is optional; default is `undefined`. No callers
are affected unless they opt in. The fallthrough means even callers that pass the prop can return
`null` to get the existing `ContentDisplay` behavior.

**Acceptance criteria:**
1. `<ContentPane path="photo.png" content={null} renderBinaryPreview={(ext) => <img src={url} />} />`
   renders the image inside ContentPane's breadcrumb/scroll wrapper.
2. `renderBinaryPreview` returning `null` falls through to `ContentDisplay` (existing behavior).
3. Editable text extensions (`.ts`, `.md`, etc.) are never routed through `renderBinaryPreview`.
4. The breadcrumb, loading state, and error state work identically for binary preview paths.
5. TypeScript: `renderBinaryPreview` prop is fully typed; no `any` at the boundary.

**Effort:** S (prop addition + one dispatch branch; consumer supplies all heavy rendering logic)

**AA phase:** Phase 4 (Multi-format viewer). AA will pass a local `renderBinaryPreview`
implementation that selects `next/image`, `PdfViewer`, or `DocxViewer` based on extension.
This is the cleanest seam for keeping PDF/DOCX deps out of `@miethe/ui` core.

---

## Addition 5 — Publish @miethe/ui@0.6.0 to npm (Release Step)

**Component / file:** `package.json` (root); `scripts.publish:npm = "npm publish --access public"`;
`README.md`

**The gap (with file ref):**
npm latest is `0.3.0` (published; missing `ArticleViewer`, added at 0.5.0, and `react-hook-form`/
`zod` form components, added at 0.6.0). Source tree `package.json` `"version": "0.6.0"` (line 3)
is unpublished WIP. Confirmed by `verify:ui-adoption` finding; leg-2 §1 preamble; SPIKE §4.2 item 1.

**What must be included in the 0.6.0 publish:**

The publish must include at minimum the 0.6.0 source state plus Additions 1 and 4 from this
document (the minimum set required by AA Phase 1). Additions 2 and 3 can follow in a 0.6.x patch.

**Release checklist (in order):**

1. Merge/finalize any in-flight WIP on the 0.6.0 branch.
2. Apply Additions 1 and 4 (shiki highlight + renderBinaryPreview slot).
3. Run `pnpm clean && pnpm build` and verify `dist/` is generated with correct subpath exports.
4. Update `CHANGELOG.md` with entries for 0.6.0 (noting `ArticleViewer`, form deps, shiki
   highlighting, `renderBinaryPreview` — all new since 0.3.0).
5. Expand `README.md` to document:
   - **Required shadcn-compatible CSS vars** in the consumer's `globals.css` (the token contract;
     leg-2 §3.1 lists them: `--background`, `--foreground`, `--muted`, `--muted-foreground`,
     `--card`, `--accent`, `--border`, `--ring`, etc.).
   - **Required Tailwind `content` glob**: `'./node_modules/@miethe/ui/dist/**/*.{js,mjs}'`.
   - **Subpath-import-only rule**: never import from the root barrel in a Server Component
     (the root `src/index.ts` re-exports client modules without a `'use client'` directive).
   - **Single `@codemirror/state` instance**: add `overrides` / `resolutions` to force dedup.
6. `npm publish --access public` (or `pnpm run publish:npm`).
7. Verify `npm info @miethe/ui version` returns `0.6.0`.

**Backward-compat note:** 0.6.0 is a minor version bump from 0.3.0 (no semver major). The
`ArticleViewer` and form components are additive. `ContentPaneProps` additions are opt-in props
with safe defaults. No removals or prop renames relative to 0.3.0.

**Effort:** S (build + publish + CHANGELOG/README; build infra is already wired via
`prepublishOnly` hook in `package.json` line 97)

**AA phase:** Blocks ALL AA phases. Phase 1 (design-system foundation) begins by pinning
`"@miethe/ui": "^0.6.0"` in AA's `web/package.json`. Nothing in the AA polish pass can land
until 0.6.0 is on npm.

---

## How AA Consumes This (Summary)

Full detail is in the SPIKE (related document above, §4.3). Short version:

**Subpath imports only.** AA imports `@miethe/ui/primitives`, `@miethe/ui/content-viewer`,
`@miethe/ui/editor`, `@miethe/ui/diff`. Never the root barrel from a Server Component.

**Token bridge.** AA authors a shadcn-compatible CSS-var layer in `web/app/globals.css` mapping
the ~15 shadcn semantic tokens (`--background`, `--foreground`, `--muted`, `--muted-foreground`,
`--card`, `--card-foreground`, `--border`, `--ring`, `--primary`, `--accent`, `--accent-foreground`,
`--secondary`, `--secondary-foreground`, `--destructive`, `--input`) onto AA's existing
`--surface`, `--ink-*`, `--brand-*` palette. This is purely additive; it does not disturb AA's
own tokens.

**Tailwind content glob.** `web/tailwind.config.ts` `content` array gains:
`'./node_modules/@miethe/ui/dist/**/*.{js,mjs}'`

**Transpile config.** `web/next.config.ts` `transpilePackages: ['@miethe/ui']` plus
`serverExternalPackages` for the remark/rehype ESM graph and `@codemirror/*`.

**Single `@codemirror/state`.** AA adds a pnpm `overrides` (or npm `overrides`) entry forcing
a single resolution. Verified with `npm ls @codemirror/state` in CI.

**Duplicate major deps accepted.** `lucide-react` ^1.21.0 (AA) vs ^0.575.0 (library) and
`tailwind-merge` ^3.x (AA) vs ^2.5.4 (library) will each ship two copies. Accepted; cost is
measured with bundle analyzer before rollout.

---

## Sequencing: Minimum Set for AA Phase 1

Phase 1 (design-system foundation) is the hard gate for all subsequent AA polish work. It
requires exactly:

| Addition | Must ship in 0.6.0? | Rationale |
|---|---|---|
| Addition 5 — Publish 0.6.0 | YES — blocks everything | AA cannot install or import the package without a published version |
| Addition 1 — Shiki highlights | YES — ship in 0.6.0 | ContentPane is the Phase 4 rendering surface; shim is acceptable for Phase 1–3 but must be in 0.6.0 for Phase 4 cutover |
| Addition 4 — renderBinaryPreview slot | YES — ship in 0.6.0 | AA Phase 4 AssetViewer wires next/image + PdfViewer through this prop; without it AA must wrap ContentPane or fork the binary path |
| Addition 3 — Reactive dark-mode | NO — can be 0.6.x patch | AA is light-only; not blocking any AA phase |
| Addition 2 — CM6 lang packs / CodeEditor | NO — can be 0.6.x patch | Non-markdown code editing is Phase 4; AA falls back to read-only ContentDisplay until this ships |

**Summary:** 0.6.0 must include: publish itself (Addition 5) + shiki highlights (Addition 1) +
`renderBinaryPreview` slot (Addition 4). Additions 2 and 3 can follow as 0.6.1 or 0.6.2 patches.
