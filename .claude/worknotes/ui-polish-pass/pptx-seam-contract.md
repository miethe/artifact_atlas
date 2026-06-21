# PPTX Server-Side Conversion — Seam Contract (SEAM-P4C-001)

> **Status:** APPROVED (authored in-session by Opus orchestrator; satisfies the
> "signed off by both agents" gate for P4C). This is the load-bearing contract that
> `P4C-001/002/005` (backend) and `P4C-003/004` (frontend) implement against.
> Per ADR-4, PPTX has no React-19-compatible client renderer, so we convert
> server-side to PDF and reuse the existing `PdfRenderer`.

## 1. Problem & Boundary

The `AssetViewer` dispatcher (`web/features/assets/components/AssetViewer/index.tsx`)
renders images, PDF, Markdown, code, and (P4b) DOCX client-side. PPTX cannot be
rendered client-side under React 19. The seam: a backend endpoint converts an
uploaded/stored `.pptx` to PDF; the frontend then renders that PDF with the
existing `PdfRenderer`. The whole feature is gated behind a feature flag with a
download fallback when conversion is unavailable or disabled.

## 2. Feature Flag

- **Flag name:** `pptx-server-conversion`
- **Mechanism:** `web/lib/flags.ts` (`isFlagEnabled("pptx-server-conversion")`).
- **Default:** OFF (not added to `FLAG_DEV_DEFAULTS`). When OFF, the PPTX branch of
  the dispatcher renders the download fallback ("Preview not available — Download")
  via the existing `ErrorTile` with the original URL. No network call is made.

## 3. HTTP Endpoint

```
POST /api/preview/convert/pptx
```

### Request

JSON body:

```json
{
  "assetId": "string (required) — Asset.id whose stored PPTX should be converted",
  "projectId": "string (optional) — for scoping/authorization parity with other routes"
}
```

Rationale for POST + assetId (not raw upload): the bytes already live in asset
storage; the server resolves `storage_uri ?? uri` server-side (the FE never streams
the file to the convert endpoint). This keeps the untrusted file on the server side
of the seam and lets the server enforce `agent_access`/MIME the same way other asset
routes do.

### Validation (server-side, mandatory)

1. Resolve the asset; 404 if not found.
2. **Magic-bytes check**: the stored file MUST begin with the ZIP/OOXML signature
   `50 4B 03 04` (`PK\x03\x04`) AND have a `.pptx` extension / `application/vnd.openxmlformats-officedocument.presentationml.presentation` MIME. Reject mismatches with `415`.
3. Enforce a max input size (default 50 MB) → `413` on exceed.

### Response — success

`200 OK`

```json
{
  "status": "ready",
  "pdfUrl": "string — URL the FE passes to PdfRenderer (served from the convert cache)",
  "cached": true,
  "pageCount": 12
}
```

`pdfUrl` MUST be directly consumable by `PdfRenderer` (same-origin or proxied; no
auth header required beyond the session the FE already has). Implement as a static
served path under the configured previews/cache dir, e.g.
`/api/preview/cache/{assetId}.pdf`, or return the existing proxy content URL form —
implementer's choice as long as `PdfRenderer` can load it.

### Response — async / not-ready (optional)

If conversion is implemented asynchronously, the first call MAY return `202 Accepted`
with `{ "status": "pending" }`; the FE then polls the same endpoint (or a
`GET /api/preview/convert/pptx/{assetId}` status form) until `ready`. **Synchronous
conversion within the 30s timeout is acceptable and is the simpler default** — the FE
contract below handles both `200 ready` and `202 pending`.

### Errors

| Status | Meaning | FE behavior |
|--------|---------|-------------|
| `400` | Malformed request (missing assetId) | download fallback |
| `404` | Asset not found | download fallback + ErrorTile message |
| `413` | File too large | download fallback ("file too large to preview") |
| `415` | Not a valid PPTX (magic-bytes/MIME mismatch) | download fallback |
| `422` | Conversion failed (LibreOffice/Gotenberg error) | download fallback |
| `500` | Unexpected server error | download fallback |
| `503` | Converter binary unavailable on host | download fallback |

