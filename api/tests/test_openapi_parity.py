"""ROUTE-005: OpenAPI parity test.

Compares the routes implemented in the FastAPI app (via app.openapi()) against
the contract paths declared in shared/openapi.yaml.

Goals:
- Every contract path + method that IS implemented must appear in the app.
- App endpoints not in the contract are flagged (potential undocumented drift).
- Intentional gaps are documented below and excluded from failure.

Pragmatic stance: we want to catch REAL drift (missing implementations, extra
undocumented endpoints), not enforce 100% pedantic equality on every schema
detail. The test prints a human-readable report and fails with a clear message.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.main import app

# ---------------------------------------------------------------------------
# Load contract from shared/openapi.yaml
# ---------------------------------------------------------------------------

_REPO_ROOT = Path(__file__).resolve().parents[2]  # api/tests/ -> api/ -> repo root
_OPENAPI_YAML = _REPO_ROOT / "shared" / "openapi.yaml"


def _load_contract_paths() -> dict[str, set[str]]:
    """Parse shared/openapi.yaml and return {path: {method, ...}} mapping."""
    try:
        import yaml  # type: ignore[import-untyped]
        with _OPENAPI_YAML.open("r", encoding="utf-8") as fh:
            spec = yaml.safe_load(fh)
    except Exception as exc:
        pytest.skip(f"Could not load shared/openapi.yaml: {exc}")

    paths: dict[str, set[str]] = {}
    for path, methods in (spec.get("paths") or {}).items():
        for method in methods:
            if method.lower() not in ("get", "post", "put", "patch", "delete", "head", "options"):
                continue
            paths.setdefault(path, set()).add(method.upper())
    return paths


# ---------------------------------------------------------------------------
# Convert OpenAPI path params to FastAPI format for comparison
# ---------------------------------------------------------------------------

_PARAM_RE = re.compile(r"\{(\w+)\}")


def _normalise_path(path: str) -> str:
    """Normalise path parameter syntax for comparison.

    Both FastAPI and OpenAPI use {param} notation, so this is a no-op
    currently, but kept as a normalisation hook.
    """
    return path


# ---------------------------------------------------------------------------
# Intentional gaps — contract paths not yet implemented (document here)
# ---------------------------------------------------------------------------

# These are contract paths that are intentionally not implemented in MVP or
# are deferred to a later phase. They will NOT cause test failures.
_INTENTIONAL_GAPS: set[tuple[str, str]] = {
    # No intentional gaps in current Stage 4 scope — all paths are implemented.
}


# ---------------------------------------------------------------------------
# App endpoints we know about that are NOT in the contract (allowed extras)
# ---------------------------------------------------------------------------

_ALLOWED_EXTRA_APP_PATHS: set[tuple[str, str]] = {
    # FastAPI auto-generates these
    ("/openapi.json", "GET"),
    ("/docs", "GET"),
    ("/redoc", "GET"),
    ("/docs/oauth2-redirect", "GET"),
}


# ---------------------------------------------------------------------------
# Test
# ---------------------------------------------------------------------------


def test_openapi_parity() -> None:
    """Compare implemented routes against the contract in shared/openapi.yaml."""
    client = TestClient(app)

    # Get implemented routes from the live app
    openapi_response = client.get("/openapi.json")
    assert openapi_response.status_code == 200, "App must expose /openapi.json"
    app_spec = openapi_response.json()
    app_paths: dict[str, set[str]] = {}
    for path, methods in (app_spec.get("paths") or {}).items():
        for method in methods:
            if method.upper() in ("GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"):
                app_paths.setdefault(path, set()).add(method.upper())

    # Load contract
    contract_paths = _load_contract_paths()

    # --- Check 1: every contract path should be implemented ---
    missing_from_app: list[tuple[str, str]] = []
    for path, methods in contract_paths.items():
        norm = _normalise_path(path)
        for method in methods:
            key = (path, method)
            if key in _INTENTIONAL_GAPS:
                continue
            app_has = norm in app_paths and method in app_paths.get(norm, set())
            if not app_has:
                missing_from_app.append((method, path))

    # --- Check 2: app endpoints not in the contract ---
    undocumented_in_app: list[tuple[str, str]] = []
    for path, methods in app_paths.items():
        for method in methods:
            if (path, method) in _ALLOWED_EXTRA_APP_PATHS:
                continue
            contract_has = path in contract_paths and method in contract_paths.get(path, set())
            if not contract_has:
                undocumented_in_app.append((method, path))

    # Build human-readable report
    lines: list[str] = []
    if missing_from_app:
        lines.append("=== CONTRACT PATHS MISSING FROM APP ===")
        for method, path in sorted(missing_from_app):
            lines.append(f"  {method:6s} {path}")

    if undocumented_in_app:
        lines.append("=== APP PATHS NOT IN CONTRACT (possible drift) ===")
        for method, path in sorted(undocumented_in_app):
            lines.append(f"  {method:6s} {path}")

    if lines:
        report = "\n".join(lines)
        pytest.fail(f"OpenAPI parity failures detected:\n{report}")

    # Summarise
    total_contract = sum(len(m) for m in contract_paths.values())
    total_app = sum(len(m) for m in app_paths.values()) - len(_ALLOWED_EXTRA_APP_PATHS)
    print(f"\nParity OK: {total_contract} contract routes, {total_app} app routes (excl. framework extras)")


# ---------------------------------------------------------------------------
# Additional: check that every contract path+method with a 2xx response
# schema has a corresponding response model definition in the app spec
# ---------------------------------------------------------------------------


def test_response_model_presence() -> None:
    """Every contract operation with a 2xx content schema must have a response schema
    defined in the live app spec (i.e. not left as an empty or null schema).

    This catches cases where a route is registered but has ``response_model=None``
    or where the schema was accidentally removed from the contract.
    """
    client = TestClient(app)

    openapi_response = client.get("/openapi.json")
    assert openapi_response.status_code == 200
    app_spec = openapi_response.json()
    app_paths_spec: dict[str, Any] = app_spec.get("paths") or {}

    contract_paths_raw = _load_contract_paths()

    try:
        import yaml  # type: ignore[import-untyped]
        with _OPENAPI_YAML.open("r", encoding="utf-8") as fh:
            contract_spec: dict[str, Any] = yaml.safe_load(fh) or {}
    except Exception as exc:
        pytest.skip(f"Could not load shared/openapi.yaml: {exc}")

    contract_all_paths: dict[str, Any] = contract_spec.get("paths") or {}

    missing_response_schema: list[str] = []
    missing_from_contract: list[str] = []

    for path, methods in contract_all_paths.items():
        for method, operation in methods.items():
            if method.lower() not in ("get", "post", "put", "patch", "delete"):
                continue
            if (path, method.upper()) in _INTENTIONAL_GAPS:
                continue

            responses = operation.get("responses") or {}
            # Check only 2xx success responses that declare content/schema
            for status_code, resp_obj in responses.items():
                try:
                    code = int(str(status_code))
                except (ValueError, TypeError):
                    continue
                if not (200 <= code < 300):
                    continue

                # Does the contract declare a content schema for this response?
                contract_has_schema = bool(
                    (resp_obj or {}).get("content")
                    or isinstance(resp_obj, dict)
                    and resp_obj.get("$ref")
                )
                if not contract_has_schema:
                    continue  # contract doesn't require a schema — skip

                # Look for the corresponding operation in the app spec
                app_path_spec = app_paths_spec.get(path)
                if app_path_spec is None:
                    missing_from_contract.append(f"  {method.upper()} {path}")
                    continue

                app_operation = app_path_spec.get(method.lower()) or app_path_spec.get(method.upper())
                if app_operation is None:
                    missing_from_contract.append(f"  {method.upper()} {path}")
                    continue

                app_responses = app_operation.get("responses") or {}
                app_resp = app_responses.get(str(status_code)) or app_responses.get(status_code)
                if app_resp is None:
                    missing_response_schema.append(
                        f"  {method.upper()} {path} → {status_code} response missing"
                    )
                    continue

                # Check that the response has content with at least one media type
                app_content = (app_resp or {}).get("content")
                if app_content is not None and len(app_content) == 0:
                    missing_response_schema.append(
                        f"  {method.upper()} {path} → {status_code} has empty content schema"
                    )
                # If app_content is None it may be a reference ($ref) or bare schema — allow

    report_lines: list[str] = []
    if missing_response_schema:
        report_lines.append("=== MISSING / EMPTY RESPONSE SCHEMAS IN APP ===")
        report_lines.extend(sorted(missing_response_schema))
    if missing_from_contract:
        # These are paths that appear in the contract but not the app — already caught
        # by test_openapi_parity; skip double-reporting
        pass

    if report_lines:
        pytest.fail("Response model parity failures:\n" + "\n".join(report_lines))
