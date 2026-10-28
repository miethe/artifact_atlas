"""Asset-scoped immutable revision reads, raw-byte export, and append-only restore."""
from fastapi import APIRouter
from fastapi.responses import Response

from app.api._deps import conflict, get_asset_service, not_found
from app.api.preview import _check_preview_access, _content_disposition_header
from app.models.asset import Asset
from app.models.revision import ContentRevision
from app.services.import_index import ImportService
from app.services.revisions import RevisionService
from app.settings import get_settings

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("/{assetId}/revisions", response_model=list[ContentRevision])
def list_revisions(assetId: str):
    if get_asset_service().get_asset(assetId) is None:
        return not_found("Asset not found")
    return RevisionService(get_settings().registry_dir).revisions.list(assetId)


@router.get("/{assetId}/revisions/{revisionId}", response_model=ContentRevision)
def get_revision(assetId: str, revisionId: str):
    """revisionId accepts an exact revision ID or SHA256, scoped to this asset."""
    if get_asset_service().get_asset(assetId) is None:
        return not_found("Asset not found")
    revision = RevisionService(get_settings().registry_dir).revisions.get(assetId, revisionId)
    return revision if revision is not None else not_found("Revision not found")


def _read_revision(assetId: str, revisionId: str):
    asset = get_asset_service().get_asset(assetId)
    if asset is None:
        return not_found("Asset not found")
    service = RevisionService(get_settings().registry_dir)
    revision = service.revisions.get(assetId, revisionId)
    if revision is None:
        return not_found("Revision not found")
    denied = _check_preview_access(asset)
    if denied is not None:
        return denied
    try:
        return revision, service.read(revision)
    except FileNotFoundError:
        return not_found("Revision bytes unavailable")
    except ValueError as exc:
        return conflict(str(exc))


@router.get("/{assetId}/revisions/{revisionId}/content", response_class=Response)
@router.get("/{assetId}/revisions/{revisionId}/export", response_class=Response)
def export_revision(assetId: str, revisionId: str):
    """Export exact bytes, never a preview transform or current-content fallback."""
    result = _read_revision(assetId, revisionId)
    if isinstance(result, Response):
        return result
    revision, content = result
    return Response(content, media_type="application/octet-stream", headers={
        "ETag": f'"{revision.sha256}"',
        "X-Content-SHA256": revision.sha256,
        "X-Revision-ID": revision.id,
        "Content-Disposition": _content_disposition_header(revision.filename),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
    })


@router.post("/{assetId}/revisions/{revisionId}/restore", response_model=Asset)
def restore_revision(assetId: str, revisionId: str):
    """Restore exact historical bytes as a NEW latest revision; retain all history."""
    result = _read_revision(assetId, revisionId)
    if isinstance(result, Response):
        return result
    revision, content = result
    try:
        restored = ImportService(get_settings().registry_dir).attach_content(
            assetId, revision.filename, content, mime_type=revision.mime_type,
            actor_id="revision_restore",
        )
    except FileNotFoundError:
        return not_found("Current content unavailable")
    except ValueError as exc:
        return conflict(str(exc))
    return restored if restored is not None else not_found("Asset not found")
