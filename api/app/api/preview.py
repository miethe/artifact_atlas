"""Preview router — PPTX-to-PDF conversion seam and asset-content proxy.

Routes:
  POST /api/preview/convert/pptx         — P4C-001: convert PPTX asset to PDF
  GET  /api/preview/cache/{assetId}      — P4C-001: serve cached converted PDF
  GET  /api/preview/asset/{assetId}/content — P4C-002: safe asset-content proxy
  GET  /api/preview/asset/{assetId}/html    — inline HTML preview (CSP-sandboxed)

Security invariants (P4C-002):
  - Only local file:// URIs are proxied (no SSRF — remote URIs are rejected).
  - MIME allow-list: only safe document/image/text/audio/video types served.
  - X-Content-Type-Options: nosniff always emitted.
  - Set-Cookie / Set-Cookie2 are never forwarded.
  - Non-inline-safe MIME types get Content-Disposition: attachment, built via
    RFC 5987/6266-safe encoding (control chars stripped, non-ASCII
    percent-encoded) — a raw ``source_path.name`` is never interpolated into
    a header value (CR/LF header-injection guard).
  - fetchRelated:false semantics: no linked/remote resources are auto-fetched.
  - agent_access policy gate: assets with agent_access=none/metadata_only are
    denied (403) on both the content proxy and the cached-PDF endpoint, via
    the same PolicyService used by assets.py ("Policy-gated for content
    fields") — see ``_check_preview_access`` below.

HTTP Range support (AssetViewer WS-3 — audio/video streaming):
  The content-proxy endpoint returns Starlette's ``FileResponse``, which
  natively implements RFC 7233 Range handling for a single byte range:
  it emits ``Accept-Ranges: bytes`` on every response, and — when the
  incoming request carries a ``Range`` header — serves ``206 Partial
  Content`` with a ``Content-Range`` header (or ``416 Range Not
  Satisfiable`` for an out-of-bounds range). No custom range-parsing code
  is required here; this module's responsibility is only to ensure audio/
  video MIME types clear the allow-list below and are marked inline-safe
  so ``<audio>``/``<video>`` elements can stream them directly instead of
  being forced to ``Content-Disposition: attachment``.
"""

from __future__ import annotations

import logging
import mimetypes
import re
from pathlib import Path
from urllib.parse import quote, urlparse

from fastapi import APIRouter, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.api._deps import forbidden, get_asset_service, get_policy_service, not_found
from app.models.vocabulary import IncludeMode
from app.services.pptx_converter import (
    ConversionError,
    ConverterUnavailableError,
    MagicBytesError,
    PptxConverter,
    SizeLimitExceededError,
)
from app.settings import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/preview", tags=["preview"])


# ---------------------------------------------------------------------------
# MIME policy constants (P4C-002)
# ---------------------------------------------------------------------------

#: Full set of MIME types that the proxy will serve.
_PROXY_ALLOWED_MIMES: frozenset[str] = frozenset(
    {
        # --- Images ---
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "image/tiff",
        "image/x-icon",
        "image/vnd.microsoft.icon",
        "image/svg+xml",
        # --- Documents ---
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/msword",
        "application/vnd.ms-powerpoint",
        "application/vnd.ms-excel",
        # --- Text (safe) ---
        "text/plain",
        "text/markdown",
        "text/x-markdown",
        "text/csv",
        "text/tab-separated-values",
        "text/html",
        "text/css",
        # --- Structured data ---
        "application/json",
        "text/xml",
        "application/xml",
        "application/yaml",
        "text/yaml",
        # --- Audio (AssetViewer WS-3: native <audio controls>) ---
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/ogg",
        "audio/flac",
        "audio/x-flac",
        "audio/aac",
        "audio/x-aac",
        "audio/mp4",
        "audio/x-m4a",
        "audio/mp4a-latm",
        "audio/webm",
        # --- Video (AssetViewer WS-3: native <video controls>, Range-streamed) ---
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/mpeg",
        "video/ogg",
    }
)

