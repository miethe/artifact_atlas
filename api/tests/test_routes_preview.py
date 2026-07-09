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


def _create_pptx_asset(
    project_id: str,
    uri: str,
    mime: str | None = None,
    agent_access: str = "preview_allowed",
) -> dict:
    payload: dict = {
        "title": "Test PPTX",
        "source_kind": "local",
        "uri": uri,
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": agent_access,
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

    def test_denied_agent_access_returns_403(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """metadata_only assets must not reach the converter (policy gate,
        same bar as /content and /cache): 403 before any file access."""
        pptx_file = tmp_path / "deck.pptx"
        _write_pptx_bytes(pptx_file)

        pid = _create_project()
        asset = _create_pptx_asset(
            pid, f"file://{pptx_file}", mime=_PPTX_MIME, agent_access="metadata_only"
        )

        resp = client.post(
            "/api/preview/convert/pptx",
            json={"assetId": asset["id"]},
        )
        assert resp.status_code == 403, resp.text
        assert resp.json()["error"]["code"] == "policy_denied"

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


def _create_generic_asset(project_id: str, agent_access: str, **overrides: object) -> dict:
    """Create an asset unrelated to PPTX conversion, for cache-endpoint policy tests.

    The cache endpoint now looks up the asset backing ``assetId`` (CRITICAL
    finding 1 fix) — the cached PDF filename must match a *real* asset ID
    (assigned by AssetService, format ``asset_<16 hex chars>``), so tests
    can no longer write straight to an arbitrary ``asset_abc123.pdf`` path.
    """
    payload: dict = {
        "title": "Cached Deck",
        "source_kind": "local",
        "uri": "file:///nonexistent/deck.pptx",
        "mime_type": "application/pdf",
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": agent_access,
    }
    payload.update(overrides)
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()


class TestGetCachedPdf:
    """Tests for GET /api/preview/cache/{assetId}."""

    def test_not_found_returns_404(self, tmp_registry: Path) -> None:
        """Non-existent asset/cached PDF returns 404."""
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
        """When a cached PDF exists for a preview-allowed asset it is served."""
        import app.settings as _settings_mod

        pid = _create_project()
        asset = _create_generic_asset(pid, "preview_allowed")

        # Point pptx_cache_dir at a temp location and create a fake PDF
        # matching the real asset's generated ID.
        cache_dir = tmp_path / "pptx-cache"
        cache_dir.mkdir()
        pdf = cache_dir / f"{asset['id']}.pdf"
        pdf.write_bytes(b"%PDF-1.4 test")

        monkeypatch.setattr(
            _settings_mod._settings_instance, "pptx_cache_dir", cache_dir  # type: ignore[arg-type]
        )

        resp = client.get(f"/api/preview/cache/{asset['id']}")
        assert resp.status_code == 200, resp.text
        assert resp.headers["content-type"].startswith("application/pdf")
        assert resp.headers.get("x-content-type-options") == "nosniff"
        assert resp.headers.get("cache-control") == "private, no-store"

    def test_denied_agent_access_none_returns_403(
        self, tmp_registry: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """CRITICAL finding 1: agent_access=none on the cache endpoint → 403."""
        import app.settings as _settings_mod

        pid = _create_project()
        asset = _create_generic_asset(pid, "none")

        cache_dir = tmp_path / "pptx-cache"
        cache_dir.mkdir()
        (cache_dir / f"{asset['id']}.pdf").write_bytes(b"%PDF-1.4 test")
        monkeypatch.setattr(
            _settings_mod._settings_instance, "pptx_cache_dir", cache_dir  # type: ignore[arg-type]
        )

        resp = client.get(f"/api/preview/cache/{asset['id']}")
        assert resp.status_code == 403, resp.text
        assert resp.json()["error"]["code"] == "policy_denied"

    def test_denied_agent_access_metadata_only_returns_403(
        self, tmp_registry: Path, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """CRITICAL finding 1: agent_access=metadata_only on the cache endpoint → 403."""
        import app.settings as _settings_mod

        pid = _create_project()
        asset = _create_generic_asset(pid, "metadata_only")

        cache_dir = tmp_path / "pptx-cache"
        cache_dir.mkdir()
        (cache_dir / f"{asset['id']}.pdf").write_bytes(b"%PDF-1.4 test")
        monkeypatch.setattr(
            _settings_mod._settings_instance, "pptx_cache_dir", cache_dir  # type: ignore[arg-type]
        )

        resp = client.get(f"/api/preview/cache/{asset['id']}")
        assert resp.status_code == 403, resp.text
        assert resp.json()["error"]["code"] == "policy_denied"


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
            "agent_access": "preview_allowed",
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
            "agent_access": "preview_allowed",
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
            "agent_access": "preview_allowed",
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
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        cd = resp.headers.get("content-disposition", "")
        assert "attachment" in cd, f"Expected attachment, got: {cd}"

    def test_audio_mime_served_inline(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Audio MIME types clear the allow-list and are served inline (no attachment)."""
        audio_file = tmp_path / "clip.mp3"
        audio_file.write_bytes(b"ID3" + b"\x00" * 100)

        pid = _create_project()
        payload = {
            "title": "Clip",
            "source_kind": "local",
            "uri": f"file://{audio_file}",
            "mime_type": "audio/mpeg",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        assert "content-disposition" not in resp.headers

    def test_video_mime_served_inline(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Video MIME types clear the allow-list and are served inline (no attachment)."""
        video_file = tmp_path / "clip.mp4"
        video_file.write_bytes(b"\x00\x00\x00\x18ftypmp42" + b"\x00" * 100)

        pid = _create_project()
        payload = {
            "title": "Clip",
            "source_kind": "local",
            "uri": f"file://{video_file}",
            "mime_type": "video/mp4",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        assert "content-disposition" not in resp.headers

    def test_tsv_mime_served(self, tmp_registry: Path, tmp_path: Path) -> None:
        """text/tab-separated-values clears the allow-list."""
        tsv_file = tmp_path / "data.tsv"
        tsv_file.write_bytes(b"a\tb\n1\t2\n")

        pid = _create_project()
        payload = {
            "title": "Data",
            "source_kind": "local",
            "uri": f"file://{tsv_file}",
            "mime_type": "text/tab-separated-values",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text


# ---------------------------------------------------------------------------
# GET /api/preview/asset/{assetId}/content — HTTP Range support (WS-3)
# ---------------------------------------------------------------------------


class TestGetAssetContentRange:
    """Range-request behavior on the content proxy (video/audio streaming)."""

    def _create_video_asset(self, tmp_path: Path, data: bytes) -> str:
        video_file = tmp_path / "clip.mp4"
        video_file.write_bytes(data)

        pid = _create_project()
        payload = {
            "title": "Clip",
            "source_kind": "local",
            "uri": f"file://{video_file}",
            "mime_type": "video/mp4",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201, resp.text
        return resp.json()["id"]

    def test_no_range_header_returns_full_body_200(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """No Range header → unchanged 200 full-body response (existing behavior)."""
        data = bytes(range(256)) * 4  # 1024 bytes
        asset_id = self._create_video_asset(tmp_path, data)

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        assert resp.content == data
        assert resp.headers.get("accept-ranges") == "bytes"
        assert "content-range" not in resp.headers

    def test_valid_byte_range_returns_206_partial_content(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A satisfiable byte range returns 206 with the correct slice + Content-Range."""
        data = bytes(range(256)) * 4  # 1024 bytes
        asset_id = self._create_video_asset(tmp_path, data)

        resp = client.get(
            f"/api/preview/asset/{asset_id}/content",
            headers={"Range": "bytes=10-19"},
        )
        assert resp.status_code == 206, resp.text
        assert resp.content == data[10:20]
        assert resp.headers.get("content-range") == f"bytes 10-19/{len(data)}"
        assert resp.headers.get("content-length") == "10"
        assert resp.headers.get("accept-ranges") == "bytes"

    def test_open_ended_range_returns_206_to_end_of_file(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """An open-ended range ("bytes=N-") streams from N through EOF."""
        data = bytes(range(256)) * 4  # 1024 bytes
        asset_id = self._create_video_asset(tmp_path, data)

        resp = client.get(
            f"/api/preview/asset/{asset_id}/content",
            headers={"Range": "bytes=1000-"},
        )
        assert resp.status_code == 206, resp.text
        assert resp.content == data[1000:]
        assert resp.headers.get("content-range") == f"bytes 1000-1023/{len(data)}"

    def test_out_of_bounds_range_returns_416(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A range entirely beyond the file size returns 416 Range Not Satisfiable."""
        data = bytes(range(256)) * 4  # 1024 bytes
        asset_id = self._create_video_asset(tmp_path, data)

        resp = client.get(
            f"/api/preview/asset/{asset_id}/content",
            headers={"Range": "bytes=5000-6000"},
        )
        assert resp.status_code == 416, resp.text
        # Content-Range on a 416 identifies the resource's total size so the
        # client can retry with a satisfiable range (RFC 7233 §4.4).
        assert resp.headers.get("content-range") == f"*/{len(data)}"

    def test_range_on_non_video_mime_still_works(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """Range support is generic — it also applies to already-supported MIME types (e.g. PDF)."""
        pdf_file = tmp_path / "doc.pdf"
        data = b"%PDF-1.4 " + b"X" * 500
        pdf_file.write_bytes(data)

        pid = _create_project()
        payload = {
            "title": "Doc",
            "source_kind": "local",
            "uri": f"file://{pdf_file}",
            "mime_type": "application/pdf",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        asset_id = resp.json()["id"]

        resp = client.get(
            f"/api/preview/asset/{asset_id}/content",
            headers={"Range": "bytes=0-9"},
        )
        assert resp.status_code == 206, resp.text
        assert resp.content == data[0:10]


# ---------------------------------------------------------------------------
# GET /api/preview/asset/{assetId}/content — agent_access policy gate
# (CRITICAL finding 1: the proxy previously served bytes for any assetId
# with no policy check at all)
# ---------------------------------------------------------------------------


def _create_pdf_asset(project_id: str, tmp_path: Path, agent_access: str) -> str:
    pdf_file = tmp_path / f"policy-{agent_access}.pdf"
    pdf_file.write_bytes(b"%PDF-1.4 " + b"X" * 50)
    payload = {
        "title": "Policy asset",
        "source_kind": "local",
        "uri": f"file://{pdf_file}",
        "mime_type": "application/pdf",
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": agent_access,
    }
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestGetAssetContentPolicy:
    """CRITICAL finding 1 coverage: agent_access policy gate on the content proxy."""

    def test_allowed_preview_access_serves_content(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """agent_access=preview_allowed clears the gate and serves bytes."""
        pid = _create_project()
        asset_id = _create_pdf_asset(pid, tmp_path, "preview_allowed")

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text
        assert resp.content.startswith(b"%PDF-1.4")

    def test_allowed_read_allowed_serves_content(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """agent_access=read_allowed (above the preview bar) also serves bytes."""
        pid = _create_project()
        asset_id = _create_pdf_asset(pid, tmp_path, "read_allowed")

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text

    def test_denied_agent_access_none_returns_403(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """agent_access=none is a hard policy deny → 403 policy_denied envelope."""
        pid = _create_project()
        asset_id = _create_pdf_asset(pid, tmp_path, "none")

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 403, resp.text
        body = resp.json()
        assert body["error"]["code"] == "policy_denied"
        assert "request_id" in body["error"]

    def test_denied_agent_access_metadata_only_returns_403(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """agent_access=metadata_only cannot clear the preview bar → 403."""
        pid = _create_project()
        asset_id = _create_pdf_asset(pid, tmp_path, "metadata_only")

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 403, resp.text
        assert resp.json()["error"]["code"] == "policy_denied"


# ---------------------------------------------------------------------------
# GET /api/preview/asset/{assetId}/content — Content-Disposition hardening
# (MAJOR finding 2: CR/LF header-injection via source_path.name)
# ---------------------------------------------------------------------------


class TestContentDispositionHardening:
    """MAJOR finding 2 coverage: header-injection-safe Content-Disposition."""

    def test_hostile_filename_does_not_inject_headers(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A filename containing CR/LF cannot smuggle an extra response header."""
        # CR/LF are valid bytes in a POSIX filename — only NUL and "/" are
        # forbidden — so this can be a real file on disk.
        hostile_name = 'evil\r\nX-Injected: pwned\r\nSet-Cookie: sid=hijacked".docx'
        docx_file = tmp_path / hostile_name
        docx_file.write_bytes(b"PK\x03\x04" + b"\x00" * 50)

        pid = _create_project()
        payload = {
            "title": "Hostile filename",
            "source_kind": "local",
            "uri": f"file://{docx_file}",
            "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201, resp.text
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/content")
        assert resp.status_code == 200, resp.text

        # No injected header made it through.
        assert "x-injected" not in resp.headers
        assert "set-cookie" not in resp.headers

        cd = resp.headers.get("content-disposition", "")
        assert "\r" not in cd and "\n" not in cd
        assert cd.startswith("attachment;")
        # RFC 5987 filename* fallback is present; both the ASCII fallback
        # and the percent-encoded value have the CR/LF control characters
        # stripped entirely — there is no encoded form that could round-trip
        # back into a raw CR/LF on any client.
        assert "filename*=UTF-8''" in cd
        assert "%0D" not in cd and "%0d" not in cd
        assert "%0A" not in cd and "%0a" not in cd


# ---------------------------------------------------------------------------
# GET /api/preview/asset/{assetId}/content — malformed Range header
# (MAJOR(downgraded) finding 4: Starlette's bare PlainTextResponse(400)
# broke the API's JSON error-envelope contract)
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# GET /api/preview/asset/{assetId}/html — inline HTML preview (CSP-sandboxed)
# ---------------------------------------------------------------------------


def _create_html_asset(
    project_id: str,
    tmp_path: Path,
    agent_access: str,
    mime: str = "text/html",
    filename: str = "page.html",
) -> str:
    html_file = tmp_path / filename
    html_file.write_text("<html><body>hello</body></html>", encoding="utf-8")
    payload: dict = {
        "title": "Test HTML",
        "source_kind": "local",
        "uri": f"file://{html_file}",
        "mime_type": mime,
        "status": "inbox",
        "sensitivity": "personal",
        "agent_access": agent_access,
    }
    resp = client.post(f"/api/projects/{project_id}/assets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


class TestGetAssetHtml:
    """Tests for GET /api/preview/asset/{assetId}/html."""

    def test_200_html_asset_preview_allowed(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """HTML asset with preview_allowed: text/html response, inline, CSP sandbox."""
        pid = _create_project()
        asset_id = _create_html_asset(pid, tmp_path, "preview_allowed")

        resp = client.get(f"/api/preview/asset/{asset_id}/html")
        assert resp.status_code == 200, resp.text

        # Content-type must be text/html (inline)
        assert resp.headers["content-type"].startswith("text/html")

        # Must NOT have Content-Disposition: attachment
        assert "content-disposition" not in resp.headers

        # Security headers required by the route contract
        csp = resp.headers.get("content-security-policy", "")
        assert "sandbox" in csp, f"Expected 'sandbox' in CSP, got: {csp!r}"
        assert resp.headers.get("x-content-type-options") == "nosniff"

    def test_403_metadata_only(self, tmp_registry: Path, tmp_path: Path) -> None:
        """agent_access=metadata_only → 403 policy_denied."""
        pid = _create_project()
        asset_id = _create_html_asset(pid, tmp_path, "metadata_only")

        resp = client.get(f"/api/preview/asset/{asset_id}/html")
        assert resp.status_code == 403, resp.text
        assert resp.json()["error"]["code"] == "policy_denied"

    def test_403_none(self, tmp_registry: Path, tmp_path: Path) -> None:
        """agent_access=none → 403 policy_denied."""
        pid = _create_project()
        asset_id = _create_html_asset(pid, tmp_path, "none")

        resp = client.get(f"/api/preview/asset/{asset_id}/html")
        assert resp.status_code == 403, resp.text
        assert resp.json()["error"]["code"] == "policy_denied"

    def test_415_non_html_asset(self, tmp_registry: Path, tmp_path: Path) -> None:
        """Non-HTML MIME (e.g. PDF) returns 415 unsupported_media_type."""
        pdf_file = tmp_path / "doc.pdf"
        pdf_file.write_bytes(b"%PDF-1.4 content")
        pid = _create_project()
        payload: dict = {
            "title": "PDF",
            "source_kind": "local",
            "uri": f"file://{pdf_file}",
            "mime_type": "application/pdf",
            "status": "inbox",
            "sensitivity": "personal",
            "agent_access": "preview_allowed",
        }
        resp = client.post(f"/api/projects/{pid}/assets", json=payload)
        assert resp.status_code == 201, resp.text
        asset_id = resp.json()["id"]

        resp = client.get(f"/api/preview/asset/{asset_id}/html")
        assert resp.status_code == 415, resp.text
        assert resp.json()["error"]["code"] == "unsupported_media_type"

    def test_404_unknown_asset(self, tmp_registry: Path) -> None:
        """Unknown asset ID returns 404."""
        resp = client.get("/api/preview/asset/asset_doesnotexist/html")
        assert resp.status_code == 404, resp.text

    def test_uploaded_extensionless_blob_with_html_name_accepted(
        self, tmp_registry: Path
    ) -> None:
        """Uploaded content lands in the content-addressed store at an
        extensionless blob path; HTML eligibility must consult the asset's
        logical URI (``report.html``) when the MIME is generic ``text/*``."""
        resp = client.post(
            "/api/projects/p-html-upload/inbox/upload",
            files=[("files", ("report.html", b"<html><body>up</body></html>", "text/plain"))],
            data={"sensitivity": "personal", "agent_access": "preview_allowed"},
        )
        assert resp.status_code == 202, resp.text
        asset_id = resp.json()["asset_ids"][0]

        html = client.get(f"/api/preview/asset/{asset_id}/html")
        assert html.status_code == 200, html.text
        assert html.headers["content-type"].startswith("text/html")
        assert "sandbox" in html.headers.get("content-security-policy", "")

    def test_htm_extension_with_text_mime_accepted(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """An .htm file with a generic text/plain MIME is accepted as HTML."""
        pid = _create_project()
        asset_id = _create_html_asset(
            pid, tmp_path, "preview_allowed", mime="text/plain", filename="page.htm"
        )

        resp = client.get(f"/api/preview/asset/{asset_id}/html")
        assert resp.status_code == 200, resp.text
        assert "sandbox" in resp.headers.get("content-security-policy", "")


class TestMalformedRangeHeader:
    """MAJOR(downgraded) finding 4 coverage: malformed Range → JSON 400."""

    def test_malformed_range_header_returns_json_400(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """A syntactically invalid Range header gets the API's JSON envelope,
        not Starlette's bare PlainTextResponse(400)."""
        pid = _create_project()
        asset_id = _create_pdf_asset(pid, tmp_path, "preview_allowed")

        resp = client.get(
            f"/api/preview/asset/{asset_id}/content",
            headers={"Range": "not-a-range-header"},
        )
        assert resp.status_code == 400, resp.text
        assert resp.headers["content-type"].startswith("application/json")
        body = resp.json()
        assert body["error"]["code"] == "bad_request"

    def test_multi_range_header_returns_json_400(
        self, tmp_registry: Path, tmp_path: Path
    ) -> None:
        """This proxy only supports a single byte range; comma-separated
        multi-range requests are rejected as malformed (not silently
        upgraded to a multipart/byteranges response)."""
        pid = _create_project()
        asset_id = _create_pdf_asset(pid, tmp_path, "preview_allowed")

        resp = client.get(
            f"/api/preview/asset/{asset_id}/content",
            headers={"Range": "bytes=0-9,20-29"},
        )
        assert resp.status_code == 400, resp.text
        assert resp.json()["error"]["code"] == "bad_request"
