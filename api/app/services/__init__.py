"""Artifact Atlas service layer.

Services hold all business rules. Routes (Stage 4) are thin wrappers that call
these services. Repositories handle persistence; services orchestrate.

Available services:
- audit.AuditService        (SVC-006): append-only event log
- policy.PolicyService      (SVC-005): access control evaluation
- projects.ProjectService   (SVC-001): project CRUD + dashboard counts
- assets.AssetService       (SVC-002): asset lifecycle + links
- import_index.ImportService(SVC-003): local/url/manual import + dedup
- previews.PreviewService   (SVC-004): thumbnails + preview text
- coverage.calculate_coverage          : BOM coverage computation
"""
