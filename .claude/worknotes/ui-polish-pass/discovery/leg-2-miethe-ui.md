# Leg 2 — @miethe/ui Design System Discovery

**Source:** `/Users/miethe/dev/homelab/development/skillmeat/skillmeat/web/packages/ui`
**Sibling shim:** `/Users/miethe/dev/homelab/development/skillmeat/skillmeat/web/packages/content-viewer-shim` (empty — only `node_modules`, no source)
**Package version on disk:** 0.6.0 (CHANGELOG stops at 0.5.0; `package.json` reports 0.6.0 — the published npm tag advertised as v0.3.0 is stale relative to current source)
**Date:** 2026-06-20

---

## 1. Full Exported Component Inventory

The package uses tree-shakeable subpath exports. Everything below corresponds to the barrel re-exports in `src/index.ts` and each submodule `index.ts`.

### 1.1 `@miethe/ui` / `@miethe/ui/content-viewer`

| Export | Kind | Notes |
|---|---|---|
| `FileTree` | Component | Hierarchical file-tree browser with keyboard support |
| `ContentPane` | Component | File content viewer + CodeMirror editor (lazy-loads editor chunk) |
| `ContentViewerProvider` | Context Provider | Injects `ContentViewerAdapter` into the tree |
| `useContentViewerAdapter` | Hook | Consumes the adapter from context |
| `ArticleViewer` | Component | Read-only markdown/HTML renderer (remark pipeline) |
| `Callout`, `NoteCallout`, `ReferenceCallout`, `WarningCallout`, `InfoCallout` | Components | Callout primitives used inside ArticleViewer |
| `FrontmatterHeader` | Component | Collapsible YAML frontmatter display inline in article |
| `remarkCallouts`, `CALLOUT_TYPES` | Plugin / const | remark plugin for `:::` directives |
| `rehypeExternalLinks`, `isExternalHref` | Plugin / util | Hardens external links |
| `createHighlightPlugin`, `warmHighlightCache` | Plugin factory / util | Opt-in syntax highlighting via lowlight |
| `createHeadingIdsPlugin`, `slugify` | Plugin factory / util | Auto heading IDs |
| `sanitizeWithRehype`, `sanitizeWithDOMPurify`, `warmDOMPurifyCache`, `ARTICLE_VIEWER_SCHEMA` | Utilities | Sanitization helpers |
| `detectFormat` | Utility | Auto-detects 'markdown' or 'html' |
| `VARIANT_CLASSES`, `getVariantTokenNames`, `variantClass` | Utilities | Variant CSS class resolution |
| Types: `ArticleViewerProps`, `ContentPaneProps`, `TruncationInfo`, `ContentViewerAdapter`, `FileTreeAdapter`, `FileContentAdapter`, `AdapterHookOptions`, `AdapterQueryResult`, `FileTreeEntry`, `FileTreeResponse`, `FileContentResponse`, `FileNode`, `ContentFormat`, `ArticleVariant`, `VariantTokenShape`, `FrontmatterDisplayMode`, `FrontmatterData`, `FrontmatterHeaderProps`, `ArticleViewerComponents`, `CalloutProps`, `CalloutType`, `CalloutComponents` | Types | All at boundary, zero `any` |

### 1.2 `@miethe/ui/primitives`

