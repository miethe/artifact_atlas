"""Preview service (SVC-004): thumbnails for images + preview text for markdown/text.

Design invariants:
- Heavy dependencies (PIL, pdf2image, ffmpeg) are optional — guarded imports.
- PDF and video adapters degrade gracefully if deps unavailable.
- Preview text is capped at MAX_PREVIEW_CHARS characters.
- Thumbnails are written to the configured thumbnails_dir as <asset_id>.jpg.
- Preview text is written to previews_dir as <asset_id>.txt.
- Returns None (not an error) when a preview cannot be generated.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

MAX_PREVIEW_CHARS = 2000  # Characters of preview text to extract
THUMBNAIL_MAX_SIZE = (256, 256)  # PIL thumbnail target

# ---------------------------------------------------------------------------
# Optional dependency guards
# ---------------------------------------------------------------------------


def _try_import_pil() -> Any:
    """Return PIL.Image module or None if Pillow is not installed."""
    try:
        from PIL import Image  # type: ignore[import-untyped]
        return Image
    except ImportError:
        return None


def _try_import_fitz() -> Any:
    """Return fitz (PyMuPDF) module or None if not installed."""
    try:
        import fitz  # type: ignore[import-untyped]
        return fitz
    except ImportError:
        return None


# ---------------------------------------------------------------------------
# Preview service
# ---------------------------------------------------------------------------


class PreviewService:
    """Generate asset thumbnails and preview text.

    All methods return None on failure rather than raising exceptions,
    enabling graceful degradation when optional deps are absent.
    """

    def __init__(
        self,
        thumbnails_dir: Path,
        previews_dir: Path,
    ) -> None:
        self._thumbnails_dir = thumbnails_dir
        self._previews_dir = previews_dir

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate_thumbnail(self, asset_id: str, source_path: Path) -> Path | None:
        """Generate a thumbnail for an image file.

        Supports JPEG, PNG, GIF, WEBP, BMP.
        Falls back to None if Pillow is unavailable or file cannot be opened.

        Args:
            asset_id: Used to name the output file.
            source_path: Path to the source image.

        Returns:
            Path to the written thumbnail, or None on failure.
        """
        Image = _try_import_pil()
        if Image is None:
            logger.debug("Pillow not available; skipping thumbnail for %s", asset_id)
            return None

        if not source_path.exists():
            logger.debug("Source file not found: %s", source_path)
            return None

        try:
            self._thumbnails_dir.mkdir(parents=True, exist_ok=True)
            out_path = self._thumbnails_dir / f"{asset_id}.jpg"

            with Image.open(source_path) as img:
                img.thumbnail(THUMBNAIL_MAX_SIZE, Image.LANCZOS)
                if img.mode in ("RGBA", "P", "LA"):
                    img = img.convert("RGB")
                img.save(str(out_path), format="JPEG", quality=85, optimize=True)

            return out_path
        except Exception as exc:
            logger.warning("Failed to generate thumbnail for %s: %s", asset_id, exc)
            return None

    def generate_text_preview(self, asset_id: str, source_path: Path) -> Path | None:
        """Generate a preview text excerpt for a markdown or plain-text file.

        Strips markdown heading markers and trims to MAX_PREVIEW_CHARS.

        Args:
            asset_id: Used to name the output file.
            source_path: Path to the text/markdown file.

        Returns:
            Path to the written preview text file, or None on failure.
        """
        if not source_path.exists():
            logger.debug("Source file not found: %s", source_path)
            return None

        suffix = source_path.suffix.lower()
        if suffix not in (".md", ".markdown", ".txt", ".rst", ".text"):
            logger.debug("Unsupported text format for preview: %s", suffix)
            return None

        try:
            raw = source_path.read_text(encoding="utf-8", errors="replace")
        except Exception as exc:
            logger.warning("Could not read file for preview %s: %s", source_path, exc)
            return None

        preview = _extract_text_preview(raw)
        if not preview:
            return None

        try:
            self._previews_dir.mkdir(parents=True, exist_ok=True)
            out_path = self._previews_dir / f"{asset_id}.txt"
            out_path.write_text(preview, encoding="utf-8")
            return out_path
        except Exception as exc:
            logger.warning("Failed to write preview for %s: %s", asset_id, exc)
            return None

    def generate_pdf_thumbnail(self, asset_id: str, source_path: Path) -> Path | None:
        """Generate a thumbnail from the first page of a PDF.

        Requires PyMuPDF (fitz). Degrades gracefully if unavailable.

        Args:
            asset_id: Used to name the output file.
            source_path: Path to the PDF file.

        Returns:
            Path to the written thumbnail, or None on failure.
        """
        fitz = _try_import_fitz()
        if fitz is None:
            logger.debug("PyMuPDF (fitz) not available; skipping PDF thumbnail for %s", asset_id)
            return None

        Image = _try_import_pil()
        if Image is None:
            logger.debug("Pillow not available; skipping PDF thumbnail for %s", asset_id)
            return None

        if not source_path.exists():
            return None

        try:
            self._thumbnails_dir.mkdir(parents=True, exist_ok=True)
            out_path = self._thumbnails_dir / f"{asset_id}.jpg"

            doc = fitz.open(str(source_path))
            if doc.page_count == 0:
                return None

            page = doc[0]
            # Render at 72 DPI (standard screen resolution)
            mat = fitz.Matrix(1.0, 1.0)
            pix = page.get_pixmap(matrix=mat)

            # Convert pixmap to PIL
            img_data = pix.tobytes("ppm")
            import io
            img = Image.open(io.BytesIO(img_data))
            img.thumbnail(THUMBNAIL_MAX_SIZE, Image.LANCZOS)
            if img.mode != "RGB":
                img = img.convert("RGB")
            img.save(str(out_path), format="JPEG", quality=85)
            doc.close()
            return out_path
        except Exception as exc:
            logger.warning("Failed to generate PDF thumbnail for %s: %s", asset_id, exc)
            return None

    def generate_video_thumbnail(self, asset_id: str, source_path: Path) -> Path | None:
        """Generate a thumbnail from a video file at the 1-second mark.

        Requires ffmpeg on PATH. Degrades gracefully if unavailable.

        Args:
            asset_id: Used to name the output file.
            source_path: Path to the video file.

        Returns:
            Path to the written thumbnail, or None on failure.
        """
        import shutil
        if shutil.which("ffmpeg") is None:
            logger.debug("ffmpeg not found in PATH; skipping video thumbnail for %s", asset_id)
            return None

        if not source_path.exists():
            return None

        try:
            import subprocess

            self._thumbnails_dir.mkdir(parents=True, exist_ok=True)
            out_path = self._thumbnails_dir / f"{asset_id}.jpg"

            result = subprocess.run(
                [
                    "ffmpeg",
                    "-ss", "00:00:01",
                    "-i", str(source_path),
                    "-frames:v", "1",
                    "-vf", f"scale={THUMBNAIL_MAX_SIZE[0]}:{THUMBNAIL_MAX_SIZE[1]}:force_original_aspect_ratio=decrease",
                    "-y",
                    str(out_path),
                ],
                capture_output=True,
                timeout=30,
            )
            if result.returncode != 0:
                logger.warning(
                    "ffmpeg failed for %s (exit %d): %s",
                    asset_id,
                    result.returncode,
                    result.stderr.decode("utf-8", errors="replace")[:200],
                )
                return None
            return out_path
        except Exception as exc:
            logger.warning("Failed to generate video thumbnail for %s: %s", asset_id, exc)
            return None

    def preview_for_mime(
        self, asset_id: str, source_path: Path, mime_type: str | None
    ) -> tuple[Path | None, Path | None]:
        """Dispatch to the appropriate preview generator based on MIME type.

        Args:
            asset_id: Asset ID for output file naming.
            source_path: Path to the source file.
            mime_type: MIME type string (e.g. "image/jpeg", "text/markdown").

        Returns:
            Tuple of (thumbnail_path, preview_text_path), either may be None.
        """
        thumbnail_path: Path | None = None
        preview_path: Path | None = None

        if mime_type is None:
            return None, None

        mt = mime_type.lower()

        if mt.startswith("image/"):
            thumbnail_path = self.generate_thumbnail(asset_id, source_path)

        elif mt in ("text/markdown", "text/x-markdown") or mt == "text/plain":
            preview_path = self.generate_text_preview(asset_id, source_path)

        elif mt == "application/pdf":
            thumbnail_path = self.generate_pdf_thumbnail(asset_id, source_path)

        elif mt.startswith("video/"):
            thumbnail_path = self.generate_video_thumbnail(asset_id, source_path)

        elif mt.startswith("text/"):
            # Generic text: generate preview
            preview_path = self.generate_text_preview(asset_id, source_path)

        return thumbnail_path, preview_path


# ---------------------------------------------------------------------------
# Text preview extraction
# ---------------------------------------------------------------------------


def _extract_text_preview(raw: str) -> str:
    """Extract a plain-text preview from raw markdown/text content.

    Strips markdown headings, code fences, and leading/trailing whitespace.
    Returns at most MAX_PREVIEW_CHARS characters.
    """
    # Remove code fences
    text = re.sub(r"```[\s\S]*?```", "", raw)
    text = re.sub(r"`[^`\n]+`", "", text)
    # Remove markdown headings markers (keep text)
    text = re.sub(r"^#{1,6}\s*", "", text, flags=re.MULTILINE)
    # Remove markdown links, keep link text
    text = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", text)
    # Remove bold/italic markers
    text = re.sub(r"\*{1,3}([^*\n]*)\*{1,3}", r"\1", text)
    text = re.sub(r"_{1,3}([^_\n]*)_{1,3}", r"\1", text)
    # Collapse multiple blank lines
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = text.strip()

    return text[:MAX_PREVIEW_CHARS]
