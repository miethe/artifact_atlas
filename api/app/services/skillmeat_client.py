"""SkillMeat reference adapter (SM-001).

Responsibilities:
- Provide a reference adapter for SkillMeat/SAM bundle lookups.
- No live API calls — reads from local bundle export directory.
- SkillBOM ref, Golden Context Pack candidate status are metadata-only fields.
- Exports candidate manifests to exports/skillmeat/candidates/*.yaml.

Design:
- SkillMeatClient reads YAML frontmatter from bundle_path files.
- Returns SkillMeatRef objects with bundle_ref, skillbom_ref, candidate_status.
- All writes go to candidates_export_path, never to source bundle files.
"""

from __future__ import annotations

import logging
import os
import tempfile
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

try:
    import yaml as _yaml  # type: ignore[import-untyped]
    _YAML_AVAILABLE = True
except ImportError:
    _YAML_AVAILABLE = False


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------


class SkillMeatRef:
    """Reference metadata for a SkillMeat bundle or template."""

    __slots__ = (
        "bundle_ref",
        "skillbom_ref",
        "golden_context_pack_candidate",
        "candidate_rationale",
        "template_slug",
        "version",
        "metadata",
    )

    def __init__(
        self,
        *,
        bundle_ref: str,
        skillbom_ref: str | None = None,
        golden_context_pack_candidate: bool = False,
        candidate_rationale: str | None = None,
        template_slug: str | None = None,
        version: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.bundle_ref = bundle_ref
        self.skillbom_ref = skillbom_ref
        self.golden_context_pack_candidate = golden_context_pack_candidate
        self.candidate_rationale = candidate_rationale
        self.template_slug = template_slug
        self.version = version
        self.metadata = metadata or {}

    def to_dict(self) -> dict[str, Any]:
        return {
            "bundle_ref": self.bundle_ref,
            "skillbom_ref": self.skillbom_ref,
            "golden_context_pack_candidate": self.golden_context_pack_candidate,
            "candidate_rationale": self.candidate_rationale,
            "template_slug": self.template_slug,
            "version": self.version,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "SkillMeatRef":
        return cls(
            bundle_ref=data.get("bundle_ref", data.get("id", "")),
            skillbom_ref=data.get("skillbom_ref"),
            golden_context_pack_candidate=bool(
                data.get("golden_context_pack_candidate", False)
            ),
            candidate_rationale=data.get("candidate_rationale"),
            template_slug=data.get("slug") or data.get("template_slug"),
            version=data.get("version"),
            metadata=data.get("metadata", {}),
        )


class CandidateManifest:
    """Golden Context Pack candidate manifest (for export)."""

    __slots__ = (
        "id",
        "title",
        "source_pack_id",
        "asset_ids",
        "coverage_score",
        "created_at",
        "rationale",
    )

    def __init__(
        self,
        *,
        candidate_id: str,
        title: str,
        source_pack_id: str,
        asset_ids: list[str],
        coverage_score: float = 0.0,
        rationale: str = "",
    ) -> None:
        self.id = candidate_id
        self.title = title
        self.source_pack_id = source_pack_id
        self.asset_ids = asset_ids
        self.coverage_score = coverage_score
        self.created_at = datetime.now(tz=timezone.utc).isoformat()
        self.rationale = rationale

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": "golden_context_pack_candidate",
            "id": self.id,
            "title": self.title,
            "source_pack_id": self.source_pack_id,
            "asset_ids": self.asset_ids,
            "coverage_score": self.coverage_score,
            "created_at": self.created_at,
            "rationale": self.rationale,
        }


# ---------------------------------------------------------------------------
# Bundle loader
# ---------------------------------------------------------------------------


def _read_yaml_frontmatter(path: Path) -> dict[str, Any]:
    """Read YAML frontmatter from a markdown or YAML file.

    For .yaml/.yml files, reads the full file.
    For .md files, reads only the frontmatter block between '---' delimiters.
    Returns empty dict on any error.
    """
    if not path.exists():
        return {}
    try:
        content = path.read_text(encoding="utf-8")
        if path.suffix in (".yaml", ".yml"):
            if _YAML_AVAILABLE:
                data = _yaml.safe_load(content)
                return data if isinstance(data, dict) else {}
            return {}
        # Markdown frontmatter
        if not content.startswith("---"):
            return {}
        parts = content.split("---", 2)
        if len(parts) < 3:
            return {}
        fm_block = parts[1].strip()
        if _YAML_AVAILABLE:
            data = _yaml.safe_load(fm_block)
            return data if isinstance(data, dict) else {}
        return {}
    except Exception as exc:  # noqa: BLE001
        logger.debug("Could not read YAML frontmatter from %s: %s", path, exc)
        return {}


def _load_bundle_refs(bundle_path: Path) -> list[SkillMeatRef]:
    """Scan bundle_path for YAML files and extract SkillMeatRef metadata."""
    refs: list[SkillMeatRef] = []
    if not bundle_path.exists():
        return refs
    patterns = ["*.yaml", "*.yml", "*.md"]
    seen: set[str] = set()
    for pattern in patterns:
        for file_path in bundle_path.glob(pattern):
            if str(file_path) in seen:
                continue
            seen.add(str(file_path))
            data = _read_yaml_frontmatter(file_path)
            if not data:
                continue
            # Only include files that look like bundle/template refs
            if not any(k in data for k in ("bundle_ref", "id", "slug", "template_slug")):
                continue
            refs.append(SkillMeatRef.from_dict(data))
    return refs


# ---------------------------------------------------------------------------
# SkillMeat client
# ---------------------------------------------------------------------------


class SkillMeatClient:
    """Local-first SkillMeat reference adapter.

    Reads bundle metadata from local bundle_path and exports candidate manifests.
    No live API calls in MVP.
    """

    def __init__(
        self,
        *,
        bundle_path: Path | None = None,
        candidates_export_path: Path | None = None,
    ) -> None:
        self._bundle_path = bundle_path
        self._candidates_export_path = candidates_export_path
        self._refs_cache: list[SkillMeatRef] | None = None

    # ------------------------------------------------------------------
    # Bundle ref lookup
    # ------------------------------------------------------------------

    def _all_refs(self) -> list[SkillMeatRef]:
        if self._refs_cache is not None:
            return self._refs_cache
        if self._bundle_path:
            self._refs_cache = _load_bundle_refs(self._bundle_path)
        else:
            self._refs_cache = []
        return self._refs_cache

    def get_ref(self, bundle_ref: str) -> SkillMeatRef | None:
        """Look up a SkillMeat ref by bundle_ref or template_slug."""
        for ref in self._all_refs():
            if ref.bundle_ref == bundle_ref or ref.template_slug == bundle_ref:
                return ref
        return None

    def list_refs(self) -> list[SkillMeatRef]:
        """Return all available SkillMeat bundle refs."""
        return self._all_refs()

    def list_golden_candidates(self) -> list[SkillMeatRef]:
        """Return refs flagged as Golden Context Pack candidates."""
        return [r for r in self._all_refs() if r.golden_context_pack_candidate]

    # ------------------------------------------------------------------
    # Candidate manifest export
    # ------------------------------------------------------------------

    def export_candidate_manifest(
        self,
        *,
        title: str,
        source_pack_id: str,
        asset_ids: list[str],
        coverage_score: float = 0.0,
        rationale: str = "",
        candidate_id: str | None = None,
        confirm: bool = False,
    ) -> dict[str, Any]:
        """Export a Golden Context Pack candidate manifest YAML.

        Args:
            title: Human-readable title for the candidate.
            source_pack_id: ID of the source context pack.
            asset_ids: Asset IDs included in the candidate (no inline content).
            coverage_score: Coverage score for the candidate (0.0-1.0).
            rationale: Human-readable rationale string.
            candidate_id: Optional ID; auto-generated if not provided.
            confirm: If True, overwrite existing file.

        Returns:
            dict with path (str), written (bool).
        """
        if self._candidates_export_path is None:
            return {
                "path": None,
                "written": False,
                "error": "candidates_export_path not configured",
            }

        cid = candidate_id or f"cand_{uuid.uuid4().hex[:16]}"
        manifest = CandidateManifest(
            candidate_id=cid,
            title=title,
            source_pack_id=source_pack_id,
            asset_ids=asset_ids,
            coverage_score=coverage_score,
            rationale=rationale,
        )

        dest = self._candidates_export_path / f"{cid}.yaml"
        if dest.exists() and not confirm:
            return {"path": str(dest), "written": False, "skipped": True}

        dest.parent.mkdir(parents=True, exist_ok=True)
        data = manifest.to_dict()

        if _YAML_AVAILABLE:
            content = f"---\n{_yaml.dump(data, allow_unicode=True, sort_keys=False)}---\n"
        else:
            import json
            content = json.dumps(data, indent=2, default=str) + "\n"

        fd, tmp = tempfile.mkstemp(prefix=cid + "_", suffix=".tmp", dir=dest.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as fh:
                fh.write(content)
            os.replace(tmp, str(dest))
        except Exception:
            try:
                os.unlink(tmp)
            except OSError:
                pass
            raise

        return {"path": str(dest), "written": True, "candidate_id": cid}

    def enrich_template_metadata(
        self, template_dict: dict[str, Any]
    ) -> dict[str, Any]:
        """Add SkillMeat ref fields to a template metadata dict.

        Looks up the template slug in bundle refs and adds:
        - skillmeat_bundle_ref
        - skillmeat_skillbom_ref
        - skillmeat_golden_context_pack_candidate

        Does not modify the template if no matching ref is found.
        Returns the (potentially enriched) dict.
        """
        slug = template_dict.get("slug") or template_dict.get("id", "")
        ref = self.get_ref(slug)
        if ref is None:
            return template_dict
        enriched = dict(template_dict)
        enriched["skillmeat_bundle_ref"] = ref.bundle_ref
        enriched["skillmeat_skillbom_ref"] = ref.skillbom_ref
        enriched["skillmeat_golden_context_pack_candidate"] = ref.golden_context_pack_candidate
        return enriched

    def enrich_context_pack_metadata(
        self, pack_dict: dict[str, Any]
    ) -> dict[str, Any]:
        """Add SkillMeat ref fields to a context pack metadata dict.

        Checks if the pack's title or ID matches a golden candidate ref.
        Returns the (potentially enriched) dict.
        """
        pack_id = pack_dict.get("id", "")
        # Check if this pack is flagged as a candidate in any bundle ref
        for ref in self.list_golden_candidates():
            if ref.bundle_ref == pack_id or ref.template_slug == pack_id:
                enriched = dict(pack_dict)
                enriched["skillmeat_bundle_ref"] = ref.bundle_ref
                enriched["skillmeat_golden_context_pack_candidate"] = True
                return enriched
        return pack_dict