| Export | Kind | Notes |
|---|---|---|
| `Dialog`, `DialogPortal`, `DialogOverlay`, `DialogClose`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription` | Components | Radix Dialog wrappers with shadcn-style Tailwind classes |
| `ModalHeader` | Component | Standard modal header: icon + title + description + actions slot |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Components | Radix Tabs wrappers (pill/rounded style by default) |
| `TabNavigation` | Component | Underline-style tab list; wraps Radix TabsList inside a Tabs context |
| `VerticalTabNavigation` | Component (forwardRef) | Standalone vertical tab list; WAI-ARIA compliant; manages own keyboard nav; usable outside Radix context |
| `BaseArtifactModal` | Component | Full modal composition: Dialog + ModalHeader + optional return-nav + TabNavigation + children slot; controlled by `activeTab`/`onTabChange`; resolves Lucide icons dynamically via `getTypeConfig` |
| `Card`, `CardHeader`, `CardContent`, `CardFooter` | Components | Composable card surface with rounded border and shadow |
| `Badge`, `badgeVariants` | Component / CVA | Standard badge with `default`, `secondary`, `outline`, `destructive` variants |
| `ScrollArea`, `ScrollBar` | Components | Radix ScrollArea wrappers |
| `Input` | Component | Styled HTML input |
| `Label` | Component | Styled label |
| `Spinner` | Component | Loading spinner |
| `Switch` | Component | Radix Switch wrapper |
| `FormField` | Component | Form field wrapper with label |
| `SecretField` | Component | Masked secret input field |
| `MaskedSecretInput` | Component | Alternate masked input |
| `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`, `PopoverClose` | Components | Radix Popover wrappers |
| `DropdownMenu` + 13 sub-parts | Components | Full Radix DropdownMenu suite |
| `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | Components | Radix Tooltip wrappers |
| `SearchableCombobox` | Component | Combobox with search |
| `SearchablePickerDialog` | Component | Dialog-based searchable picker |
| `GroupedSelect` | Component | Select with option groups |
| `CollectionPicker` | Component | Collection item picker |
| `CreateEntityDialog` | Component | Multi-mode form dialog (simple/tabs/composite) driven by a schema |
| `ViewModeToggle` | Component | Grid/list toggle |
| `EnterpriseOwnerBadge` | Component | Enterprise-tier ownership badge |
| `LockIcon` | Component | Lock icon primitive |
| `WizardShell` | Component | Multi-step wizard with progress indicator |
| `StatusBadge` | Component | Status badge |
| `StatusChip` | Component | Five-variant status chip (neutral/ok/warn/error/info) |
| `EffectiveStatusChips` | Component | Raw + effective status pair with provenance tooltip |
| `MismatchBadge` | Component | Amber mismatch indicator (compact/banner modes) |
| `BatchReadinessPill` | Component | Batch readiness state pill |
| `PlanningNodeTypeIcon` | Component | Maps PlanningNodeType string to Lucide icon |
| `statusVariant`, `readinessVariant` | Utilities | Domain status → chip variant helpers |
| `cn` | Utility | `clsx` + `tailwind-merge` |
| Types: `Tab`, `TabNavigationProps`, `VerticalTabNavigationProps`, `VerticalTabNavigationHandle`, `BaseArtifactModalProps`, `ModalArtifact`, `ArtifactTypeConfig`, `ModalTab`, `CardProps`, `CardHeaderProps`, `CardContentProps`, `CardFooterProps`, `BadgeProps`, `InputProps`, `LabelProps`, `SpinnerProps`, `SwitchProps`, etc. | Types | All exported |

### 1.3 `@miethe/ui/editor`

| Export | Kind | Notes |
|---|---|---|
| `MarkdownEditor` | Component | CodeMirror 6 markdown editor; `initialContent`, `onChange`, `readOnly`, `className`; light/dark theme via system preference; undo/redo; line wrapping |
| `SplitPreview` | Component | Left: `MarkdownEditor`; Right: `ReactMarkdown` + remark-gfm; controlled by `isEditing`; optional `sanitize` prop |

### 1.4 `@miethe/ui/diff`

| Export | Kind | Notes |
|---|---|---|
| `DiffViewer` | Component | Side-by-side unified diff with collapse/expand per file, large-file lazy loading (>50KB or >1000 lines) |
| `DiffViewerSkeleton` | Component | Loading skeleton for DiffViewer |
| Types: `DiffViewerProps`, `ResolutionType`, `TierContext`, `FileDiff` | Types | - |

### 1.5 `@miethe/ui/display`

| Export | Kind | Notes |
|---|---|---|
| `FrontmatterDisplay` | Component | Collapsible key-value YAML frontmatter display; 1-level nesting; arrays as comma-separated |
| `FilePreviewPane` | Component | Lightweight file preview with per-type rendering (markdown/code/text); tier badge; NOT using ArticleViewer — uses a home-grown regex markdown renderer |
| `ContextInfoCard` | Component | Key-value metadata card |

### 1.6 `@miethe/ui/bulk-actions`

| Export | Kind | Notes |
|---|---|---|
| `BulkActionBar` | Component | Floating toolbar for multi-select |
| `Button`, `buttonVariants` | Component / CVA | Standard button |

