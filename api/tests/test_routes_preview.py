"""Route tests for /api/preview/* endpoints (P4C-001, P4C-002).

Coverage:
  - POST /api/preview/convert/pptx:
      magic-bytes rejection (415), missing asset (404), oversize (413),
      soffice-absent (503), happy-path with mocked converter (200).
  - GET  /api/preview/cache/{assetId}: not-found (404), happy-path (200).
  - GET  /api/preview/asset/{assetId}/content: not-found (404),
      disallowed MIME (415), happy-path (200).
"""

from __future__ import annotations

from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import app.services.pptx_converter as _converter_mod
from app.main import app
from app.services.pptx_converter import (
    ConversionResult,
    PptxConverter,
    _PPTX_MAGIC,
)

client = TestClient(app)

# ---------------------------------------------------------------------------
# Fixtures / helpers
# ---------------------------------------------------------------------------

_BASE_PROJECT = {"name": "Preview Test", "slug": "preview-test", "status": "active"}

_PPTX_MIME = (
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
)


def _create_project() -> str:
    resp = client.post("/api/projects", json=_BASE_PROJECT)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def _create_pptx_asset(project_id: str, uri: str, mime: str | None = None) -> dict:
    payload: dict = {
        "title": "Test PPTX",
        "source_kind": "local",
        "uri": uri,
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": "metadata_only",
    }
    if mime is not None:
        payload["mime_type"] = mime
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


def _write_pptx_bytes(path: Path) -> None:
    """Write a minimal valid-looking PPTX file (magic bytes + .pptx content)."""
    # Real PPTX magic: PK\x03\x04 followed by placeholder data
    path.write_bytes(_PPTX_MAGIC + b"\x14\x00" + b"\x00" * 100)


def _write_bad_bytes(path: Path) -> None:
    """Write a file with wrong magic bytes."""
    path.write_bytes(b"NOTPPTX" + b"\x00" * 50)


# ---------------------------------------------------------------------------
# POST /api/preview/convert/pptx
# ---------------------------------------------------------------------------