**Invariant:** the FE NEVER crashes on any non-200; every error path collapses to the
same download fallback UI. This is AC P4C-A.

## 4. Conversion Implementation Notes (backend)

- Place the endpoint in `api/app/api/preview.py` (new router, registered in
  `api/app/main.py`); place conversion logic in `api/app/services/pptx_converter.py`.
- Reuse the optional-dependency guard pattern from
  `api/app/services/previews.py` (guarded imports; degrade to `503`/`None` when the
  converter binary is absent — do NOT hard-crash import).
- Converter: shell out to LibreOffice headless
  (`soffice --headless --convert-to pdf --outdir <cache> <src>`) OR Gotenberg if
  configured. Detect availability with `shutil.which("soffice")`; return `503` when
  absent (flag-off path means this is never hit in default dev).
- **30s timeout** on the conversion subprocess (`subprocess.run(..., timeout=30)`);
  on `TimeoutExpired` → `422`.
- **Cache** by `assetId` + source mtime/hash: if `<cache>/{assetId}.pdf` exists and is
  newer than the source, return it with `"cached": true` and skip reconversion.
- Cache dir: reuse `settings` previews/thumbnails dir convention from `PreviewService`
  (add a `pptx_cache_dir` or reuse `previews_dir`).

### P4C-002 — Asset-fetch proxy seam

If/where the FE fetches asset bytes through the API (proxy), enforce on that seam:
MIME allow-listing, strip dangerous response headers (no `Set-Cookie`,
no `Content-Disposition: inline` for executable types), and `fetchRelated:false`
semantics (never auto-fetch linked/remote resources). This addresses R6
(untrusted-file XSS/SSRF). Keep the proxy read-only and same-origin.

## 5. OpenAPI (P4C-005)

Add to `shared/openapi.yaml`:

- Path `/api/preview/convert/pptx` (POST), `operationId: convertPptx`, tagged
  `preview`.
- Request schema `PptxConvertRequest` (`assetId` required, `projectId` optional).
- Response schemas `PptxConvertResult` (`status`, `pdfUrl`, `cached`, `pageCount`) for
  `200`; `PptxConvertPending` (`status: pending`) for `202`.
- Document the `4xx/5xx` codes above.
- **Coordination with P6-010:** P4C-005 is the authoritative author of this spec
  block. P6-010 only *verifies* parity (`api/tests/test_openapi_parity.py`) and must
  NOT re-edit the convert block — it rebases onto P4C-005's version.

## 6. Frontend Contract (P4C-003 / P4C-004)

In `web/features/assets/components/AssetViewer/index.tsx`:

1. Extend `resolveRenderer` to detect PPTX (MIME
   `application/vnd.openxmlformats-officedocument.presentationml.presentation` or
   `.pptx`) → new renderer kind `"pptx"`.
2. New `PptxRenderer.tsx` (client component, `next/dynamic` ssr:false):
   - If `!isFlagEnabled("pptx-server-conversion")` → render `ErrorTile` download
     fallback immediately (no fetch).
   - Else `POST /api/preview/convert/pptx` with `{ assetId }`; show a loading state;
     on `200 ready` render `<PdfRenderer src={pdfUrl} .../>`; on `202 pending` poll
     (max ~30s) then render or fall back; on ANY error → `ErrorTile` download
     fallback with `originalUrl`.
   - `mode="thumbnail"` → render the format icon (no conversion call), matching how
     `PdfRenderer`/`DocxRenderer` handle thumbnail mode (AC P4C-D).
3. **Do not merge FE render (P4C-003) before this contract is signed** — it is (this
   document), so P4C-003 is unblocked.

## 7. Acceptance Criteria Mapping

| AC | Satisfied by |
|----|--------------|
| P4C-A — FE handles missing/error convert response | §3 Errors table + §6.2 fallback invariant |
| P4C-B — file-type validation on convert endpoint | §3 Validation (magic bytes + MIME + size) |
| P4C-C — seam contract verified before FE render merges | this document (APPROVED) |
| P4C-D — PPTX thumbnail mode shows icon | §6.2 thumbnail branch |