#: MIME types that are safe to serve inline (not forced to attachment).
#: NOTE: image/svg+xml and text/html are intentionally EXCLUDED — both can
#: execute JavaScript in the browser's same-origin context, so untrusted
#: uploads of those types must be forced to Content-Disposition: attachment
#: (R6 XSS hardening). They remain in _PROXY_ALLOWED_MIMES (downloadable).
_INLINE_SAFE_MIMES: frozenset[str] = frozenset(
    {
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
        "application/pdf",
        "text/plain",
        "text/css",
        # Audio/video must stay inline-safe so <audio>/<video src> elements can
        # stream them directly — forcing Content-Disposition: attachment on
        # these types would break in-browser playback in some browsers.
        "audio/mpeg",
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/ogg",
        "audio/flac",
        "audio/x-flac",
        "audio/aac",
        "audio/x-aac",
        "audio/mp4",
        "audio/x-m4a",
        "audio/mp4a-latm",
        "audio/webm",
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "video/x-msvideo",
        "video/mpeg",
        "video/ogg",
    }
)

#: Asset ID safe-character pattern — prevents path traversal.
_ASSET_ID_RE = re.compile(r"^[a-zA-Z0-9_\-]+$")


# ---------------------------------------------------------------------------
# Pydantic request / response models
# ---------------------------------------------------------------------------


class PptxConvertRequest(BaseModel):
    """Request body for POST /api/preview/convert/pptx."""

    assetId: str
    projectId: str | None = None


class PptxConvertResult(BaseModel):
    """Success response body for POST /api/preview/convert/pptx (200 OK)."""

    status: str = "ready"
    pdfUrl: str
    cached: bool
    pageCount: int


class PptxConvertPending(BaseModel):
    """Async-pending response body for POST /api/preview/convert/pptx (202).

    Not returned by this synchronous implementation but documented for FE
    contract compatibility (seam contract §3).
    """

    status: str = "pending"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _error_json(status_code: int, code: str, message: str) -> JSONResponse:
    """Return a structured JSON error response."""
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


def _safe_asset_id(asset_id: str) -> bool:
    """Return True iff *asset_id* is safe to embed in a filesystem path."""
    return bool(_ASSET_ID_RE.match(asset_id)) and ".." not in asset_id


def _get_converter() -> PptxConverter:
    settings = get_settings()
    return PptxConverter(settings.pptx_cache_dir)


def _resolve_within_workspace(source_path: Path) -> Path | None:
    """Resolve *source_path* and confirm it stays inside the workspace root.

    Relative paths resolve against the configured workspace root; the resolved
    absolute path must remain within that root. Returns the resolved path, or
    ``None`` if it escapes — this is the LFI/SSRF guard (R6, findings F-002):
    a ``file:///etc/passwd`` URI on an asset record resolves outside the
    workspace and is rejected here before any read.
    """
    settings = get_settings()
    root = settings.workspace_root.resolve()
    candidate = source_path if source_path.is_absolute() else (root / source_path)
    try:
        resolved = candidate.resolve()
    except OSError:
        return None
    if resolved == root or root in resolved.parents:
        return resolved
    return None


def _check_preview_access(asset: object) -> JSONResponse | None:
    """Enforce the same agent_access policy gate as assets.py's "Policy-gated
    for content fields" convention.

    CRITICAL fix — the content proxy and cached-PDF endpoints previously
    served bytes for any assetId with no policy check at all.

    Reuses ``PolicyService.evaluate_asset_access`` (no bespoke policy logic):
    - agent_access="none" is a hard deny in the policy engine itself.
    - agent_access="metadata_only" caps ``effective_include_mode`` below the
      requested "preview" mode (the policy engine returns a downgraded
      "allow", not a deny — but a raw-bytes proxy has no way to serve a
      "metadata" rendering of a byte stream, so a downgrade away from the
      requested mode is treated as access-denied here too).
    - agent_access in {preview_allowed, read_allowed, context_pack_allowed}
      is permitted to clear the "preview" bar and the proxy serves the file.

    Returns a 403 JSONResponse (API's standard error envelope, via the
    shared ``forbidden()`` helper) when access is denied, or ``None`` when
    the caller may proceed to serve content.
    """
    sensitivity = (
        asset.sensitivity.value  # type: ignore[attr-defined]
        if hasattr(asset.sensitivity, "value")  # type: ignore[attr-defined]
        else str(asset.sensitivity)  # type: ignore[attr-defined]
    )
    agent_access = (
        asset.agent_access.value  # type: ignore[attr-defined]
        if hasattr(asset.agent_access, "value")  # type: ignore[attr-defined]
        else str(asset.agent_access)  # type: ignore[attr-defined]
    )

    policy_svc = get_policy_service()
    policy = policy_svc.evaluate_asset_access(
        resource_id=asset.id,  # type: ignore[attr-defined]
        sensitivity=sensitivity,
        agent_access=agent_access,
        action="read_content",
        include_mode=IncludeMode.preview,
        actor_type="agent",
    )
    if policy.decision == "deny" or policy.effective_include_mode != IncludeMode.preview:
        return forbidden(policy.reason or "Asset content access denied by policy.")
    return None