### 1.7 `@miethe/ui/filters`

`TagFilterPopover`, `TagFilterBar`, `ToolFilterPopover`, `ToolFilterBar`, `FiltersDropdown`, `SortDropdown`, `FilterBar` + types.

### 1.8 `@miethe/ui/pickers`

`EntityPickerDialog`, `EntityPickerTrigger`, `EntityPickerViewToggle` + types.

### 1.9 `@miethe/ui/discovery`

`DiscoveryCard` + types (`AgentDiscoveryCandidate`, `TrustTier`).

### 1.10 `@miethe/ui/utils`

`parseFrontmatter`, `stripFrontmatter`, `detectFrontmatter`, `extractFirstParagraph`, `extractFolderReadme`, `markStart`, `markEnd`, `typeBarColors`, `TYPE_BAR_FALLBACK`, `getTypeBarColor`, `artifactTypeCardTints`, `getCardTint`.

---

## 2. ContentViewer Capabilities — Format, Rendering, Editability

### 2.1 Main viewer surface: `ArticleViewer`

Source: `src/components/content-viewer/ArticleViewer.tsx`

**Formats rendered natively today:**

| Format | Support | Notes |
|---|---|---|
| Markdown (CommonMark) | Yes | Via react-markdown |
| GFM (tables, task lists, strikethrough, autolinks) | Yes | remark-gfm |
| Callout directives (`:::note`, `:::warning`, etc.) | Yes | remark-directive + remarkCallouts plugin |
| HTML strings (pre-compiled) | Yes | `format="html"` path via `dangerouslySetInnerHTML`; sanitize=true (default) runs rehype-sanitize |
| Auto-detect markdown vs HTML | Yes | `detectFormat()` — checks if body starts with `<tag` after stripping frontmatter |
| YAML Frontmatter | Yes | Extracted via gray-matter, shown via `FrontmatterHeader` when `frontmatter="show"/"collapse"` |
| Code blocks with syntax highlighting | Opt-in | `codeHighlight={true}`; dynamically imports `lowlight` (~15KB gzip); optional peer dep; call `warmHighlightCache()` at startup |
| Heading anchor IDs | Default on | `generateHeadingIds` (default true); GitHub-compatible slugs |

**Formats NOT rendered by `ArticleViewer`:**

| Format | Support | Notes |
|---|---|---|
| PDF | No | No renderer present |
| DOCX | No | No renderer present |
| PPTX | No | No renderer present |
| Images | No | No `<img>` preview component in the viewer path |
| Editable code (non-markdown) | No | Only `MarkdownEditor` for `.md`; other file types show as plain `<pre>` via `ContentPane` |

### 2.2 `ContentPane` — file-tree file display component

Source: `src/content-viewer/ContentPane.tsx`