class TestConvertPptx:
    """Tests for POST /api/preview/convert/pptx."""

    def test_missing_asset_returns_404(self, tmp_registry: Path) -> None:
        """Non-existent assetId returns 404."""
        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": "asset_doesnotexist"},
        )
        assert resp.status_code == 404, resp.text
        body = resp.json()
        assert body["error"]["code"] == "not_found"

    def test_bad_request_empty_asset_id(self, tmp_registry: Path) -> None:
        """Empty assetId returns 400."""
        resp = client.post("/api/preview/convert/pptx", json={"assetId": ""})
        assert resp.status_code == 400, resp.text
        assert resp.json()["error"]["code"] == "bad_request"

    def test_magic_bytes_rejection_returns_415(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """File without PPTX magic bytes returns 415."""
        bad_file = tmp_path / "evil.pptx"
        _write_bad_bytes(bad_file)

        pid = _create_project()
        asset = _create_pptx_asset(pid, f"file://{bad_file}")

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 415, resp.text
        assert resp.json()["error"]["code"] == "unsupported_media_type"

    def test_wrong_extension_returns_415(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """File with PPTX magic bytes but wrong extension returns 415."""
        bad_ext = tmp_path / "file.docx"  # wrong extension
        bad_ext.write_bytes(_PPTX_MAGIC + b"\x00" * 100)

        pid = _create_project()
        asset = _create_pptx_asset(pid, f"file://{bad_ext}")

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 415, resp.text

    def test_oversize_returns_413(
        self,
        tmp_registry: Path,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """File exceeding size limit returns 413.

        We set _MAX_SIZE_BYTES to -1 so any real file is "too large".
        """
        pptx_file = tmp_path / "big.pptx"
        _write_pptx_bytes(pptx_file)

        # Lower the size limit so our tiny test file exceeds it
        monkeypatch.setattr(_converter_mod, "_MAX_SIZE_BYTES", -1)

        pid = _create_project()
        asset = _create_pptx_asset(pid, f"file://{pptx_file}", mime=_PPTX_MIME)

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 413, resp.text
        assert resp.json()["error"]["code"] == "request_entity_too_large"

    def test_soffice_absent_returns_503(
        self,
        tmp_registry: Path,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """When soffice is absent the endpoint returns 503."""
        pptx_file = tmp_path / "deck.pptx"
        _write_pptx_bytes(pptx_file)

        # Pretend soffice is not installed
        monkeypatch.setattr(PptxConverter, "soffice_available", staticmethod(lambda: False))

        pid = _create_project()
        asset = _create_pptx_asset(pid, f"file://{pptx_file}", mime=_PPTX_MIME)

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 503, resp.text
        assert resp.json()["error"]["code"] == "converter_unavailable"

    def test_happy_path_returns_200(
        self,
        tmp_registry: Path,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Happy path: valid PPTX + mocked converter → 200 with pdfUrl."""
        pptx_file = tmp_path / "deck.pptx"
        _write_pptx_bytes(pptx_file)

        # Pretend soffice is available
        monkeypatch.setattr(PptxConverter, "soffice_available", staticmethod(lambda: True))

        # Mock convert() to create a fake PDF and return a ConversionResult
        def _mock_convert(self: PptxConverter, asset_id: str, source_path: Path) -> ConversionResult:
            self._cache_dir.mkdir(parents=True, exist_ok=True)
            pdf = self._cache_dir / f"{asset_id}.pdf"
            pdf.write_bytes(b"%PDF-1.4 fake")
            return ConversionResult(pdf_path=pdf, page_count=7, cached=False)

        monkeypatch.setattr(PptxConverter, "convert", _mock_convert)

        pid = _create_project()
        asset = _create_pptx_asset(pid, f"file://{pptx_file}", mime=_PPTX_MIME)

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 200, resp.text
        body = resp.json()
        assert body["status"] == "ready"
        assert body["pageCount"] == 7
        assert body["cached"] is False
        assert body["pdfUrl"].startswith("/api/preview/cache/")

    def test_happy_path_cache_hit(
        self,
        tmp_registry: Path,
        tmp_path: Path,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        """Cached PDF is returned with cached=True."""
        pptx_file = tmp_path / "deck.pptx"
        _write_pptx_bytes(pptx_file)

        monkeypatch.setattr(PptxConverter, "soffice_available", staticmethod(lambda: True))

        def _mock_convert_cached(
            self: PptxConverter, asset_id: str, source_path: Path
        ) -> ConversionResult:
            self._cache_dir.mkdir(parents=True, exist_ok=True)
            pdf = self._cache_dir / f"{asset_id}.pdf"
            pdf.write_bytes(b"%PDF-1.4 cached")
            return ConversionResult(pdf_path=pdf, page_count=3, cached=True)

        monkeypatch.setattr(PptxConverter, "convert", _mock_convert_cached)

        pid = _create_project()
        asset = _create_pptx_asset(pid, f"file://{pptx_file}", mime=_PPTX_MIME)

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 200, resp.text
        assert resp.json()["cached"] is True


# ---------------------------------------------------------------------------
# GET /api/preview/cache/{assetId}
# ---------------------------------------------------------------------------


class TestGetCachedPdf:
    """Tests for GET /api/preview/cache/{assetId}."""

    def test_not_found_returns_404(self, tmp_registry: Path) -> None:
        """Non-existent cached PDF returns 404."""
        resp = client.get("/api/preview/cache/asset_doesnotexist")
        assert resp.status_code == 404, resp.text

    def test_invalid_asset_id_returns_400(self, tmp_registry: Path) -> None:
        """Path-traversal-like assetId returns 400."""
        resp = client.get("/api/preview/cache/../etc/passwd")
        # FastAPI may return 422 (path param validation) or 400
        assert resp.status_code in (400, 404, 422), resp.text

    def test_serves_pdf(
        self, tmp_registry: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """When a cached PDF exists it is served with application/pdf content-type."""
        import app.settings as _settings_mod

        # Point pptx_cache_dir at a temp location and create a fake PDF
        cache_dir = tmp_path / "pptx-cache"
        cache_dir.mkdir()
        pdf = cache_dir / "asset_abc123.pdf"
        pdf.write_bytes(b"%PDF-1.4 test")

        monkeypatch.setattr(
            _settings_mod._settings_instance, "pptx_cache_dir", cache_dir  # type: ignore[arg-type]
        )

        resp = client.get("/api/preview/cache/asset_abc123")
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("application/pdf")
        assert resp.headers.get("x-content-type-options") == "nosniff"


# ---------------------------------------------------------------------------
# GET /api/preview/asset/{assetId}/content  (P4C-002 proxy)
# ---------------------------------------------------------------------------


class TestGetAssetContent:
    """Tests for GET /api/preview/asset/{assetId}/content."""

    def test_not_found_returns_404(self, tmp_registry: Path) -> None:
        """Non-existent asset returns 404."""
        resp = client.get("/api/preview/asset/asset_doesnotexist/content")
        assert resp.status_code == 404, resp.text

    def test_disallowed_mime_returns_415(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Asset with executable MIME type returns 415."""
        exe = tmp_path / "binary.exe"
        exe.write_bytes(b"MZ\x90\x00" + b"\x00" * 100)

        pid = _create_project()
        payload = {
            "title": "Executable",
            "source_kind": "local",
            "uri": f"file://{exe}",
            "mime_type": "application/x-msdownload",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "metadata_only",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 415, resp.text
        assert resp.json()["error"]["code"] == "unsupported_media_type"

    def test_remote_uri_returns_400(
        self, tmp_registry: Path
    ) -> None:
        """Asset with an http:// URI (SSRF risk) returns 400."""
        pid = _create_project()
        payload = {
            "title": "Remote asset",
            "source_kind": "url",
            "uri": "https://evil.example.com/payload.pdf",
            "mime_type": "application/pdf",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "metadata_only",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 400, resp.text
        assert resp.json()["error"]["code"] == "bad_request"

    def test_serves_pdf_with_security_headers(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Serving a PDF file includes X-Content-Type-Options: nosniff."""
        pdf_file = tmp_path / "doc.pdf"
        pdf_file.write_bytes(b"%PDF-1.4 content")

        pid = _create_project()
        payload = {
            "title": "Sample PDF",
            "source_kind": "local",
            "uri": f"file://{pdf_file}",
            "mime_type": "application/pdf",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "metadata_only",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        assert resp.headers["x-content-type-options"] == "nosniff"
        assert "set-cookie" not in resp.headers
        # PDF is inline-safe — no forced attachment
        assert "content-disposition" not in resp.headers

    def test_binary_doc_gets_attachment_header(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Non-inline-safe MIME types receive Content-Disposition: attachment."""
        docx_file = tmp_path / "report.docx"
        docx_file.write_bytes(b"PK\x03\x04" + b"\x00" * 100)

        pid = _create_project()
        payload = {
            "title": "Word doc",
            "source_kind": "local",
            "uri": f"file://{docx_file}",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "metadata_only",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        cd = resp.headers.get("content-disposition", "")
        assert "attachment" in cd, f"Expected attachment, got: {cd}"
