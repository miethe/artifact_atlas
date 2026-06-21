"""PPTX → PDF conversion service (P4C-001).

Converts PPTX files to PDF using LibreOffice headless (soffice).

Design invariants:
- Heavy/binary dependency (soffice) is detected at *call time* via shutil.which(),
  NOT at import time — module always imports cleanly even when soffice is absent.
- On missing soffice → ConverterUnavailableError  (caller maps to HTTP 503).
- Magic-bytes + extension/MIME validation → MagicBytesError   (caller: HTTP 415).
- Size limit exceeded → SizeLimitExceededError               (caller: HTTP 413).
- Conversion timeout/failure → ConversionError               (caller: HTTP 422).
- Cache keyed by (assetId, source mtime): skip reconversion when cache is fresh.
- PyMuPDF (fitz) for page counting is optional; falls back to 0 gracefully.
"""

from __future__ import annotations

import logging
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.asset import Asset

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_PPTX_MAGIC: bytes = b"PK\x03\x04"  # ZIP/OOXML container signature
_PPTX_MIME: str = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
)
_PPTX_EXTENSION: str = ".pptx"
_MAX_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
_CONVERT_TIMEOUT_SECS: int = 30


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------


class ConverterUnavailableError(Exception):
    """soffice binary not found on PATH (→ HTTP 503)."""


class SizeLimitExceededError(Exception):
    """File exceeds the maximum allowed size (→ HTTP 413)."""


class MagicBytesError(Exception):
    """File does not match PPTX magic bytes, extension, or MIME (→ HTTP 415)."""


class ConversionError(Exception):
    """Conversion subprocess failed or timed out (→ HTTP 422)."""


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------


@dataclass
class ConversionResult:
    """Outcome of a PPTX → PDF conversion."""

    pdf_path: Path
    page_count: int
    cached: bool


# ---------------------------------------------------------------------------
# Optional PyMuPDF guard
# ---------------------------------------------------------------------------


def _try_import_fitz() -> Any:
    """Return fitz (PyMuPDF) module or None if not installed."""
    try:
        import fitz  # type: ignore[import-untyped]

        return fitz
    except ImportError:
        return None


# ---------------------------------------------------------------------------
# Converter service
# ---------------------------------------------------------------------------