#: Single byte-range Range header syntax: "bytes=N-M", "bytes=N-", or
#: "bytes=-N" (suffix range). Multi-range ("bytes=0-1,2-3") is rejected as
#: malformed by this proxy — Starlette itself still validates satisfiability
#: (416) and range math for anything that passes this syntax check.
_RANGE_HEADER_RE = re.compile(r"^bytes=(\d+-\d*|-\d+)$")


def _validate_range_header(value: str | None) -> JSONResponse | None:
    """Return a 400 JSONResponse for a syntactically malformed Range header.

    MAJOR(downgraded) fix: Starlette's ``FileResponse`` responds to a
    malformed ``Range`` header with a bare ``PlainTextResponse(400, ...)``,
    which breaks this API's JSON error-envelope contract. Pre-validating the
    syntax here lets us return the standard envelope for malformed input
    while still delegating all range *math* (satisfiability, 416, partial
    content slicing) to Starlette for anything that is syntactically valid.
    """
    if not value:
        return None
    if not _RANGE_HEADER_RE.match(value.strip()):
        return _error_json(
            400,
            "bad_request",
            "Malformed Range header; expected a single 'bytes=<start>-<end>' range.",
        )
    return None


_CONTROL_CHARS_RE = re.compile(r"[\x00-\x1f\x7f]")


def _content_disposition_header(filename: str, disposition: str = "attachment") -> str:
    """Build a header-injection-safe Content-Disposition value.

    MAJOR fix: the previous implementation built the header from
    ``source_path.name`` with only double-quote escaping, so a filename
    containing CR/LF could inject arbitrary response headers. This strips
    control characters (CR, LF, and other C0/DEL bytes) before use, and
    emits both an RFC 6266 ASCII-safe ``filename=`` fallback and an RFC 5987
    UTF-8 percent-encoded ``filename*=`` for clients that honor it, so
    non-ASCII names survive without being replaced.
    """
    cleaned = _CONTROL_CHARS_RE.sub("", filename).strip()
    if not cleaned:
        cleaned = "download"

    # ASCII-only fallback for legacy clients: replace non-ASCII bytes and
    # escape backslash/quote so the quoted-string stays well-formed.
    ascii_name = cleaned.encode("ascii", "replace").decode("ascii")
    ascii_name = ascii_name.replace("\\", "\\\\").replace('"', '\\"')
    if not ascii_name.strip("? "):
        ascii_name = "download"

    encoded = quote(cleaned, safe="")
    return f'{disposition}; filename="{ascii_name}"; filename*=UTF-8\'\'{encoded}'


# ---------------------------------------------------------------------------
# P4C-001 — PPTX conversion endpoint
# ---------------------------------------------------------------------------