- Accepts `path` + `content` as strings; detects file type by extension.
- **Markdown files (`.md`):** Always renders `SplitPreview`; read-only shows preview panel only; `readOnly=false` (default) shows split editor+preview via lazy-loaded CodeMirror.
- **Non-markdown editable files** (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.json`, `.yml`, `.yaml`, `.toml`, `.txt`): Shows `<pre>` with plain text (`ContentDisplay`); Edit/Save buttons present if `onEditStart`/`onSave` passed — but there is **no syntax-highlighted code editor for non-markdown files**; clicking Edit on a `.ts` file would just render a plain `<ContentDisplay>` (the edit+save state is wired but the editing path only calls `SplitPreview` for `.md`).
- **All other files:** Same plain `ContentDisplay` rendering; Edit button shown but only for the above extensions.
- Props: `path`, `content`, `isLoading`, `error`, `readOnly`, `truncationInfo`, `isEditing`, `editedContent`, `onEditStart`, `onEditChange`, `onSave`, `onCancel`, `ariaLabel`, `sanitize`.
- Frontmatter is auto-parsed; `FrontmatterDisplay` shown above content when detected.

### 2.3 `MarkdownEditor` — the code editor

Source: `src/editor/MarkdownEditor.tsx`

- Built on **CodeMirror 6** (`@codemirror/state`, `@codemirror/view`, `@codemirror/commands`, `@codemirror/lang-markdown`).
- Supports: markdown syntax highlighting, undo/redo history, line wrapping, light/dark theme (via system preference on mount only — no reactive dark-mode switch).
- Props: `initialContent`, `onChange`, `readOnly`, `className`.
- **Limitations:** Only `@codemirror/lang-markdown` is bundled. No other language grammars are included — there is no TypeScript/Python/JSON CodeMirror grammar in the package today. Non-markdown editing in `ContentPane` falls through to a read-only `<pre>`.

### 2.4 `SplitPreview` — combined editor + preview

Source: `src/editor/SplitPreview.tsx`

- Left pane: `MarkdownEditor`; Right pane: `ReactMarkdown` + remark-gfm + optional rehype-sanitize.
- `isEditing=false` hides the editor pane (preview-only, good for read-only markdown display).
- No callout directive support on the preview pane (uses vanilla ReactMarkdown, not the ArticleViewer pipeline).

### 2.5 `FilePreviewPane` — lightweight alternative

Source: `src/display/FilePreviewPane.tsx`

- Does NOT use ArticleViewer. Uses a homegrown regex Markdown-to-HTML converter (`renderMarkdown()`).
- Renders: markdown (regex), code (plain `<pre>` with language badge), text (plain `<pre>`).
- Props: `filePath`, `content`, `tier`, `isLoading`.

### 2.6 `content-viewer-shim` package

The sibling package at `packages/content-viewer-shim` contains **only a `node_modules` directory** and no source files. It is effectively empty/vestigial — no source, no `package.json` present in the root, no exports. It provides no content-viewer shim functionality to consumers.

---

## 3. Design-Token System / Tailwind Preset / Theming

### 3.1 Tailwind integration

There is **no published Tailwind preset or plugin** in this package. The package uses Tailwind utility classes in component source but ships no preset config.

**Consumer wiring steps:**

1. **Add package dist to `content` scan in tailwind.config.js**:
   ```js
   // tailwind.config.js
   module.exports = {
     darkMode: 'class',
     content: [
       './src/**/*.{ts,tsx}',
       './node_modules/@miethe/ui/dist/**/*.js',  // Required
     ],
     theme: { extend: {} },
     plugins: [],
   };
   ```

2. **Tailwind CSS semantic token dependency:** Components use shadcn/ui-style semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted`, `bg-card`, `text-card-foreground`, `border-border`, `text-primary`, `bg-accent`, `text-accent-foreground`, `bg-destructive`, `text-destructive`, `ring-ring`, `ring-offset-background`). A consuming app must define these CSS variables in its `globals.css`. The standard shadcn/ui globals block covers all of them.

3. **Dark mode:** Uses `dark:` Tailwind variants. Enable `darkMode: 'class'` and toggle `class="dark"` on `<html>`.

4. **No CSS imports required from the package** — all styling is via Tailwind utility classes baked into the compiled JS. No `@miethe/ui/styles.css` to import.

### 3.2 Typography variant system (ArticleViewer only)

`ArticleViewer` supports `variant="editorial" | "compact" | "technical"`. Each applies class `cv-variant-{name}` to the root div. The component reads **CSS custom properties** from the document root — the package ships no default values for these; the consumer defines them in `globals.css`:

```css
/* Example for "editorial" variant — consumer defines in globals.css */
:root {
  --cv-editorial-h1-font: Fraunces, Georgia, serif;
  --cv-editorial-h1-size: 2.25rem;
  --cv-editorial-h2-font: Fraunces, Georgia, serif;
  --cv-editorial-h2-size: 1.875rem;
  --cv-editorial-body-font: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --cv-editorial-body-size: 1rem;
  --cv-editorial-body-line-height: 1.75;
  --cv-editorial-quote-color: #64748b;
  --cv-editorial-quote-font-style: italic;
  --cv-callout-note-accent: #0ea5e9;
  --cv-callout-note-bg: #f0f9ff;
  --cv-callout-reference-accent: #64748b;
  --cv-callout-reference-bg: #f1f5f9;
  --cv-callout-warning-accent: #f59e0b;
  --cv-callout-warning-bg: #fffbeb;
  --cv-callout-info-accent: #0ea5e9;
  --cv-callout-info-bg: #f0f9ff;
}
```

