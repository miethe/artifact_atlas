"""Preview router — PPTX-to-PDF conversion seam and asset-content proxy.

Routes:
  POST /api/preview/convert/pptx         — P4C-001: convert PPTX asset to PDF
  GET  /api/preview/cache/{assetId}      — P4C-001: serve cached converted PDF
  GET  /api/preview/asset/{assetId}/content — P4C-002: safe asset-content proxy

Security invariants (P4C-002):
  - Only local file:// URIs are proxied (no SSRF — remote URIs are rejected).
  - MIME allow-list: only safe document/image/text types served.
  - X-Content-Type-Options: nosniff always emitted.
  - Set-Cookie / Set-Cookie2 are never forwarded.
  - Non-inline-safe MIME types get Content-Disposition: attachment.
  - fetchRelated:false semantics: no linked/remote resources are auto-fetched.
"""

from __future__ import annotations

import logging
import mimetypes
import re
from pathlib import Path

from fastapi import APIRouter
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.api._deps import get_asset_service, not_found
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
        "text/html",
        "text/css",
        # --- Structured data ---
        "application/json",
        "text/xml",
        "application/xml",
        "application/yaml",
        "text/yaml",
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
        converter.validate_pptx(source_path, asset_mime=asset_mime)
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
def get_cached_pdf(assetId: str) -> FileResponse:
    """Return the cached PDF for a previously converted PPTX asset.

    The ``assetId`` path parameter is validated against a safe-character
    pattern to prevent path-traversal attacks.
    """
    if not _safe_asset_id(assetId):
        return _error_json(400, "bad_request", "Invalid assetId format.")  # type: ignore[return-value]

    settings = get_settings()
    cache_path = settings.pptx_cache_dir / f"{assetId}.pdf"

    if not cache_path.exists():
        return not_found(f"No cached PDF for asset '{assetId}'.")  # type: ignore[return-value]

    return FileResponse(
        path=str(cache_path),
        media_type="application/pdf",
        headers={"X-Content-Type-Options": "nosniff"},
    )


# ---------------------------------------------------------------------------
# P4C-002 — Asset-content proxy (MIME allow-list + security headers)
# ---------------------------------------------------------------------------


@router.get(
    "/asset/{assetId}/content",
    summary="Proxy asset file content with MIME allow-listing and security headers",
)
def get_asset_content(assetId: str) -> FileResponse:
    """Read-only, same-origin asset-content proxy (seam contract §4 / P4C-002).

    Enforces:
    - Only local ``file://`` URIs are served — remote URIs return 400 (no SSRF).
    - MIME allow-list: binary/executable MIME types return 415.
    - ``X-Content-Type-Options: nosniff`` is always emitted.
    - ``Set-Cookie`` / ``Set-Cookie2`` are never forwarded (we own the response).
    - Non-inline-safe MIME types get ``Content-Disposition: attachment``.
    - No related/remote resources are auto-fetched (fetchRelated:false semantics).
    """
    # 1. Resolve asset
    svc = get_asset_service()
    asset = svc.get_asset(assetId)
    if asset is None:
        return not_found(f"Asset '{assetId}' not found.")  # type: ignore[return-value]

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

    # 5. Build safe response headers (P4C-002: nosniff + attachment for risky types)
    headers: dict[str, str] = {
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        # Never emit Set-Cookie — we own the response, so this is implicit.
        # Adding a no-op comment here to document the invariant explicitly.
    }
    if mime not in _INLINE_SAFE_MIMES:
        filename = source_path.name
        # Escape double-quotes in filename for safety
        safe_name = filename.replace('"', '\\"')
        headers["Content-Disposition"] = f'attachment; filename="{safe_name}"'

    return FileResponse(
        path=str(source_path),
        media_type=mime,
        headers=headers,
    )