@router.post(
    "/convert/pptx",
    response_model=PptxConvertResult,
    summary="Convert a stored PPTX asset to PDF",
)
def convert_pptx(body: PptxConvertRequest) -> JSONResponse:
    """Convert an uploaded/stored PPTX asset to PDF via LibreOffice headless.

    Validation order (seam contract §3):
    1. Resolve asset by ID              → 404 if not found
    1b. agent_access policy gate        → 403 (same bar as /content and /cache)
    2. Resolve local source path        → 404 if path not resolvable / file missing
    3. Magic-bytes + extension + MIME   → 415 on mismatch
    4. File size (≤ 50 MB)              → 413 on exceed
    5. Converter binary availability    → 503 if soffice absent
    6. Conversion subprocess            → 422 on timeout / failure

    On success (200) returns PptxConvertResult with a ``pdfUrl`` that the
    frontend can pass directly to ``PdfRenderer``.
    """
    asset_id = (body.assetId or "").strip()
    if not asset_id:
        return _error_json(400, "bad_request", "assetId is required")

    # 1. Resolve asset
    svc = get_asset_service()
    asset = svc.get_asset(asset_id)
    if asset is None:
        return not_found(f"Asset '{asset_id}' not found.")  # type: ignore[return-value]

    # 1b. Policy gate — same agent_access bar as /content, /cache, and /html.
    # Without this, a metadata_only/none asset could still be pushed through
    # LibreOffice (cache write + page-count disclosure) via a direct POST.
    denied = _check_preview_access(asset)
    if denied is not None:
        return denied  # type: ignore[return-value]

    converter = _get_converter()

    # 2. Resolve local source path (SSRF-safe: remote URIs → None)
    source_path = converter.resolve_source_path(asset)
    if source_path is None:
        return _error_json(
            404,
            "not_found",
            f"Asset '{asset_id}' has no resolvable local file path.",
        )
    # 2b. Workspace containment (LFI/SSRF guard — R6, findings F-002)
    safe_path = _resolve_within_workspace(source_path)
    if safe_path is None:
        return _error_json(
            400,
            "bad_request",
            "Asset path resolves outside the permitted workspace.",
        )
    source_path = safe_path
    if not source_path.exists():
        return _error_json(
            404,
            "not_found",
            f"Asset '{asset_id}' source file is not accessible.",
        )

    # 3. Magic-bytes + extension + MIME validation → 415
    # 4. Size check → 413
    try:
        asset_mime: str | None = getattr(asset, "mime_type", None)
        logical_uri: str | None = getattr(asset, "uri", None)
        converter.validate_pptx(
            source_path, asset_mime=asset_mime, logical_uri=logical_uri
        )
    except MagicBytesError as exc:
        return _error_json(415, "unsupported_media_type", str(exc))
    except SizeLimitExceededError as exc:
        return _error_json(413, "request_entity_too_large", str(exc))

    # 5. Converter binary check → 503
    if not converter.soffice_available():
        return _error_json(
            503,
            "converter_unavailable",
            "PPTX conversion requires LibreOffice (soffice), which is not available on this host.",
        )

    # 6. Convert
    try:
        result = converter.convert(asset_id, source_path)
    except ConverterUnavailableError as exc:
        return _error_json(503, "converter_unavailable", str(exc))
    except ConversionError as exc:
        return _error_json(422, "conversion_failed", str(exc))
    except Exception as exc:
        logger.exception("Unexpected error converting PPTX for asset %s", asset_id)
        return _error_json(500, "internal_error", f"Unexpected error: {exc}")

    pdf_url = f"/api/preview/cache/{asset_id}"
    return JSONResponse(
        status_code=200,
        content={
            "status": "ready",
            "pdfUrl": pdf_url,
            "cached": result.cached,
            "pageCount": result.page_count,
        },
    )


# ---------------------------------------------------------------------------
# P4C-001 — Serve cached PDF
# ---------------------------------------------------------------------------


@router.get(
    "/cache/{assetId}",
    summary="Serve a cached converted PDF",
)
def get_cached_pdf(assetId: str, request: Request) -> FileResponse:
    """Return the cached PDF for a previously converted PPTX asset.

    The ``assetId`` path parameter is validated against a safe-character
    pattern to prevent path-traversal attacks. Enforces the same
    agent_access policy gate as the content proxy (CRITICAL fix — this
    endpoint had the same missing-policy-check gap): the asset backing
    ``assetId`` must exist and clear ``_check_preview_access`` before the
    cached PDF bytes are served.
    """
    if not _safe_asset_id(assetId):
        return _error_json(400, "bad_request", "Invalid assetId format.")  # type: ignore[return-value]

    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"No cached PDF for asset '{assetId}'.")  # type: ignore[return-value]

    denied = _check_preview_access(asset)
    if denied is not None:
        return denied  # type: ignore[return-value]

    settings = get_settings()
    cache_path = settings.pptx_cache_dir / f"{assetId}.pdf"

    if not cache_path.exists():
        return not_found(f"No cached PDF for asset '{assetId}'.")  # type: ignore[return-value]

    range_error = _validate_range_header(request.headers.get("range"))
    if range_error is not None:
        return range_error  # type: ignore[return-value]

    return FileResponse(
        path=str(cache_path),
        media_type="application/pdf",
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )


# ---------------------------------------------------------------------------
# P4C-002 — Asset-content proxy (MIME allow-list + security headers)
# ---------------------------------------------------------------------------