Analogous `--cv-compact-*` and `--cv-technical-*` variable sets follow the same pattern. Missing variables are silently ignored — browser defaults apply.

### 3.3 Provider / context setup

For the `FileTree` + `ContentPane` components (which use the adapter pattern to fetch tree and file data), wrap with `ContentViewerProvider`:

```tsx
import { ContentViewerProvider } from '@miethe/ui/content-viewer';
import type { ContentViewerAdapter } from '@miethe/ui/content-viewer';

const myAdapter: ContentViewerAdapter = {
  useFileTree: (artifactId, options) => ({
    data: myFileTreeData,
    isLoading: false,
    error: null,
  }),
  useFileContent: (artifactId, filePath, options) => ({
    data: myFileContent,
    isLoading: false,
    error: null,
  }),
};

// In your layout/page:
<ContentViewerProvider adapter={myAdapter}>
  <FileTree artifactId="my-artifact" />
  <ContentPane path={selectedPath} content={selectedContent} />
</ContentViewerProvider>
```

`ArticleViewer`, `MarkdownEditor`, and `SplitPreview` do NOT require a provider — they are standalone components.

---

## 4. peerDependencies and React/Next/Tailwind Compatibility

From `package.json` (verbatim):

```json
"peerDependencies": {
  "react": "^18.0 || ^19.0",
  "react-dom": "^18.0 || ^19.0",
  "react-hook-form": ">=7.0.0",
  "tailwindcss": ">=3.0.0",
  "zod": ">=3.0.0"
},
"peerDependenciesMeta": {
  "react-hook-form": { "optional": true },
  "tailwindcss": { "optional": true },
  "zod": { "optional": true }
}
```

**Key points:**

- React 18 and React 19 are both explicitly supported. Compatible with Next.js 15 / React 19.
- Tailwind CSS 3.x is the minimum; Tailwind 4 is not tested or declared.
- `react-hook-form` and `zod` are optional — only needed when using `CreateEntityDialog` or form-related primitives.
- `tailwindcss` is listed as optional peer — the package will not crash at runtime without it, but all styling will be absent.
- The package declares `"type": "module"` and ships ESM only (`"main": "./dist/index.js"` pointing to ESM output). Next.js 15 handles ESM packages natively.
- `"sideEffects": false` — safe for tree-shaking.
- Internal dependencies bundled (not peers): all `@radix-ui/*`, `@codemirror/*`, `react-markdown`, `remark-*`, `rehype-*`, `gray-matter`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`.

---

## 5. Gaps vs. Required Formats

Target formats needed: images, PDF, Markdown (editable), DOCX, PPTX, and editable formatted code blocks.

| Format | @miethe/ui support | Gap severity | Notes |
|---|---|---|---|
| **Markdown (read-only)** | Full | None | `ArticleViewer` — GFM, callouts, frontmatter, variants, sanitization |
| **Markdown (editable)** | Partial | Minor | `MarkdownEditor` + `SplitPreview` cover `.md` in `ContentPane`. Gap: editor does not react to system dark-mode changes after mount; no toolbar. |
| **Code (syntax-highlighted, read-only)** | Opt-in via lowlight | Minor | `ArticleViewer` `codeHighlight={true}` + lowlight optional peer dep covers fenced code blocks inside markdown. No standalone code viewer component with per-language syntax highlighting. `FilePreviewPane.CodeContent` renders plain `<pre>`. |
| **Code (editable, formatted)** | Not present | Significant | `MarkdownEditor` only adds `@codemirror/lang-markdown`. No TypeScript, Python, JSON, YAML, or other language grammars are bundled. `ContentPane` shows a plain `<pre>` for `.ts`/`.py`/`.json` files even when `isEditing` state is triggered. |
| **Images** | Not present | Significant | No image preview component. Nothing handles `.png`, `.jpg`, `.gif`, `.svg`, `.webp`, etc. Consumer must implement. |
| **PDF** | Not present | Significant | No PDF renderer. Would require react-pdf or pdfjs integration. |
| **DOCX** | Not present | Significant | No DOCX renderer. Would require mammoth.js or similar. |
| **PPTX** | Not present | Significant | No PPTX renderer. No standard React library exists; would need python-pptx server-side or a custom HTML export bridge. |

### Summary of gaps:

1. **Images:** No image preview. Must add: detect image extensions in ContentPane dispatch, render `<img>` or a lightbox component.
2. **PDF:** No PDF viewer. Add react-pdf (`@react-pdf-viewer/core`) or use an `<iframe src="...#toolbar=0">` for hosted PDFs.
3. **DOCX:** No DOCX renderer. Add mammoth.js to convert DOCX to HTML server-side or via client-side wasm, then feed the HTML string to `ArticleViewer` with `format="html" sanitize={false}` (trusted output).
4. **PPTX:** No PPTX renderer — the largest gap. No viable pure-client solution exists; needs a server-side conversion step (LibreOffice → HTML or PDF → serve as iframe).
5. **Editable code with syntax highlighting:** Only markdown has a CodeMirror editor. For `.ts`/`.py`/`.json` editable views, additional CodeMirror language packages (`@codemirror/lang-javascript`, `@codemirror/lang-python`, `@codemirror/lang-json`) would need to be added to a new `CodeEditor` component that this package does not export today.
6. **Dark mode reactivity in MarkdownEditor:** The CodeMirror theme is chosen once at mount from `window.matchMedia` and does not re-render if the user switches dark/light mode at runtime. Minor but worth noting.

---

## 6. Invocation Quick-Reference

### Tabbed Modal

```tsx
import { BaseArtifactModal, type ModalArtifact, type Tab } from '@miethe/ui/primitives';

