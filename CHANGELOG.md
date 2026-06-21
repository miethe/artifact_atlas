# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Design system adoption** (`@miethe/ui@0.6.0`) — Integrated the shared design system via a shadcn-compatible CSS-var + Tailwind token bridge with subpath imports; all design tokens are now sourced from `@miethe/ui` rather than local one-offs. The token bridge lives in `web/app/globals.css` + `web/tailwind.config.ts`; no upstream source is forked (ADR-1, D-012).
- **Canonical tabbed-modal detail pattern** — New `EntityModal` shell and shared tab registry replace five previously bespoke detail surfaces (asset library, BOM slot, coverage, template, inbox). State is driven by URL query params (`?item=&tab=`), enabling deep-linking and consistent keyboard/focus behaviour; each surface gates independently behind `ui-tabbed-modal` flags, with legacy panels retained as the flag-off fallback (ADR-2, D-012).
- **Zone-composition preview cards** — Redesigned card family uses a full-width top thumbnail with real per-format asset previews (re-using AssetViewer renderers; no placeholder icons). Card zones (thumbnail, header, metadata, actions) are composed from discrete slot components, enabling straightforward card variants (ADR-3, D-012).
- **Multi-format `AssetViewer`** — Dispatcher-based viewer supports: images (`next/image`), PDF (`react-pdf`), Markdown and code (`@miethe/ui ContentPane`), DOCX (`docx-preview`), and PPTX via server-side PPTX→PDF conversion. Only Markdown and code formats are editable; binaries are read-only. Untrusted-file security posture is centrally enforced in the dispatcher (ADR-4, D-012).
- **Accessibility and facelift pass** — P0 items: system font stack, WCAG AA contrast (≥4.5:1 for all text and icon pairs), `prefers-reduced-motion` support, surface icons, and collaboration footer updated. P1 items: high-impact visual improvements across the main application surfaces (ADR-5, D-012).

### Changed

- **Upstream/local component split** — Broadly reusable component gaps contributed upstream to `@miethe/ui`; AA-specific components remain local. Split policy documented in `docs/project_plans/upstream/miethe-ui-additions-v1.md` (ADR-6, D-012).
- **`docs/DECISIONS.md`** — D-012 ADR sub-sections expanded with full Context / Decision / Consequences format for all six UI Polish Pass ADRs (P6-011).
- **`docs/mvp-backlog.md`** — Phase UI pillars P1–P5 marked complete; DEFER-1 through DEFER-4 backlog entries added with design-spec stub links (P6-012).