@router.get(
    "/asset/{assetId}/content",
    summary="Proxy asset file content with MIME allow-listing and security headers",
)
def get_asset_content(assetId: str, request: Request) -> FileResponse:
    """Read-only, same-origin asset-content proxy (seam contract §4 / P4C-002).

    Enforces:
    - Only local ``file://`` URIs are served — remote URIs return 400 (no SSRF).
    - MIME allow-list: binary/executable MIME types return 415.
    - ``X-Content-Type-Options: nosniff`` is always emitted.
    - ``Set-Cookie`` / ``Set-Cookie2`` are never forwarded (we own the response).
    - Non-inline-safe MIME types get ``Content-Disposition: attachment``.
    - No related/remote resources are auto-fetched (fetchRelated:false semantics).

    HTTP Range requests (RFC 7233) are supported transparently via
    Starlette's ``FileResponse``: a request carrying a ``Range`` header
    gets back ``206 Partial Content`` with ``Content-Range``; an
    out-of-bounds range gets ``416 Range Not Satisfiable``; a request with
    no ``Range`` header gets the unchanged full-body ``200`` response.
    ``Accept-Ranges: bytes`` is emitted on every response. This lets the
    AssetViewer VideoRenderer stream large video blobs without buffering
    the whole file client-side.
    """
    # 1. Resolve asset
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

    # 1b. Policy gate (CRITICAL fix — see _check_preview_access docstring)
    denied = _check_preview_access(asset)
    if denied is not None:
        return denied  # type: ignore[return-value]

    # 2. Resolve source path — local only (SSRF guard)
    source_path = PptxConverter.resolve_source_path(asset)
    if source_path is None:
        return _error_json(  # type: ignore[return-value]
            400,
            "bad_request",
            "Asset does not have a resolvable local file path. Remote URIs are not proxied.",
        )
    # 2b. Workspace containment (LFI guard — R6, findings F-002)
    safe_path = _resolve_within_workspace(source_path)
    if safe_path is None:
        return _error_json(  # type: ignore[return-value]
            400,
            "bad_request",
            "Asset path resolves outside the permitted workspace.",
        )
    source_path = safe_path
    if not source_path.exists():
        return _error_json(  # type: ignore[return-value]
            404,
            "not_found",
            f"Asset '{assetId}' source file not found.",
        )

    # 3. Determine effective MIME type
    raw_mime: str | None = getattr(asset, "mime_type", None)
    if raw_mime:
        mime = raw_mime.split(";")[0].strip().lower()
    else:
        guessed, _ = mimetypes.guess_type(str(source_path))
        mime = (guessed or "application/octet-stream").lower()

    # 4. MIME allow-list check (seam contract §4)
    if mime not in _PROXY_ALLOWED_MIMES:
        return _error_json(  # type: ignore[return-value]
            415,
            "unsupported_media_type",
            f"MIME type '{mime}' is not permitted for preview proxy.",
        )

    # 4b. Range header syntax pre-validation (MAJOR(downgraded) fix): reject
    # malformed values with the API's JSON error envelope before delegating
    # range math/satisfiability to Starlette's FileResponse.
    range_error = _validate_range_header(request.headers.get("range"))
    if range_error is not None:
        return range_error  # type: ignore[return-value]

    # 5. Build safe response headers (P4C-002: nosniff + attachment for risky
    # types). Passed into the FileResponse constructor below so they carry
    # through on both the plain 200 path and Starlette's Range-derived 206
    # (MAJOR(downgraded) fix).
    headers: dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        # Never emit Set-Cookie — we own the response, so this is implicit.
        # Adding a no-op comment here to document the invariant explicitly.
    }
    if mime not in _INLINE_SAFE_MIMES:
        # MAJOR fix: header-injection-safe Content-Disposition (RFC 5987/6266)
        # instead of naive quote-escaping of source_path.name.
        headers["Content-Disposition"] = _content_disposition_header(source_path.name)

    return FileResponse(
        path=str(source_path),
        media_type=mime,
        headers=headers,
    )


# ---------------------------------------------------------------------------
# Inline HTML preview — CSP-sandboxed
# ---------------------------------------------------------------------------


#: HTML file extensions accepted when the recorded MIME is a generic text/* type.
_HTML_EXTENSIONS: frozenset[str] = frozenset({".html", ".htm"})