const tabs: Tab[] = [
  { value: 'preview', label: 'Preview', icon: Eye },
  { value: 'metadata', label: 'Metadata', icon: Info },
];

<BaseArtifactModal
  artifact={{ name: 'My Asset', type: 'image', description: 'An image asset' }}
  open={isOpen}
  onClose={() => setOpen(false)}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  tabs={tabs}
  getTypeConfig={(type) => ({ icon: 'Image', color: 'text-blue-500' })}
>
  <TabsContent value="preview">...</TabsContent>
  <TabsContent value="metadata">...</TabsContent>
</BaseArtifactModal>
```

### Markdown + HTML article rendering

```tsx
import { ArticleViewer } from '@miethe/ui/content-viewer';

<ArticleViewer
  content={markdownString}
  format="auto"          // or "markdown" | "html"
  variant="editorial"    // optional
  frontmatter="collapse" // "show" | "collapse" | "hide"
  codeHighlight          // opt-in, needs lowlight peer dep
  sanitize               // default true for HTML, false for markdown
  isLoading={loading}
  error={errorMsg}
  onError={console.error}
/>
```

### Card

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@miethe/ui/primitives';

<Card>
  <CardHeader>Title here</CardHeader>
  <CardContent>Body content</CardContent>
  <CardFooter><button>Action</button></CardFooter>
</Card>
```

---

## 7. File Reference Map

| Area | Source path |
|---|---|
| Root barrel | `src/index.ts` |
| Content-viewer barrel | `src/content-viewer/index.ts` |
| ArticleViewer | `src/components/content-viewer/ArticleViewer.tsx` |
| ArticleViewer types | `src/components/content-viewer/types.ts` |
| ContentPane | `src/content-viewer/ContentPane.tsx` |
| Adapters | `src/content-viewer/adapters.ts` |
| MarkdownEditor | `src/editor/MarkdownEditor.tsx` |
| SplitPreview | `src/editor/SplitPreview.tsx` |
| Dialog | `src/primitives/Dialog.tsx` |
| Tabs + TabNavigation | `src/primitives/Tabs.tsx`, `src/primitives/TabNavigation.tsx` |
| VerticalTabNavigation | `src/primitives/VerticalTabNavigation.tsx` |
| BaseArtifactModal | `src/primitives/BaseArtifactModal.tsx` |
| ModalHeader | `src/primitives/ModalHeader.tsx` |
| Card | `src/primitives/Card.tsx` |
| FilePreviewPane | `src/display/FilePreviewPane.tsx` |
| FrontmatterDisplay | `src/display/FrontmatterDisplay.tsx` |
| DiffViewer | `src/diff/DiffViewer.tsx` |
| Package manifest | `package.json` |
| README (setup + CSS contract) | `README.md` |
| CHANGELOG | `CHANGELOG.md` |