class PptxConverter:
    """Convert PPTX assets to PDF via LibreOffice headless.

    This class imports cleanly whether or not ``soffice`` is installed; all
    binary-availability checks happen at call time (not import time).
    """

    def __init__(self, cache_dir: Path) -> None:
        self._cache_dir = cache_dir

    # ------------------------------------------------------------------
    # Static helpers
    # ------------------------------------------------------------------

    @staticmethod
    def soffice_available() -> bool:
        """Return True if ``soffice`` is found on PATH."""
        return shutil.which("soffice") is not None

    @staticmethod
    def resolve_source_path(asset: "Asset") -> Path | None:
        """Resolve the local filesystem ``Path`` for an asset.

        Preference order: ``storage_uri`` → ``uri``.  Only ``file://`` URIs
        and bare absolute/relative paths are accepted.  Remote URIs
        (``http://``, ``https://``, ``s3://``, ``gs://``) return ``None``
        to prevent SSRF.

        Returns ``None`` if the URI cannot be mapped to a local path.
        """
        raw_uri: str = (asset.storage_uri or asset.uri or "").strip()
        if not raw_uri:
            return None

        # Remote URI — do NOT proxy; caller must treat as not-resolvable
        if raw_uri.startswith(("http://", "https://", "s3://", "gs://", "ftp://")):
            return None

        # file:///path/to/file → /path/to/file
        if raw_uri.startswith("file://"):
            return Path(raw_uri[7:])

        # Bare path (absolute or relative)
        return Path(raw_uri)

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    def validate_pptx(
        self,
        source_path: Path,
        asset_mime: str | None = None,
    ) -> None:
        """Validate that *source_path* is a well-formed PPTX file.

        Validation order (per seam contract §3):
        1. Magic-bytes: must start with ``PK\\x03\\x04``  → MagicBytesError
        2. Extension: must be ``.pptx``                  → MagicBytesError
        3. MIME (if provided): must match PPTX MIME type → MagicBytesError
        4. Size: must not exceed ``_MAX_SIZE_BYTES``      → SizeLimitExceededError

        Raises:
            MagicBytesError: on magic/extension/MIME mismatch (→ HTTP 415).
            SizeLimitExceededError: on oversized file (→ HTTP 413).
        """
        # 1. Magic-bytes check (read 4 bytes)
        try:
            with source_path.open("rb") as fh:
                header = fh.read(4)
        except OSError as exc:
            raise MagicBytesError(f"Cannot read source file: {exc}") from exc

        if header != _PPTX_MAGIC:
            raise MagicBytesError(
                f"File does not start with PPTX/ZIP magic bytes "
                f"(got {header!r}, expected {_PPTX_MAGIC!r})"
            )

        # 2. Extension check
        if source_path.suffix.lower() != _PPTX_EXTENSION:
            raise MagicBytesError(
                f"File extension '{source_path.suffix}' is not '{_PPTX_EXTENSION}'"
            )

        # 3. MIME check (only when the asset record provides an explicit MIME)
        if asset_mime is not None and asset_mime != _PPTX_MIME:
            raise MagicBytesError(
                f"Asset MIME type '{asset_mime}' does not match "
                f"expected PPTX MIME '{_PPTX_MIME}'"
            )

        # 4. Size check
        try:
            size = source_path.stat().st_size
        except OSError as exc:
            raise MagicBytesError(f"Cannot stat source file: {exc}") from exc

        if size > _MAX_SIZE_BYTES:
            raise SizeLimitExceededError(
                f"File size {size} bytes exceeds maximum {_MAX_SIZE_BYTES} bytes"
            )

    # ------------------------------------------------------------------
    # Cache helpers
    # ------------------------------------------------------------------

    def _cache_path(self, asset_id: str) -> Path:
        """Return the cache file path for a given asset ID."""
        return self._cache_dir / f"{asset_id}.pdf"

    def _is_cache_fresh(self, asset_id: str, source_path: Path) -> bool:
        """Return True if cached PDF exists and is at least as new as the source."""
        cached = self._cache_path(asset_id)
        if not cached.exists():
            return False
        try:
            return cached.stat().st_mtime >= source_path.stat().st_mtime
        except OSError:
            return False

    def _count_pdf_pages(self, pdf_path: Path) -> int:
        """Count pages in a PDF using PyMuPDF if available, else return 0."""
        fitz = _try_import_fitz()
        if fitz is None:
            return 0
        try:
            doc = fitz.open(str(pdf_path))
            count = doc.page_count
            doc.close()
            return count
        except Exception as exc:
            logger.debug("Could not count PDF pages in %s: %s", pdf_path, exc)
            return 0

    # ------------------------------------------------------------------
    # Main conversion entry point
    # ------------------------------------------------------------------

    def convert(self, asset_id: str, source_path: Path) -> ConversionResult:
        """Convert *source_path* (PPTX) to PDF using LibreOffice headless.

        Returns a :class:`ConversionResult` with the PDF path, page count,
        and whether the result came from cache.

        Raises:
            ConverterUnavailableError: soffice not found on PATH.
            ConversionError: subprocess timed out or exited non-zero.
        """
        if not self.soffice_available():
            raise ConverterUnavailableError("soffice not found on PATH")

        self._cache_dir.mkdir(parents=True, exist_ok=True)

        # Serve from cache if fresh
        if self._is_cache_fresh(asset_id, source_path):
            pdf_path = self._cache_path(asset_id)
            page_count = self._count_pdf_pages(pdf_path)
            logger.debug("PPTX cache hit for asset %s", asset_id)
            return ConversionResult(pdf_path=pdf_path, page_count=page_count, cached=True)

        target_pdf = self._cache_path(asset_id)

        # Convert into a per-call temp dir so concurrent conversions of source
        # files that share a filename stem cannot clobber each other's soffice
        # output (TOCTOU race on <stem>.pdf — review finding). The result is then
        # atomically moved into the cache as {asset_id}.pdf.
        with tempfile.TemporaryDirectory(dir=self._cache_dir) as tmpdir:
            try:
                result = subprocess.run(
                    [
                        "soffice",
                        "--headless",
                        "--convert-to",
                        "pdf",
                        "--outdir",
                        tmpdir,
                        str(source_path),
                    ],
                    capture_output=True,
                    timeout=_CONVERT_TIMEOUT_SECS,
                )
            except subprocess.TimeoutExpired as exc:
                raise ConversionError(
                    f"soffice conversion timed out after {_CONVERT_TIMEOUT_SECS}s"
                ) from exc
            except Exception as exc:
                raise ConversionError(f"soffice subprocess error: {exc}") from exc

            if result.returncode != 0:
                stderr = result.stderr.decode("utf-8", errors="replace")[:500]
                raise ConversionError(f"soffice exited {result.returncode}: {stderr}")

            # soffice names the output <source_stem>.pdf inside the temp outdir;
            # move it into the cache under the asset-id-keyed name.
            raw_pdf = Path(tmpdir) / f"{source_path.stem}.pdf"
            if not raw_pdf.exists():
                raise ConversionError("soffice did not produce expected PDF output")
            raw_pdf.replace(target_pdf)

        page_count = self._count_pdf_pages(target_pdf)
        logger.info(
            "PPTX converted to PDF for asset %s (%d pages)", asset_id, page_count
        )
        return ConversionResult(pdf_path=target_pdf, page_count=page_count, cached=False)