@router.get(
    "/asset/{assetId}/html",
    summary="Serve HTML asset inline with a CSP sandbox for iframe hosting",
)
def get_asset_html(assetId: str) -> FileResponse:
    """Serve an HTML asset inline so the web app can host it in a sandboxed iframe.

    This exists as a separate route from the content proxy (``/content``)
    because that proxy deliberately forces ``Content-Disposition: attachment``
    on ``text/html`` (R6 XSS hardening — see ``_INLINE_SAFE_MIMES`` above).
    Inline rendering of user-supplied HTML from the same origin as the app
    would let a hostile document read cookies / localStorage / call the API
    with the user's credentials, so plain inline delivery is unsafe.

    This route replaces that guard with a stronger one: the CSP directive
    ``sandbox allow-scripts`` forces the browser to treat the response as if
    it were loaded into a sandboxed iframe with a **unique, opaque origin**.
    Scripts still run (so previews of interactive HTML work), but the
    document has no same-origin access — it cannot read the app's cookies,
    localStorage, or IndexedDB, and cannot fetch app APIs as the user. It
    is safe to drop into an ``<iframe>`` or open in a new tab.

    Additional invariants:
      - Same ``_check_preview_access`` policy gate as the content proxy
        (403 for ``agent_access`` in {none, metadata_only}).
      - Same ``file://``-only + workspace-containment guards (no SSRF/LFI).
      - Only asset records whose MIME is ``text/html`` /
        ``application/xhtml+xml`` — or generic ``text/*`` with an
        ``.html``/``.htm`` filename (resolved path or logical asset URI,
        since content-addressed blobs are extensionless) — are eligible;
        anything else returns 415.
      - ``X-Content-Type-Options: nosniff`` still emitted so the browser
        does not silently reinterpret the response as another type.
      - ``Referrer-Policy: no-referrer`` so navigations out of the
        sandboxed document do not leak the API URL.
    """
    # 1. Resolve asset
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

    # 2. Policy gate — identical semantics to the content proxy
    denied = _check_preview_access(asset)
    if denied is not None:
        return denied  # type: ignore[return-value]

    # 3. Resolve source path — local only (SSRF guard)
    source_path = PptxConverter.resolve_source_path(asset)
    if source_path is None:
        return _error_json(  # type: ignore[return-value]
            400,
            "bad_request",
            "Asset does not have a resolvable local file path. Remote URIs are not proxied.",
        )
    safe_path = _resolve_within_workspace(source_path)
    if safe_path is None:
        return _error_json(  # type: ignore[return-value]
            400,
            "bad_request",
            "Asset path resolves outside the permitted workspace.",
        )
    source_path = safe_path
    if not source_path.exists():
        return _error_json(  # type: ignore[return-value]
            404,
            "not_found",
            f"Asset '{assetId}' source file not found.",
        )

    # 4. HTML eligibility check — text/html (or XHTML), or a text/* MIME on an
    # .html/.htm file. Content-addressed blobs resolve to extensionless paths,
    # so the asset's *logical* URIs are consulted alongside the resolved path
    # (mirrors the frontend dispatcher, which routes on `asset.uri` extension).
    raw_mime: str | None = getattr(asset, "mime_type", None)
    if raw_mime:
        mime = raw_mime.split(";")[0].strip().lower()
    else:
        guessed, _ = mimetypes.guess_type(str(source_path))
        mime = (guessed or "application/octet-stream").lower()

    suffixes = {source_path.suffix.lower()}
    for logical_uri in (getattr(asset, "uri", None), getattr(asset, "original_uri", None)):
        if logical_uri:
            # `file://report.html` parses the bare name as netloc, not path.
            parsed = urlparse(str(logical_uri))
            tail = parsed.path or parsed.netloc
            suffixes.add(Path(tail).suffix.lower())
    is_html = mime in ("text/html", "application/xhtml+xml") or (
        mime.startswith("text/") and bool(suffixes & _HTML_EXTENSIONS)
    )
    if not is_html:
        return _error_json(  # type: ignore[return-value]
            415,
            "unsupported_media_type",
            f"MIME type '{mime}' is not eligible for inline HTML preview.",
        )

    # 5. Inline delivery with sandbox CSP as the XSS hardening (in place of the
    # content proxy's attachment guard). ``sandbox allow-scripts`` forces a
    # unique-origin execution context, so scripts run without same-origin
    # access to the app's cookies/storage/API credentials.
    headers: dict[str, str] = {
        "Content-Security-Policy": "sandbox allow-scripts",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
    }

    return FileResponse(
        path=str(source_path),
        media_type="text/html",
        headers=headers,
    )
